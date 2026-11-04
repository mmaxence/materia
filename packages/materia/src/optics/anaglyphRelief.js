import { gpuEffect } from "../internal/gpu-effect.js";
export const anaglyphRelief = /* @__PURE__ */ gpuEffect(
  "anaglyphRelief",
  22,
  `
  float depth=(.3+.7*(1.-smoothstep(-5.,1.,sd(p))))*k;vec2 parallax=vec2(1.+(pointer.x-.5)*2.,(pointer.y-.5))*px*(4.+s)*depth;
  vec3 rgb=vec3(glyph(p-parallax),glyph(p+parallax),glyph(p+parallax));a=max(rgb.r,rgb.g);c=rgb/max(a,.001);`,
);
