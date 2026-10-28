export type V = [number, number];

/** One stroke group of the source wedge, in unit coordinates (glyph radius = 1). */
export type Prim = {
  lines: V[][];
  len: number;
  alpha: number;
  cap: 'none' | 'square' | 'ring';
  /** Distance of the closest point to the center; drawing goes center-outward. */
  r0: number;
};

export type Glyph = {
  seed: number;
  /** Rotational order. With the mirror the glyph has dihedral symmetry D_n (2n copies). */
  n: number;
  prims: Prim[];
};

export type Copy = { rot: number; flip: boolean };

export type GenOptions = {
  order: 'auto' | number;
  /** Number of grid walks. */
  density: number;
  rings: boolean;
  ticks: boolean;
  spokes: boolean;
};

export const ORDERS = [1, 2, 3, 4, 6, 8];

const GRID = 1 / 8;
const DIRS: V[] = [
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [-1, -1],
  [0, -1],
  [1, -1],
];

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const polar = (r: number, a: number): V => [Math.cos(a) * r, Math.sin(a) * r];

function arc(r: number, a0: number, a1: number): V[] {
  const steps = Math.max(2, Math.ceil(((a1 - a0) * 180) / Math.PI / 2));
  return Array.from({ length: steps + 1 }, (_, i) => polar(r, a0 + ((a1 - a0) * i) / steps));
}

function lengthOf(lines: V[][]) {
  let len = 0;
  for (const line of lines)
    for (let i = 1; i < line.length; i++)
      len += Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]);
  return len;
}

/**
 * Builds the source wedge: the region 0 <= angle <= PI/n inside the unit circle.
 * Everything else is produced by reflecting and rotating this wedge (see `copies`).
 */
export function generate(seed: number, opts: GenOptions): Glyph {
  // Each feature draws from its own stream, so toggling one layer leaves the others unchanged.
  const stream = (salt: number) => {
    const rand = mulberry32(seed ^ Math.imul(salt, 0x9e3779b1));
    const int = (lo: number, hi: number) => lo + Math.floor(rand() * (hi - lo + 1));
    const pick = <T>(items: T[]) => items[Math.floor(rand() * items.length)];
    return { rand, int, pick };
  };

  const auto = stream(1).pick(ORDERS);
  const n = opts.order === 'auto' ? auto : opts.order;
  const w = Math.PI / n;
  const inside = ([x, y]: V) => {
    const r = Math.hypot(x, y);
    if (r > 1 + 1e-6 || r < 0.12) return false;
    const a = Math.atan2(y, x);
    return a >= -1e-6 && a <= w + 1e-6;
  };

  const prims: Prim[] = [];
  const add = (lines: V[][], alpha: number, cap: Prim['cap'] = 'none') => {
    const r0 = Math.min(...lines.flat().map(([x, y]) => Math.hypot(x, y)));
    prims.push({ lines, len: lengthOf(lines), alpha, cap, r0 });
  };

  // Ring segments. Starting on the mirror axis makes the reflected copy continue the arc.
  if (opts.rings) {
    const { rand, int } = stream(2);
    const slices = 6;
    for (let i = int(1, 3); i > 0; i--) {
      const s0 = rand() < 0.5 ? 0 : int(0, slices - 1);
      const s1 = int(s0 + 1, slices);
      add([arc(int(3, 10) / 10, (s0 * w) / slices, (s1 * w) / slices)], 0.7);
    }
  }

  // Tick band: short radial marks spread across the wedge.
  if (opts.ticks) {
    const { int } = stream(3);
    const r = int(4, 9) / 10;
    const count = int(3, 6);
    add(
      Array.from({ length: count }, (_, i) => {
        const a = ((i + 0.5) * w) / count;
        return [polar(r, a), polar(r + 0.05, a)];
      }),
      0.5,
    );
  }

  // Spokes on a mirror axis map onto themselves, which reads as a structural axis.
  if (opts.spokes) {
    const { rand, int } = stream(4);
    for (let i = int(1, 2); i > 0; i--) {
      const a = rand() < 0.5 ? 0 : w;
      const r = int(1, 5) / 10;
      add([[polar(r, a), polar(Math.min(1, r + int(2, 4) / 10), a)]], 0.8);
    }
  }

  // Grid-snapped walks at 45° increments: the circuit-like strokes.
  // One shared stream, so raising the density keeps the earlier walks.
  const { int, pick } = stream(5);
  for (let i = opts.density; i > 0; i--) {
    for (let tries = 0; tries < 20; tries++) {
      const start: V = [int(-8, 8) * GRID, int(0, 8) * GRID];
      if (!inside(start)) continue;
      const pts: V[] = [start];
      let p = start;
      let d = int(0, 7);
      for (let legs = int(2, 4); legs > 0; legs--) {
        let moved = false;
        for (let s = int(1, 4); s > 0; s--) {
          const q: V = [p[0] + DIRS[d][0] * GRID, p[1] + DIRS[d][1] * GRID];
          if (!inside(q)) break;
          p = q;
          moved = true;
        }
        if (moved) pts.push(p);
        d = (d + pick([1, 2, 6, 7])) % 8;
      }
      if (pts.length < 2) continue;
      add([pts], 1, pick(['none', 'none', 'square', 'ring']));
      break;
    }
  }

  prims.sort((a, b) => a.r0 - b.r0);
  return { seed, n, prims };
}

/** Stroke length per angle bin over the whole glyph, normalized to the peak. */
export function angularProfile(glyph: Glyph, bins: number): number[] {
  const out = new Array<number>(bins).fill(0);
  const tau = Math.PI * 2;
  for (const c of copies(glyph.n))
    for (const prim of glyph.prims)
      for (const line of prim.lines)
        for (let i = 1; i < line.length; i++) {
          const [ax, ay] = line[i - 1];
          const [bx, by] = line[i];
          const seg = Math.hypot(bx - ax, by - ay);
          const steps = Math.max(1, Math.ceil(seg / 0.02));
          for (let s = 0; s < steps; s++) {
            const f = (s + 0.5) / steps;
            const x = ax + (bx - ax) * f;
            const y = (ay + (by - ay) * f) * (c.flip ? -1 : 1);
            const a = (((Math.atan2(y, x) + c.rot) % tau) + tau) % tau;
            out[Math.floor((a / tau) * bins) % bins] += (prim.alpha * seg) / steps;
          }
        }
  const peak = Math.max(...out, 1e-6);
  return out.map((v) => v / peak);
}

/** The 2n elements of D_n, ordered so the copies sweep counter-clockwise from the source. */
export function copies(n: number): Copy[] {
  const w = Math.PI / n;
  const tau = Math.PI * 2;
  const list: (Copy & { at: number })[] = [];
  for (let k = 0; k < n; k++)
    for (const flip of [false, true]) {
      const rot = k * 2 * w;
      list.push({ rot, flip, at: (((flip ? -w / 2 : w / 2) + rot) % tau + tau) % tau });
    }
  return list.sort((a, b) => a.at - b.at);
}
