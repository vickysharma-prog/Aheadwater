"use client";
import { useState } from "react";

import { DemoClock } from "@/components/DemoClock";
import { relative, time } from "@/lib/format";
import { incidentState } from "@/lib/incident";
import { RESPONDERS } from "@/lib/scenario";
import { actions, useDemo } from "@/lib/store";

export function ResponderView() {
  const demo = useDemo();
  const now = new Date(demo.clock);
  const inc = demo.incident;
  const state = inc && incidentState(inc.severity, inc.events, now);
  const [meId, setMeId] = useState("vol");
  const me = RESPONDERS.find((r) => r.id === meId)!;
  const mine = inc?.responder?.id === me.id;

  return (
    <>
      <DemoClock />
      <div className="mx-auto max-w-3xl space-y-5 px-4 py-6">
        <header className="flex flex-wrap items-end gap-3">
          <div className="flex-1">
            <h1 className="text-2xl font-semibold tracking-tight">Incidents near you</h1>
            <p className="text-slate-600">For labs, NGOs, wardens and vets who help the city respond.</p>
          </div>
          <label className="text-sm">
            <span className="mr-2 text-slate-600">Signed in as</span>
            <select value={meId} onChange={(e) => setMeId(e.target.value)} className="rounded-md border border-slate-300 px-2 py-1.5">
              {RESPONDERS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
        </header>

        {!inc || !state ? (
          <p className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-slate-500">
            Nothing near you right now. When the water officer opens an incident within reach, it appears here.
          </p>
        ) : (
          <article className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="flex-1 font-medium">{inc.site.name}</h2>
              <span className="rounded bg-alert-soft px-2 py-0.5 text-xs font-semibold text-alert">{inc.severity} severity</span>
              <span className="text-xs text-slate-500">{me.km} km from you</span>
            </div>
            <p className="text-sm text-slate-700">
              Bathing water likely unsafe. Opened {time(inc.events[0].at)}. Evidence: model risk {(inc.risk.value / inc.risk.usual).toFixed(1)}x usual, citizen report
              {inc.lab.some((l) => l.bad) ? ", lab result above the limit" : ""}.
            </p>

            {state.stage === "resolved" ? (
              <p className="text-sm text-ok">Resolved {time(inc.events.find((e) => e.type === "resolved")!.at)}. Thank you.</p>
            ) : mine ? (
              <div className="space-y-2 rounded-md bg-water-soft p-3 text-sm">
                <p className="font-medium text-water">You are on this incident.</p>
                {inc.lab.length === 0 && (
                  <button onClick={actions.labResult} className="rounded-md bg-water px-3 py-1.5 font-medium text-white">
                    Upload the lab result for the 17 May sample
                  </button>
                )}
                {inc.lab.length > 0 && (
                  <button onClick={actions.resolve} className="rounded-md bg-water px-3 py-1.5 font-medium text-white">
                    Close with the clean follow-up sample (31 May)
                  </button>
                )}
              </div>
            ) : state.stage === "open_to_claim" ? (
              me.verified ? (
                <div className="space-y-2 rounded-md bg-alert-soft p-3 text-sm">
                  <p className="text-alert">Nobody has acted within the time limit. Any verified responder can take it.</p>
                  <button onClick={() => actions.claim(me.id)} className="rounded-md bg-alert px-3 py-1.5 font-medium text-white">
                    Claim this incident
                  </button>
                </div>
              ) : (
                <p className="rounded-md bg-slate-100 p-3 text-sm text-slate-600">
                  You can follow this incident, but only verified responders can claim one. Ask the city to verify your group.
                </p>
              )
            ) : inc.responder ? (
              <p className="text-sm text-slate-600">{inc.responder.name} is on it.</p>
            ) : (
              <p className="text-sm text-slate-600">
                The water officer owns this incident. If nobody acts, it opens to nearby responders {relative(state.actionDue, now)}.
              </p>
            )}
          </article>
        )}
      </div>
    </>
  );
}
