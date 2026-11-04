import test from "node:test";
import assert from "node:assert/strict";
import { createFrameLoop } from "../src/internal/frame-loop.js";
function harness(draw = () => true) {
  let time = 0,
    id = 0;
  const queue = new Map(),
    deltas = [];
  const loop = createFrameLoop(
    (now, dt) => {
      deltas.push(dt);
      return draw(now, dt);
    },
    {
      request: (fn) => {
        queue.set(++id, fn);
        return id;
      },
      cancel: (id) => queue.delete(id),
      now: () => time,
    },
  );
  return {
    loop,
    queue,
    deltas,
    step(ms = 16) {
      time += ms;
      const callbacks = [...queue.values()];
      queue.clear();
      callbacks.forEach((fn) => fn(time));
    },
  };
}
test("repeated wake schedules one frame; settled renders sleep", () => {
  const h = harness(() => false);
  h.loop.wake();
  h.loop.wake();
  assert.equal(h.queue.size, 1);
  h.step();
  assert.equal(h.queue.size, 0);
  assert.equal(h.deltas.length, 1);
});
test("freeze and offscreen gates compose; a partial resume stays asleep", () => {
  const h = harness();
  h.loop.wake();
  h.step();
  h.loop.block("freeze", true);
  h.loop.block("offscreen", true);
  h.loop.wake();
  assert.equal(h.queue.size, 0);
  h.loop.block("freeze", false);
  assert.equal(h.queue.size, 0);
  h.loop.block("offscreen", false);
  assert.equal(h.queue.size, 1);
});
test("resuming does not integrate hidden time and long frames are bounded", () => {
  const h = harness();
  h.loop.wake();
  h.step();
  h.loop.block("hidden", true);
  h.step(60000);
  h.loop.block("hidden", false);
  h.step();
  assert.equal(h.deltas.at(-1), 0.016);
  h.step(2000);
  assert.equal(h.deltas.at(-1), 0.032);
});
test("destroy cancels and permanently prevents restart", () => {
  const h = harness();
  h.loop.wake();
  h.loop.destroy();
  h.loop.destroy();
  h.loop.wake();
  h.loop.block("freeze", false);
  assert.equal(h.queue.size, 0);
  h.step();
  assert.equal(h.deltas.length, 0);
});
test("destroy during render does not schedule a successor", () => {
  let h;
  h = harness(() => {
    h.loop.destroy();
    return true;
  });
  h.loop.wake();
  h.step();
  assert.equal(h.queue.size, 0);
});
