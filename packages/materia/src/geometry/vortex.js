import { gpuEffect } from "../internal/gpu-effect.js";
export const vortex = /* @__PURE__ */ gpuEffect(
  "vortex",
  23,
  `
  float angle=k*(1.2+s*.09)*exp(-radius*1.6);q=pointer+turn(angle)*delta/aspect;a=glyph(q);`,
);
