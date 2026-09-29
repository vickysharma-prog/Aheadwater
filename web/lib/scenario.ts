// The demo cities, each replaying a real event. Ghent: Blaarmeersen GNT03, May 2021, with real
// risk, rain and lab results. Bengaluru: froth from Varthur Lake after record rain, August 2017,
// with CPCB's 2017 monitoring; the model has no local samples there. In both, the responders
// are written for the demo.
import backtest from "../data/backtest.json" with { type: "json" };

import type { IncidentEvent, Severity } from "./incident.ts";
import { SITES, type Site } from "./risk.ts";

/** One measured quantity: a single value, or a low-high range over a period. */
export type Measure = { code: string; display: string; unit: string; ucum: string; limit: number; value?: number; low?: number; high?: number };
export type LabResult = { date: string; period?: [string, string]; source?: string; measures: Measure[]; bad: 0 | 1 };

export const measureText = (m: Measure) =>
  `${m.display} ${m.value !== undefined ? m.value.toLocaleString("en-GB") : `${m.low!.toLocaleString("en-GB")} to ${m.high!.toLocaleString("en-GB")}`} ${m.unit} (limit ${m.limit.toLocaleString("en-GB")})`;
export type Responder = { id: string; name: string; kind: "lab" | "ngo" | "volunteers" | "vet"; km: number; verified: boolean };
export type CityId = "ghent" | "bengaluru";

export type City = {
  id: CityId;
  name: string;
  tz: string;
  /** What is real and what is written for the demo, shown under the clock. */
  note: string;
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
  /** The confirming result first; for Ghent the clean follow-up sample last. */
  lab: LabResult[];
  closeAt: string;
  closeWith: string;
  /** Where the case closes but the water stays unsafe, what the public page keeps saying. */
  standingWarning?: string;
  /** Sites with no open case that official monitoring still finds unfit for contact. */
  standing?: Record<string, string>;
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

const ghentLab = (l: { date: string; ecoli: number; ie: number; bad: number }): LabResult => ({
  date: l.date,
  bad: l.bad ? 1 : 0,
  measures: [
    { code: "escherichia-coli", display: "E. coli", unit: "cfu/100 mL", ucum: "[CFU]/(100.mL)", limit: 1000, value: l.ecoli },
    { code: "intestinal-enterococci", display: "Intestinal enterococci", unit: "cfu/100 mL", ucum: "[CFU]/(100.mL)", limit: 400, value: l.ie },
  ],
});

const bengaluruSites: Site[] = [
  { id: "blr-varthur", name: "Varthur Lake", lat: 12.9484, lon: 77.7393, zone: "lake" },
  { id: "blr-bellandur", name: "Bellandur Lake", lat: 12.9371, lon: 77.672, zone: "lake" },
  { id: "blr-agara", name: "Agara Lake", lat: 12.9202, lon: 77.6418, zone: "lake" },
];

export const CITIES: Record<CityId, City> = {
  ghent: {
    id: "ghent",
    name: "Ghent",
    tz: "Europe/Brussels",
    note: "Real risk scores, rain and lab results. The citizen report and responders are written for the demo.",
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
    lab: backtest.lab.filter((l) => l.date >= backtest.event_day).map(ghentLab),
    closeAt: "2021-05-31T15:00:00+02:00",
    closeWith: "the clean follow-up sample of 31 May",
    incidentId: "inc-gnt03-20210517",
  },
  bengaluru: {
    id: "bengaluru",
    name: "Bengaluru",
    tz: "Asia/Kolkata",
    note: "Real event: record rain on 15 Aug 2017, froth from Varthur Lake onto Whitefield road on 16 Aug. Lab figures are CPCB's 2017 monitoring range. Responders are written for the demo.",
    intro: "Lakes in south-east Bengaluru. Updated by the city's lakes team.",
    start: "2017-08-16T06:00:00+05:30",
    sites: bengaluruSites,
    focus: bengaluruSites[0],
    citizen: {
      at: "2017-08-16T07:30:00+05:30",
      text: "Froth from Varthur Lake is over 10 feet high and has crossed the mesh onto Whitefield road at Varthur Kodi, after yesterday's record rain.",
    },
    responders: [
      { id: "lab", name: "Water testing lab", kind: "lab", km: 4.2, verified: true },
      { id: "vol", name: "Lake volunteers collective", kind: "volunteers", km: 0.6, verified: true },
      { id: "ngo", name: "Wetland trust", kind: "ngo", km: 2.8, verified: true },
      { id: "vet", name: "Neighbourhood vet clinic", kind: "vet", km: 1.5, verified: true },
      { id: "new", name: "New volunteer (unverified)", kind: "volunteers", km: 0.9, verified: false },
    ],
    owner: "City lakes department",
    district: "Varthur",
    advisory: "Stay away from the froth and the water at Varthur Lake and on Whitefield road at Varthur Kodi. Keep children and animals away.",
    lab: [
      {
        date: "2017",
        period: ["2017-01-01", "2017-12-31"],
        source: "CPCB National Water Quality Monitoring Programme 2017, station 3608 (Varthur Lake)",
        bad: 1,
        measures: [{ code: "faecal-coliform", display: "Faecal coliform", unit: "MPN/100 mL", ucum: "{MPN}/(100.mL)", limit: 2500, low: 79000, high: 3480000 }],
      },
    ],
    closeAt: "2017-08-22T17:00:00+05:30",
    closeWith: "the site report: froth cleared from the road, case before the National Green Tribunal on 22 Aug",
    standingWarning:
      "Standing warning: CPCB's 2017 monitoring found faecal coliform at Varthur Lake of 79,000 or more per 100 ml all year, over 30 times the bathing limit of 2,500.",
    standing: {
      "blr-bellandur": "CPCB's 2017 monitoring found faecal coliform of 70,000 or more per 100 ml all year, against a bathing limit of 2,500.",
      "blr-agara": "CPCB's 2017 monitoring found faecal coliform as high as 210,000 per 100 ml, against a bathing limit of 2,500.",
    },
    incidentId: "inc-varthur-20170816",
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
