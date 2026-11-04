import { gpuEffect } from "./gpu-effect.js";
const preamble = `
uniform float finishMode,finishAmount,finishScale;
vec4 compose(vec2 p,float power){
 vec2 d=(p-pointer)*vec2(size.x/size.y,1.);
 float k=finishAmount*min(1.,energy)*exp(-dot(d,d)*6.);
 if(k<.001)return study(p,power);
`;
export function signalEffect(name, mode, body) {
  const plain = gpuEffect(name, 17, "");
  const effect = {
    name,
    body,
    kind: "signal",
    mode,
    shader: preamble + body + "\n}",
    mount(element, options = {}) {
      if (options.signal)
        throw new TypeError("Use a shape effect with one signal treatment.");
      return plain.mount(element, {
        ...options,
        signal: effect,
        signalStrength: options.intensity,
        signalScale: options.detail ?? 10,
      });
    },
  };
  return Object.freeze(effect);
}
