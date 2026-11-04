import { spatialTitle } from "./showcase-hero.js";
import { waterfall } from "./lib/elements.js";
import { createTextEffect } from "./lib/index.js?v=scroll-consumption";
import { transmission, impact, threshold, rubberPoster } from "./showcase-effects.js?v=threshold-lock";
import { accordion } from "./lib/geometry.js";
import { stack } from "./lib/stack.js";
import { rgbSplit, dither, scanlines, pixelate } from "./lib/signal.js";

const recipes = {
  play: { effect: rubberPoster, strength: 0.85, scale: 10 },
  water: { effect: waterfall, strength: 0.8, scale: 16, waterline: 0.65, consumptionRate: 1.8 },
  hero: {
    effect: spatialTitle,
    strength: 0.15,
    scale: 8,
  },
  orbit: {
    effect: transmission,
    signal: rgbSplit,
    strength: 0.34,
    scale: 12,
    signalStrength: 0.32,
    signalScale: 8,
  },
  print: {
    effect: impact,
    signal: dither,
    strength: 0.38,
    scale: 9,
    signalStrength: 0.4,
    signalScale: 8,
  },
  frequency: {
    effect: accordion,
    signal: scanlines,
    strength: 0.26,
    scale: 10,
    signalStrength: 0.48,
    signalScale: 8,
  },
  threshold: {
    effect: stack([
      { effect: threshold, strength: 0.42, scale: 15 },
      { effect: pixelate, strength: 0.22, scale: 4 },
      { effect: dither, strength: 0.28, scale: 7 },
      { effect: rgbSplit, strength: 0.3, scale: 7 },
    ]),
  },
};
function sceneCode(key, text) {
  const imports = ["import { createTextEffect } from '@materia/text';"];
  const recipe = recipes[key];
  let effectName = recipe.effect.name;
  if (key === "hero")
    imports.push("import { spatialTitle } from './showcase-hero.js';");
  else if (key === "water")
    imports.push("import { waterfall } from '@materia/text/elements';");
  else if (key === "play")
    imports.push("import { rubberPoster } from './showcase-effects.js';");
  else if (key === "frequency")
    imports.push(
      "import { accordion } from '@materia/text/geometry/accordion';",
    );
  else
    imports.push(
      `import { ${key === "orbit" ? "transmission" : key === "print" ? "impact" : "threshold"} } from './showcase-effects.js';`,
    );
  let definition = "";
  if (key === "threshold") {
    imports.push(
      "import { stack } from '@materia/text/stack';",
      "import { pixelate, dither, rgbSplit } from '@materia/text/signal';",
    );
    definition =
      "const treatment = stack([\n  { effect: threshold, strength: 0.42, scale: 15 },\n  { effect: pixelate, strength: 0.22, scale: 4 },\n  { effect: dither, strength: 0.28, scale: 7 },\n  { effect: rgbSplit, strength: 0.3, scale: 7 },\n]);\n\n";
    effectName = "treatment";
  } else if (recipe.signal)
    imports.push(
      `import { ${recipe.signal.name} } from '@materia/text/signal/${recipe.signal.name}';`,
    );
  const options = Object.entries(recipe)
    .filter(([key]) => key !== "effect")
    .map(
      ([key, value]) =>
        `  ${key}: ${key === "signal" ? value.name : JSON.stringify(value)},`,
    );
  return `${imports.join("\n")}\n\n// Text: ${JSON.stringify(text)}\n// Use a plain-text heading inside a positioned host with room for the effect.\n${["hero", "orbit", "print", "threshold", "play"].includes(key) ? "// Custom effect modules are included with the showcase source.\n" : ""}${key === "hero" ? "// Include the .spatial-title styles from showcase.css for the 3D letter planes.\n" : ""}${key === "water" ? "// The pool aligns at 65% of the host height; the background image is separate.\n" : ""}${definition}const fx = createTextEffect(document.querySelector('h1'), {\n  effect: ${effectName},\n${options.join("\n")}\n  auto: true,\n});\n\n// On unmount: fx.destroy();`;
}
for (const host of document.querySelectorAll("[data-scene]")) {
  const scene = host.closest(".scene,.showcase-hero");
  const button = document.createElement("button");
  button.className = "scene-copy";
  button.textContent = "Copy code";
  const heading = host.querySelector("h1,h2");
  button.setAttribute("aria-label", `Copy code for ${heading.textContent}`);
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(
        sceneCode(host.dataset.scene, heading.textContent),
      );
      button.textContent = "Copied";
    } catch {
      button.textContent = "Copy unavailable";
    }
    setTimeout(() => {
      button.textContent = "Copy code";
    }, 2000);
  });
  scene.append(button);
}
function watchWaterScroll(scene, host, fx) {
  if (!scene.classList.contains("scene-water")) return () => {};
  let pending = 0;
  const clamp = v => Math.max(0, Math.min(1, v));
  const update = () => {
    pending = 0;
    const rect = scene.getBoundingClientRect();
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const entry = clamp((innerHeight * .8 - rect.top) / (innerHeight * .65));
    const consumption = clamp((innerHeight * .22 - rect.top) / (innerHeight * .34));
    const parallax = reduced ? 0 : Math.max(-1, Math.min(1, -rect.top / rect.height)) * 70;
    const entrance = reduced ? 0 : (1-entry)*-85;
    scene.style.setProperty("--water-parallax", `${parallax}px`);
    host.style.setProperty("--water-entry", `${entrance}px`);
    // Image is 160px taller than the scene, centered, with its pool at 65%.
    const poolY = .65 * (rect.height + 160) - 80 + parallax;
    fx.setWaterline((poolY - entrance) / host.clientHeight);
    fx.setConsumptionProgress(reduced ? 0 : consumption);
  };
  const schedule = () => { if (!pending) pending = requestAnimationFrame(update); };
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  update();
  return () => {
    cancelAnimationFrame(pending);
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", schedule);
  };
}
function animateThreshold(scene) {
  if (!scene.classList.contains("scene-threshold")) return () => {};
  const frames = [...scene.querySelectorAll(".threshold-art i")];
  const light = scene.querySelector(".threshold-light");
  const smooth = (a, b, value) => {
    const t = Math.max(0, Math.min(1, (value - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  let request;
  function tick(now) {
    if (!paused && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Exactly the same envelope and RAF timestamp as the threshold shader.
      const phase = (now / 1000) % 10;
      const pull = smooth(0, 3.6, phase) * (1 - smooth(4, 8, phase));
      scene.style.setProperty("--portal-scale", String(1.08 - pull * .08));
      scene.style.setProperty("--portal-opacity", String(.55 + pull * .45));
    }
    request = requestAnimationFrame(tick);
  }
  frames.forEach(el => el.style.animation = "none");
  if (light) light.style.animation = "none";
  request = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(request);
}
let paused = false;
const active = new Map();
const motion = document.querySelector("#showcase-motion");
motion.addEventListener("click", () => {
  paused = !paused;
  motion.setAttribute("aria-pressed", String(paused));
  const label = paused ? "Resume motion" : "Pause motion";
  motion.setAttribute("aria-label", label);
  motion.title = label;
  document.documentElement.classList.toggle("showcase-paused", paused);
  active.forEach(({ fx }) => fx.setFrozen(paused));

});
// Visible studies own the GPU context and background animation lifecycle.
const observer = new IntersectionObserver(
  (entries) => {
    for (const { target, isIntersecting } of entries) {
      // Elements are desktop experiments; mobile retains the native title and photo.
      if (target.dataset.scene === "water" && matchMedia("(pointer: coarse), (max-width: 767px)").matches) continue;
      if (isIntersecting && !active.has(target)) {
        const fx = createTextEffect(target.querySelector("h1, h2"), {
          ...recipes[target.dataset.scene],
          host: target,
          auto: true,
          frozen: paused,
        });
        let idle;
        const scene = target.closest(".scene, .showcase-hero");
        scene.classList.add("scene-visible");
        const stopThreshold = animateThreshold(scene);
        const stopWaterScroll = watchWaterScroll(scene, target, fx);
        const leave = () => {
          clearTimeout(idle);
          fx.setAuto(true);
          if (target.dataset.scene === "play") { scene.style.setProperty("--play-x", "0px"); scene.style.setProperty("--play-y", "0px"); scene.style.setProperty("--play-turn", "0deg"); }
        };
        const move = (event) => {
          if (paused || matchMedia("(prefers-reduced-motion: reduce)").matches)
            return;
          fx.setAuto(false);
          const box = target.getBoundingClientRect();
          if (target.dataset.scene === "play") {
            const x = Math.max(-1, Math.min(1, (event.clientX-box.left)/box.width*2-1));
            const y = Math.max(-1, Math.min(1, (event.clientY-box.top)/box.height*2-1));
            scene.style.setProperty("--play-x", `${x*42}px`);
            scene.style.setProperty("--play-y", `${y*32}px`);
            scene.style.setProperty("--play-turn", `${x*12}deg`);
          }
          scene.style.setProperty(
            "--cursor-x",
            `${((event.clientX - box.left) / box.width) * 100}%`,
          );
          scene.style.setProperty(
            "--cursor-y",
            `${((event.clientY - box.top) / box.height) * 100}%`,
          );
          clearTimeout(idle);
          idle = setTimeout(leave, 1200);
        };
        const cleanup = () => {
          stopThreshold();
          stopWaterScroll();
          clearTimeout(idle);
          scene.classList.remove("scene-visible");
        };
        target.addEventListener("pointermove", move);
        target.addEventListener("pointerleave", leave);
        target.addEventListener("pointerup", leave);
        active.set(target, { fx, move, leave, cleanup });
      } else if (!isIntersecting && active.has(target)) {
        const { fx, move, leave, cleanup } = active.get(target);
        cleanup();
        target.removeEventListener("pointermove", move);
        target.removeEventListener("pointerleave", leave);
        target.removeEventListener("pointerup", leave);
        fx.destroy();
        active.delete(target);
      }
    }
  },
  { threshold: 0 },
);
document.querySelectorAll("[data-scene]").forEach((el) => observer.observe(el));
window.addEventListener("pagehide", () =>
  active.forEach(({ fx }) => fx.setFrozen(true)),
);
window.addEventListener("pageshow", () =>
  active.forEach(({ fx }) => fx.setFrozen(paused)),
);
