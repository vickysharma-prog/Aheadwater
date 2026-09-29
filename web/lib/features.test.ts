import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { dayOfYear, siteHistory, weatherFeatures } from "./features.ts";

const load = (f: string) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), "utf8"));

test("weather features match Python for GNT03 on 17 May 2021", () => {
  const { rain, temp, expected } = load("features_fixture.json");
  // The fixture runs to the target day; features stop the day before.
  const got = weatherFeatures(rain.slice(0, -1), temp.slice(0, -1));
  for (const [k, v] of Object.entries(expected)) {
    assert.ok(Math.abs(got[k as keyof typeof got] - (v as number)) < 1e-3, `${k}: ${got[k as keyof typeof got]} vs ${v}`);
  }
});

test("site history ignores the target day and later", () => {
  const samples = [
    { id: "a", date: "2021-05-03", ecoli: 999, ie: 15, bad: 0 },
    { id: "a", date: "2021-05-11", ecoli: 1500, ie: 30, bad: 1 },
    { id: "a", date: "2021-05-17", ecoli: 15, ie: 489, bad: 1 },
  ];
  assert.deepEqual(siteHistory(samples, "2021-05-17"), {
    site_n: 2, site_bad_rate: 0.5, last_log_ecoli: Math.log10(1501), days_since_last: 6,
  });
  assert.equal(siteHistory(samples, "2021-05-03").site_n, 0);
});

test("day of year", () => {
  assert.equal(dayOfYear("2021-01-01"), 1);
  assert.equal(dayOfYear("2021-05-17"), 137);
});
