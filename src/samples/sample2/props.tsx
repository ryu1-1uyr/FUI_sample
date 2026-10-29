import { Flat, type Surfaces } from './stage';
import { H, sceneAtTheta, type Scene } from './scenes';
import { Script } from './script';

const FLOOR = H / 2;
const pad2 = (n: number) => String(n).padStart(2, '0');

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

export const placeholderSurfaces = (wall: string, floor: string, ceiling: string): Surfaces => {
  const paint = (background: string) => <div className="s2-tex" style={{ width: '100%', height: '100%', background }} />;
  return { ceiling, back: paint(wall), side: paint(wall), floor: paint(floor) };
};

/** A compartment that is not built yet: its title card plus the two signs, so the loop is navigable. */
export function Placeholder({ scene, go }: { scene: Scene; go: (dir: -1 | 1) => void }) {
  const theta = scene.theta!;
  return (
    <>
      <Flat x={0} y={FLOOR - 250} z={220} w={240} h={150}>
        <div className="s2-card">
          <Script text={pad2(scene.num)} size={18} />
          <Script text={scene.name} size={26} />
          <Script text="準備中" size={14} className="s2-dim" />
        </div>
      </Flat>
      <Sign x={-240} z={340} dir={-1} theta={theta - 90} onClick={() => go(-1)} />
      <Sign x={240} z={340} dir={1} theta={theta + 90} onClick={() => go(1)} />
    </>
  );
}

export const atticSurfaces = placeholderSurfaces('#141a3a', '#10152f', '#10152f');

/** The attic's night sky, seen down through the lid. Placeholder until scene 05 is built. */
export function AtticSky({ scene, down }: { scene: Scene; down: () => void }) {
  const stars = [
    [-260, -240, 120],
    [-120, -300, 200],
    [180, -260, 90],
    [290, -120, 260],
    [-300, 60, 320],
    [240, 180, 160],
    [60, -60, 60],
  ];
  return (
    <>
      {stars.map(([x, y, z], i) => (
        <Flat key={i} x={x} y={y} z={z} w={28} h={28}>
          <svg viewBox="0 0 28 28" width={28} height={28}>
            <circle cx={14} cy={14} r={6 + (i % 3) * 2} fill="#ffe39a" />
          </svg>
        </Flat>
      ))}
      <Flat x={0} y={-120} z={330} w={260} h={150}>
        <div className="s2-card s2-card-night">
          <Script text={pad2(scene.num)} size={18} />
          <Script text={scene.name} size={26} />
          <Script text="準備中" size={14} className="s2-dim" />
        </div>
      </Flat>
      <Flat x={0} y={150} z={350} w={120} h={110} onClick={down} label="舞台へ戻る" className="s2-sign">
        <svg viewBox="0 0 120 110" width={120} height={110}>
          <polygon points="60,108 8,54 34,54 34,4 86,4 86,54 112,54" fill="#c9a86a" transform="translate(0 4)" />
          <polygon points="60,108 8,54 34,54 34,4 86,4 86,54 112,54" fill="#f2d39c" />
        </svg>
      </Flat>
    </>
  );
}
