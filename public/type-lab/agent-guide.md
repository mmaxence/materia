# Integrating Living Type

Experimental alpha; not published to npm. Library code is MIT licensed; retain the [license notice](https://mmaxence.github.io/materia/LICENSE) when redistributing it.

A prototype can import the hosted sources; for reproducibility pin a repository commit and self-host the source directory.

```html
<div class="title-host" style="position:relative;padding:2rem">
  <h1 id="title">Make type move.</h1>
</div>
<script type="module">
import {createTextEffect} from 'https://mmaxence.github.io/materia/lib/index.js';
import {chromaticLens} from 'https://mmaxence.github.io/materia/lib/optics.js';
const fx=createTextEffect(document.querySelector('#title'),{
  effect:chromaticLens,strength:0.7,scale:12,auto:false
});
fx.pulse();
// On component unmount: fx.destroy();
</script>
```

Use a connected plain-text heading with no child markup, inside a dedicated container. Mount in the client lifecycle, never during SSR. Preserve native text and reduced-motion behavior. Do not mount two controllers on one heading. Call destroy() before removing or reparenting the host; call refresh() after external font/style changes that do not resize it.

Optics, geometry and signal use GPU rendering; physics, elements and glyphs use their respective Canvas renderers. GPU stack composition supports at most six layers. Do not mix Canvas families into the GPU stack or promise per-layer independent pointer/motion timelines. Consult api.md and the public type files for supported options; do not infer options from similar libraries.

Develop: npm ci --prefix packages/materia; npm test --prefix packages/materia; npm run typecheck --prefix packages/materia; npm run sync-demo --prefix packages/materia. Source modules are synced to the website's lib/ directory.

Related products: [Solids](https://mmaxence.github.io/solids/) for 3D objects; [Prisma](https://mmaxence.github.io/prisma/) for media effects.
