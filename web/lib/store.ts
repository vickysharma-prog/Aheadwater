"use client";
// One visitor's run of the Ghent scenario, kept in their browser and shared across tabs.
import { useSyncExternalStore } from "react";

import type { EventType } from "./incident.ts";
import { ADVISORY, LAB, newIncident, REPLAY_START, RESPONDERS, type Incident } from "./scenario.ts";

export type Demo = {
  /** Scenario time: the clock the incident runs on, which the visitor can speed up. */
  clock: string;
  reported: boolean; // citizen report has arrived
  reportText?: string; // what the visitor typed on the public page, if they did
  incident?: Incident;
  learned: boolean; // closed incident added to the training set
};

const KEY = "aheadwater-demo-v1";
const START: Demo = { clock: REPLAY_START, reported: false, learned: false };
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

export function useDemo(): Demo {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    read,
    () => START,
  );
}

const addMinutes = (iso: string, min: number) => new Date(new Date(iso).getTime() + min * 60_000).toISOString();

function withIncident(fn: (inc: Incident, d: Demo) => Incident) {
  const d = read();
  if (d.incident) write({ ...d, incident: fn(d.incident, d) });
}

function log(type: EventType, by: string) {
  withIncident((inc, d) => ({ ...inc, events: [...inc.events, { type, at: d.clock, by }] }));
}

export const actions = {
  reset: () => write(START),
  advance: (min: number) => write({ ...read(), clock: addMinutes(read().clock, min) }),
  citizenReport: (text?: string) =>
    write({ ...read(), reported: true, reportText: text?.trim() || undefined, clock: maxIso(read().clock, "2021-05-17T07:40:00+02:00") }),
  openIncident: () => {
    const d = read();
    const inc = newIncident(d.clock);
    write({ ...d, incident: { ...inc, advisory: ADVISORY, citizen: { ...inc.citizen!, text: d.reportText ?? inc.citizen!.text } } });
  },
  acknowledge: () => log("acknowledged", "Water officer"),
  dispatch: (responderId: string) => {
    withIncident((inc) => ({ ...inc, responder: RESPONDERS.find((r) => r.id === responderId) }));
    log("dispatched", "Water officer");
  },
  claim: (responderId: string) => {
    withIncident((inc) => ({ ...inc, responder: RESPONDERS.find((r) => r.id === responderId) }));
    log("claimed", RESPONDERS.find((r) => r.id === responderId)!.name);
  },
  /** The real lab result for the day's sample, which came back above the limit. */
  labResult: () => {
    withIncident((inc) => ({ ...inc, lab: LAB.filter((l) => l.date === "2021-05-17") }));
  },
  /** The real follow-up sample on 31 May came back clean. */
  resolve: () => {
    write({ ...read(), clock: maxIso(read().clock, "2021-05-31T15:00:00+02:00") });
    withIncident((inc) => ({ ...inc, lab: LAB.filter((l) => l.date >= "2021-05-17") }));
    log("resolved", read().incident?.responder?.name ?? "Water officer");
  },
  learn: () => write({ ...read(), learned: true }),
};

function maxIso(a: string, b: string) {
  return new Date(a) > new Date(b) ? a : b;
}
