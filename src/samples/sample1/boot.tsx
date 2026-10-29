import { useEffect, useRef, useState } from 'react';
import { drawCube, qAxis, qMul, X, Y } from './cube';
import { fitCanvas } from './render';
import { now, reduced, useFrame } from './util';

export type BootTask = {
  label: string;
  /** Real work behind the line; resolves to the status text shown after the leader. */
  run: () => Promise<string> | string;
  /** Minimum time on screen, so fast steps still read as a sequence. */
  min: number;
};

const SEGMENTS = 32;
const READY_HOLD = 0.5;
const EXIT = 0.55;

/**
 * OS-style boot screen. It covers real setup (font load, precomputation, first sample),
 * then folds away like a CRT switching off. Any key or click fast-forwards the cosmetic waits.
 */
export function Boot(props: { tasks: BootTask[]; onReady: () => void; onDone: () => void }) {
  const [lines, setLines] = useState<{ label: string; result?: string }[]>([]);
  const [phase, setPhase] = useState<'run' | 'ready' | 'exit'>('run');
  const skip = useRef(reduced);
  const cb = useRef(props);
  cb.current = props;
  const cubeRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    const wait = (s: number) =>
      new Promise<void>((resolve) => {
        const end = now() + s;
        const tick = () => (skip.current || now() >= end ? resolve() : requestAnimationFrame(tick));
        tick();
      });

    (async () => {
      await wait(0.45);
      for (const [i, task] of cb.current.tasks.entries()) {
        if (cancelled) return;
        setLines((l) => [...l, { label: task.label }]);
        const [result] = await Promise.all([Promise.resolve(task.run()), wait(task.min)]);
        if (cancelled) return;
        setLines((l) => l.map((x, j) => (j === i ? { ...x, result } : x)));
      }
      setPhase('ready');
      await wait(READY_HOLD);
      if (cancelled) return;
      cb.current.onReady();
      setPhase('exit');
      await new Promise((r) => setTimeout(r, reduced ? 0 : EXIT * 1000));
      if (!cancelled) cb.current.onDone();
    })();

    const fastForward = () => {
      skip.current = true;
    };
    window.addEventListener('keydown', fastForward);
    window.addEventListener('pointerdown', fastForward);
    return () => {
      cancelled = true;
      window.removeEventListener('keydown', fastForward);
      window.removeEventListener('pointerdown', fastForward);
    };
  }, []);

  useFrame(() => {
    const canvas = cubeRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const dpr = fitCanvas(canvas);
    const t = now();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const q = qMul(qAxis(X, 0.5 + Math.sin(t * 0.8) * 0.2), qAxis(Y, t * 1.4));
    drawCube(ctx, q, canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) * 0.28, dpr);
  });

  const done = lines.filter((l) => l.result).length;
  const total = props.tasks.length;
  const lit = Math.round((done / total) * SEGMENTS);

  return (
    <div className={`boot ${phase}`}>
      <div className="boot-inner">
        <canvas ref={cubeRef} className="boot-cube" />
        <h1>SAC-7</h1>
        <p className="boot-sub">SIGNATURE ANALYSIS CONSOLE</p>
        <ol className="boot-log">
          {lines.map((l) => (
            <li key={l.label}>
              <span>{l.label}</span>
              <i />
              <b className={l.result?.includes('FALLBACK') ? 'fallback' : ''}>{l.result ?? <em>···</em>}</b>
            </li>
          ))}
        </ol>
        <div className="boot-bar" aria-hidden>
          {Array.from({ length: SEGMENTS }, (_, i) => (
            <i key={i} className={i < lit ? 'on' : ''} />
          ))}
        </div>
        <p className="boot-status">
          {phase === 'run' ? `LOADING ${String(Math.round((done / total) * 100)).padStart(3, '0')}%` : 'SYSTEM READY'}
        </p>
        <p className="boot-hint">PRESS ANY KEY TO SKIP</p>
      </div>
    </div>
  );
}
