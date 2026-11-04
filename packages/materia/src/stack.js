import { attachGPU } from "./internal/gpu.js";
import { shaderBase } from "./internal/shader-base.js";
import { shapePreamble, shapeEnd } from "./internal/shape-preamble.js";

export const MAX_LAYERS = 6;
export function validateLayers(layers) {
  if (!Array.isArray(layers) || !layers.length || layers.length > MAX_LAYERS)
    throw new RangeError(`A stack requires 1–${MAX_LAYERS} layers.`);
  for (const layer of layers) {
    if (
      !["gpu", "signal"].includes(layer.effect?.kind) ||
      typeof layer.effect.body !== "string"
    )
      throw new TypeError(
        "Stacks accept optical, geometric, and signal effects.",
      );
  }
}
const input = `
uniform float firstPass;
vec4 previous(vec2 p){
 float bounds=step(0.,p.x)*step(p.x,1.)*step(0.,p.y)*step(p.y,1.);
 vec4 value=texture2D(mask,clamp(p,0.,1.));
 return vec4(mix(value.rgb,color,firstPass),value.a*bounds);
}
`;
export function stackFragment(effect) {
  // Distance-based optics retain the original silhouette as their relief guide.
  const base =
    shaderBase
      .replace(
        "uniform sampler2D mask;",
        "uniform sampler2D mask; uniform sampler2D originalMask;",
      )
      .replace(
        "texture2D(mask,clamp(p,0.,1.)).r",
        "texture2D(originalMask,clamp(p,0.,1.)).r",
      ) + input;
  if (effect.kind === "signal")
    return (
      base +
      `
vec4 study(vec2 p,float power){return previous(p);}
uniform float finishAmount,finishScale;
vec4 compose(vec2 p,float power){
 vec2 d=(p-pointer)*vec2(size.x/size.y,1.);
 float k=finishAmount*min(1.,energy)*exp(-dot(d,d)*6.);
 if(k<.001)return previous(p);
 ${effect.body}
}
void main(){gl_FragColor=compose(uv,1.);}`
    );
  const preamble = shapePreamble;
  const end = shapeEnd
    .replace("return vec4(color,original);", "return previous(p);")
    .replace(
      "return vec4(c,clamp(a,0.,1.));",
      "return vec4(c*previous(q).rgb/max(color,vec3(.001)),clamp(a,0.,1.));",
    );
  return (
    base +
    preamble +
    effect.body +
    end +
    `
void main(){
 vec2 d=(uv-pointer)*vec2(size.x/size.y,1.);
 float field=exp(-dot(d,d)*6.)*energy;
 gl_FragColor=study(uv,clamp(field*intensity,0.,1.35));
}`
  );
}
/** Ordered, bounded GPU pipeline. Import only the effects you use. */
export function stack(layers) {
  validateLayers(layers);
  const definition = layers.map((layer) => ({ ...layer }));
  return Object.freeze({
    name: "stack",
    kind: "stack",
    mount(element, options = {}) {
      const snapshot = definition.map((layer) => ({ ...layer }));
      if (options.signal)
        throw new TypeError("Add signal treatments as stack layers.");
      const renderer = attachGPU(element, {
        ...options,
        fragmentSources: snapshot.map((layer) => stackFragment(layer.effect)),
        layerOptions: snapshot,
      });
      return {
        ...renderer,
        setLayer(index, changes) {
          if (!Number.isInteger(index) || !snapshot[index])
            throw new RangeError("Unknown layer index.");
          for (const key of ["strength", "scale", "enabled"])
            if (key in changes) snapshot[index][key] = changes[key];
          renderer.setLayerOptions?.(snapshot);
        },
      };
    },
  });
}
