import { gpuEffect } from "../internal/gpu-effect.js";
export const kaleidoscope = /* @__PURE__ */ gpuEffect(
  "kaleidoscope",
  21,
  `
  float sectors=4.+floor(s*.3);float angle=atan(delta.y,delta.x),sector=6.28318/sectors;
  angle=abs(mod(angle+sector*.5,sector)-sector*.5);
  vec2 folded=vec2(cos(angle),sin(angle))*radius;
  q=pointer+mix(delta,turn(time*.12)*folded,min(1.,k))/aspect;a=glyph(q);
  c=mix(color,palette(radius*2.+time*.03),min(.65,k*.6));`,
);
