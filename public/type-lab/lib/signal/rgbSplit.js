import { signalEffect } from "../internal/signal-effect.js";
export const rgbSplit = /* @__PURE__ */ signalEffect(
  "rgbSplit",
  1,
  `vec2 shift=vec2(finishScale*k,finishScale*k*(pointer.y-.5)*.5)/size;
 vec4 r=study(p+shift,power),g=study(p,power),b=study(p-shift,power);
 float a=max(r.a,max(g.a,b.a));return vec4(vec3(r.r*r.a,g.g*g.a,b.b*b.a)/max(a,.001),a);`,
);
