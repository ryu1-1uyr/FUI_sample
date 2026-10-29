import { reduced } from './util';

/**
 * Attitude of the main emblem, in degrees, using the cube's convention:
 * x > 0 = front surface moves down (drag down), y > 0 = front surface moves right (drag right).
 * Several inputs add up into the target; the emblem follows on an under-damped spring.
 */
export type Tilt = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Target contributions: cube drag, cube idle sway, direct drag on the emblem. */
  cube: [number, number];
  sway: [number, number];
  drag: [number, number];
  last: number;
};

const K = 90;
const C = 11;
export const TILT_MAX = 28;

export const createTilt = (): Tilt => ({ x: 0, y: 0, vx: 0, vy: 0, cube: [0, 0], sway: [0, 0], drag: [0, 0], last: -1 });

export const clampTilt = (v: number) => Math.max(-TILT_MAX, Math.min(TILT_MAX, v));

export function stepTilt(t: Tilt, now: number) {
  const dt = t.last < 0 ? 0 : Math.min(0.05, now - t.last);
  t.last = now;
  const tx = clampTilt(t.cube[0] + t.sway[0] + t.drag[0]);
  const ty = clampTilt(t.cube[1] + t.sway[1] + t.drag[1]);
  if (reduced) {
    t.x = tx;
    t.y = ty;
    return;
  }
  t.vx += (K * (tx - t.x) - C * t.vx) * dt;
  t.vy += (K * (ty - t.y) - C * t.vy) * dt;
  t.x += t.vx * dt;
  t.y += t.vy * dt;
}

/** Angular velocity impulse in deg/s, e.g. when the cube snaps a quarter turn. */
export function kickTilt(t: Tilt, vx: number, vy: number) {
  t.vx += vx;
  t.vy += vy;
}
