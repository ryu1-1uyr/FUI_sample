import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react';
import { createRoot } from 'react-dom/client';
import type { Mount } from '../../types';
import { Boot, type BootTask } from './boot';
import { ChargeButton, Dial, HexSwitch, OrderCube } from './controls';
import { ORDERS, angularProfile, copies, generate, type GenOptions, type Glyph } from './glyph';
import {
  BASE,
  DISSOLVE,
  GUIDE_FADE,
  INK_RGB,
  SCAN,
  clamp01,
  drawGlyph,
  fitCanvas,
  progress,
  timeline,
  type Timeline,
} from './render';
import { clock, hex, now, pad, reduced, useFrame, useTicker, wobble } from './util';
import './style.css';

// Story: an operator console that samples one wedge of an unknown signal and resolves
// its symmetric signature by reflecting the wedge. The operator steers the synthesis.

const GLYPHS = 'アイウエオカキクケコサシスセソ0123456789ABCDEFXYZ#%&*+=<>/';
const ARCHIVE_SIZE = 6;
const LOG_SIZE = 40;
const FONT_URL = 'https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap';
const FONT_TIMEOUT = 3000;
const GLITCH = 0.26;

const newSeed = () => (Math.random() * 0xffffff) | 0;

type Phase = 'SCANNING' | 'SAMPLING SOURCE WEDGE' | 'REFLECTING' | 'SIGNATURE RESOLVED';
type Synth = { glyph: Glyph; copies: ReturnType<typeof copies>; tl: Timeline };
type Entry = { seq: number; seed: number; opts: GenOptions; synth: Synth };

function phaseAt(t: number, tl: Timeline): Phase {
  if (t < SCAN) return 'SCANNING';
  if (t < tl.srcEnd) return 'SAMPLING SOURCE WEDGE';
  if (t < tl.repEnd) return 'REFLECTING';
  return 'SIGNATURE RESOLVED';
}

/** Cycle time, or the resolved state when motion is reduced. */
function cycleTime(start: number, tl: Timeline) {
  const t = now() - start;
  return reduced ? Math.max(t, tl.repEnd + GUIDE_FADE) : t;
}

/** Loads the console typeface; the boot screen waits on it so the UI never re-flows after it appears. */
function loadFont(link: HTMLLinkElement) {
  return new Promise<string>((resolve) => {
    const timer = setTimeout(() => resolve('TIMEOUT // FALLBACK'), FONT_TIMEOUT);
    const finish = (result: string) => {
      clearTimeout(timer);
      resolve(result);
    };
    link.addEventListener(
      'load',
      () =>
        document.fonts.load('12px "Share Tech Mono"').then(
          (faces) => finish(faces.length ? 'OK' : 'FALLBACK'),
          () => finish('FALLBACK'),
        ),
      { once: true },
    );
    link.addEventListener('error', () => finish('OFFLINE // FALLBACK'), { once: true });
    document.head.append(link);
  });
}

function Panel(props: { index: string; title: string; boot: number; area: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className={`panel area-${props.area}`} style={{ '--boot': `${0.35 + props.boot * 0.25}s` } as CSSProperties}>
      <header className="panel-head">
        <b>{props.index}</b>
        <span>{props.title}</span>
        <i />
        {props.aside && <em>{props.aside}</em>}
      </header>
      {props.children}
    </section>
  );
}

function Console({ initialSeed }: { initialSeed: number }) {
  const [opts, setOpts] = useState<GenOptions>({ order: 'auto', density: 5, rings: true, ticks: true, spokes: true });
  const [seed, setSeed] = useState(initialSeed);
  const [seq, setSeq] = useState(1);
  const [hold, setHold] = useState(false);
  const [archive, setArchive] = useState<Entry[]>([]);
  const [logs, setLogs] = useState<{ id: number; at: number; text: string }[]>([]);
  const startRef = useRef(now());
  const logId = useRef(0);
  const accepted = useRef(-1);

  const synth = useMemo<Synth>(() => {
    const glyph = generate(seed, opts);
    const list = copies(glyph.n);
    return { glyph, copies: list, tl: timeline(glyph, list.length) };
  }, [seed, opts]);

  useLayoutEffect(() => {
    startRef.current = now();
  }, [synth]);

  const log = useCallback((text: string) => {
    setLogs((l) => [...l.slice(-(LOG_SIZE - 1)), { id: logId.current++, at: now(), text }]);
  }, []);

  const reseed = useCallback(() => {
    setSeed(newSeed());
    setSeq((s) => s + 1);
  }, []);

  const update = (patch: Partial<GenOptions>, label: string) => {
    setOpts((o) => ({ ...o, ...patch }));
    log(`PARAM ${label}`);
  };

  const toggleHold = useCallback(() => {
    setHold((h) => {
      log(h ? 'HOLD RELEASED // AUTO-CYCLE' : 'HOLD ENGAGED');
      return !h;
    });
  }, [log]);

  const onPhase = (phase: Phase) => {
    const { glyph, copies: list } = synth;
    if (phase === 'SCANNING') {
      // Parameter changes re-run the same sample; only a new seed is a new acquisition.
      if (accepted.current === glyph.seed) log(`RESYNTH D${glyph.n} // SEED ${hex(glyph.seed)}`);
      else log(`SEQ ${pad(seq, 4)} // SEED ${hex(glyph.seed)} ACCEPTED`);
      accepted.current = glyph.seed;
    }
    if (phase === 'SAMPLING SOURCE WEDGE') log(`SAMPLING WEDGE 0/${list.length} // ${glyph.prims.length} PRIM`);
    if (phase === 'REFLECTING') log(`REFLECT D${glyph.n} ×${list.length}`);
    if (phase === 'SIGNATURE RESOLVED') {
      log(`RESOLVED // COHERENCE ${(0.98 + wobble(now(), glyph.seed, 0.01)).toFixed(3)}`);
      setArchive((a) =>
        a[0]?.seed === seed && a[0].opts === opts ? a : [{ seq, seed, opts, synth }, ...a].slice(0, ARCHIVE_SIZE),
      );
    }
  };

  const onCycleEnd = () => {
    if (hold) return;
    log('CYCLE COMPLETE // NEXT SAMPLE');
    reseed();
  };

  const recall = (e: Entry) => {
    setSeed(e.seed);
    setOpts(e.opts);
    setSeq(e.seq);
    setHold(true);
    log(`RECALL SEQ ${pad(e.seq, 4)} // HOLD ENGAGED`);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLButtonElement || (e.target instanceof Element && e.target.role === 'slider')) return;
      if (e.code === 'Space') {
        e.preventDefault();
        log('MANUAL RESEED');
        reseed();
      }
      if (e.code === 'KeyH') toggleHold();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [log, reseed, toggleHold]);

  return (
    <>
      <TopBar hold={hold} />
      <Panel index="01" title="SIGNATURE SYNTH" boot={0} area="main" aside={`SEQ ${pad(seq, 4)}`}>
        <Scope synth={synth} startRef={startRef} hold={hold} seq={seq} onPhase={onPhase} onCycleEnd={onCycleEnd} />
      </Panel>
      <Panel index="02" title="PARAMETERS" boot={1} area="ctrl">
        <Controls
          opts={opts}
          hold={hold}
          synth={synth}
          startRef={startRef}
          update={update}
          toggleHold={toggleHold}
          reseed={() => {
            log('MANUAL RESEED');
            reseed();
          }}
        />
      </Panel>
      <Panel index="03" title="ARCHIVE" boot={2} area="arch" aside={`${archive.length}/${ARCHIVE_SIZE}`}>
        <Archive entries={archive} current={synthKey(seed, opts)} onRecall={recall} />
      </Panel>
      <Panel index="04" title="ANGULAR PROFILE" boot={3} area="prof">
        <Profile synth={synth} startRef={startRef} />
      </Panel>
      <Panel index="05" title="EVENT LOG" boot={4} area="log">
        <Log entries={logs} />
      </Panel>
    </>
  );
}

function TopBar({ hold }: { hold: boolean }) {
  const t = useTicker(10);
  return (
    <div className="topbar">
      <span className="brand">SAC-7</span>
      <span className="dim">SIGNATURE ANALYSIS CONSOLE // SECTOR 04</span>
      <span className="spacer" />
      <span className="chip">
        LINK <b className="ok">●</b> NOMINAL
      </span>
      <span className={`chip ${hold ? 'blink' : ''}`}>MODE {hold ? 'HOLD' : 'AUTO'}</span>
      <span className="chip mono">T+{clock(t)}</span>
    </div>
  );
}

function Scope(props: {
  synth: Synth;
  startRef: RefObject<number>;
  hold: boolean;
  seq: number;
  onPhase: (p: Phase) => void;
  onCycleEnd: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const microRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const statusRef = useRef<HTMLSpanElement>(null);
  const state = useRef({ phase: '' as Phase | '', since: 0, shown: '', tick: -1, ended: false, synth: props.synth });
  const rootRef = useRef<HTMLDivElement>(null);

  // Glitch transition: every new synthesis tears the scope for a moment.
  useEffect(() => {
    const el = rootRef.current;
    if (!el || reduced) return;
    el.classList.remove('glitch');
    void el.offsetWidth;
    el.classList.add('glitch');
    const id = setTimeout(() => el.classList.remove('glitch'), GLITCH * 1000);
    return () => clearTimeout(id);
  }, [props.synth]);

  useFrame(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const { glyph, copies: list, tl } = props.synth;
    const s = state.current;
    if (s.synth !== props.synth) {
      s.synth = props.synth;
      s.ended = false;
      s.phase = '';
    }
    const t = cycleTime(props.startRef.current, tl);

    const phase = phaseAt(t, tl);
    if (phase !== s.phase) {
      s.phase = phase;
      s.since = now();
      props.onPhase(phase);
    }
    if (!s.ended && !props.hold && t >= tl.end) {
      s.ended = true;
      props.onCycleEnd();
    }

    const dpr = fitCanvas(canvas);
    const { width: w, height: h } = canvas;
    const cx = w / 2;
    const cy = h * 0.47;
    const R = Math.min(w, h * 0.8) * 0.36;
    const wedge = Math.PI / glyph.n;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = dpr;

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
      const sz = 4 * dpr;
      const [ux, uy] = [Math.cos(a), Math.sin(a)];
      ctx.beginPath();
      ctx.moveTo(cx + ux * r, cy + uy * r);
      ctx.lineTo(cx + ux * (r - sz * 1.6) - uy * sz, cy + uy * (r - sz * 1.6) + ux * sz);
      ctx.lineTo(cx + ux * (r - sz * 1.6) + uy * sz, cy + uy * (r - sz * 1.6) - ux * sz);
      ctx.fill();
    }

    if (t < SCAN) {
      ctx.strokeStyle = `rgb(${INK_RGB} / ${0.6 * (1 - t / SCAN)})`;
      ctx.beginPath();
      ctx.arc(cx, cy, R * progress(t, 0, SCAN), 0, Math.PI * 2);
      ctx.stroke();
    }

    let alpha = 1;
    if (!reduced && !props.hold && t > tl.end - DISSOLVE) {
      const d = (t - (tl.end - DISSOLVE)) / DISSOLVE;
      alpha = Math.max(0, 1 - d) * (Math.sin(t * 90) > 0 ? 1 : 0.55);
    }

    // Source-wedge guide, visible until the reflection completes.
    const guide = 1 - clamp01((t - tl.repEnd) / GUIDE_FADE);
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

    drawGlyph(ctx, glyph, list, { cx, cy, R, dpr, t, tl, alpha, glow: 6 });

    ctx.strokeStyle = `rgb(${INK_RGB} / 0.6)`;
    ctx.beginPath();
    ctx.moveTo(cx - 5 * dpr, cy);
    ctx.lineTo(cx + 5 * dpr, cy);
    ctx.moveTo(cx, cy - 5 * dpr);
    ctx.lineTo(cx, cy + 5 * dpr);
    ctx.stroke();

    // Status line decodes whenever the phase changes.
    const text = phase === 'REFLECTING' ? `REFLECTING ×${list.length}` : phase;
    const dp = reduced ? 1 : clamp01((now() - s.since) / (Math.min(700, 300 + text.length * 12) / 1000));
    const k = Math.floor(dp * text.length);
    const noise = Array.from({ length: Math.min(6, text.length - k) }, () => GLYPHS[(Math.random() * GLYPHS.length) | 0]);
    const shown = text.slice(0, k) + noise.join('');
    if (shown !== s.shown && statusRef.current) statusRef.current.textContent = s.shown = shown;

    // Micro readouts refresh at 10Hz.
    const tick = Math.floor(now() * 10);
    const [tl0, tr, bl, br] = microRefs.current;
    if (tick !== s.tick && tl0 && tr && bl && br) {
      s.tick = tick;
      const built = clamp01(t / tl.repEnd);
      tl0.textContent = `GEN.FUI // SYM-LINE // D${glyph.n}`;
      tr.textContent =
        built < 1 ? `BUILD ${pad(Math.round(built * 100), 3)}%` : `COHERENCE ${(0.982 + wobble(now(), glyph.seed, 0.006)).toFixed(3)}`;
      bl.textContent = `SEED ${hex(glyph.seed)} · ${list.length} COPIES · ${glyph.prims.length} PRIM`;
      br.textContent = `CYC ${clock(Math.min(t, tl.end))} / ${clock(tl.end)}`;
    }
  });

  return (
    <div className="scope" ref={rootRef}>
      <canvas ref={canvasRef} />
      {(['tl', 'tr', 'bl', 'br'] as const).map((at, i) => (
        <span
          key={at}
          className={`micro ${at}`}
          ref={(el) => {
            microRefs.current[i] = el;
          }}
        />
      ))}
      <div className="status">
        <span ref={statusRef} />
      </div>
    </div>
  );
}

function Controls(props: {
  opts: GenOptions;
  hold: boolean;
  synth: Synth;
  startRef: RefObject<number>;
  update: (patch: Partial<GenOptions>, label: string) => void;
  toggleHold: () => void;
  reseed: () => void;
}) {
  const { opts, update } = props;
  const barRef = useRef<HTMLDivElement>(null);
  const layers = [
    ['rings', 'RING'],
    ['ticks', 'TICK'],
    ['spokes', 'SPOKE'],
  ] as const;

  // Cycle bar: time left before the auto-cycle samples the next signal.
  useFrame(() => {
    const bar = barRef.current;
    if (!bar) return;
    const { tl } = props.synth;
    const t = cycleTime(props.startRef.current, tl);
    bar.style.setProperty('--p', props.hold ? '1' : clamp01(t / tl.end).toFixed(4));
  });

  return (
    <div className="controls">
      <div className="field">
        <label>
          SYM ORDER <span>{opts.order === 'auto' ? `AUTO → D${props.synth.glyph.n}` : `D${opts.order}`}</span>
        </label>
        <OrderCube
          order={opts.order}
          autoN={props.synth.glyph.n}
          onChange={(o) => o !== opts.order && update({ order: o }, `ORDER=${o === 'auto' ? 'AUTO' : `D${o}`}`)}
        />
      </div>

      <div className="field">
        <label>
          DENSITY / FIRE <span>{pad(opts.density, 2)} WALK</span>
        </label>
        <div className="jog">
          <Dial
            value={opts.density}
            min={1}
            max={10}
            unit="WALK"
            onChange={(v) => update({ density: v }, `DENSITY=${pad(v, 2)}`)}
          />
          <ChargeButton label="RESEED" onFire={props.reseed} />
        </div>
      </div>

      <div className="field">
        <label>
          LAYERS / CYCLE <span>{props.hold ? 'HOLD' : 'AUTO'}</span>
        </label>
        <div className="hexes">
          {layers.map(([key, label]) => (
            <HexSwitch
              key={key}
              label={label}
              on={opts[key]}
              onToggle={() => update({ [key]: !opts[key] }, `${label}=${opts[key] ? 'OFF' : 'ON'}`)}
            />
          ))}
          <HexSwitch label="HOLD" warn on={props.hold} onToggle={props.toggleHold} />
        </div>
        <div className="cycle" ref={barRef}>
          <i />
        </div>
      </div>

      <div className="field grow">
        <label>
          SOURCE SAMPLE <span>WEDGE {(180 / props.synth.glyph.n).toFixed(1)}°</span>
        </label>
        <WedgeMonitor synth={props.synth} startRef={props.startRef} />
      </div>

      <p className="keys">
        <kbd>SPACE</kbd> RESEED · <kbd>H</kbd> HOLD
      </p>
    </div>
  );
}

/** The raw sampled wedge on its 1/8 snapping grid, before any reflection. */
function WedgeMonitor(props: { synth: Synth; startRef: RefObject<number> }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useFrame(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const { glyph, copies: list, tl } = props.synth;
    const t = cycleTime(props.startRef.current, tl);
    const dpr = fitCanvas(canvas);
    const { width: w, height: h } = canvas;
    const wedge = Math.PI / glyph.n;

    // Fit the sector's bounding box into the canvas.
    const pts: [number, number][] = [[0, 0]];
    for (let i = 0; i <= 16; i++) {
      const a = BASE + (wedge * i) / 16;
      pts.push([Math.cos(a), Math.sin(a)]);
    }
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    const R = Math.min(w / (x1 - x0), h / (y1 - y0)) * 0.86;
    const cx = w / 2 - ((x0 + x1) / 2) * R;
    const cy = h / 2 - ((y0 + y1) / 2) * R;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = dpr;

    ctx.fillStyle = `rgb(${INK_RGB} / 0.22)`;
    for (let gx = -8; gx <= 8; gx++)
      for (let gy = 0; gy <= 8; gy++) {
        const [x, y] = [gx / 8, gy / 8];
        const a = Math.atan2(y, x);
        if (Math.hypot(x, y) > 1 || a < -1e-6 || a > wedge + 1e-6) continue;
        const sx = cx + (Math.cos(BASE) * x - Math.sin(BASE) * y) * R;
        const sy = cy + (Math.sin(BASE) * x + Math.cos(BASE) * y) * R;
        ctx.fillRect(sx - dpr * 0.5, sy - dpr * 0.5, dpr, dpr);
      }

    ctx.strokeStyle = `rgb(${INK_RGB} / 0.35)`;
    ctx.setLineDash([2 * dpr, 3 * dpr]);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R, BASE, BASE + wedge);
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);

    drawGlyph(ctx, glyph, list.slice(0, 1), { cx, cy, R, dpr, t, tl, alpha: 1, glow: 4 });
  });
  return (
    <div className="wedge">
      <canvas ref={ref} />
    </div>
  );
}

function Thumb({ synth }: { synth: Synth }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!;
    const dpr = fitCanvas(canvas);
    const ctx = canvas.getContext('2d')!;
    const { width: w, height: h } = canvas;
    ctx.clearRect(0, 0, w, h);
    const R = Math.min(w, h) * 0.42;
    drawGlyph(ctx, synth.glyph, synth.copies, { cx: w / 2, cy: h / 2, R, dpr, t: Infinity, tl: synth.tl, alpha: 0.9, glow: 3 });
  }, [synth]);
  return <canvas ref={ref} />;
}

const synthKey = (seed: number, opts: GenOptions) => `${seed}:${JSON.stringify(opts)}`;

function Archive(props: { entries: Entry[]; current: string; onRecall: (e: Entry) => void }) {
  return (
    <ol className="archive">
      {Array.from({ length: ARCHIVE_SIZE }, (_, i) => {
        const e = props.entries[i];
        if (!e)
          return (
            <li key={`empty-${i}`} className="empty">
              <span>NO DATA</span>
            </li>
          );
        return (
          <li key={`${e.seq}-${e.seed}-${i}`}>
            <button aria-current={synthKey(e.seed, e.opts) === props.current} onClick={() => props.onRecall(e)}>
              <Thumb synth={e.synth} />
              <span>
                {pad(e.seq, 4)} · D{e.synth.glyph.n}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function Profile(props: { synth: Synth; startRef: RefObject<number> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const readRef = useRef<HTMLSpanElement>(null);
  const tick = useRef(-1);
  const BINS = 90;
  const profile = useMemo(() => angularProfile(props.synth.glyph, BINS), [props.synth]);

  useFrame(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const { glyph, tl } = props.synth;
    const t = cycleTime(props.startRef.current, tl);
    const dpr = fitCanvas(canvas);
    const { width: w, height: h } = canvas;
    const pad = 4 * dpr;
    const base = h - 14 * dpr;
    const top = 6 * dpr;
    const x = (bearing: number) => pad + (bearing / 360) * (w - pad * 2);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = dpr;

    // Grid and bearing scale.
    ctx.strokeStyle = `rgb(${INK_RGB} / 0.1)`;
    ctx.beginPath();
    for (let g = 0; g <= 4; g++) {
      const y = top + ((base - top) * g) / 4;
      ctx.moveTo(pad, y);
      ctx.lineTo(w - pad, y);
    }
    ctx.stroke();
    ctx.strokeStyle = `rgb(${INK_RGB} / 0.35)`;
    ctx.beginPath();
    for (let b = 0; b <= 360; b += 30) {
      ctx.moveTo(x(b), base);
      ctx.lineTo(x(b), base + (b % 90 === 0 ? 5 : 3) * dpr);
    }
    ctx.stroke();
    ctx.fillStyle = `rgb(${INK_RGB} / 0.45)`;
    ctx.font = `${9 * dpr}px ${getComputedStyle(canvas).fontFamily}`;
    ctx.textBaseline = 'bottom';
    for (const b of [0, 90, 180, 270]) ctx.fillText(pad3(b), x(b) + 2 * dpr, h);

    // Mirror axes: the profile repeats with period 360/n and is symmetric about each axis.
    ctx.strokeStyle = `rgb(${INK_RGB} / 0.25)`;
    ctx.setLineDash([2 * dpr, 3 * dpr]);
    ctx.beginPath();
    for (let k = 0; k < glyph.n * 2; k++) {
      const b = (k * 180) / glyph.n;
      ctx.moveTo(x(b), top);
      ctx.lineTo(x(b), base);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Bars grow with the build.
    const grow = progress(t, SCAN, tl.repEnd - SCAN);
    const bw = (w - pad * 2) / BINS;
    ctx.fillStyle = `rgb(${INK_RGB} / 0.75)`;
    profile.forEach((v, i) => {
      const bh = v * (base - top) * grow;
      ctx.fillRect(pad + i * bw + dpr * 0.5, base - bh, Math.max(dpr, bw - dpr), bh);
    });

    // Sweep cursor reads the profile at its bearing.
    const bearing = (now() * 0.18 * 360) % 360;
    ctx.strokeStyle = `rgb(${INK_RGB} / 0.9)`;
    ctx.beginPath();
    ctx.moveTo(x(bearing), top);
    ctx.lineTo(x(bearing), base);
    ctx.stroke();

    const tk = Math.floor(now() * 10);
    if (tk !== tick.current && readRef.current) {
      tick.current = tk;
      const v = profile[Math.floor((bearing / 360) * BINS) % BINS] * grow;
      readRef.current.textContent = `BRG ${pad3(Math.round(bearing))}° · DENS ${v.toFixed(2)} · T ${(360 / glyph.n).toFixed(0)}°`;
    }
  });

  return (
    <div className="profile">
      <canvas ref={canvasRef} />
      <span className="micro" ref={readRef} />
    </div>
  );
}

const pad3 = (v: number) => pad(v, 3);

function Log({ entries }: { entries: { id: number; at: number; text: string }[] }) {
  const ref = useRef<HTMLOListElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [entries]);
  return (
    <ol className="log" ref={ref}>
      {entries.map((e) => (
        <li key={e.id}>
          <time>{clock(e.at)}</time> {e.text}
        </li>
      ))}
    </ol>
  );
}

function App({ fontLink }: { fontLink: HTMLLinkElement }) {
  const [seed] = useState(newSeed);
  const [ready, setReady] = useState(false);
  const [booting, setBooting] = useState(true);

  const tasks = useMemo<BootTask[]>(
    () => [
      { label: 'BOOTSTRAP ROM v4.12', run: () => 'OK', min: 0.18 },
      { label: 'TYPEFACE // SHARE TECH MONO', run: () => loadFont(fontLink), min: 0.3 },
      {
        label: 'SYMMETRY GROUP TABLE D1-D8',
        run: () => `${ORDERS.reduce((n, o) => n + copies(o).length, 0)} ELEMENTS`,
        min: 0.22,
      },
      {
        label: 'SIGNAL BUFFER',
        run: () => {
          const g = generate(seed, { order: 'auto', density: 5, rings: true, ticks: true, spokes: true });
          return `SEED ${hex(seed)} · D${g.n}`;
        },
        min: 0.26,
      },
      {
        label: 'DISPLAY SURFACE',
        run: () => `${window.innerWidth}×${window.innerHeight} @${window.devicePixelRatio}x`,
        min: 0.2,
      },
      { label: 'OPERATOR CONSOLE', run: () => 'ONLINE', min: 0.2 },
    ],
    [seed, fontLink],
  );

  return (
    <div className="s1">
      {ready && <Console initialSeed={seed} />}
      {booting && <Boot tasks={tasks} onReady={() => setReady(true)} onDone={() => setBooting(false)} />}
    </div>
  );
}

export const mount: Mount = (el) => {
  const fontLink = Object.assign(document.createElement('link'), { rel: 'stylesheet', href: FONT_URL });
  const root = createRoot(el);
  root.render(<App fontLink={fontLink} />);
  return () => {
    root.unmount();
    fontLink.remove();
  };
};
