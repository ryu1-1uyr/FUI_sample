import { Flat, Hanger, type Surfaces } from './stage';
import { D, H, W } from './scenes';
import { Script } from './script';
import { Sign } from './props';

// 01 // Storefront, daytime. The shop sits deep in its room; the hanging mobile leads up to
// the attic, the standing signs lead to the neighbouring sides, the door leads inside.

const FLOOR = H / 2;
const BACK = W / 2 - D;

/** The path from the door to the window, as x bounds at depth z. Grass leaves it clear. */
const DOOR_Z = 21;
const pathAt = (z: number): [number, number] => {
  const t = (z - DOOR_Z) / (W / 2 - DOOR_Z);
  return [-55 - 55 * t, -5 + 75 * t];
};
/** Floor art is drawn W x D with the back edge at the top. */
const floorY = (z: number) => z - BACK;

export const storefrontSurfaces: Surfaces = {
  ceiling: '#c9a073',
  back: (
    <svg viewBox="0 0 800 520" width="100%" height="100%" className="s2-tex">
      <rect width="800" height="520" fill="#a9d9e7" />
      <rect width="800" height="170" fill="#9bd1e2" />
      <g fill="#fbf5e9">
        <circle cx="180" cy="150" r="26" />
        <circle cx="212" cy="138" r="34" />
        <circle cx="248" cy="152" r="24" />
        <rect x="160" y="150" width="108" height="26" rx="13" />
        <circle cx="590" cy="110" r="18" />
        <circle cx="614" cy="100" r="24" />
        <circle cx="640" cy="112" r="16" />
        <rect x="574" y="110" width="80" height="18" rx="9" />
      </g>
      <path d="M0 520V400Q200 330 400 380T800 360V520Z" fill="#b2d79c" />
      <path d="M0 520V440Q260 390 520 430T800 420V520Z" fill="#9fcd8c" />
    </svg>
  ),
  side: (
    <svg viewBox={`0 0 ${D} 520`} width="100%" height="100%" className="s2-tex">
      <rect width={D} height="520" fill="#a9d9e7" />
      <rect width={D} height="170" fill="#9bd1e2" />
      <path d={`M0 520V420Q220 370 420 404T${D} 400V520Z`} fill="#b2d79c" />
      <path d={`M0 520V462Q240 420 440 446T${D} 440V520Z`} fill="#9fcd8c" />
    </svg>
  ),
  floor: (
    <svg viewBox={`0 0 800 ${D}`} width="100%" height="100%" className="s2-tex">
      <rect width="800" height={D} fill="#8cc46f" />
      <path
        d={`M${400 + pathAt(DOOR_Z)[0]} ${floorY(DOOR_Z)}H${400 + pathAt(DOOR_Z)[1]}L${400 + pathAt(W / 2)[1]} ${D}H${400 + pathAt(W / 2)[0]}Z`}
        fill="#ead2a0"
      />
      <g fill="#7ab45f">
        <circle cx="210" cy="520" r="16" />
        <circle cx="580" cy="470" r="20" />
        <circle cx="640" cy="580" r="12" />
        <circle cx="160" cy="400" r="10" />
        <circle cx="620" cy="260" r="14" />
      </g>
    </svg>
  ),
};

const star = (cx: number, cy: number, R: number, r: number) =>
  Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const k = i % 2 ? r : R;
    return `${(cx + Math.cos(a) * k).toFixed(2)},${(cy + Math.sin(a) * k).toFixed(2)}`;
  }).join(' ');

function Star({ size, fill = '#ffd34f' }: { size: number; fill?: string }) {
  const R = size / 2 - 1;
  return <polygon points={star(size / 2, R + 1, R, R * 0.48)} fill={fill} />;
}

function Tree({ w, h, tone }: { w: number; h: number; tone: [string, string, string] }) {
  const c = w / 2;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h}>
      <rect x={c - w * 0.07} y={h * 0.65} width={w * 0.14} height={h * 0.35} fill="#9c6a48" />
      <circle cx={c} cy={h * 0.42} r={w * 0.4} fill={tone[0]} />
      <circle cx={c - w * 0.23} cy={h * 0.52} r={w * 0.25} fill={tone[1]} />
      <circle cx={c + w * 0.22} cy={h * 0.54} r={w * 0.26} fill={tone[2]} />
    </svg>
  );
}

function Bush({ w, h }: { w: number; h: number }) {
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h}>
      <circle cx={w * 0.28} cy={h - 20} r={20} fill="#5aa56b" />
      <circle cx={w * 0.52} cy={h - 26} r={26} fill="#66b276" />
      <circle cx={w * 0.76} cy={h - 18} r={18} fill="#58a068" />
      <rect x={w * 0.12} y={h - 18} width={w * 0.76} height={18} fill="#5aa56b" />
      <circle cx={w * 0.36} cy={h - 30} r={4} fill="#f6a7a0" />
      <circle cx={w * 0.6} cy={h - 40} r={4} fill="#fff1c2" />
      <circle cx={w * 0.72} cy={h - 22} r={4} fill="#f6a7a0" />
    </svg>
  );
}

/** A band of grass blades across the room at depth z, leaving the path clear. */
function Grass({ z, h, tone, seed }: { z: number; h: number; tone: [string, string]; seed: number }) {
  const w = W - 20;
  const [lo, hi] = pathAt(z);
  const blades = [];
  for (let i = 0; i < w / 30; i++) {
    const x = 10 + i * 30 + ((i * 37 + seed * 13) % 11);
    const cx = x - w / 2;
    if (cx > lo - 14 && cx < hi + 14) continue;
    const t = h * (0.5 + ((i * 53 + seed * 29) % 50) / 100);
    blades.push(<polygon key={i} points={`${x - 9},${h} ${x},${h - t} ${x + 9},${h}`} fill={tone[i % 3 ? 0 : 1]} />);
  }
  return (
    <Flat x={0} y={FLOOR - h} z={z} w={w} h={h}>
      <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h}>
        {blades}
      </svg>
    </Flat>
  );
}

/** Tall foreground clump that overlaps the frame, so the stage reads as seen past something. */
function Tuft({ w, h }: { w: number; h: number }) {
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h}>
      <path d={`M${w * 0.1} ${h}Q${w * 0.05} ${h * 0.4} ${w * 0.3} 0Q${w * 0.3} ${h * 0.5} ${w * 0.45} ${h}Z`} fill="#4f9a4c" />
      <path d={`M${w * 0.3} ${h}Q${w * 0.5} ${h * 0.2} ${w * 0.9} ${h * 0.1}Q${w * 0.65} ${h * 0.5} ${w * 0.7} ${h}Z`} fill="#5ea85a" />
      <path d={`M${w * 0.55} ${h}Q${w * 0.75} ${h * 0.55} ${w} ${h * 0.45}Q${w * 0.85} ${h * 0.75} ${w * 0.9} ${h}Z`} fill="#468d44" />
    </svg>
  );
}

export function Storefront({ go, toAttic, toBack }: { go: (dir: -1 | 1) => void; toAttic: () => void; toBack: () => void }) {
  return (
    <>
      <Flat x={0} y={FLOOR - 110} z={BACK + 60} w={W} h={110}>
        <svg viewBox="0 0 800 110" width={800} height={110}>
          <path d="M0 110V60Q160 0 330 46T620 30Q720 20 800 50V110Z" fill="#94c780" />
        </svg>
      </Flat>
      <Flat x={-290} y={FLOOR - 150} z={-120} w={90} h={150} grounded>
        <Tree w={90} h={150} tone={['#6fb27a', '#63a86f', '#7abb83']} />
      </Flat>
      <Flat x={300} y={FLOOR - 130} z={-80} w={80} h={130} grounded>
        <Tree w={80} h={130} tone={['#74b67b', '#68ac70', '#80c088']} />
      </Flat>

      <Flat x={0} y={FLOOR - 290} z={20} w={230} h={290} grounded>
        <svg viewBox="0 0 230 290" width={230} height={290}>
          <rect x={146} y={30} width={40} height={12} fill="#9e523e" />
          <rect x={152} y={40} width={28} height={70} fill="#b8644c" />
          <polygon points="0,128 115,22 230,128" fill="#e2855c" />
          <polygon points="115,22 230,128 115,128" fill="#cf7450" />
          <rect x={16} y={124} width={198} height={166} fill="#f5e6c6" />
          <rect x={16} y={276} width={198} height={14} fill="#e6d1a8" />
          <path d="M56 290V222A29 29 0 0 1 114 222V290Z" fill="#3b3552" />
          <circle cx={168} cy={206} r={24} fill="#7a5b44" />
          <circle cx={168} cy={206} r={19} fill="#ffd66b" />
          <rect x={166} y={187} width={4} height={38} fill="#7a5b44" />
          <rect x={149} y={204} width={38} height={4} fill="#7a5b44" />
          <circle cx={115} cy={86} r={13} fill="#7a5b44" />
          <circle cx={115} cy={86} r={9} fill="#ffe39a" />
        </svg>
      </Flat>
      <Flat x={-30} y={FLOOR - 96} z={DOOR_Z} w={58} h={96} onClick={toBack} label="仕立て場へ">
        <svg viewBox="0 0 58 96" width={58} height={96}>
          <path d="M0 96V29A29 29 0 0 1 58 29V96Z" fill="#5f84c4" />
          <path d="M9 88V32A20 20 0 0 1 49 32V88Z" fill="#7398d4" />
          <circle cx={46} cy={60} r={4} fill="#ffd66b" />
        </svg>
      </Flat>
      <Flat x={10} y={FLOOR - 290 + 132} z={22} w={96} h={34}>
        <div className="s2-plank">
          <Script text="物語屋" size={22} />
        </div>
      </Flat>

      <Grass z={70} h={16} tone={['#97cd7c', '#8cc572']} seed={1} />
      <Flat x={-200} y={FLOOR - 210} z={130} w={120} h={210} grounded>
        <Tree w={120} h={210} tone={['#5ea96a', '#529c5f', '#6bb575']} />
      </Flat>
      <Flat x={205} y={FLOOR - 180} z={150} w={100} h={180} grounded>
        <Tree w={100} h={180} tone={['#68b071', '#5aa265', '#74bb7c']} />
      </Flat>
      <Grass z={200} h={20} tone={['#82bf69', '#77b660']} seed={2} />
      <Flat x={-250} y={FLOOR - 56} z={260} w={130} h={56} grounded>
        <Bush w={130} h={56} />
      </Flat>
      <Flat x={262} y={FLOOR - 50} z={270} w={120} h={50} grounded>
        <Bush w={120} h={50} />
      </Flat>

      <Sign x={-240} z={330} dir={-1} theta={270} onClick={() => go(-1)} />
      <Sign x={240} z={330} dir={1} theta={90} onClick={() => go(1)} />

      <Grass z={386} h={30} tone={['#6fb35d', '#5fa451']} seed={3} />
      <Flat x={-352} y={FLOOR - 96} z={396} w={84} h={96}>
        <Tuft w={84} h={96} />
      </Flat>
      <Flat x={350} y={FLOOR - 74} z={394} w={70} h={74}>
        <Tuft w={70} h={74} />
      </Flat>

      <Hanger x={-70} z={-40} chain={190} size={34} period={3.6} phase={2.2} onClick={toAttic} label="天井裏の空へ">
        <Star size={34} fill="#ffe27a" />
      </Hanger>
      <Hanger x={130} z={90} chain={120} size={84} period={5.2} phase={0} onClick={toAttic} label="天井裏の空へ">
        <path d="M54 4A36 36 0 1 0 54 72A40 40 0 0 1 54 4Z" fill="#ffe08a" transform="translate(0 -4)" />
        <circle cx={26} cy={34} r={3} fill="#e0b45a" />
      </Hanger>
      <Hanger x={40} z={230} chain={92} size={30} period={3.2} phase={0.7} onClick={toAttic} label="天井裏の空へ">
        <Star size={30} fill="#ffe9a0" />
      </Hanger>
      <Hanger x={-160} z={350} chain={44} size={58} period={4.1} phase={1.3} onClick={toAttic} label="天井裏の空へ">
        <Star size={58} />
      </Hanger>
      <Hanger x={250} z={380} chain={30} size={46} period={4.6} phase={3.1} onClick={toAttic} label="天井裏の空へ">
        <Star size={46} />
      </Hanger>
    </>
  );
}
