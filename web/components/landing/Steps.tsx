"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

const STEPS = [
  {
    title: "Predict",
    line: "Reads tomorrow's weather and scores every lake and river.",
    more: "A model trained on 150,734 bathing-water samples from across Europe gives each site a risk score for the next day, so the city can act before anyone gets in the water.",
    icon: "M3 17l5-5 4 3 8-9M15 6h5v5",
  },
  {
    title: "Detect",
    line: "Brings every signal into one place.",
    more: "The model, lab results, weather rules for algae, oxygen and sewer overflow, and reports from people at the water all open cases in the same console. Photos are checked for light, focus and water on the reporter's phone.",
    icon: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-5-5",
  },
  {
    title: "Verify",
    line: "Two sources agree before anything goes public.",
    more: "Each case gets a trust score from the sources behind it. The water officer confirms, and the public sees a warning they can rely on.",
    icon: "M5 12l4 4L19 6",
  },
  {
    title: "Act",
    line: "The right people move together, on a clock.",
    more: "The city's water officer leads. Public health and local vets hear at once. If time runs short, nearby verified labs, NGOs and volunteers can step in and take the case.",
    icon: "M16 11a4 4 0 1 0-8 0M3 20c1-4 5-6 9-6s8 2 9 6",
  },
  {
    title: "Resolve",
    line: "Closed with evidence, shown to everyone.",
    more: "The team closes the case with a clean sample. The public page shows every step, from the first warning to the all-clear.",
    icon: "M12 3l7 4v5c0 4-3 7-7 9-4-2-7-5-7-9V7z",
  },
  {
    title: "Learn",
    line: "Every closed case makes the next forecast sharper.",
    more: "A closed case with a dated lab sample becomes a new labelled example for the next training run, so each city's forecast improves with use.",
    icon: "M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6",
  },
];

export function Steps() {
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (!auto || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setActive((a) => (a + 1) % STEPS.length), 4500);
    return () => clearInterval(t);
  }, [auto]);

  const s = STEPS[active];
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_1.2fr]">
      <ol className="space-y-2">
        {STEPS.map((step, i) => (
          <li key={step.title}>
            <button
              onClick={() => (setActive(i), setAuto(false))}
              className={`group flex w-full items-center gap-4 rounded-xl border px-4 py-3 text-left transition-all duration-300 ${
                i === active ? "border-water bg-white shadow-lg shadow-cyan-900/10" : "border-transparent hover:border-slate-200 hover:bg-white"
              }`}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors duration-300 ${
                  i === active ? "bg-water text-white" : "bg-water-soft text-water group-hover:bg-cyan-100"
                }`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d={step.icon} />
                </svg>
              </span>
              <span>
                <span className="block font-semibold">
                  {i + 1}. {step.title}
                </span>
                <span className="block text-sm text-slate-600">{step.line}</span>
              </span>
              {i === active && auto && (
                <span className="ml-auto h-1 w-10 overflow-hidden rounded bg-slate-100" aria-hidden="true">
                  <span key={active} className="block h-full bg-water" style={{ animation: "grow 4.5s linear forwards" }} />
                </span>
              )}
            </button>
          </li>
        ))}
      </ol>

      <div key={active} className="rise relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-700 to-teal-600 p-8 text-white shadow-xl">
        <svg className="float absolute -right-6 -top-6 opacity-15" width="180" height="180" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.2" aria-hidden="true">
          <path d={s.icon} />
        </svg>
        <div className="text-sm font-semibold uppercase tracking-widest text-cyan-100">Step {active + 1} of 6</div>
        <h3 className="mt-2 text-3xl font-semibold">{s.title}</h3>
        <p className="mt-4 max-w-md text-lg leading-relaxed text-cyan-50">{s.more}</p>
        <Link href="/console" className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 font-medium text-water transition-transform hover:scale-105">
          See it in the console <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>
    </div>
  );
}
