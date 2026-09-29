import assert from "node:assert/strict";
import { test } from "node:test";

import { checkPhoto, isWater, toGray } from "./photo.ts";

const W = 64, H = 48;
const image = (f: (x: number, y: number) => number) => {
  const g = new Float32Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) g[y * W + x] = f(x, y);
  return g;
};
const pass = (g: Float32Array) => Object.fromEntries(checkPhoto(g, W, H).map((c) => [c.name, c.pass]));

test("a sharp, well-lit pattern passes", () => {
  assert.deepEqual(pass(image((x, y) => ((x >> 2) + (y >> 2)) % 2 ? 200 : 60)), { Light: true, Focus: true });
});

test("a flat grey frame is blurred", () => {
  assert.deepEqual(pass(image(() => 128)), { Light: true, Focus: false });
});

test("a near-black frame is too dark", () => {
  assert.equal(pass(image((x) => (x % 2 ? 20 : 5))).Light, false);
});

test("luminance weights and water labels", () => {
  assert.equal(Math.round(toGray(new Uint8ClampedArray([255, 0, 0, 255]))[0]), 76);
  assert.ok(isWater("lakeside, lakeshore"));
  assert.ok(!isWater("street sign"));
});
