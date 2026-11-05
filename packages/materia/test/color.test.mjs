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
