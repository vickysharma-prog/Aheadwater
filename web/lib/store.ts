"use client";
// One visitor's run of a demo city, kept in their browser and shared across tabs.
import { useSyncExternalStore } from "react";

import type { EventType } from "./incident.ts";
import { CITIES, newIncident, type City, type CityId, type Incident } from "./scenario.ts";

export type Demo = {
  city: CityId;
  /** Scenario time: the clock the incident runs on, which the visitor can speed up. */
  clock: string;
  reported: boolean; // citizen report has arrived
  reportText?: string; // what the visitor typed on the public page, if they did
  reportPhoto?: { thumb: string; water?: { label: string; p: number } }; // a photo that passed the checks
  incident?: Incident;
  learned: boolean; // closed incident added to the training set
};

const KEY = "aheadwater-demo-v2";
const start = (city: CityId): Demo => ({ city, clock: CITIES[city].start, reported: false, learned: false });
const START = start("ghent");
let cached: Demo | null = null;
const listeners = new Set<() => void>();

function read(): Demo {
  if (cached) return cached;
  try {
    cached = JSON.parse(localStorage.getItem(KEY) ?? "null") ?? START;
  } catch {
    cached = START;
  }
  return cached!;
}

function write(next: Demo) {
  cached = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  listeners.forEach((l) => l());
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY) return;
    cached = null;
    listeners.forEach((l) => l());
  });
}

export function useDemo(): Demo & { cfg: City } {
  const demo = useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    read,
    () => START,
  );
  return { ...demo, cfg: CITIES[demo.city] };
}

const addMinutes = (iso: string, min: number) => new Date(new Date(iso).getTime() + min * 60_000).toISOString();
const maxIso = (a: string, b: string) => (new Date(a) > new Date(b) ? a : b);
const cfg = () => CITIES[read().city];

function withIncident(fn: (inc: Incident) => Incident) {
  const d = read();
  if (d.incident) write({ ...d, incident: fn(d.incident) });
}

function log(type: EventType, by: string) {
  withIncident((inc) => ({ ...inc, events: [...inc.events, { type, at: read().clock, by }] }));
}

const responder = (id: string) => cfg().responders.find((r) => r.id === id)!;

export const actions = {
  reset: () => write(start(read().city)),
  setCity: (city: CityId) => write(start(city)),
  advance: (min: number) => write({ ...read(), clock: addMinutes(read().clock, min) }),
  citizenReport: (text?: string, photo?: Demo["reportPhoto"]) =>
    write({ ...read(), reported: true, reportText: text?.trim() || undefined, reportPhoto: photo, clock: maxIso(read().clock, cfg().citizen.at) }),
  openIncident: () => {
    const d = read();
    const inc = newIncident(cfg(), d.clock);
    write({ ...d, incident: { ...inc, advisory: cfg().advisory, citizen: { ...inc.citizen!, text: d.reportText ?? inc.citizen!.text, photo: d.reportPhoto && { water: d.reportPhoto.water } } } });
  },
  acknowledge: () => log("acknowledged", "Water officer"),
  dispatch: (id: string) => {
    withIncident((inc) => ({ ...inc, responder: responder(id) }));
    log("dispatched", "Water officer");
  },
  claim: (id: string) => {
    withIncident((inc) => ({ ...inc, responder: responder(id) }));
    log("claimed", responder(id).name);
  },
  /** The confirming lab result. */
  labResult: () => withIncident((inc) => ({ ...inc, lab: cfg().lab.slice(0, 1) })),
  /** The follow-up sample comes back clean and the case closes. */
  resolve: () => {
    write({ ...read(), clock: maxIso(read().clock, cfg().closeAt) });
    withIncident((inc) => ({ ...inc, lab: cfg().lab }));
    log("resolved", read().incident?.responder?.name ?? "Water officer");
  },
  learn: () => write({ ...read(), learned: true }),
};
