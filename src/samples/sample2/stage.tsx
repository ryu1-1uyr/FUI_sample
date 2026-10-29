import type { CSSProperties, ReactNode, Ref } from 'react';
import { H, T, W } from './scenes';

// Geometry of the box. Each compartment has its own frame: x right, y down (ceiling -H/2,
// floor +H/2), z toward its open face (0 at the turntable axis, W/2 at the opening). A flat
// at depth z must stay within |x| < z or it pokes through the diagonal dividers.

const DIAG = W / Math.SQRT2;

type FlatProps = {
  /** Centre x, top y and depth z of the cut-out in its compartment frame. */
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  /** Makes the cut-out a button; hover lifts it off its layer. */
  onClick?: () => void;
  label?: string;
};

/**
 * One paper cut-out standing parallel to the opening. The outer element carries the 3D
 * placement and the lighting (cheap to change per frame); the inner one carries the paper
 * texture and drop shadow, which are rasterised once.
 */
export function Flat({ x, y, z, w, h, className = '', style, children, onClick, label }: FlatProps) {
  const pos: CSSProperties = {
    left: x - w / 2,
    top: y,
    width: w,
    height: h,
    transform: `translateZ(${z}px)`,
    ...style,
  };
  const inner = <div className="s2-paper">{children}</div>;
  return onClick ? (
    <button type="button" className={`s2-flat s2-hit ${className}`} style={pos} onClick={onClick} aria-label={label}>
      {inner}
    </button>
  ) : (
    <div className={`s2-flat ${className}`} style={pos}>
      {inner}
    </div>
  );
}

export type Surfaces = {
  wall: ReactNode;
  floor: ReactNode;
  ceiling: string;
  /** Background of the strip covering the seam where the two dividers meet at the axis. */
  spine: string;
};

type CompartmentProps = {
  theta: number;
  surfaces: Surfaces;
  children: ReactNode;
  ref?: Ref<HTMLDivElement>;
};

/** One wedge of the turntable: floor, ceiling, the two dividers, the cut edges, and its flats. */
export function Compartment({ theta, surfaces, children, ref }: CompartmentProps) {
  return (
    <div ref={ref} className="s2-comp" style={{ transform: `rotateY(${theta}deg)` }}>
      <div
        className="s2-surface"
        style={{
          left: -W / 2,
          top: -W / 2,
          width: W,
          height: W,
          transform: `translateY(${H / 2}px) rotateX(90deg)`,
          clipPath: 'polygon(0 100%, 100% 100%, 50% 50%)',
        }}
      >
        {surfaces.floor}
      </div>
      <div
        className="s2-surface"
        style={{
          left: -W / 2,
          top: -W / 2,
          width: W,
          height: W,
          transform: `translateY(${-H / 2}px) rotateX(-90deg)`,
          clipPath: 'polygon(0 0, 100% 0, 50% 50%)',
          background: surfaces.ceiling,
        }}
      />
      {([45, -45] as const).map((a) => (
        <div
          key={a}
          className="s2-surface"
          style={{
            left: -DIAG / 2,
            top: -H / 2,
            width: DIAG,
            height: H,
            // The left divider runs from the front-left corner to the axis; the right one mirrors it.
            transform: `translate3d(${a > 0 ? -W / 4 : W / 4}px, 0, ${W / 4}px) rotateY(${a}deg) translateZ(0.5px)`,
          }}
        >
          <div style={{ width: '100%', height: '100%', transform: a < 0 ? 'scaleX(-1)' : undefined }}>
            {surfaces.wall}
          </div>
        </div>
      ))}
      <div
        className="s2-surface"
        style={{ left: -6, top: -H / 2, width: 12, height: H, transform: 'translateZ(4px)' }}
      >
        <div className="s2-tex" style={{ width: '100%', height: '100%', background: surfaces.spine }} />
      </div>
      <div
        className="s2-surface s2-edge"
        style={{ left: -W / 2, top: H / 2, width: W, height: T, transform: `translateZ(${W / 2}px)` }}
      />
      <div
        className="s2-surface s2-edge"
        style={{ left: -W / 2, top: -H / 2 - T, width: W, height: T, transform: `translateZ(${W / 2}px)` }}
      />
      <div
        className="s2-surface s2-edge s2-post"
        style={{
          left: -T / 2,
          top: -H / 2 - T,
          width: T,
          height: H + 2 * T,
          transform: `translate3d(${W / 2}px, 0, ${W / 2}px) rotateY(45deg)`,
        }}
      />
      {children}
    </div>
  );
}

/** The lid. Its frame faces up: z rises toward the sky, y runs from the back (-W/2) to the front. */
export function Attic({ children, ref }: { children: ReactNode; ref?: Ref<HTMLDivElement> }) {
  return (
    <div ref={ref} className="s2-comp" style={{ transform: `rotateX(90deg) translateZ(${H / 2 + T}px)` }}>
      {children}
    </div>
  );
}

/** Hanging cut-out: a chain from the ceiling down to `children`, swinging about the hook. */
export function Hanger({
  x,
  z,
  chain,
  size,
  period,
  phase,
  onClick,
  label,
  children,
}: {
  x: number;
  z: number;
  chain: number;
  size: number;
  period: number;
  phase: number;
  onClick?: () => void;
  label?: string;
  children: ReactNode;
}) {
  const links = Math.max(1, Math.round(chain / 9));
  return (
    <Flat
      x={x}
      y={-H / 2}
      z={z}
      w={size}
      h={chain + size}
      className="s2-hanger"
      style={{ '--period': `${period}s`, '--phase': `${-phase}s` } as CSSProperties}
      onClick={onClick}
      label={label}
    >
      <svg viewBox={`0 0 ${size} ${chain + size}`} width={size} height={chain + size}>
        <circle cx={size / 2} cy={2} r={4} fill="#8a7a63" />
        {Array.from({ length: links }, (_, i) => {
          const y = 4 + (i * (chain - 4)) / links;
          const h = (chain - 4) / links + 1.5;
          return i % 2 ? (
            <rect key={i} x={size / 2 - 1.3} y={y} width={2.6} height={h} rx={1.3} fill="#9b9488" />
          ) : (
            <path
              key={i}
              fillRule="evenodd"
              fill="#b3ab9d"
              d={`M${size / 2 - 3} ${y + h / 2}a3 ${h / 2} 0 1 0 6 0a3 ${h / 2} 0 1 0 -6 0Z` +
                `M${size / 2 - 1.3} ${y + h / 2}a1.3 ${h / 2 - 2} 0 1 1 2.6 0a1.3 ${h / 2 - 2} 0 1 1 -2.6 0Z`}
            />
          );
        })}
        <g transform={`translate(0 ${chain})`}>{children}</g>
      </svg>
    </Flat>
  );
}
