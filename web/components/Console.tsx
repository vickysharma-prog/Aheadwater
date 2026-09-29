"use client";
import { useState, type ReactNode } from "react";

import backtest from "@/data/backtest.json";
import { DemoClock } from "@/components/DemoClock";
import { LiveRisk } from "@/components/LiveRisk";
import { RiskChart } from "@/components/RiskChart";
import { SiteMap, type MapSite } from "@/components/SiteMap";
import { incidentBundle } from "@/lib/fhir";
import { pct, relative, time } from "@/lib/format";
import { incidentState, type IncidentState } from "@/lib/incident";
import { ALERT_LEVEL, level, SITES, WATCH_MULTIPLE } from "@/lib/risk";
import { measureText, trust } from "@/lib/scenario";
import { actions, useDemo } from "@/lib/store";

const STAGE_LABEL: Record<IncidentState["stage"], [string, string]> = {
  awaiting_ack: ["Waiting for the owner", "bg-watch-soft text-watch"],
  escalated: ["Escalated", "bg-alert-soft text-alert"],
  acknowledged: ["Acknowledged", "bg-water-soft text-water"],
  open_to_claim: ["Open to claim", "bg-alert-soft text-alert"],
  in_progress: ["Team on site", "bg-water-soft text-water"],
  resolved: ["Resolved", "bg-ok-soft text-ok"],
};

const eventDay = backtest.sites_on_event_day;

export function Console() {
  const demo = useDemo();
  const now = new Date(demo.clock);
  const inc = demo.incident;
  const state = inc && incidentState(inc.severity, inc.events, now);
  const [selected, setSelected] = useState(backtest.site);

  const cfg = demo.cfg;
  const ghent = cfg.id === "ghent";
  const risks = SITES.map((s) => {
    const r = eventDay.find((e) => e.id === s.id)!;
    return { site: s, ...r, level: level(r.risk, r.usual) };
  });
  const mapSites: MapSite[] = cfg.sites.map((s) => {
    const r = ghent ? risks.find((x) => x.site.id === s.id) : undefined;
    return {
      id: s.id,
      name: s.name,
      lat: s.lat,
      lon: s.lon,
      level: inc && inc.site.id === s.id && state?.stage !== "resolved" ? "incident" : (r?.level ?? "unscored"),
      label: r ? `Risk ${pct(r.risk)}, ${(r.risk / r.usual).toFixed(1)}x usual` : "No risk score yet: needs local samples",
    };
  });
  const east = risks.find((r) => r.site.id === "BEVL_BW_GNT03")!;
  const west = risks.find((r) => r.site.id === "BEVL_BW_GNT02")!;
  const evidence = trust({
    risk: cfg.risk,
    citizen: demo.reported ? { ...cfg.citizen, text: demo.reportText ?? cfg.citizen.text } : undefined,
    lab: inc?.lab ?? [],
  });

  function download() {
    if (!inc) return;
    const blob = new Blob([JSON.stringify(incidentBundle(inc, now), null, 2)], { type: "application/fhir+json" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `${inc.id}.json` });
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const selectedDays = ghent && selected === backtest.site ? backtest.days : null;

  return (
    <>
      <DemoClock />
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-4 lg:grid-cols-[1fr_440px]">
        <section className="space-y-4">
          <div className="h-[380px] overflow-hidden rounded-lg border border-slate-200 bg-white">
            <SiteMap key={cfg.id} sites={mapSites} onSelect={setSelected} />
          </div>
          {ghent ? (
          <div className="rounded-lg border border-slate-200 bg-white">
            <h2 className="border-b border-slate-100 px-4 py-2.5 text-sm font-semibold">Next-day risk, Ghent bathing sites, {time(backtest.event_day + "T06:00:00+02:00").split(",")[0]}</h2>
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Site</th>
                  <th className="px-2 py-2 font-medium">Risk</th>
                  <th className="px-2 py-2 font-medium">vs usual</th>
                  <th className="px-4 py-2 font-medium">Level</th>
                </tr>
              </thead>
              <tbody>
                {risks.map((r) => (
                  <tr key={r.site.id} onClick={() => setSelected(r.site.id)} className={`cursor-pointer border-t border-slate-100 ${selected === r.site.id ? "bg-slate-50" : ""}`}>
                    <td className="px-4 py-2">
                      {r.site.name} <span className="font-mono text-xs text-slate-400">{r.site.id.replace("BEVL_BW_", "")}</span>
                    </td>
                    <td className="px-2 py-2 font-mono">{pct(r.risk)}</td>
                    <td className="px-2 py-2 font-mono">{(r.risk / r.usual).toFixed(1)}x</td>
                    <td className="px-4 py-2">
                      <LevelBadge level={r.level} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">
              Alert at {pct(ALERT_LEVEL)} risk (1 alert in 5 is a real exceedance across Europe). Watch at {WATCH_MULTIPLE}x a site&apos;s usual risk. Scores use weather up to the day before.
            </p>
          </div>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
              <h2 className="mb-1 font-semibold">Prediction switches on with local samples</h2>
              <p>
                The risk model learned from European bathing sites: their latitudes, their seasons, their sewers. Here it starts from zero local samples, so {cfg.name}{" "}
                runs on reports and lab results first. Every closed case adds a labelled local sample, and the model is retrained on them. The rest of the
                workflow, the escalation ladder and the FHIR records are the same code as in Ghent.
              </p>
            </div>
          )}
          {ghent && <LiveRisk />}
          {selectedDays && (
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <h2 className="text-sm font-semibold">Backtest: {backtest.name}, May 2021</h2>
              <p className="mb-3 text-xs text-slate-500">{backtest.note}</p>
              <RiskChart days={selectedDays} usual={backtest.usual} lab={backtest.lab} eventDay={backtest.event_day} />
            </div>
          )}
        </section>

        <section className="space-y-3">
          <Step n={1} title="Predict" done={ghent}>
            {ghent ? (
            <>
            Two beaches at Blaarmeersen are on <b>Watch</b>: GNT03 at {(east.risk / east.usual).toFixed(1)}x its usual risk, and GNT02 at{" "}
            {(west.risk / west.usual).toFixed(1)}x, after 22 mm of rain in three days. Watch raises nothing on its own. It asks the officer to look.
            </>
            ) : (
              <>
                Record rain hit Bengaluru before dawn on 15 Aug 2017: 180 mm between 3 and 6 am, the most for August in 127 years (as reported by NDTV). No risk
                score here yet: the model needs local samples to learn these lakes, so a case opens from reports and lab results.
              </>
            )}
          </Step>

          <Step n={2} title="Detect" done={demo.reported}>
            {demo.reported ? (
              <blockquote className="rounded-md border-l-4 border-water bg-water-soft px-3 py-2 text-slate-800">
                <p>&ldquo;{demo.reportText ?? cfg.citizen.text}&rdquo;</p>
                <footer className="mt-1 text-xs text-slate-500">Citizen report from the public page, {time(cfg.citizen.at, cfg.tz)}, pinned at {cfg.focus.name}</footer>
              </blockquote>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-slate-600">Waiting for reports from the public page.</span>
                <Button onClick={() => actions.citizenReport()}>Deliver the citizen report</Button>
              </div>
            )}
          </Step>

          <Step n={3} title="Verify" done={!!inc}>
            <div className="mb-2 flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded bg-slate-100">
                <div className="h-full bg-water transition-all" style={{ width: pct(evidence.score) }} />
              </div>
              <span className="font-mono text-xs">trust {evidence.score.toFixed(2)}</span>
            </div>
            <ul className="mb-2 space-y-0.5 text-xs text-slate-600">
              {evidence.reasons.map((r) => (
                <li key={r.source}>
                  + {r.weight.toFixed(2)} {r.source}
                </li>
              ))}
            </ul>
            {!inc && (
              <Button onClick={actions.openIncident} disabled={!demo.reported}>
                Confirm and open a high-severity incident
              </Button>
            )}
            {!inc && !demo.reported && <p className="mt-1 text-xs text-slate-500">One source is not enough to go public. The officer confirms once a second source agrees.</p>}
          </Step>

          <Step n={4} title="Mobilise" done={state && ["in_progress", "resolved"].includes(state.stage)} disabled={!inc}>
            {inc && state && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded px-2 py-0.5 text-xs font-semibold ${STAGE_LABEL[state.stage][1]}`}>{STAGE_LABEL[state.stage][0]}</span>
                  {state.stage === "awaiting_ack" && <span className="text-xs text-slate-600">Acknowledge {relative(state.ackDue, now)}, or it escalates.</span>}
                  {["awaiting_ack", "escalated", "acknowledged"].includes(state.stage) && (
                    <span className="text-xs text-slate-600">Opens to nearby responders {relative(state.actionDue, now)}.</span>
                  )}
                </div>
                <p className="text-xs text-slate-600">Told so far: {state.notified.map((n) => n.replace("_", " ")).join(", ")}.</p>
                {["awaiting_ack", "escalated"].includes(state.stage) && <Button onClick={actions.acknowledge}>Acknowledge</Button>}
                {!["in_progress", "resolved"].includes(state.stage) && (
                  <div>
                    <p className="mb-1 text-xs font-medium text-slate-500">Suggested responders, nearest first</p>
                    <ul className="divide-y divide-slate-100 rounded-md border border-slate-200">
                      {[...cfg.responders].sort((a, b) => a.km - b.km).map((r) => (
                        <li key={r.id} className="flex items-center gap-2 px-3 py-1.5 text-xs">
                          <span className="flex-1">
                            {r.name} <span className="text-slate-400">{r.km} km</span>
                          </span>
                          {r.verified ? (
                            <button onClick={() => actions.dispatch(r.id)} className="rounded border border-water px-2 py-0.5 font-medium text-water hover:bg-water hover:text-white">
                              Dispatch
                            </button>
                          ) : (
                            <span className="text-slate-400">Can see it, cannot claim it</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {inc.responder && <p className="text-sm">On it: <b>{inc.responder.name}</b></p>}
              </div>
            )}
          </Step>

          <Step n={5} title="One Health" done={!!inc} disabled={!inc}>
            {inc && (
              <div className="space-y-2">
                <p>
                  Public health and the neighbourhood vet practice were told when the incident opened. The public page now reads:
                </p>
                {state?.stage === "resolved" && cfg.standingWarning ? (
                  <p className="rounded-md bg-watch-soft px-3 py-2 font-medium text-watch">Case closed. {cfg.standingWarning}</p>
                ) : state?.stage === "resolved" ? (
                  <p className="rounded-md bg-ok-soft px-3 py-2 font-medium text-ok">Advisory lifted. The follow-up sample was clean.</p>
                ) : (
                  <p className="rounded-md bg-alert-soft px-3 py-2 font-medium text-alert">{inc.advisory}</p>
                )}
                {ghent && (
                  <a href="/health" className="text-xs font-medium text-water underline">
                    Check the health cohorts for this district &rarr;
                  </a>
                )}
              </div>
            )}
          </Step>

          <Step n={6} title="Resolve" done={state?.stage === "resolved"} disabled={!inc}>
            {inc && (
              <div className="space-y-2">
                {inc.lab.length === 0 ? (
                  <Button onClick={actions.labResult}>{cfg.lab[0].period ? `Pull the official monitoring for ${cfg.focus.name}` : `The lab result for the ${cfg.lab[0].date} sample arrives`}</Button>
                ) : (
                  <ul className="space-y-1 text-xs">
                    {inc.lab.map((l) => (
                      <li key={l.date} className={l.bad ? "text-alert" : "text-ok"}>
                        {l.source ?? l.date}: {l.measures.map(measureText).join(", ")}. {l.bad ? "Above the limit." : "Clean."}
                      </li>
                    ))}
                  </ul>
                )}
                {state?.stage === "in_progress" && inc.lab.length > 0 && (
                  <Button onClick={actions.resolve}>Close with {cfg.closeWith}</Button>
                )}
              </div>
            )}
          </Step>

          <Step n={7} title="Learn" done={demo.learned} disabled={state?.stage !== "resolved"}>
            {state?.stage === "resolved" &&
              (demo.learned ? (
                <p>
                  Added to the next training run: <span className="font-mono text-xs">{cfg.focus.id}, {cfg.lab[0].date}, unsafe=1</span>, with the weather before it. Every closed incident is a new labelled example.
                </p>
              ) : (
                <Button onClick={actions.learn}>Add the closed incident to the training set</Button>
              ))}
          </Step>

          {inc && (
            <div className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-white p-3">
              <Button onClick={download}>Download as FHIR Bundle</Button>
              <a href="/fhir-explorer" className="rounded-md px-3 py-1.5 text-sm font-medium text-water hover:underline">
                See each FHIR resource
              </a>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function Step({ n, title, done, disabled, children }: { n: number; title: string; done?: boolean; disabled?: boolean; children: ReactNode }) {
  return (
    <div className={`rounded-lg border bg-white p-3 text-sm ${disabled ? "border-slate-100 opacity-50" : "border-slate-200"}`}>
      <h3 className="mb-1.5 flex items-center gap-2 font-semibold">
        <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${done ? "bg-ok text-white" : "bg-slate-200 text-slate-600"}`}>
          {done ? "✓" : n}
        </span>
        {title}
      </h3>
      {!disabled && <div className="text-slate-700">{children}</div>}
    </div>
  );
}

function Button({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} className="rounded-md bg-water px-3 py-1.5 text-sm font-medium text-white hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-300">
      {children}
    </button>
  );
}

export function LevelBadge({ level }: { level: "alert" | "watch" | "normal" }) {
  const cls = { alert: "bg-alert-soft text-alert", watch: "bg-watch-soft text-watch", normal: "bg-ok-soft text-ok" }[level];
  return <span className={`rounded px-2 py-0.5 text-xs font-semibold capitalize ${cls}`}>{level}</span>;
}
