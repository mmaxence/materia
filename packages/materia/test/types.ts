import { createTextEffect, type TextEffectController } from "@materia/text";
import { chromaticLens } from "@materia/text/optics";
import { vortex } from "@materia/text/geometry/vortex";
import { rgbSplit } from "@materia/text/signal/rgbSplit";
import { waterfall } from "@materia/text/elements";
import { hangul } from "@materia/text/glyphs";
import { looseAtoms } from "@materia/text/physics";
declare const heading: HTMLHeadingElement;
const effect: TextEffectController = createTextEffect(heading, {
  effect: vortex,
  signal: rgbSplit,
  strength: 0.7,
  signalScale: 12,
});
effect.setStrength(0.5);
effect.setSignal(0.8, 14);
effect.destroy();
for (const effect of [chromaticLens, waterfall, hangul, looseAtoms])
  createTextEffect(heading, { effect, auto: true }).destroy();
// @ts-expect-error strength is numeric
createTextEffect(heading, { effect: vortex, strength: "strong" });
// @ts-expect-error effects must be imported descriptors, not names
createTextEffect(heading, { effect: "vortex" });

import { stack } from '@materia/text/stack';
const composition = createTextEffect(heading, {
  effect: stack([{ effect: vortex, strength: .7 }, { effect: rgbSplit, enabled: true }]),
});
composition.setLayer(0, { strength: .5, scale: 12, enabled: false });
// @ts-expect-error layer strength is numeric
composition.setLayer(0, { strength: 'strong' });
composition.destroy();

const typography = createTextEffect(document.createElement('h1'), {
  effect: rgbSplit,
  color: 'oklch(75% 0.15 250)',
  letterSpacing: '0.04em',
});
typography.setLetterSpacing(-1);
