// Deterministic simulation, independent of the DOM. Units are CSS px and seconds.
export function connectParticles(particles, spacing) {
  const grid = new Map(
    particles.map((p, i) => [
      `${Math.round(p.ax / spacing)},${Math.round(p.ay / spacing)}`,
      i,
    ]),
  );
  const links = [];
  particles.forEach((p, i) => {
    const x = Math.round(p.ax / spacing),
      y = Math.round(p.ay / spacing);
    for (const [dx, dy] of [
      [1, 0],
      [0, 1],
      [1, 1],
    ]) {
      const j = grid.get(`${x + dx},${y + dy}`);
      if (j !== undefined) links.push([i, j]);
    }
  });
  return links;
}
export function resetParticles(particles) {
  for (const p of particles) {
    p.x = p.ax;
    p.y = p.ay;
    p.vx = p.vy = 0;
    p.grab = 0;
  }
}
export function stepPhysics(particles, links, state, dt) {
  const {
    mode,
    energy,
    point,
    radius,
    amount,
    time,
    height,
    held,
    trails = [],
    drag = [0, 0],
  } = state;
  const active = Math.min(1.5, energy) * amount;
  let movement = 0;
  for (const p of particles) {
    const dx = p.x - point[0],
      dy = p.y - point[1],
      dist = Math.hypot(dx, dy),
      norm = Math.max(8, dist),
      near = Math.max(0, 1 - dist / radius);
    let home = 46,
      damping = 5.5,
      fx = 0,
      fy = 0;
    if (mode === 41) {
      // Attraction with a short-range repulsive core: no singularity.
      home = 18;
      const f = near * active * 2800 * (dist < 12 ? -1 : 1);
      fx = (-dx / norm) * f;
      fy = (-dy / norm) * f;
    } else if (mode === 42) {
      home = 12;
      damping = 3.2;
      const f = near * active * 3000;
      fx = (-dy / norm - (dx / norm) * 0.35) * f;
      fy = (dx / norm - (dy / norm) * 0.35) * f;
    } else if (mode === 43) {
      home = 16;
      damping = 4.5;
      fx = (dx / norm) * near * active * 1700;
      fy = (dy / norm) * near * active * 1700;
    } else if (mode === 44) {
      home = 30;
      damping = 2.8;
      const age = Math.max(0, time - state.burstTime),
        ring = age * 170;
      const f =
        Math.exp(
          -Math.pow(
            (Math.hypot(p.ax - point[0], p.ay - point[1]) - ring) / 18,
            2,
          ),
        ) *
        active *
        6500;
      fx = (dx / norm) * f;
      fy = (dy / norm) * f;
    } else if (mode === 45) {
      home = 14;
      damping = 3.2;
      const f = near * active;
      fx = (1300 + Math.max(-600, Math.min(600, drag[0] * 3))) * f;
      fy = (Math.sin(p.x * 0.03 + time * 5) * 600 + drag[1] * 2) * f;
    } else if (mode === 46) {
      // Each disturbed grain retains a release weight; home springs recover as energy decays.
      const release = p.grab || 0;
      home = 46 * (1 - Math.min(1, active * release)) + 0.5;
      damping = 2.4;
      fy = 900 * active * release;
      fx = Math.sin(p.ax * 0.13) * 120 * active * release;
    } else if (mode === 47) {
      home = 18;
      damping = 3.8;
      for (const t of trails) {
        const tx = p.x - t.x,
          ty = p.y - t.y,
          d = Math.hypot(tx, ty),
          f =
            Math.max(0, 1 - d / radius) *
            Math.max(0, 1 - (time - t.time) / 2.6) *
            amount;
        fx += (t.vx * 0.8 - (ty / Math.max(8, d)) * 650) * f;
        fy += (t.vy * 0.8 + (tx / Math.max(8, d)) * 650) * f;
      }
    } else if (mode === 48) {
      damping = held ? 6 : 2.7;
      home = held ? 22 : 46;
      if (held) {
        fx = state.pull[0] * p.grab * 260 * amount;
        fy = state.pull[1] * p.grab * 260 * amount;
      }
    } else {
      const f = near * active * (mode === 39 ? 3600 : 2400);
      fx = (dx / norm) * f;
      fy = (dy / norm) * f;
    }
    p.fx = (p.ax - p.x) * home + fx;
    p.fy = (p.ay - p.y) * home + fy;
    p.damping = damping;
  }
  if (mode === 43) {
    // Neighbor springs transfer displacement through each connected glyph.
    for (const [i, j] of links) {
      const a = particles[i],
        b = particles[j];
      const dx = b.x - a.x - (b.ax - a.ax),
        dy = b.y - a.y - (b.ay - a.ay);
      const fx = dx * 95,
        fy = dy * 95;
      a.fx += fx;
      a.fy += fy;
      b.fx -= fx;
      b.fy -= fy;
    }
  }
  for (const p of particles) {
    p.vx = (p.vx + p.fx * dt) * Math.exp(-p.damping * dt);
    p.vy = (p.vy + p.fy * dt) * Math.exp(-p.damping * dt);
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (mode === 46 && p.y > height - 8) {
      p.y = height - 8;
      p.vy = -Math.abs(p.vy) * 0.28;
      p.vx *= 0.85;
    }
  }
  if (mode === 46 && active > 0.02) {
    // Local grain collisions via a spatial hash, never all-pairs.
    const cell = state.spacing,
      grid = new Map();
    for (const p of particles) {
      const gx = Math.floor(p.x / cell),
        gy = Math.floor(p.y / cell);
      for (let y = -1; y <= 1; y++)
        for (let x = -1; x <= 1; x++) {
          const neighbors = grid.get(`${gx + x},${gy + y}`) || [];
          for (const q of neighbors) {
            const dx = p.x - q.x,
              dy = p.y - q.y,
              d = Math.hypot(dx, dy),
              min = cell * 0.65;
            if (d > 0.001 && d < min) {
              const f = ((min - d) * 0.5) / d;
              p.x += dx * f;
              p.y += dy * f;
              q.x -= dx * f;
              q.y -= dy * f;
            }
          }
        }
      const key = `${gx},${gy}`;
      if (!grid.has(key)) grid.set(key, []);
      grid.get(key).push(p);
    }
  }
  for (const p of particles)
    movement = Math.max(
      movement,
      Math.hypot(p.x - p.ax, p.y - p.ay),
      Math.hypot(p.vx, p.vy) * 0.1,
    );
  return movement;
}
