import { C6_UPDATE, CHIPS, CLUES, ECHOES, LIVE_FREQ } from './content';
import type { ChipId, ClueId, GameState, HintStage, RadioSignal, SlotId } from './types';

/** Doc §I, luật đếm vạch: 3 flickers + every player-controlled light-off. */
export const tally = (s: GameState): number => 3 + s.lightOffCount;

export const freq = (s: GameState): string => {
  const [a, b, c] = s.radio.wheels;
  return `${a}.${b}${c}`;
};

export const hasClue = (s: GameState, id: ClueId): boolean => s.clues.includes(id);

export function radioSignal(s: GameState): RadioSignal {
  if (!s.radio.on || s.radio.broken) return 'off';
  if (s.choice === 'A' && !s.rescued) return 'lure';
  const f = freq(s);
  if (f === LIVE_FREQ) return s.deductionSolved && !s.choice ? 'precall' : 'static';
  return ECHOES[f]?.signal ?? 'static';
}

export function clueText(s: GameState, id: ClueId): string {
  const base = CLUES[id].text;
  if (id === 'C5') {
    return [base, ...s.tallyLog.map((n, i) => `Lần ${i + 1}: ${n} vạch.`)].join('\n');
  }
  if (id === 'C6' && s.contactMade) return `${base}\n${C6_UPDATE}`;
  return base;
}

export function chipAvailable(s: GameState, chip: ChipId): boolean {
  const { sources } = CHIPS[chip];
  if (sources.length === 0) return s.lightOffCount > 0;
  return sources.some((c) => hasClue(s, c));
}

export function availableChips(s: GameState, slot: SlotId): ChipId[] {
  return (Object.keys(CHIPS) as ChipId[]).filter(
    (c) => CHIPS[c].slot === slot && chipAvailable(s, c),
  );
}

/** Doc §L: pick the stage by what the player is still missing. */
export function hintStage(s: GameState): HintStage | null {
  if (s.phase !== 'play' || s.endingReady) return null;
  if (s.flicker !== 'done') return null;
  if (s.lightOffCount === 0) return 'flip';
  if (!s.diaryFound) return 'diary';
  if (!s.contactMade) {
    if (!s.heardFreqs.includes('1.52') && !s.heardFreqs.includes('2.34')) return 'leap1';
    if (!hasClue(s, 'C2')) return 'hour';
    return 'minute';
  }
  if (!s.deductionSolved) {
    if (s.slots.A !== 'noi-vao-micro') return 'dedA';
    if (s.slots.C !== 'buc-tuong') return 'dedC';
    return 'dedD';
  }
  if (s.choice === 'B' && !s.flashlightGiven) return 'branchB';
  return null;
}

const HINT_FIRST_MS = 120_000;
const HINT_STEP_MS = 60_000;

/** Tiers unlocked so far: first after ~2 min without progress, then one more every ~60 s. */
export function hintTiersUnlocked(s: GameState, now: number): number {
  if (!hintStage(s)) return 0;
  const scale = s.debug ? 0.05 : 1;
  const stuck = now - s.lastProgressAt - HINT_FIRST_MS * scale;
  if (stuck < 0) return 0;
  return Math.min(3, 1 + Math.floor(stuck / (HINT_STEP_MS * scale)));
}

export const LURE_MS = 8_000;

/** Branch A: 0 = creature in the middle of the room, 1 = at the radio desk. */
export function lureProgress(s: GameState, now: number): number {
  if (s.lureStartedAt === null) return 0;
  return Math.min(1, (now - s.lureStartedAt) / LURE_MS);
}
