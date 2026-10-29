import { useEffect, useRef, type KeyboardEvent, type PointerEvent } from 'react';
import { FACES, X, Y, drawCube, frontFace, qAxis, qMul, qSlerp, type Q, type V3 } from './cube';
import { clamp01, fitCanvas } from './render';
import { clampTilt, kickTilt, type Tilt } from './tilt';
import { now, pad, reduced, useFrame } from './util';

const SNAP = 0.5;
const DRAG_GAIN = 0.012;
const DRAG_LIMIT = 1.2;
const DRAG_COMMIT = 24;
/** How much of the cube's motion carries over to the emblem's attitude. */
const LINK = 0.45;
const KICK = 260;
const DEG = 180 / Math.PI;
/** Camera tilt so the cube always reads as a solid, not a square. */
const VIEW = qMul(qAxis(X, 0.38), qAxis(Y, -0.52));

// Overshoots by ~10% before settling: the snap of a detent.
const backOut = (p: number) => 1 + 2.2 * (p - 1) ** 3 + 1.2 * (p - 1) ** 2;

/** Symmetry-order selector: a cube with one order per face; the face turned to the front is the selection. */
export function OrderCube(props: {
  order: 'auto' | number;
  autoN: number;
  tilt: Tilt;
  onChange: (o: 'auto' | number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const anim = useRef({
    from: FACES[0].front,
    to: FACES[0].front,
    start: -Infinity,
    drag: null as null | { x: number; y: number; dx: number; dy: number },
  });
  const desired = props.order === 'auto' ? props.autoN : props.order;

  const settled = (): Q => {
    const a = anim.current;
    const p = reduced ? 1 : clamp01((now() - a.start) / SNAP);
    return qSlerp(a.from, a.to, backOut(p));
  };
  const dragAngles = (): [number, number] => {
    const d = anim.current.drag;
    if (!d) return [0, 0];
    const lim = (v: number) => Math.max(-DRAG_LIMIT, Math.min(DRAG_LIMIT, v * DRAG_GAIN));
    return [lim(d.dy), lim(d.dx)];
  };
  const dragQ = (): Q => {
    const [ax, ay] = dragAngles();
    return qMul(qAxis(Y, ay), qAxis(X, ax));
  };
  const rotateTo = (to: Q) => {
    const a = anim.current;
    a.from = qMul(dragQ(), settled());
    a.to = to;
    a.start = now();
  };
  const turn = (axis: V3, sign: number) => {
    const to = qMul(qAxis(axis, (sign * Math.PI) / 2), anim.current.to);
    rotateTo(to);
    kickTilt(props.tilt, axis === X ? sign * KICK : 0, axis === Y ? sign * KICK : 0);
    props.onChange(frontFace(to).order);
  };

  useEffect(() => {
    if (frontFace(anim.current.to).order !== desired) rotateTo(FACES.find((f) => f.order === desired)!.front);
  }, [desired]);

  useFrame(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const dpr = fitCanvas(canvas);
    const { width: w, height: h } = canvas;
    const t = now();
    const idle = props.order === 'auto' ? 1 : 0.35;
    const [sx, sy] = reduced ? [0, 0] : [Math.sin(t * 0.53) * 0.1 * idle, Math.sin(t * 0.7) * 0.18 * idle];
    const sway = qMul(qAxis(Y, sy), qAxis(X, sx));
    const [dx, dy] = dragAngles();
    props.tilt.sway = [sx * DEG * LINK, sy * DEG * LINK];
    props.tilt.cube = [clampTilt(dx * DEG * LINK), clampTilt(dy * DEG * LINK)];
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);
    drawCube(ctx, qMul(sway, qMul(VIEW, qMul(dragQ(), settled()))), w / 2, h / 2, Math.min(w, h) * 0.27, dpr);
  });

  const onDown = (e: PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    anim.current.drag = { x: e.clientX, y: e.clientY, dx: 0, dy: 0 };
  };
  const onMove = (e: PointerEvent) => {
    const d = anim.current.drag;
    if (!d) return;
    d.dx = e.clientX - d.x;
    d.dy = e.clientY - d.y;
  };
  const onUp = () => {
    const d = anim.current.drag;
    if (!d) return;
    const { dx, dy } = d;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 5) {
      anim.current.drag = null;
      return;
    }
    if (Math.abs(dx) >= Math.abs(dy) && Math.abs(dx) > DRAG_COMMIT) turn(Y, Math.sign(dx));
    else if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > DRAG_COMMIT) turn(X, Math.sign(dy));
    else rotateTo(anim.current.to);
    anim.current.drag = null;
  };
  const onKey = (e: KeyboardEvent) => {
    const map: Record<string, [V3, number]> = { ArrowLeft: [Y, -1], ArrowRight: [Y, 1], ArrowUp: [X, -1], ArrowDown: [X, 1] };
    if (e.key === 'Enter') props.onChange('auto');
    const m = map[e.key];
    if (!m) return;
    e.preventDefault();
    turn(...m);
  };

  return (
    <div className="cube">
      <canvas
        ref={canvasRef}
        tabIndex={0}
        role="slider"
        aria-label="Symmetry order"
        aria-valuetext={props.order === 'auto' ? `auto, D${props.autoN}` : `D${props.order}`}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onDoubleClick={() => props.onChange('auto')}
        onKeyDown={onKey}
      />
      <span className="micro tl">FACE {pad(FACES.findIndex((f) => f.order === desired) + 1, 2)}/06</span>
      <span className={`micro tr ${props.order === 'auto' ? 'blink' : ''}`}>{props.order === 'auto' ? 'AUTO' : 'MANUAL'}</span>
      <span className="micro bl">DRAG ⇄ ROTATE · DBL = AUTO</span>
    </div>
  );
}

const DIAL_MIN = -135;
const DIAL_SPAN = 270;
const dialPt = (r: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return `${(60 + r * Math.sin(a)).toFixed(2)} ${(60 - r * Math.cos(a)).toFixed(2)}`;
};
const dialArc = (r: number, a0: number, a1: number) => `M ${dialPt(r, a0)} A ${r} ${r} 0 0 1 ${dialPt(r, a1)}`;

/** Rotary jog for an integer value: segments light up clockwise, drag around the ring to set. */
export function Dial(props: { value: number; min: number; max: number; unit: string; onChange: (v: number) => void }) {
  const { value, min, max } = props;
  const steps = max - min + 1;
  const seg = DIAL_SPAN / steps;
  const set = (v: number) => {
    const c = Math.max(min, Math.min(max, v));
    if (c !== value) props.onChange(c);
  };
  const fromPointer = (e: PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2);
    const y = e.clientY - (r.top + r.height / 2);
    const deg = (Math.atan2(x, -y) * 180) / Math.PI;
    if (deg < DIAL_MIN - 15 || deg > DIAL_MIN + DIAL_SPAN + 15) return;
    set(min + Math.floor(clamp01((deg - DIAL_MIN) / DIAL_SPAN) * (steps - 0.001)));
  };

  return (
    <svg
      className="dial"
      viewBox="0 0 120 120"
      tabIndex={0}
      role="slider"
      aria-label="Density"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        fromPointer(e);
      }}
      onPointerMove={(e) => e.buttons && fromPointer(e)}
      onWheel={(e) => set(value + (e.deltaY < 0 ? 1 : -1))}
      onKeyDown={(e) => {
        if (e.key === 'ArrowUp' || e.key === 'ArrowRight') set(value + 1);
        if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') set(value - 1);
      }}
    >
      <circle className="spin" cx="60" cy="60" r="55" />
      <circle className="inner" cx="60" cy="60" r="33" />
      {Array.from({ length: steps }, (_, i) => (
        <path
          key={i}
          className={i <= value - min ? 'seg on' : 'seg'}
          d={dialArc(45, DIAL_MIN + i * seg + 1.5, DIAL_MIN + (i + 1) * seg - 1.5)}
        />
      ))}
      <g className="needle" style={{ transform: `rotate(${DIAL_MIN + (value - min + 1) * seg}deg)` }}>
        <path d="M 60 2 L 57 9 L 63 9 Z" />
      </g>
      <text x="60" y="62" className="value">
        {pad(value, 2)}
      </text>
      <text x="60" y="75" className="unit">
        {props.unit}
      </text>
    </svg>
  );
}

export function HexSwitch(props: { label: string; on: boolean; warn?: boolean; onToggle: () => void }) {
  return (
    <button className={`hex ${props.warn ? 'warn' : ''}`} aria-pressed={props.on} onClick={props.onToggle}>
      <span>
        <i />
        {props.label}
      </span>
    </button>
  );
}

const CHARGE = 0.55;
const DRAIN = 0.25;

/** Press and hold to charge; fires when the ring closes. Keyboard activation fires at once. */
export function ChargeButton(props: { label: string; onFire: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const ring = useRef<SVGCircleElement>(null);
  const fire = useRef(props.onFire);
  fire.current = props.onFire;
  const st = useRef({ charging: false, p: 0, last: now() });

  const flash = () => {
    const el = ref.current;
    if (!el) return;
    el.classList.remove('fired');
    void el.offsetWidth;
    el.classList.add('fired');
    fire.current();
  };

  useFrame(() => {
    const s = st.current;
    const t = now();
    const dt = t - s.last;
    s.last = t;
    s.p = clamp01(s.p + (s.charging ? dt / CHARGE : -dt / DRAIN));
    if (s.charging && s.p >= 1) {
      s.charging = false;
      s.p = 0;
      flash();
    }
    ref.current?.classList.toggle('charging', s.charging);
    if (ring.current) ring.current.style.strokeDashoffset = (1 - s.p).toFixed(3);
  });

  const release = () => {
    st.current.charging = false;
  };

  return (
    <button
      ref={ref}
      className="charge"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        st.current.charging = true;
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onClick={(e) => e.detail === 0 && flash()}
    >
      <svg viewBox="0 0 64 64">
        <circle className="orbit" cx="32" cy="32" r="30" />
        <circle className="track" cx="32" cy="32" r="25" />
        <circle ref={ring} className="fill" cx="32" cy="32" r="25" pathLength={1} />
        <circle className="core" cx="32" cy="32" r="18" />
      </svg>
      <span>{props.label}</span>
    </button>
  );
}
