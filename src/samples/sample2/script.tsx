import { useEffect, useMemo, useRef, type CSSProperties } from 'react';

// The storymonger's script: every character maps to one fixed glyph that hangs from a shared
// bar, so the same word always looks the same and can be recognised without being read.
// Digits are dot counts, so numbers stay countable. Glyph cells are 10 x 16 units, advance 11.

const ADV = 11;
const SPACE = 6;

const rect = (x: number, y: number, w: number, h: number) => `M${x} ${y}h${w}v${h}h${-w}Z`;
const circle = (cx: number, cy: number, r: number, cw = true) =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 ${cw ? 1 : 0} ${2 * r} 0a${r} ${r} 0 1 ${cw ? 1 : 0} ${-2 * r} 0Z`;
const roundRect = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 ${-r} ${r}` +
  `h${-(w - 2 * r)}a${r} ${r} 0 0 1 ${-r} ${-r}v${-(h - 2 * r)}a${r} ${r} 0 0 1 ${r} ${-r}Z`;

const STEM = rect(4.3, 1.4, 1.4, 3.4);

const BODIES = [
  circle(5, 8, 3.6),
  circle(5, 8, 3.6) + circle(5, 8, 1.5, false),
  'M1.2 4.2H8.8L5 11.8Z',
  'M5 4.2L8.8 11.8H1.2Z',
  'M1.4 5.6H8.6A3.6 3.6 0 0 1 1.4 5.6Z',
  'M6.2 4.6A3.6 3.6 0 1 0 6.2 11.4A4.2 4.2 0 0 1 6.2 4.6Z',
  roundRect(1.6, 4.6, 6.8, 6.8, 1.6),
  'M5 4C8.5 8 8.5 11.8 5 11.8C1.5 11.8 1.5 8 5 4Z',
  circle(5, 6, 1.9) + circle(5, 10.2, 1.9),
];

const MARKS = ['', circle(5, 14.2, 1.1), circle(3.3, 14.2, 1) + circle(6.7, 14.2, 1), circle(1.7, 3, 0.9), 'M5 12.8L6.3 15H3.7Z'];

function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function digit(d: number) {
  if (d === 0) return circle(5, 7.2, 2.1) + circle(5, 7.2, 1, false);
  let p = '';
  for (let k = 0; k < d; k++) {
    const x = d === 1 ? 5 : 2.4 + (k % 3) * 2.6;
    p += circle(x, 5.9 + Math.floor(k / 3) * 2.8, 1.05);
  }
  return p;
}

const cache = new Map<string, { d: string; mirror: boolean }>();

function glyph(ch: string) {
  let g = cache.get(ch);
  if (!g) {
    if (/[0-9]/.test(ch)) g = { d: STEM + digit(Number(ch)), mirror: false };
    else {
      const rnd = mulberry(Math.imul(ch.codePointAt(0)!, 2654435761));
      const body = BODIES[Math.floor(rnd() * BODIES.length)];
      const mark = MARKS[Math.floor(rnd() * MARKS.length)];
      g = { d: STEM + body + mark, mirror: rnd() < 0.5 };
    }
    cache.set(ch, g);
  }
  return g;
}

const isGap = (ch: string) => /[\s・、。/:]/.test(ch);

function layout(text: string) {
  const glyphs: { x: number; d: string; mirror: boolean }[] = [];
  const bars: [number, number][] = [];
  let x = 0;
  let start = -1;
  for (const ch of text) {
    if (isGap(ch)) {
      if (start >= 0) bars.push([start, x - 1]);
      start = -1;
      x += SPACE;
      continue;
    }
    if (start < 0) start = x;
    glyphs.push({ x, ...glyph(ch) });
    x += ADV;
  }
  if (start >= 0) bars.push([start, x - 1]);
  return { glyphs, bars, width: Math.max(1, x - 1) };
}

/** Elements the loupe can translate. Positions are refreshed every frame while it is held. */
const registry = new Set<HTMLElement>();

export function updateLoupe(cx: number, cy: number, r: number) {
  for (const el of registry) {
    const box = el.getBoundingClientRect();
    if (box.right < cx - r || box.left > cx + r || box.bottom < cy - r || box.top > cy + r) {
      el.style.removeProperty('--lx');
      continue;
    }
    // The element may sit inside a scaled or slightly tilted stage; map the lens into its own px.
    const k = el.offsetWidth / Math.max(1, box.width);
    el.style.setProperty('--lx', `${(cx - box.left) * k}px`);
    el.style.setProperty('--ly', `${(cy - box.top) * k}px`);
    el.style.setProperty('--lr', `${r * k}px`);
  }
}

export function clearLoupe() {
  for (const el of registry) el.style.removeProperty('--lx');
}

type Props = { text: string; size?: number; className?: string; style?: CSSProperties };

/** Text in the storymonger's script. The real text stays in the DOM under a mask. */
export function Script({ text, size = 20, className = '', style }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const { glyphs, bars, width } = useMemo(() => layout(text), [text]);
  const s = size / 16;

  useEffect(() => {
    const el = ref.current!;
    registry.add(el);
    return () => {
      registry.delete(el);
    };
  }, []);

  return (
    <span
      ref={ref}
      className={`s2-script ${className}`}
      style={{ width: width * s, height: size, ...style }}
    >
      <svg className="s2-glyphs" viewBox={`0 0 ${width} 16`} width={width * s} height={size} aria-hidden="true">
        {bars.map(([a, b]) => (
          <rect key={a} x={a - 0.4} y={0.2} width={b - a + 0.8} height={1.8} rx={0.9} />
        ))}
        {glyphs.map((g, i) => (
          <path key={i} d={g.d} transform={`translate(${g.x})${g.mirror ? ' matrix(-1 0 0 1 10 0)' : ''}`} />
        ))}
      </svg>
      <span className="s2-plain" style={{ fontSize: ADV * s * 0.9 }}>
        {text}
      </span>
    </span>
  );
}
