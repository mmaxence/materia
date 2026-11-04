import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
test("every entry imports without browser globals; no runtime dependencies", async () => {
  const pkg = JSON.parse(
    await readFile(new URL("../package.json", import.meta.url), "utf8"),
  );
  assert.equal(pkg.dependencies, undefined);
  assert.equal(pkg.peerDependencies, undefined);
  for (const path of Object.keys(pkg.exports).filter((p) => !p.includes("*"))) {
    const module = await import("@materia/text" + path.slice(1));
    assert(Object.keys(module).length);
  }
  const { createTextEffect } = await import("@materia/text");
  assert.throws(() => createTextEffect(null, {}), /browser/);
});
test("optics bundle excludes other families and unused optic shader bodies", async () => {
  const result = await build({
    stdin: {
      contents:
        'import {createTextEffect} from "./src/index.js"; import {chromaticLens} from "./src/optics.js"; export const mount = el=>createTextEffect(el,{effect:chromaticLens});',
      resolveDir: root,
    },
    bundle: true,
    write: false,
    minify: true,
    format: "esm",
    metafile: true,
  });
  const code = result.outputFiles[0].text;
  assert(!code.includes("flameSurface"));
  assert(!code.includes("connectParticles"));
  assert(!code.includes("finishScale*k"));
  const inputs = Object.values(result.metafile.outputs)[0].inputs;
  assert(
    Object.entries(inputs).some(
      ([name, value]) =>
        name.endsWith("chromaticLens.js") && value.bytesInOutput > 0,
    ),
  );
  for (const [name, value] of Object.entries(inputs))
    if (/optics\/(?!chromaticLens)/.test(name))
      assert.equal(value.bytesInOutput, 0, name);
});
test("individual subpaths resolve and compose without family-wide imports", async () => {
  const { vortex } = await import("@materia/text/geometry/vortex");
  const { rgbSplit } = await import("@materia/text/signal/rgbSplit");
  assert.equal(vortex.kind, "gpu");
  assert.equal(rgbSplit.kind, "signal");
  const result = await build({
    stdin: {
      contents:
        'import {createTextEffect} from "./src/index.js";import {vortex} from "./src/geometry/vortex.js";import {rgbSplit} from "./src/signal/rgbSplit.js";export const mount=el=>createTextEffect(el,{effect:vortex,signal:rgbSplit});',
      resolveDir: root,
    },
    bundle: true,
    write: false,
    format: "esm",
    metafile: true,
  });
  assert(
    !Object.keys(result.metafile.inputs).some(
      (p) => p.endsWith("/pixelate.js") || p.endsWith("/particles.js"),
    ),
  );
});
