import { gpuEffect } from "../internal/gpu-effect.js";
export const faultLine = /* @__PURE__ */ gpuEffect(
  "faultLine",
  25,
  `
  vec2 grid=p*size/(18.+s*2.);vec2 cell=floor(grid),local=fract(grid);float first=100.,second=100.;vec2 winner=vec2(0.);
  for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){vec2 o=vec2(float(x),float(y));vec2 id=cell+o;vec2 seed=vec2(hash(id),hash(id+17.));vec2 v=o+seed-local;float d=dot(v,v);if(d<first){second=first;first=d;winner=id;}else if(d<second)second=d;}
  vec2 drift=vec2(hash(winner+3.),hash(winner+27.))-.5;q+=drift*k*.08;
  a=glyph(q)*(1.-k*(1.-smoothstep(.01,.09,second-first))*.85);c*=.7+.3*hash(winner);`,
);
