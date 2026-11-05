import { D, W, type SceneId } from './scenes';
import { ATTIC_D } from './stage';

// Point lights for the rooms. Light sources are hanging cut-outs (Hanger with `glow`); each frame
// their position is read back from the swing, then:
// - every surface gets a pool of light, from the exact irradiance of a point light on a plane
//   (cos / d^2, i.e. h / (r^2 + h^2)^1.5), painted as a radial gradient on its .s2-light layer;
// - every flat gets --glow / --warm from its distance to each light and which side it faces.
// Room frame as in stage.tsx: the window is at z = W/2, the back wall at W/2 - depth.

type LightSpec = {
  power: number;
  /** How much it warms what it reaches (sepia). */
  warmth: number;
  flicker?: boolean;
  /** A fixed light (a window, a cut-out moon) at this room position, in this `r g b`. Without
   * it the light is the next hanging cut-out marked `glow`, in hanger order. */
  at?: [number, number, number];
  rgb?: string;
};

type Rig = {
  /** Scales the room's own brightness, so the lights have darkness to work against. */
  ambient: number;
  lights: LightSpec[];
};

export const RIGS: Partial<Record<SceneId, Rig>> = {
  // Daylight, but still inside a box: dim enough that the hanging sun reads as the light.
  s01: { ambient: 0.78, lights: [{ power: 0.95, warmth: 0.18 }] },
  s02: {
    ambient: 0.72,
    lights: [
      { power: 1, warmth: 0.3, flicker: true },
      { power: 0.4, warmth: 0 },
    ],
  },
  // Light walls swallow a warm pool, so the room is dimmer and the lamps stronger than at night.
  s03: {
    ambient: 0.66,
    lights: [
      { power: 1.2, warmth: 0.3, flicker: true },
      { power: 1.05, warmth: 0.3, flicker: true },
    ],
  },
  // Morning sun through the round window on the back wall.
  s04: { ambient: 0.9, lights: [{ power: 0.9, warmth: 0.15, at: [0, -110, W / 2 - D + 40], rgb: '255 226 170' }] },
  // The crescent moon at the far end of the attic sky.
  s05: { ambient: 0.8, lights: [{ power: 0.8, warmth: 0, at: [170, -180, W / 2 - ATTIC_D + 60], rgb: '150 180 255' }] },
};

/** Distance at which a light of power 1 gives a pool of REF_ALPHA straight below it. */
const REF = 170;
const REF_ALPHA = 0.7;
const MAX_ALPHA = 0.78;
const FRONT = W / 2;

type Lamp = { x: number; y: number; z: number; rgb: string; power: number; warmth: number };

/** Gradient stops as multiples of the light's height above the plane. */
const STOPS = [0, 0.3, 0.6, 0.9, 1.3, 1.8, 2.4];

function pool(u: number, v: number, h: number, lamp: Lamp) {
  if (h <= 1) return '';
  const a0 = Math.min(MAX_ALPHA, lamp.power * REF_ALPHA * (REF / h) ** 2);
  const stops = STOPS.map((k) => {
    // cos / d^2 gives (1 + k^2)^-1.5; squared again to keep the pool's edge readable on paper.
    const a = a0 / (1 + k * k) ** 3;
    return `rgb(${lamp.rgb} / ${a.toFixed(3)}) ${(k * h).toFixed(1)}px`;
  });
  return `radial-gradient(circle at ${u.toFixed(1)}px ${v.toFixed(1)}px, ${stops.join(', ')}, transparent ${(2.6 * h).toFixed(1)}px)`;
}

/** Where the light's foot falls on each plane (u, v in the plane's own px) and its height above it. */
function onPlane(plane: string, l: Lamp, w: number, h: number, d: number): [number, number, number] {
  const back = FRONT - d;
  switch (plane) {
    case 'back':
      return [l.x + w / 2, l.y + h / 2, l.z - back];
    case 'floor':
      return [l.x + w / 2, l.z - back, h / 2 - l.y];
    case 'ceiling':
      return [l.x + w / 2, FRONT - l.z, l.y + h / 2];
    case 'left':
      return [FRONT - l.z, l.y + h / 2, l.x + w / 2];
    default:
      return [l.z - back, l.y + h / 2, w / 2 - l.x];
  }
}

/**
 * Points each cut-out's drop shadow away from the light that reaches it most, longer the closer
 * the light. Done once per room, from where the lights hang at rest: the paper filter re-runs
 * when the shadow changes, so it must not follow every swing.
 */
function castShadows(c: Cache, lamps: Lamp[]) {
  for (const f of c.flats) {
    let best: Lamp | null = null;
    let reach = 0;
    for (const l of lamps) {
      if (l.z < f.z) continue;
      const e = l.power / ((l.x - f.x) ** 2 + (l.y - f.y) ** 2 + (l.z - f.z) ** 2 + 1);
      if (e > reach) {
        reach = e;
        best = l;
      }
    }
    if (!best) continue;
    const dx = f.x - best.x;
    const dy = f.y - best.y;
    const len = Math.hypot(dx, dy) || 1;
    const dist = Math.hypot(dx, dy, best.z - f.z);
    const size = 3 + 6 * Math.min(1, REF / dist);
    f.el.style.setProperty('--sx', `${((dx / len) * size).toFixed(1)}px`);
    f.el.style.setProperty('--sy', `${((dy / len) * size).toFixed(1)}px`);
  }
}

const angle = (el: Element) => parseFloat(getComputedStyle(el).rotate) || 0;
/** Rotation carried in `transform` (the turntable's inertia on the knock layer), in degrees. */
const turned = (el: Element) => {
  const m = new DOMMatrix(getComputedStyle(el).transform);
  return (Math.atan2(m.b, m.a) * 180) / Math.PI;
};

type Cache = {
  room: HTMLElement;
  dims: [number, number, number];
  planes: HTMLElement[];
  hangers: HTMLElement[];
  flats: { el: HTMLElement; x: number; y: number; z: number; glow: number; warm: number }[];
  shadowed: boolean;
};
const caches = new WeakMap<HTMLElement, Cache>();

function cacheFor(comp: HTMLElement): Cache | null {
  let c = caches.get(comp);
  if (!c) {
    const room = comp.querySelector<HTMLElement>('.s2-room');
    if (!room) return null;
    c = {
      room,
      dims: room.dataset.room!.split(' ').map(Number) as [number, number, number],
      planes: [...room.querySelectorAll<HTMLElement>('.s2-light')],
      hangers: [...room.querySelectorAll<HTMLElement>('[data-light]')],
      flats: [...room.querySelectorAll<HTMLElement>('[data-at]')].map((el) => {
        const [x, y, z] = el.dataset.at!.split(' ').map(Number);
        return { el, x, y, z, glow: -1, warm: -1 };
      }),
      shadowed: false,
    };
    caches.set(comp, c);
  }
  return c;
}

/** Re-lights one room for this frame. `t` is seconds, for the lantern's flicker. */
export function lightRoom(comp: HTMLElement, rig: Rig, t: number) {
  const c = cacheFor(comp);
  if (!c) return;
  const [w, h, d] = c.dims;

  let hanger = 0;
  const lamps: Lamp[] = rig.lights.flatMap((spec): Lamp[] => {
    const flicker = spec.flicker ? 1 + Math.sin(t * 7.3) * 0.04 + Math.sin(t * 13.1 + 1.7) * 0.03 : 1;
    const power = spec.power * flicker;
    if (spec.at) {
      const [x, y, z] = spec.at;
      return [{ x, y, z, rgb: spec.rgb ?? '255 240 210', power, warmth: spec.warmth }];
    }
    const el = c.hangers[hanger++];
    if (!el) return [];
    const [hx, hz, drop] = el.dataset.hook!.split(' ').map(Number);
    const knock = el.firstElementChild!;
    const a = (angle(el) + angle(knock) + turned(knock)) * (Math.PI / 180);
    // The swing turns about the hook; positive CSS rotation moves the bottom to the left.
    return [{ x: hx - Math.sin(a) * drop, y: -h / 2 + Math.cos(a) * drop, z: hz, rgb: el.dataset.light!, power, warmth: spec.warmth }];
  });

  if (!c.shadowed) {
    castShadows(c, lamps);
    c.shadowed = true;
  }

  for (const el of c.planes) {
    el.style.background = lamps
      .map((l) => {
        const [u, v, ht] = onPlane(el.dataset.plane!, l, w, h, d);
        return pool(u, v, ht, l);
      })
      .filter(Boolean)
      .join(', ');
  }

  for (const f of c.flats) {
    let glow = 0;
    let warm = 0;
    for (const l of lamps) {
      const dx = l.x - f.x;
      const dy = l.y - f.y;
      const dz = l.z - f.z;
      const dist = Math.hypot(dx, dy, dz);
      // Cut-outs face the window (+z): lit from the front, only a little spill from behind.
      const facing = 0.2 + 0.8 * Math.max(0, dz / dist);
      const e = (l.power * facing * REF * REF) / (dist * dist + 60 * 60);
      glow += e * 0.55;
      warm += e * l.warmth;
    }
    glow = Math.min(1.1, glow);
    warm = Math.min(0.45, warm);
    if (Math.abs(glow - f.glow) > 0.005 || Math.abs(warm - f.warm) > 0.005) {
      f.glow = glow;
      f.warm = warm;
      f.el.style.setProperty('--glow', glow.toFixed(3));
      f.el.style.setProperty('--warm', warm.toFixed(3));
    }
  }
}
