import { attachParticles } from "./internal/particles.js";
export const looseAtoms = Object.freeze({
  name: "looseAtoms",
  kind: "physics",
  mount(element, options = {}) {
    if (options.signal)
      throw new TypeError(
        "Signal chaining currently supports GPU effects only.",
      );
    const renderer = attachParticles(element, { ...options, mode: 39 });
    renderer.setConsumed?.(options.consumed ?? false);
    return renderer;
  },
});
export const threadPull = Object.freeze({
  name: "threadPull",
  kind: "physics",
  mount(element, options = {}) {
    if (options.signal)
      throw new TypeError(
        "Signal chaining currently supports GPU effects only.",
      );
    const renderer = attachParticles(element, { ...options, mode: 40 });
    renderer.setConsumed?.(options.consumed ?? false);
    return renderer;
  },
});
export const magneticWell = Object.freeze({
  name: "magneticWell",
  kind: "physics",
  mount(element, options = {}) {
    if (options.signal)
      throw new TypeError(
        "Signal chaining currently supports GPU effects only.",
      );
    const renderer = attachParticles(element, { ...options, mode: 41 });
    renderer.setConsumed?.(options.consumed ?? false);
    return renderer;
  },
});
export const orbitalCapture = Object.freeze({
  name: "orbitalCapture",
  kind: "physics",
  mount(element, options = {}) {
    if (options.signal)
      throw new TypeError(
        "Signal chaining currently supports GPU effects only.",
      );
    const renderer = attachParticles(element, { ...options, mode: 42 });
    renderer.setConsumed?.(options.consumed ?? false);
    return renderer;
  },
});
export const softBodyMesh = Object.freeze({
  name: "softBodyMesh",
  kind: "physics",
  mount(element, options = {}) {
    if (options.signal)
      throw new TypeError(
        "Signal chaining currently supports GPU effects only.",
      );
    const renderer = attachParticles(element, { ...options, mode: 43 });
    renderer.setConsumed?.(options.consumed ?? false);
    return renderer;
  },
});
export const shockwave = Object.freeze({
  name: "shockwave",
  kind: "physics",
  mount(element, options = {}) {
    if (options.signal)
      throw new TypeError(
        "Signal chaining currently supports GPU effects only.",
      );
    const renderer = attachParticles(element, { ...options, mode: 44 });
    renderer.setConsumed?.(options.consumed ?? false);
    return renderer;
  },
});
export const windTunnel = Object.freeze({
  name: "windTunnel",
  kind: "physics",
  mount(element, options = {}) {
    if (options.signal)
      throw new TypeError(
        "Signal chaining currently supports GPU effects only.",
      );
    const renderer = attachParticles(element, { ...options, mode: 45 });
    renderer.setConsumed?.(options.consumed ?? false);
    return renderer;
  },
});
export const fallingGrains = Object.freeze({
  name: "fallingGrains",
  kind: "physics",
  mount(element, options = {}) {
    if (options.signal)
      throw new TypeError(
        "Signal chaining currently supports GPU effects only.",
      );
    const renderer = attachParticles(element, { ...options, mode: 46 });
    renderer.setConsumed?.(options.consumed ?? false);
    return renderer;
  },
});
export const gestureWake = Object.freeze({
  name: "gestureWake",
  kind: "physics",
  mount(element, options = {}) {
    if (options.signal)
      throw new TypeError(
        "Signal chaining currently supports GPU effects only.",
      );
    const renderer = attachParticles(element, { ...options, mode: 47 });
    renderer.setConsumed?.(options.consumed ?? false);
    return renderer;
  },
});
export const slingshot = Object.freeze({
  name: "slingshot",
  kind: "physics",
  mount(element, options = {}) {
    if (options.signal)
      throw new TypeError(
        "Signal chaining currently supports GPU effects only.",
      );
    const renderer = attachParticles(element, { ...options, mode: 48 });
    renderer.setConsumed?.(options.consumed ?? false);
    return renderer;
  },
});
