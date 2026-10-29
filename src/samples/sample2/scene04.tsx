import { Flat, Hanger, type Surfaces } from './stage';
import { D, H, W } from './scenes';
import { SideDoor } from './props';

// 04 // The archive and the dispatch desk, early morning. Finished stories are shelved as books;
// ordered ones wait wrapped on the counter, and paper birds carry letters up to the attic.

const FLOOR = H / 2;
const BACK = W / 2 - D;
const SPINES = ['#e9b44c', '#6f9fd8', '#d27c6c', '#7cb08a', '#c7a2d6', '#f2d39c', '#5f8f8a'];

/** Bookshelves filling a w x 520 wall from `top` down to the floor. */
const shelves = (w: number, top: number, seed: number) => {
  const rows = [];
  for (let y = top, r = 0; y < 470; y += 92, r++) {
    let x = 10;
    const books = [];
    for (let i = 0; x < w - 30; i++) {
      const bw = 14 + ((i * 7 + r * 5 + seed) % 4) * 4;
      const bh = 58 + ((i * 11 + r * 3 + seed) % 5) * 5;
      books.push(<rect key={i} x={x} y={y + 84 - bh} width={bw} height={bh} rx={2} fill={SPINES[(i + r + seed) % SPINES.length]} />);
      x += bw + 3 + ((i * 13 + r) % 7 === 0 ? 20 : 0);
    }
    rows.push(
      <g key={y}>
        {books}
        <rect x={0} y={y + 84} width={w} height={8} fill="#8a5a3c" />
      </g>,
    );
  }
  return rows;
};

export const archiveSurfaces: Surfaces = {
  ceiling: '#d8a97f',
  back: (
    <svg viewBox="0 0 800 520" width="100%" height="100%" className="s2-tex">
      <rect width="800" height="520" fill="#a8754f" />
      <g transform="translate(0 40)">{shelves(290, 150, 1)}</g>
      <g transform="translate(510 40)">{shelves(290, 150, 3)}</g>
      <rect x="300" width="200" height="520" fill="#f6e4d2" />
      <circle cx="400" cy="150" r="78" fill="#7a5b44" />
      <circle cx="400" cy="150" r="68" fill="#fde7c8" />
      <rect x="332" y="150" width="136" height="68" fill="#fbd9b0" />
      <circle cx="430" cy="170" r="26" fill="#ffd48a" />
      <rect x="396" y="82" width="8" height="136" fill="#7a5b44" />
      <rect x="332" y="146" width="136" height="8" fill="#7a5b44" />
    </svg>
  ),
  side: (
    <svg viewBox={`0 0 ${D} 520`} width="100%" height="100%" className="s2-tex">
      <rect width={D} height="520" fill="#a8754f" />
      <g transform="translate(0 0)">{shelves(D, 10, 5)}</g>
    </svg>
  ),
  floor: (
    <svg viewBox={`0 0 800 ${D}`} width="100%" height="100%" className="s2-tex">
      <rect width="800" height={D} fill="#e9c9a0" />
      {Array.from({ length: 10 }, (_, r) =>
        Array.from({ length: 10 }, (_, c) =>
          (r + c) % 2 ? <rect key={`${r}-${c}`} x={c * 80} y={r * 62} width={80} height={62} fill="#e0ba8c" /> : null,
        ),
      )}
    </svg>
  ),
};

function Parcel({ w, h, tone }: { w: number; h: number; tone: string }) {
  return (
    <g>
      <rect width={w} height={h} rx={3} fill={tone} />
      <rect x={w / 2 - 2} width={4} height={h} fill="#c94f6a" />
      <rect y={h / 2 - 2} width={w} height={4} fill="#c94f6a" />
    </g>
  );
}

function Bicycle() {
  return (
    <svg viewBox="0 0 230 140" width={230} height={140}>
      <circle cx={50} cy={100} r={38} fill="#3b3552" />
      <circle cx={50} cy={100} r={28} fill="#e9c9a0" />
      <circle cx={180} cy={100} r={38} fill="#3b3552" />
      <circle cx={180} cy={100} r={28} fill="#e9c9a0" />
      <path d="M50 100L100 50H160L180 100L172 104L154 60H106L58 106Z" fill="#5f8f8a" />
      <rect x={92} y={36} width={34} height={8} rx={4} fill="#3b3552" />
      <rect x={160} y={30} width={8} height={40} fill="#5f8f8a" />
      <rect x={150} y={26} width={34} height={7} rx={3.5} fill="#3b3552" />
      <path d="M176 20H226L220 52H182Z" fill="#c9a073" />
      <rect x={184} y={6} width={14} height={18} rx={2} fill="#6f9fd8" />
      <rect x={200} y={2} width={14} height={22} rx={2} fill="#e9b44c" />
    </svg>
  );
}

/** A paper bird with a letter in its beak. */
function Bird({ tone }: { tone: string }) {
  return (
    <g>
      <path d="M4 22Q22 4 34 18L50 10L42 26Q30 36 12 30Z" fill={tone} />
      <path d="M20 20L30 2L36 18Z" fill="#fbf4e6" />
      <rect x={44} y={22} width={14} height={10} rx={1} fill="#fbf4e6" />
    </g>
  );
}

export function Archive({ go, toAttic }: { go: (dir: -1 | 1) => void; toAttic: () => void }) {
  return (
    <>
      <Flat x={-210} y={FLOOR - 300} z={BACK + 70} w={60} h={300}>
        <svg viewBox="0 0 60 300" width={60} height={300}>
          <rect x={4} width={8} height={300} fill="#7a4f34" />
          <rect x={48} width={8} height={300} fill="#7a4f34" />
          {Array.from({ length: 9 }, (_, i) => (
            <rect key={i} x={4} y={20 + i * 32} width={52} height={7} fill="#8a5a3c" />
          ))}
        </svg>
      </Flat>

      <Flat x={30} y={FLOOR - 120} z={60} w={320} h={120} grounded>
        <svg viewBox="0 0 320 120" width={320} height={120}>
          <rect y={30} width={320} height={90} rx={4} fill="#8a5a3c" />
          <rect y={30} width={320} height={14} fill="#a06a45" />
          <rect x={20} y={56} width={130} height={50} rx={3} fill="#7a4f34" />
          <rect x={170} y={56} width={130} height={50} rx={3} fill="#7a4f34" />
          <g transform="translate(200 4)">
            <Parcel w={44} h={26} tone="#fbf4e6" />
          </g>
          <g transform="translate(248 -6)">
            <Parcel w={36} h={36} tone="#c7a2d6" />
          </g>
          <g transform="translate(222 -26)">
            <Parcel w={30} h={22} tone="#6f9fd8" />
          </g>
        </svg>
      </Flat>

      <Flat x={-50} y={FLOOR - 140} z={210} w={230} h={140} grounded>
        <Bicycle />
      </Flat>
      <Flat x={220} y={FLOOR - 150} z={240} w={76} h={150} grounded>
        <svg viewBox="0 0 76 150" width={76} height={150}>
          <rect x={30} y={90} width={16} height={60} fill="#3b5a8a" />
          <path d="M0 38A38 38 0 0 1 76 38V100H0Z" fill="#4f78b8" />
          <rect x={14} y={44} width={48} height={8} rx={4} fill="#2b3d66" />
          <rect x={20} y={64} width={36} height={22} rx={3} fill="#fbf4e6" />
        </svg>
      </Flat>

      <SideDoor side={-1} theta={180} onClick={() => go(-1)} />
      <SideDoor side={1} theta={0} onClick={() => go(1)} />

      {[
        [-350, 120, 90],
        [350, 100, 74],
      ].map(([x, h, w]) => (
        <Flat key={x} x={x} y={FLOOR - h} z={392} w={w} h={h}>
          <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h}>
            {Array.from({ length: Math.floor(h / 22) }, (_, i) => (
              <rect key={i} x={(i % 2) * 6} y={h - (i + 1) * 22} width={w - 6} height={20} rx={2} fill={SPINES[(i + (x > 0 ? 3 : 0)) % SPINES.length]} />
            ))}
          </svg>
        </Flat>
      ))}

      <Hanger x={-150} z={140} chain={120} size={60} period={4.3} phase={0.2} onClick={toAttic} label="天井裏の空へ">
        <Bird tone="#6f9fd8" />
      </Hanger>
      <Hanger x={120} z={250} chain={70} size={60} period={3.9} phase={1.4} onClick={toAttic} label="天井裏の空へ">
        <Bird tone="#e9b44c" />
      </Hanger>
      <Hanger x={300} z={360} chain={40} size={60} period={4.8} phase={2.7} onClick={toAttic} label="天井裏の空へ">
        <Bird tone="#d27c6c" />
      </Hanger>
    </>
  );
}
