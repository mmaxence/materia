# Color and letter spacing

Materia reads the heading's computed CSS color and letter spacing when mounted.
CSS colors such as `oklch(75% 0.15 250)` are converted by the browser to sRGB for
GPU effects. Wide-gamut colors are limited to that output gamut; color alpha is
not applied. Existing `[r, g, b]` arrays in the 0–1 range remain supported.
Element simulations retain their material palettes.

```js
const fx = createTextEffect(heading, {
  effect: rgbSplit,
  color: 'oklch(75% 0.15 250)',
  letterSpacing: '0.04em',
});
fx.setLetterSpacing(-1); // numbers are pixels
```

Omit `letterSpacing` to use the heading's CSS. Call `fx.refresh()` after changing
its CSS typography externally. The setter refreshes automatically. `destroy()`
restores the inline letter spacing that existed before mounting. Browsers without
Canvas letter-spacing support use DOM-positioned graphemes for spaced text.

## Compatibility and boundaries

- Color inputs: `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`, named colors, RGB/HSL,
  OKLCH/OKLab/Lab/LCH, and `color()` when supported by the browser's Canvas parser.
  Unsupported syntax throws rather than silently rendering black. RGB arrays must
  contain exactly three finite channels in 0–1. Color inputs are not a transparency
  API: use opaque colors; alpha-bearing hex retains RGB but ignores alpha.
- `currentColor` as an option resolves from the heading. For CSS variables, apply
  `color: var(--brand)` to the heading and omit the color option. Detached Canvas
  cannot resolve `var()` strings directly.
- Font family, size, weight, italic style, letter spacing and word spacing are read
  from CSS. DOM line boxes supply wrapping, alignment and line-height positioning.
- Kerning, standard font-stretch widths, caps and direction are forwarded where
  supported by Canvas. Older browsers may not expose these optional controls.
- Arbitrary `font-variation-settings`, `font-feature-settings`, CSS text transforms,
  vertical writing, nested markup and pixel-exact complex-script shaping in the
  per-grapheme spacing fallback are not guaranteed. Supply transformed text directly.
- `refresh()` updates typography. Color is captured at mount; recreate an effect
  after changing the heading's color. Mutating ancestor styles is not auto-observed.
