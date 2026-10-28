import type { Copy, Glyph, Prim } from './glyph';

export const INK = '#b8fff0';
export const INK_RGB = '184 255 240';
export const WARN_RGB = '255 181 71';

// Timeline of one cycle, in seconds (fui-design §2.5).
export const SCAN = 0.35;
const STAGGER = 0.12;
const DRAW = 0.45;
const COPY_GAP = 0.1;
const COPY_STAGGER = 0.07;
const COPY_DRAW = 0.35;
export const GUIDE_FADE = 0.4;
export const HOLD = 4.5;
export const DISSOLVE = 0.5;

/** Source wedge starts on the vertical axis; angles grow clockwise on screen. */
export const BASE = -Math.PI / 2;

export type Timeline = { srcEnd: number; repEnd: number; end: number };

export function timeline(glyph: Glyph, copyCount: number): Timeline {
  const srcEnd = SCAN + Math.max(0, glyph.prims.length - 1) * STAGGER + DRAW;
  const repEnd = srcEnd + COPY_GAP + (copyCount - 2) * COPY_STAGGER + COPY_DRAW;
  return { srcEnd, repEnd, end: repEnd + GUIDE_FADE + HOLD + DISSOLVE };
}

// cubic-bezier(0.6, 0, 0.2, 1): the --fui-draw easing.
export function drawEase(x: number) {
  const bez = (t: number, a: number, b: number) => 3 * a * t * (1 - t) ** 2 + 3 * b * t * t * (1 - t) + t ** 3;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    if (bez(mid, 0.6, 0.2) < x) lo = mid;
    else hi = mid;
  }
  return bez((lo + hi) / 2, 0, 1);
}

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const progress = (t: number, start: number, dur: number) => drawEase(clamp01((t - start) / dur));

function strokePrim(ctx: CanvasRenderingContext2D, prim: Prim, p: number, unit: number) {
  if (p <= 0) return;
  let remain = p * prim.len;
  let last = prim.lines[0][0];
  ctx.beginPath();
  for (const line of prim.lines) {
    if (remain <= 0) break;
    ctx.moveTo(line[0][0], line[0][1]);
    for (let i = 1; i < line.length && remain > 0; i++) {
      const [ax, ay] = line[i - 1];
      const [bx, by] = line[i];
      const seg = Math.hypot(bx - ax, by - ay);
      const f = Math.min(1, remain / seg);
      last = [ax + (bx - ax) * f, ay + (by - ay) * f];
      ctx.lineTo(last[0], last[1]);
      remain -= seg;
    }
  }
  ctx.stroke();
  if (p < 1 || prim.cap === 'none') return;
  const s = 2.5 * unit;
  if (prim.cap === 'square') ctx.fillRect(last[0] - s, last[1] - s, s * 2, s * 2);
  else {
    ctx.beginPath();
    ctx.arc(last[0], last[1], s * 1.4, 0, Math.PI * 2);
    ctx.stroke();
  }
}

type DrawOpts = {
  cx: number;
  cy: number;
  R: number;
  dpr: number;
  /** Seconds into the cycle; Infinity draws the finished glyph. */
  t: number;
  tl: Timeline;
  alpha: number;
  glow: number;
};

/** The source copy draws stroke by stroke, then the reflections sweep around. */
export function drawGlyph(ctx: CanvasRenderingContext2D, glyph: Glyph, list: Copy[], o: DrawOpts) {
  const unit = o.dpr / o.R;
  ctx.save();
  ctx.shadowColor = INK;
  ctx.shadowBlur = o.glow * o.dpr;
  list.forEach((c, j) => {
    const copyP = j === 0 ? 1 : progress(o.t, o.tl.srcEnd + COPY_GAP + (j - 1) * COPY_STAGGER, COPY_DRAW);
    if (copyP <= 0) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.translate(o.cx, o.cy);
    ctx.rotate(BASE + c.rot);
    ctx.scale(o.R, c.flip ? -o.R : o.R);
    ctx.lineWidth = unit;
    glyph.prims.forEach((prim, i) => {
      const p = j === 0 ? progress(o.t, SCAN + i * STAGGER, DRAW) : copyP;
      ctx.strokeStyle = ctx.fillStyle = `rgb(${INK_RGB} / ${prim.alpha * o.alpha})`;
      strokePrim(ctx, prim, p, unit);
    });
  });
  ctx.restore();
}

export function fitCanvas(canvas: HTMLCanvasElement) {
  const dpr = window.devicePixelRatio;
  const w = Math.round(canvas.clientWidth * dpr);
  const h = Math.round(canvas.clientHeight * dpr);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  return dpr;
}
