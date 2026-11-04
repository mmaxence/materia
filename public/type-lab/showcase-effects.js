// Art-directed compositions; kept outside the small public package catalog.
import { gpuEffect } from "./lib/internal/gpu-effect.js";

export const transmission = gpuEffect(
  "transmission",
  71,
  `
 if(energy<.001)return vec4(color,original);
 float phase=mod(time,9.7);
 float burst=step(8.92,phase)*(1.-step(9.38,phase));
 float frame=floor(time*19.);
 float band=floor(p.y*28.);
 float tear=step(.67,hash(vec2(band,frame)))*burst;
 q.x+=(hash(vec2(band,frame+4.))-.5)*.085*tear;
 vec2 bend=delta/aspect*exp(-radius*3.)*k*.12;
 float split=.001+tear*.012;
 vec3 rgb=vec3(glyph(q-bend-vec2(split,0.)),glyph(q-bend),glyph(q-bend+vec2(split,0.)));
 a=max(rgb.r,max(rgb.g,rgb.b));c=rgb/max(a,.001)*color;
 c*=1.-tear*.2;
 return vec4(c,a);
`,
);

export const impact = gpuEffect(
  "impact",
  72,
  `
 if(energy<.001)return vec4(color,original);
 float phase=mod(time+2.,8.5);
 float travel=max(phase-5.8,0.);
 float hit=step(5.8,phase)*(1.-smoothstep(1.5,2.4,travel));
 vec2 center=vec2(.46,.5), radial=(p-center)*aspect;
 float r=length(radial),front=travel*.8;
 float wave=exp(-pow((r-front)*18.,2.))*hit;
 vec2 normal=radial/max(r,.001)/aspect;
 q-=normal*wave*.035*sin((r-front)*28.);
 vec2 grid=p*size/(18.+s*2.), cell=floor(grid),local=fract(grid);
 float first=100.,second=100.;vec2 winner=vec2(0.);
 for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){
 vec2 o=vec2(float(x),float(y)),id=cell+o;
 vec2 v=o+vec2(hash(id),hash(id+17.))-local;float distance=dot(v,v);
 if(distance<first){second=first;first=distance;winner=id;}else if(distance<second)second=distance;
 }
 vec2 drift=vec2(hash(winner+3.),hash(winner+27.))-.5;
 q+=drift*(k*.08+wave*.05);
 a=glyph(q)*(1.-k*(1.-smoothstep(.01,.09,second-first))*.85);
 c=color*(.7+.3*hash(winner))*(1.-wave*.25);
 return vec4(c,a);
`,
);

export const threshold = gpuEffect(
  "threshold",
  73,
  `
 if(energy<.001)return vec4(color,original);
 float phase=mod(time,10.);
 float opening=smoothstep(0.,3.6,phase)*(1.-smoothstep(4.,8.,phase));
 float seam=.5+(pointer.x-.5)*.2;
 float proximity=exp(-abs(p.x-seam)*12.);
 vec2 center=vec2(.5,.5);
 vec2 radial=(p-center)*aspect;
 float pull=exp(-length(radial)*4.)*opening*.48;
 q=center+(p-center)*(1.+pull);
 float band=floor(p.y*55.);
 float flicker=step(9.15,phase)*(1.-step(9.5,phase));
 q.x+=(hash(vec2(band,floor(time*24.)))-.5)*flicker*.025;
 vec2 split=vec2((.001+proximity*opening*.006)*min(energy,1.),0.);
 vec3 rgb=vec3(glyph(q+split),glyph(q),glyph(q-split));
 a=max(rgb.r,max(rgb.g,rgb.b));c=rgb/max(a,.001)*color;
 c+=proximity*opening*.12;
 return vec4(c,a);
`,
);

// Rubber poster: a broad travelling bend with offset, screen-printed colour.
export const rubberPoster = gpuEffect("rubberPoster", 75, `
 if(energy<.001)return vec4(color,original);
 float influence=exp(-radius*2.4)*min(energy,1.);
 float wave=sin(p.x*11.-time*2.8+pointer.x*4.);
 q.y+=wave*.035*influence*intensity;
 q.x+=(p.x-pointer.x)*influence*.15*intensity;
 q+=velocity*influence*.045;
 float ink=glyph(q);
 float coral=glyph(q+vec2(.012,-.014)*influence);
 float mint=glyph(q+vec2(-.011,.012)*influence);
 vec3 shade=mix(vec3(.60,.80,.69),vec3(1.,.45,.37),step(mint,coral));
 a=max(ink,max(coral,mint));
 c=mix(shade,color,ink);
 return vec4(c,a);
`);
