import assert from "node:assert/strict";
import { test } from "node:test";

import { incidentBundle } from "./fhir.ts";
import { ADVISORY, LAB, newIncident, RESPONDERS } from "./scenario.ts";

export function fullScenario() {
  const inc = newIncident("2021-05-17T08:05:00+02:00");
  inc.events.push(
    { type: "acknowledged", at: "2021-05-17T08:12:00+02:00", by: "Water officer" },
    { type: "dispatched", at: "2021-05-17T08:30:00+02:00", by: "Water officer" },
    { type: "resolved", at: "2021-05-31T15:00:00+02:00", by: "City water quality lab" },
  );
  inc.lab = LAB;
  inc.responder = RESPONDERS[0];
  inc.advisory = ADVISORY;
  return { inc, bundle: incidentBundle(inc, new Date("2021-06-01T00:00:00Z")) };
}

test("every reference in the bundle points at a resource in it", () => {
  const { bundle } = fullScenario();
  const present = new Set(bundle.entry.map((e) => `${e.resource.resourceType}/${e.resource.id}`));
  const refs = JSON.stringify(bundle).match(/"reference":"[^"]+"/g) ?? [];
  assert.ok(refs.length > 10);
  for (const r of refs) assert.ok(present.has(r.slice(13, -1)), r);
});

test("ids are valid FHIR ids", () => {
  for (const e of fullScenario().bundle.entry) assert.match(e.resource.id, /^[A-Za-z0-9.-]{1,64}$/);
});

test("a resolved incident closes the task and the issue", () => {
  const types = Object.fromEntries(fullScenario().bundle.entry.map((e) => [e.resource.resourceType, e.resource]));
  assert.equal(types.Task.status, "completed");
  assert.equal(types.DetectedIssue.status, "final");
  assert.equal(types.CareTeam.status, "inactive");
});
