import { createTextEffect } from '@materia/text';
import { stack } from '@materia/text/stack';
import { vortex } from '@materia/text/geometry/vortex';
import { rgbSplit } from '@materia/text/signal/rgbSplit';

// Example application code. Only createTextEffect is a library controller factory.
const root = document.querySelector('[data-example]');
if (!(root instanceof HTMLElement)) throw new Error('Example root is missing');
const heading = root.querySelector('[data-heading]');
const host = root.querySelector('[data-host]');
const copy = root.querySelector('[data-copy]');
const status = root.querySelector('[data-status]');
const pause = root.querySelector('[data-pause]');
const pulseButton = root.querySelector('[data-pulse]');
const mountButton = root.querySelector('[data-mount]');
const destroyButton = root.querySelector('[data-destroy]');
if (!(heading instanceof HTMLElement) || !(host instanceof HTMLElement) ||
    !(copy instanceof HTMLInputElement) || !(status instanceof HTMLElement) ||
    !(pause instanceof HTMLButtonElement) || !(pulseButton instanceof HTMLButtonElement) ||
    !(mountButton instanceof HTMLButtonElement) || !(destroyButton instanceof HTMLButtonElement)) throw new Error('Example markup is incomplete');
const layerInput = root.querySelector('[data-layer]');
if (!(layerInput instanceof HTMLInputElement)) throw new Error('Layer control is missing');
const events = new AbortController();
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
/** @type {import('@materia/text').TextEffectController | null} */
let fx = null;
let frozen = false;
let disposed = false;
const paintStatus = () => {
  status.textContent = fx
    ? `Mounted. Initial renderer ${fx.supported ? 'available' : 'unavailable: native text retained'}. ${reduced.matches ? 'Reduced motion enabled.' : 'System motion allowed.'}`
    : 'Effect destroyed. Native heading and styles restored.';
  pause.setAttribute('aria-pressed', String(frozen));
  pause.textContent = frozen ? 'Resume motion' : 'Pause motion';
}
const mount = () => {
  if (disposed) return;
  fx?.destroy();
  fx = createTextEffect(heading, { effect: stack([{effect: vortex, strength: 0.4, scale: 12}, {effect: rgbSplit, strength: Number(layerInput.value), scale: 14}]), host, auto: true, frozen });
  paintStatus();
}
pulseButton.addEventListener('click', () => fx?.pulse(), {signal: events.signal});
pause.addEventListener('click', () => { frozen = !frozen; fx?.setFrozen(frozen); paintStatus(); }, {signal: events.signal});
copy.addEventListener('input', () => { heading.textContent = copy.value; }, {signal: events.signal});
destroyButton.addEventListener('click', () => { fx?.destroy(); fx = null; paintStatus(); }, {signal: events.signal});
mountButton.addEventListener('click', mount, {signal: events.signal});
layerInput.addEventListener('input', () => fx?.setLayer(1, {strength: Number(layerInput.value)}), {signal: events.signal});
reduced.addEventListener('change', paintStatus, {signal: events.signal});
export function disposeExample() {
  if (disposed) return;
  disposed = true;
  events.abort();
  fx?.destroy();
  fx = null;
  paintStatus();
}
// pagehide is a page teardown boundary. Frameworks should call the same cleanup in unmount.
window.addEventListener('pagehide', disposeExample, {once: true, signal: events.signal});
mount();
