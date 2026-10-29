import type { CSSProperties, ReactNode, Ref } from 'react';
import { D, H, T, W } from './scenes';

// Geometry. The box is a W x H x W cube whose four sides and lid are windows. Behind each
// window is its own room, deeper than the box itself (D > W/2): a fictional box. The rooms
// overlap in space, so each is drawn as seen through its window (see `aimPortal`).
//
// Room frame: x right, y down (ceiling -H/2, floor +H/2), z toward the window, which sits at
// z = W/2; the back wall is at z = W/2 - D.

const FRONT = W / 2;

type FlatProps = {
  /** Centre x, top y and depth z of the cut-out in its room frame. */
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
  /** Casts a contact shadow on the floor behind the cut-out (for things standing on the floor). */
  grounded?: boolean;
};

/** Aerial perspective: 0 at the window, 1 at the back wall. Far layers fade toward the air. */
const fogAt = (z: number) => Math.min(1, Math.max(0, (FRONT - z) / D));

/**
 * One paper cut-out standing parallel to the opening. The outer element carries the 3D
 * placement and the lighting (cheap to change per frame); the inner one carries the paper
 * texture and drop shadow, which are rasterised once.
 */
export function Flat({ x, y, z, w, h, className = '', style, children, onClick, label, grounded }: FlatProps) {
  const pos = {
    left: x - w / 2,
    top: y,
    width: w,
    height: h,
    transform: `translateZ(${z}px)`,
    '--fog': fogAt(z).toFixed(3),
    ...style,
  } as CSSProperties;
  const inner = <div className="s2-paper">{children}</div>;
  const flat = onClick ? (
    <button type="button" className={`s2-flat s2-hit ${className}`} style={pos} onClick={onClick} aria-label={label}>
      {inner}
    </button>
  ) : (
    <div className={`s2-flat ${className}`} style={pos}>
      {inner}
    </div>
  );
  if (!grounded) return flat;
  // The key light sits above the opening, so the shadow falls on the floor just behind the base.
  const depth = Math.min(60, w * 0.35);
  return (
    <>
      <div
        className="s2-surface s2-ground"
        style={{
          left: x - w * 0.6,
          top: H / 2 - depth / 2,
          width: w * 1.2,
          height: depth,
          transform: `translate3d(0, -0.5px, ${z - depth * 0.3}px) rotateX(90deg)`,
        }}
      />
      {flat}
    </>
  );
}

export type Surfaces = {
  back: ReactNode;
  /** Art for both side walls, drawn with the window on its left; the right wall is mirrored. */
  side: ReactNode;
  floor: ReactNode;
  ceiling: string;
};

/**
 * A window onto a room. The window element is its own perspective container; `aimPortal`
 * puts that perspective's eye where the stage camera is, so the flattened room is exactly
 * what the camera would see through the opening (an off-axis projection onto the window).
 */
function Portal({
  w,
  h,
  depth,
  surfaces,
  transform,
  children,
}: {
  w: number;
  h: number;
  depth: number;
  surfaces: Surfaces;
  transform: string;
  children: ReactNode;
}) {
  // Each surface is drawn a little oversize so the room's corners overlap instead of leaving a seam.
  const box = (width: number, height: number, t: string, content?: ReactNode, background?: string) => (
    <div
      className="s2-surface"
      style={{ left: -width / 2 - 2, top: -height / 2 - 2, width: width + 4, height: height + 4, transform: t, background }}
    >
      {content}
    </div>
  );
  const mid = FRONT - depth / 2;
  return (
    <div className="s2-portal" style={{ width: w, height: h, left: -w / 2, top: -h / 2, transform }}>
      <div className="s2-room" style={{ left: w / 2, top: h / 2, transform: `translateZ(${-FRONT}px)` }}>
        {box(w, h, `translateZ(${FRONT - depth}px)`, surfaces.back)}
        {box(w, depth, `translate3d(0, ${h / 2}px, ${mid}px) rotateX(90deg)`, surfaces.floor)}
        {box(w, depth, `translate3d(0, ${-h / 2}px, ${mid}px) rotateX(-90deg)`, undefined, surfaces.ceiling)}
        {box(depth, h, `translate3d(${-w / 2}px, 0, ${mid}px) rotateY(90deg)`, surfaces.side)}
        {box(
          depth,
          h,
          `translate3d(${w / 2}px, 0, ${mid}px) rotateY(-90deg)`,
          <div style={{ width: '100%', height: '100%', transform: 'scaleX(-1)' }}>{surfaces.side}</div>,
        )}
        {children}
      </div>
    </div>
  );
}

type CompartmentProps = {
  theta: number;
  surfaces: Surfaces;
  children: ReactNode;
  ref?: Ref<HTMLDivElement>;
};

/** One side of the box: the window onto its room, framed by the cut cardboard edges. */
export function Compartment({ theta, surfaces, children, ref }: CompartmentProps) {
  return (
    <div ref={ref} className="s2-comp" style={{ transform: `rotateY(${theta}deg)` }}>
      <Portal w={W} h={H} depth={D} surfaces={surfaces} transform={`translateZ(${FRONT}px)`}>
        {children}
      </Portal>
      <div
        className="s2-surface s2-edge"
        style={{ left: -W / 2, top: H / 2, width: W, height: T, transform: `translateZ(${FRONT}px)` }}
      />
      <div
        className="s2-surface s2-edge"
        style={{ left: -W / 2, top: -H / 2 - T, width: W, height: T, transform: `translateZ(${FRONT}px)` }}
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
    </div>
  );
}

/** One paper face of a solid. The face element is lit; its child carries the paper grain. */
function Face({ w, h, t, shade, children }: { w: number; h: number; t: string; shade: number; children: ReactNode }) {
  return (
    <div className="s2-face" style={{ left: -w / 2, top: -h / 2, width: w, height: h, transform: t, '--shade': shade } as CSSProperties}>
      {children}
    </div>
  );
}

const fill = (background: string, content?: ReactNode) => (
  <div className="s2-tex" style={{ width: '100%', height: '100%', background }}>
    {content}
  </div>
);

/**
 * A paper box w x h x d, placed relative to its Solid: x centre, y top, z front face,
 * optionally turned by `turn` degrees about its vertical axis. The top is lit brighter and the
 * sides darker, which is most of what makes it read as solid.
 */
export function Cuboid({
  x = 0,
  y,
  z = 0,
  w,
  h,
  d,
  turn = 0,
  front,
  top,
  side,
  frontArt,
}: {
  x?: number;
  y: number;
  z?: number;
  w: number;
  h: number;
  d: number;
  turn?: number;
  front: string;
  top: string;
  side: string;
  frontArt?: ReactNode;
}) {
  return (
    <div className="s2-cuboid" style={{ transform: `translate3d(${x}px, ${y + h / 2}px, ${z - d / 2}px) rotateY(${turn}deg)` }}>
      <Face w={w} h={h} t={`translateZ(${d / 2}px)`} shade={1}>
        {fill(front, frontArt)}
      </Face>
      <Face w={w} h={d} t={`translateY(${-h / 2}px) rotateX(90deg)`} shade={1.1}>
        {fill(top)}
      </Face>
      <Face w={d} h={h} t={`translateX(${-w / 2}px) rotateY(-90deg)`} shade={0.8}>
        {fill(side)}
      </Face>
      <Face w={d} h={h} t={`translateX(${w / 2}px) rotateY(90deg)`} shade={0.8}>
        {fill(side)}
      </Face>
    </div>
  );
}

/**
 * A free-standing solid prop on the floor at (x, z), built from Cuboids and flat parts.
 * With onClick it is a button and hover lifts the whole thing. `footprint` sizes its shadow.
 */
export function Solid({
  x,
  z,
  footprint,
  children,
  onClick,
  label,
}: {
  x: number;
  z: number;
  footprint: [number, number];
  children: ReactNode;
  onClick: () => void;
  label: string;
}) {
  const [fw, fd] = footprint;
  return (
    <button
      type="button"
      className="s2-solid s2-hit"
      style={{ left: x, top: H / 2, transform: `translateZ(${z}px)` }}
      onClick={onClick}
      aria-label={label}
    >
      <div
        className="s2-surface s2-ground"
        style={{
          left: -fw * 0.7,
          top: -fd * 0.7,
          width: fw * 1.4,
          height: fd * 1.4,
          transform: `translate3d(0, -0.5px, ${-fd / 2}px) rotateX(90deg)`,
        }}
      />
      {children}
    </button>
  );
}

/** A flat part inside a Solid (leaves, a standing card), centred at x with its bottom at y. */
export function Part({ x = 0, y, z = 0, w, h, children }: { x?: number; y: number; z?: number; w: number; h: number; children: ReactNode }) {
  return (
    <div className="s2-face" style={{ left: x - w / 2, top: y - h, width: w, height: h, transform: `translateZ(${z}px)` }}>
      <div className="s2-paper">{children}</div>
    </div>
  );
}

/** Depth of the attic room below the lid. */
export const ATTIC_D = 360;
/** The lid sits on top of the cut edges. */
export const LID = H / 2 + T;

/**
 * The lid: a window facing up onto a room that drops into the box. Its frame is turned so
 * y runs from the back of the box (-W/2) to the front.
 */
export function Attic({ surfaces, children, ref }: { surfaces: Surfaces; children: ReactNode; ref?: Ref<HTMLDivElement> }) {
  return (
    <div ref={ref} className="s2-comp">
      <Portal w={W} h={W} depth={ATTIC_D} surfaces={surfaces} transform={`rotateX(90deg) translateZ(${LID}px)`}>
        {children}
      </Portal>
    </div>
  );
}

/**
 * Moves a portal's perspective eye to the camera. `toWindow` maps the window's top-left
 * local frame to the view's frame; the camera's position in that frame gives the eye
 * distance (perspective) and the foot of the eye on the window (perspective-origin).
 */
export function aimPortal(el: HTMLElement, toWindow: DOMMatrix, camera: DOMPoint) {
  const c = toWindow.inverse().transformPoint(camera);
  if (c.z < 1) {
    el.style.visibility = 'hidden';
    return;
  }
  el.style.visibility = '';
  el.style.perspective = `${c.z.toFixed(2)}px`;
  el.style.perspectiveOrigin = `${c.x.toFixed(2)}px ${c.y.toFixed(2)}px`;
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
