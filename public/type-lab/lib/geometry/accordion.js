import { gpuEffect } from "../internal/gpu-effect.js";
export const accordion = /* @__PURE__ */ gpuEffect(
  "accordion",
  24,
  `
  float f=10.+s*1.7;float fold=sin((p.x-pointer.x)*f);
  q.x+=fold*k*.035;q.y+=(.5+.5*cos((p.x-pointer.x)*f))*k*.03;
  a=glyph(q);c*=1.-k*.22*(.5+.5*cos((p.x-pointer.x)*f));`,
);
