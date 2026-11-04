import { stack, MAX_LAYERS } from "./lib/stack.js";
import * as optics from "./lib/optics.js";
import * as geometry from "./lib/geometry.js";
import * as signal from "./lib/signal.js";
const catalog = { ...optics, ...geometry, ...signal };
const label = (name) =>
  name
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .replace("Rgb", "RGB");
const icons = {
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  hidden: '<path d="M3 9c2 4 5 6 9 6s7-2 9-6M5 12l-2 3M9 14l-1 4M15 14l1 4M19 12l2 3"/>',
  settings: '<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2"/><circle cx="15" cy="17" r="2"/>',
  remove: '<path d="m6 6 12 12M6 18 18 6"/>',
  grip: '<path d="M9 5h.01M15 5h.01M9 12h.01M15 12h.01M9 19h.01M15 19h.01"/>',
};
const icon = (name) => `<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${icons[name]}</svg>`;
export function createLayerEditor({ mount, update }) {
  const root = document.getElementById("layer-editor");
  const list = document.getElementById("layer-list");
  let layers = [],
    active = false;
  const picker = document.createElement("select");
  for (const [family, effects] of Object.entries({
    Optics: optics,
    Geometry: geometry,
    Signal: signal,
  })) {
    const group = document.createElement("optgroup");
    group.label = family;
    for (const name of Object.keys(effects)) {
      const option = new Option(label(name), name);
      group.append(option);
    }
    picker.append(group);
  }
  picker.value = "rgbSplit";
  function compile() {
    mount(stack(layers), layers.length);
  }
  function render() {
    root.classList.toggle("is-active", active);
    root.hidden = !active;
    document.getElementById("layer-tools").hidden = !active;
    document.getElementById("layer-add").disabled = layers.length >= MAX_LAYERS;
    const scrollTop = list.scrollTop;
    list.replaceChildren();
    if (!active) return;
    layers.forEach((layer, index) => {
      const row = document.createElement("li");
      row.className = "layer-row";
      const title = document.createElement("div");
      title.className = "layer-title";
      const toggle = document.createElement("button");
      toggle.className = "layer-visibility";
      const syncVisibility = () => {
        const visible = layer.enabled !== false;
        toggle.innerHTML = icon(visible ? "eye" : "hidden");
        toggle.setAttribute("aria-pressed", String(visible));
        toggle.setAttribute("aria-label", `${visible ? "Hide" : "Show"} ${label(layer.effect.name)} layer ${index + 1}`);
        toggle.title = visible ? "Hide layer" : "Show layer";
        row.classList.toggle("layer-hidden", !visible);
      };
      syncVisibility();
      toggle.addEventListener("click", () => {
        layer.enabled = layer.enabled === false;
        syncVisibility();
        update(index, { enabled: layer.enabled });
      });
      const selector = picker.cloneNode(true);
      selector.removeAttribute("id");
      selector.className = "layer-selector";
      selector.setAttribute("aria-label", `Effect for layer ${index + 1}`);
      selector.value = layer.effect.name;
      selector.addEventListener("change", () => {
        layer.effect = catalog[selector.value];
        compile();
        render();
        list
          .querySelectorAll(".layer-selector")
          [index].focus({ preventScroll: true });
      });
      title.append(selector);
      const details = document.createElement("div");
      details.className = "layer-popup";
      details.id = `layer-settings-${index}`;
      details.setAttribute("popover", "auto");
      details.setAttribute("role", "dialog");
      details.setAttribute(
        "aria-label",
        `Settings for ${label(layer.effect.name)} layer ${index + 1}`,
      );
      const settings = document.createElement("button");
      settings.className = "layer-settings";
      settings.innerHTML = icon("settings");
      settings.setAttribute(
        "aria-label",
        `Settings for ${label(layer.effect.name)} layer ${index + 1}`,
      );
      settings.setAttribute("popovertarget", details.id);
      settings.setAttribute("aria-expanded", "false");
      settings.addEventListener("click", () => {
        const box = settings.getBoundingClientRect();
        details.style.left = `${Math.max(12, Math.min(innerWidth - 260, box.right - 240))}px`;
        details.style.top = `${Math.max(12, Math.min(innerHeight - 200, box.bottom + 8))}px`;
      });
      details.addEventListener("toggle", () =>
        settings.setAttribute(
          "aria-expanded",
          String(details.matches(":popover-open")),
        ),
      );
      const actions = document.createElement("div");
      actions.className = "layer-inline-actions";
      const handle = document.createElement("button");
      handle.innerHTML = icon("grip");
      handle.className = "layer-drag";
      handle.setAttribute(
        "aria-label",
        `Move layer ${index + 1}. Drag or use arrow keys`,
      );
      row.dataset.layer = index;
      const moveTo = (destination) => {
        if (destination === index) return;
        const [moved] = layers.splice(index, 1);
        layers.splice(destination, 0, moved);
        compile();
        render();
        list
          .querySelectorAll(".layer-drag")
          [destination]?.focus({ preventScroll: true });
      };
      handle.addEventListener("keydown", (event) => {
        if (!["ArrowUp", "ArrowDown"].includes(event.key)) return;
        event.preventDefault();
        moveTo(
          Math.max(
            0,
            Math.min(
              layers.length - 1,
              index + (event.key === "ArrowUp" ? -1 : 1),
            ),
          ),
        );
      });
      handle.addEventListener("pointerdown", (event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        handle.setPointerCapture(event.pointerId);
        let destination = index;
        row.classList.add("dragging");
        const move = (event) => {
          const target = document
            .elementFromPoint(event.clientX, event.clientY)
            ?.closest("[data-layer]");
          list
            .querySelectorAll(".drop-target")
            .forEach((item) => item.classList.remove("drop-target"));
          if (target && list.contains(target)) {
            destination = Number(target.dataset.layer);
            target.classList.add("drop-target");
          }
        };
        const end = (event) => {
          handle.removeEventListener("pointermove", move);
          handle.removeEventListener("pointerup", end);
          handle.removeEventListener("pointercancel", end);
          row.classList.remove("dragging");
          list
            .querySelectorAll(".drop-target")
            .forEach((item) => item.classList.remove("drop-target"));
          if (handle.hasPointerCapture(event.pointerId))
            handle.releasePointerCapture(event.pointerId);
          if (event.type !== "pointercancel") moveTo(destination);
        };
        handle.addEventListener("pointermove", move);
        handle.addEventListener("pointerup", end);
        handle.addEventListener("pointercancel", end);
      });
      title.prepend(handle);
      const remove = document.createElement("button");
      remove.innerHTML = icon("remove");
      remove.setAttribute("aria-label", `Remove ${label(layer.effect.name)} layer ${index + 1}`);
      remove.title = "Remove layer";
      remove.disabled = layers.length === 1;
      remove.addEventListener("click", () => {
        layers.splice(index, 1);
        compile();
        render();
      });
      actions.append(toggle, settings, remove);
      row.append(title);
      for (const [key, text, max] of [
        ["strength", "Strength", 100],
        ["scale", "Scale", 24],
      ]) {
        const control = document.createElement("label");
        control.textContent = text;
        const output = document.createElement("output");
        const slider = document.createElement("input");
        slider.type = "range";
        slider.min = key === "strength" ? 0 : 1;
        slider.max = max;
        slider.value =
          key === "strength" ? Math.round(layer[key] * 100) : layer[key];
        output.value = slider.value + (key === "strength" ? "%" : "");
        slider.setAttribute(
          "aria-label",
          `${text} for ${label(layer.effect.name)} layer ${index + 1}`,
        );
        slider.addEventListener("input", () => {
          layer[key] = Number(slider.value) / (key === "strength" ? 100 : 1);
          output.value = slider.value + (key === "strength" ? "%" : "");
          update(index, { [key]: layer[key] });
        });
        control.append(output, slider);
        details.append(control);
      }
      title.append(actions);
      row.append(details);
      list.append(row);
    });
    list.scrollTop = scrollTop;
  }
  document.getElementById("layer-add").addEventListener("click", () => {
    if (layers.length >= MAX_LAYERS) return;
    layers.push({
      effect: signal.rgbSplit,
      strength: 0.65,
      scale: 10,
      enabled: true,
    });
    compile();
    render();
  });
  document.getElementById("layer-copy").addEventListener("click", async () => {
    const unique = [...new Set(layers.map((layer) => layer.effect.name))];
    const imports = unique
      .map((name) => {
        const family =
          name in optics ? "optics" : name in geometry ? "geometry" : "signal";
        return `import { ${name} } from '@materia/text/${family}/${name}';`;
      })
      .join("\n");
    const code = `import { createTextEffect } from '@materia/text';\nimport { stack } from '@materia/text/stack';\n${imports}\n\nconst fx = createTextEffect(document.querySelector('h1'), {\n  effect: stack([\n${layers.map((layer) => `    { effect: ${layer.effect.name}, strength: ${layer.strength}, scale: ${layer.scale}, enabled: ${layer.enabled !== false} },`).join("\n")}\n  ]),\n  auto: true,\n});\n// On unmount: fx.destroy();`;
    try {
      await navigator.clipboard.writeText(code);
      document.getElementById("layer-copy-status").textContent =
        "Stack code copied.";
    } catch {
      document.getElementById("layer-copy-status").textContent =
        "Clipboard unavailable in this browser.";
    }
  });
  render();
  return {
    defaultComposition() {
      layers = [
        {
          effect: geometry.accordion,
          strength: 0.28,
          scale: 12,
          enabled: true,
        },
        { effect: signal.dither, strength: 0.22, scale: 6, enabled: true },
        { effect: signal.rgbSplit, strength: 0.42, scale: 8, enabled: true },
      ];
      active = true;
      compile();
      render();
    },
    load(
      mode,
      strength = 0.7,
      scale = 12,
      finish = 0,
      finishStrength = 0.7,
      finishScale = 10,
    ) {
      const base = Object.values({ ...optics, ...geometry }).find(
        (effect) => effect.mode === mode,
      );
      const treatment = Object.values(signal).find(
        (effect) => effect.mode === finish,
      );
      if (!base && !(mode === 99 && treatment)) return false;
      layers = base ? [{ effect: base, strength, scale, enabled: true }] : [];
      if (treatment)
        layers.push({
          effect: treatment,
          strength: finishStrength,
          scale: finishScale,
          enabled: true,
        });
      if (finish === 5)
        layers.push(
          {
            effect: signal.pixelate,
            strength: finishStrength,
            scale: finishScale,
            enabled: true,
          },
          {
            effect: signal.rgbSplit,
            strength: finishStrength,
            scale: finishScale,
            enabled: true,
          },
        );
      active = true;
      compile();
      render();
      return true;
    },
    reset() {
      active = false;
      layers = [];
      render();
    },
  };
}
