import { Flat, Hanger, type Surfaces } from './stage';
import { D, H, W } from './scenes';
import { Person, Sign, Star } from './props';

// 03 // The tailoring room, inside the shop at dusk. The storymonger cuts gathered seeds into
// shapes at the bench; finished pieces dry on a line. The back door leads out to the storefront.

const FLOOR = H / 2;
const BACK = W / 2 - D;

const wallpaper = (w: number) => (
  <>
    <rect width={w} height="520" fill="#efd2a8" />
    {Array.from({ length: Math.ceil(w / 40) }, (_, i) => (
      <rect key={i} x={i * 40 + 13} width="14" height="400" fill="#e8c597" />
    ))}
    <rect y="400" width={w} height="120" fill="#b97f55" />
    <rect y="396" width={w} height="10" fill="#a06a45" />
  </>
);

export const workshopSurfaces: Surfaces = {
  ceiling: '#8f5f3f',
  back: (
    <svg viewBox="0 0 800 520" width="100%" height="100%" className="s2-tex">
      {wallpaper(800)}
      <rect x="140" y="100" width="200" height="170" rx="6" fill="#7a5b44" />
      <rect x="152" y="112" width="176" height="146" fill="#f6b26b" />
      <rect x="152" y="190" width="176" height="68" fill="#f08a5d" />
      <rect x="152" y="232" width="176" height="26" fill="#c96a6a" />
      <circle cx="270" cy="200" r="22" fill="#ffd48a" />
      <rect x="236" y="112" width="8" height="146" fill="#7a5b44" />
      <rect x="152" y="182" width="176" height="8" fill="#7a5b44" />
      <g fill="#fbf4e6" opacity="0.85">
        <polygon points="470,120 500,180 440,180" />
        <circle cx="560" cy="150" r="26" />
        <rect x="610" y="122" width="54" height="54" rx="6" />
      </g>
      <g fill="#c94f6a">
        <circle cx="470" cy="122" r="4" />
        <circle cx="560" cy="126" r="4" />
        <circle cx="637" cy="124" r="4" />
      </g>
    </svg>
  ),
  side: (
    <svg viewBox={`0 0 ${D} 520`} width="100%" height="100%" className="s2-tex">
      {wallpaper(D)}
      <rect x="180" y="210" width="300" height="12" fill="#8a5a3c" />
      {['#6f9fd8', '#e9b44c', '#7cb08a', '#d27c6c', '#c7a2d6', '#f2d39c'].map((c, i) => (
        <circle key={c} cx={210 + i * 46} cy={190} r={18} fill={c} />
      ))}
    </svg>
  ),
  floor: (
    <svg viewBox={`0 0 800 ${D}`} width="100%" height="100%" className="s2-tex">
      <rect width="800" height={D} fill="#b9845a" />
      {Array.from({ length: 13 }, (_, i) => (
        <rect key={i} x={i * 64 - 2} width="5" height={D} fill="#a87650" />
      ))}
      <ellipse cx="400" cy="470" rx="250" ry="90" fill="#5f8f8a" />
      <ellipse cx="400" cy="470" rx="210" ry="66" fill="#6f9f99" />
      <g fill="#fbf4e6">
        <polygon points="300,330 318,342 296,350" />
        <circle cx="520" cy="360" r="7" />
        <rect x="460" y="300" width="12" height="9" />
      </g>
    </svg>
  ),
};

function Bench() {
  return (
    <svg viewBox="0 0 400 150" width={400} height={150}>
      <rect x={30} y={40} width={16} height={110} fill="#7a4f34" />
      <rect x={354} y={40} width={16} height={110} fill="#7a4f34" />
      <rect x={40} y={48} width={320} height={96} rx={3} fill="#8a5a3c" />
      <rect x={60} y={64} width={130} height={30} rx={3} fill="#7a4f34" />
      <rect x={210} y={64} width={130} height={30} rx={3} fill="#7a4f34" />
      <rect x={10} y={26} width={380} height={22} rx={4} fill="#a06a45" />
      <rect x={10} y={44} width={380} height={6} fill="#8a5a3c" />
      <rect x={60} y={10} width={120} height={16} rx={2} fill="#fbf4e6" />
      <rect x={70} y={4} width={110} height={10} rx={2} fill="#f2d39c" />
      <rect x={270} y={2} width={38} height={24} rx={6} fill="#6f9fd8" />
      <rect x={276} y={-2} width={26} height={8} rx={3} fill="#e9eef7" />
      <circle cx={222} cy={16} r={7} fill="#c94f6a" />
      <circle cx={238} cy={16} r={7} fill="#c94f6a" />
      <circle cx={222} cy={16} r={3} fill="#a06a45" />
      <circle cx={238} cy={16} r={3} fill="#a06a45" />
    </svg>
  );
}

/** Paper pieces drying on a line strung across the room. */
function Line() {
  const pieces = ['star', 'moon', 'tri', 'star', 'circ', 'tri', 'moon'];
  return (
    <svg viewBox="0 0 720 90" width={720} height={90}>
      <path d="M0 4Q360 40 720 4V8Q360 44 0 8Z" fill="#8a7a63" />
      {pieces.map((k, i) => {
        const x = 60 + i * 100;
        const y = 6 + 30 * (1 - ((x - 360) / 360) ** 2);
        const fill = ['#ffd34f', '#fbf4e6', '#6f9fd8', '#e9b44c', '#7cb08a', '#c7a2d6', '#f2d39c'][i];
        return (
          <g key={i} transform={`translate(${x - 18} ${y})`}>
            <rect x={14} y={0} width={8} height={8} fill="#a06a45" />
            {k === 'star' && <polygon points="18,6 23,18 36,18 26,26 30,38 18,31 6,38 10,26 0,18 13,18" fill={fill} />}
            {k === 'moon' && <path d="M24 6A16 16 0 1 0 24 38A18 18 0 0 1 24 6Z" fill={fill} />}
            {k === 'tri' && <polygon points="2,6 34,6 18,38" fill={fill} />}
            {k === 'circ' && <circle cx={18} cy={22} r={15} fill={fill} />}
          </g>
        );
      })}
    </svg>
  );
}

export function Workshop({ go, toAttic, toBack }: { go: (dir: -1 | 1) => void; toAttic: () => void; toBack: () => void }) {
  return (
    <>
      <Flat x={240} y={FLOOR - 150} z={BACK + 3} w={92} h={150} onClick={toBack} label="店先へ">
        <svg viewBox="0 0 92 150" width={92} height={150}>
          <path d="M0 150V40A46 40 0 0 1 92 40V150Z" fill="#5f84c4" />
          <path d="M10 142V44A36 32 0 0 1 82 44V142Z" fill="#7398d4" />
          <circle cx={74} cy={90} r={5} fill="#ffd66b" />
        </svg>
      </Flat>
      <Flat x={-280} y={FLOOR - 240} z={-120} w={110} h={240} grounded>
        <svg viewBox="0 0 110 240" width={110} height={240}>
          <rect width={110} height={240} rx={4} fill="#8a5a3c" />
          {[20, 90, 160].map((y, r) => (
            <g key={y}>
              <rect x={8} y={y + 52} width={94} height={8} fill="#6b452e" />
              {Array.from({ length: 4 }, (_, i) => (
                <rect
                  key={i}
                  x={12 + i * 23}
                  y={y + 8 + ((i + r) % 2) * 8}
                  width={18}
                  height={44 - ((i + r) % 2) * 8}
                  rx={2}
                  fill={['#f2d39c', '#fbf4e6', '#e9b44c', '#d9c3a0'][(i + r) % 4]}
                />
              ))}
            </g>
          ))}
        </svg>
      </Flat>

      <Flat x={-40} y={FLOOR - 250} z={70} w={170} h={220}>
        <Person>
          <rect x={86} y={104} width={30} height={10} rx={3} fill="#fbf4e6" transform="rotate(-12 100 110)" />
        </Person>
      </Flat>
      <Flat x={0} y={FLOOR - 150} z={120} w={400} h={150} grounded>
        <Bench />
      </Flat>
      <Flat x={90} y={FLOOR - 150 - 44} z={122} w={60} h={50}>
        <svg viewBox="0 0 60 50" width={60} height={50}>
          <path d="M40 2A24 24 0 1 0 40 48A26 26 0 0 1 40 2Z" fill="#ffe08a" />
        </svg>
      </Flat>

      <Flat x={0} y={-H / 2 + 40} z={240} w={720} h={90}>
        <Line />
      </Flat>

      <Sign x={-240} z={330} dir={-1} theta={90} onClick={() => go(-1)} />
      <Sign x={240} z={330} dir={1} theta={270} onClick={() => go(1)} />

      <Flat x={-340} y={FLOOR - 150} z={392} w={90} h={150}>
        <svg viewBox="0 0 90 150" width={90} height={150}>
          <path d="M45 150Q10 80 20 20Q50 60 45 150Z" fill="#5ea85a" />
          <path d="M45 150Q80 70 76 10Q40 70 45 150Z" fill="#4f9a4c" />
          <path d="M45 150Q30 90 50 40Q60 100 45 150Z" fill="#6bb575" />
          <path d="M18 110H72L64 150H26Z" fill="#c9784f" />
        </svg>
      </Flat>
      <Flat x={340} y={FLOOR - 90} z={390} w={110} h={90}>
        <svg viewBox="0 0 110 90" width={110} height={90}>
          <rect x={0} y={20} width={110} height={70} rx={4} fill="#c9a073" />
          <rect x={0} y={20} width={110} height={14} fill="#b08860" />
          <polygon points="20,20 40,0 50,20" fill="#fbf4e6" />
          <circle cx={78} cy={14} r={12} fill="#ffd34f" />
        </svg>
      </Flat>

      <Hanger x={-140} z={180} chain={70} size={60} period={5} phase={0.3} onClick={toAttic} label="天井裏の空へ">
        <path d="M4 30A26 26 0 0 1 56 30Z" fill="#5f8f8a" />
        <circle cx={30} cy={34} r={8} fill="#fff0b8" />
      </Hanger>
      <Hanger x={160} z={60} chain={110} size={50} period={4.6} phase={1.8} onClick={toAttic} label="天井裏の空へ">
        <path d="M4 26A21 21 0 0 1 46 26Z" fill="#c9784f" />
        <circle cx={25} cy={30} r={7} fill="#fff0b8" />
      </Hanger>
      <Hanger x={290} z={360} chain={36} size={36} period={4} phase={2.6} onClick={toAttic} label="天井裏の空へ">
        <Star size={36} />
      </Hanger>
    </>
  );
}
