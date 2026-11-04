import { nativeFallback } from "./renderer-utils.js";
import { createLayerEditor } from "./layer-editor.js?v=six-layers";
import { attach } from "./material.js?v=package-1";
import { experiments as studies } from "./experiments.js";
import { attachParticles } from "./particles.js";
import { attachTransformations } from "./transformations.js";
import { engineFor, isElementMode } from "./effect-modes.js";
const catalog = [
  {
    mode: 99,
    name: "Plain text",
    group: "Basics",
    description: "Start with clean type and add a signal treatment.",
    hint: "Choose RGB, pixels, or dither below.",
    technique: "Native mask",
  },
  ...studies,
  ...[
    "Capillary ink",
    "Interference",
    "Elastic skin",
    "Ferrotype",
    "Contour echo",
    "Thermal memory",
    "Orbital dust",
    "Chromatic ghost",
  ].map((name, mode) => ({
    name,
    mode,
    group: "Originals",
    description: "An original material study.",
    hint: "Move across the text to disturb its surface.",
    technique: "Glyph distance field",
  })),
];
// Curated browsing list. Renderers and package exports remain compatible.
const omittedModes = new Set([2, 4, 6, 7, 45, 47, 52, 53, 57, 62]);
const elementNames = new Map([[54, "Smoke"], [63, "Water"], [65, "Fire"], [66, "Wind"]]);
const experiments = catalog.filter(effect => !omittedModes.has(effect.mode)).map(effect => ({
  ...effect,
  name: elementNames.get(effect.mode) ?? effect.name,
  group: effect.mode === 46 ? "Physics" : effect.group,
}));
const engineKey = (mode) =>
  mode === 99 ? "gpu" : mode < 17 ? "original" : engineFor(mode);
const headings = [...document.querySelectorAll(".stage h2")];
const effects = [];
const input = document.querySelector("#text");
input.addEventListener("input", () => {
  headings.forEach((h) => (h.textContent = input.value || " "));
  effects.forEach((e) => e.refresh());
});
document.querySelectorAll("[data-font]").forEach((button) =>
  button.addEventListener("click", async () => {
    document
      .querySelectorAll("[data-font]")
      .forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
    const kind = button.dataset.font;
    headings.forEach((h) => {
      h.lang = kind === "korean" ? "ko" : "en";
      h.style.fontFamily =
        kind === "serif"
          ? "'Playfair Display', Georgia, serif"
          : kind === "korean"
            ? "'Noto Sans KR', sans-serif"
            : "'DM Sans', sans-serif";
      h.style.fontWeight = kind === "serif" ? "600" : "700";
    });
    if (kind === "korean") input.value = "호기심을 잃지 마세요";
    else if (input.value === "호기심을 잃지 마세요")
      input.value = "Stay a little curious.";
    input.dispatchEvent(new Event("input"));
    await document.fonts.ready;
    effects.forEach((e) => {
      e.refresh();
      e.pulse();
    });
  }),
);
initializeBench();
if (effects.some((e) => !e.supported))
  document.querySelector("#status").textContent =
    "Native text fallback · WebGL unavailable";
await document.fonts.ready;
effects.forEach((e) => e.pulse());

function initializeBench() {
  const heading = document.querySelector("#bench-text"),
    list = document.querySelector("#experiment-list");
  let current = studies[0],
    filter = "All",
    strength = 0.8,
    scale = 10,
    auto = true,
    frozen = false,
    consumed = false,
    renderer;
  let stacking = false;
  let saved = new Set();
  try {
    const stored = JSON.parse(localStorage.getItem("materia-kept") || "[]");
    saved = new Set(Array.isArray(stored) ? stored : []);
  } catch {}
  const filtered = () =>
    experiments.filter(
      (e) =>
        filter === "All" ||
        (filter === "Kept" ? saved.has(e.mode) : e.group === filter),
    );
  const proxy = {
    refresh() {
      renderer?.refresh();
    },
    pulse() {
      renderer?.pulse();
    },
    setFlow(v) {
      auto = v;
      renderer?.setFlow(v);
      document
        .querySelector("#bench-flow")
        .setAttribute("aria-pressed", String(v));
    },
    setFrozen(v) {
      frozen = v;
      renderer?.setFrozen(v);
      document
        .querySelector("#bench-freeze")
        .setAttribute("aria-pressed", String(v));
    },
    get supported() {
      return renderer?.supported ?? true;
    },
  };
  effects.push(proxy);
  const $ = (id) => document.getElementById(id);
  const layerEditor = createLayerEditor({
    mount(effect, count) {
      renderer?.destroy();
      renderer = effect.mount(heading, { color: [0.86, 0.92, 1] });
      $("element-mobile-note").hidden = true;
      stacking = true;
      document.querySelector("#bench").classList.add("has-stack");
      $("studio-preset").value = "";
      $("bench-family").textContent = "COMPOSITION / ORDERED LAYERS";
      $("bench-name").textContent = "Layer composition";
      $("bench-description").textContent =
        "Applied top to bottom. Each layer transforms the result above it.";
      $("bench-hint").textContent =
        "Reorder layers to change the result. Disable a layer to compare.";
      $("element-states").hidden = true;
      $("bench-engine").textContent = `WEBGL / ${count} LAYERS`;
      $("bench-technique").textContent = "One canvas · two reusable textures";
      renderer.setFlow(auto);
      renderer.setFrozen(frozen);
      renderer.pulse();
    },
    update(index, changes) {
      $("studio-preset").value = "";
      renderer.setLayer(index, changes);
      renderer.pulse();
    },
  });
  function preset(value) {
    if (value === "signature") {
      layerEditor.defaultComposition();
      proxy.setFlow(true);
      $("studio-preset").value = value;
      return;
    }
    const settings = {
      rgb: [23, 1, 80, 17, 85, 16],
      pixel: [24, 2, 55, 12, 90, 12],
      print: [25, 3, 60, 14, 85, 8],
      water: [63, 0, 80, 16, 70, 10],
      pure: [99, 1, 0, 10, 85, 12],
    };
    const cfg = settings[value] ?? [17, 0, 80, 10, 70, 10];
    strength = cfg[2] / 100;
    scale = cfg[3];
    $("bench-strength").value = cfg[2];
    $("bench-strength-label").value = cfg[2] + "%";
    $("bench-scale").value = scale;
    $("bench-scale-label").value = scale;
    filter = "All";
    document
      .querySelectorAll("[data-family]")
      .forEach((b) =>
        b.setAttribute("aria-pressed", String(b.dataset.family === "All")),
      );
    $("elements-intro").hidden = true;
    select(
      experiments.find((e) => e.mode === cfg[0]),
      cfg[1],
      cfg[4] / 100,
      cfg[5],
    );
    renderer.setIntensity(strength);
    renderer.setDetail(scale);
    proxy.setFlow(true);
    $("studio-preset").value = value;
  }
  $("studio-preset").addEventListener("change", (e) => preset(e.target.value));
  $("studio-reset").addEventListener("click", () => {
    $("studio-preset").value = "";
    preset("signature");
    proxy.setFrozen(false);
    proxy.setFlow(true);
  });
  document.querySelector("#effect-browser").addEventListener("toggle", (event) => {
    if (event.currentTarget.open) renderList();
  });
  function renderList() {
    list.replaceChildren();
    const entries = filtered();
    document.querySelector("#catalog-count").textContent = entries.length;
    if (!entries.length) {
      const p = document.createElement("p");
      p.className = "catalog-empty";
      p.textContent =
        "Nothing kept yet. Use ☆ Keep on a study you want to revisit.";
      list.append(p);
    }
    for (const e of entries) {
      const button = document.createElement("button");
      button.className = "experiment-option";
      button.dataset.experiment = e.mode;
      button.setAttribute("aria-pressed", String(e === current));
      button.setAttribute("aria-label", e.name);
      const number = document.createElement("span");
      number.className = "number";
      number.textContent = String(experiments.indexOf(e) + 1).padStart(2, "0");
      const name = document.createElement("span");
      name.textContent = e.name + (e.mode === 63 ? " · Desktop experiment" : "");
      button.append(number, name);
      if (saved.has(e.mode)) {
        const star = document.createElement("span");
        star.className = "star";
        star.textContent = "★";
        button.append(star);
      }
      button.addEventListener("click", () => select(e));
      list.append(button);
    }
  }
  function select(e, finish = 0, finishStrength = 0.7, finishScale = 10) {
    if (
      layerEditor.load(
        e.mode,
        strength,
        scale,
        finish,
        finishStrength,
        finishScale,
      )
    ) {
      current = e;
      renderList();
      return;
    }
    $("studio-preset").value = "";
    const mobile = matchMedia("(pointer: coarse), (max-width: 767px)").matches;
    const desktopOnly = mobile && e.mode === 63;
    $("element-mobile-note").hidden = !desktopOnly;
    const changedEngine =
      stacking || !renderer || engineKey(e.mode) !== engineKey(current.mode) ||
      (mobile && (e.mode === 63 || current.mode === 63));
    stacking = false;
    layerEditor.reset();
    document.querySelector("#bench").classList.remove("has-stack");
    current = e;
    if (changedEngine) {
      renderer?.destroy();
      renderer = desktopOnly
        ? nativeFallback(document.createElement("canvas"))
        : e.mode >= 49 && e.mode !== 99
          ? attachTransformations(heading, { mode: e.mode })
          : e.mode >= 39 && e.mode !== 99
            ? attachParticles(heading, { mode: e.mode })
            : attach(heading, {
                mode: e.mode,
                composition: e.mode >= 17,
                color: [0.86, 0.92, 1],
              });
      renderer.setIntensity(strength);
      renderer.setDetail(scale);
      renderer.setFlow(auto);
      renderer.setFrozen(frozen);
    } else renderer.setMode(e.mode);
    const hasStates = isElementMode(e.mode);
    document.querySelector("#element-states").hidden = !hasStates || desktopOnly;

    renderer.setConsumed?.(consumed);
    document
      .querySelectorAll("[data-element-state]")
      .forEach((b) =>
        b.setAttribute(
          "aria-pressed",
          String((b.dataset.elementState === "consumed") === consumed),
        ),
      );
    document.querySelector("#bench-family").textContent =
      `${e.group.toUpperCase()} / ${String(experiments.indexOf(e) + 1).padStart(2, "0")} OF ${experiments.length}`;
    document.querySelector("#bench-name").textContent = e.name;
    document.querySelector("#bench-description").textContent = e.description;
    document.querySelector("#bench-hint").textContent = e.hint;
    document.querySelector("#bench-technique").textContent = e.technique;
    document.querySelector("#bench-engine").textContent =
      e.mode >= 49 && e.mode !== 99
        ? "CANVAS 2D / MATERIAL TRANSFORM"
        : e.mode >= 39 && e.mode !== 99
          ? "CANVAS 2D / SPRING PHYSICS"
          : "WEBGL / 1 PASS";
    document
      .querySelector("#keep-study")
      .setAttribute("aria-pressed", String(saved.has(e.mode)));
    document.querySelector("#keep-study").textContent = saved.has(e.mode)
      ? "★ Kept"
      : "☆ Keep";

    renderList();
    renderer.pulse();
  }
  for (const family of [
    "All",
    "Basics",
    "Originals",
    "Optics",
    "Geometry",
    "Matter",
    "Signal",
    "Time",
    "Physics",
    "Elements",
    "Prism",
    "Glyphs",
    "Kept",
  ]) {
    const button = document.createElement("button");
    button.textContent = family;
    button.dataset.family = family;
    button.setAttribute("aria-pressed", String(family === filter));
    button.addEventListener("click", () => {
      filter = family;
      document.querySelector("#elements-intro").hidden = family !== "Elements";
      document
        .querySelectorAll("[data-family]")
        .forEach((b) =>
          b.setAttribute("aria-pressed", String(b.dataset.family === family)),
        );
      renderList();
    });
    document.querySelector(".family-tabs").append(button);
  }
  function step(dir) {
    const entries = filtered();
    if (!entries.length) return;
    select(
      entries[
        (Math.max(0, entries.indexOf(current)) + dir + entries.length) %
          entries.length
      ],
    );
  }
  document.querySelectorAll("[data-element-state]").forEach((button) =>
    button.addEventListener("click", () => {
      consumed = button.dataset.elementState === "consumed";
      renderer.setConsumed?.(consumed);
      document
        .querySelectorAll("[data-element-state]")
        .forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
    }),
  );
  document
    .querySelector("#previous-study")
    .addEventListener("click", () => step(-1));
  document
    .querySelector("#next-study")
    .addEventListener("click", () => step(1));
  document.querySelector("#surprise").addEventListener("click", () => {
    const entries = filtered().filter((e) => e !== current);
    if (entries.length)
      select(entries[Math.floor(Math.random() * entries.length)]);
  });
  document.querySelector("#keep-study").addEventListener("click", () => {
    if (saved.has(current.mode)) saved.delete(current.mode);
    else saved.add(current.mode);
    try {
      localStorage.setItem("materia-kept", JSON.stringify([...saved]));
    } catch {}
    document
      .querySelector("#keep-study")
      .setAttribute("aria-pressed", String(saved.has(current.mode)));
    document.querySelector("#keep-study").textContent = saved.has(current.mode)
      ? "★ Kept"
      : "☆ Keep";
    renderList();
  });
  document.querySelector("#bench-strength").addEventListener("input", (e) => {
    $("studio-preset").value = "";
    strength = Number(e.target.value) / 100;
    document.querySelector("#bench-strength-label").value =
      e.target.value + "%";
    renderer.setIntensity(strength);
  });
  document.querySelector("#bench-scale").addEventListener("input", (e) => {
    $("studio-preset").value = "";
    scale = Number(e.target.value);
    document.querySelector("#bench-scale-label").value = scale;
    renderer.setDetail(scale);
  });
  document
    .querySelector("#bench-flow")
    .addEventListener("click", () => proxy.setFlow(!auto));
  document
    .querySelector("#bench-freeze")
    .addEventListener("click", () => proxy.setFrozen(!frozen));
  preset("signature");
}
