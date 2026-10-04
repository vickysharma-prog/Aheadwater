// A three-minute tour for judges: what to click, what to run, and what is live right now.
import Link from "next/link";

import backtest from "@/data/backtest.json";
import model from "@/data/bacteria.json";
import metrics from "@/data/metrics.json";
import validation from "@/data/validation.json";
import { CopyLine } from "@/components/CopyLine";
import { CountUp, Reveal } from "@/components/landing/Reveal";

export const metadata = { title: "Judges · Aheadwater" };
export const revalidate = 300;

const SITE = "https://aheadwater.vercel.app";
const SANDBOX = "https://sandbox.hl7europe.eu/oneaquahealth/fhir";
const event = backtest.days.find((d) => d.date === backtest.event_day)!;
const cv = metrics.grouped_cv;

async function up(url: string) {
  try {
    const res = await fetch(url, { next: { revalidate: 300 }, signal: AbortSignal.timeout(6000) });
    return res.ok;
  } catch {
    return false;
  }
}

type Step = { title: string; text: string; href?: string; cta?: string; cmd?: string; external?: boolean };

const STEPS: Step[] = [
  {
    title: "Watch it see the danger coming",
    text: `It is the morning of 17 May 2021 in Ghent. The lake looks perfect, but Aheadwater already rates Blaarmeersen at ${(event.risk / backtest.usual).toFixed(1)} times its usual risk, a day before any lab could say so. Deliver the citizen report, and with two sources agreeing, open the case.`,
    href: "/console",
    cta: "Open the officer console",
  },
  {
    title: "See one click reach everyone at once",
    text: "Put the console, the responder view and the public page side by side. Press Acknowledge and send a team: all three update together, with no reload. The water team, public health, vets and the public share one live picture.",
    href: "/responder",
    cta: "Open the responder view",
  },
  {
    title: "Report it the way a citizen would",
    text: "On the public page, write what you see and add a photo of the water. Your own browser checks light and focus and looks for open water, so every report that arrives is one the city can use. The photo never leaves your device for that check.",
    href: "/public",
    cta: "Open the public page",
  },
  {
    title: "Feel the clock make sure help arrives",
    text: "Reset, open a case and leave it alone. Move the clock forward in the bar at the top: the supervisor hears at 30 minutes, and at two hours nearby verified responders can claim it. Claim it on the responder view, attach the lab result, close it, and watch the all-clear go up for everyone.",
    href: "/console",
    cta: "Run the clock",
  },
  {
    title: "Take the same workflow to Bengaluru",
    text: "Pick Bengaluru in the clock bar. It is 16 August 2017, after the heaviest August rain in 127 years, and foam from Varthur Lake is on the road. A citizen report and the Central Pollution Control Board's monitoring open the case, and the same code carries it to the close. One product, any city.",
    href: "/console",
    cta: "Open the console",
  },
  {
    title: "Read the case as FHIR, straight from your terminal",
    text: `Every step of the case is an HL7 FHIR R4 resource on the OneAquaHealth guide, ready for any hospital, lab or city system. The official HL7 validator reports ${validation.errors} errors across ${validation.bundles.length} full incident bundles. No key needed.`,
    cmd: `curl ${SITE}/fhir/DetectedIssue/inc-gnt03-20210517`,
    href: "/fhir-explorer",
    cta: "Browse every resource",
  },
  {
    title: "Pull the whole story in one Bundle",
    text: "The lake, the risk score, the reports, the lab results, everyone who was told, the team and every message, as one transaction Bundle.",
    cmd: `curl ${SITE}/fhir/Bundle/ghent-incident`,
  },
  {
    title: "Get today's live forecast",
    text: "Not only a replay: today's weather runs through the same model for the Ghent sites, and the hazard rules watch for algae, low oxygen and sewer overflow in both cities right now.",
    cmd: `curl "${SITE}/api/hazards?city=bengaluru"`,
    href: "/console",
    cta: "See it on the console",
  },
  {
    title: "See water, animals and people in one picture",
    text: "The health page shows who lives near the water, and runs the same cohort query live against real Oslo data in the OneAquaHealth sandbox. This is One Health working end to end.",
    href: "/health",
    cta: "Open the health page",
  },
  {
    title: "Check the numbers behind the forecast",
    text: `On lakes and rivers it never saw in training, 1 alert in ${Math.round(1 / cv.precision_at_alert)} is a real exceedance, against 1 in ${Math.round(1 / cv.base_rate)} by chance (ROC-AUC ${cv.roc_auc.toFixed(2)}), and it holds up on a later year. The full walkthrough explains every step.`,
    href: "/how-it-works",
    cta: "Read how it works",
  },
  {
    title: "Read the code",
    text: "Python for the model, Next.js for the app, 30 web tests and 4 Python tests, and the HL7 validator report. Every number on this site is computed by a script in the repo.",
    href: "https://github.com/vickysharma-prog/Aheadwater",
    cta: "Open GitHub",
    external: true,
  },
];

export default async function Page() {
  const [forecast, sandbox] = await Promise.all([
    up("https://api.open-meteo.com/v1/forecast?latitude=51.04&longitude=3.69&daily=precipitation_sum&forecast_days=1"),
    up(`${SANDBOX}/metadata`),
  ]);
  const live = [
    { on: true, name: "Bacteria model", detail: `${model.tree_info.length} trees, scored in this app` },
    { on: true, name: "FHIR R4 endpoint", detail: `${validation.errors} validator errors` },
    { on: forecast, name: "Open-Meteo forecast", detail: "today's weather for the live risk" },
    { on: sandbox, name: "OneAquaHealth sandbox", detail: "real Oslo cohorts, read only" },
  ];

  const proof = [
    { to: metrics.rows, label: "water samples it learned from" },
    { to: Math.round(cv.precision_at_alert / cv.base_rate), suffix: "x", label: "more often right than chance" },
    { to: 1, label: "day ahead of the lab, on a real day" },
    { to: validation.errors, label: "errors on the official HL7 validator" },
  ];

  return (
    <div className="bg-gradient-to-b from-slate-50 via-cyan-50/50 to-slate-50">
      <section className="mx-auto max-w-5xl px-4 pb-8 pt-16">
        <p className="rise text-sm font-semibold uppercase tracking-widest text-water">No login, no key, all live</p>
        <h1 className="rise mt-3 text-4xl font-semibold tracking-tight sm:text-6xl" style={{ animationDelay: "0.1s" }}>
          Judges: three minutes
        </h1>
        <p className="rise mt-4 text-2xl font-medium text-water sm:text-3xl" style={{ animationDelay: "0.15s" }}>
          See a city stay a day ahead of its water.
        </p>
        <p className="rise mt-6 max-w-3xl text-lg text-slate-600" style={{ animationDelay: "0.2s" }}>
          Aheadwater warns a city before its lakes and rivers turn unsafe, and runs the response until the water is safe again. Trained on{" "}
          {metrics.rows.toLocaleString("en-GB")} samples from {metrics.sites.toLocaleString("en-GB")} European lakes and rivers, replaying two real days, and
          stored as HL7 FHIR on the OneAquaHealth guide. Here is everything you can try.
        </p>
        <div className="rise mt-6 flex flex-wrap gap-3" style={{ animationDelay: "0.3s" }}>
          <a
            href="https://youtu.be/v87ago6cD8k"
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-2 rounded-full bg-water px-5 py-2.5 font-semibold text-white transition-transform hover:scale-105"
          >
            <span aria-hidden="true">▶</span> Watch the 5-minute demo
          </a>
          <Link href="/console" className="rounded-full border border-slate-300 px-5 py-2.5 font-semibold transition-colors hover:border-water hover:text-water">
            Jump straight in
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-4">
        <div className="grid gap-4 rounded-3xl bg-white p-6 shadow-xl shadow-cyan-950/5 sm:grid-cols-2 lg:grid-cols-4">
          {proof.map((p, i) => (
            <Reveal key={p.label} delay={i * 100} className="text-center">
              <div className="text-4xl font-semibold text-water">
                <CountUp to={p.to} suffix={p.suffix} />
              </div>
              <div className="mt-1 text-sm text-slate-600">{p.label}</div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-8">
        <ol className="space-y-4">
          {STEPS.map((s, i) => (
            <Reveal key={s.title}>
              <li className="flex gap-5 rounded-2xl bg-white p-6 shadow-lg shadow-cyan-950/5 transition-shadow hover:shadow-xl">
                <span className="text-3xl font-semibold text-water" aria-hidden="true">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-semibold">
                    <span className="sr-only">Step {i + 1}: </span>
                    {s.title}
                  </h2>
                  <p className="mt-2 text-slate-600">{s.text}</p>
                  {s.cmd && <CopyLine text={s.cmd} />}
                  {s.href &&
                    (s.external ? (
                      <a href={s.href} target="_blank" rel="noopener" className="mt-3 inline-flex items-center gap-1 font-semibold text-water hover:underline">
                        {s.cta} <span aria-hidden="true">&rarr;</span>
                      </a>
                    ) : (
                      <Link href={s.href} className="mt-3 inline-flex items-center gap-1 font-semibold text-water hover:underline">
                        {s.cta} <span aria-hidden="true">&rarr;</span>
                      </Link>
                    ))}
                </div>
              </li>
            </Reveal>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-20 pt-8">
        <Reveal className="rounded-3xl bg-slate-900 p-8 text-white shadow-2xl">
          <h2 className="text-2xl font-semibold">What is live right now</h2>
          <p className="mt-2 text-slate-300">Checked by the server when this page loads, every few minutes. We only show what is on.</p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {live.map((l) => (
              <li key={l.name} className="flex items-start gap-3 rounded-xl bg-white/5 p-4">
                <span className={`mt-0.5 rounded px-2 py-0.5 text-xs font-bold ${l.on ? "bg-emerald-400 text-emerald-950" : "bg-amber-300 text-amber-950"}`}>
                  {l.on ? "LIVE" : "RETRYING"}
                </span>
                <span>
                  <span className="block font-medium">{l.name}</span>
                  <span className="block text-sm text-slate-400">{l.detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </Reveal>
      </section>
    </div>
  );
}
