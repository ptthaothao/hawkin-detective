import { DOOR_OPENS_MS, ROUTE, STEP_MS, searchAt, type Stop } from '../machine';

/** A place in a baked picture: where the floor is under it, and how many pixels a metre is there. */
export interface MarkPos {
  x: number;
  y: number;
  s: number;
}
export type Marks = Record<'enter' | Stop, MarkPos>;

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const ease = (x: number) => {
  const k = clamp01(x);
  return k * k * (3 - 2 * k);
};
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

export interface Walk {
  visible: boolean;
  pos: MarkPos;
  /** 0..1 through the current footstep while walking, 0 while standing. */
  stride: number;
  arrived: boolean;
  /** Which way it is going on screen: -1 left, 1 right. */
  dir: 1 | -1;
}

/** Where it is during its search: comes in at the door, walks in footsteps, stops at each place. */
export function walkAt(t: number, marks: Marks): Walk {
  const at = searchAt(t);
  if (at.leg < 0) return { visible: t >= DOOR_OPENS_MS, pos: marks.enter, stride: 0, arrived: false, dir: 1 };
  const leg = ROUTE[at.leg];
  const from = at.leg === 0 ? marks.enter : marks[ROUTE[at.leg - 1].stop];
  const to = marks[leg.stop];
  const steps = (leg.arrive - leg.from) / STEP_MS;
  const stepK = (Math.floor(at.k * steps) + ease((at.k * steps) % 1)) / steps;
  const k = at.walking ? Math.min(1, stepK) : 1;
  return {
    visible: true,
    pos: { x: lerp(from.x, to.x, k), y: lerp(from.y, to.y, k), s: lerp(from.s, to.s, k) },
    stride: at.walking ? ((((t - leg.from) / STEP_MS) % 1) + 1) % 1 : 0,
    arrived: !at.walking,
    dir: to.x < from.x ? -1 : 1,
  };
}
