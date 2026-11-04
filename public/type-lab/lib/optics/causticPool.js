import { gpuEffect } from "../internal/gpu-effect.js";
export const causticPool = /* @__PURE__ */ gpuEffect(
  "causticPool",
  19,
  `
  float freq=12.+s*1.2;vec2 wave=vec2(cos(p.y*freq+time*1.3)+sin((p.x+p.y)*freq*.7-time),sin(p.x*freq-time*.9));
  q+=wave*px*12.*k;a=glyph(q);
  float caustic=pow(.5+.5*sin(wave.x*3.+wave.y*2.),7.);
  c=mix(color,vec3(.39,.84,.96)+caustic*.6,min(1.,k*.9));`,
);
