import { Flat, Hanger, type Surfaces } from './stage';
import { H } from './scenes';
import { Script } from './script';
import { Sign } from './props';

// 01 // Storefront, daytime. The shop sits at the back of the wedge; the hanging mobile leads
// up to the attic, the standing signs lead to the neighbouring compartments, the door leads in.

const FLOOR = H / 2;

export const storefrontSurfaces: Surfaces = {
  ceiling: '#c9a073',
  spine: 'linear-gradient(#9bd1e2 150px, #a9d9e7 150px 440px, #88c07a 440px)',
  wall: (
    <svg viewBox="0 0 566 520" width="100%" height="100%" preserveAspectRatio="none" className="s2-tex">
      <rect width="566" height="520" fill="#a9d9e7" />
      <rect width="566" height="150" fill="#9bd1e2" />
      <g fill="#fbf5e9">
        <circle cx="120" cy="150" r="26" />
        <circle cx="152" cy="138" r="34" />
        <circle cx="188" cy="152" r="24" />
        <rect x="100" y="150" width="108" height="26" rx="13" />
        <circle cx="380" cy="96" r="18" />
        <circle cx="404" cy="86" r="24" />
        <circle cx="430" cy="98" r="16" />
        <rect x="364" y="96" width="80" height="18" rx="9" />
      </g>
      <path d="M0 520V420Q140 350 280 412T566 392V520Z" fill="#a3d08f" />
      <path d="M0 520V468Q200 404 380 458T566 446V520Z" fill="#88c07a" />
    </svg>
  ),
  floor: (
    <svg viewBox="0 0 800 800" width="100%" height="100%" className="s2-tex">
      <rect width="800" height="800" fill="#8cc46f" />
      <path d="M345 540H395L470 800H290Z" fill="#ead2a0" />
      <g fill="#7ab45f">
        <circle cx="250" cy="700" r="16" />
        <circle cx="560" cy="660" r="20" />
        <circle cx="610" cy="760" r="12" />
        <circle cx="200" cy="610" r="10" />
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
      <rect x={c - 8} y={h - 72} width={16} height={72} fill="#9c6a48" />
      <circle cx={c} cy={h - 122} r={w * 0.4} fill={tone[0]} />
      <circle cx={c - w * 0.23} cy={h - 100} r={w * 0.25} fill={tone[1]} />
      <circle cx={c + w * 0.22} cy={h - 96} r={w * 0.26} fill={tone[2]} />
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

export function Storefront({ go, toAttic, toBack }: { go: (dir: -1 | 1) => void; toAttic: () => void; toBack: () => void }) {
  return (
    <>
      <Flat x={0} y={FLOOR - 290} z={140} w={230} h={290}>
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
      <Flat x={-30} y={FLOOR - 96} z={141} w={58} h={96} onClick={toBack} label="仕立て場へ">
        <svg viewBox="0 0 58 96" width={58} height={96}>
          <path d="M0 96V29A29 29 0 0 1 58 29V96Z" fill="#5f84c4" />
          <path d="M9 88V32A20 20 0 0 1 49 32V88Z" fill="#7398d4" />
          <circle cx={46} cy={60} r={4} fill="#ffd66b" />
        </svg>
      </Flat>
      <Flat x={10} y={FLOOR - 290 + 132} z={142} w={96} h={34}>
        <div className="s2-plank">
          <Script text="物語屋" size={22} />
        </div>
      </Flat>

      <Flat x={-160} y={FLOOR - 210} z={230} w={120} h={210}>
        <Tree w={120} h={210} tone={['#5ea96a', '#529c5f', '#6bb575']} />
      </Flat>
      <Flat x={168} y={FLOOR - 180} z={232} w={100} h={180}>
        <Tree w={100} h={180} tone={['#68b071', '#5aa265', '#74bb7c']} />
      </Flat>
      <Flat x={-230} y={FLOOR - 56} z={300} w={130} h={56}>
        <Bush w={130} h={56} />
      </Flat>
      <Flat x={232} y={FLOOR - 50} z={302} w={120} h={50}>
        <Bush w={120} h={50} />
      </Flat>

      <Sign x={-240} z={340} dir={-1} theta={270} onClick={() => go(-1)} />
      <Sign x={240} z={340} dir={1} theta={90} onClick={() => go(1)} />

      <Flat x={0} y={FLOOR - 30} z={386} w={760} h={30}>
        <svg viewBox="0 0 760 30" width={760} height={30}>
          {Array.from({ length: 24 }, (_, i) => {
            const x = 12 + i * 32 + ((i * 37) % 11);
            const h = 14 + ((i * 53) % 13);
            return <polygon key={i} points={`${x - 9},30 ${x},${30 - h} ${x + 9},30`} fill={i % 3 ? '#6fb35d' : '#5fa451'} />;
          })}
        </svg>
      </Flat>

      <Hanger x={120} z={250} chain={104} size={84} period={5.2} phase={0} onClick={toAttic} label="天井裏の空へ">
        <path d="M54 4A36 36 0 1 0 54 72A40 40 0 0 1 54 4Z" fill="#ffe08a" transform="translate(0 -4)" />
        <circle cx={26} cy={34} r={3} fill="#e0b45a" />
      </Hanger>
      <Hanger x={-130} z={290} chain={58} size={52} period={4.1} phase={1.3} onClick={toAttic} label="天井裏の空へ">
        <Star size={52} />
      </Hanger>
      <Hanger x={-48} z={200} chain={150} size={38} period={3.6} phase={2.2} onClick={toAttic} label="天井裏の空へ">
        <Star size={38} fill="#ffe27a" />
      </Hanger>
      <Hanger x={44} z={322} chain={84} size={30} period={3.2} phase={0.7} onClick={toAttic} label="天井裏の空へ">
        <Star size={30} fill="#ffe9a0" />
      </Hanger>
      <Hanger x={214} z={332} chain={40} size={44} period={4.6} phase={3.1} onClick={toAttic} label="天井裏の空へ">
        <Star size={44} />
      </Hanger>
    </>
  );
}
