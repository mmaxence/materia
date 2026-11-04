import { attachTransformations } from "./internal/transformations.js";
export const teaSteam = Object.freeze({
  name: "teaSteam",
  kind: "elements",
  mount(element, options = {}) {
    if (options.signal)
      throw new TypeError(
        "Signal chaining currently supports GPU effects only.",
      );
    const renderer = attachTransformations(element, { ...options, mode: 52 });
    renderer.setConsumed?.(options.consumed ?? false);
    return renderer;
  },
});
export const incense = Object.freeze({
  name: "incense",
  kind: "elements",
  mount(element, options = {}) {
    if (options.signal)
      throw new TypeError(
        "Signal chaining currently supports GPU effects only.",
      );
    const renderer = attachTransformations(element, { ...options, mode: 53 });
    renderer.setConsumed?.(options.consumed ?? false);
    return renderer;
  },
});
export const smoke = Object.freeze({
  name: "smoke",
  kind: "elements",
  mount(element, options = {}) {
    if (options.signal)
      throw new TypeError(
        "Signal chaining currently supports GPU effects only.",
      );
    const renderer = attachTransformations(element, { ...options, mode: 54 });
    renderer.setConsumed?.(options.consumed ?? false);
    return renderer;
  },
});
export const consumedVapor = Object.freeze({
  name: "consumedVapor",
  kind: "elements",
  mount(element, options = {}) {
    if (options.signal)
      throw new TypeError(
        "Signal chaining currently supports GPU effects only.",
      );
    const renderer = attachTransformations(element, { ...options, mode: 62 });
    renderer.setConsumed?.(options.consumed ?? true);
    return renderer;
  },
});
export const waterfall = Object.freeze({
  name: "waterfall",
  kind: "elements",
  mount(element, options = {}) {
    if (options.signal)
      throw new TypeError(
        "Signal chaining currently supports GPU effects only.",
      );
    const renderer = attachTransformations(element, { ...options, mode: 63 });
    renderer.setConsumed?.(options.consumed ?? false);
    return renderer;
  },
});
export const flame = Object.freeze({
  name: "flame",
  kind: "elements",
  mount(element, options = {}) {
    if (options.signal)
      throw new TypeError(
        "Signal chaining currently supports GPU effects only.",
      );
    const renderer = attachTransformations(element, { ...options, mode: 65 });
    renderer.setConsumed?.(options.consumed ?? false);
    return renderer;
  },
});
export const tradeWinds = Object.freeze({
  name: "tradeWinds",
  kind: "elements",
  mount(element, options = {}) {
    if (options.signal)
      throw new TypeError(
        "Signal chaining currently supports GPU effects only.",
      );
    const renderer = attachTransformations(element, { ...options, mode: 66 });
    renderer.setConsumed?.(options.consumed ?? false);
    return renderer;
  },
});
