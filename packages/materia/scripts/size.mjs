import { build } from "esbuild";
import { gzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";
const resolveDir = fileURLToPath(new URL("../", import.meta.url));
for (const [name, imports, options] of [
  [
    "One optic",
    'import {chromaticLens} from "./src/optics.js";',
    "effect:chromaticLens",
  ],
  [
    "Signal only",
    'import {rgbSplit} from "./src/signal.js";',
    "effect:rgbSplit",
  ],
  [
    "Geometry + signal",
    'import {vortex} from "./src/geometry.js";import {rgbSplit} from "./src/signal.js";',
    "effect:vortex,signal:rgbSplit",
  ],
  [
    "Three-layer stack",
    'import {stack} from "./src/stack.js";import {vortex} from "./src/geometry/vortex.js";import {rgbSplit} from "./src/signal/rgbSplit.js";import {pixelate} from "./src/signal/pixelate.js";',
    "effect:stack([{effect:vortex},{effect:pixelate},{effect:rgbSplit}])",
  ],
  [
    "Physics",
    'import {looseAtoms} from "./src/physics.js";',
    "effect:looseAtoms",
  ],
  [
    "Elements",
    'import {waterfall} from "./src/elements.js";',
    "effect:waterfall",
  ],
]) {
  const result = await build({
    stdin: {
      contents: `import {createTextEffect} from './src/index.js';${imports}export const mount=el=>createTextEffect(el,{${options}});`,
      resolveDir,
    },
    bundle: true,
    minify: true,
    format: "esm",
    write: false,
  });
  const bytes = result.outputFiles[0].contents;
  console.log(
    `${name}: ${bytes.length} bytes minified / ${gzipSync(bytes).length} bytes gzip`,
  );
}
