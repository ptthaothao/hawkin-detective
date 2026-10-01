// GameState → VisualState. Everything the player sees or hears is derived from here;
// the reducer never knows about lighting, dread or where the creature is drawn.

import { radioSignal } from '../game/selectors';
import type { GameState, RadioSignal, World } from '../game/types';

export type Lighting = 'lamp' | 'flashlight' | 'dark' | 'theo-light';

export interface CreatureVisual {
  /** % of the scene. */
  x: number;
  y: number;
  leaving: boolean;
}

export interface VisualState {
  world: World;
  lighting: Lighting;
  /** 0 = calm room … 1 = the thing is right next to you. Drives every instability effect. */
  dread: number;
  creature: CreatureVisual | null;
  radio: {
    signal: RadioSignal;
    /** 0 = pure noise … 1 = clean voice. */
    clarity: number;
  };
  wallClock: 'running' | 'stopped';
}

/** Where the creature stands: at the desk once it has answered the radio, at the door while it walks past. */
export const CREATURE_POS = {
  desk: { x: 66, y: 40 },
  middle: { x: 44, y: 44 },
  door: { x: 90, y: 40 },
};

function creature(s: GameState): CreatureVisual | null {
  if (!s.contactMade || s.hushed) return null;
  if (!s.deductionSolved) return { ...CREATURE_POS.desk, leaving: false };
  return { ...CREATURE_POS.door, leaving: false };
}

function dread(s: GameState): number {
  if (s.phase !== 'play') return 0;
  const hunted = s.contactMade && !s.hushed;
  if (s.world === 'normal') {
    if (!hunted) return 0;
    return s.finaleStartedAt !== null ? 0.3 : 0.12;
  }
  if (s.hushed) return s.theoLightSeen ? 0.1 : 0.3;
  if (!hunted) return 0.2;
  return s.deductionSolved ? 0.6 : 0.45;
}

const CLARITY: Record<RadioSignal, number> = {
  off: 0,
  static: 0.15,
  echo1: 0.45,
  echo2: 0.45,
  echo3: 0.5,
  precall: 0.85,
  steps: 0.3,
};

function lighting(s: GameState): Lighting {
  if (s.world === 'normal') return 'lamp';
  if (!s.hushed) return 'flashlight';
  return s.theoLightSeen ? 'theo-light' : 'dark';
}

export function deriveVisual(s: GameState): VisualState {
  const d = dread(s);
  const signal = radioSignal(s);
  return {
    world: s.world,
    lighting: lighting(s),
    dread: d,
    creature: creature(s),
    radio: { signal, clarity: CLARITY[signal] * (1 - d * 0.6) },
    wallClock: s.endingReady ? 'stopped' : 'running',
  };
}
