import { attachGPU } from "./lib/internal/gpu.js";
import { fragment } from "./material-shaders.js";
import { explorationShader } from "./exploration-shader.js";
import { compositionShader } from "./composition-shader.js";
// The legacy catalogue intentionally loads every study; package family entries do not.
export function attach(element, options = {}) {
  const fragmentSource =
    options.mode >= 17
      ? fragment
          .replace(
            "void main(){",
            explorationShader +
              (options.composition ? compositionShader : "") +
              "\nvoid main(){",
          )
          .replace(
            "gl_FragColor=vec4(c,clamp(a,0.,1.));",
            options.composition
              ? "gl_FragColor=compose(uv,power);"
              : "gl_FragColor=study(uv,power);",
          )
      : fragment;
  return attachGPU(element, { ...options, fragmentSource });
}
