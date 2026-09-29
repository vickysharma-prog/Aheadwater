import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { score, type Model } from "./model.ts";

const load = (f: string) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), "utf8"));

test("scores match the Python model", () => {
  const model: Model = load("bacteria.json");
  const { features, rows, expected } = load("parity.json");
  assert.deepEqual(model.feature_names, features);
  rows.forEach((row: (number | null)[], i: number) => {
    assert.ok(Math.abs(score(model, row) - expected[i]) < 1e-5, `row ${i}`);
  });
});
