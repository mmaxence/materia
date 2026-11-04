import { gpuEffect } from "../internal/gpu-effect.js";
export const elasticLattice = /* @__PURE__ */ gpuEffect(
  "elasticLattice",
  28,
  `
  vec2 grid=p*vec2(14.,6.)*(.5+s*.06),id=floor(grid),f=fract(grid);f=f*f*(3.-2.*f);
  vec2 a0=vec2(hash(id),hash(id+21.)),a1=vec2(hash(id+vec2(1,0)),hash(id+vec2(1,0)+21.));
  vec2 b0=vec2(hash(id+vec2(0,1)),hash(id+vec2(0,1)+21.)),b1=vec2(hash(id+1.),hash(id+22.));
  q+=(mix(mix(a0,a1,f.x),mix(b0,b1,f.x),f.y)-.5)*k*.08+velocity*k*.06;a=glyph(q);`,
);
