import { Flat, WallFlat, type Surfaces } from './stage';
import { H, sceneAtTheta } from './scenes';
import { Script } from './script';

const FLOOR = H / 2;
const pad2 = (n: number) => String(n).padStart(2, '0');

const star = (cx: number, cy: number, R: number, r: number) =>
  Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const k = i % 2 ? r : R;
    return `${(cx + Math.cos(a) * k).toFixed(2)},${(cy + Math.sin(a) * k).toFixed(2)}`;
  }).join(' ');

export function Star({ size, fill = '#ffd34f' }: { size: number; fill?: string }) {
  const R = size / 2 - 1;
  return <polygon points={star(size / 2, R + 1, R, R * 0.48)} fill={fill} />;
}

/** Tall foreground clump that overlaps the frame, so the stage reads as seen past something. */
export function Tuft({ w, h, tone = ['#4f9a4c', '#5ea85a', '#468d44'] }: { w: number; h: number; tone?: [string, string, string] }) {
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h}>
      <path d={`M${w * 0.1} ${h}Q${w * 0.05} ${h * 0.4} ${w * 0.3} 0Q${w * 0.3} ${h * 0.5} ${w * 0.45} ${h}Z`} fill={tone[0]} />
      <path d={`M${w * 0.3} ${h}Q${w * 0.5} ${h * 0.2} ${w * 0.9} ${h * 0.1}Q${w * 0.65} ${h * 0.5} ${w * 0.7} ${h}Z`} fill={tone[1]} />
      <path d={`M${w * 0.55} ${h}Q${w * 0.75} ${h * 0.55} ${w} ${h * 0.45}Q${w * 0.85} ${h * 0.75} ${w * 0.9} ${h}Z`} fill={tone[2]} />
    </svg>
  );
}


/** Standing arrow sign naming the neighbouring compartment it turns the stage to. */
export function Sign({ x, z, dir, theta, onClick }: { x: number; z: number; dir: -1 | 1; theta: number; onClick: () => void }) {
  const to = sceneAtTheta(theta);
  const board = dir < 0 ? '8,46 34,14 142,14 142,78 34,78' : '142,46 116,14 8,14 8,78 116,78';
  return (
    <Flat x={x} y={FLOOR - 170} z={z} w={150} h={170} onClick={onClick} label={`${to.name}へ`} className="s2-sign" grounded>
      <svg viewBox="0 0 150 170" width={150} height={170}>
        <rect x={67} y={60} width={16} height={110} fill="#9c6a48" />
        <polygon points={board} fill="#d9b373" transform="translate(0 5)" />
        <polygon points={board} fill="#f2d39c" />
      </svg>
      <div className="s2-sign-text" style={{ left: dir < 0 ? 36 : 12 }}>
        <Script text={pad2(to.num)} size={13} />
        <Script text={to.name} size={16} />
      </div>
    </Flat>
  );
}

/**
 * Indoor counterpart of the sign: a door in a side wall, left ajar so the neighbouring
 * scene's colour shows through. The plate above names where it leads.
 */
export function SideDoor({ side, theta, onClick }: { side: -1 | 1; theta: number; onClick: () => void }) {
  const to = sceneAtTheta(theta);
  return (
    <WallFlat side={side} z={160} y={FLOOR - 236} w={130} h={236} onClick={onClick} label={`${to.name}へ`}>
      <svg viewBox="0 0 130 236" width={130} height={236}>
        <path d="M8 236V110A57 57 0 0 1 122 110V236Z" fill="#7a5b44" />
        <path d="M18 236V114A47 47 0 0 1 112 114V236Z" fill={to.bg} />
        <path d="M18 236V114Q30 76 62 68L74 236Z" fill="#5f84c4" />
        <circle cx={62} cy={166} r={4} fill="#ffd66b" />
      </svg>
      <div className="s2-door-plate">
        <Script text={pad2(to.num)} size={11} />
        <Script text={to.name} size={13} />
      </div>
    </WallFlat>
  );
}

/** Flat-coloured room surfaces with the paper grain. */
export const paintedSurfaces = (wall: string, floor: string, ceiling: string): Surfaces => {
  const paint = (background: string) => <div className="s2-tex" style={{ width: '100%', height: '100%', background }} />;
  return { ceiling, back: paint(wall), side: paint(wall), floor: paint(floor) };
};
