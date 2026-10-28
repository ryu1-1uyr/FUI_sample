import { useEffect, useRef, useState } from 'react';

export const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Seconds since the module loaded; shared by every panel. */
const T0 = performance.now() / 1000;
export const now = () => performance.now() / 1000 - T0;

export const pad = (v: number, n: number) => String(v).padStart(n, '0');
export const hex = (v: number) => v.toString(16).toUpperCase().padStart(6, '0');
export const clock = (s: number) => `${pad(Math.floor(s / 60), 2)}:${(s % 60).toFixed(1).padStart(4, '0')}`;
export const wobble = (t: number, seed: number, amount: number) =>
  (Math.sin(t * 2.3 + seed) * 0.6 + Math.sin(t * 5.7 + seed * 1.7) * 0.4) * amount;

export function useFrame(fn: () => void) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      ref.current();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
}

export function useTicker(hz: number) {
  const [t, setT] = useState(now);
  useEffect(() => {
    const id = setInterval(() => setT(now()), 1000 / hz);
    return () => clearInterval(id);
  }, [hz]);
  return t;
}
