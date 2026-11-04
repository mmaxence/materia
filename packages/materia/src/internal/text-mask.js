// Browser layout remains authoritative; this raster is only a decorative twin.
export function rasterize(element, host, dpr = 1) {
  const box = host.getBoundingClientRect();
  const raster = document.createElement("canvas");
  raster.width = Math.max(1, Math.round(box.width * dpr));
  raster.height = Math.max(1, Math.round(box.height * dpr));
  const ctx = raster.getContext("2d", { willReadFrequently: true }),
    style = getComputedStyle(element);
  ctx.scale(dpr, dpr);
  ctx.fillStyle = "white";
  ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  ctx.textBaseline = "alphabetic";
  const node = element.firstChild;
  if (node?.nodeType === Node.TEXT_NODE) {
    const lines = [];
    const segments = new Intl.Segmenter(element.lang || undefined, {
      granularity: "grapheme",
    }).segment(node.textContent);
    for (const part of segments) {
      const range = document.createRange();
      range.setStart(node, part.index);
      range.setEnd(node, part.index + part.segment.length);
      const b = range.getBoundingClientRect();
      if (!b.width) continue;
      let line = lines.find((l) => Math.abs(l.top - b.top) < 2);
      if (!line) {
        line = { top: b.top, left: b.left, height: b.height, text: "" };
        lines.push(line);
      }
      line.text += part.segment;
      line.left = Math.min(line.left, b.left);
    }
    for (const line of lines) {
      const metrics = ctx.measureText(line.text);
      const ascent =
        metrics.fontBoundingBoxAscent ?? parseFloat(style.fontSize) * 0.8;
      const descent =
        metrics.fontBoundingBoxDescent ?? parseFloat(style.fontSize) * 0.2;
      ctx.fillText(
        line.text,
        line.left - box.left,
        line.top - box.top + (line.height - ascent - descent) / 2 + ascent,
      );
    }
  }
  return raster;
}
