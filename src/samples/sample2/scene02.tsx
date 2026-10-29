import type { CSSProperties } from 'react';
import { Flat, Hanger, type Surfaces } from './stage';
import { D, H, W } from './scenes';
import { Sign, Star, Tuft } from './props';

// 02 // Night gathering. Story seeds drift over a meadow at night; a net is planted where they
// were being caught, and the filled jars wait on a cart. The lantern and stars on the ceiling
// lead up to the attic.

const FLOOR = H / 2;
const BACK = W / 2 - D;
const NIGHT_TUFT: [string, string, string] = ['#1d2a4c', '#24345a', '#192443'];

/** A row of pine silhouettes along the bottom of a w x h strip. */
const pines = (w: number, h: number, seed: number, step = 46) => {
  let d = `M0 ${h}`;
  for (let x = 0, i = 0; x <= w; x += step, i++) {
    const top = h * (0.25 + ((i * 37 + seed * 17) % 40) / 100);
    d += `L${x} ${h * 0.82}L${x + step / 2} ${top}L${x + step} ${h * 0.82}`;
  }
  return `${d}L${w} ${h}Z`;
};

const sky = (w: number) => (
  <>
    <rect width={w} height="520" fill="#141a3a" />
    <rect y="210" width={w} height="310" fill="#192150" />
    <rect y="330" width={w} height="190" fill="#1f285a" />
  </>
);

export const nightSurfaces: Surfaces = {
  ceiling: '#121834',
  back: (
    <svg viewBox="0 0 800 520" width="100%" height="100%" className="s2-tex">
      {sky(800)}
      <circle cx="610" cy="150" r="46" fill="#fff0b8" />
      <circle cx="590" cy="140" r="8" fill="#f2dfa0" />
      <g fill="#e9e2c0">
        <circle cx="120" cy="90" r="2.5" />
        <circle cx="260" cy="150" r="2" />
        <circle cx="380" cy="70" r="3" />
        <circle cx="470" cy="190" r="2" />
        <circle cx="720" cy="260" r="2.5" />
        <circle cx="200" cy="250" r="2" />
      </g>
      <path d={pines(800, 160, 1)} transform="translate(0 360)" fill="#121a38" />
    </svg>
  ),
  side: (
    <svg viewBox={`0 0 ${D} 520`} width="100%" height="100%" className="s2-tex">
      {sky(D)}
      <g fill="#e9e2c0">
        <circle cx="160" cy="110" r="2" />
        <circle cx="420" cy="80" r="2.5" />
        <circle cx="300" cy="220" r="2" />
      </g>
      <path d={pines(D, 160, 4)} transform="translate(0 360)" fill="#121a38" />
    </svg>
  ),
  floor: (
    <svg viewBox={`0 0 800 ${D}`} width="100%" height="100%" className="s2-tex">
      <rect width="800" height={D} fill="#1f2c4e" />
      <g fill="#26355a">
        <ellipse cx="250" cy="420" rx="120" ry="40" />
        <ellipse cx="560" cy="300" rx="150" ry="46" />
        <ellipse cx="420" cy="560" rx="180" ry="38" />
      </g>
    </svg>
  ),
};

/** Seeds: x, y, z, size, bob period. Each bobs on its own phase. */
const SEEDS = [
  [-300, -40, -120, 10, 4.2],
  [-150, -120, -40, 8, 3.6],
  [40, -170, 20, 12, 5.0],
  [210, -90, -90, 9, 3.9],
  [330, 0, 60, 11, 4.6],
  [-60, -40, 120, 14, 4.4],
  [150, -10, 150, 10, 3.4],
  [-240, 60, 200, 12, 4.9],
  [270, -150, 240, 16, 5.4],
  [-120, -190, 300, 12, 4.1],
  [100, -230, 340, 18, 5.8],
  [-330, -120, 360, 14, 4.7],
];

/** The net, planted in the ground where the storymonger left it. */
function Net() {
  return (
    <svg viewBox="0 0 170 220" width={170} height={220}>
      <path d="M36 220H46L126 76L118 72Z" fill="#8a6a4a" />
      <circle cx={128} cy={52} r={26} fill="#8a6a4a" />
      <circle cx={128} cy={52} r={21} fill="#e9eef7" opacity={0.28} />
      <circle cx={132} cy={58} r={6} fill="#ffe9a0" />
    </svg>
  );
}

function Cart() {
  const jars = [26, 66, 106, 146];
  return (
    <svg viewBox="0 0 190 130" width={190} height={130}>
      <rect x={8} y={60} width={174} height={44} rx={6} fill="#6b4a3a" />
      <rect x={8} y={60} width={174} height={10} fill="#5a3d30" />
      {jars.map((x, i) => (
        <g key={x}>
          <rect x={x - 15} y={16 + (i % 2) * 6} width={30} height={44 - (i % 2) * 6} rx={7} fill="#c9d8f0" opacity={0.55} />
          <rect x={x - 9} y={10 + (i % 2) * 6} width={18} height={8} rx={2} fill="#8a6a4a" />
          <circle cx={x} cy={42 + (i % 2) * 3} r={7 + (i % 3)} fill="#ffe39a" />
        </g>
      ))}
      <circle cx={46} cy={108} r={20} fill="#3a2a24" />
      <circle cx={46} cy={108} r={7} fill="#8a6a4a" />
      <circle cx={146} cy={108} r={20} fill="#3a2a24" />
      <circle cx={146} cy={108} r={7} fill="#8a6a4a" />
    </svg>
  );
}

export function NightField({ go, toAttic }: { go: (dir: -1 | 1) => void; toAttic: () => void }) {
  return (
    <>
      <Flat x={0} y={FLOOR - 150} z={BACK + 50} w={W} h={150}>
        <svg viewBox="0 0 800 150" width={800} height={150}>
          <path d={pines(800, 150, 7, 54)} fill="#16204a" />
        </svg>
      </Flat>
      <Flat x={0} y={FLOOR - 90} z={-60} w={W} h={90}>
        <svg viewBox="0 0 800 90" width={800} height={90}>
          <path d="M0 90V50Q180 10 380 40T800 30V90Z" fill="#22305a" />
        </svg>
      </Flat>
      <Flat x={-290} y={FLOOR - 230} z={40} w={110} h={230} grounded>
        <svg viewBox="0 0 110 230" width={110} height={230}>
          <rect x={49} y={190} width={12} height={40} fill="#2a2440" />
          <path d="M55 0L104 120H78L110 200H0L32 120H6Z" fill="#1c2b52" />
        </svg>
      </Flat>
      <Flat x={300} y={FLOOR - 190} z={90} w={92} h={190} grounded>
        <svg viewBox="0 0 92 190" width={92} height={190}>
          <rect x={40} y={156} width={12} height={34} fill="#2a2440" />
          <path d="M46 0L86 100H64L92 166H0L28 100H6Z" fill="#203159" />
        </svg>
      </Flat>

      <Flat x={110} y={FLOOR - 220} z={170} w={170} h={220} grounded>
        <Net />
      </Flat>
      <Flat x={-140} y={FLOOR - 130} z={120} w={190} h={130} grounded>
        <Cart />
      </Flat>

      {SEEDS.map(([x, y, z, size, period], i) => (
        <Flat
          key={i}
          x={x}
          y={y}
          z={z}
          w={size * 2}
          h={size * 2}
          className="s2-seed"
          style={{ '--period': `${period}s`, '--phase': `${-i * 0.7}s` } as CSSProperties}
        >
          <svg viewBox="0 0 20 20" width={size * 2} height={size * 2}>
            <circle cx={10} cy={10} r={6} fill="#ffe9a0" />
            <circle cx={10} cy={10} r={9.5} fill="#ffe9a0" opacity={0.25} />
          </svg>
        </Flat>
      ))}

      <Sign x={-240} z={330} dir={-1} theta={0} onClick={() => go(-1)} />
      <Sign x={240} z={330} dir={1} theta={180} onClick={() => go(1)} />

      <Flat x={-352} y={FLOOR - 96} z={396} w={84} h={96}>
        <Tuft w={84} h={96} tone={NIGHT_TUFT} />
      </Flat>
      <Flat x={340} y={FLOOR - 80} z={394} w={76} h={80}>
        <Tuft w={76} h={80} tone={NIGHT_TUFT} />
      </Flat>

      <Hanger x={-110} z={320} chain={56} size={44} period={4.4} phase={0.4} onClick={toAttic} label="天井裏の空へ">
        <rect x={12} y={0} width={20} height={8} rx={2} fill="#6b4a3a" />
        <rect x={6} y={8} width={32} height={42} rx={9} fill="#f2c46b" />
        <rect x={13} y={15} width={18} height={28} rx={6} fill="#fff0b8" />
        <rect x={10} y={50} width={24} height={6} rx={2} fill="#6b4a3a" />
      </Hanger>
      <Hanger x={180} z={200} chain={110} size={32} period={3.8} phase={1.6} onClick={toAttic} label="天井裏の空へ">
        <Star size={32} fill="#ffe27a" />
      </Hanger>
      <Hanger x={20} z={40} chain={170} size={26} period={3.3} phase={2.4} onClick={toAttic} label="天井裏の空へ">
        <Star size={26} fill="#ffe9a0" />
      </Hanger>
    </>
  );
}
