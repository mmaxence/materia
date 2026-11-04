import { signalEffect } from "../internal/signal-effect.js";
import { ditherBody } from "../internal/signal-patterns.js";
export const dither = /* @__PURE__ */ signalEffect("dither", 3, ditherBody);
