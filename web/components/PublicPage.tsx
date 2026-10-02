"use client";
import { useState } from "react";

import { DemoClock } from "@/components/DemoClock";
import { item, motion, Pop, Stagger } from "@/components/Motion";
import { PhotoInput, type CheckedPhoto } from "@/components/PhotoInput";
import { time } from "@/lib/format";
import { incidentState } from "@/lib/incident";
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
  const [photo, setPhoto] = useState<CheckedPhoto>();
  const [site, setSite] = useState(demo.cfg.focus.id);

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
          <p className="text-slate-600">{demo.cfg.intro}</p>
        </header>

        <Stagger className="space-y-3">
          {demo.cfg.sites.map((s) => {
            const active = inc?.site.id === s.id && state;
            const closed = active && state.publicStep === "resolved";
            const standing = closed && demo.cfg.standingWarning;
            const unsafe = (active && !closed) || standing;
            return (
              <motion.div
                key={s.id}
                variants={item}
                layout
                whileHover={{ y: -2 }}
                // A card under warning pulses; it still has to fade in like the others.
                animate={unsafe ? { opacity: 1, y: 0, boxShadow: ["0 0 0 0 rgba(185,28,28,0.25)", "0 0 0 8px rgba(185,28,28,0)"] } : undefined}
                transition={unsafe ? { boxShadow: { duration: 1.8, repeat: Infinity } } : undefined}
                className={`rounded-xl border bg-white p-4 shadow-sm ${unsafe ? "border-alert" : "border-slate-200"}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="flex-1 font-medium">{s.name}</h2>
                  {unsafe ? (
                    <span className="rounded bg-alert px-2 py-0.5 text-xs font-semibold text-white">Avoid contact</span>
                  ) : demo.cfg.standing?.[s.id] ? (
                    <span className="rounded bg-watch-soft px-2 py-0.5 text-xs font-semibold text-watch">Not fit for contact</span>
                  ) : (
                    <span className="rounded bg-ok-soft px-2 py-0.5 text-xs font-semibold text-ok">No warning</span>
                  )}
                </div>
                {!active && demo.cfg.standing?.[s.id] && <p className="mt-2 text-sm text-watch">{demo.cfg.standing[s.id]}</p>}
                {active && (
                  <>
                    {unsafe && <p className="mt-2 font-medium text-alert">{standing ? demo.cfg.standingWarning : inc.advisory}</p>}
                    <ol className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      {STEPS.map(([key, label]) => {
                        const at = stepAt(key);
                        return (
                          <motion.li
                            key={key + (at ? "-done" : "")}
                            initial={at ? { scale: 0.85, opacity: 0.4 } : false}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 400, damping: 20 }}
                            className={`rounded-md border px-2 py-1.5 ${at ? "border-water bg-water-soft text-water" : "border-slate-200 text-slate-400"}`}
                          >
                            <div className="font-semibold">{key === "resolved" && demo.cfg.standingWarning ? "Case closed" : label}</div>
                            <div>{at ? time(at, demo.cfg.tz) : "not yet"}</div>
                          </motion.li>
                        );
                      })}
                    </ol>
                    {inc.lab.length > 0 && (
                      <p className="mt-2 text-xs text-slate-600">
                        Latest lab result: {inc.lab.at(-1)!.bad ? "above the safe limit" : "within the safe limit"} ({inc.lab.at(-1)!.source ?? inc.lab.at(-1)!.date}).
                      </p>
                    )}
                  </>
                )}
              </motion.div>
            );
          })}
        </Stagger>

        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="font-semibold">Report something</h2>
          {demo.reported ? (
            <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-2 flex items-start gap-2 text-sm text-ok">
              <Pop className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ok text-xs text-white">✓</Pop>
              <span>
                Thank you. Your report went to the city&apos;s water officer at {time(demo.clock, demo.cfg.tz)}. If it leads to a warning, you will see it above.
              </span>
            </motion.p>
          ) : (
            <form
              className="mt-3 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                actions.citizenReport(text, photo && { thumb: photo.thumb, water: photo.water });
              }}
            >
              <label className="block text-sm">
                <span className="text-slate-600">Where</span>
                <select value={site} onChange={(e) => setSite(e.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5">
                  {demo.cfg.sites.map((s) => (
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
                <div className="mt-1">
                  <PhotoInput onChange={setPhoto} />
                </div>
              </label>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }} className="rounded-md bg-water px-3 py-1.5 text-sm font-medium text-white hover:bg-cyan-800">Send report</motion.button>
              <p className="text-xs text-slate-500">
                In this demo the report joins the {demo.cfg.district} scenario. Leave the box empty to send the written example.
              </p>
            </form>
          )}
        </motion.section>
      </div>
    </>
  );
}
