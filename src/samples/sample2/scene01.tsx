import { Flat, Hanger, tempo, type Surfaces } from './stage';
import { D, H, W } from './scenes';
import { Script } from './script';
import { Sign, Tuft } from './props';

// 01 // Storefront, daytime. The shop sits deep in its room; the hanging sun and clouds lead up
// to the attic, the standing signs lead to the neighbouring sides, the door leads inside.

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

/**
 * Far clouds are drawn simpler than the hanging ones: one flat-bottomed silhouette with one or
 * two soft humps, in a single pale tone, so distance reads as less detail.
 */
const FAR_CLOUD = '#e6f3f6';
const farCloud = (x: number, y: number, w: number, h: number, humps: 1 | 2) => {
  const p = (fx: number, fy: number) => `${(x + fx * w).toFixed(1)} ${(y + fy * h).toFixed(1)}`;
  return humps === 1
    ? `M${p(0.06, 1)}Q${p(0, 0.62)} ${p(0.2, 0.6)}Q${p(0.45, 0)} ${p(0.72, 0.5)}Q${p(0.98, 0.5)} ${p(0.94, 1)}Z`
    : `M${p(0.06, 1)}Q${p(0, 0.6)} ${p(0.18, 0.6)}Q${p(0.27, 0.1)} ${p(0.44, 0.4)}Q${p(0.58, 0)} ${p(0.74, 0.44)}Q${p(0.97, 0.42)} ${p(0.94, 1)}Z`;
};

export const storefrontSurfaces: Surfaces = {
  ceiling: '#c9a073',
  back: (
    <svg viewBox="0 0 800 520" width="100%" height="100%" className="s2-tex">
      <rect width="800" height="520" fill="#a9d9e7" />
      <rect width="800" height="170" fill="#9bd1e2" />
      <path d={farCloud(150, 120, 130, 44, 2)} fill={FAR_CLOUD} />
      <path d={farCloud(560, 88, 96, 32, 1)} fill={FAR_CLOUD} />
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

/** A hanging paper cloud; its top bump meets the chain. */
function Cloud({ size: s }: { size: number }) {
  return (
    <>
      <circle cx={s * 0.5} cy={s * 0.28} r={s * 0.26} fill="#fbf5e9" />
      <circle cx={s * 0.26} cy={s * 0.44} r={s * 0.18} fill="#fbf5e9" />
      <circle cx={s * 0.74} cy={s * 0.42} r={s * 0.2} fill="#fbf5e9" />
      <rect x={s * 0.08} y={s * 0.4} width={s * 0.84} height={s * 0.2} rx={s * 0.1} fill="#fbf5e9" />
      <rect x={s * 0.14} y={s * 0.52} width={s * 0.72} height={s * 0.08} rx={s * 0.04} fill="#e6dfd2" />
    </>
  );
}

/** A hanging paper sun with cut rays; the top ray meets the chain. */
function Sun({ size: s }: { size: number }) {
  const c = s / 2;
  const r = s * 0.27;
  const rays = Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const tip = s * 0.46;
    const side = (Math.PI / 5) * 0.35;
    const p = (ang: number, k: number) => `${(c + Math.cos(ang) * k).toFixed(1)},${(c + Math.sin(ang) * k).toFixed(1)}`;
    return <polygon key={i} points={`${p(a - side, r)} ${p(a, tip)} ${p(a + side, r)}`} fill="#ffb84a" />;
  });
  return (
    <g transform={`translate(0 ${-s * 0.04})`}>
      {rays}
      <circle cx={c} cy={c} r={r} fill="#ffcf5a" />
      <circle cx={c - r * 0.35} cy={c - r * 0.3} r={r * 0.22} fill="#ffe08a" />
    </g>
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
      <Flat x={-290} y={FLOOR - 150} z={-120} w={90} h={150} grounded className="s2-sway" style={tempo(7, 1, '0.8deg')}>
        <Tree w={90} h={150} tone={['#6fb27a', '#63a86f', '#7abb83']} />
      </Flat>
      <Flat x={300} y={FLOOR - 130} z={-80} w={80} h={130} grounded className="s2-sway" style={tempo(6.2, 3, '0.8deg')}>
        <Tree w={80} h={130} tone={['#74b67b', '#68ac70', '#80c088']} />
      </Flat>

      {/* Smoke from the chimney: someone is at work inside. */}
      {[0, 1.6, 3.2].map((phase) => (
        <Flat key={phase} x={51} y={FLOOR - 290 - 24} z={20.5} w={26} h={26} className="s2-smoke" style={tempo(4.8, phase, '0px')}>
          <svg viewBox="0 0 26 26" width={26} height={26}>
            <circle cx={13} cy={13} r={12} fill="#f4efe6" />
          </svg>
        </Flat>
      ))}
      {[
        [-210, -170, BACK + 40, 150, 22, 0],
        [230, -200, BACK + 90, 120, 16, 7],
      ].map(([x, y, z, w, period, phase]) => (
        <Flat key={x} x={x} y={y} z={z} w={w} h={w * 0.3} className="s2-drift" style={tempo(period, phase, '26px')}>
          <svg viewBox={`0 0 ${w} ${w * 0.3}`} width={w} height={w * 0.3}>
            <path d={farCloud(0, 0, w, w * 0.3, x < 0 ? 2 : 1)} fill={FAR_CLOUD} />
          </svg>
        </Flat>
      ))}
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
      <Flat x={-200} y={FLOOR - 210} z={130} w={120} h={210} grounded className="s2-sway" style={tempo(6.6, 0, '1.1deg')}>
        <Tree w={120} h={210} tone={['#5ea96a', '#529c5f', '#6bb575']} />
      </Flat>
      <Flat x={205} y={FLOOR - 180} z={150} w={100} h={180} grounded className="s2-sway" style={tempo(5.8, 2.2, '1.1deg')}>
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

      <Hanger x={-70} z={-40} chain={180} size={52} period={4.2} phase={2.2} onClick={toAttic} label="天井裏の空へ">
        <Cloud size={52} />
      </Hanger>
      <Hanger x={130} z={90} chain={112} size={84} period={5.2} phase={0} onClick={toAttic} label="天井裏の空へ">
        <Sun size={84} />
      </Hanger>
      <Hanger x={30} z={230} chain={92} size={44} period={3.6} phase={0.7} onClick={toAttic} label="天井裏の空へ">
        <Cloud size={44} />
      </Hanger>
      <Hanger x={-170} z={350} chain={40} size={76} period={4.6} phase={1.3} onClick={toAttic} label="天井裏の空へ">
        <Cloud size={76} />
      </Hanger>
      <Hanger x={250} z={380} chain={30} size={60} period={5} phase={3.1} onClick={toAttic} label="天井裏の空へ">
        <Cloud size={60} />
      </Hanger>
    </>
  );
}
