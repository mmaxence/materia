import test from 'node:test';
import assert from 'node:assert/strict';
import { applyTypography } from '../src/internal/text-mask.js';
const style = {
  fontStyle: 'italic', fontWeight: '650', fontSize: '32px', fontFamily: 'serif',
  fontKerning: 'none', fontStretch: '75%', fontVariantCaps: 'small-caps',
  textRendering: 'optimizeLegibility', direction: 'rtl', letterSpacing: '-1px', wordSpacing: '6px',
};
test('canvas receives font selection, spacing, kerning, caps and direction', () => {
  const ctx = Object.fromEntries(Object.keys(style).map(k => [k, '']));
  assert.equal(applyTypography(ctx, style), false);
  assert.equal(ctx.font, 'italic 650 32px serif');
  assert.equal(ctx.textAlign, 'left');
  assert.equal(ctx.direction, 'rtl');
  assert.equal(ctx.fontStretch, 'condensed');
  assert.equal(ctx.fontVariantCaps, 'small-caps');
  assert.equal(ctx.fontKerning, 'none');
  assert.equal(ctx.wordSpacing, '6px');
  assert.equal(ctx.letterSpacing, '-1px');
});
test('partial Canvas spacing support uses positioned glyphs without double spacing', () => {
  const ctx = { letterSpacing: '0px' };
  assert.equal(applyTypography(ctx, style), true);
  assert.equal(ctx.letterSpacing, '0px');
  assert.equal('wordSpacing' in ctx, false);
  assert.equal(applyTypography({}, {...style, letterSpacing: 'normal', wordSpacing: 'normal'}), false);
});
