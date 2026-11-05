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
