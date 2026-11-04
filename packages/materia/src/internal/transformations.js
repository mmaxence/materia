import { sourcePresentation } from "./renderer-utils.js";
import { nativeFallback, layoutKey, boundedNumber } from "./renderer-utils.js";
import { isElementMode, isGlyphMode } from "./effect-modes.js";
import { createFrameLoop } from "./frame-loop.js";
import { rasterize } from "./text-mask.js";

// One bounded Canvas 2D surface, shared by the liquid, vapor, prism and glyph studies.
export function attachTransformations(element, options = {}) {
  const host = options.host ?? element.parentElement,
    canvas = document.createElement("canvas");
  canvas.className = "material-canvas";
  canvas.style.cssText =
    "position:absolute;inset:0;width:100%;height:100%;pointer-events:none";
  const source = sourcePresentation(element);
  canvas.setAttribute("aria-hidden", "true");
  host.append(canvas);
  const ctx = canvas.getContext("2d"),
    field = document.createElement("canvas"),
    fc = field.getContext("2d", { willReadFrequently: true }),
    reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const readableBody = document.createElement("canvas"),
    bodyContext = readableBody.getContext("2d");
  const flameSurface = document.createElement("canvas"),
    flameContext = flameSurface.getContext("2d");
  const activeBody = document.createElement("canvas"),
    activeContext = activeBody.getContext("2d");
  if (!ctx || !fc || !bodyContext || !flameContext || !activeContext)
    return nativeFallback(canvas);
  let consumptionProgress = null;
  let consumed = false,
    cycle = 0,
    liveRaster;
  const isElement = () => isElementMode(mode);
  let heat,
    heatNext,
    fuel,
    flameImage,
    fw = 1,
    fh = 1;
  let origin = [0, 0],
    tiles = [],
    water = [],
    ripples = [],
    waterSites = [],
    bottomEdges = [],
    emission = 0,
    elementParticles = [];
  let mode = options.mode ?? 63,
    w = 1,
    h = 1,
    raster,
    cells = [],
    smoke = [],
    edges = [],
    time = 0,
    energy = 0,
    strength = boundedNumber(options.intensity, 0, 1, 0.8),
    detail = 10,
    flow = false,
    frozen = false,
    visible = true,
    dead = false,
    held = false,
    point = [0, 0],
    velocity = [0, 0],
    previousInput = 0,
    spacing = 4,
    dpr = 1;
  // Cached feathered density sprite: overlapping puffs form vapor, without stroked trails.
  const puff = document.createElement("canvas");
  puff.width = puff.height = 64;
  const pc = puff.getContext("2d");
  const haze = pc.createRadialGradient(32, 32, 0, 32, 32, 32);
  haze.addColorStop(0, "rgba(220,233,242,.7)");
  haze.addColorStop(0.35, "rgba(220,233,242,.38)");
  haze.addColorStop(0.7, "rgba(220,233,242,.1)");
  haze.addColorStop(1, "rgba(220,233,242,0)");
  pc.fillStyle = haze;
  pc.fillRect(0, 0, 64, 64);
  const radius = () => 65 + detail * 5;
  const near = (x, y) =>
    Math.exp(-((x - point[0]) ** 2 + (y - point[1]) ** 2) / radius() ** 2);
  function refresh() {
    if (dead) return;
    const box = host.getBoundingClientRect();
    w = Math.max(1, box.width);
    h = Math.max(1, box.height);
    dpr = Math.min(devicePixelRatio, 1.5);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    raster = rasterize(element, host, 1);
    liveRaster = raster;
    activeBody.width = raster.width;
    activeBody.height = raster.height;
    cycle = 0;
    const pixels = raster
      .getContext("2d")
      .getImageData(0, 0, raster.width, raster.height).data;
    const alpha = (x, y) =>
      x < 0 || y < 0 || x >= raster.width || y >= raster.height
        ? 0
        : pixels[(Math.floor(y) * raster.width + Math.floor(x)) * 4 + 3] || 0;
    spacing = Math.max(3, Math.ceil(Math.sqrt((w * h) / 22000)));
    edges = [];
    cells = [];
    bottomEdges = [];
    for (let y = 0; y < h; y += spacing)
      for (let x = 0; x < w; x += spacing)
        if (alpha(x, y) > 100) {
          if (alpha(x, y - spacing) < 100) edges.push({ x, y });
          if (alpha(x, y + spacing) < 100) bottomEdges.push({ x, y });
        }
    // Glyph cells use coverage rather than only their centers, preserving thin serifs.
    const cell = 7 + Math.round(detail * 0.3);
    if (isGlyphMode(mode))
      for (let y = 0; y < h; y += cell)
        for (let x = 0; x < w; x += cell) {
          let coverage = 0;
          for (let yy = 0; yy < cell; yy += 2)
            for (let xx = 0; xx < cell; xx += 2)
              coverage += alpha(x + xx, y + yy) > 100 ? 1 : 0;
          if (coverage)
            cells.push({
              x,
              y,
              size: cell,
              coverage: Math.min(1, coverage / ((cell * cell) / 4)),
              seed: Math.random(),
            });
        }
    waterSites = bottomEdges.filter(
      (_, i) => i % Math.max(1, Math.ceil(bottomEdges.length / 26)) === 0,
    );
    tiles = [];
    if (isElement())
      for (let y = 0; y < h; y += 4)
        for (let x = 0; x < w; x += 4) {
          let ink = false;
          for (let yy = 0; yy < 4 && !ink; yy++)
            for (let xx = 0; xx < 4; xx++)
              if (alpha(x + xx, y + yy) > 80) {
                ink = true;
                break;
              }
          if (ink) tiles.push({ x, y, opacity: 1 });
        }
    water = [];
    ripples = [];
    readableBody.width = raster.width;
    readableBody.height = raster.height;
    heat = heatNext = fuel = flameImage = null;
    if (mode === 65) {
      fw = Math.max(2, Math.min(420, Math.ceil(w / 3)));
      fh = Math.max(2, Math.min(180, Math.ceil(h / 3)));
      flameSurface.width = fw;
      flameSurface.height = fh;
      flameContext.drawImage(liveRaster, 0, 0, fw, fh);
      fuel = flameContext.getImageData(0, 0, fw, fh).data;
      heat = new Float32Array(fw * fh);
      heatNext = new Float32Array(fw * fh);
      flameImage = flameContext.createImageData(fw, fh);
    }
    field.width = Math.ceil(w * 0.5);
    field.height = Math.ceil(h * 0.5);
    smoke = [];
    elementParticles = [];
    emission = 0;
    point = [w / 2, h / 2];
    energy = 0;
    held = false;
    origin = [w / 2, h / 2];
    source.hide();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (!options.atmosphere) ctx.drawImage(liveRaster, 0, 0);
    wake();
  }
  function remaining(x, y) {
    if (!consumed) return 1;
    const distance = Math.hypot(x - origin[0], y - origin[1]) / Math.max(w, h);
    const arrival = distance * 2.5 + 0.12 * Math.sin(x * 0.11 + y * 0.17);
    const burn = Math.max(0, Math.min(1, (cycle - arrival) * 1.5));
    const reform = Math.max(
      0,
      Math.min(1, (cycle - 5.5 - arrival * 0.25) / 1.6),
    );
    return 1 - burn + burn * reform;
  }
  function prepareBody(dt) {
    if (!isElement() || !consumed) {
      liveRaster = raster;
      return;
    }
    cycle = consumptionProgress === null
      ? (cycle + dt * (options.consumptionRate ?? 0.65 + strength * 0.6)) % 9
      : consumptionProgress * 4;
    activeContext.clearRect(0, 0, w, h);
    for (const tile of tiles) {
      const opacity = remaining(tile.x, tile.y);
      if (mode <= 54 || mode === 62) {
        if (
          opacity < tile.opacity &&
          Math.random() < (tile.opacity - opacity) * 0.5 &&
          smoke.length < 420
        )
          smoke.push({
            x: tile.x,
            y: tile.y,
            vx: velocity[0] * 0.08,
            vy: -20 - Math.random() * 20,
            age: 0,
            life: 2.5 + Math.random(),
            seed: Math.random() * 8,
            trail: [],
          });
      }
      const released = Math.max(0, tile.opacity - opacity);
      if (mode === 63 && water.length < 420 && Math.random() < released * 0.35)
        water.push({
          x: tile.x,
          y: tile.y,
          vx: velocity[0] * 0.04,
          vy: 18,
          r: (0.6 + Math.random()) * (0.7 + detail / 25),
          age: 0,
          trail: [],
          splash: false,
        });
      if (
        mode === 66 &&
        elementParticles.length < 280 &&
        Math.random() < released * 0.25
      )
        elementParticles.push({
          x: tile.x,
          y: tile.y,
          age: 0,
          life: 1.4 + Math.random() * 1.5,
          vx: 65 + Math.random() * 45,
          vy: (Math.random() - 0.5) * 10,
          seed: Math.random() * 9,
          trail: [],
        });
      tile.opacity = opacity;
      activeContext.globalAlpha = opacity;
      activeContext.drawImage(
        raster,
        tile.x,
        tile.y,
        4,
        4,
        tile.x,
        tile.y,
        4,
        4,
      );
    }
    activeContext.globalAlpha = 1;
    liveRaster = activeBody;
  }
  function vapor(dt, k) {
    const dissolve = mode === 54,
      incense = mode === 53;
    if (!options.atmosphere) ctx.drawImage(liveRaster, 0, 0);
    emission += consumed ? 0 : dt * 110 * k;
    const emissions = Math.min(12, Math.floor(emission));
    emission -= emissions;
    for (let i = 0; i < emissions && edges.length && smoke.length < 420; i++) {
      const e = edges[Math.floor(Math.random() * edges.length)];
      if (Math.random() > 0.35 + 0.65 * near(e.x, e.y)) continue;
      smoke.push({
        x: e.x,
        y: e.y,
        vx: velocity[0] * 0.12,
        vy: -18 - Math.random() * 20,
        age: 0,
        life: 2 + Math.random() * 2,
        seed: Math.random() * 8,
        trail: [],
      });
    }
    for (const p of smoke) {
      p.age += dt;
      p.trail.unshift([p.x, p.y]);
      if (p.trail.length > 25) p.trail.pop();
      p.vx +=
        (Math.sin(p.y * 0.025 + time * 1.2 + p.seed) * (incense ? 10 : 18) +
          near(p.x, p.y) * velocity[0] * 0.22 -
          p.vx * 0.8) *
        dt;
      p.vy -= dt * 5;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const fade = Math.sin(Math.PI * Math.min(1, p.age / p.life));
      const spread =
        ((incense ? 13 : 19) + p.age * (incense ? 9 : 13)) *
        (0.55 + detail / 24);
      // Broad translucent lobes overlap along the flow and expand as they rise.
      for (let i = 0; i < 3; i++) {
        const tail = p.trail[Math.min(p.trail.length - 1, i * 12)] || [
          p.x,
          p.y,
        ];
        const r = spread * (1 - i * 0.12);
        ctx.globalAlpha =
          fade *
          (dissolve ? 0.2 : incense ? 0.15 : 0.13) *
          (1 - i * 0.22) *
          strength;
        ctx.drawImage(puff, tail[0] - r, tail[1] - r * 1.25, r * 2, r * 2.5);
      }
    }
    ctx.globalAlpha = 1;
    smoke = smoke.filter((p) => p.age < p.life && p.y > -40);
    if (!options.atmosphere) {
      ctx.globalAlpha = 1 - strength * 0.5;
      ctx.drawImage(liveRaster, 0, 0);
      ctx.globalAlpha = 1;
    }
  }
  function prism(k) {
    ctx.globalAlpha = 1 - Math.min(0.9, k * 0.7);
    ctx.drawImage(liveRaster, 0, 0);
    ctx.globalAlpha = 1;
    if (mode === 57) {
      const angle = (point[0] / w) * Math.PI;
      ctx.globalCompositeOperation = "lighter";
      for (let b = 0; b < 2; b++) {
        fc.setTransform(0.5, 0, 0, 0.5, 0, 0);
        fc.clearRect(0, 0, w, h);
        fc.drawImage(
          liveRaster,
          (b ? 1 : -1) * Math.sin(angle) * k * 24,
          (b ? 1 : -1) * Math.cos(angle) * k * 9,
        );
        fc.globalCompositeOperation = "source-in";
        fc.fillStyle = b ? "#e6a6ff" : "#8cdff5";
        fc.fillRect(0, 0, w, h);
        fc.globalCompositeOperation = "source-over";
        ctx.globalAlpha = k * Math.pow(Math.cos(angle + (b * Math.PI) / 2), 2);
        ctx.drawImage(field, 0, 0, w, h);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      return;
    }
    const count = mode === 56 ? 9 : 7;
    ctx.globalCompositeOperation = "lighter";
    for (let band = 0; band < count; band++) {
      fc.setTransform(0.5, 0, 0, 0.5, 0, 0);
      fc.clearRect(0, 0, w, h);
      for (let y = 0; y < h; y += 3) {
        const dy = y - point[1],
          influence = Math.exp((-dy * dy) / (radius() * radius()));
        const offset =
          (band - (count - 1) / 2) *
          k *
          (mode === 57 ? 4 : 8) *
          (0.3 + (point[0] / w - 0.5) * 2) *
          influence;
        const wave =
          Math.sin(y * 0.045 + time * 1.8 + band * 0.2) *
          k *
          (mode === 56 ? 12 : 3);
        fc.drawImage(
          liveRaster,
          0,
          y,
          w,
          3,
          offset + wave,
          y + (mode === 56 ? band * 3 * k : 0),
          w,
          3,
        );
      }
      fc.globalCompositeOperation = "source-in";
      fc.fillStyle = `hsla(${(band / count) * 300},90%,72%,${Math.min(0.55, k * 0.3)})`;
      fc.fillRect(0, 0, w, h);
      fc.globalCompositeOperation = "source-over";
      ctx.drawImage(field, 0, 0, w, h);
    }
    ctx.globalCompositeOperation = "source-over";
    if (mode === 55 && k > 0.02) {
      const g = ctx.createLinearGradient(
        point[0] - radius(),
        0,
        point[0] + radius(),
        0,
      );
      g.addColorStop(0, "transparent");
      g.addColorStop(0.5, `rgba(220,238,255,${k * 0.12})`);
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.fillRect(point[0] - radius(), 0, radius() * 2, h);
    }
  }
  function glyphs(k) {
    const alphabet =
      mode === 58
        ? "0123456789"
        : mode === 59
          ? "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
          : mode === 60
            ? "가나다라마바사아자차카타파하한글빛물꿈별"
            : "ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎㅏㅓㅗㅜㅡㅣ";
    // Erase the raster exactly where symbols take its place.
    ctx.drawImage(liveRaster, 0, 0);
    ctx.globalCompositeOperation = "destination-out";
    for (const c of cells) {
      ctx.globalAlpha = Math.min(1, near(c.x, c.y) * k * 2);
      ctx.fillRect(c.x, c.y, c.size, c.size);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    for (const c of cells) {
      const n = Math.min(1, near(c.x, c.y) * k * 2);
      if (n < 0.015) continue;
      const phase = time * (mode === 59 ? 16 : 10) + c.seed * 7,
        tick = Math.floor(phase),
        mix = phase - tick;
      const char = alphabet[Math.floor(c.seed * 997 + tick) % alphabet.length],
        nextChar =
          alphabet[Math.floor(c.seed * 997 + tick + 1) % alphabet.length];
      const fall =
        mode === 61
          ? n * (Math.sin(time * 1.4 + c.seed * 8) * 0.5 + 0.5) * 90
          : 0;
      const drift = mode === 59 ? Math.sin(c.seed * 29 + time * 4) * n * 5 : 0;
      ctx.font = `${c.size + 1}px ${mode >= 60 ? '"Noto Sans KR",' : ""} monospace`;
      ctx.textBaseline = "top";
      ctx.fillStyle =
        mode >= 60 ? "#ddc5ff" : mode === 58 ? "#a7f5ce" : "#a8ddff";
      const opacity = n * (0.35 + c.coverage * 0.65);
      const fade = mix * mix * (3 - 2 * mix);
      ctx.globalAlpha = opacity * (1 - fade);
      ctx.fillText(char, c.x + drift, c.y + fall);
      ctx.globalAlpha = opacity * fade;
      ctx.fillText(nextChar, c.x + drift, c.y + fall);
    }
    ctx.globalAlpha = 1;
  }
  function clearBody(kind) {
    if (options.atmosphere) return;
    bodyContext.clearRect(0, 0, w, h);
    bodyContext.globalCompositeOperation = "source-over";
    bodyContext.drawImage(liveRaster, 0, 0);
    bodyContext.globalCompositeOperation = "source-in";
    const tint = bodyContext.createLinearGradient(0, 0, w, h);
    const colors =
      kind === "fire"
        ? ["#ffe2a0", "#fff4cf", "#ffc26b"]
        : kind === "water"
          ? ["#b2dfe9", "#e7fbff", "#8cc2d6"]
          : ["#c2d8de", "#f1f9f7", "#b5d0da"];
    colors.forEach((color, i) => tint.addColorStop(i / 2, color));
    bodyContext.fillStyle = tint;
    bodyContext.fillRect(0, 0, w, h);
    bodyContext.globalCompositeOperation = "source-over";
    ctx.save();
    ctx.globalAlpha = 1 - strength * (kind === "fire" ? 0.35 : 0.4);
    ctx.drawImage(readableBody, 0, 0);
    ctx.restore();
  }
  let pool =
    options.waterline === undefined
      ? null
      : boundedNumber(options.waterline, 0.4, 0.9, 0.65);
  const reflection = pool === null ? null : document.createElement("canvas");
  const reflectionContext = reflection?.getContext("2d");
  function fallingWater(dt) {
    const waterline = pool === null ? h - 10 : h * pool;
    // The water body remains readable, with moving refraction and highlights inside its mask.
    fc.setTransform(0.5, 0, 0, 0.5, 0, 0);
    fc.clearRect(0, 0, w, h);
    for (let y = 0; y < h; y += 2) {
      const bend =
        Math.sin(y * 0.085 + time * 2.2) * 1.3 +
        Math.sin(y * 0.19 - time * 1.4) * 0.6;
      fc.drawImage(liveRaster, 0, y, w, 2, bend * strength, y, w, 2);
    }
    fc.globalCompositeOperation = "source-in";
    const body = fc.createLinearGradient(0, 0, w, h);
    body.addColorStop(0, "#b5e6ef");
    body.addColorStop(0.3, "#315a70");
    body.addColorStop(0.48, "#6fa8be");
    body.addColorStop(0.52, "#e2f9fc");
    body.addColorStop(0.57, "#87c2d4");
    body.addColorStop(0.72, "#477f99");
    body.addColorStop(1, "#a2d7e7");
    fc.fillStyle = body;
    fc.fillRect(0, 0, w, h);
    fc.globalCompositeOperation = "source-atop";
    fc.lineWidth = 1.2;
    for (let band = 0; band < 12; band++) {
      fc.strokeStyle = "rgba(232,254,255,.48)";
      fc.beginPath();
      for (let x = 0; x <= w; x += 8) {
        const y =
          band * 28 +
          Math.sin(x * 0.025 + time * 1.5 + band) * 7 +
          Math.sin(x * 0.06 - time) * 3;
        if (x === 0) fc.moveTo(x, y);
        else fc.lineTo(x, y);
      }
      fc.stroke();
    }
    fc.globalCompositeOperation = "source-over";
    ctx.drawImage(field, 0, 0, w, h);
    clearBody("water");
    emission += dt * (15 + strength * 140);
    const sites = waterSites;
    while (emission >= 1) {
      emission--;
      if (!sites.length || water.length >= 420) continue;
      const source = sites[Math.floor(Math.random() * sites.length)];
      if (Math.random() > remaining(source.x, source.y)) continue;
      water.push({
        x: source.x,
        y: source.y,
        vx: Math.sin(time + source.x) * 3,
        vy: 18,
        r: (0.6 + Math.random() * 1.1) * (0.7 + detail / 25),
        age: 0,
        trail: [],
        splash: false,
      });
    }
    for (const p of water) {
      p.age += dt;
      p.trail.unshift([p.x, p.y]);
      if (p.trail.length > Math.round(4 + detail * 0.6)) p.trail.pop();
      const influence = near(p.x, p.y) * Math.min(1, energy);
      const dx = p.x - point[0];
      p.vx += (influence * (velocity[0] * 0.6 + dx * 0.8) - p.vx * 0.7) * dt;
      p.vx = Math.max(-75, Math.min(75, p.vx));
      p.vy += 220 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.y > waterline && !p.splash) {
        p.y = waterline;
        if (pool !== null && ripples.length < 64)
          ripples.push({ x: p.x, y: waterline, age: 0, size: p.r });
        p.vy = -25 - Math.random() * 25;
        p.vx += (Math.random() - 0.5) * 90;
        p.splash = true;
        p.age = 0;
        p.trail = [];
      }
      const fade = p.splash
        ? Math.max(0, 1 - p.age * 3)
        : Math.min(1, p.age * 5);
      ctx.globalAlpha = fade * (0.2 + 0.8 * strength);
      ctx.strokeStyle = "rgba(143,207,229,.25)";
      ctx.lineWidth = p.r * 0.85;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      for (const [x, y] of p.trail) ctx.lineTo(x, y);
      ctx.stroke();
      ctx.fillStyle = "rgba(140,204,225,.48)";
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.r, p.r * (p.splash ? 1 : 1.8), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(232,253,255,.8)";
      ctx.beginPath();
      ctx.arc(p.x - p.r * 0.25, p.y - p.r * 0.5, p.r * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    water = water.filter(
      (p) => p.y < h + 12 && (!p.splash || p.age < 0.34) && p.age < 4,
    );
    ctx.globalAlpha = 1;
    if (pool !== null && reflectionContext) {
      if (
        reflection.width !== canvas.width ||
        reflection.height !== canvas.height
      ) {
        reflection.width = canvas.width;
        reflection.height = canvas.height;
      }
      reflectionContext.clearRect(0, 0, reflection.width, reflection.height);
      reflectionContext.drawImage(canvas, 0, 0);
      const ratio = canvas.width / w;
      for (let y = waterline + 2; y < h; y += 3) {
        const distance = y - waterline,
          sy = waterline - distance / 0.42;
        if (sy < 0) break;
        ctx.globalAlpha = 0.24 * (1 - distance / (h - waterline));
        const shift =
          Math.sin(y * 0.12 + time * 2) * 2 + Math.sin(y * 0.037 - time) * 3;
        ctx.drawImage(
          reflection,
          0,
          sy * ratio,
          canvas.width,
          (3 / 0.42) * ratio,
          shift,
          y,
          w,
          3,
        );
      }
      for (const r of ripples) {
        r.age += dt;
        const radius = 3 + r.age * (19 + r.size * 4);
        ctx.globalAlpha = Math.max(0, 1 - r.age / 2.6) * strength * 0.38;
        ctx.strokeStyle = "#a4dfed";
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.ellipse(
          r.x,
          r.y + 3 + radius * 0.12,
          radius,
          radius * 0.19,
          0,
          0,
          Math.PI * 2,
        );
        ctx.stroke();
      }
      ripples = ripples.filter((r) => r.age < 2.6);
      ctx.globalAlpha = 1;
    }
  }
  function burningText(dt) {
    const sx = fw / w,
      sy = fh / h,
      pixels = flameImage.data,
      scale = detail / 24;
    // Advect one connected heat field upward. Every part of the glyph is fuel.
    // Semi-Lagrangian backtracing keeps the small grid stable across frame rates.
    for (let y = 0; y < fh; y++)
      for (let x = 0; x < fw; x++) {
        const i = y * fw + x,
          px = x / sx,
          py = y / sy;
        const curl =
          Math.sin(px * 0.035 + py * 0.045 - time * 2.7) * 13 +
          Math.sin(px * 0.073 - py * 0.024 + time * 1.8) * 7;
        const gust = energy > 0 ? near(px, py) * Math.min(1, energy) : 0;
        const vx = curl * (0.4 + scale * 1.1) + gust * velocity[0] * 0.22;
        const vy =
          -((20 + heat[i] * 22) * (0.55 + scale * 1.8)) +
          gust * velocity[1] * 0.08;
        const bx = Math.max(0, Math.min(fw - 1.001, x - vx * dt * sx)),
          by = y - vy * dt * sy;
        let advected = 0;
        if (by >= 0 && by < fh - 1) {
          const ix = Math.floor(bx),
            iy = Math.floor(by),
            tx = bx - ix,
            ty = by - iy;
          advected =
            (heat[iy * fw + ix] * (1 - tx) + heat[iy * fw + ix + 1] * tx) *
              (1 - ty) +
            (heat[(iy + 1) * fw + ix] * (1 - tx) +
              heat[(iy + 1) * fw + ix + 1] * tx) *
              ty;
        }
        const flicker =
          0.8 +
          0.2 * Math.sin(px * 0.06 - time * 5 + Math.sin(py * 0.09 + time * 3));
        const source = (fuel[i * 4 + 3] / 255) * remaining(px, py);
        const value = Math.max(
          0,
          Math.min(
            1.5,
            advected *
              Math.exp(
                -dt *
                  (2.5 -
                    scale +
                    (0.5 + 0.5 * Math.sin(px * 0.09 + py * 0.07 - time * 4))),
              ) +
              source * dt * (3 + strength * 4) * flicker,
          ),
        );
        heatNext[i] = value;
        const a = Math.max(0, Math.min(1, (value - 0.055) * 2.6));
        pixels[i * 4] = Math.min(255, 120 + value * 210);
        pixels[i * 4 + 1] = Math.min(248, Math.max(0, (value - 0.14) * 265));
        pixels[i * 4 + 2] = Math.min(195, Math.max(0, (value - 0.65) * 260));
        pixels[i * 4 + 3] = a * 255;
      }
    [heat, heatNext] = [heatNext, heat];
    flameContext.putImageData(flameImage, 0, 0);
    ctx.save();
    ctx.globalAlpha = 0.08 + strength * 0.12;
    ctx.filter = `blur(${3 + scale * 5}px)`;
    ctx.drawImage(flameSurface, 0, 0, w, h);
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = 0.15 + strength * 0.7;
    ctx.drawImage(flameSurface, 0, 0, w, h);
    ctx.restore();
    clearBody("fire");
  }
  function elemental(dt) {
    if (mode === 65) {
      burningText(dt);
      return;
    }

    // Atmosphere-only wind skips the body surface entirely.
    if (!options.atmosphere) {
      fc.setTransform(0.5, 0, 0, 0.5, 0, 0);
      fc.clearRect(0, 0, w, h);
      for (let y = 0; y < h; y += 2) {
        const gust =
          Math.exp(-(((y - point[1]) / radius()) ** 2)) *
          velocity[0] *
          0.015 *
          Math.min(1, energy);
        const bend = (Math.sin(y * 0.035 + time * 2) * 4 + gust) * strength;
        fc.drawImage(liveRaster, 0, y, w, 2, bend, y, w, 2);
      }
      fc.globalCompositeOperation = "source-in";
      const body = fc.createLinearGradient(0, 0, 0, h);
      body.addColorStop(0, "#9fb9c8");
      body.addColorStop(0.5, "#ecf7f6");
      body.addColorStop(1, "#658d9f");
      fc.fillStyle = body;
      fc.fillRect(0, 0, w, h);
      fc.globalCompositeOperation = "source-atop";
      fc.strokeStyle = "rgba(255,255,255,.45)";
      fc.lineWidth = 1;
      for (let band = 0; band < 14; band++) {
        fc.beginPath();
        for (let x = 0; x < w; x += 8) {
          const y = band * 23 + Math.sin(x * 0.04 + time * 2 + band) * 4;
          if (x) fc.lineTo(x, y);
          else fc.moveTo(x, y);
        }
        fc.stroke();
      }
      fc.globalCompositeOperation = "source-over";
      ctx.drawImage(field, 0, 0, w, h);
    }
    emission += dt * 40 * strength;
    while (emission >= 1) {
      emission--;
      if (elementParticles.length >= 280 || !edges.length) continue;
      const e = edges[Math.floor(Math.random() * edges.length)];
      if (Math.random() > remaining(e.x, e.y)) continue;
      elementParticles.push({
        x: e.x,
        y: e.y,
        ax: e.x,
        ay: e.y,
        age: 0,
        life: 1.4 + Math.random() * 1.5,
        vx: 65 + Math.random() * 45,
        vy: (Math.random() - 0.5) * 10,
        seed: Math.random() * 9,
        trail: [],
      });
    }
    for (const p of elementParticles) {
      p.age += dt;
      const life = p.age / p.life;
      if (life >= 1) continue;
      p.trail.unshift([p.x, p.y]);
      if (p.trail.length > Math.round(6 + detail * 1.3)) p.trail.pop();
      const n = near(p.x, p.y) * Math.min(1, energy);
      p.vx +=
        (n * velocity[0] * 1.1 +
          Math.sin(time * 3 + p.seed + p.y * 0.04) * 18 -
          (p.vx - 90) * 0.5) *
        dt;
      p.vy += Math.sin(time * 2 + p.x * 0.03) * 14 * dt;
      p.vy += n * velocity[1] * 0.3 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const fade = Math.sin(Math.PI * life);
      ctx.strokeStyle = `rgba(199,232,239,${fade * (0.08 + strength * 0.3)})`;
      ctx.lineWidth = 0.6 + detail * 0.035;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      for (const [x, y] of p.trail) ctx.lineTo(x, y);
      ctx.stroke();
    }
    clearBody("wind");
    elementParticles = elementParticles.filter(
      (p) => p.age < p.life && p.x > -50 && p.x < w + 50 && p.y > -50,
    );
  }
  function render(now, dt) {
    if (dead || !visible || document.hidden) return;
    time += dt;
    if (flow) {
      point = [
        w * (0.5 + Math.sin(time * 0.8) * 0.3),
        h * (0.5 + Math.cos(time) * 0.12),
      ];
      velocity = [Math.cos(time * 0.8) * 100, Math.sin(time) * 30];
      energy = 1;
    } else if (!held) energy = Math.max(0, energy - dt * 0.32);
    velocity = velocity.map((v) => v * Math.exp(-dt * 3));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    if (reduced.matches || strength === 0) {
      if (!options.atmosphere) ctx.drawImage(raster, 0, 0);
      return;
    }
    prepareBody(dt);
    const k = Math.min(1.4, energy * strength);
    if (mode === 65 || mode === 66) elemental(dt);
    else if (mode === 63) fallingWater(dt);
    else if (mode <= 54 || mode === 62) vapor(dt, Math.max(k, strength * 0.85));
    else if (mode <= 57) prism(k);
    else glyphs(k);
    if (!isElement() && energy === 0 && !smoke.length) {
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(liveRaster, 0, 0);
      return;
    }
    return true;
  }
  const loop = createFrameLoop(render);
  const wake = () => loop.wake();
  function move(e) {
    if (frozen) return;
    const b = host.getBoundingClientRect(),
      next = [e.clientX - b.left, e.clientY - b.top],
      now = performance.now(),
      dt = Math.max(0.016, (now - previousInput) / 1000);
    velocity = next.map((v, i) =>
      Math.max(-500, Math.min(500, (v - point[i]) / dt)),
    );
    previousInput = now;
    point = next;
    energy = 1.4;
    wake();
  }
  function press(e) {
    if (frozen) return;
    move(e);
    held = true;
    host.setPointerCapture?.(e.pointerId);
  }
  function release(e) {
    held = false;
    if (host.hasPointerCapture?.(e.pointerId))
      host.releasePointerCapture(e.pointerId);
    wake();
  }
  function pulse() {
    if (frozen) return;
    point = [w * 0.5, h * 0.5];
    velocity = [180, -90];
    energy = 1.4;
    if (isElement() && consumed) {
      cycle = 0;
      origin = [...point];
      for (const t of tiles) t.opacity = 1;
    }
    wake();
  }
  let measuredLayout = "";
  const resizeRefresh = () => {
    const key = layoutKey(element, host);
    if (key !== measuredLayout) {
      measuredLayout = key;
      refresh();
    }
  };
  const ro = new ResizeObserver(resizeRefresh);
  ro.observe(host);
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (!visible) held = false;
    loop.block("offscreen", !visible);
  });
  io.observe(host);
  const visibility = () => {
    if (document.hidden) held = false;
    loop.block("hidden", document.hidden);
  };
  document.addEventListener("visibilitychange", visibility);
  for (const [event, fn] of [
    ["pointermove", move],
    ["pointerdown", press],
    ["pointerup", release],
    ["pointercancel", release],
    ["lostpointercapture", release],
  ])
    host.addEventListener(event, fn);
  reduced.addEventListener("change", wake);
  document.fonts.ready.then(refresh);
  refresh();
  return {
    supported: true,
    refresh,
    pulse,
    setWaterline(value) {
      const next = boundedNumber(value, .4, .95, .65);
      const shift = (next - (pool ?? next)) * h;
      for (const ripple of ripples) ripple.y += shift;
      pool = next;
      wake();
    },
    setConsumptionProgress(value) {
      consumptionProgress = value === null ? null : Math.max(0, Math.min(1, value));
      if (consumptionProgress !== null) consumed = true;
      wake();
    },
    setConsumed(v) {
      consumptionProgress = null;
      if (consumed === v) return;
      consumed = v;
      cycle = 0;
      origin = [...point];
      smoke = [];
      water = [];
      elementParticles = [];
      heat?.fill(0);
      for (const t of tiles) t.opacity = 1;
      wake();
    },
    setMode(v) {
      mode = v;
      refresh();
    },
    setIntensity(v) {
      v = boundedNumber(v, 0, 1, strength);
      if (strength === v) return;
      strength = v;
      wake();
    },
    setDetail(v) {
      v = boundedNumber(v, 1, 24, detail);
      if (detail === v) return;
      detail = v;
      if (isGlyphMode(mode)) refresh();
      else wake();
    },
    setFlow(v) {
      flow = v;
      wake();
    },
    setFrozen(v) {
      frozen = v;
      loop.block("frozen", v);
    },
    destroy() {
      dead = true;
      loop.destroy();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      reduced.removeEventListener("change", wake);
      for (const [event, fn] of [
        ["pointermove", move],
        ["pointerdown", press],
        ["pointerup", release],
        ["pointercancel", release],
        ["lostpointercapture", release],
      ])
        host.removeEventListener(event, fn);
      canvas.remove();
      source.restore();
    },
  };
}
