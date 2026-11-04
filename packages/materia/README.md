# Materia Text — experimental package

Zero runtime dependencies. Native ES modules, TypeScript declarations, accessible source text, pointer interaction, reduced-motion fallback, and explicit cleanup. No CSS or font import is required.

`@materia/text` is a provisional local package name, **not published to npm**. This alpha uses `UNLICENSED` until its owner chooses distribution terms.

## Try the local package

```sh
cd packages/materia
npm install
npm test
npm run typecheck
npm pack
```

Install the resulting `materia-text-0.1.0-alpha.1.tgz` into another project with `npm install /absolute/path/to/the.tgz`. Build tools are dev dependencies only; consumers install no transitive runtime packages.

## Select your effects

```js
import { createTextEffect } from '@materia/text';
import { chromaticLens } from '@materia/text/optics';

const fx = createTextEffect(document.querySelector('h1'), {
  effect: chromaticLens,
  strength: 0.7,
  scale: 12,
  auto: false,
});

fx.pulse();
// On component unmount:
fx.destroy();
```

Family entries support tree shaking. For direct imports that never traverse a family barrel:

```js
import { createTextEffect } from '@materia/text';
import { vortex } from '@materia/text/geometry/vortex';
import { rgbSplit } from '@materia/text/signal/rgbSplit';

const fx = createTextEffect(document.querySelector('h1'), {
  effect: vortex,
  signal: rgbSplit,
  signalStrength: 0.8,
  signalScale: 14,
  auto: true,
});
```

A signal also works alone: `createTextEffect(heading, { effect: rgbSplit })`.

| Import | Included effects |
| --- | --- |
| `/optics` | chromaticLens, lenticular, causticPool, diffraction, kaleidoscope, anaglyphRelief |
| `/geometry` | vortex, accordion, faultLine, gravityWell, paperShutters, elasticLattice |
| `/signal` | rgbSplit, pixelate, dither, scanlines |
| `/physics` | looseAtoms, threadPull, magneticWell, orbitalCapture, softBodyMesh, shockwave, windTunnel, fallingGrains, gestureWake, slingshot |
| `/elements` | teaSteam, incense, smoke, consumedVapor, waterfall, flame, tradeWinds |
| `/glyphs` | numbers, alphabet, hangul, jamoRain |

The core entry imports no rendering engine. Optics and geometry have per-effect shader modules; unused shaders can be removed by a bundler. Physics shares its simulation core. Elements and glyphs currently share the Canvas transformation renderer: selecting one of those families excludes GPU/physics engines, but does **not** yet prune every Canvas algorithm. GPU shape + signal is the supported composition path; Canvas signal chaining is rejected explicitly.

## Mounting and lifecycle

Use a connected plain-text heading inside a dedicated container. The default canvas host is the parent; `host` can select a different ancestor. Host bounds determine the visible effect area, so give it padding if trails should extend beyond the text. A static host becomes relatively positioned while mounted; its previous inline position and the text color are restored on `destroy()`.

```html
<div class="hero-title" style="padding: 2rem">
  <h1>Make type move.</h1>
</div>
```

The real heading remains in the DOM for layout and assistive technology. Canvas is decorative and ignores pointer events. Pointer listeners attach to the host. Text-content changes refresh automatically; call `refresh()` after external font/style changes that do not resize the host. Resize and initial font readiness are observed.

Controller: `refresh()`, `pulse()`, `setStrength(0–1)`, `setScale(1–24)`, `setAuto(boolean)`, `setFrozen(boolean)`, `setConsumed(boolean)` for elemental effects, `setSignal(strength, scale)` for an attached signal, and idempotent `destroy()`. `supported` reports initial renderer availability; GPU context loss later restores native text. Methods after destroy are inert.

Imports are safe during SSR; mounting requires a browser. In React/Vue/Svelte, mount in the framework's client lifecycle and call `destroy()` during cleanup. Do not mount two instances on the same heading. Do not remove/reparent the host before cleanup.

## Size and verification

Run `npm run size` for reproducible minified + gzip **consumer bundle** measurements (core + selected effect). The tarball contains every selectable family and is intentionally larger than an application bundle. No demo CSS, fonts, catalogue, or assets ship in the tarball.

Tests cover scheduling, physics stability, numeric bounds, SSR imports, export resolution, and selective bundling. `npm run typecheck` checks public declarations. Real-device FPS, battery use, and long-session heap profiling are not yet established.

Browser baseline: modern ESM-capable browsers with Canvas 2D/WebGL 1, ResizeObserver, IntersectionObserver, MutationObserver, and Intl.Segmenter. Unsupported WebGL falls back to native text. Current text rasterization supports plain text; nested markup, arbitrary letter spacing, vertical writing, and complex bidi layouts are not supported. Each mounted GPU effect owns one context; avoid large numbers of simultaneous GPU headings.

## Development source of truth

Edit `packages/materia/src`. `npm run sync-demo` copies it to `public/type-lab/lib` for the standalone playground server. The playground's legacy adapters use the same engine modules; the separate `package-demo.html` uses only the public API. The generated browser mirror is not package source. No npm publication occurs automatically.

### Waterfall pool

Pass `waterline: 0.65` with `waterfall` to place a pool surface at 65% of the effect host height. Droplets land on this surface, producing impact ripples and a distorted live reflection. Omit it for the standalone falling-water effect. Values are clamped to 0.4–0.9. The background photograph belongs to the showcase, not the library.

## Ordered layer stacks

```js
import { createTextEffect } from '@materia/text';
import { stack } from '@materia/text/stack';
import { vortex } from '@materia/text/geometry/vortex';
import { pixelate } from '@materia/text/signal/pixelate';
import { rgbSplit } from '@materia/text/signal/rgbSplit';

const fx = createTextEffect(document.querySelector('h1'), {
  effect: stack([
    { effect: vortex, strength: 0.7, scale: 12 },
    { effect: pixelate, strength: 0.6, scale: 8 },
    { effect: rgbSplit, strength: 0.5, scale: 14 },
  ]),
  auto: true,
});
fx.setLayer(1, { strength: 0.8, enabled: true });
// Cleanup: fx.destroy();
```

Layers apply in array order, each sampling the previous result. Use 1–6 optical, geometric, or signal effects; Canvas families remain standalone. Adjust strength, scale, and enabled state with `setLayer` without recompilation. To change the structure/order, destroy and mount a new stack definition. Each mount has independent settings, even when reusing a definition.

Stacks share one WebGL context and two reusable RGBA render targets (one layer needs no intermediates). Work grows linearly with layer count. Existing resolution limits, offscreen suspension, reduced motion, and cleanup apply. Distance-based optics use the original silhouette as a relief guide; intermediate images do not regenerate a distance field. The stack entry does not import any effect family.
