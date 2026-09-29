"use client";
import { useState } from "react";

import { DemoClock } from "@/components/DemoClock";
import { time } from "@/lib/format";
import { incidentState } from "@/lib/incident";
import { SITES } from "@/lib/risk";
import { SITE } from "@/lib/scenario";
import { actions, useDemo } from "@/lib/store";

const STEPS = [
  ["warning", "Warning issued"],
  ["team_on_site", "Team on site"],
  ["resolved", "All clear"],
] as const;

export function PublicPage() {
  const demo = useDemo();
  const now = new Date(demo.clock);
  const inc = demo.incident;
  const state = inc && incidentState(inc.severity, inc.events, now);
  const [text, setText] = useState("");
  const [site, setSite] = useState(SITE.id);

  const stepAt = (step: string) => {
    if (!inc) return undefined;
    const type = step === "warning" ? "opened" : step === "team_on_site" ? ["dispatched", "claimed"] : "resolved";
    return inc.events.find((e) => [type].flat().includes(e.type) && new Date(e.at) <= now)?.at;
  };

  return (
    <>
      <DemoClock />
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Is the water safe today?</h1>
          <p className="text-slate-600">Bathing sites in and around Ghent. Updated by the city&apos;s water team.</p>
        </header>

        <ul className="space-y-3">
          {SITES.map((s) => {
            const active = inc?.site.id === s.id && state;
            const unsafe = active && state.publicStep !== "resolved";
            return (
              <li key={s.id} className={`rounded-lg border bg-white p-4 ${unsafe ? "border-alert" : "border-slate-200"}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="flex-1 font-medium">{s.name}</h2>
                  {unsafe ? (
                    <span className="rounded bg-alert px-2 py-0.5 text-xs font-semibold text-white">Avoid contact</span>
                  ) : (
                    <span className="rounded bg-ok-soft px-2 py-0.5 text-xs font-semibold text-ok">No warning</span>
                  )}
                </div>
                {active && (
                  <>
                    {unsafe && <p className="mt-2 font-medium text-alert">{inc.advisory}</p>}
                    <ol className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      {STEPS.map(([key, label]) => {
                        const at = stepAt(key);
                        return (
                          <li key={key} className={`rounded-md border px-2 py-1.5 ${at ? "border-water bg-water-soft text-water" : "border-slate-200 text-slate-400"}`}>
                            <div className="font-semibold">{label}</div>
                            <div>{at ? time(at) : "not yet"}</div>
                          </li>
                        );
                      })}
                    </ol>
                    {inc.lab.length > 0 && (
                      <p className="mt-2 text-xs text-slate-600">
                        Latest lab result: {inc.lab.at(-1)!.bad ? "above the safe limit" : "within the safe limit"} ({inc.lab.at(-1)!.date}).
                      </p>
                    )}
                  </>
                )}
              </li>
            );
          })}
        </ul>

        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="font-semibold">Report something</h2>
          {demo.reported ? (
            <p className="mt-2 text-sm text-ok">
              Thank you. Your report went to the city&apos;s water officer at {time(demo.clock)}. If it leads to a warning, you will see it above.
            </p>
          ) : (
            <form
              className="mt-3 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                actions.citizenReport(text);
              }}
            >
              <label className="block text-sm">
                <span className="text-slate-600">Where</span>
                <select value={site} onChange={(e) => setSite(e.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5">
                  {SITES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="text-slate-600">What did you see or smell?</span>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={3}
                  placeholder="Cloudy water, a sewage smell, dead fish, foam, a sick animal..."
                  className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5"
                />
              </label>
              <label className="block text-sm">
                <span className="text-slate-600">Photo (optional)</span>
                <input type="file" accept="image/*" capture="environment" className="mt-1 block text-sm" />
              </label>
              <button className="rounded-md bg-water px-3 py-1.5 text-sm font-medium text-white hover:bg-cyan-800">Send report</button>
              <p className="text-xs text-slate-500">
                In this demo the report joins the Blaarmeersen replay. Leave the box empty to send the written example.
              </p>
            </form>
          )}
        </section>
      </div>
    </>
  );
}
