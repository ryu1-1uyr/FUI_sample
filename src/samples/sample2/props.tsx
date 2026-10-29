import { Cuboid, Flat, Part, Solid, type Surfaces } from './stage';
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

/** Destination tag for a solid prop: the numeral and name of the scene it turns the stage to. */
export function DestTag({ theta }: { theta: number }) {
  const to = sceneAtTheta(theta);
  return (
    <div className="s2-dest-slot">
      <div className="s2-dest">
        <Script text={pad2(to.num)} size={10} />
        <Script text={to.name} size={12} />
      </div>
    </div>
  );
}

export const destLabel = (theta: number) => `${sceneAtTheta(theta).name}へ`;

type Book = [w: number, h: number, d: number, turn: number, cover: string];

/** A stack of books on the floor that turns the stage; a bookmark card on top names the way. */
export function BookStack({ x, theta, books, onClick }: { x: number; theta: number; books: Book[]; onClick: () => void }) {
  let top = 0;
  return (
    <Solid x={x} z={366} footprint={[96, 70]} onClick={onClick} label={destLabel(theta)}>
      {books.map(([w, h, d, turn, cover], i) => {
        top -= h;
        return <Cuboid key={i} x={(i % 2 ? 4 : -3)} y={top} w={w} h={h} d={d} turn={turn} front={cover} top={cover} side="#f6ecd8" />;
      })}
      <Part y={top + 4} z={-28} w={78} h={46}>
        <DestTag theta={theta} />
      </Part>
    </Solid>
  );
}

/** Flat-coloured room surfaces with the paper grain. */
export const paintedSurfaces = (wall: string, floor: string, ceiling: string): Surfaces => {
  const paint = (background: string) => <div className="s2-tex" style={{ width: '100%', height: '100%', background }} />;
  return { ceiling, back: paint(wall), side: paint(wall), floor: paint(floor) };
};
