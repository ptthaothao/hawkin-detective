// Scripted action sequences. Used by tests (playthroughs, invariants) and the ?debug jump menu,
// so every debug state is reached through the real reducer.

import { initialState, reducer } from './reducer';
import type { Action, GameState } from './types';

type Timeless<A> = A extends Action ? Omit<A, 'now'> : never;

export type Step =
  | Timeless<Action>
  | { type: 'TUNE'; freq: string }
  | { type: 'WAIT'; ms: number };

const STEP_MS = 1_000;

function tuneActions(s: GameState, target: string): Timeless<Action>[] {
  const want = [Number(target[0]), Number(target[2]), Number(target[3])];
  const out: Timeless<Action>[] = [];
  want.forEach((v, i) => {
    const index = i as 0 | 1 | 2;
    const diff = v - s.radio.wheels[i];
    for (let k = 0; k < Math.abs(diff); k++) {
      out.push({ type: 'RADIO_WHEEL', index, delta: diff > 0 ? 1 : -1 });
    }
  });
  return out;
}

export interface RunResult {
  state: GameState;
  /** Every state after each action, for invariant checks. */
  history: GameState[];
  now: number;
}

export function run(steps: Step[], start = 0, from: GameState = initialState()): RunResult {
  let state = from;
  let now = start;
  const history: GameState[] = [];
  const apply = (a: Timeless<Action>) => {
    now += STEP_MS;
    state = reducer(state, { ...a, now } as Action);
    history.push(state);
  };
  for (const st of steps) {
    if (st.type === 'WAIT') now += st.ms;
    else if (st.type === 'TUNE') tuneActions(state, st.freq).forEach(apply);
    else apply(st);
  }
  return { state, history, now };
}

export const OPENING: Step[] = [{ type: 'BEGIN' }, { type: 'START_PLAY' }];

export const EXPLORE_NORMAL: Step[] = [
  { type: 'INSPECT', id: 'flyer' },
  { type: 'INSPECT', id: 'watch' },
  { type: 'INSPECT', id: 'radio' },
  { type: 'FLICKER_DONE' },
  { type: 'RADIO_POWER', on: true },
];

export const FIRST_VISIT: Step[] = [
  { type: 'TOGGLE_LIGHT' },
  { type: 'INSPECT', id: 'os-wall' },
  { type: 'INSPECT', id: 'os-clock' },
  { type: 'INSPECT', id: 'os-floor' },
  { type: 'INSPECT', id: 'os-desk' },
  { type: 'TOGGLE_LIGHT' },
];

export const DIARY_AND_RULE: Step[] = [
  { type: 'INSPECT', id: 'rug' },
  { type: 'TUNE', freq: '2.34' },
  { type: 'TUNE', freq: '1.52' },
  { type: 'TUNE', freq: '3.00' },
];

export const CONTACT: Step[] = [{ type: 'TUNE', freq: '3.17' }];

export const DEDUCTION: Step[] = [
  { type: 'FILL_SLOT', slot: 'A', chip: 'noi-vao-micro' },
  { type: 'FILL_SLOT', slot: 'C', chip: 'buc-tuong' },
  { type: 'FILL_SLOT', slot: 'D', chip: 'tieng-radio' },
  { type: 'SUBMIT_DEDUCTION' },
];

export const BRANCH_A: Step[] = [
  { type: 'CHOOSE', option: 'A' },
  { type: 'TOGGLE_LIGHT' },
  { type: 'WAIT', ms: 9_000 },
  { type: 'INSPECT', id: 'os-wall' },
  { type: 'END' },
];

export const BRANCH_B: Step[] = [
  { type: 'CHOOSE', option: 'B' },
  { type: 'PLACE_FLASHLIGHT' },
  { type: 'TOGGLE_LIGHT' },
  { type: 'THEO_LIGHT' },
  { type: 'END' },
];

export const TO_PRECHOICE: Step[] = [
  ...OPENING,
  ...EXPLORE_NORMAL,
  ...FIRST_VISIT,
  ...DIARY_AND_RULE,
  ...CONTACT,
  ...DEDUCTION,
];

/** Jump points for the ?debug panel. */
export const DEBUG_PRESETS: { label: string; steps: Step[] }[] = [
  { label: 'Sau đèn chớp', steps: [...OPENING, ...EXPLORE_NORMAL] },
  { label: 'Đã sang bên kia 1 lần', steps: [...OPENING, ...EXPLORE_NORMAL, ...FIRST_VISIT] },
  {
    label: 'Có nhật ký + quy luật',
    steps: [...OPENING, ...EXPLORE_NORMAL, ...FIRST_VISIT, ...DIARY_AND_RULE],
  },
  {
    label: 'Đã liên lạc (mở deduction)',
    steps: [...OPENING, ...EXPLORE_NORMAL, ...FIRST_VISIT, ...DIARY_AND_RULE, ...CONTACT],
  },
  { label: 'Trước lúc chọn', steps: TO_PRECHOICE },
  { label: 'Nhánh A (đã chọn)', steps: [...TO_PRECHOICE, { type: 'CHOOSE', option: 'A' }] },
  { label: 'Nhánh B (đã chọn)', steps: [...TO_PRECHOICE, { type: 'CHOOSE', option: 'B' }] },
];
