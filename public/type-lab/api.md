# Living Type — text effects

**Living Things · 0.1.0-alpha.1 · experimental source/local package.** Formerly Materia. The compatible package identity is `@materia/text`; it is **not published to npm** and ownership/availability is not established. Native ESM, TypeScript declarations and zero runtime dependencies. No library stylesheet, font or image is required.

This document describes the public contract of `0.1.0-alpha.1`. [Options and controller types](lib/index.d.ts), [stack types](lib/stack.d.ts) and package.json exports are authoritative. Showcase shaders and numeric research modes are not additional package APIs. Code/documentation use the [MIT License](LICENSE); the showcase photograph and external fonts have separate notices and are excluded from this package.

## Start with a local tarball or source

From a repository checkout with Node 22 and development dependencies:

```sh
cd packages/materia
npm ci
npm pack
```

Alternatively run `npm pack` from `packages/materia`. It runs tests/typecheck through prepack. Install the generated tarball in your application, using its actual path:

```sh
npm install /absolute/path/to/materia-text-0.1.0-alpha.1.tgz
```

The examples below use package imports with a bundler. Native browser modules need an import map or relative `.js` source URLs. Copy `packages/materia/src/` and retain LICENSE for self-hosted source. Never replace this with an unverified registry install command or a guessed CDN/version URL. Imports are server-safe; **mount only in the browser after the element is connected**.

## One heading, one effect

Give a dedicated ancestor room for the canvas. Keep the heading plain text; put links/icons/markup beside it. This example uses a dark host and light text so bright optical treatments retain contrast.

```html
<div id="title-host" style="position:relative;padding:2rem;min-height:10rem;background:#142629;color:#f5f5ed">
  <h1 id="title">Words with presence</h1>
</div>
```

```js
import { createTextEffect } from '@materia/text';
import { chromaticLens } from '@materia/text/optics/chromaticLens';

const heading = document.querySelector('#title');
const host = document.querySelector('#title-host');
const fx = createTextEffect(heading, {
  effect: chromaticLens,
  host,
  strength: 0.4,
  scale: 12,
  auto: false,
});
fx.pulse();
// In your client lifecycle cleanup, before removing/replacing the host:
// fx.destroy();
```

In application code, destroy belongs in the client lifecycle cleanup, not immediately after a preview trigger. The real heading keeps layout/semantics. Its decorative canvas is aria-hidden and pointer-events:none; pointer listeners belong to the host. Semantic controls, keyboard actions, contrast and useful source content remain the application's responsibility.

Runnable repository examples, excluded from the runtime tarball: `packages/materia/examples/minimal/` and `packages/materia/examples/stack/`. Serve the repository with `python3 -m http.server 4399` and open `/packages/materia/examples/minimal/`. Their import maps resolve local source; after `npm run sync-demo --prefix packages/materia`, the website copies live at `/examples/minimal/` and `/examples/stack/` under a server rooted at `public/type-lab`. No network media/fonts or showcase assets are used.

## Eight practical use cases

Run [the recipe gallery](examples/recipes/index.html) from the repository or synced site; use its selector or recipe hash. [Choice and ownership guide](examples/recipes/guide.md) explains the full presets, source semantics and validation. These are application recipes, not new effect names or library exports; they are excluded from the runtime tarball.

| Job | Deliberate default | Keep native |
| --- | --- | --- |
| Launch headline | chromaticLens .35 / scale 12; replay, auto false | Heading and preview action |
| Editorial emphasis | Same lens .14 / 16; a restrained preset | Blockquote, attribution and body copy |
| Navigation / CTA | Same lens .22 / 12; native click/keyboard action | Button, label and guide details |
| Readable status change | Same lens .12 / 16; one source update per action | Live status; no animated character announcements |
| Data highlight | Standalone dither .16 / 14 | Named output with the actual illustrative value |
| Kinetic poster | vortex + rgbSplit stack; auto true only here | Poster text, pause/native controls |
| Localized long text | Short Korean title .12 / 16 | Long Korean/English paragraph; display text over 120 code points stays native |
| Text within spatial panels | Lens .18 / 14 in real flat Space panels | Reading note, selection and source order |

Choose one optic for readable short type, one signal for a print/sampling treatment, and a stack only when two ordered treatments are needed. Reusing a restrained lens consolidates overlapping choices rather than inventing aliases. Existing families/APIs stay available. Strength/scale, auto versus frozen and standalone/attached/stack signal controls retain their documented meanings below.

The gallery owns one active child effect, explicit pause/native intent, content/font refresh, stale async-import/font guards and reverse-order cleanup. Reduced preference uses a stricter application-authored native alternative. Its pinned, licensed Space fixture is example-only and stays in compact/flat layout; it is not a Type package dependency, shared runtime, projected-pointer solution or device/composition certification. System fonts/original text only; the unresolved showcase photograph is untouched. Local recipes and generated site copies are not deployed evidence. Run npm run check:recipes after sync-demo to validate them.

## Motion, updates and cleanup

`auto:false` disables automatic flow; pointer input or `pulse()` can still animate. `setFrozen(true)` explicitly freezes the renderer loop. Freeze does not promise that synchronous refresh/setters cannot paint a static frame. GPU refresh paints changed text/font/size while frozen without restarting animation, including when the host returns from hidden/offscreen state. Keep an explicit user-pause choice separate from offscreen/hidden state; the renderer already observes visibility and live reduced-motion changes.

```js
import { createTextEffect } from '@materia/text';
import { vortex } from '@materia/text/geometry/vortex';

export function mountHeadline(heading) {
  const fx = createTextEffect(heading, { effect: vortex, auto: true });
  return {
    updateText(text) { heading.textContent = text; },
    pause() { fx.setFrozen(true); },
    resume() { fx.setFrozen(false); },
    refreshTypography() { fx.refresh(); },
    dispose() { fx.destroy(); },
  };
}
```

`mountHeadline` and its wrapper methods above are **application helpers**, not library exports. Call the helper after mounting; call its dispose before removing/reparenting the element. Text MutationObserver, host ResizeObserver and initial font readiness refresh layout. Call `refresh()` for external font/style changes without a size change. Color is resolved at mount; changing effect definition, host or resolved color needs destroy/remount. Automatic reaction to every display-DPR/transform change is not guaranteed.

One controller per heading: a duplicate mount throws. Destroy is idempotent, removes observers/listeners/canvas and releases renderer resources, restoring owned text/spacing/host styles. Later controller calls are inert. Host positioning is reference counted, but use dedicated hosts to avoid competing style/gesture owners. Do not mutate controller-owned properties concurrently.

Reduced motion settles to a static presentation in sampled renderers; it does not remove the source content or require a framework adapter. With renderer creation unavailable, `supported` is false and native text remains. After GPU context loss the canvas is hidden and native text returns; **supported remains the initial result**. There is no automatic GPU recovery callback/API: destroy/remount if enhancement is wanted again. Keep any fallback meaningful without animation, JavaScript or GPU.

## Selective families and composition

| Package suffix | Exported effects |
| --- | --- |
| `/optics` | chromaticLens, lenticular, causticPool, diffraction, kaleidoscope, anaglyphRelief |
| `/geometry` | vortex, accordion, faultLine, gravityWell, paperShutters, elasticLattice |
| `/signal` | rgbSplit, pixelate, dither, scanlines |
| `/physics` | looseAtoms, threadPull, magneticWell, orbitalCapture, softBodyMesh, shockwave, windTunnel, fallingGrains, gestureWake, slingshot |
| `/elements` | teaSteam, incense, smoke, consumedVapor, waterfall, flame, tradeWinds |
| `/glyphs` | numbers, alphabet, hangul, jamoRain |

Optics/geometry/signal also expose individual subpaths, for example `@materia/text/geometry/vortex`. The core imports no renderer; selected GPU effect modules exclude unused shaders through bundling. Physics shares its simulation core. Elements/glyphs share a Canvas transformation renderer; importing one does not promise pruning every Canvas algorithm. Those families have no per-effect package subpaths. A signal can be the standalone `effect`, or attach to a GPU shape through `signal`. Canvas signal chaining is rejected.

```js
import { createTextEffect } from '@materia/text';
import { stack } from '@materia/text/stack';
import { vortex } from '@materia/text/geometry/vortex';
import { rgbSplit } from '@materia/text/signal/rgbSplit';

const heading = document.querySelector('#title');
const fx = createTextEffect(heading, {
  effect: stack([
    { effect: vortex, strength: 0.4, scale: 12 },
    { effect: rgbSplit, strength: 0.3, scale: 14 },
  ]),
  auto: true,
});
fx.setLayer(1, { strength: 0.5, enabled: true });
// In lifecycle cleanup: fx.destroy();
```

Use 1–6 optical/geometric/signal layers in array order. Stack + top-level signal, Canvas layers, independent per-layer pointers/timelines and arbitrary post-process/texture bridges are not supported. `setLayer` adjusts strength/scale/enabled without changing the definition/order. Remount to reorder/replace layers. A stack shares one WebGL context and reuses intermediate targets; work still grows with layers, so measure the actual use case.

## Options and controller reference

| Option | Meaning |
| --- | --- |
| effect | Required imported effect definition; no string-name lookup |
| host | Ancestor of the source element, default parent; cannot be the element itself |
| strength / scale | 0–1 / 1–24; defaults 0.7 / 10 |
| auto / frozen | Defaults false / false; automatic flow versus explicit freeze |
| color | CSS color or RGB tuple in 0–1; default resolved computed color at mount. Alpha is not an independent fade control |
| letterSpacing | CSS length/normal or finite pixel number; source spacing is restored at teardown |
| signal / signalStrength / signalScale | Optional imported signal on GPU shape; signal amount/detail default 0.7 / 10 at mount. Standalone signal uses strength/scale |
| consumed | Initial elemental consumption state; not universal across every effect |
| waterline | Waterfall pool at a host-height fraction, initially clamped 0.4–0.9. Omit for no reflected pool; mount with it to allocate reflection resources |

| Member | Meaning / boundary |
| --- | --- |
| supported | Readonly initial renderer availability; not a live health flag |
| refresh() | Remeasure/rasterize eligible content/style changes |
| pulse() | Disturb the effect; frozen/reduced behavior still applies |
| setStrength(value), setScale(value) | Adjust existing renderer intensity/detail |
| setAuto(boolean), setFrozen(boolean) | Control automatic flow and explicit freeze separately |
| setLetterSpacing(value) | Apply source spacing and refresh |
| setSignal(amount, scale?) | For an attached/standalone signal; throws without one. Use setLayer for stack signals |
| setLayer(index, changes) | Stack only; valid index and strength/scale/enabled changes |
| setConsumed(boolean) | Elemental consumption; clears a manual consumption scrub |
| setConsumptionProgress(value) | Elemental scrub 0–1; null restores automatic control, not an app timeline API |
| setWaterline(value) | Update existing waterfall pool; setter currently clamps 0.4–0.95 (different from initial option). Not a global resolution control |
| destroy() | Idempotent cleanup; call before removing/reparenting source/host |

Element-specific setters have no effect where the renderer does not implement them. Do not infer a generic effect-change, pause/resume, error event, setMode or setColor controller method from showcase code.

## Limits and verification

Modern ESM browser, Canvas 2D/WebGL1 as needed, ResizeObserver, IntersectionObserver, MutationObserver, matchMedia, requestAnimationFrame, font readiness and Intl.Segmenter. Native fallback for unavailable rendering is not a missing-DOM-API polyfill. Native source text keeps semantics; this alone does not certify accessible interactions.

Plain text is supported, including CSS/option letter spacing with a positioned-glyph fallback where needed. Nested markup, vertical writing and complex bidi layouts are unsupported. Validate your actual fonts/scripts, text zoom, contrast, wrapping and content length. Viewport rectangle/raster measurements do not establish inverse mapping for arbitrary perspective, nested transforms or spatial panels. Use readable native text until those integration cases are validated. Each GPU heading owns a context; small transfer size does not prove a device/frame/memory budget.

From `packages/materia` in a repository checkout (not an installed tarball), run `npm test`, `npm run typecheck`, `npm run size` and `npm run check:docs`. Run `npm run check:examples` with local Chrome; set `CHROME=google-chrome` on Linux or `CHROME` to your browser executable. Tests cover runtime scheduling, physics, numeric bounds, SSR/exports/selective bundling, stacks and typography. Documentation checks compare mirrored guidance/source, validate public options/methods and code imports. The browser example check is a separate command documented in the repository. Physical-device/browser/long-session/thermal and complete cross-library composition coverage remain separate.

Edit `packages/materia/src`, this README and `packages/materia/examples`; `npm run sync-demo` updates website `lib`, `api.md`, manifest/license and runnable example copies. Never edit the generated lib mirror as a second runtime. No npm publication occurs automatically. Source and generated website docs can agree locally while the deployed site remains an earlier version.
