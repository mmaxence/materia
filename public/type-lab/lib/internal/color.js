// Let the browser convert CSS color spaces to the renderer's sRGB channels.
export function resolveColor(value) {
  if (Array.isArray(value)) return value;
  const rgb = /^rgba?\(\s*([\d.]+)[, ]+([\d.]+)[, ]+([\d.]+)(?:\s*[,/].*)?\)$/.exec(value);
  if (rgb) return rgb.slice(1, 4).map(channel => Number(channel) / 255);
  if (typeof value !== "string" || !CSS.supports("color", value))
    throw new TypeError("color must be a CSS color or an RGB channel array.");
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.fillStyle = value;
  ctx.fillRect(0, 0, 1, 1);
  return Array.from(ctx.getImageData(0, 0, 1, 1).data.slice(0, 3), channel => channel / 255);
}
