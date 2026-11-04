import { gpuEffect } from "../internal/gpu-effect.js";
export const paperShutters = /* @__PURE__ */ gpuEffect(
  "paperShutters",
  27,
  `
  float height=7.+s;float y=p.y*size.y;float id=floor(y/height),local=fract(y/height)-.5;
  float fold=k*(.35+.3*sin(id*.7+time*1.2));float scale=max(.25,1.-fold);
  q.y=(id+.5+local/scale)*height/size.y;q.x+=fold*.026*sin(id);
  a=glyph(q)*step(abs(local),scale*.5);c*=1.-fold*.55;`,
);
