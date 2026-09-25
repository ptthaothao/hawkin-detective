import { C6_UPDATE, CHIPS, CLUES, ECHOES, LIVE_FREQ, RETURN_FIRST, STEPS, type DiscoveryId, type StepId } from './content';
import type { ChipId, ClueId, GameState, HintStage, HotspotId, RadioSignal, SlotId } from './types';

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
    if (!hasClue(s, 'C4')) return 'minute';
    return 'combine';
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

/** Everything slots A, C and D need has been seen, including what 3.17 brought to the desk. */
export const evidenceReady = (s: GameState): boolean =>
  s.contactMade && s.sawAftermath && s.wallAfterContact && hasClue(s, 'C3') && hasClue(s, 'C5') && hasClue(s, 'C6');

/** What the current step points at: a hotspot, the light switch, the Case File, or nothing. */
export type StepTarget = HotspotId | 'switch' | 'notebook' | null;

export interface Step {
  id: StepId;
  question: string;
  action: string;
  nudge: string;
  target: StepTarget;
}

const heard = (s: GameState, f: string) => s.heardFreqs.includes(f);
const wentLookingAfterContact = (s: GameState) =>
  s.lightOffsAtContact !== null && s.lightOffCount > s.lightOffsAtContact;

interface SpineStep {
  id: StepId;
  done: (s: GameState) => boolean;
  /** Target on this side / on the other side. */
  normal: StepTarget;
  other: StepTarget;
}

/**
 * Doc §R: the spine of Chapter 0 in story order. The current step is the first one not done yet,
 * so a player who finds things early simply skips ahead. Steps before contact are all done once
 * Theo has answered.
 */
const SPINE: SpineStep[] = [
  { id: 'check-radio', done: (s) => heard(s, '2.58') || s.contactMade, normal: 'radio', other: 'switch' },
  { id: 'radio-why', done: (s) => s.dialNoticed || s.contactMade, normal: 'radio', other: 'switch' },
  { id: 'find-diary', done: (s) => s.diaryFound, normal: 'rug', other: 'os-floor' },
  {
    id: 'test-frequencies',
    done: (s) => heard(s, '1.52') || heard(s, '2.34') || s.contactMade,
    normal: 'radio',
    other: 'switch',
  },
  { id: 'investigate-0258', done: (s) => hasClue(s, 'C2') || s.contactMade, normal: 'watch', other: 'switch' },
  { id: 'find-minutes', done: (s) => hasClue(s, 'C4') || s.contactMade, normal: 'switch', other: 'os-clock' },
  { id: 'tune-night', done: (s) => s.contactMade, normal: 'radio', other: 'switch' },
  { id: 'find-theo', done: (s) => wentLookingAfterContact(s) || s.sawAftermath, normal: 'switch', other: null },
  // Across, the thing is standing at the desk: the most urgent question comes first.
  { id: 'investigate-creature', done: (s) => s.sawAftermath, normal: 'switch', other: 'os-desk' },
  { id: 'find-count', done: (s) => s.wallAfterContact, normal: 'switch', other: 'os-wall' },
  { id: 'reconstruct', done: (s) => s.deductionSolved, normal: 'notebook', other: 'notebook' },
];

function step(id: StepId, target: StepTarget): Step {
  return { id, target, ...STEPS[id] };
}

/** The next thing the player should do. Never how to solve it. */
export function currentStep(s: GameState): Step {
  const other = s.world === 'other';
  if (s.endingReady) return step('resolved', null);
  if (s.choice === 'A') return step('pull-theo', other ? 'os-wall' : 'switch');
  if (s.choice === 'B') {
    return s.flashlightGiven ? step('cross-over', 'switch') : step('help-theo', other ? 'switch' : 'rug');
  }
  if (s.deductionSolved) return step('choose', other ? 'switch' : 'radio');
  // The flicker is the one discovery that interrupts the spine: the player just saw something impossible.
  if (s.flicker === 'done' && s.lightOffCount === 0 && !s.contactMade) return step('glimpse', 'switch');
  const next = SPINE.find((st) => !st.done(s)) ?? SPINE[SPINE.length - 1];
  let current = step(next.id, other ? next.other : next.normal);
  // The thing to do is back in the lit room: the way there is the switch.
  if (other && next.other === 'switch' && next.normal !== 'switch') {
    current = { ...current, action: `${RETURN_FIRST} ${current.action[0].toLowerCase()}${current.action.slice(1)}` };
  }
  // Before Theo answers, standing in the dark copy of the room is its own question.
  return other && !s.contactMade ? { ...current, question: 'Nơi này là đâu?' } : current;
}

/** The story question on the player's mind right now. */
export const objective = (s: GameState): string => currentStep(s).question;

/** What the player has found out for certain, in story order. */
export function discoveries(s: GameState): DiscoveryId[] {
  const found: DiscoveryId[] = [];
  if (s.diaryFound && heard(s, '2.58') && (heard(s, '1.52') || heard(s, '2.34'))) found.push('echoes');
  if (s.lightOffCount > 0) found.push('other-side');
  if (s.contactMade) found.push('alive');
  if (s.sawAftermath) found.push('followed');
  if (s.deductionSolved) found.push('connected');
  return found;
}
