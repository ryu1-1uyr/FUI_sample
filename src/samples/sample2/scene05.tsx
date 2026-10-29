import type { CSSProperties } from 'react';
import { ATTIC_D, Flat, type Surfaces } from './stage';
import { W } from './scenes';
import { Star } from './props';

// 05 // The sky in the attic, seen down through the lid. Requests from readers arrive here as
// paper kites; a paper boat drifts between the clouds, its rod left fishing for stars.
// Frame: y runs from the back of the box (-W/2, top of the screen) to the front; z rises
// from the far sky (W/2 - ATTIC_D) up to the lid (W/2).

const LID_Z = W / 2;
const FAR = LID_Z - ATTIC_D;

const sky = (w: number, h: number) => (
  <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="100%" className="s2-tex">
    <rect width={w} height={h} fill="#10163a" />
    <g fill="#e9e2c0">
      {Array.from({ length: 26 }, (_, i) => (
        <circle key={i} cx={(i * 211) % w} cy={(i * 137 + 40) % h} r={1.2 + (i % 3) * 0.6} />
      ))}
    </g>
  </svg>
);

export const atticSurfaces: Surfaces = {
  ceiling: '#141a3a',
  back: sky(W, W),
  side: sky(ATTIC_D, W),
  floor: sky(W, ATTIC_D),
};

function Cloud({ w, h, tone }: { w: number; h: number; tone: string }) {
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h}>
      <circle cx={w * 0.3} cy={h * 0.55} r={h * 0.32} fill={tone} />
      <circle cx={w * 0.52} cy={h * 0.42} r={h * 0.42} fill={tone} />
      <circle cx={w * 0.74} cy={h * 0.58} r={h * 0.3} fill={tone} />
      <rect x={w * 0.12} y={h * 0.55} width={w * 0.76} height={h * 0.32} rx={h * 0.16} fill={tone} />
    </svg>
  );
}

const STARS = [
  [-300, -300, FAR + 30, 30],
  [-120, -330, FAR + 80, 22],
  [200, -320, FAR + 50, 26],
  [320, -60, FAR + 120, 34],
  [-330, 120, FAR + 150, 28],
  [60, 260, FAR + 100, 24],
  [300, 300, FAR + 200, 40],
  [-200, -150, FAR + 240, 36],
];

export function AtticSky({ down }: { down: () => void }) {
  return (
    <>
      <Flat x={170} y={-280} z={FAR + 40} w={200} h={200}>
        <svg viewBox="0 0 200 200" width={200} height={200}>
          <path d="M130 10A90 90 0 1 0 130 190A100 100 0 0 1 130 10Z" fill="#ffe08a" />
        </svg>
      </Flat>
      {STARS.map(([x, y, z, size], i) => (
        <Flat
          key={i}
          x={x}
          y={y}
          z={z}
          w={size}
          h={size}
          className="s2-seed"
          style={{ '--period': `${3.5 + (i % 4) * 0.6}s`, '--phase': `${-i * 0.9}s` } as CSSProperties}
        >
          <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
            <Star size={size} fill="#ffe9a0" />
          </svg>
        </Flat>
      ))}

      <Flat x={-150} y={-20} z={FAR + 130} w={320} h={130}>
        <Cloud w={320} h={130} tone="#2c3770" />
      </Flat>
      <Flat x={-30} y={-100} z={FAR + 200} w={120} h={190}>
        <svg viewBox="0 0 120 190" width={120} height={190}>
          <path d="M20 190H28L96 8L90 4Z" fill="#8a6a4a" />
          <rect x={92} y={6} width={2} height={96} fill="#e9e2c0" />
          <g transform="translate(78 98)">
            <Star size={30} fill="#ffd34f" />
          </g>
        </svg>
      </Flat>
      <Flat x={-30} y={70} z={FAR + 202} w={220} h={70}>
        <svg viewBox="0 0 220 70" width={220} height={70}>
          <path d="M0 10H220Q200 70 110 70Q20 70 0 10Z" fill="#f2d39c" />
          <path d="M0 10H220L212 24H8Z" fill="#d9b373" />
        </svg>
      </Flat>
      <Flat x={220} y={140} z={FAR + 260} w={340} h={140}>
        <Cloud w={340} h={140} tone="#36428a" />
      </Flat>
      <Flat x={-250} y={-300} z={FAR + 290} w={260} h={110}>
        <Cloud w={260} h={110} tone="#3c4996" />
      </Flat>

      {[
        [240, -170, FAR + 230, '#fbf4e6'],
        [-280, 230, FAR + 300, '#f2d39c'],
      ].map(([x, y, z, tone]) => (
        <Flat key={String(x)} x={x as number} y={y as number} z={z as number} w={70} h={120}>
          <svg viewBox="0 0 70 120" width={70} height={120}>
            <path d="M35 0L70 30L35 60L0 30Z" fill={tone as string} />
            <path d="M35 0L70 30H0Z" fill="#e9d6b0" opacity={0.6} />
            <path d="M34 60Q24 80 36 92T34 120H37Q48 104 38 92T37 60Z" fill="#e9e2c0" />
          </svg>
        </Flat>
      ))}

      <Flat x={0} y={300} z={LID_Z - 30} w={120} h={110} onClick={down} label="舞台へ戻る" className="s2-sign">
        <svg viewBox="0 0 120 110" width={120} height={110}>
          <polygon points="60,108 8,54 34,54 34,4 86,4 86,54 112,54" fill="#c9a86a" transform="translate(0 4)" />
          <polygon points="60,108 8,54 34,54 34,4 86,4 86,54 112,54" fill="#f2d39c" />
        </svg>
      </Flat>
    </>
  );
}
