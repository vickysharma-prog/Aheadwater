"use client";
import { time } from "@/lib/format";
import { CITIES, type CityId } from "@/lib/scenario";
import { actions, useDemo } from "@/lib/store";

export function DemoClock() {
  const demo = useDemo();
  const step = (label: string, min: number) => (
    <button
      onClick={() => actions.advance(min)}
      className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium hover:border-water hover:text-water"
    >
      {label}
    </button>
  );
  return (
    <div className="border-b border-slate-200 bg-slate-900 text-slate-100">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-2 text-sm">
        <select
          value={demo.city}
          onChange={(e) => actions.setCity(e.target.value as CityId)}
          aria-label="Demo city"
          className="rounded bg-water px-2 py-0.5 text-xs font-semibold text-white"
        >
          {Object.values(CITIES).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}: {c.kind === "replay" ? "real replay" : "illustrative"}
            </option>
          ))}
        </select>
        <span>
          <span className="font-mono">{time(demo.clock, demo.cfg.tz)}</span> {new Date(demo.clock).getUTCFullYear()}
        </span>
        <span className="hidden text-slate-400 md:inline">
          {demo.cfg.kind === "replay"
            ? "Real risk scores, rain and lab results. The citizen report and responders are written for the demo."
            : "The same workflow on made-up readings. No risk score: the model has no local samples here yet."}
        </span>
        <div className="ml-auto flex gap-1.5 text-slate-900">
          {step("+15 min", 15)}
          {step("+1 h", 60)}
          {step("+1 day", 24 * 60)}
          <button onClick={actions.reset} className="rounded-md px-2.5 py-1 text-xs text-slate-300 hover:text-white">
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
