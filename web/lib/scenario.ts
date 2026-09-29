// The demo cities. Ghent replays a real event: Blaarmeersen GNT03, May 2021, with real risk,
// rain and lab results; the citizen report and the responders are written for the demo.
// Bengaluru is an illustrative run of the same workflow where the model has no local samples yet.
import backtest from "../data/backtest.json" with { type: "json" };

import type { IncidentEvent, Severity } from "./incident.ts";
import { SITES, type Site } from "./risk.ts";

export type LabResult = { date: string; ecoli: number; ie: number; bad: number };
export type Responder = { id: string; name: string; kind: "lab" | "ngo" | "volunteers" | "vet"; km: number; verified: boolean };
export type CityId = "ghent" | "bengaluru";

export type City = {
  id: CityId;
  name: string;
  tz: string;
  /** replay: a real past event. illustrative: the workflow on made-up readings. */
  kind: "replay" | "illustrative";
  intro: string;
  start: string;
  sites: Site[];
  focus: Site;
  /** Model risk on the day; absent where the model has no local samples to learn from yet. */
  risk?: { day: string; value: number; usual: number };
  citizen: { at: string; text: string };
  responders: Responder[];
  owner: string;
  district: string;
  advisory: string;
  /** The confirming sample first, the all-clear sample last. */
  lab: LabResult[];
  closeAt: string;
  incidentId: string;
};

export type Incident = {
  id: string;
  city: CityId;
  site: Site;
  severity: Severity;
  risk?: { day: string; value: number; usual: number };
  citizen?: { at: string; text: string };
  lab: LabResult[];
  events: IncidentEvent[];
  responder?: Responder;
  advisory?: string;
};

const day = backtest.days.find((d) => d.date === backtest.event_day)!;

const bengaluruSites: Site[] = [
  { id: "blr-bellandur", name: "Bellandur Lake", lat: 12.9345, lon: 77.666, zone: "lake" },
  { id: "blr-varthur", name: "Varthur Lake", lat: 12.944, lon: 77.738, zone: "lake" },
  { id: "blr-agara", name: "Agara Lake", lat: 12.9235, lon: 77.642, zone: "lake" },
];

export const CITIES: Record<CityId, City> = {
  ghent: {
    id: "ghent",
    name: "Ghent",
    tz: "Europe/Brussels",
    kind: "replay",
    intro: "Bathing sites in and around Ghent. Updated by the city's water team.",
    start: "2021-05-17T06:00:00+02:00",
    sites: SITES,
    focus: SITES.find((s) => s.id === backtest.site)!,
    risk: { day: day.date, value: day.risk, usual: backtest.usual },
    citizen: {
      at: "2021-05-17T07:40:00+02:00",
      text: "Water at the east beach is cloudy and smells of sewage after the weekend rain. A dog was sick after swimming.",
    },
    responders: [
      { id: "lab", name: "City water quality lab", kind: "lab", km: 2.1, verified: true },
      { id: "ngo", name: "Leie river trust", kind: "ngo", km: 3.4, verified: true },
      { id: "vol", name: "Blaarmeersen volunteer wardens", kind: "volunteers", km: 0.4, verified: true },
      { id: "vet", name: "Neighbourhood vet practice", kind: "vet", km: 1.2, verified: true },
      { id: "new", name: "New volunteer (unverified)", kind: "volunteers", km: 0.8, verified: false },
    ],
    owner: "City of Ghent, water and environment",
    district: "Blaarmeersen",
    advisory: "Avoid contact with the water at Blaarmeersen. Keep dogs out. Do not swim until the all-clear.",
    lab: backtest.lab.filter((l) => l.date >= backtest.event_day) as LabResult[],
    closeAt: "2021-05-31T15:00:00+02:00",
    incidentId: "inc-gnt03-20210517",
  },
  bengaluru: {
    id: "bengaluru",
    name: "Bengaluru",
    tz: "Asia/Kolkata",
    kind: "illustrative",
    intro: "Lakes in south-east Bengaluru. Updated by the city's lakes team.",
    start: "2026-07-14T06:00:00+05:30",
    sites: bengaluruSites,
    focus: bengaluruSites[0],
    citizen: {
      at: "2026-07-14T07:20:00+05:30",
      text: "White foam is piling up at the Bellandur outlet after last night's rain, with a strong sewage smell. Stray dogs were drinking at the edge.",
    },
    responders: [
      { id: "lab", name: "Water testing lab", kind: "lab", km: 4.2, verified: true },
      { id: "vol", name: "Lake volunteers collective", kind: "volunteers", km: 0.6, verified: true },
      { id: "ngo", name: "Wetland trust", kind: "ngo", km: 2.8, verified: true },
      { id: "vet", name: "Neighbourhood vet clinic", kind: "vet", km: 1.5, verified: true },
      { id: "new", name: "New volunteer (unverified)", kind: "volunteers", km: 0.9, verified: false },
    ],
    owner: "City lakes department",
    district: "Bellandur",
    advisory: "Stay away from the foam and the water at Bellandur Lake. Keep children and animals away. Do not fish here until the all-clear.",
    lab: [
      { date: "2026-07-14", ecoli: 5400, ie: 900, bad: 1 },
      { date: "2026-07-21", ecoli: 700, ie: 150, bad: 0 },
    ],
    closeAt: "2026-07-21T16:00:00+05:30",
    incidentId: "inc-bellandur-20260714",
  },
};

export function newIncident(city: City, openedAt: string): Incident {
  return {
    id: city.incidentId,
    city: city.id,
    site: city.focus,
    severity: "high",
    risk: city.risk,
    citizen: city.citizen,
    lab: [],
    events: [{ type: "opened", at: openedAt, by: "Water officer" }],
  };
}

/** How many independent sources point the same way, and how strongly. */
export function trust(inc: Pick<Incident, "risk" | "citizen" | "lab">) {
  const reasons: { source: string; weight: number }[] = [];
  const ratio = inc.risk ? inc.risk.value / inc.risk.usual : 0;
  if (ratio >= 5) reasons.push({ source: `Model risk ${ratio.toFixed(1)}x the site's usual`, weight: 0.35 });
  if (inc.citizen) reasons.push({ source: "Citizen report with location", weight: 0.25 });
  if (inc.lab.some((l) => l.bad)) reasons.push({ source: "Lab result above the limit", weight: 0.6 });
  return { score: Math.min(1, reasons.reduce((a, r) => a + r.weight, 0)), reasons };
}

/** A city's incident played through to the end. Ghent's is served at /fhir. */
export const RESOLVED_AT = new Date("2021-06-01T00:00:00Z");
export function resolvedIncident(city: City = CITIES.ghent): Incident {
  const t = (iso: string, min: number) => new Date(new Date(iso).getTime() + min * 60_000).toISOString();
  const inc = newIncident(city, t(city.citizen.at, 25));
  inc.events.push(
    { type: "acknowledged", at: t(city.citizen.at, 32), by: "Water officer" },
    { type: "dispatched", at: t(city.citizen.at, 50), by: "Water officer" },
    { type: "resolved", at: city.closeAt, by: city.responders[0].name },
  );
  return { ...inc, lab: city.lab, responder: city.responders[0], advisory: city.advisory };
}
