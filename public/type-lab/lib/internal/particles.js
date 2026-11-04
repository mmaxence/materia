import { sourcePresentation } from "./renderer-utils.js";
import { nativeFallback, layoutKey, boundedNumber } from "./renderer-utils.js";
import { createFrameLoop } from "./frame-loop.js";
import { rasterize } from "./text-mask.js";
import {
  connectParticles,
  resetParticles,
  stepPhysics,
} from "./physics-core.js";
const colors = {
  39: "#ffe4a4",
  40: "#dceaff",
  41: "#f2a8d7",
  42: "#9edcff",
  43: "#b5efcf",
  44: "#ffdca6",
  45: "#b8dfeb",
  46: "#e8c08c",
  47: "#b6a9ff",
  48: "#ffbb9b",
};
export function attachParticles(element, options = {}) {
  const host = options.host ?? element.parentElement,
    canvas = document.createElement("canvas");
  canvas.className = "material-canvas";
  canvas.style.cssText =
    "position:absolute;inset:0;width:100%;height:100%;pointer-events:none";
  const source = sourcePresentation(element);
  canvas.setAttribute("aria-hidden", "true");
  host.append(canvas);
  const ctx = canvas.getContext("2d"),
    reduced = matchMedia("(prefers-reduced-motion: reduce)");
  if (!ctx) return nativeFallback(canvas);
  let particles = [],
    links = [],
    raster,
    width = 1,
    height = 1,
    dpr = 1,
    spacing = 4,
    energy = 0,
    point = [0, 0],
    amount = boundedNumber(options.intensity, 0, 1, 0.8),
    detail = 10,
    mode = options.mode ?? 39,
    flow = false,
    frozen = false,
    visible = true,
    dead = false,
    time = 0,
    burstTime = 0,
    held = false,
    down = [0, 0],
    drag = [0, 0],
    trails = [],
    lastInput = 0,
    autoPulse = -10;
  function refresh() {
    if (dead) return;
    const box = host.getBoundingClientRect();
    width = box.width;
    height = box.height;
    dpr = Math.min(devicePixelRatio, 1.5);
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    raster = rasterize(element, host, 1);
    const data = raster
      .getContext("2d")
      .getImageData(0, 0, raster.width, raster.height).data;
    let count = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 128) count++;
    spacing = Math.max(3, Math.ceil(Math.sqrt(count / 1400)));
    particles = [];
    for (let y = 0; y < raster.height; y += spacing)
      for (let x = 0; x < raster.width; x += spacing)
        if (data[(y * raster.width + x) * 4 + 3] > 128)
          particles.push({ x, y, ax: x, ay: y, vx: 0, vy: 0, grab: 0 });
    links = connectParticles(particles, spacing);
    point = [width * 0.5, height * 0.5];
    energy = 0;
    held = false;
    trails = [];
    source.hide();
    wake();
  }
  function weights() {
    const r = 45 + detail * 4;
    for (const p of particles)
      p.grab = Math.max(
        0,
        1 - Math.hypot(p.ax - point[0], p.ay - point[1]) / r,
      );
  }
  function sample(next) {
    const now = performance.now(),
      elapsed = Math.max(0.016, (now - lastInput) * 0.001);
    drag = next.map((v, i) =>
      Math.max(-500, Math.min(500, (v - point[i]) / elapsed)),
    );
    point = next;
    lastInput = now;
    trails.push({ x: point[0], y: point[1], vx: drag[0], vy: drag[1], time });
    if (trails.length > 12) trails.shift();
  }
  function render(now, dt) {
    if (dead || !visible || document.hidden) return;
    time += dt;
    if (flow && !reduced.matches) {
      sample([
        width * (0.5 + Math.sin(time * 1.2) * 0.28),
        height * (0.5 + Math.cos(time * 1.6) * 0.14),
      ]);
      energy = 1.2;
      if (
        (mode === 44 || mode === 46 || mode === 48) &&
        time - autoPulse > 1.6
      ) {
        autoPulse = time;
        burstTime = time;
        weights();
        if (mode === 48) {
          for (const p of particles) {
            p.vx += p.grab * 250 * amount;
            p.vy -= p.grab * 180 * amount;
          }
        }
      }
    } else if (!held)
      energy = Math.max(0, energy - dt * (mode === 46 ? 0.34 : 0.55));
    trails = trails.filter((t) => time - t.time < 2.6);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    if (reduced.matches) {
      resetParticles(particles);
      energy = 0;
      trails = [];
      ctx.drawImage(raster, 0, 0);
      return;
    }
    const steps = Math.max(1, Math.ceil(dt / (1 / 120)));
    let movement = 0;
    const state = {
      mode,
      energy,
      point,
      amount,
      time,
      height,
      radius: 45 + detail * 4,
      spacing,
      held,
      drag,
      trails,
      burstTime,
      pull: [point[0] - down[0], point[1] - down[1]],
    };
    for (let i = 0; i < steps; i++)
      movement = stepPhysics(particles, links, state, dt / steps);
    if (
      !held &&
      energy <= 0 &&
      (mode !== 47 || !trails.length) &&
      movement < 0.12
    ) {
      ctx.drawImage(raster, 0, 0);
      resetParticles(particles);
      return;
    }
    // Active physics draws only the moving ink; restore the raster once settled.
    ctx.globalAlpha = 1;
    if (mode === 40 || mode === 48) {
      ctx.strokeStyle = "rgba(180,210,255,.35)";
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      for (const p of particles) {
        if (Math.hypot(p.x - p.ax, p.y - p.ay) > 1) {
          ctx.moveTo(p.ax, p.ay);
          ctx.lineTo(p.x, p.y);
        }
      }
      ctx.stroke();
    }
    if (mode === 43) {
      ctx.strokeStyle = "rgba(163,236,198,.55)";
      ctx.lineWidth = 0.65;
      ctx.beginPath();
      for (const [i, j] of links) {
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
      }
      ctx.stroke();
    }
    ctx.fillStyle = colors[mode] || "#fff";
    ctx.beginPath();
    for (const p of particles) {
      const r = spacing * (mode === 43 ? 0.23 : 0.4);
      ctx.moveTo(p.x + r, p.y);
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.globalAlpha = 1;
    if (mode === 44 && energy > 0.05) {
      const r = (time - burstTime) * 170;
      ctx.strokeStyle = `rgba(255,220,166,${Math.max(0, 0.3 * (1 - r / 500))})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(point[0], point[1], r, 0, Math.PI * 2);
      ctx.stroke();
    }
    return true;
  }
  const loop = createFrameLoop(render);
  const wake = () => loop.wake();
  function move(e) {
    if (frozen) return;
    const b = host.getBoundingClientRect();
    sample([e.clientX - b.left, e.clientY - b.top]);
    energy = 1.2;
    if (mode === 46) weights();
    wake();
  }
  function press(e) {
    if (frozen) return;
    move(e);
    held = true;
    down = [...point];
    weights();
    burstTime = time;
    host.setPointerCapture?.(e.pointerId);
  }
  function release(e) {
    if (!held) return;
    held = false;
    if (mode === 48) energy = 0;
    if (e && host.hasPointerCapture?.(e.pointerId))
      host.releasePointerCapture(e.pointerId);
    wake();
  }
  function pulse() {
    if (frozen) return;
    held = false;
    point = [width * 0.5, height * 0.5];
    down = [...point];
    energy = 1.5;
    burstTime = time;
    weights();
    trails = [{ x: point[0], y: point[1], vx: 350, vy: -120, time }];
    if (mode === 48)
      for (const p of particles) {
        p.vx += p.grab * 300 * amount;
        p.vy -= p.grab * 160 * amount;
      }
    wake();
  }
  let measuredLayout = "";
  const resizeRefresh = () => {
    const key = layoutKey(element, host);
    if (key !== measuredLayout) {
      measuredLayout = key;
      refresh();
    }
  };
  const resize = new ResizeObserver(resizeRefresh);
  resize.observe(host);
  const intersection = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (!visible) held = false;
    loop.block("offscreen", !visible);
  });
  intersection.observe(host);
  const visibility = () => {
    if (document.hidden) held = false;
    loop.block("hidden", document.hidden);
  };
  document.addEventListener("visibilitychange", visibility);
  host.addEventListener("pointermove", move);
  host.addEventListener("pointerdown", press);
  host.addEventListener("pointerup", release);
  host.addEventListener("pointercancel", release);
  host.addEventListener("lostpointercapture", release);
  reduced.addEventListener("change", wake);
  document.fonts.ready.then(refresh);
  refresh();
  return {
    supported: true,
    refresh,
    pulse,
    setMode(v) {
      mode = v;
      held = false;
      energy = 0;
      trails = [];
      resetParticles(particles);
      wake();
    },
    setDetail(v) {
      v = boundedNumber(v, 1, 24, detail);
      detail = v;
      pulse();
    },
    setIntensity(v) {
      v = boundedNumber(v, 0, 1, amount);
      amount = v;
      pulse();
    },
    setFlow(v) {
      flow = v;
      wake();
    },
    setFrozen(v) {
      frozen = v;
      loop.block("frozen", v);
    },
    destroy() {
      dead = true;
      loop.destroy();
      resize.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerdown", press);
      host.removeEventListener("pointerup", release);
      host.removeEventListener("pointercancel", release);
      host.removeEventListener("lostpointercapture", release);
      reduced.removeEventListener("change", wake);
      canvas.remove();
      source.restore();
    },
  };
}
