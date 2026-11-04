import test from "node:test";
import assert from "node:assert/strict";
import { stack, stackFragment, MAX_LAYERS } from "../src/stack.js";
import { vortex } from "../src/geometry/vortex.js";
import { rgbSplit } from "../src/signal/rgbSplit.js";
import { waterfall } from "../src/elements.js";
test("stack validates resource bounds and compatible families before mounting", () => {
  assert.equal(MAX_LAYERS, 6);
  assert.throws(() => stack([]), RangeError);
  assert.throws(
    () => stack(Array.from({ length: 7 }, () => ({ effect: vortex }))),
    RangeError,
  );
  assert.throws(() => stack([{ effect: waterfall }]), TypeError);
  assert.equal(stack([{ effect: vortex }, { effect: rgbSplit }]).kind, "stack");
});
test("stack shaders sample the preceding image and retain a separate relief guide", () => {
  const shape = stackFragment(vortex),
    signal = stackFragment(rgbSplit);
  assert.match(shape, /uniform sampler2D originalMask/);
  assert.match(shape, /texture2D\(originalMask/);
  assert.match(shape, /previous\(q\)/);
  assert.match(signal, /return previous\(p\)/);
  assert.ok(
    shape.indexOf("uniform sampler2D originalMask") < shape.indexOf("float sd"),
  );
});
