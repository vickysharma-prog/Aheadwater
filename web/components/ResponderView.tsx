"use client";
import { useState } from "react";

import { DemoClock } from "@/components/DemoClock";
import { motion } from "@/components/Motion";
import { relative, time } from "@/lib/format";
import { incidentState } from "@/lib/incident";
import { actions, useDemo } from "@/lib/store";

export function ResponderView() {
  const demo = useDemo();
  const now = new Date(demo.clock);
  const inc = demo.incident;
  const state = inc && incidentState(inc.severity, inc.events, now);
  const [meId, setMeId] = useState("vol");
  const me = demo.cfg.responders.find((r) => r.id === meId)!;
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
              {demo.cfg.responders.map((r) => (
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
          <motion.article
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 160, damping: 20 }}
            className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="flex-1 font-medium">{inc.site.name}</h2>
              <span className="rounded bg-alert-soft px-2 py-0.5 text-xs font-semibold text-alert">{inc.severity} severity</span>
              <span className="text-xs text-slate-500">{me.km} km from you</span>
            </div>
            <p className="text-sm text-slate-700">
              Water likely unsafe. Opened {time(inc.events[0].at, demo.cfg.tz)}. Evidence: {inc.risk ? `model risk ${(inc.risk.value / inc.risk.usual).toFixed(1)}x usual, ` : ""}citizen report
              {inc.lab.some((l) => l.bad) ? ", lab result above the limit" : ""}.
            </p>

            {state.stage === "resolved" ? (
              <p className="text-sm text-ok">Resolved {time(inc.events.find((e) => e.type === "resolved")!.at, demo.cfg.tz)}. Thank you.</p>
            ) : mine ? (
              <div className="space-y-2 rounded-md bg-water-soft p-3 text-sm">
                <p className="font-medium text-water">You are on this incident.</p>
                {inc.lab.length === 0 && (
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }} onClick={actions.labResult} className="rounded-md bg-water px-3 py-1.5 font-medium text-white">
                    {demo.cfg.lab[0].period ? `Attach CPCB's ${demo.cfg.lab[0].date} range, published after the year` : `Upload the lab result for the ${demo.cfg.lab[0].date} sample`}
                  </motion.button>
                )}
                {inc.lab.length > 0 && (
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }} onClick={actions.resolve} className="rounded-md bg-water px-3 py-1.5 font-medium text-white">
                    Close with {demo.cfg.closeWith}
                  </motion.button>
                )}
              </div>
            ) : state.stage === "open_to_claim" ? (
              me.verified ? (
                <div className="space-y-2 rounded-md bg-alert-soft p-3 text-sm">
                  <p className="text-alert">Nobody has acted within the time limit. Any verified responder can take it.</p>
                  <motion.button
                    onClick={() => actions.claim(me.id)}
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                    whileTap={{ scale: 0.94 }}
                    className="rounded-md bg-alert px-3 py-1.5 font-medium text-white shadow-md"
                  >
                    Claim this incident
                  </motion.button>
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
          </motion.article>
        )}
      </div>
    </>
  );
}
