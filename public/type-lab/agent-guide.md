# Integrating Living Type

Living Things · **@materia/text 0.1.0-alpha.1**, experimental source/local-tarball contract. Not published to npm; no registry identity/availability is established. Keep existing package names, URLs and imports. Source/docs are [MIT licensed](./LICENSE); showcase images/fonts have separate notices. The examples here need no image/font assets.

## Choose a delivery

- **Application/bundler:** pack `packages/materia` from a repository checkout, install the resulting local tarball, then use `@materia/text` exports. Do not run a guessed registry/CDN install.
- **Reproducible native ESM:** pin a reviewed repository commit and self-host `packages/materia/src` with LICENSE. Map bare imports explicitly or import `.js` files relative to that copy.
- **Quick prototype only:** existing hosted sources are under `https://mmaxence.github.io/materia/lib/`. They are mutable and may differ from a local candidate. The website's manifest targets are package-relative `src/*`; hosted modules are `lib/*`.

[Single-effect example](./examples/minimal/) and [stack example](./examples/stack/) include actual import maps and system-font CSS. They are generated from the repository's `packages/materia/examples`; use source copies locally until their website version is deployed. The runtime tarball intentionally excludes examples and all showcase assets.

## Minimal native-source example

The browser must finish connecting the real heading before mount. Use a dedicated ancestor and enough room for motion. Bright treatments need an appropriate contrast surface.

```html
<div id="title-host" style="position:relative;padding:2rem;background:#142629;color:#f5f5ed">
  <h1 id="title">Words with presence</h1>
</div>
<script type="module">
import {createTextEffect} from './lib/index.js';
import {chromaticLens} from './lib/optics/chromaticLens.js';
const heading = document.querySelector('#title');
const fx = createTextEffect(heading, {effect:chromaticLens, strength:0.4, auto:false});
fx.pulse();
// Save fx for your client lifecycle; destroy before removing/reparenting the host.
// fx.destroy();
</script>
```

Relative URLs above are for a page at the website root. For a copied source tree, replace `./lib/` with its real local path. Bare package usage is shown in [api.md](./api.md). Imports are SSR-safe; rendering/mounting is browser-only.

## Implement the lifecycle

1. Keep plain semantic text in HTML. Nested markup, links/icons inside the source, vertical writing and complex bidi are unsupported. Place controls beside the heading.
2. Mount once per connected text element. Duplicate mount throws; change effect/host/resolved color through destroy/remount. Match client mount/unmount in your framework. No React/Vue/Svelte dependency or adapter is required/provided.
3. Text mutations, host resize and initial font readiness refresh automatically. For external style/font changes without resize, call refresh(). Letter spacing can use CSS or setLetterSpacing; it is restored at cleanup. Display DPR and arbitrary transforms are not universally observed.
4. Preserve explicit user pause. auto:false only stops automatic flow; pulse/pointer input can still animate. setFrozen(true) gates the renderer loop, with possible synchronous static paints. Visibility and live reduced motion are built in; don't blindly resume a user-paused controller because it became visible.
5. supported reports **initial** renderer availability. Initial failure leaves native text. Later GPU context loss also restores native text/hides canvas but does not flip supported or automatically recover the GPU; destroy/remount to retry. There is no public error event/callback contract to invent.
6. Destroy before host removal/reparenting. Cleanup is idempotent; post-destroy controller calls are inert. Your wrapper owns its controls/listeners and async work separately. The runnable examples export disposeExample as app cleanup, **not** as a library API.

## Stay inside the public API

- Controller/options: [index.d.ts](./lib/index.d.ts); ordered stack: [stack.d.ts](./lib/stack.d.ts). [Full reference](./api.md) lists all actual setters and default/range differences.
- Optics/geometry/signal have family and individual exports. Physics/elements/glyphs use family entries, with shared renderer cost. No fake per-effect paths for those families.
- GPU shape + signal or ordered 1–6 GPU/signal stack are supported. Canvas chaining, top-level signal on stack, independent per-layer pointers/timelines and renderer texture bridges are unsupported. setLayer changes strength/scale/enabled; remount to change order/definitions.
- Waterfall's initial waterline is 0.4–0.9; setWaterline currently accepts 0.4–0.95. Mount with waterline to allocate reflection; do not assume setter alone creates it. Elemental setters are not universal effect options.
- The showcase's numeric modes, travelling camera/letter extrusion, editor controls and extra shaders are application/research code, not additional public methods/effects. Do not copy adapters as a package API.

## Verify the integration

Use source content with GPU unavailable and JS disabled; check actual font/line wrapping, copy changes, paused/reduced preference, resize, repeated mount/destroy, focus/keyboard, and contrast. The canvas does not replace native accessible controls. Perspective/spatial-panel text/pointer mapping, physical mobile, Safari/Firefox, memory/thermal and full cross-library performance need separate evidence. Don't promise every-device FPS from source/bundle size or a headless example.

Repository checks: npm test, npm run typecheck, npm run size, npm run sync-demo, npm run check:docs, npm run check:examples (from packages/materia). The latter needs local Chrome. Documentation/source mirrors can match locally while the live site remains older; no build command itself grants publication.

Related Living Things libraries: [Living Object](https://mmaxence.github.io/solids/) (3D objects), [Living Frame](https://mmaxence.github.io/prisma/) (image/video effects), [Living Space](https://mmaxence.github.io/strata/) (spatial HTML). Their independent controllers are not automatic Type integrations.

## Eight practical recipes (local candidate)

[Recipe gallery](./examples/recipes/index.html) · [Choice/ownership guide](./examples/recipes/guide.md). Eight explicit jobs reuse restrained effects rather than introducing aliases. One active Type controller; semantic actions/status/output; long copy stays native; reduced/native intent, fonts, asynchronous loads and cleanup are owned by the application. The spatial case uses a pinned licensed Space snapshot in flat/compact layout only, outside the Type runtime tarball. No projected composition, device, registry or live-publication claim. Use npm run check:recipes after syncing.
