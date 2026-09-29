import assert from "node:assert/strict";
import { test } from "node:test";

import { incidentBundle } from "./fhir.ts";
import { newIncident, RESOLVED_AT, resolvedIncident } from "./scenario.ts";

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

test("demo actors carry the test-data tag, real measurements do not", () => {
  const byId = Object.fromEntries(fullScenario().bundle.entry.map((e) => [e.resource.id, e.resource]));
  const tagged = (id: string) => JSON.stringify(byId[id].meta?.security ?? []).includes("HTEST");
  assert.ok(tagged("inc-gnt03-20210517-citizen"));
  assert.ok(tagged("ghent-blaarmeersen-2km-all"));
  assert.ok(!tagged("inc-gnt03-20210517-risk"));
  assert.ok(!tagged("inc-gnt03-20210517-lab-2021-05-17-ie"));
});

test("public health is told at once, about the cohorts near the site", () => {
  const comms = fullScenario().bundle.entry.map((e) => e.resource).filter((r) => r.resourceType === "Communication");
  const ph = comms.find((c) => c.id.endsWith("to-public-health"))!;
  assert.equal(ph.sent, new Date("2021-05-17T08:05:00+02:00").toISOString());
  assert.equal(ph.about.filter((a: { reference: string }) => a.reference.startsWith("Group/")).length, 3);
  assert.ok(comms.some((c) => c.id.endsWith("to-vets")));
});

test("no empty arrays, even before anyone has acted", () => {
  const open = incidentBundle(newIncident("2021-05-17T08:05:00+02:00"), new Date("2021-05-17T10:30:00+02:00"));
  assert.ok(!JSON.stringify(open).includes("[]"));
});
