import type { Mount } from '../../types';
import { copies, generate, type Copy, type Glyph, type Prim } from './glyph';
import './style.css';

// Story: the synthesizer samples one wedge of an unknown signal and resolves its
// symmetric signature by reflecting that wedge around the mirror axes.

const INK = '#b8fff0';
const INK_RGB = '184 255 240';

// Timeline of one cycle, in seconds (fui-design §2.5).
const SCAN = 0.35;
const STAGGER = 0.12;
const DRAW = 0.45;
const COPY_GAP = 0.1;
const COPY_STAGGER = 0.07;
const COPY_DRAW = 0.35;
const GUIDE_FADE = 0.4;
const HOLD = 4.5;
const DISSOLVE = 0.5;

const GLYPHS = 'アイウエオカキクケコサシスセソ0123456789ABCDEFXYZ#%&*+=<>/';
const BASE = -Math.PI / 2; // source wedge starts on the vertical axis

// cubic-bezier(0.6, 0, 0.2, 1): the --fui-draw easing.
function drawEase(x: number) {
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

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const progress = (t: number, start: number, dur: number) => drawEase(clamp01((t - start) / dur));
const wobble = (t: number, seed: number, amount: number) =>
  (Math.sin(t * 2.3 + seed) * 0.6 + Math.sin(t * 5.7 + seed * 1.7) * 0.4) * amount;
const hex = (v: number) => v.toString(16).toUpperCase().padStart(6, '0');

type Cycle = {
  glyph: Glyph;
  copies: Copy[];
  /** Absolute start; the other times are relative to it. */
  start: number;
  srcEnd: number;
  repEnd: number;
  end: number;
  seq: number;
};

function makeCycle(start: number, seq: number): Cycle {
  const glyph = generate((Math.random() * 0xffffff) | 0);
  const list = copies(glyph.n);
  const srcEnd = SCAN + (glyph.prims.length - 1) * STAGGER + DRAW;
  const repEnd = srcEnd + COPY_GAP + (list.length - 2) * COPY_STAGGER + COPY_DRAW;
  return { glyph, copies: list, start, srcEnd, repEnd, end: repEnd + GUIDE_FADE + HOLD + DISSOLVE, seq };
}

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

export const mount: Mount = (el) => {
  const root = document.createElement('div');
  root.className = 's1';
  root.innerHTML = `
    <canvas></canvas>
    <span class="micro tl"></span>
    <span class="micro tr"></span>
    <span class="micro bl"></span>
    <span class="micro br"></span>
    <div class="panel-head"><b>01</b><span>SIGNATURE SYNTH</span><i></i></div>
    <div class="status"><span></span><small>CLICK / SPACE — RESEED</small></div>
  `;
  el.append(root);
  const canvas = root.querySelector('canvas')!;
  const ctx = canvas.getContext('2d')!;
  const [tl, tr, bl, br] = Array.from(root.querySelectorAll<HTMLElement>('.micro'));
  const status = root.querySelector<HTMLElement>('.status span')!;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const resize = () => {
    const dpr = window.devicePixelRatio;
    canvas.width = root.clientWidth * dpr;
    canvas.height = root.clientHeight * dpr;
  };
  const ro = new ResizeObserver(resize);
  ro.observe(root);
  resize();

  const t0 = performance.now() / 1000;
  let cycle = makeCycle(0, 1);
  const reseed = () => {
    cycle = makeCycle(performance.now() / 1000 - t0, cycle.seq + 1);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.code !== 'Space') return;
    e.preventDefault();
    reseed();
  };
  root.addEventListener('pointerdown', reseed);
  window.addEventListener('keydown', onKey);

  let statusText = '';
  let statusSince = 0;
  let shown = '';
  let lastTick = -1;

  const frame = () => {
    const now = performance.now() / 1000 - t0;
    if (now - cycle.start >= cycle.end) cycle = makeCycle(cycle.start + cycle.end, cycle.seq + 1);
    // Reduced motion: skip straight to the resolved signature and never dissolve.
    const t = reduced ? Math.max(now - cycle.start, cycle.repEnd + GUIDE_FADE) : now - cycle.start;
    const { glyph } = cycle;
    const dpr = window.devicePixelRatio;
    const { width: w, height: h } = canvas;
    const cx = w / 2;
    const cy = h * 0.47;
    const R = Math.min(w, h * 0.82) * 0.34;
    const wedge = Math.PI / glyph.n;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = dpr;
    ctx.shadowBlur = 0;

    // Registration marks, 8px from each corner.
    ctx.strokeStyle = `rgb(${INK_RGB} / 0.45)`;
    ctx.beginPath();
    for (const [x, y] of [
      [8, 8],
      [w / dpr - 8, 8],
      [8, h / dpr - 8],
      [w / dpr - 8, h / dpr - 8],
    ]) {
      ctx.moveTo((x - 4.5) * dpr, y * dpr);
      ctx.lineTo((x + 4.5) * dpr, y * dpr);
      ctx.moveTo(x * dpr, (y - 4.5) * dpr);
      ctx.lineTo(x * dpr, (y + 4.5) * dpr);
    }
    ctx.stroke();

    // Measurement ring: 10° ticks, every third one long.
    const ringR = R * 1.14;
    ctx.strokeStyle = `rgb(${INK_RGB} / 0.22)`;
    ctx.beginPath();
    ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = `rgb(${INK_RGB} / 0.35)`;
    ctx.beginPath();
    for (let k = 0; k < 36; k++) {
      const a = (k * Math.PI) / 18;
      const len = (k % 3 === 0 ? 7 : 3.5) * dpr;
      ctx.moveTo(cx + Math.cos(a) * ringR, cy + Math.sin(a) * ringR);
      ctx.lineTo(cx + Math.cos(a) * (ringR + len), cy + Math.sin(a) * (ringR + len));
    }
    ctx.stroke();

    // Mirror-axis markers: one inward triangle per axis ray, snapping in with the scan.
    const snap = progress(t, 0, SCAN);
    ctx.fillStyle = `rgb(${INK_RGB} / ${0.8 * snap})`;
    for (let k = 0; k < glyph.n * 2; k++) {
      const a = BASE + k * wedge;
      const r = ringR - (2 + (1 - snap) * 12) * dpr;
      const s = 4 * dpr;
      const [ux, uy] = [Math.cos(a), Math.sin(a)];
      ctx.beginPath();
      ctx.moveTo(cx + ux * r, cy + uy * r);
      ctx.lineTo(cx + ux * (r - s * 1.6) - uy * s, cy + uy * (r - s * 1.6) + ux * s);
      ctx.lineTo(cx + ux * (r - s * 1.6) + uy * s, cy + uy * (r - s * 1.6) - ux * s);
      ctx.fill();
    }

    // Scan pulse at the start of each cycle.
    if (t < SCAN) {
      ctx.strokeStyle = `rgb(${INK_RGB} / ${0.6 * (1 - t / SCAN)})`;
      ctx.beginPath();
      ctx.arc(cx, cy, R * progress(t, 0, SCAN), 0, Math.PI * 2);
      ctx.stroke();
    }

    let alpha = 1;
    if (!reduced && t > cycle.end - DISSOLVE) {
      const d = (t - (cycle.end - DISSOLVE)) / DISSOLVE;
      alpha = (1 - d) * (Math.sin(t * 90) > 0 ? 1 : 0.55);
    }

    // Source-wedge guide, visible until the reflection completes.
    const guide = 1 - clamp01((t - cycle.repEnd) / GUIDE_FADE);
    if (guide > 0) {
      ctx.strokeStyle = `rgb(${INK_RGB} / ${0.3 * guide * snap})`;
      ctx.setLineDash([2 * dpr, 4 * dpr]);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(BASE) * R, cy + Math.sin(BASE) * R);
      ctx.arc(cx, cy, R, BASE, BASE + wedge);
      ctx.closePath();
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Glyph: the source copy draws stroke by stroke, then the reflections sweep around.
    const unit = dpr / R;
    ctx.shadowColor = INK;
    ctx.shadowBlur = 6 * dpr;
    cycle.copies.forEach((c, j) => {
      const copyP = j === 0 ? 1 : progress(t, cycle.srcEnd + COPY_GAP + (j - 1) * COPY_STAGGER, COPY_DRAW);
      if (copyP <= 0) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.translate(cx, cy);
      ctx.rotate(BASE + c.rot);
      ctx.scale(R, c.flip ? -R : R);
      ctx.lineWidth = unit;
      glyph.prims.forEach((prim, i) => {
        const p = j === 0 ? progress(t, SCAN + i * STAGGER, DRAW) : copyP;
        ctx.strokeStyle = ctx.fillStyle = `rgb(${INK_RGB} / ${prim.alpha * alpha})`;
        strokePrim(ctx, prim, p, unit);
      });
    });

    // Center reticle.
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = `rgb(${INK_RGB} / 0.6)`;
    ctx.beginPath();
    ctx.moveTo(cx - 5 * dpr, cy);
    ctx.lineTo(cx + 5 * dpr, cy);
    ctx.moveTo(cx, cy - 5 * dpr);
    ctx.lineTo(cx, cy + 5 * dpr);
    ctx.stroke();

    // Status line decodes whenever the phase changes.
    const nextStatus =
      t < SCAN
        ? 'SCANNING'
        : t < cycle.srcEnd
          ? 'SAMPLING SOURCE WEDGE'
          : t < cycle.repEnd
            ? `REFLECTING ×${cycle.copies.length}`
            : 'SIGNATURE RESOLVED';
    if (nextStatus !== statusText) {
      statusText = nextStatus;
      statusSince = now;
    }
    const dp = reduced ? 1 : clamp01((now - statusSince) / (Math.min(700, 300 + statusText.length * 12) / 1000));
    const k = Math.floor(dp * statusText.length);
    const noise = Array.from(
      { length: Math.min(6, statusText.length - k) },
      () => GLYPHS[(Math.random() * GLYPHS.length) | 0],
    ).join('');
    const nextShown = statusText.slice(0, k) + noise;
    if (nextShown !== shown) status.textContent = shown = nextShown;

    // Micro readouts refresh at 10Hz.
    const tick = Math.floor(now * 10);
    if (tick !== lastTick) {
      lastTick = tick;
      const built = clamp01(t / cycle.repEnd);
      tl.textContent = `GEN.FUI // SYM-LINE // SEQ ${String(cycle.seq).padStart(4, '0')}`;
      tr.textContent =
        built < 1 ? `BUILD ${String(Math.round(built * 100)).padStart(3, '0')}%` : `COHERENCE ${(0.982 + wobble(now, glyph.seed, 0.006)).toFixed(3)}`;
      bl.textContent = `SEED ${hex(glyph.seed)} · D${glyph.n} · ${cycle.copies.length} COPIES · ${glyph.prims.length} PRIM`;
      const m = Math.floor(now / 60);
      br.textContent = `T+${String(m).padStart(2, '0')}:${(now - m * 60).toFixed(1).padStart(4, '0')}`;
    }

    raf = requestAnimationFrame(frame);
  };
  let raf = requestAnimationFrame(frame);

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    window.removeEventListener('keydown', onKey);
    root.remove();
  };
};
