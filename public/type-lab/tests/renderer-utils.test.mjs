import test from "node:test";
import assert from "node:assert/strict";
import { boundedNumber, nativeFallback } from "../renderer-utils.js";
test("renderer controls reject invalid numbers and bound resource-driving scale", () => {
  for (const v of [NaN, Infinity, -Infinity, undefined, null, "12"])
    assert.equal(boundedNumber(v, 1, 24, 10), 10);
  assert.equal(boundedNumber(-5, 1, 24, 10), 1);
  assert.equal(boundedNumber(999, 1, 24, 10), 24);
  assert.equal(boundedNumber(0, 0, 1, 0.8), 0);
});
test("unsupported renderer removes its canvas and exposes the complete safe controller", () => {
  let removed = false;
  const renderer = nativeFallback({
    remove() {
      removed = true;
    },
  });
  assert(removed);
  assert.equal(renderer.supported, false);
  for (const [name, fn] of Object.entries(renderer))
    if (typeof fn === "function") assert.doesNotThrow(() => fn(1), name);
});
