import { INK_RGB } from './render';

export type V3 = [number, number, number];
/** Quaternion as [x, y, z, w]. */
export type Q = [number, number, number, number];

export const qAxis = (ax: V3, a: number): Q => {
  const s = Math.sin(a / 2);
  return [ax[0] * s, ax[1] * s, ax[2] * s, Math.cos(a / 2)];
};

export const qMul = (a: Q, b: Q): Q => [
  a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
  a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
  a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
  a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
];

export function qRot(q: Q, v: V3): V3 {
  const [x, y, z, w] = q;
  const tx = 2 * (y * v[2] - z * v[1]);
  const ty = 2 * (z * v[0] - x * v[2]);
  const tz = 2 * (x * v[1] - y * v[0]);
  return [v[0] + w * tx + (y * tz - z * ty), v[1] + w * ty + (z * tx - x * tz), v[2] + w * tz + (x * ty - y * tx)];
}

const qNorm = (q: Q): Q => {
  const l = Math.hypot(...q);
  return [q[0] / l, q[1] / l, q[2] / l, q[3] / l];
};

/** Spherical interpolation; t > 1 extrapolates, which gives the snap its overshoot. */
export function qSlerp(a: Q, b: Q, t: number): Q {
  let d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  const s = d < 0 ? -1 : 1;
  d *= s;
  if (d > 0.9995) return qNorm(a.map((v, i) => v + (b[i] * s - v) * t) as Q);
  const th = Math.acos(d);
  const wa = Math.sin((1 - t) * th) / Math.sin(th);
  const wb = (Math.sin(t * th) / Math.sin(th)) * s;
  return qNorm(a.map((v, i) => v * wa + b[i] * wb) as Q);
}

export const X: V3 = [1, 0, 0];
export const Y: V3 = [0, 1, 0];

const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

/** Each face carries one symmetry order; the face turned toward the viewer is the selection. */
export const FACES: { n: V3; u: V3; order: number; front: Q }[] = [
  { n: [0, 0, 1], u: [1, 0, 0], order: 1, front: [0, 0, 0, 1] },
  { n: [1, 0, 0], u: [0, 0, -1], order: 2, front: qAxis(Y, -Math.PI / 2) },
  { n: [0, 0, -1], u: [-1, 0, 0], order: 3, front: qAxis(Y, Math.PI) },
  { n: [-1, 0, 0], u: [0, 0, 1], order: 4, front: qAxis(Y, Math.PI / 2) },
  { n: [0, 1, 0], u: [1, 0, 0], order: 6, front: qAxis(X, Math.PI / 2) },
  { n: [0, -1, 0], u: [1, 0, 0], order: 8, front: qAxis(X, -Math.PI / 2) },
];

export function frontFace(q: Q) {
  let best = 0;
  let bestZ = -Infinity;
  FACES.forEach((f, i) => {
    const z = qRot(q, f.n)[2];
    if (z > bestZ) {
      bestZ = z;
      best = i;
    }
  });
  return FACES[best];
}

const EDGES: [number, number][] = [];
const VERTS: V3[] = [];
for (let i = 0; i < 8; i++) VERTS.push([i & 1 ? 1 : -1, i & 2 ? 1 : -1, i & 4 ? 1 : -1]);
for (let a = 0; a < 8; a++) for (let b = a + 1; b < 8; b++) if ([1, 2, 4].includes(a ^ b)) EDGES.push([a, b]);

/** Wireframe cube with an n-fold emblem on each face. y is up; the viewer sits at +z. */
export function drawCube(ctx: CanvasRenderingContext2D, q: Q, cx: number, cy: number, R: number, dpr: number) {
  const F = 4.5;
  const project = (v: V3): [number, number, number] => {
    const p = qRot(q, v);
    const s = F / (F - p[2]);
    return [cx + p[0] * s * R, cy - p[1] * s * R, p[2]];
  };

  ctx.save();
  ctx.lineWidth = dpr;
  ctx.shadowColor = `rgb(${INK_RGB})`;

  for (const [a, b] of EDGES) {
    const pa = project(VERTS[a]);
    const pb = project(VERTS[b]);
    const depth = ((pa[2] + pb[2]) / 2 + 1) / 2;
    ctx.strokeStyle = `rgb(${INK_RGB} / ${0.15 + 0.75 * depth})`;
    ctx.shadowBlur = depth > 0.7 ? 6 * dpr : 0;
    ctx.setLineDash(depth < 0.35 ? [2 * dpr, 3 * dpr] : []);
    ctx.beginPath();
    ctx.moveTo(pa[0], pa[1]);
    ctx.lineTo(pb[0], pb[1]);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  const front = frontFace(q);
  for (const f of FACES) {
    const facing = qRot(q, f.n)[2];
    if (facing <= 0.05) continue;
    const v = cross(f.n, f.u);
    const at = (u: number, w: number): V3 => [
      f.n[0] + f.u[0] * u + v[0] * w,
      f.n[1] + f.u[1] * u + v[1] * w,
      f.n[2] + f.u[2] * u + v[2] * w,
    ];
    const lit = f === front;
    ctx.strokeStyle = `rgb(${INK_RGB} / ${facing * (lit ? 1 : 0.45)})`;
    ctx.shadowBlur = lit ? 8 * dpr : 0;
    ctx.beginPath();
    for (let i = 0; i <= 32; i++) {
      const a = (i / 32) * Math.PI * 2;
      const [x, y] = project(at(Math.cos(a) * 0.62, Math.sin(a) * 0.62));
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    for (let k = 0; k < f.order; k++) {
      const a = Math.PI / 2 + (k * Math.PI * 2) / f.order;
      const [x0, y0] = project(at(Math.cos(a) * 0.14, Math.sin(a) * 0.14));
      const [x1, y1] = project(at(Math.cos(a) * 0.62, Math.sin(a) * 0.62));
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
    }
    ctx.stroke();
  }
  ctx.restore();
}
