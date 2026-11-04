import { signalEffect } from "../internal/signal-effect.js";
export const scanlines = /* @__PURE__ */ signalEffect(
  "scanlines",
  4,
  `vec4 result=study(p,power);float line=step(.45,fract(p.y*size.y/max(2.,finishScale*.7)));result.rgb*=mix(1.,.25+.75*line,k);return result;`,
);
