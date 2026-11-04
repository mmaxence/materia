import { recipes } from "./composition-recipes.js";
import { attach } from "./material.js?v=package-1";

// One text mask, one renderer: shape -> signal treatment -> optional color grade.
export function initializeCompositions() {
  const $ = (id) => document.getElementById(id),
    stage = $("composition-stage");
  const renderer = attach($("mix-body"), {
    mode: 23,
    composition: true,
    color: [0.94, 0.95, 1],
  });
  let auto = true,
    frozen = false,
    compare = false;
  function treatment() {
    renderer.setFinish(
      compare ? 0 : +$("mix-treatment").value,
      +$("mix-density").value / 100,
      +$("mix-spread").value,
    );
  }
  function grade() {
    stage.style.filter = {
      none: "none",
      cold: "sepia(.25) hue-rotate(150deg) saturate(1.4)",
      noir: "grayscale(1)",
    }[$("mix-finish").value];
  }
  function custom() {
    document
      .querySelectorAll("[data-recipe]")
      .forEach((b) => b.setAttribute("aria-pressed", "false"));
    $("recipe-name").textContent = "Your composition";
    $("recipe-story").textContent =
      "Shape first, signal second. Use Shape only to see what the second treatment contributes.";
  }
  function select(i) {
    const recipe = recipes[i];
    for (const [id, key] of Object.entries({
      "mix-material": "material",
      "mix-treatment": "treatment",
      "mix-strength": "strength",
      "mix-density": "density",
      "mix-scale": "scale",
      "mix-spread": "spread",
      "mix-finish": "light",
    }))
      $(id).value = recipe[key];
    compare = false;
    $("mix-compare").setAttribute("aria-pressed", "false");
    $("recipe-name").textContent = recipe.name;
    $("recipe-story").textContent = recipe.story;
    document
      .querySelectorAll("[data-recipe]")
      .forEach((b) =>
        b.setAttribute("aria-pressed", String(+b.dataset.recipe === i)),
      );
    renderer.setMode(recipe.material);
    renderer.setIntensity(recipe.strength / 100);
    renderer.setDetail(recipe.scale);
    $("mix-strength-value").value = recipe.strength + "%";
    $("mix-density-value").value = recipe.density + "%";
    treatment();
    grade();
    renderer.pulse();
  }
  recipes.forEach((r, i) => {
    const button = document.createElement("button");
    button.textContent = r.name;
    button.dataset.recipe = i;
    button.addEventListener("click", () => select(i));
    $("recipes").append(button);
  });
  $("mix-material").addEventListener("change", () => {
    custom();
    renderer.setMode(+$("mix-material").value);
    renderer.pulse();
  });
  $("mix-treatment").addEventListener("change", () => {
    custom();
    treatment();
    renderer.pulse();
  });
  for (const [id, method, divisor] of [
    ["mix-strength", "setIntensity", 100],
    ["mix-scale", "setDetail", 1],
  ])
    $(id).addEventListener("input", () => {
      custom();
      renderer[method](+$(id).value / divisor);
      if ($(id + "-value")) $(id + "-value").value = $(id).value + "%";
    });
  for (const id of ["mix-density", "mix-spread"])
    $(id).addEventListener("input", () => {
      custom();
      treatment();
      if ($(id + "-value")) $(id + "-value").value = $(id).value + "%";
      renderer.pulse();
    });
  $("mix-finish").addEventListener("change", () => {
    custom();
    grade();
  });
  const controller = {
    get supported() {
      return renderer.supported;
    },
    refresh: () => renderer.refresh(),
    pulse: () => renderer.pulse(),
    setFlow(v) {
      auto = v;
      $("mix-auto").setAttribute("aria-pressed", String(v));
      renderer.setFlow(v);
    },
    setFrozen(v) {
      frozen = v;
      $("mix-freeze").setAttribute("aria-pressed", String(v));
      renderer.setFrozen(v);
    },
  };
  $("mix-auto").addEventListener("click", () => controller.setFlow(!auto));
  $("mix-freeze").addEventListener("click", () =>
    controller.setFrozen(!frozen),
  );
  $("mix-replay").addEventListener("click", controller.pulse);
  $("mix-compare").addEventListener("click", () => {
    compare = !compare;
    $("mix-compare").setAttribute("aria-pressed", String(compare));
    treatment();
  });
  stage.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      controller.pulse();
    }
  });
  select(0);
  controller.setFlow(auto);
  return controller;
}
