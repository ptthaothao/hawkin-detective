/**
 * Chapter 1.2 — a few minutes before the end of 1.1. Pure like Chapter 1.1's machine: every action
 * carries `now`, and `tick` advances whatever plays on its own.
 *
 * There is no game over. Being heard in the garage costs a crayon (never the last one) and the
 * hiding starts again: it finds him, sets him down like a sleeping child and leaves, then comes back.
 *
 * Two hides, same rules. In the first it searches and goes. In the second it comes back after the
 * door slams and then stands in the doorway, listening; what gets him out is the player's own idea,
 * a sound thrown into the cans in the far corner.
 */

export type Beat =
  /** "Vài phút trước". */
  | 'title'
  /** He wakes over its shoulder on the attic stairs. Struggle free. */
  | 'carried'
  /** Both fall down the stairs. */
  | 'tumble'
  /** The yard at night; it is getting up behind him. Run into the old garage. */
  | 'yard'
  /** Back against the garage door, catching his breath; the first steps. */
  | 'catch'
  /** Tent or buggy. */
  | 'choose'
  /** Hiding. Hold your breath while it is close. */
  | 'hide'
  /** It found him; black. */
  | 'caught'
  /** Round 1 survived: too tired, he falls asleep where he hides. */
  | 'sleep'
  /** He wakes: the last scene of Chapter 1.1, seen again. */
  | 'wake'
  /** Out in the dead town, three stops. */
  | 'outside'
  /** He runs back and the garage door slams. */
  | 'slam'
  /** Through the yard, into the house. */
  | 'run'
  /** The back door: close it softly. */
  | 'door'
  /** Through the glass: it stands in the yard and does not come in. */
  | 'glass'
  | 'end';

export type HideSpot = 'tent' | 'buggy';
export type Round = 1 | 2;
export type Stop = 'mid' | 'tent' | 'buggy' | 'block' | 'cans' | 'exit';
/** Where it starts from: the garage doors, or (after a throw) where it stood. */
export type From = 'enter' | Stop;

export type TargetId = 'cans' | 'wall';

export interface Leg {
  stop: Stop;
  /** It sets off from the last place at `from`, arrives at `arrive`, stands there until `leave`. */
  from: number;
  arrive: number;
  leave: number;
  /** Close enough to hear him breathe while it stands there. */
  near: boolean;
}

export interface Ch12State {
  beat: Beat;
  beatAt: number;
  round: Round;
  hideSpot: HideSpot | null;
  firstSpot: HideSpot | null;
  struggles: number;
  station: number;
  stationAt: number;
  crayons: number;
  fails: number;
  /** The last time it was caught it cost a crayon. */
  lostCrayon: boolean;
  holdingSince: number | null;
  breathingSince: number;
  /** After a long hold he cannot hold again until then. */
  windedUntil: number;
  /** How long he has breathed while it was close. */
  noiseMs: number;
  lastAt: number;
  route: Leg[];
  routeAt: number;
  routeFrom: From;
  /** How many times something has been thrown. */
  throws: number;
  closing: number | null;
}

export type Ch12Action =
  | { type: 'tick'; now: number }
  | { type: 'struggle'; now: number }
  | { type: 'enterGarage'; now: number }
  | { type: 'hide'; spot: HideSpot; now: number }
  | { type: 'breath'; holding: boolean; now: number }
  | { type: 'throw'; target: TargetId; now: number }
  | { type: 'crawl'; now: number }
  | { type: 'onward'; now: number }
  | { type: 'home'; now: number }
  | { type: 'run'; now: number }
  | { type: 'closeDoor'; holding: boolean; now: number }
  /** Debug / URL presets: jump straight to a beat, `at` ms into it. */
  | { type: 'jump'; beat: Beat; spot?: HideSpot; round?: Round; at?: number; now: number };

export const STEP_MS = 2_600;
export const DOOR_OPENS_MS = 2_000;
/** A 7-year-old can't hold it longer than this. */
export const BREATH_MS = 12_000;
/** After a hold this long he needs a moment to breathe. */
export const LONG_HOLD_MS = 6_000;
export const WINDED_MS = 900;
/** Breathing this long while it is close: it hears him. The tent's old shirts muffle him; the buggy's boards ring. */
export const HEARD_MS: Record<HideSpot, number> = { tent: 2_200, buggy: 1_200 };
export const START_CRAYONS = 3;

export const CATCH_MS = 17_000;
export const WAKE_MIN_MS = 16_000;
export const STATION_WAIT_MS = 4_500;
export const STATIONS = 3;
export const DOOR_HOLD_MS = 1_800;
/** In round 2 it stands in the doorway; if he does nothing for this long it comes for him. */
export const BLOCK_PATIENCE_MS = 22_000;
/** Show the way (the cans glow) after it has stood there this long. */
export const BLOCK_HINT_MS = 8_000;
export const CANS_LISTEN_MS = 9_000;
export const TURN_MS = 900;

export const AUTO_MS: Partial<Record<Beat, number>> = {
  title: 3_200,
  tumble: 3_400,
  yard: 14_000,
  caught: 7_000,
  sleep: 5_000,
  slam: 6_400,
  run: 6_000,
  glass: 11_000,
};

const NEXT: Partial<Record<Beat, Beat>> = {
  title: 'carried',
  tumble: 'yard',
  yard: 'catch',
  catch: 'choose',
  sleep: 'wake',
  slam: 'choose',
  run: 'door',
  glass: 'end',
};

/** Round 1: it comes in, looks round, stops short (a false alarm), checks the other place, then his, then leaves. */
export function route1(spot: HideSpot): Leg[] {
  const other: HideSpot = spot === 'tent' ? 'buggy' : 'tent';
  return [
    { stop: 'mid', from: DOOR_OPENS_MS, arrive: DOOR_OPENS_MS + 2 * STEP_MS, leave: 8_800, near: false },
    { stop: 'mid', from: 8_800, arrive: 8_800, leave: 10_400, near: true },
    { stop: other, from: 10_400, arrive: 10_400 + 2 * STEP_MS, leave: 23_400, near: true },
    { stop: spot, from: 23_400, arrive: 23_400 + STEP_MS, leave: 33_000, near: true },
    { stop: 'exit', from: 33_000, arrive: 33_000 + 2 * STEP_MS, leave: Infinity, near: false },
  ];
}

/** Round 2: it goes to the place it found him before, then stands in the doorway. */
export function route2(spot: HideSpot, first: HideSpot): Leg[] {
  const same = spot === first;
  const leave = 8_000 + 2 * STEP_MS + (same ? 7_000 : 4_500);
  return [
    { stop: 'mid', from: DOOR_OPENS_MS, arrive: DOOR_OPENS_MS + 2 * STEP_MS, leave: 8_000, near: false },
    { stop: first, from: 8_000, arrive: 8_000 + 2 * STEP_MS, leave, near: same },
    { stop: 'block', from: leave, arrive: leave + 2 * STEP_MS, leave: Infinity, near: false },
  ];
}

/** Something thrown: it turns, goes to the sound, listens, and only then goes back to the doorway. */
function routeThrown(target: TargetId, spot: HideSpot): Leg[] {
  const first: Leg =
    target === 'cans'
      ? { stop: 'cans', from: TURN_MS, arrive: TURN_MS + 2 * STEP_MS, leave: TURN_MS + 2 * STEP_MS + CANS_LISTEN_MS, near: false }
      : { stop: spot, from: TURN_MS, arrive: TURN_MS + 2 * STEP_MS, leave: TURN_MS + 2 * STEP_MS + 6_000, near: true };
  return [first, { stop: 'block', from: first.leave, arrive: first.leave + 2 * STEP_MS, leave: Infinity, near: false }];
}

export interface Search {
  /** Index into the route, or -1 before it sets off. */
  leg: number;
  walking: boolean;
  k: number;
  near: boolean;
}

/** Where it is in its search: walking a leg (k 0..1) or standing at a stop. */
export function searchAt(route: Leg[], t: number): Search {
  let i = route.findIndex((l) => t < l.leave);
  if (i < 0) i = route.length - 1;
  const l = route[i];
  if (t < l.from) return { leg: -1, walking: false, k: 0, near: false };
  if (t < l.arrive) return { leg: i, walking: true, k: (t - l.from) / (l.arrive - l.from), near: false };
  return { leg: i, walking: false, k: 1, near: l.near };
}

/** How many steps it has taken by `t` (one footstep sound each). */
export function stepsBy(route: Leg[], t: number): number {
  let n = 0;
  for (const l of route) for (let at = l.from; at < l.arrive; at += STEP_MS) if (t >= at) n++;
  return n;
}

export const routeTime = (s: Ch12State, now: number) => now - s.routeAt;
export const stopNow = (s: Ch12State, now: number) => {
  const at = searchAt(s.route, routeTime(s, now));
  return at.leg < 0 ? null : { stop: s.route[at.leg].stop, walking: at.walking };
};
/** It is close enough to hear him breathe. */
export const isNear = (s: Ch12State, now: number) => s.beat === 'hide' && searchAt(s.route, routeTime(s, now)).near;
/** Round 2: it stands in the doorway and nothing has drawn it off. */
export const atBlock = (s: Ch12State, now: number) => {
  const n = s.beat === 'hide' && s.round === 2 ? stopNow(s, now) : null;
  return !!n && n.stop === 'block' && !n.walking;
};
/** Round 2: it has gone to the sound; the way out is free. */
export const canRun = (s: Ch12State, now: number) => {
  const n = s.beat === 'hide' && s.round === 2 ? stopNow(s, now) : null;
  return !!n && n.stop === 'cans' && !n.walking;
};
/** How long it has been standing in the doorway. */
export const blockedFor = (s: Ch12State, now: number) => {
  if (!atBlock(s, now)) return 0;
  const leg = s.route[searchAt(s.route, routeTime(s, now)).leg];
  return routeTime(s, now) - leg.arrive;
};

export function initialCh12(now = 0): Ch12State {
  return {
    beat: 'title',
    beatAt: now,
    round: 1,
    hideSpot: null,
    firstSpot: null,
    struggles: 0,
    station: 0,
    stationAt: now,
    crayons: START_CRAYONS,
    fails: 0,
    lostCrayon: false,
    holdingSince: null,
    breathingSince: now,
    windedUntil: 0,
    noiseMs: 0,
    lastAt: now,
    route: [],
    routeAt: now,
    routeFrom: 'enter',
    throws: 0,
    closing: null,
  };
}

const go = (s: Ch12State, beat: Beat, now: number): Ch12State => ({ ...s, beat, beatAt: now });

function startHide(s: Ch12State, spot: HideSpot, now: number, at = 0): Ch12State {
  const first = s.round === 1 ? spot : (s.firstSpot ?? spot);
  return {
    ...go(s, 'hide', now - at),
    hideSpot: spot,
    firstSpot: first,
    route: s.round === 1 ? route1(spot) : route2(spot, first),
    routeAt: now - at,
    routeFrom: 'enter',
    holdingSince: null,
    breathingSince: now,
    windedUntil: 0,
    noiseMs: 0,
    lastAt: now,
  };
}

function caught(s: Ch12State, now: number): Ch12State {
  const lost = s.crayons > 1;
  return {
    ...go(s, 'caught', now),
    crayons: lost ? s.crayons - 1 : s.crayons,
    lostCrayon: lost,
    fails: s.fails + 1,
    holdingSince: null,
    noiseMs: 0,
  };
}

function hideTick(s: Ch12State, now: number): Ch12State {
  const t = routeTime(s, now);
  const dt = Math.min(100, Math.max(0, now - s.lastAt));
  const spot = s.hideSpot ?? 'tent';
  const at = searchAt(s.route, t);
  let st: Ch12State = { ...s, lastAt: now };

  // no one can hold it for ever: the breath that comes out is loud
  if (st.holdingSince !== null && now - st.holdingSince >= BREATH_MS) {
    st = { ...st, holdingSince: null, breathingSince: now, windedUntil: now + WINDED_MS };
    if (at.near) return caught(st, now);
  }
  const holding = st.holdingSince !== null;
  let noise = st.noiseMs;
  if (!at.near) noise = 0;
  else if (!holding) noise += dt;
  if (noise >= HEARD_MS[spot]) return caught(st, now);
  st = { ...st, noiseMs: noise };

  if (s.round === 1) {
    const exit = s.route[s.route.length - 1];
    if (t >= exit.arrive) return go({ ...st, holdingSince: null }, 'sleep', now);
  } else if (blockedFor(s, now) >= BLOCK_PATIENCE_MS) {
    // nothing drew it off: it stops listening and comes in
    return caught(st, now);
  }
  return st;
}

export function ch12Reducer(s: Ch12State, a: Ch12Action): Ch12State {
  const { now } = a;
  switch (a.type) {
    case 'tick': {
      if (s.beat === 'hide') return hideTick(s, now);
      if (s.beat === 'caught') return now - s.beatAt >= AUTO_MS.caught! ? startHide(s, s.hideSpot ?? 'tent', now) : s;
      if (s.beat === 'catch') return now - s.beatAt >= CATCH_MS ? go(s, 'choose', now) : s;
      if (s.beat === 'door' && s.closing !== null && now - s.closing >= DOOR_HOLD_MS) return go({ ...s, closing: null }, 'glass', now);
      const ms = AUTO_MS[s.beat];
      const next = NEXT[s.beat];
      return ms !== undefined && next && now - s.beatAt >= ms ? go(s, next, now) : s;
    }
    case 'struggle': {
      if (s.beat !== 'carried') return s;
      const struggles = s.struggles + 1;
      return struggles >= 3 ? go({ ...s, struggles }, 'tumble', now) : { ...s, struggles };
    }
    case 'enterGarage':
      return s.beat === 'yard' ? go(s, 'catch', now) : s;
    case 'hide':
      return s.beat === 'choose' ? startHide(s, a.spot, now) : s;
    case 'breath': {
      if (s.beat !== 'hide') return s;
      if (a.holding) return s.holdingSince === null && now >= s.windedUntil ? { ...s, holdingSince: now } : s;
      if (s.holdingSince === null) return s;
      const long = now - s.holdingSince >= LONG_HOLD_MS;
      return { ...s, holdingSince: null, breathingSince: now, windedUntil: long ? now + WINDED_MS : s.windedUntil };
    }
    case 'throw': {
      if (!atBlock(s, now)) return s;
      return {
        ...s,
        route: routeThrown(a.target, s.hideSpot ?? 'tent'),
        routeAt: now,
        routeFrom: 'block',
        noiseMs: 0,
        throws: s.throws + 1,
      };
    }
    case 'run':
      return canRun(s, now) ? go({ ...s, holdingSince: null }, 'run', now) : s;
    case 'crawl':
      return s.beat === 'wake' && now - s.beatAt >= WAKE_MIN_MS ? go({ ...s, station: 0, stationAt: now }, 'outside', now) : s;
    case 'onward':
      return s.beat === 'outside' && s.station < STATIONS - 1 ? { ...s, station: s.station + 1, stationAt: now } : s;
    case 'home':
      return s.beat === 'outside' && s.station === STATIONS - 1 && now - s.stationAt >= STATION_WAIT_MS ? go({ ...s, round: 2 }, 'slam', now) : s;
    case 'closeDoor': {
      if (s.beat !== 'door') return s;
      if (!a.holding) return s.closing === null ? s : { ...s, closing: null };
      return s.closing === null ? { ...s, closing: now } : s;
    }
    case 'jump': {
      const at = a.at ?? 0;
      const base: Ch12State = {
        ...initialCh12(now),
        round: a.round ?? 1,
        firstSpot: a.spot ?? null,
        hideSpot: a.spot ?? null,
      };
      if (a.beat === 'hide') return startHide(base, a.spot ?? 'tent', now, at);
      return go(base, a.beat, now - at);
    }
  }
}
