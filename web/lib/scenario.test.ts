import assert from "node:assert/strict";
import { test } from "node:test";

import { CITIES, trust } from "./scenario.ts";

const ghent = CITIES.ghent;

test("Ghent: model Watch alone is one source; a report makes two", () => {
  assert.equal(trust({ risk: ghent.risk, lab: [] }).reasons.length, 1);
  assert.equal(trust({ risk: ghent.risk, citizen: ghent.citizen, lab: [] }).reasons.length, 2);
});

test("a checked photo adds to the report, and says when water was recognised", () => {
  const withPhoto = trust({ risk: ghent.risk, citizen: { ...ghent.citizen, photo: { water: { label: "lakeside", p: 0.3 } } }, lab: [] });
  assert.equal(withPhoto.reasons.length, 3);
  assert.match(withPhoto.reasons[2].source, /water in frame/);
});

test("Bengaluru: no model, so the report and the 2016 monitoring are the two sources", () => {
  const b = CITIES.bengaluru;
  const t = trust({ risk: b.risk, prior: b.prior, citizen: b.citizen, lab: [] });
  assert.deepEqual(t.reasons.map((r) => r.weight), [0.35, 0.25]);
  assert.match(t.reasons[0].source, /2016/);
});
