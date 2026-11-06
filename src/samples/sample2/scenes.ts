// Story: a promo site for a fictional storymonger. The site is a cut-paper box on a revolving
// stage; turning it shows each step of their work. Four compartments sit on the turntable and
// the attic sits on the lid.

export type SceneId = 's01' | 's02' | 's03' | 's04' | 's05';

export type Scene = {
  id: SceneId;
  num: number;
  /** Real copy. Rendered in the fictional script; readable through the loupe and by screen readers. */
  name: string;
  /** Turntable angle of the compartment (deg). `null` for the attic on the lid. */
  theta: number | null;
  /** Backdrop color behind the box; blended by how much each scene faces the camera. */
  bg: string;
};

export const SCENES: Scene[] = [
  { id: 's01', num: 1, name: '店先', theta: 0, bg: '#efe3cb' },
  { id: 's02', num: 2, name: '夜の採集', theta: 90, bg: '#1d2346' },
  { id: 's03', num: 3, name: '仕立て場', theta: 180, bg: '#d6a47c' },
  { id: 's04', num: 4, name: '書庫と配達', theta: 270, bg: '#f4d9c6' },
  { id: 's05', num: 5, name: '天井裏の空', theta: null, bg: '#131936' },
];

export const sceneById = (id: SceneId) => SCENES.find((s) => s.id === id)!;
export const sceneAtTheta = (theta: number) =>
  SCENES.find((s) => s.theta === ((theta % 360) + 360) % 360)!;

/** Box size in CSS px: a W x H x W cube. */
export const W = 800;
export const H = 520;
/** Depth of each side's room. Deeper than half the box on purpose: the box is fictional. */
export const D = 620;
/** Cardboard thickness shown on the cut edges. */
export const T = 16;
