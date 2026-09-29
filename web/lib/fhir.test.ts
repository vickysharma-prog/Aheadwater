import assert from "node:assert/strict";
import { test } from "node:test";

import { incidentBundle } from "./fhir.ts";
import { RESOLVED_AT, resolvedIncident } from "./scenario.ts";

export const fullScenario = () => ({ bundle: incidentBundle(resolvedIncident(), RESOLVED_AT) });

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
