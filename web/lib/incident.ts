// The escalation ladder from project.md, as a pure function of the event log and the clock.

export type Severity = "high" | "medium";

export type EventType =
  | "opened" // a confirmed incident, owner notified
  | "acknowledged" // owner has seen it
  | "dispatched" // owner sent a team
  | "claimed" // a verified responder took it after it opened to claim
  | "resolved"; // closed with evidence

export type IncidentEvent = { type: EventType; at: string; by?: string; note?: string };

export type Stage = "awaiting_ack" | "escalated" | "acknowledged" | "open_to_claim" | "in_progress" | "resolved";

export const LIMITS: Record<Severity, { ackMin: number; actionMin: number }> = {
  high: { ackMin: 30, actionMin: 120 },
  medium: { ackMin: 4 * 60, actionMin: 24 * 60 },
};

export type IncidentState = {
  stage: Stage;
  /** Who has been told so far, in order. Public health and vets hear at once (One Health); the ladder adds the rest. */
  notified: ("owner" | "public_health" | "vets" | "supervisor" | "responders")[];
  ackDue: Date;
  actionDue: Date;
  /** What the public page shows. */
  publicStep: "warning" | "team_on_site" | "resolved";
};

const MIN = 60_000;

export function incidentState(severity: Severity, events: IncidentEvent[], now: Date): IncidentState {
  const opened = events.find((e) => e.type === "opened");
  if (!opened) throw new Error("incident has no opened event");
  const t0 = new Date(opened.at).getTime();
  const ackDue = new Date(t0 + LIMITS[severity].ackMin * MIN);
  const actionDue = new Date(t0 + LIMITS[severity].actionMin * MIN);
  const seen = (type: EventType) => events.find((e) => e.type === type && new Date(e.at) <= now);

  const ack = seen("acknowledged");
  const action = seen("dispatched") ?? seen("claimed");
  const notified: IncidentState["notified"] = ["owner", "public_health", "vets"];
  // A deadline counts as missed if the owner had not acted before it, even if they act later.
  if (now >= ackDue && (!ack || new Date(ack.at) >= ackDue)) notified.push("supervisor");
  const openedToClaim = now >= actionDue && (!action || new Date(action.at) >= actionDue);
  if (openedToClaim) notified.push("responders");

  let stage: Stage;
  if (seen("resolved")) stage = "resolved";
  else if (action) stage = "in_progress";
  else if (openedToClaim) stage = "open_to_claim";
  else if (ack) stage = "acknowledged";
  else if (notified.includes("supervisor")) stage = "escalated";
  else stage = "awaiting_ack";

  const publicStep = stage === "resolved" ? "resolved" : stage === "in_progress" ? "team_on_site" : "warning";
  return { stage, notified, ackDue, actionDue, publicStep };
}
