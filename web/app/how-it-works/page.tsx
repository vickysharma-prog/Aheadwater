// The whole product explained in plain words, with the numbers read from the same files the app runs on.
import Link from "next/link";

import backtest from "@/data/backtest.json";
import metrics from "@/data/metrics.json";
import validation from "@/data/validation.json";
import { Reveal } from "@/components/landing/Reveal";
import { RULES } from "@/lib/hazards";
import { LIMITS } from "@/lib/incident";
import { ALERT_LEVEL, WATCH_MULTIPLE } from "@/lib/risk";

export const metadata = { title: "How it works · Aheadwater" };

const event = backtest.days.find((d) => d.date === backtest.event_day)!;
const cv = metrics.grouped_cv;
const later = metrics.train_2020_2023_test_2024;
const n = (x: number) => x.toLocaleString("en-GB");
const hours = (min: number) => (min < 60 ? `${min} minutes` : `${min / 60} hours`);

function Heading({ kicker, title, text }: { kicker: string; title: string; text?: string }) {
  return (
    <Reveal className="mb-8 max-w-2xl">
      <div className="text-sm font-semibold uppercase tracking-widest text-water">{kicker}</div>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
      {text && <p className="mt-4 text-lg text-slate-600">{text}</p>}
    </Reveal>
  );
}

const STEPS = [
  {
    title: "Predict",
    what: "Every morning, each lake and river gets a risk score for the day ahead.",
    how: `A LightGBM model trained on ${n(metrics.rows)} bathing-water samples from ${n(metrics.sites)} lakes and rivers in 27 European countries. It reads rain and temperature from the days before, plus the site's own record. A site goes to Watch at ${WATCH_MULTIPLE} times its usual risk and to Alert at a ${ALERT_LEVEL * 100}% chance of failing the bathing limit.`,
  },
  {
    title: "Detect",
    what: "Every signal lands in one officer console.",
    how: "The forecast, lab results, weather rules for algae, low oxygen and sewer overflow, and reports from people at the water. A reporter's photo is checked on their own device for light, focus and open water before it is sent. The photo never leaves the phone for that check.",
  },
  {
    title: "Verify",
    what: "Two sources must agree before a case opens.",
    how: "Each source adds to a trust score: a lab result over the limit counts most, then the model or official monitoring, then a citizen report and a clear photo. The officer can only open the case once two sources stand behind it.",
  },
  {
    title: "Act",
    what: "The right people hear at once, and a clock makes sure someone acts.",
    how: "The city's water officer owns the case. Public health and local vets are told the moment it opens, with the groups of people living near the water. If the officer is busy, the case moves up to their supervisor, then opens to nearby verified labs, groups and volunteers.",
  },
  {
    title: "Resolve",
    what: "The team closes the case with evidence.",
    how: "A responder claims the case, a clean follow-up sample comes back, and the case closes. The public page shows each step as it happens: warning, team on site, all-clear.",
  },
  {
    title: "Learn",
    what: "Every closed case teaches the next forecast.",
    how: "A closed case with a dated lab sample becomes a new labelled row for the next training run, so each city's forecast gets sharper with use.",
  },
];

const RESOURCES = [
  ["Location", "the lake or river", "OneAquaHealth profile"],
  ["Observation", "risk scores, lab results, citizen reports", "OneAquaHealth profile"],
  ["Group", "people living near the water", "OneAquaHealth profile"],
  ["DetectedIssue", "the case itself", "HL7 FHIR R4"],
  ["Task", "each job on the escalation clock", "HL7 FHIR R4"],
  ["CareTeam", "who is working on it", "HL7 FHIR R4"],
  ["Communication", "every alert and the public advisory", "HL7 FHIR R4"],
];

export default function Page() {
  return (
    <div className="bg-gradient-to-b from-slate-50 via-cyan-50/50 to-slate-50">
      <section className="mx-auto max-w-4xl px-4 pb-10 pt-16 text-center">
        <p className="rise text-sm font-semibold uppercase tracking-widest text-water">How it works</p>
        <h1 className="rise mt-3 text-4xl font-semibold tracking-tight sm:text-6xl" style={{ animationDelay: "0.1s" }}>
          From a forecast to the all-clear
        </h1>
        <p className="rise mx-auto mt-6 max-w-2xl text-lg text-slate-600" style={{ animationDelay: "0.2s" }}>
          Aheadwater watches a city&apos;s lakes and rivers, warns the right people before the water turns unsafe, and follows each case until it is safe
          again. Here is every step, and what sits underneath it.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <Heading kicker="Six steps" title="One shared case, from first signal to close" />
        <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.title} delay={i * 80} className="h-full">
              <li className="h-full rounded-2xl bg-white p-6 shadow-lg shadow-cyan-950/5">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-water font-semibold text-white">{i + 1}</span>
                  <h3 className="text-xl font-semibold">{s.title}</h3>
                </div>
                <p className="mt-4 font-medium">{s.what}</p>
                <p className="mt-2 text-slate-600">{s.how}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <Heading
          kicker="The escalation clock"
          title="Every case gets picked up"
          text="The clock starts when a case opens. Public health and local vets hear at that moment, whatever happens next."
        />
        <Reveal className="overflow-x-auto rounded-2xl bg-white shadow-lg shadow-cyan-950/5">
          <table className="w-full text-left">
            <caption className="sr-only">Time limits on the escalation clock</caption>
            <thead className="text-sm text-slate-500">
              <tr>
                <th scope="col" className="px-6 py-3 font-medium">Severity</th>
                <th scope="col" className="px-6 py-3 font-medium">Officer has not acknowledged</th>
                <th scope="col" className="px-6 py-3 font-medium">Nobody has acted</th>
              </tr>
            </thead>
            <tbody>
              {(["high", "medium"] as const).map((s) => (
                <tr key={s} className="border-t border-slate-100">
                  <th scope="row" className="px-6 py-4 font-semibold capitalize">{s}</th>
                  <td className="px-6 py-4">After {hours(LIMITS[s].ackMin)}, the supervisor is told</td>
                  <td className="px-6 py-4">After {hours(LIMITS[s].actionMin)}, verified responders nearby can claim it</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <Heading kicker="The forecast" title="Earned on places it has never seen" />
            <Reveal>
              <p className="text-lg text-slate-600">
                Every feature uses only data from before the sample day, and testing is grouped by site, so each score is earned on lakes and rivers the
                model never saw in training.
              </p>
              <ul className="mt-6 space-y-3 text-lg">
                <li>
                  <strong>1 alert in {Math.round(1 / cv.precision_at_alert)}</strong> is a real exceedance, against 1 in {Math.round(1 / cv.base_rate)} for a random
                  pick.
                </li>
                <li>
                  <strong>ROC-AUC {cv.roc_auc.toFixed(2)}</strong> across Europe, and {later.roc_auc.toFixed(2)} when trained on 2020 to 2023 and tested on 2024.
                </li>
                <li>
                  <strong>{(event.risk / backtest.usual).toFixed(1)} times the usual risk</strong> at Blaarmeersen, Ghent, on the morning of 17 May 2021. The lab
                  sample that day came back over the limit. The model had never seen a Ghent sample.
                </li>
              </ul>
              <p className="mt-6 text-slate-600">
                The trained trees are exported to JSON and scored inside this web app. A test checks that the app&apos;s scores match Python&apos;s.
              </p>
            </Reveal>
          </div>
          <div>
            <Heading kicker="Weather rules" title="Other hazards, in any city from day one" />
            <Reveal>
              <ul className="space-y-4 text-lg">
                <li className="rounded-2xl bg-white p-5 shadow-lg shadow-cyan-950/5">
                  <strong>Algae bloom.</strong> Calm wind (under {RULES.algae.calmWind} km/h) and a week averaging {RULES.algae.warmWatch} °C or more.
                </li>
                <li className="rounded-2xl bg-white p-5 shadow-lg shadow-cyan-950/5">
                  <strong>Low oxygen.</strong> {RULES.oxygen.hotDays} days at {RULES.oxygen.hot} °C or more, or heavy rain after {RULES.oxygen.dryDays} dry days.
                </li>
                <li className="rounded-2xl bg-white p-5 shadow-lg shadow-cyan-950/5">
                  <strong>Sewer overflow.</strong> {RULES.flood.watch} mm of rain in a day, {RULES.flood.alert} mm for an alert.
                </li>
              </ul>
              <p className="mt-6 text-slate-600">Each city tunes these limits to its own water.</p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <Heading
          kicker="Built on HL7 FHIR"
          title="Health systems can read every case"
          text={`Each step is stored as a FHIR R4 resource on the OneAquaHealth implementation guide. The official HL7 validator reports ${validation.errors} errors across ${validation.bundles.length} full incident bundles.`}
        />
        <Reveal className="overflow-x-auto rounded-2xl bg-white shadow-lg shadow-cyan-950/5">
          <table className="w-full text-left">
            <caption className="sr-only">FHIR resources Aheadwater writes</caption>
            <thead className="text-sm text-slate-500">
              <tr>
                <th scope="col" className="px-6 py-3 font-medium">Resource</th>
                <th scope="col" className="px-6 py-3 font-medium">Holds</th>
                <th scope="col" className="px-6 py-3 font-medium">Profile</th>
              </tr>
            </thead>
            <tbody>
              {RESOURCES.map(([r, holds, profile]) => (
                <tr key={r} className="border-t border-slate-100">
                  <th scope="row" className="px-6 py-3 font-mono text-sm font-semibold text-water">{r}</th>
                  <td className="px-6 py-3">{holds}</td>
                  <td className="px-6 py-3 text-slate-600">{profile}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>
        <Reveal className="mt-6 flex flex-wrap gap-3">
          <Link href="/fhir-explorer" className="rounded-full bg-water px-5 py-2.5 font-medium text-white transition-transform hover:scale-105">
            Explore the records
          </Link>
          <Link href="/fhir/metadata" prefetch={false} className="rounded-full border border-slate-300 px-5 py-2.5 font-medium transition-colors hover:border-water hover:text-water">
            Open the FHIR endpoint
          </Link>
        </Reveal>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <Heading kicker="Two real days" title="What the demo replays" />
        <div className="grid gap-4 md:grid-cols-2">
          <Reveal className="rounded-2xl bg-white p-6 shadow-lg shadow-cyan-950/5">
            <h3 className="text-xl font-semibold">Ghent, 17 May 2021</h3>
            <p className="mt-3 text-slate-600">
              After a wet weekend, the forecast flags Blaarmeersen lake. A citizen report agrees, the case opens, and the lab result confirms it. The whole
              case runs to the all-clear.
            </p>
          </Reveal>
          <Reveal delay={100} className="rounded-2xl bg-white p-6 shadow-lg shadow-cyan-950/5">
            <h3 className="text-xl font-semibold">Bengaluru, 16 August 2017</h3>
            <p className="mt-3 text-slate-600">
              After record rain, foam from Varthur Lake spills onto the road. A citizen report and the Central Pollution Control Board&apos;s monitoring open
              the case on the same workflow. Bengaluru runs on reports and lab results, and its first dated sample becomes its first training row.
            </p>
          </Reveal>
        </div>
        <Reveal className="mt-6 rounded-2xl border border-slate-200 bg-white/60 p-6 text-slate-600">
          <strong className="text-slate-900">Real:</strong> every bacteria sample, the weather, each risk score, the Ghent lab results, the Bengaluru monitoring
          figures and the Oslo health cohorts. <strong className="text-slate-900">Written for the demo:</strong> the citizen reports, the responders and the
          Ghent cohorts. These carry the HL7 test-data tag in every record.
        </Reveal>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-20 pt-10 text-center">
        <Reveal>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">See it for yourself</h2>
          <p className="mt-4 text-lg text-slate-600">Open the console, the responder view and the public page side by side. They share one live case.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/console" className="rounded-full bg-water px-6 py-3 font-semibold text-white transition-transform hover:scale-105">
              Start the replay
            </Link>
            <Link href="/public" className="rounded-full border border-slate-300 px-6 py-3 font-semibold transition-colors hover:border-water hover:text-water">
              Is my water safe today?
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
