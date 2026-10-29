export const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Damped spring parameterised by perceptual duration and bounce (Apple, WWDC23). Retargeting keeps
 * the current velocity, so a turn can be redirected mid-flight without a jolt.
 */
export type Spring = { x: number; v: number; target: number };

export const spring = (x: number): Spring => ({ x, v: 0, target: x });

export function stepSpring(s: Spring, dt: number, duration: number, bounce: number) {
  const k = ((2 * Math.PI) / duration) ** 2;
  const c = (4 * Math.PI * (1 - bounce)) / duration;
  for (let left = Math.min(dt, 0.1); left > 0; left -= 1 / 240) {
    const h = Math.min(left, 1 / 240);
    s.v += (-k * (s.x - s.target) - c * s.v) * h;
    s.x += s.v * h;
  }
}

export const settled = (s: Spring) => Math.abs(s.x - s.target) < 0.05 && Math.abs(s.v) < 0.5;

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Wraps an angle difference into (-180, 180]. */
export const wrapDeg = (d: number) => {
  const r = ((d % 360) + 360) % 360;
  return r > 180 ? r - 360 : r;
};

export function mixHex(colors: [string, number][]) {
  let r = 0;
  let g = 0;
  let b = 0;
  for (const [hex, w] of colors) {
    const n = parseInt(hex.slice(1), 16);
    r += (n >> 16) * w;
    g += ((n >> 8) & 255) * w;
    b += (n & 255) * w;
  }
  return `rgb(${r | 0} ${g | 0} ${b | 0})`;
}
