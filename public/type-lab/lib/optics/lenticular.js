import { gpuEffect } from "../internal/gpu-effect.js";
export const lenticular = /* @__PURE__ */ gpuEffect(
  "lenticular",
  18,
  `
  float slat=mod(floor(p.x*size.x/(2.+s*.45)),2.)*2.-1.;
  q.x+=slat*k*(.008+abs(pointer.x-.5)*.035);
  a=glyph(q);c*=1.-k*.23*(slat*.5+.5);`,
);
