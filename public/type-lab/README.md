# Living Type — research and showcase notes

These are research/showcase implementation notes, not the public package contract. Use [api.md](api.md), [the agent guide](agent-guide.md) and the [minimal example](examples/minimal/) for supported integration. Showcase-only shaders, numeric modes and study counts are not additional exported effects.

58 visible treatments: eight original materials, four Solids-inspired signal treatments, and 46 further experiments. Plain HTML text remains the layout and semantic source. The canvas is decorative.

## Run

From this directory: `python3 -m http.server 4399`, then open http://localhost:4399.
With the parent Astro dev server, open `/type-lab/index.html`.

No build is required for the playground. Google Fonts are optional demo assets. Rendering has no third-party runtime dependencies.

## Explore

The top bench has nine experiment families, previous/next, random selection, and a local Keep list. Keyboard: focus the specimen, press Enter or Space to disturb, and Left/Right to change studies. Each study supplies a gesture suggestion. Strength and spatial scale are adjustable. Auto motion is opt-in; Freeze holds the current frame. Gesture-driven effects return to clean text at rest; water, fire, wind, and vapor continuously flow while visible.

The original materials and interactive RGB split / pixelate / dither / stacked signal treatments remain below the bench.

## Reusable package

The supported integration API now lives in `packages/materia` (see its README). It offers zero-dependency ESM family imports, individual GPU effect imports, TypeScript declarations, automatic text refresh, and style restoration on cleanup. Open `package-demo.html` to test it without playground CSS.

Edit the canonical engines in `packages/materia/src/internal`, then run `npm run sync-demo --prefix packages/materia` from the repository root. `lib/` is the generated browser mirror; the legacy renderer files below re-export or adapt those engines.

## Files

- `material.js`: legacy WebGL adapter, assembling the full playground shader catalog.
- `experiments.js`: 46-study manifest with descriptions and gesture hints.
- `material-shaders.js`, `exploration-shader.js`: GPU shader sources, separate from resource management.
- `frame-loop.js`: shared, tested animation scheduling and pause gates.
- `renderer-utils.js`, `effect-modes.js`: native fallback, numeric bounds, layout keys, and mode classification.
- `compositions.js`, `composition-recipes.js`: composition UI/controller and named recipe data.
- `particles.js`: Canvas 2D renderer and pointer/touch gestures for ten physics studies.
- `physics-core.js`: deterministic force integration, neighbor springs, and spatial-hash grain collisions.
- `transformations.js`: liquid density surfaces, vapor trails, spectral projections, and glyph mosaics (modes 52–66).
- `text-mask.js`: shared browser-layout-to-raster measurement.
- `app.js`: playground controls and single-renderer bench lifecycle.
- `index.html`, `styles.css`: semantic demo markup and responsive styling.

## Legacy playground attachment (internal)

```js
import { attach } from './material.js';
import { attachParticles } from './particles.js';

// Mode 23 is Vortex. See the manifest for the other research modes.
const effect = attach(heading, {
  mode: 23,
  intensity: 0.8,
  color: [0.92, 0.92, 0.88],
});
effect.setDetail(10);
effect.pulse();
effect.setFlow(false);
effect.setFrozen(false);
effect.refresh(); // after content or typography changes
// effect.destroy();

// The particle studies use the other renderer:
// const effect = attachParticles(heading, { mode: 39 });
```

The heading parent must be positioned, with a canvas covering its bounds. Copy `.material-canvas` and `.material-source` from the demo CSS. This is still an experimental API; it does not automatically install CSS or watch arbitrary DOM text/style mutations.

GPU research modes 17–38 can switch with `setMode()` on an instance initially created with a research mode. Particle modes 39–48 switch within `attachParticles()`. The demo destroys and recreates the renderer only when crossing between GPU, particle, and transformation engines. It releases the old WebGL context. Selecting all 46 studies does not create 46 simultaneous contexts: the bench owns one canvas at a time.

## Technique catalog

| Family | Studies | Methods |
| --- | --- | --- |
| Optics | Chromatic lens, Lenticular, Caustic pool, Diffraction, Kaleidoscope, Anaglyph relief | Wavelength-separated samples, interlaced offsets, wave gradients, spectral distance contours, polar folding, distance-based parallax |
| Geometry | Vortex, Accordion, Fault line, Gravity well, Paper shutters, Elastic lattice | Polar rotation, coordinate pleats, Voronoi cell fracture, radial warp, strip perspective, interpolated control lattice |
| Matter | Corrosion, Crystal bloom, Liquid bridges, Woven type | Noise erosion, quantized dilation, morphological growth, crossing-line screens |
| Signal | Barcode, Tape tear, Broken codec, Polar scan | Column sampling, displaced scanlines, block substitutions, radial gating |
| Time | Echo tunnel, Phase cancellation | Seven scaled impressions, difference between displaced masks |
| Physics | Loose atoms, Thread pull, Magnetic well, Orbital capture, Soft-body mesh, Shockwave, Wind tunnel, Falling grains, Gesture wake, Slingshot | Repulsion, attraction, tangential forces, neighbor springs, expanding impulses, velocity-driven gusts, gravity and collisions, gesture momentum, captured drag and elastic release |

Original GPU modes: 0 capillary ink, 1 interference, 2 elastic skin, 3 ferrotype, 4 contour echo, 5 thermal memory, 6 orbital dust, 7 chromatic ghost.

Signal modes: 13 RGB split, 14 pixelate, 15 ordered dissolve, 16 stack all. These adapt Solids' `rgb-split`, `pixelate`, and `dither` shader ideas directly to text. Modes 8–12 retain the earlier glass/metal/halftone/dither/beam surface studies internally; they are not visible options in the current playground.

## Implementation and limits

Browser Ranges measure graphemes, which are grouped into visual lines for rasterization. A two-pass chamfer distance transform encodes approximate signed edge distance in the red texture channel, with the original antialiased mask in alpha. Raw pixel upload preserves the distance field outside transparent glyphs. The field saturates at ±32 texture pixels. Most studies are procedural resampling; they do not model fluid dynamics. Echo Tunnel is a stack of transformed impressions, not a temporal feedback buffer.

The particle engine maintains actual positions and velocities. Forces disturb home-anchored springs; damping returns them to the glyph. Soft-body mesh couples neighboring samples; grains use gravity, floor bounce, and spatial-hash collision separation. Slingshot captures a press and drag, then releases the stored deformation. Integration is subdivided into steps no larger than 1/120 second. It adaptively spaces samples to target roughly 1,400 particles. A clean raster replaces the particles once they settle.

Rendering pauses offscreen and while the document is hidden. Reduced motion produces static text. The GPU raster is capped at 1.5 device pixels and 1400 pixels wide. The particle raster is capped at 1.5 device pixels. Distance computation and particle integration currently run on the main thread.

Supported: plain-text headings, wrapping, long words, serif/sans/Korean samples. Not supported: nested styling, arbitrary letter spacing, vertical writing, complex bidirectional shaping, or exact raster parity across every browser. Fonts can still differ subtly from native text. Each original card owns a WebGL context; a shared renderer would be needed for use across many page elements. These are research sketches, not production-ready guarantees.

## Verification

Run regression checks with `node --test public/type-lab/tests/*.test.mjs` from the repository root.

- Eleven deterministic tests cover all ten physics modes: response, finite positions, settling, and neighboring-particle force transfer.
- All eight additional physics selectors and their Disturb controls exercised in Chromium; Slingshot also checked with a real pointer drag.

- All 24 new selectors exercised and their rendered states captured in Chromium, with no reported browser errors.
- GPU ↔ particle switching checked; the page retains ten canvases total, with one for the new bench.
- Kept filtering and freeze/unfreeze checked.
- Korean text at 390px viewport width checked without horizontal overflow.
- Reduced-motion static appearance checked in both renderer types.
- Physical-phone GPU/battery performance and Safari remain unmeasured.

## Liquid, vapor, prism, and glyph studies

Modes 52–66 use `attachTransformations` from `transformations.js`, with the same lifecycle/control methods as the other renderers. The bench switches among three engines while keeping one active specimen canvas.

- Liquid: Waterfall type. A persistent rippling, highlighted text mask emits droplets from lower glyph boundaries. Gravity drives the streams; nearby pointer movement gently bends their velocity. Emission is continuous while visible, with a 420-particle cap. Freeze and reduced motion stop animation. Honey, Mercury, Ink whirlpool, and Water rising have been removed.
- Vapor: Tea steam, Incense, Smoke away. Emission samples upper glyph boundaries; buoyancy, coherent oscillations and pointer velocity bend overlapping, feathered density puffs. Emission is continuous. Shared Consumed state erodes a spreading raster front and then reforms; this is not a volumetric smoke solver or exact mass-conserving erosion.
- Prism: Prism beam, Caustic ribbons, Polarized double. Spectral scanline projections and angular dual-image transmission provide stylized optics, not ray-traced refraction.
- Glyphs: Number matter, Alphabet scramble, Hangul mosaic, Jamo rain. Coverage-sampled cells replace local ink with digits, Latin letters, valid precomposed Hangul syllables, or separate jamo. Jamo rain does not compose syllable blocks.

Pointer/touch movement, press, Disturb, strength, scale, Auto, Freeze, and keyboard controls are supported. Reduced motion renders static text; offscreen/hidden rendering pauses. Smoke is capped at 420 particles; density processing uses half resolution. Real-device frame time and battery use remain unmeasured.

Consuming vapor (62) removes raster cells along a spreading front and emits smoke only as their opacity decreases. The word is fully consumed before it reforms. Waterfall type (63) continuously emits water from a watery heading. This is a lightweight visual approximation, not a fluid solver. Strength controls emission rate; Scale changes droplet size.

## Elements collection

The Elements family groups nine studies: Wind tunnel, Falling grains, Tea steam, Incense, Smoke away, Consumed by vapor, Waterfall type, Living flame (65), and Trade winds (66). It replaces the separate Liquid and Vapor filters. Wind tunnel and Falling grains still use the physics renderer.

Living Flame feeds a continuous heat field from the entire glyph mask. Semi-Lagrangian advection, buoyant rise, turbulent velocity, cooling, and a temperature color ramp create connected flames. The grid is capped at 420 × 180; it is a stylized heat transport simulation, not a full combustion solver. Trade Winds keeps a softly flexing body with emitted airflow trails. Both respond to pointer velocity, run continuously while visible, pause with Freeze or hidden/offscreen state, and render static native-looking text for reduced motion. Trade Winds caps emitted particles at 280; Waterfall caps at 420. These are stylized effects, not fluid or combustion solvers.

Water, fire, wind, and all vapor studies share Default / Consumed controls. Default retains a readable body; Consumed removes it along a spreading front, releases material, then reforms on a repeating cycle. Disturb restarts that cycle. Strength controls effect density and the balance with readable lettering; Scale controls flame reach, water droplet/trail size, wind trail length, and smoke spread. Reduced motion and zero Strength always show the complete original text.

## Composition sandbox

The sandbox explores graphic compositions separately from the Elements collection. Fourteen geometric/optical/signal transformations feed five signal finishes: RGB separation, pixelation, ordered dither, scanlines, and pixels plus RGB. Each finish samples the transformed result. Six curated recipes demonstrate spiral color separation, pixelated folds, dithered fractures, spectral tunnels, woven scanlines, and codec breakup.

One WebGL canvas and one draw pass handle the chain; RGB finishes evaluate the shape at three sample positions. Only composition renderers compile the extra shader. Independent Shape and Signal strength/scale controls, color grade, Auto gesture, Freeze, Restart, and Shape only comparison are available. Global text and typeface controls apply. No elemental states or duplicate text layers are used in this sandbox. Reduced motion disables both animated transformations and signal treatment.

## Architecture and performance pass

The three renderers keep their drawing algorithms local and share a small frame scheduler. A draw callback returns whether it needs another frame; independent freeze, offscreen, hidden-document, and context-loss gates stop scheduling. Disposed loops cannot restart. Canvas observers and pointer listeners remain owned and removed by their renderer.

Composition intensity/spread controls update only the affected layer. Element scale changes no longer rebuild text masks, reset material particles, or allocate heat grids. Glyph scale still rebuilds its coverage cells because it changes the grid. Identical resize notifications are filtered by a layout key; explicit refresh and font-ready refresh remain available.

Fire alone allocates its bounded heat grid. Water emission sites are cached during layout. Atmosphere-only wind skips its invisible body pass. Smoke uses fractional, time-based emission rather than rounding up once per frame. Removed obsolete liquid-particle and consumption state. Public intensity and detail setters bound finite numbers, and unavailable canvas/shader renderers preserve native text.

Validation: 18 deterministic tests (physics, scheduling, bounds, fallback); syntax/lint checks; Astro build; browser switching through all 46 research studies and all six recipes with stable canvas counts and no console errors. Reduced-motion composition fallback and frozen controls were checked in the browser. These checks do not establish real-phone FPS, GPU memory, battery cost, or long-duration listener/heap stability. Each original demo still owns a WebGL context; a shared GPU surface remains a separate architectural step for pages with many live headings. Context loss deliberately falls back to native text rather than trying to reconstruct the GPU program.

Development checks (from repository root):

```sh
node --test public/type-lab/tests/*.test.mjs
npx prettier@3.6.2 --check 'public/type-lab/*.js' 'public/type-lab/tests/*.mjs' public/type-lab/index.html public/type-lab/styles.css
npx eslint@9.39.1 --no-config-lookup --rule 'no-unused-vars: error' public/type-lab/*.js
npm run build
```

Formatting and lint tools are development-only; the library still has no runtime dependencies.

## Public showcase

`showcase.css` and `showcase.js` add the cold-tone hero and four graphic scenes before the lab. The hero pairs lenticular distortion with RGB separation; the scenes explore optics/RGB, fracture/dither, accordion/scanlines, and vortex/RGB. All backgrounds use CSS, without image assets. The public package API owns the text rendering. An intersection observer mounts visible compositions and destroys offscreen instances; pointer movement takes over from automatic flow, and leaving resumes it. The navigation provides a motion pause control; reduced-motion preferences are respected by the renderer. The lab's text controls do not modify the authored showcase copy.

The cinematic revision adds showcase-only shaders in `showcase-effects.js`: a 14-second travelling focal-plane/depth pass for the hero, a 460 ms transmission interruption every 9.7 seconds for the observatory, and a radial shockwave every 8.5 seconds through the fractured poster. CSS animates orbital scenery, radio contours, and the studio fan. Motion pauses offscreen and with the showcase pause button; reduced motion disables both shader choreography and CSS animation. Cursor control yields back to the automatic sequence after 1.2 seconds idle. These art-directed shaders do not add bytes to the reusable package.

The current hero uses `showcase-hero.js`: individually measured DOM letter planes with perspective, shaded extrusion, RGB channels and short sliced glitches. A 12-second flight-and-settle sequence preserves the original semantic heading and pauses cleanly; the decorative layer is hidden for reduced motion. The fifth scene presents the package waterfall in a thermal-retreat setting with architectural light, stone panels, mist and pool contours. The page uses a full-width shell and consistently inset lab controls. All showcase effects remain separate from the published-package source.
