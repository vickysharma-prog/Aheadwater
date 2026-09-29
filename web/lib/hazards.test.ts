import assert from "node:assert/strict";
import { test } from "node:test";

import { hazards, type Day } from "./hazards.ts";

const days = (n: number, d: Partial<Day> = {}): Day[] =>
  Array.from({ length: n }, (_, i) => ({ date: `2023-07-${String(i + 1).padStart(2, "0")}`, rain: 0, tmax: 18, tmean: 15, wind: 15, ...d }));
const level = (ds: Day[], id: string) => hazards(ds, ds.length - 1).find((h) => h.id === id)!.level;

test("mild, windy weather raises nothing", () => {
  for (const h of hazards(days(10), 9)) assert.equal(h.level, "normal");
});

test("algae: warm and calm is watch, hotter is alert, wind cancels it", () => {
  assert.equal(level(days(10, { tmean: 21, wind: 6 }), "algae"), "watch");
  assert.equal(level(days(10, { tmean: 24, wind: 6 }), "algae"), "alert");
  assert.equal(level(days(10, { tmean: 24, wind: 18 }), "algae"), "normal");
});

test("low oxygen: a heat run is watch; heavy rain after a dry spell on top is alert", () => {
  assert.equal(level(days(10, { tmax: 29 }), "oxygen"), "watch");
  const flush = days(10, { tmax: 29 });
  flush[9].rain = 25;
  assert.equal(level(flush, "oxygen"), "alert");
  const wet = days(10, { tmax: 29, rain: 5 });
  wet[9].rain = 25;
  assert.equal(level(wet, "oxygen"), "watch", "no dry spell before the rain, so no first flush");
});

test("flood: 20 mm in a day is watch, 40 mm is alert", () => {
  const d = days(3);
  d[2].rain = 20;
  assert.equal(level(d, "flood"), "watch");
  d[2].rain = 40;
  assert.equal(level(d, "flood"), "alert");
});
