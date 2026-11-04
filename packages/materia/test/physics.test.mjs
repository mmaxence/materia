import test from "node:test";
import assert from "node:assert/strict";
import { connectParticles, stepPhysics } from "../src/internal/physics-core.js";
const sample = () =>
  Array.from({ length: 160 }, (_, i) => ({
    ax: 80 + (i % 20) * 4,
    ay: 70 + Math.floor(i / 20) * 4,
    x: 80 + (i % 20) * 4,
    y: 70 + Math.floor(i / 20) * 4,
    vx: 0,
    vy: 0,
    grab: 1,
  }));
for (let mode = 39; mode <= 48; mode++)
  test(`mode ${mode}: responds, remains finite, returns home`, () => {
    const particles = sample(),
      links = connectParticles(particles, 4);
    let peak = 0;
    for (let frame = 0; frame < 2400; frame++) {
      const time = frame / 120,
        energy = Math.max(0, 1.3 - time * 0.45);
      const state = {
        mode,
        energy,
        point: [120, 85],
        radius: 95,
        amount: 0.9,
        time,
        height: 220,
        held: mode === 48 && time < 0.8,
        pull: [60, -20],
        trails: time < 3 ? [{ x: 120, y: 85, vx: 200, vy: 60, time: 0 }] : [],
        drag: [200, 60],
        burstTime: 0,
        spacing: 4,
      };
      const m = stepPhysics(particles, links, state, 1 / 120);
      peak = Math.max(peak, m);
      assert(Number.isFinite(m));
      assert(m < 10000, "bounded motion");
    }
    assert(peak > 2, "effect actually moves particles");
    assert(
      Math.max(...particles.map((p) => Math.hypot(p.x - p.ax, p.y - p.ay))) <
        0.12,
      "returns to anchors",
    );
  });
test("soft mesh transfers displacement to a neighbor", () => {
  const particles = sample(),
    links = connectParticles(particles, 4);
  particles[50].x += 15;
  stepPhysics(
    particles,
    links,
    {
      mode: 43,
      energy: 0,
      point: [0, 0],
      radius: 50,
      amount: 0,
      time: 0,
      height: 220,
      held: false,
      spacing: 4,
    },
    1 / 120,
  );
  assert(particles[51].vx > 0, "neighbor is pulled by the displaced particle");
});
