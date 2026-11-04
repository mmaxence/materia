import { gpuEffect } from "../internal/gpu-effect.js";
export const diffraction = /* @__PURE__ */ gpuEffect(
  "diffraction",
  20,
  `
  float d=sd(p);float halo=0.;vec3 sum=color*original;
  for(int i=1;i<=6;i++){float f=float(i);float ring=exp(-abs(d-f*(1.+s*.12)*k)*1.5)*k*(1.-f*.11)*smoothstep(-.5,1.,d);halo+=ring;sum+=palette(f*.13-time*.04)*ring;}
  a=original+halo;c=sum/max(a,.001);`,
);
