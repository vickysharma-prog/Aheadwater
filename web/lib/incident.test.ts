import assert from "node:assert/strict";
import { test } from "node:test";

import { incidentState, type IncidentEvent } from "./incident.ts";

const T0 = "2021-05-17T08:00:00Z";
const at = (min: number) => new Date(new Date(T0).getTime() + min * 60_000);
const ev = (type: IncidentEvent["type"], min: number): IncidentEvent => ({ type, at: at(min).toISOString() });
const opened = [ev("opened", 0)];

test("high severity: owner, public health and vets until 30 minutes pass", () => {
  const s = incidentState("high", opened, at(29));
  assert.equal(s.stage, "awaiting_ack");
  assert.deepEqual(s.notified, ["owner", "public_health", "vets"]);
  assert.equal(s.publicStep, "warning");
});

test("high severity: no acknowledgement at 30 minutes escalates", () => {
  const s = incidentState("high", opened, at(30));
  assert.equal(s.stage, "escalated");
  assert.deepEqual(s.notified, ["owner", "public_health", "vets", "supervisor"]);
});

test("acknowledged in time: no escalation, but no action by 2 hours opens it to claim", () => {
  const events = [...opened, ev("acknowledged", 10)];
  assert.equal(incidentState("high", events, at(60)).stage, "acknowledged");
  const s = incidentState("high", events, at(120));
  assert.equal(s.stage, "open_to_claim");
  assert.deepEqual(s.notified, ["owner", "public_health", "vets", "responders"]);
});

test("a late acknowledgement does not undo the escalation", () => {
  const s = incidentState("high", [...opened, ev("acknowledged", 45)], at(50));
  assert.equal(s.stage, "acknowledged");
  assert.deepEqual(s.notified, ["owner", "public_health", "vets", "supervisor"]);
});

test("claimed after opening to claim, then resolved", () => {
  const events = [...opened, ev("claimed", 130), ev("resolved", 300)];
  assert.equal(incidentState("high", events, at(125)).stage, "open_to_claim");
  const claimed = incidentState("high", events, at(131));
  assert.equal(claimed.stage, "in_progress");
  assert.equal(claimed.publicStep, "team_on_site");
  assert.equal(incidentState("high", events, at(300)).publicStep, "resolved");
});

test("medium severity waits 4 hours and 24 hours", () => {
  assert.equal(incidentState("medium", opened, at(239)).stage, "awaiting_ack");
  assert.equal(incidentState("medium", opened, at(240)).stage, "escalated");
  assert.equal(incidentState("medium", opened, at(24 * 60)).stage, "open_to_claim");
});

test("events after now are ignored, so the demo clock can replay a log", () => {
  const events = [...opened, ev("acknowledged", 5), ev("dispatched", 20)];
  assert.equal(incidentState("high", events, at(4)).stage, "awaiting_ack");
  assert.equal(incidentState("high", events, at(21)).stage, "in_progress");
});

test("acting at the exact deadline is too late", () => {
  const s = incidentState("high", [...opened, ev("claimed", 120)], at(120));
  assert.equal(s.stage, "in_progress");
  assert.deepEqual(s.notified, ["owner", "public_health", "vets", "supervisor", "responders"]);
});
