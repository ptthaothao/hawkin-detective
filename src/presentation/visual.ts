// GameState → VisualState. Everything the player sees or hears is derived from here;
// the reducer never knows about lighting, dread or where the creature is drawn.

import { lureProgress, radioSignal } from '../game/selectors';
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
  /** Branch A aftermath: the room on this side carries marks from the other side. */
  scarred: boolean;
}

/** Where the creature stands: middle of the room → desk (branch A) or → door (branch B). */
export const CREATURE_POS = {
  desk: { x: 66, y: 40 },
  middle: { x: 44, y: 44 },
  door: { x: 90, y: 40 },
};

function creature(s: GameState, now: number): CreatureVisual | null {
  if (!s.contactMade || s.rescued) return null;
  if (!s.deductionSolved) return { ...CREATURE_POS.desk, leaving: false };
  if (s.choice === 'A') {
    const p = lureProgress(s, now);
    const { middle: m, desk: d } = CREATURE_POS;
    return { x: m.x + (d.x - m.x) * p, y: m.y + (d.y - m.y) * p, leaving: false };
  }
  if (s.choice === 'B') return { ...CREATURE_POS.door, leaving: true };
  return { ...CREATURE_POS.middle, leaving: false };
}

function dread(s: GameState, now: number): number {
  if (s.phase !== 'play' || s.rescued) return 0;
  const hunted = s.contactMade && !s.theoLightSeen;
  if (s.world === 'normal') {
    if (s.choice === 'A') return 0.35;
    return hunted ? 0.12 : 0;
  }
  if (s.flashlightGiven) return s.theoLightSeen ? 0.1 : 0.3;
  if (!hunted) return 0.2;
  if (s.choice === 'A') return 0.55 + 0.45 * lureProgress(s, now);
  if (s.choice === 'B') return 0.3;
  return s.deductionSolved ? 0.6 : 0.45;
}

const CLARITY: Record<RadioSignal, number> = {
  off: 0,
  static: 0.15,
  echo1: 0.45,
  echo2: 0.45,
  echo3: 0.5,
  precall: 0.85,
  lure: 0.05,
};

function lighting(s: GameState): Lighting {
  if (s.world === 'normal') return 'lamp';
  if (!s.flashlightGiven) return 'flashlight';
  return s.theoLightSeen ? 'theo-light' : 'dark';
}

export function deriveVisual(s: GameState, now: number): VisualState {
  const d = dread(s, now);
  const signal = radioSignal(s);
  return {
    world: s.world,
    lighting: lighting(s),
    dread: d,
    creature: creature(s, now),
    radio: { signal, clarity: CLARITY[signal] * (1 - d * 0.6) },
    wallClock: s.rescued ? 'stopped' : 'running',
    scarred: s.rescued,
  };
}
