import { attachTransformations } from "./internal/transformations.js";
export const numbers = Object.freeze({
  name: "numbers",
  kind: "glyphs",
  mount(element, options = {}) {
    if (options.signal)
      throw new TypeError(
        "Signal chaining currently supports GPU effects only.",
      );
    const renderer = attachTransformations(element, { ...options, mode: 58 });
    renderer.setConsumed?.(options.consumed ?? false);
    return renderer;
  },
});
export const alphabet = Object.freeze({
  name: "alphabet",
  kind: "glyphs",
  mount(element, options = {}) {
    if (options.signal)
      throw new TypeError(
        "Signal chaining currently supports GPU effects only.",
      );
    const renderer = attachTransformations(element, { ...options, mode: 59 });
    renderer.setConsumed?.(options.consumed ?? false);
    return renderer;
  },
});
export const hangul = Object.freeze({
  name: "hangul",
  kind: "glyphs",
  mount(element, options = {}) {
    if (options.signal)
      throw new TypeError(
        "Signal chaining currently supports GPU effects only.",
      );
    const renderer = attachTransformations(element, { ...options, mode: 60 });
    renderer.setConsumed?.(options.consumed ?? false);
    return renderer;
  },
});
export const jamoRain = Object.freeze({
  name: "jamoRain",
  kind: "glyphs",
  mount(element, options = {}) {
    if (options.signal)
      throw new TypeError(
        "Signal chaining currently supports GPU effects only.",
      );
    const renderer = attachTransformations(element, { ...options, mode: 61 });
    renderer.setConsumed?.(options.consumed ?? false);
    return renderer;
  },
});
