# Eight practical Type recipes

Source/local alpha 0.1.0-alpha.1. Open index.html from an HTTP server. The selector or #launch, #editorial, #navigation, #status, #data, #poster, #localized, #spatial opens a recipe. All eight source sections remain readable without JavaScript. This page uses original text/system fonts, no photograph, remote font, new service or premium asset. Examples are excluded from the runtime tarball; use the repository/site copies. Local copies are not a live publication.

## Choose by the job

| Recipe | Actual effect and defaults | Semantic job and useful action |
| --- | --- | --- |
| Launch headline | chromaticLens, strength .35, scale 12, auto false | Plain h3 inside a real heading hierarchy; preview button records local selection. Replay supplies deliberate emphasis. |
| Editorial emphasis | Same chromaticLens, .14 / 16 / false | A short quotation in blockquote; article and attribution stay native. Lower strength is a preset, not a new effect. |
| Navigation / CTA | Same chromaticLens, .22 / 12 / false | Plain span inside native button; click/Enter/Space opens native details and updates a separate output. Decoration never implements the action. Real navigation should use an anchor with its real href. |
| Readable status | Same chromaticLens, .12 / 16 / false | Plain p with role=status/aria-live=polite; save action writes Changes saved once. No animated character changes or frame-by-frame announcements. |
| Data highlight | Standalone dither signal, .16 / 14 / false | Named output holds the actual illustrative percentage; Next sample updates its source value. Effect strength is not a data scale. |
| Kinetic poster | Ordered vortex (.35 / 12) + rgbSplit (.16 / 14); auto true | A short poster, one GPU stack/canvas. Layer checkbox calls setLayer(1,{enabled}); no separate top-level signal. Pause/native controls remain available. |
| Localized long text | chromaticLens on short Korean title, .12 / 16 / false | Long original Korean/English paragraph stays native and wraps normally. Title input over 120 code points uses native text too. This is an application content limit, not a measured library-wide script limit. |
| Text within spatial panels | chromaticLens, .18 / 14 / false, inside real flat Space panels | Dedicated Type host inside a visual leaf, separate native note field/selection button. Child Type is destroyed before Space. Pinned Space source is an example fixture, not a Type dependency/export. |

For a title/CTA, begin with one low-strength optic. Use a standalone signal for a print/sampling treatment, not an additional geometry alias. Use geometry plus signal only when the poster needs both; a stack costs more passes. These recipes deliberately reuse one optic instead of relabeling overlapping treatments. Physics/elements/glyph effects remain available through their documented entries, but are not defaults for readable status, navigation or body copy. No effect has been removed or renamed.

## Consistent options and lifecycle

All definitions use the actual effect object, strength (0–1), scale (1–24), auto and a dedicated ancestor host. Only the poster sets auto:true. setFrozen is the user-pause mechanism; auto:false does not disable pointer/replay motion. Do not confuse standalone signal strength/scale with attached signalStrength/signalScale, or stack setLayer with whole-controller setStrength. No common speed/duration/font/DPR option or new runtime API is invented. Changing effect/host/resolved color requires destroy/remount; source text changes use the library observer, and typography edits call refresh.

main.js is one application owner. It mounts at most one Type controller, holds explicit user pause/native intent independently of system preference, removes child effects before replacing scenes, and cancels stale dynamic imports/font-ready callbacks with a generation check. mountRecipes is idempotent while mounted. disposeRecipes is idempotent, aborts owned control/preference/font listeners, destroys the child and then the Space parent, and reveals source sections. Call it before removing/reparenting the gallery root in an app route. Helpers are not package APIs. The native form nodes are not cloned or replaced. Font listeners/timers owned by your application require the same cleanup discipline.

The UI selects among system sans, system serif and monospace; it changes actual source CSS then refreshes. The renderer also handles initial document.fonts.ready. The GPU refresh path paints updated text/font/size while frozen without restarting its loop, including a static redraw when a hidden/offscreen host returns. Late font readiness is guarded against teardown/replacement; the validation includes a deliberately delayed FontFaceSet-ready promise. No font file is downloaded or redistributed. Fonts available on different operating systems, missing glyph fallback, text zoom/contrast and arbitrary font loading must still be tested on the actual target environment.

## Static content and meaningful controls

Use native text destroys the effect and persists across preference changes/remounts in this owner. Reduced preference also chooses native text. Turning the preference off can restore decoration only if explicit native intent does not block it. Pause remains independent and is retained on effect remount. No-JS and failed-renderer modes keep authored text/labels/forms. Canvas is decorative, aria-hidden and pointer-events:none; assistive meaning stays in the source element. Status/output values are written as source text, not canvas-only content.

This adapter chooses a stricter native reduced policy than the library's sampled static rendering. supported reports initial creation capability; later context loss restores source/hides the GPU canvas but need not change that flag. Explicit effect remount is the recovery action. Do not overwrite status on every renderer frame or turn hover animation into the only indication of action. Keyboard behavior and controls must remain useful when decoration is unavailable.

Plain text is the effect contract: no nested emphasis/icons/links inside its target. Use adjacent native markup. Native long body paragraphs are intentional, not a promise to correctly rasterize every bidi/vertical/complex-script layout. Korean/Latin examples exercise this environment's system font shaping only; no full-language/assistive-tech certification is claimed.

## Spatial boundary

vendor/space is a licensed, unmodified local snapshot from Space 4ecc9e5 (runtime 6e9e052). Its independent @strata-ui/core import map and stylesheet are separate from Type imports. The recipe uses compactWidth:1600 inside a host capped at 1000px, so the actual Space controller uses flat document layout. Type mounts after parent layout, owns only its dedicated host/source, and receives no global/shared scheduler. Inspect notes changes Space's selection while preserving the native field; selection is not modal focus management.

No camera/preserving ancestor gets blur, opacity or filters from this recipe. Styling is on visual leaves. Translation/scale/perspective/rotation change bounds and child pointer mapping; rectangle subtraction is not a general inverse projection. A projected/rotated Space composition, hidden/occluded child scheduling, drag/touch arbitration and texture sharing remain experimental/separate. Do not enable 3D and call this evidence a certification of VIS-11/VIS-61 or all six library pairs.

## Delivery, tests and limits

Keep @materia/text and existing selective entry paths. Use reviewed source or an actual locally packed tarball; package/registry ownership and npm availability are not established. No live site/source parity follows. Source maps/types/examples/assets have distinct packaging boundaries.

Run npm test, npm run typecheck, npm run sync-demo, npm run check:docs, npm run check:examples and npm run check:recipes from packages/materia. Node 22 and Chrome are needed; CHROME selects its executable. Recipe validation uses source, website mirrors and actual offline-installed Type consumer bundles, with a separately pinned example-only Space snapshot. It covers all eight recipes, native controls/content/font changes, long-text policy, reduced/native/no-WebGL/no-JS, async/disposal and repeated teardown. Native keyboard input and pixels are observed in Chromium; headless/software/emulated checks are not physical mobile GPU/FPS/memory/thermals, Safari/Firefox, full assistive-technology or projected composition evidence. The unresolved showcase photograph is not loaded, copied or changed.
