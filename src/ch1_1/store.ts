import { create } from 'zustand';
import { ch11Reducer, initialCh11, type Beat, type Ch11Action, type Ch11State, type HideSpot } from './machine';

type Timeless<A> = A extends Ch11Action ? Omit<A, 'now'> : never;

export const clock = () => performance.now();

interface Ch11Store {
  started: boolean;
  s: Ch11State;
  start: (jump?: { beat: Beat; spot?: HideSpot }) => void;
  dispatch: (a: Timeless<Ch11Action>) => void;
}

export const useCh11 = create<Ch11Store>((set) => ({
  started: false,
  s: initialCh11(0),
  start: (jump) => {
    const now = clock();
    const s = jump ? ch11Reducer(initialCh11(now), { type: 'jump', ...jump, now }) : initialCh11(now);
    set({ started: true, s });
  },
  dispatch: (a) =>
    set((st) => {
      const next = ch11Reducer(st.s, { ...a, now: clock() } as Ch11Action);
      return next === st.s ? st : { s: next };
    }),
}));
