import { STEP_MS, searchAt, type From, type Leg } from './machine';

/** A place in a baked picture: where the floor is under it, and how many pixels a metre is there. */
export interface Mark {
  x: number;
  y: number;
  s: number;
}
export type Marks = Record<string, Mark>;

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const ease = (x: number) => {
  const k = clamp01(x);
  return k * k * (3 - 2 * k);
};
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

export interface Walk {
  visible: boolean;
  pos: Mark;
  /** 0..1 through the current footstep while walking, 0 while standing. */
  stride: number;
  arrived: boolean;
  /** Which way it is going on screen: -1 left, 1 right. */
  dir: 1 | -1;
  /** The stop it is walking to or standing at, if it has set off. */
  stop: Leg['stop'] | null;
}

/** Where it is on its route: starts at `from`'s mark, walks in footsteps, stops at each place. */
export function walkAt(route: Leg[], t: number, marks: Marks, from: From): Walk {
  const at = searchAt(route, t);
  const start = marks[from];
  if (at.leg < 0) return { visible: from !== 'enter' || t >= (route[0]?.from ?? 0), pos: start, stride: 0, arrived: true, dir: 1, stop: null };
  const leg = route[at.leg];
  const prev = at.leg === 0 ? start : marks[route[at.leg - 1].stop];
  const to = marks[leg.stop];
  const steps = Math.max(1, (leg.arrive - leg.from) / STEP_MS);
  const stepK = (Math.floor(at.k * steps) + ease((at.k * steps) % 1)) / steps;
  const k = at.walking ? Math.min(1, stepK) : 1;
  return {
    visible: true,
    pos: { x: lerp(prev.x, to.x, k), y: lerp(prev.y, to.y, k), s: lerp(prev.s, to.s, k) },
    stride: at.walking ? ((((t - leg.from) / STEP_MS) % 1) + 1) % 1 : 0,
    arrived: !at.walking,
    dir: to.x < prev.x ? -1 : to.x > prev.x ? 1 : 1,
    stop: leg.stop,
  };
}
