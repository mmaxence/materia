import { createFrameLoop } from "./lib/internal/frame-loop.js";
import { sourcePresentation } from "./lib/internal/renderer-utils.js";

// Actual independent letter planes in CSS perspective, with lit extrusion layers.
// The original heading remains the accessible layout source.
export const spatialTitle = {
  name: "spatialTitle",
  kind: "spatial",
  mount(element, options) {
    const host = options.host,
      source = sourcePresentation(element);
    const layer = document.createElement("div");
    layer.className = "spatial-title";
    layer.setAttribute("aria-hidden", "true");
    host.append(layer);
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let letters = [],
      elapsed = 0,
      auto = true,
      dead = false,
      px = 0,
      py = 0,
      tx = 0,
      ty = 0;
    const smooth = (a, b, x) => {
      const v = Math.max(0, Math.min(1, (x - a) / (b - a)));
      return v * v * (3 - 2 * v);
    };
    function refresh() {
      if (dead) return;
      source.restore();
      layer.replaceChildren();
      letters = [];
      const node = element.firstChild,
        box = host.getBoundingClientRect(),
        style = getComputedStyle(element);
      if (node?.nodeType !== 3) return;
      const range = document.createRange();
      let index = 0;
      for (const char of node.textContent) {
        range.setStart(node, index);
        index += char.length;
        range.setEnd(node, index);
        const r = range.getBoundingClientRect();
        if (!char.trim()) continue;
        const glyph = document.createElement("span");
        glyph.className = "spatial-glyph";
        Object.assign(glyph.style, {
          left: `${r.left - box.left}px`,
          top: `${r.top - box.top}px`,
          width: `${r.width}px`,
          height: `${r.height}px`,
          font: style.font,
          lineHeight: `${r.height}px`,
          letterSpacing: "0px",
        });
        for (const kind of ["depth", "red", "blue", "face", "glitch"]) {
          const plane = document.createElement("span");
          plane.className = `glyph-${kind}`;
          plane.textContent = char;
          glyph.append(plane);
        }
        layer.append(glyph);
        letters.push(glyph);
      }
      if (!reduced.matches) source.hide();
      layer.hidden = reduced.matches;
      loop.wake();
    }
    const loop = createFrameLoop((now, dt) => {
      if (reduced.matches) return false;
      elapsed += dt;
      const t = elapsed % 12;
      px += (tx - px) * Math.min(1, dt * 6);
      py += (ty - py) * Math.min(1, dt * 6);
      const flight = smooth(0.7, 2.7, t) * (1 - smooth(6.6, 9.1, t));
      const cursorX = auto ? Math.sin(elapsed * 0.48) * 0.28 : px;
      const cursorY = auto ? Math.cos(elapsed * 0.4) * 0.16 : py;
      const glitchPhase = elapsed % 2.7;
      const glitch = glitchPhase > 2.38 && glitchPhase < 2.66;
      letters.forEach((glyph, i) => {
        const u = i / Math.max(1, letters.length - 1),
          phase = u * Math.PI * 2 + elapsed * 0.65;
        const z = flight * (Math.sin(phase) * 65 - 15);
        const x =
          flight * ((0.5 - u) * 30 + 18) + cursorX * flight * ((i % 3) - 1) * 8;
        const y = flight * Math.sin(phase * 0.8) * 28;
        const jitter = glitch
          ? Math.sin(Math.floor(elapsed * 24) * 13 + i * 8) * 5
          : 0;
        glyph.style.transform = `translate3d(${x + jitter}px,${y}px,${z}px) rotateX(${flight * (-cursorY * 24 + Math.cos(phase) * 12)}deg) rotateY(${flight * (cursorX * 26 + Math.sin(phase) * 24)}deg) rotateZ(${flight * Math.sin(phase) * 3}deg)`;
        glyph.style.setProperty(
          "--split",
          `${glitch ? 4 + Math.abs(jitter) : 0.4 + flight * 1.7}px`,
        );
        glyph.style.setProperty(
          "--channel-opacity",
          glitch ? ".85" : String(0.15 + flight * 0.3),
        );
        glyph.style.setProperty("--depth-opacity", String(0.1 + flight * 0.9));
        glyph.style.setProperty("--glitch-opacity", glitch ? "1" : "0");
      });
      return true;
    });
    const move = (e) => {
      const r = host.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width) * 2 - 1;
      ty = ((e.clientY - r.top) / r.height) * 2 - 1;
    };
    host.addEventListener("pointermove", move);
    const resize = new ResizeObserver(refresh);
    resize.observe(host);
    const visibility = () => loop.block("hidden", document.hidden);
    document.addEventListener("visibilitychange", visibility);
    visibility();
    reduced.addEventListener("change", refresh);
    document.fonts.ready.then(refresh);
    refresh();
    return {
      supported: true,
      refresh,
      pulse() {
        elapsed = 0;
        loop.wake();
      },
      setIntensity() {},
      setDetail() {},
      setFlow(v) {
        auto = v;
      },
      setFrozen(v) {
        loop.block("frozen", v);
      },
      destroy() {
        dead = true;
        loop.destroy();
        resize.disconnect();
        host.removeEventListener("pointermove", move);
        document.removeEventListener("visibilitychange", visibility);
        reduced.removeEventListener("change", refresh);
        layer.remove();
        source.restore();
      },
    };
  },
};
