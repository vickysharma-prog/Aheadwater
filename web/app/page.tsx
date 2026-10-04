import Link from "next/link";

import backtest from "@/data/backtest.json";
import metrics from "@/data/metrics.json";
import validation from "@/data/validation.json";
import { RiskChart } from "@/components/RiskChart";
import { Cities } from "@/components/landing/Cities";
import { Hero } from "@/components/landing/Hero";
import { OneHealth } from "@/components/landing/OneHealth";
import { CountUp, Reveal } from "@/components/landing/Reveal";
import { SmoothScroll } from "@/components/landing/SmoothScroll";
import { Steps } from "@/components/landing/Steps";

const event = backtest.days.find((d) => d.date === backtest.event_day)!;

function Heading({ kicker, title, text }: { kicker: string; title: string; text?: string }) {
  return (
    <Reveal className="mx-auto mb-8 max-w-2xl text-center">
      <div className="text-sm font-semibold uppercase tracking-widest text-water">{kicker}</div>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">{title}</h2>
      {text && <p className="mt-4 text-lg text-slate-600">{text}</p>}
    </Reveal>
  );
}

export default function Home() {
  const cv = metrics.grouped_cv;
  const stats = [
    { to: metrics.rows, label: "water samples it learned from" },
    { to: metrics.sites, label: "lakes and rivers in 27 countries" },
    { to: Math.round(cv.precision_at_alert / cv.base_rate), suffix: "x", label: "more often right than a random pick" },
    { to: validation.errors, label: "errors on the official HL7 FHIR validator" },
  ];

  return (
    <SmoothScroll>
      <div className="bg-gradient-to-b from-slate-50 via-cyan-50/50 to-slate-50">
      <Hero />

      <section className="relative z-10 -mt-12 px-4">
        <div className="mx-auto grid max-w-6xl gap-4 rounded-3xl bg-white p-6 shadow-2xl shadow-cyan-950/10 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 100} className="rounded-2xl p-4 text-center">
              <div className="text-4xl font-semibold text-water">
                <CountUp to={s.to} suffix={s.suffix} />
              </div>
              <div className="mt-1 text-sm text-slate-600">{s.label}</div>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-12 pt-20">
        <Heading kicker="How it works" title="From forecast to all-clear" text="Six steps, one shared picture. Tap any step to see it." />
        <Reveal>
          <Steps />
        </Reveal>
        <Reveal className="mt-8 text-center">
          <Link href="/how-it-works" className="font-semibold text-water hover:underline">
            Read the full walkthrough <span aria-hidden="true">&rarr;</span>
          </Link>
        </Reveal>
      </section>

      <section className="py-12">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 lg:grid-cols-2">
          <Reveal>
            <div className="text-sm font-semibold uppercase tracking-widest text-water">Tested on a real day</div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">It saw Blaarmeersen coming.</h2>
            <p className="mt-5 text-lg text-slate-600">
              On the morning of 17 May 2021, after a wet weekend in Ghent, our model rated Blaarmeersen lake at {(event.risk / backtest.usual).toFixed(1)} times its usual
              risk. The lab sample taken that day confirmed it. The model had never seen a single Ghent sample.
            </p>
            <p className="mt-4 text-lg text-slate-600">That is the head start Aheadwater gives a city: a warning in the morning, while the lab is still at work.</p>
            <Link href="/console" className="mt-8 inline-flex items-center gap-2 font-semibold text-water hover:underline">
              Replay that morning <span aria-hidden="true">&rarr;</span>
            </Link>
          </Reveal>
          <Reveal delay={150} className="rounded-3xl bg-white p-6 shadow-xl shadow-cyan-950/5">
            <h3 className="text-sm font-semibold">Blaarmeersen, Ghent, May 2021</h3>
            <p className="mb-3 text-xs text-slate-500">Daily risk from the model, rain below it, lab samples as dashed lines.</p>
            <RiskChart days={backtest.days} usual={backtest.usual} lab={backtest.lab} eventDay={backtest.event_day} />
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <Heading kicker="One Health" title="Water, animals and people, in one picture" text="When the water needs care, everyone who looks after it hears at the same moment." />
        <Reveal>
          <OneHealth />
        </Reveal>
        <Reveal className="mt-6 text-center">
          <Link href="/health" className="font-semibold text-water hover:underline">
            See the health cohort check <span aria-hidden="true">&rarr;</span>
          </Link>
        </Reveal>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-6xl px-4">
          <Heading kicker="Works where you are" title="Two cities, two real days" text="Pick one and replay the whole case, from the first signal to the close." />
          <Reveal>
            <Cities />
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 pt-12">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <div className="text-sm font-semibold uppercase tracking-widest text-water">Built on open standards</div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Speaks the language of health systems.</h2>
            <p className="mt-5 text-lg text-slate-600">
              Every step is stored as HL7 FHIR, on the OneAquaHealth implementation guide. Hospitals, labs and city systems can read a case directly, and the
              official HL7 validator checks every one.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/fhir-explorer" className="rounded-full bg-water px-5 py-2.5 font-medium text-white transition-transform hover:scale-105">
                Explore the FHIR records
              </Link>
              <Link href="/fhir/metadata" prefetch={false} className="rounded-full border border-slate-300 px-5 py-2.5 font-medium transition-colors hover:border-water hover:text-water">
                Open the FHIR endpoint
              </Link>
            </div>
          </Reveal>
          <Reveal delay={150}>
            <div className="rounded-3xl bg-slate-900 p-6 font-mono text-sm text-slate-200 shadow-2xl">
              <div className="mb-4 flex gap-1.5" aria-hidden="true">
                <span className="h-3 w-3 rounded-full bg-red-400" />
                <span className="h-3 w-3 rounded-full bg-amber-400" />
                <span className="h-3 w-3 rounded-full bg-emerald-400" />
              </div>
              <div className="text-emerald-300">GET /fhir/DetectedIssue/inc-gnt03-20210517</div>
              <pre className="mt-3 whitespace-pre-wrap text-slate-300">{`{
  "resourceType": "DetectedIssue",
  "status": "final",
  "severity": "high",
  "implicated": [{ "reference": "Location/bevl-bw-gnt03" }],
  "evidence": [ risk score, citizen report, lab results ]
}`}</pre>
              <div className="mt-4 rounded-lg bg-emerald-500/15 px-3 py-2 text-emerald-300">
                HL7 validator: {validation.errors} errors across {validation.bundles.length} incident bundles
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      </div>

      <section className="relative overflow-hidden bg-gradient-to-br from-cyan-800 via-cyan-700 to-teal-600 py-24 text-white">
        <svg className="absolute bottom-0 left-0 w-full opacity-15" height="120" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 60 C 240 0 480 120 720 60 S 1200 0 1440 60 V120 H0Z" fill="white" />
        </svg>
        <Reveal className="relative mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-5xl">See a whole case in two minutes.</h2>
          <p className="mt-4 text-lg text-cyan-50">Open the console, the responder view and the public page side by side. They share one live case.</p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href="/console" className="rounded-full bg-white px-7 py-3.5 text-lg font-semibold text-water transition-transform hover:scale-105">
              Start the replay
            </Link>
            <Link href="/public" className="rounded-full border border-white/40 px-7 py-3.5 text-lg font-semibold transition-colors hover:bg-white/10">
              Open the public page
            </Link>
            <a href="https://youtu.be/v87ago6cD8k" target="_blank" rel="noopener" className="rounded-full border border-white/40 px-7 py-3.5 text-lg font-semibold transition-colors hover:bg-white/10">
              Watch the demo video
            </a>
            <Link href="/how-it-works" className="rounded-full border border-white/40 px-7 py-3.5 text-lg font-semibold transition-colors hover:bg-white/10">
              How it works
            </Link>
          </div>
        </Reveal>
      </section>

    </SmoothScroll>
  );
}
