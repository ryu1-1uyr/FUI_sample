import { useCallback, useEffect, useRef, useState, type CSSProperties, type Ref } from 'react';
import { createRoot } from 'react-dom/client';
import type { Mount } from '../../types';
import { clamp01, mixHex, reduced, settled, spring, stepSpring, wrapDeg } from './motion';
import { AtticSky, Placeholder, placeholderSurfaces } from './props';
import { Storefront, storefrontSurfaces } from './scene01';
import { H, SCENES, T, W, sceneAtTheta, sceneById, type Scene, type SceneId } from './scenes';
import { Script, clearLoupe, updateLoupe } from './script';
import { Attic, Compartment } from './stage';
import './style.css';

const DEG = Math.PI / 180;
const LENS = 62;
const STUBS = 5;
/** Perceptual duration (s) and bounce of a quarter turn: a paper toy, so a little play. */
const TURN = [1.15, 0.14] as const;
const LIFT = [1.0, 0.08] as const;
/** Max pointer tilt (deg): yaw, and pitch looking up / down. Looking down shows little more than
 * the lid, so that side is kept small; yaw goes far enough to see into the side opening. */
const TILT = [26, 7, 2.5] as const;

const pad2 = (n: number) => String(n).padStart(2, '0');
const mod360 = (d: number) => ((d % 360) + 360) % 360;

type Stub = { key: number; scene: Scene; at: string };

function PaperDefs() {
  return (
    <svg className="s2-defs" aria-hidden="true">
      <filter id="s2-paper" x="-4%" y="-4%" width="108%" height="108%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="4" result="edge" />
        <feDisplacementMap in="SourceGraphic" in2="edge" scale="3" xChannelSelector="R" yChannelSelector="G" result="cut" />
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed="9" result="fiber" />
        <feColorMatrix
          in="fiber"
          type="matrix"
          values="0.16 0 0 0 0.86  0.16 0 0 0 0.86  0.16 0 0 0 0.86  0 0 0 0 1"
          result="grain"
        />
        <feBlend in="cut" in2="grain" mode="multiply" result="toned" />
        <feComposite in="toned" in2="cut" operator="in" />
      </filter>
    </svg>
  );
}

function PanelHead({ n, title }: { n: number; title: string }) {
  return (
    <div className="s2-head">
      <b>
        <Script text={pad2(n)} size={12} />
      </b>
      <Script text={title} size={14} />
    </div>
  );
}

function StatusTag({ scene, moving }: { scene: Scene; moving: boolean }) {
  const night = scene.id === 's02' || scene.id === 's05';
  return (
    <div className="s2-tag" data-moving={moving || undefined}>
      <i className="s2-string" />
      <PanelHead n={1} title="上演中" />
      <div className="s2-tag-body">
        <svg viewBox="0 0 28 28" width={28} height={28} aria-hidden="true">
          {night ? (
            <path d="M18 3A12 12 0 1 0 18 25A14 14 0 0 1 18 3Z" fill="#f2c94c" />
          ) : (
            <circle cx={14} cy={14} r={9} fill="#f2a541" />
          )}
        </svg>
        <div>
          <Script text={pad2(scene.num)} size={18} />
          <Script text={scene.name} size={22} />
        </div>
      </div>
      <div className="s2-tag-state">
        <i className="s2-lamp" />
        <Script text={moving ? '回転中' : '停止中'} size={13} />
      </div>
    </div>
  );
}

function Dial({
  target,
  pick,
  discRef,
}: {
  target: SceneId;
  pick: (id: SceneId) => void;
  discRef: Ref<HTMLDivElement>;
}) {
  const at = (phi: number, r: number) => [70 + Math.sin(phi * DEG) * r, 70 + Math.cos(phi * DEG) * r];
  const floorTone: Record<SceneId, string> = { s01: '#8cc46f', s02: '#3a4672', s03: '#b9845a', s04: '#e9c9a0', s05: '#131936' };
  return (
    <div className="s2-panel s2-dial">
      <PanelHead n={2} title="回り舞台" />
      <button
        type="button"
        className="s2-attic-tab"
        aria-pressed={target === 's05'}
        aria-label="天井裏の空"
        onClick={() => pick('s05')}
      >
        <svg viewBox="0 0 40 18" width={40} height={18} aria-hidden="true">
          <path d="M2 18V8A6 6 0 0 1 8 2H32A6 6 0 0 1 38 8V18Z" fill="currentColor" />
          <circle cx={20} cy={10} r={3.2} fill="#ffe39a" />
        </svg>
      </button>
      <div className="s2-disc" ref={discRef}>
        <svg viewBox="0 0 140 140" width={140} height={140}>
          <circle cx={70} cy={70} r={66} fill="#a98055" />
          {SCENES.filter((s) => s.theta !== null).map((s) => {
            const [ax, ay] = at(s.theta! - 45, 92);
            const [bx, by] = at(s.theta! + 45, 92);
            const dots = Array.from({ length: s.num }, (_, k) => at(s.theta!, 40 + (k - (s.num - 1) / 2) * 7));
            return (
              <g
                key={s.id}
                className="s2-wedge"
                data-on={target === s.id || undefined}
                role="button"
                aria-label={s.name}
                onClick={() => pick(s.id)}
              >
                <path d={`M70 70L${ax} ${ay}L${bx} ${by}Z`} fill={floorTone[s.id]} clipPath="url(#s2-disc-clip)" />
                {dots.map(([x, y], k) => (
                  <circle key={k} cx={x} cy={y} r={2.4} fill="#fbf4e6" />
                ))}
              </g>
            );
          })}
          <clipPath id="s2-disc-clip">
            <circle cx={70} cy={70} r={60} />
          </clipPath>
          <circle cx={70} cy={70} r={7} fill="#7a5b44" />
        </svg>
      </div>
      <svg className="s2-pin" viewBox="0 0 16 22" width={16} height={22} aria-hidden="true">
        <path d="M8 0L16 12A8 8 0 0 1 0 12Z" fill="var(--s2-warn)" />
      </svg>
      <Script text="正面" size={12} className="s2-dim s2-front" />
    </div>
  );
}

function Stubs({ stubs }: { stubs: Stub[] }) {
  return (
    <div className="s2-panel s2-stubs">
      <PanelHead n={3} title="半券" />
      <ol>
        {stubs.map((s, i) => (
          <li key={s.key} style={{ '--i': i, rotate: `${((s.key * 37) % 7) - 3}deg` } as CSSProperties}>
            <span className="s2-stub-num">
              <Script text={pad2(s.scene.num)} size={14} />
            </span>
            <Script text={s.scene.name} size={15} />
            <Script text={s.at} size={11} className="s2-dim" />
          </li>
        ))}
      </ol>
    </div>
  );
}

const ARROWS: Record<string, string> = {
  ArrowLeft: 'M14 4L4 11L14 18Z',
  ArrowUp: 'M4 15L11 5L18 15Z',
  ArrowDown: 'M4 7L11 17L18 7Z',
  ArrowRight: 'M8 4L18 11L8 18Z',
};

function Tools({ loupe, toggle, keys }: { loupe: boolean; toggle: () => void; keys: Set<string> }) {
  return (
    <div className="s2-panel s2-tools">
      <PanelHead n={4} title="道具" />
      <div className="s2-tray">
        <button type="button" className="s2-loupe-btn" aria-pressed={loupe} aria-label="読み解きルーペ" onClick={toggle}>
          <svg viewBox="0 0 64 64" width={56} height={56} aria-hidden="true">
            <rect x={36} y={38} width={12} height={26} rx={5} fill="#7a5b44" transform="rotate(-45 42 51)" />
            <circle cx={26} cy={26} r={20} fill="#a98055" />
            <circle cx={26} cy={26} r={14} fill="#d8eef0" />
          </svg>
        </button>
        <div className="s2-keys">
          {Object.entries(ARROWS).map(([k, d]) => (
            <kbd key={k} data-down={keys.has(k) || undefined} className={`s2-key s2-${k}`}>
              <svg viewBox="0 0 22 22" width={18} height={18} aria-hidden="true">
                <path d={d} fill="currentColor" />
              </svg>
            </kbd>
          ))}
          <kbd data-down={keys.has('l') || undefined} className="s2-key s2-keyL">
            <svg viewBox="0 0 22 22" width={18} height={18} aria-hidden="true">
              <circle cx={9} cy={9} r={6} fill="currentColor" />
              <rect x={12} y={13} width={4} height={8} rx={2} fill="currentColor" transform="rotate(-45 14 17)" />
            </svg>
          </kbd>
        </div>
      </div>
    </div>
  );
}

function App() {
  const rootRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const discRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const compRefs = useRef(new Map<SceneId, HTMLDivElement>());

  const pose = useRef({ yaw: spring(0), pitch: spring(0) });
  const pointer = useRef({ x: 0, y: 0, sx: 0, sy: 0, cx: -1e4, cy: -1e4 });
  const targetRef = useRef<SceneId>('s01');
  const movingRef = useRef(false);
  const loupeRef = useRef(false);
  const t0 = useRef(performance.now());
  const stubKey = useRef(0);

  const [target, setTarget] = useState<SceneId>('s01');
  const [moving, setMoving] = useState(false);
  const [stubs, setStubs] = useState<Stub[]>([]);
  const [loupe, setLoupe] = useState(false);
  const [keys, setKeys] = useState(() => new Set<string>());

  const logStub = useCallback((id: SceneId) => {
    const s = Math.floor((performance.now() - t0.current) / 1000);
    const at = `${pad2(Math.floor(s / 60))}:${pad2(s % 60)}`;
    setStubs((prev) => [{ key: stubKey.current++, scene: sceneById(id), at }, ...prev].slice(0, STUBS));
  }, []);

  const goTo = useCallback((id: SceneId) => {
    const { yaw, pitch } = pose.current;
    const s = sceneById(id);
    if (id === targetRef.current) return;
    if (s.theta === null) pitch.target = -90;
    else {
      pitch.target = 0;
      yaw.target += wrapDeg(-s.theta - yaw.target);
    }
    if (reduced) {
      yaw.x = yaw.target;
      pitch.x = pitch.target;
      yaw.v = pitch.v = 0;
      const view = viewRef.current!;
      view.classList.remove('s2-cut');
      void view.offsetWidth;
      view.classList.add('s2-cut');
    }
    targetRef.current = id;
    movingRef.current = true;
    setTarget(id);
    setMoving(true);
  }, []);

  /** The compartment currently facing front (or under the attic). */
  const frontTheta = () => mod360(-pose.current.yaw.target);
  const turn = useCallback((dir: -1 | 1) => goTo(sceneAtTheta(frontTheta() + dir * 90).id), [goTo]);
  const toFront = useCallback(() => goTo(sceneAtTheta(frontTheta()).id), [goTo]);
  const toBack = useCallback(() => goTo(sceneAtTheta(frontTheta() + 180).id), [goTo]);
  const toAttic = useCallback(() => goTo('s05'), [goTo]);
  const toggleLoupe = useCallback(() => {
    loupeRef.current = !loupeRef.current;
    if (!loupeRef.current) clearLoupe();
    setLoupe(loupeRef.current);
  }, []);

  useEffect(() => logStub('s01'), [logStub]);

  useEffect(() => {
    const root = rootRef.current!;
    const fit = () => {
      const k = Math.min(root.clientWidth / 1320, root.clientHeight / 700);
      root.style.setProperty('--fit', String(Math.max(0.4, k)));
    };
    const ro = new ResizeObserver(fit);
    ro.observe(root);
    fit();

    const move = (e: PointerEvent) => {
      const r = root.getBoundingClientRect();
      const p = pointer.current;
      p.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      p.y = ((e.clientY - r.top) / r.height) * 2 - 1;
      p.cx = e.clientX;
      p.cy = e.clientY;
    };
    const down = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (k === 'ArrowLeft') turn(-1);
      else if (k === 'ArrowRight') turn(1);
      else if (k === 'ArrowUp') toAttic();
      else if (k === 'ArrowDown') toFront();
      else if (k === 'l') toggleLoupe();
      else if (k === 'Escape' && loupeRef.current) toggleLoupe();
      else return;
      e.preventDefault();
      setKeys((s) => new Set(s).add(k));
    };
    const up = (e: KeyboardEvent) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      setKeys((s) => {
        if (!s.has(k)) return s;
        const n = new Set(s);
        n.delete(k);
        return n;
      });
    };
    const leave = () => {
      pointer.current.x = 0;
      pointer.current.y = 0;
    };
    root.addEventListener('pointermove', move);
    root.addEventListener('pointerleave', leave);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);

    let raf = 0;
    let last = performance.now();
    const lit = new Map<SceneId, number>();
    const frame = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      const { yaw, pitch } = pose.current;
      stepSpring(yaw, dt, ...TURN);
      stepSpring(pitch, dt, ...LIFT);

      const p = pointer.current;
      const ease = reduced ? 0 : Math.min(1, dt * 2.5);
      p.sx += (p.x - p.sx) * ease;
      p.sy += (p.y - p.sy) * ease;

      const up = clamp01(-pitch.x / 90);
      // Exaggerated on purpose: the box turns toward the pointer far enough to show its side.
      tiltRef.current!.style.transform = `rotateX(${(-p.sy * TILT[p.sy < 0 ? 1 : 2]).toFixed(3)}deg) rotateY(${(-p.sx * TILT[0]).toFixed(3)}deg)`;
      // Keep the open face (or the lid, when lifted) on the z = 0 plane so it is shown at its true size.
      boxRef.current!.style.transform = `translateZ(${(-W / 2 + up * (W / 2 - H / 2 - T)).toFixed(2)}px) rotateX(${pitch.x.toFixed(3)}deg)`;
      tableRef.current!.style.transform = `rotateY(${yaw.x.toFixed(3)}deg)`;
      discRef.current!.style.transform = `rotate(${(-yaw.x).toFixed(3)}deg)`;

      // Light each compartment by how squarely it faces the camera; the backdrop takes the mood
      // of whatever is in view, so a turn sweeps day into night.
      const weights = SCENES.map((s) => {
        if (s.theta === null) return up;
        const f = Math.max(0, Math.cos((yaw.x + s.theta) * DEG));
        return f * f * (1 - up);
      });
      const sum = weights.reduce((a, b) => a + b, 0) || 1;
      root.style.setProperty('--s2-bg', mixHex(SCENES.map((s, i) => [s.bg, weights[i] / sum])));
      SCENES.forEach((s, i) => {
        const el = compRefs.current.get(s.id);
        if (!el) return;
        const facing = s.theta === null ? up : Math.max(0, Math.cos((yaw.x + s.theta) * DEG)) * (1 - up);
        const l = 0.5 + 0.5 * facing;
        if (Math.abs((lit.get(s.id) ?? -1) - l) > 0.004) {
          lit.set(s.id, l);
          el.style.setProperty('--lit', l.toFixed(3));
        }
        el.toggleAttribute('data-live', weights[i] > 0.9);
        el.toggleAttribute('data-front', weights[i] > 0.3);
      });

      if (movingRef.current && settled(yaw) && settled(pitch)) {
        movingRef.current = false;
        setMoving(false);
        logStub(targetRef.current);
      }

      if (loupeRef.current) {
        const r = root.getBoundingClientRect();
        lensRef.current!.style.transform = `translate(${p.cx - r.left}px, ${p.cy - r.top}px)`;
        updateLoupe(p.cx, p.cy, LENS);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      root.removeEventListener('pointermove', move);
      root.removeEventListener('pointerleave', leave);
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [logStub, turn, toAttic, toFront, toggleLoupe]);

  const setComp = (id: SceneId) => (el: HTMLDivElement | null) => {
    if (el) compRefs.current.set(id, el);
    else compRefs.current.delete(id);
  };

  const s02 = sceneById('s02');
  const s03 = sceneById('s03');
  const s04 = sceneById('s04');

  return (
    <div className={`s2${loupe ? ' s2-holding' : ''}`} ref={rootRef} style={{ '--lens': `${LENS}px` } as CSSProperties}>
      <PaperDefs />
      <div className="s2-backdrop s2-tex" />
      <div className="s2-view" ref={viewRef}>
        <div className="s2-tilt" ref={tiltRef}>
          <div className="s2-box" ref={boxRef}>
            <div className="s2-table" ref={tableRef}>
              <Compartment theta={0} surfaces={storefrontSurfaces} ref={setComp('s01')}>
                <Storefront go={turn} toAttic={toAttic} toBack={toBack} />
              </Compartment>
              <Compartment theta={90} surfaces={placeholderSurfaces('#27306a', '#2f3a5e', '#1c2246')} ref={setComp('s02')}>
                <Placeholder scene={s02} go={turn} />
              </Compartment>
              <Compartment theta={180} surfaces={placeholderSurfaces('#e8c49c', '#b9845a', '#a8754f')} ref={setComp('s03')}>
                <Placeholder scene={s03} go={turn} />
              </Compartment>
              <Compartment theta={270} surfaces={placeholderSurfaces('#f9e0cf', '#e9c9a0', '#d8a97f')} ref={setComp('s04')}>
                <Placeholder scene={s04} go={turn} />
              </Compartment>
            </div>
            <Attic ref={setComp('s05')}>
              <AtticSky scene={sceneById('s05')} down={toFront} />
            </Attic>
          </div>
        </div>
      </div>

      <StatusTag scene={sceneById(target)} moving={moving} />
      <Dial target={target} pick={goTo} discRef={discRef} />
      <Stubs stubs={stubs} />
      <Tools loupe={loupe} toggle={toggleLoupe} keys={keys} />

      <div className="s2-lens" ref={lensRef} hidden={!loupe} aria-hidden="true">
        <i />
      </div>
    </div>
  );
}

export const mount: Mount = (el) => {
  const root = createRoot(el);
  root.render(<App />);
  return () => root.unmount();
};
