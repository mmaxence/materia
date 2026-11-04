import { gpuEffect } from "../internal/gpu-effect.js";
export const gravityWell = /* @__PURE__ */ gpuEffect(
  "gravityWell",
  26,
  `
  float warp=1.+k*.8/(.2+radius*3.);q=pointer+delta*warp/aspect;
  a=glyph(q);c=mix(color,vec3(.86,.59,.96),k*.35);`,
);
