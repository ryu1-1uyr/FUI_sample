import type { Mount } from '../../types';

export const mount: Mount = (el) => {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'display:block;width:100%;height:100%';
  el.append(canvas);
  const ctx = canvas.getContext('2d')!;

  const resize = () => {
    const dpr = window.devicePixelRatio;
    canvas.width = el.clientWidth * dpr;
    canvas.height = el.clientHeight * dpr;
  };
  const ro = new ResizeObserver(resize);
  ro.observe(el);
  resize();

  let raf = 0;
  const frame = (t: number) => {
    const { width: w, height: h } = canvas;
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = '#4fe3f0';
    ctx.lineWidth = 2 * window.devicePixelRatio;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, Math.min(w, h) * 0.3, t / 1000, t / 1000 + Math.PI * 1.5);
    ctx.stroke();
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
  };
};
