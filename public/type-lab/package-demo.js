import { createTextEffect } from "./lib/index.js";
import * as optics from "./lib/optics.js";
import * as geometry from "./lib/geometry.js";
import * as signals from "./lib/signal.js";
import * as physics from "./lib/physics.js";
import * as elements from "./lib/elements.js";
import * as glyphs from "./lib/glyphs.js";
const $ = (id) => document.getElementById(id),
  all = {
    ...optics,
    ...geometry,
    ...signals,
    ...physics,
    ...elements,
    ...glyphs,
  };
const families = {};
let controller,
  frozen = false;
for (const [group, effects] of Object.entries({
  optics,
  geometry,
  signal: signals,
  physics,
  elements,
  glyphs,
})) {
  if (group === "elements" && matchMedia("(pointer: coarse), (max-width: 767px)").matches) continue;
  const optgroup = document.createElement("optgroup");
  optgroup.label = group;
  for (const name of Object.keys(effects)) {
    const option = document.createElement("option");
    families[name] = group;
    option.value = name;
    option.textContent = name;
    optgroup.append(option);
  }
  $("effect").append(optgroup);
}
function updateSnippet() {
  const name = $("effect").value;
  const family = families[name];
  const path = ["optics", "geometry", "signal"].includes(family)
    ? `${family}/${name}`
    : family;
  const withSignal = all[name].kind === "gpu" && $("signal").checked;
  $("snippet").textContent = `import { createTextEffect } from '@materia/text';
import { ${name} } from '@materia/text/${path}';${withSignal ? "\nimport { rgbSplit } from '@materia/text/signal/rgbSplit';" : ""}

const fx = createTextEffect(document.querySelector('h2'), {
  effect: ${name},${withSignal ? "\n  signal: rgbSplit," : ""}
  auto: true,
});

// Trigger a disturbance.
fx.pulse();

// In your component cleanup:
// fx.destroy();`;
  $("copy-status").textContent = "";
}
function mount() {
  controller?.destroy();
  const effect = all[$("effect").value];
  $("signal").disabled = effect.kind !== "gpu";
  controller = createTextEffect($("heading"), {
    effect,
    signal:
      effect.kind === "gpu" && $("signal").checked
        ? signals.rgbSplit
        : undefined,
    auto: true,
    frozen,
  });
  $("destroy").disabled = false;
  $("pulse").disabled = false;
  $("freeze").disabled = false;
  updateSnippet();
  $("status").textContent = controller.supported
    ? `Mounted ${effect.name}. One accessible heading.`
    : "Native text fallback: renderer unavailable.";
}
$("effect").value = "vortex";
$("effect").addEventListener("change", mount);
$("signal").addEventListener("change", mount);
$("mount").addEventListener("click", mount);
$("destroy").addEventListener("click", () => {
  controller?.destroy();
  $("destroy").disabled = true;
  $("pulse").disabled = true;
  $("freeze").disabled = true;
  $("status").textContent = "Destroyed. Original text and styles restored.";
});
$("words").addEventListener("input", () => {
  $("heading").textContent = $("words").value;
});
$("pulse").addEventListener("click", () => controller?.pulse());
$("freeze").addEventListener("click", () => {
  frozen = !frozen;
  controller?.setFrozen(frozen);
  $("freeze").setAttribute("aria-pressed", String(frozen));
});
mount();

$("copy").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText($("snippet").textContent);
    $("copy-status").textContent = "Code copied.";
  } catch {
    $("copy-status").textContent =
      "Copy unavailable. Select the code above to copy it manually.";
  }
});
