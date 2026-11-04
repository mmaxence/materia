import { gpuEffect } from "../internal/gpu-effect.js";
export const chromaticLens = /* @__PURE__ */ gpuEffect(
  "chromaticLens",
  17,
  `
  vec2 bend=delta/aspect*exp(-radius*3.)*k*.42;
  vec3 rgb=vec3(glyph(p-bend*.75),glyph(p-bend),glyph(p-bend*1.3));
  a=max(rgb.r,max(rgb.g,rgb.b));c=rgb/max(a,.001);`,
);
