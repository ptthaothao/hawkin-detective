/**
 * Chapter 1.1 — the night Theo is taken. A small beat machine, pure like Chapter 0's reducer:
 * every action carries `now`, and `tick` advances the beats that play on their own.
 *
 * There is no game over. Both hiding places end with Theo found; what the player does while
 * hiding only changes how it finds him (`outcome`), which Chapter 1.2 can read.
 */

export type Beat =
  /** 3:16. Theo comes back from the bathroom into his dark room. The radio hisses, its red light is on. */
  | 'back'
  /** The neighbour's dog barks. The player says "Mom?" — at 3:17, into the transmitting mic. */
  | 'bark'
  /** The radio surges. */
  | 'answer'
  /** Pitch dark: find the flashlight on the bed. */
  | 'torch'
  /** Something in the hallway. Shine the light at the door. */
  | 'look'
  /** It is there. Slam the door, switch the radio off. */
  | 'shut'
  /** Wardrobe or under the bed. */
  | 'choose'
  /** Seen from the hiding place: it comes in. Hold your breath while it is close. */
  | 'hide'
  /** The choked "Mmm…". */
  | 'mmm'
  | 'found'
  /** He screams; no sound comes out. Black. */
  | 'faint'
  /** Glimpses on its back: hallway, back door, fog, the old garage. */
  | 'carried'
  /** He wakes in the 1920 garage. */
  | 'awake'
  | 'end';

export type HideSpot = 'wardrobe' | 'bed';

/** How it found him. `held`: he held his breath the whole time and it found him anyway. */
export type Outcome = 'held' | 'heard' | 'gasped';

export interface Ch11State {
  beat: Beat;
  beatAt: number;
  sawIt: boolean;
  doorShut: boolean;
  radioOff: boolean;
  hideSpot: HideSpot | null;
  /** Hide beat: when the current breath-hold started, or null while breathing. */
  holdingSince: number | null;
  /** Hide beat: when he last let his breath go (or started breathing). */
  breathingSince: number | null;
  outcome: Outcome | null;
}

export type Ch11Action =
  | { type: 'tick'; now: number }
  | { type: 'call'; now: number }
  | { type: 'grabTorch'; now: number }
  | { type: 'shineDoor'; now: number }
  | { type: 'slamDoor'; now: number }
  | { type: 'radioOff'; now: number }
  | { type: 'hide'; spot: HideSpot; now: number }
  | { type: 'breath'; holding: boolean; now: number }
  | { type: 'finish'; now: number }
  /** Debug / URL presets: jump straight to a beat. */
  | { type: 'jump'; beat: Beat; spot?: HideSpot; now: number };

/** Beats that move on by themselves after this long. */
export const AUTO_MS: Partial<Record<Beat, number>> = {
  back: 6_500,
  answer: 3_800,
  mmm: 3_600,
  found: 5_200,
  faint: 3_000,
  carried: 9_000,
};

/** Hide beat timeline (ms from the start of the beat). Same step period as Chapter 0's closing beat. */
export const STEP_MS = 2_600;
export const DOOR_OPENS_MS = 2_000;
/** It reaches the hiding place: from here the player must not breathe. */
export const NEAR_AT_MS = 9_800;
/** How long it stands there before it makes its sound. */
export const NEAR_MS = 6_500;
/** A 7-year-old can't hold it longer than this. */
export const BREATH_MS = 8_000;
/** Breathing this long while it is close: it hears him. */
export const HEARD_MS = 1_400;
/** In the garage: its steps pass outside the doors, on its own route, while the second line is up. */
export const PASS_AT_MS = 2_300;
export const PASS_STEPS = 5;

const NEXT: Partial<Record<Beat, Beat>> = {
  back: 'bark',
  answer: 'torch',
  mmm: 'found',
  found: 'faint',
  faint: 'carried',
  carried: 'awake',
};

export function initialCh11(now = 0): Ch11State {
  return {
    beat: 'back',
    beatAt: now,
    sawIt: false,
    doorShut: false,
    radioOff: false,
    hideSpot: null,
    holdingSince: null,
    breathingSince: null,
    outcome: null,
  };
}

const go = (s: Ch11State, beat: Beat, now: number): Ch11State => ({ ...s, beat, beatAt: now });

/** It is standing at the hiding place. */
export const isNear = (s: Ch11State, now: number) => s.beat === 'hide' && now - s.beatAt >= NEAR_AT_MS;

function hideTick(s: Ch11State, now: number): Ch11State {
  const t = now - s.beatAt;
  if (t < NEAR_AT_MS) return s;
  const nearStart = s.beatAt + NEAR_AT_MS;
  const found = (outcome: Outcome) => go({ ...s, outcome, holdingSince: null }, 'mmm', now);
  if (s.holdingSince !== null) {
    if (now - s.holdingSince >= BREATH_MS) return found('gasped');
  } else if (now - Math.max(nearStart, s.breathingSince ?? nearStart) >= HEARD_MS) {
    return found('heard');
  }
  if (t >= NEAR_AT_MS + NEAR_MS) return found('held');
  return s;
}

export function ch11Reducer(s: Ch11State, a: Ch11Action): Ch11State {
  const { now } = a;
  switch (a.type) {
    case 'tick': {
      if (s.beat === 'hide') return hideTick(s, now);
      const ms = AUTO_MS[s.beat];
      const next = NEXT[s.beat];
      return ms !== undefined && next && now - s.beatAt >= ms ? go(s, next, now) : s;
    }
    case 'call':
      return s.beat === 'bark' ? go(s, 'answer', now) : s;
    case 'grabTorch':
      return s.beat === 'torch' ? go(s, 'look', now) : s;
    case 'shineDoor':
      return s.beat === 'look' ? go({ ...s, sawIt: true }, 'shut', now) : s;
    case 'slamDoor':
    case 'radioOff': {
      if (s.beat !== 'shut') return s;
      const next = a.type === 'slamDoor' ? { ...s, doorShut: true } : { ...s, radioOff: true };
      // Both done: there is nowhere left but to hide.
      return next.doorShut && next.radioOff ? go(next, 'choose', now) : next;
    }
    case 'hide':
      return s.beat === 'choose' ? go({ ...s, hideSpot: a.spot, breathingSince: now }, 'hide', now) : s;
    case 'breath': {
      if (s.beat !== 'hide') return s;
      if (a.holding) return s.holdingSince === null ? hideTick({ ...s, holdingSince: now }, now) : s;
      return s.holdingSince === null ? s : hideTick({ ...s, holdingSince: null, breathingSince: now }, now);
    }
    case 'finish':
      return s.beat === 'awake' ? go(s, 'end', now) : s;
    case 'jump': {
      const order: Beat[] = ['back', 'bark', 'answer', 'torch', 'look', 'shut', 'choose', 'hide', 'mmm', 'found'];
      const at = (b: Beat) => (order.includes(b) ? order.indexOf(b) : order.length);
      const past = (b: Beat) => at(b) < at(a.beat);
      return {
        ...initialCh11(now),
        beat: a.beat,
        sawIt: past('look'),
        doorShut: past('shut'),
        radioOff: past('shut'),
        hideSpot: past('choose') ? (a.spot ?? 'wardrobe') : null,
        breathingSince: a.beat === 'hide' ? now : null,
        outcome: past('hide') ? 'held' : null,
      };
    }
  }
}
