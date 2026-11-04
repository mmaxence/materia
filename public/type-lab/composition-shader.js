import { pixelBody, ditherBody } from "./lib/internal/signal-patterns.js";
// Finish samples the transformed result, not the original text mask.
export const compositionShader = `
uniform float finishMode, finishAmount, finishScale;
vec4 compose(vec2 p,float power){
 float influence=exp(-dot((p-pointer)*vec2(size.x/size.y,1.),(p-pointer)*vec2(size.x/size.y,1.))*6.);
 float k=finishAmount*min(1.,energy)*influence;
 if(finishMode<.5||k<.001)return study(p,power);
 if(finishMode>1.5&&finishMode<2.5){${pixelBody}}
 if(finishMode>2.5&&finishMode<3.5){${ditherBody}}
 vec2 q=p;
 if((finishMode>1.5&&finishMode<2.5)||finishMode>4.5){
  float cell=max(1.,finishScale*k);q=(floor(p*size/cell)+.5)*cell/size;
 }
 vec4 result=study(q,power);
 if(finishMode<1.5||finishMode>4.5){
  vec2 shift=vec2(finishScale*k,finishScale*k*(pointer.y-.5)*.5)/size;
  vec4 r=study(q+shift,power),b=study(q-shift,power);
  vec3 rgb=vec3(r.r*r.a,result.g*result.a,b.b*b.a);
  float a=max(r.a,max(result.a,b.a));result=vec4(rgb/max(a,.001),a);
 }else if(finishMode>3.5&&finishMode<4.5){
  float line=step(.45,fract(p.y*size.y/max(2.,finishScale*.7)));
  result.rgb*=mix(1.,.25+.75*line,k);
 }
 return result;
}`;
