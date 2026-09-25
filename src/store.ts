import { create } from 'zustand';
import { initialState, reducer } from './game/reducer';
import { run, type Step } from './game/scripts';
import { radioSignal } from './game/selectors';
import type { Action, GameState } from './game/types';
import type { DialogueLine } from './game/content';
import type { Transition } from './presentation/cues';
import type { Cue } from './audio/audio';

type Timeless<A> = A extends Action ? Omit<A, 'now'> : never;

export type Panel = null | 'radio' | 'casefile' | 'inspect' | 'floor' | 'hint';
export type InspectTarget = 'watch' | 'os-clock' | 'diary';
export type CaseTab = 'clues' | 'radio' | 'deduction';

/** UI-only state: which overlay is open etc. Never read by the reducer. */
export interface UiState {
  panel: Panel;
  inspect: InspectTarget | null;
  caseTab: CaseTab;
  diaryPage: number;
  showHotspots: boolean;
  /** Radio voice playback (Theo's lines). `start` is when the first line begins; before it is pre-roll. */
  subtitle: Subtitle | null;
  /** Scene transition currently playing (keyed by the fx id that started it). */
  transition: { kind: Transition; id: number } | null;
  sceneLocked: boolean;
  glitch: boolean;
  /** The radio on the desk is surging (arrival, something drawn to the signal). Keyed so it can replay. */
  surge: number | null;
}

export interface Subtitle {
  lines: DialogueLine[];
  start: number;
  preRollMs?: number;
  after?: string;
  hushCue?: Cue;
  endCue?: Cue;
}

/** Long lines stay up longer. */
export const lineMs = (line: DialogueLine) => Math.max(line.who === 'stage' ? 2_600 : 1_900, line.text.length * 62);

export type VoicePhase = 'surge' | 'hush' | 'speaking' | 'done';

/** Where playback is at `now`: static surge → silence → lines → done. */
export function voiceAt(sub: Subtitle, now: number): { phase: VoicePhase; index: number; sinceDone: number } {
  const t = now - sub.start;
  if (t < 0) return { phase: t < -(sub.preRollMs ?? 0) / 2 ? 'surge' : 'hush', index: -1, sinceDone: -1 };
  let acc = 0;
  for (let i = 0; i < sub.lines.length; i++) {
    acc += lineMs(sub.lines[i]);
    if (t < acc) return { phase: 'speaking', index: i, sinceDone: -1 };
  }
  return { phase: 'done', index: sub.lines.length, sinceDone: t - acc };
}

const initialUi: UiState = {
  panel: null,
  inspect: null,
  caseTab: 'clues',
  diaryPage: 0,
  showHotspots: false,
  subtitle: null,
  transition: null,
  sceneLocked: false,
  glitch: false,
  surge: null,
};

interface Store {
  game: GameState;
  ui: UiState;
  dispatch: (a: Timeless<Action>) => void;
  setUi: (patch: Partial<UiState>) => void;
  loadPreset: (steps: Step[]) => void;
  reset: () => void;
}

export const useStore = create<Store>((set) => ({
  game: initialState(),
  ui: initialUi,
  dispatch: (a) => set((st) => ({ game: reducer(st.game, { ...a, now: Date.now() } as Action) })),
  setUi: (patch) => set((st) => ({ ui: { ...st.ui, ...patch } })),
  loadPreset: (steps) =>
    set((st) => {
      const start = Date.now() - (steps.length + 1) * 1_000;
      const debugStart = reducer(initialState(), { type: 'BEGIN', debug: true, now: start });
      // Presets begin with BEGIN; skip it so the debug flag survives.
      const rest = steps[0]?.type === 'BEGIN' ? steps.slice(1) : steps;
      // Drop the last fx so presentation does not replay it (e.g. reopening the radio).
      const game = { ...run(rest, start, debugStart).state, fx: null };
      const panel = radioSignal(game) === 'precall' ? 'radio' : null;
      return { game, ui: { ...initialUi, panel, showHotspots: st.ui.showHotspots } };
    }),
  reset: () => set({ game: initialState(), ui: initialUi }),
}));
