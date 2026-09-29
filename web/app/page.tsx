import Link from "next/link";

import backtest from "@/data/backtest.json";
import metrics from "@/data/metrics.json";
import validation from "@/data/validation.json";
import { RiskChart } from "@/components/RiskChart";

const STAGES = [
  ["Predict", "A model trained on bathing-water samples from across Europe reads the weather and scores each site for the next day."],
  ["Detect", "High risk, a lab result over the limit, or a citizen's report with a photo opens a case."],
  ["Verify", "Each case gets a trust score from how many sources agree. The officer confirms before anything goes public."],
  ["Mobilise", "The city officer owns it. If nobody acts in time it escalates, then opens to nearby verified responders."],
  ["Resolve", "The responder closes it with evidence. The public page shows each step as it happens."],
  ["Learn", "Every closed case becomes a labelled example for the next training run."],
];

const n = (x: number) => x.toLocaleString("en-GB");

export default function Home() {
  const cv = metrics.grouped_cv;
  const lift = cv.precision_at_alert / cv.base_rate;
  return (
    <div className="mx-auto max-w-6xl space-y-16 px-4 py-10">
      <section className="grid items-center gap-8 lg:grid-cols-2">
        <div className="space-y-5">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Know before the water turns.</h1>
          <p className="text-lg text-slate-600">
            After heavy rain, sewage overflows into city lakes and rivers, and bacteria counts climb. People swim and dogs go in, because the lab result
            arrives days later. Aheadwater warns the city the morning it matters, then runs the response until the water is safe again.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/console" className="rounded-md bg-water px-4 py-2 font-medium text-white hover:bg-cyan-800">
              Run the Ghent replay
            </Link>
            <Link href="/public" className="rounded-md border border-slate-300 bg-white px-4 py-2 font-medium hover:border-water hover:text-water">
              See the public page
            </Link>
          </div>
          <p className="text-sm text-slate-500">Open the console, the responder view and the public page in three tabs. They share one incident.</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold">Blaarmeersen, Ghent, May 2021</h2>
          <p className="mb-2 text-xs text-slate-500">
            Scored by a model that never saw a Ghent sample. On the morning of 17 May risk reached {(backtest.days.find((d) => d.date === backtest.event_day)!.risk * 100).toFixed(1)}%,
            {" "}{(backtest.days.find((d) => d.date === backtest.event_day)!.risk / backtest.usual).toFixed(1)}x the site&apos;s usual level. The lab sample taken that day found
            enterococci at 489 per 100 ml, over the limit of 400.
          </p>
          <RiskChart days={backtest.days} usual={backtest.usual} lab={backtest.lab} eventDay={backtest.event_day} />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          [n(metrics.rows), "bacteria samples it learned from"],
          [n(metrics.sites), "lake and river sites in 27 countries"],
          [`${lift.toFixed(0)}x`, "better than chance: 1 alert in 5 is a real exceedance, against 1 in 50"],
          [cv.roc_auc.toFixed(2), "ROC-AUC on sites it never saw during training"],
        ].map(([big, small]) => (
          <div key={small} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="text-3xl font-semibold text-water">{big}</div>
            <div className="text-sm text-slate-600">{small}</div>
          </div>
        ))}
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-semibold tracking-tight">From warning to all-clear</h2>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {STAGES.map(([title, text], i) => (
            <li key={title} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="mb-1 text-xs font-semibold text-water">{i + 1}</div>
              <div className="font-semibold">{title}</div>
              <p className="text-sm text-slate-600">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="mb-2 text-xl font-semibold">One Health, in one click</h2>
          <p className="text-slate-600">
            When a case opens, the public health team learns which population cohorts live near the water, vets are asked to report sick dogs, and the public
            page tells people to stay out. River, animals and people, linked by the same incident.
          </p>
          <Link href="/health" className="mt-3 inline-block text-sm font-medium text-water underline">
            See the cohort check
          </Link>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="mb-2 text-xl font-semibold">Built on the OneAquaHealth standard</h2>
          <p className="text-slate-600">
            Every step is stored as HL7 FHIR R4, on the OneAquaHealth implementation guide. The full incident passes the official HL7 validator with{" "}
            {validation.errors} errors. Any FHIR system can read it at <code className="text-sm">/fhir</code>.
          </p>
          <Link href="/fhir-explorer" className="mt-3 inline-block text-sm font-medium text-water underline">
            Look at the FHIR resources
          </Link>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600">
        <h2 className="mb-2 text-base font-semibold text-slate-900">What is real in the demo</h2>
        <p>
          Real: every bacteria sample (European Environment Agency), the rain and temperature (E-OBS), each risk score, the Ghent lab results, and the Oslo health
          cohorts (OneAquaHealth sandbox). Written for the demo: the citizen report, the responders, and the Ghent cohorts, which the sandbox does not hold yet.
          The model is tuned for recreational contact during the bathing season, when the samples are taken. The Bengaluru replay (August 2017) runs the same workflow on
          CPCB&apos;s 2017 monitoring, without a risk score.
        </p>
      </section>
    </div>
  );
}
