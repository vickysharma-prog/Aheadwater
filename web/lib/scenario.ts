// The Ghent replay: Blaarmeersen GNT03, May 2021. Risk, rain and lab results are real;
// the citizen report and the responders are written for the demo.
import backtest from "../data/backtest.json" with { type: "json" };

import type { IncidentEvent, Severity } from "./incident.ts";
import { SITES, type Site } from "./risk.ts";

export type LabResult = { date: string; ecoli: number; ie: number; bad: number };
export type Responder = { id: string; name: string; kind: "lab" | "ngo" | "volunteers" | "vet"; km: number; verified: boolean };

export type Incident = {
  id: string;
  site: Site;
  severity: Severity;
  risk: { day: string; value: number; usual: number };
  citizen?: { at: string; text: string };
  lab: LabResult[];
  events: IncidentEvent[];
  responder?: Responder;
  advisory?: string;
};

export const SITE = SITES.find((s) => s.id === backtest.site)!;
export const REPLAY_START = "2021-05-17T06:00:00+02:00";

export const CITIZEN_REPORT = {
  at: "2021-05-17T07:40:00+02:00",
  text: "Water at the east beach is cloudy and smells of sewage after the weekend rain. A dog was sick after swimming.",
};

export const RESPONDERS: Responder[] = [
  { id: "lab", name: "City water quality lab", kind: "lab", km: 2.1, verified: true },
  { id: "ngo", name: "Leie river trust", kind: "ngo", km: 3.4, verified: true },
  { id: "vol", name: "Blaarmeersen volunteer wardens", kind: "volunteers", km: 0.4, verified: true },
  { id: "vet", name: "Neighbourhood vet practice", kind: "vet", km: 1.2, verified: true },
  { id: "new", name: "New volunteer (unverified)", kind: "volunteers", km: 0.8, verified: false },
];

export const ADVISORY = "Avoid contact with the water at Blaarmeersen. Keep dogs out. Do not swim until the all-clear.";

const day = backtest.days.find((d) => d.date === backtest.event_day)!;

export function newIncident(openedAt: string): Incident {
  return {
    id: "inc-gnt03-20210517",
    site: SITE,
    severity: "high",
    risk: { day: day.date, value: day.risk, usual: backtest.usual },
    citizen: CITIZEN_REPORT,
    lab: [],
    events: [{ type: "opened", at: openedAt, by: "Water officer" }],
  };
}

/** Real lab results for the site: the sample on the 17th, and the all-clear on the 31st. */
export const LAB = backtest.lab as LabResult[];

/** How many independent sources point the same way, and how strongly. */
export function trust(inc: Pick<Incident, "risk" | "citizen" | "lab">) {
  const reasons: { source: string; weight: number }[] = [];
  const ratio = inc.risk.value / inc.risk.usual;
  if (ratio >= 5) reasons.push({ source: `Model risk ${ratio.toFixed(1)}x the site's usual`, weight: 0.35 });
  if (inc.citizen) reasons.push({ source: "Citizen report with location", weight: 0.25 });
  if (inc.lab.some((l) => l.bad)) reasons.push({ source: "Lab result above the limit", weight: 0.6 });
  return { score: Math.min(1, reasons.reduce((a, r) => a + r.weight, 0)), reasons };
}
