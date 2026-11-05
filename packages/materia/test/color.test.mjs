import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveColor } from '../src/internal/color.js';

test('RGB colors keep their channels; OKLCH is converted by the browser rather than parsed as RGB', () => {
  assert.deepEqual(resolveColor('rgb(255, 128, 0)'), [1, 128/255, 0]);
  assert.deepEqual(resolveColor([0.2, 0.3, 0.4]), [0.2, 0.3, 0.4]);
  const previous = { document: globalThis.document, CSS: globalThis.CSS };
  const context = { fillRect() {}, getImageData: () => ({ data: new Uint8ClampedArray([100, 150, 200, 255]) }) };
  globalThis.document = { createElement: () => ({ getContext: () => context }) };
  globalThis.CSS = { supports: (_, value) => value === 'oklch(70% 0.1 250)' };
  try {
    assert.deepEqual(resolveColor('oklch(70% 0.1 250)'), [100/255, 150/255, 200/255]);
    assert.equal(context.fillStyle, 'oklch(70% 0.1 250)');
    assert.throws(() => resolveColor('not-a-color'), TypeError);
  } finally { Object.assign(globalThis, previous); }
});

test('hex shorthand, full hex and alpha-bearing hex preserve RGB channels', () => {
  for (const color of ['#f80', '#F80F', '#ff8800', '#FF880000'])
    assert.deepEqual(resolveColor(color), [1, 136/255, 0]);
  assert.deepEqual(resolveColor(' #000 '), [0, 0, 0]);
  assert.deepEqual(resolveColor('#fff'), [1, 1, 1]);
});

test('channel arrays are validated and copied', () => {
  for (const invalid of [[1, 2, 3], [0, 0], [NaN, 0, 0], [Infinity, 0, 0], [-1, 0, 0], ['1', 0, 0], null, 123])
    assert.throws(() => resolveColor(invalid), TypeError);
  const color = [0, 0.5, 1];
  assert.notEqual(resolveColor(color), color);
});

test('CSS-only syntax unsupported by Canvas fails instead of silently becoming black', () => {
  const previous = { document: globalThis.document, CSS: globalThis.CSS };
  let fill;
  const ctx = { set fillStyle(value) { if (value.startsWith('#')) fill = value; }, get fillStyle() { return fill; } };
  globalThis.CSS = { supports: () => true };
  globalThis.document = { createElement: () => ({ getContext: () => ctx }) };
  try {
    assert.throws(() => resolveColor('unsupported(1 2 3)'), /cannot render/);
    assert.throws(() => resolveColor('var(--brand)'), /contextual/);
    assert.throws(() => resolveColor('inherit'), /contextual/);
  } finally { Object.assign(globalThis, previous); }
});
