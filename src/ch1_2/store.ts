import { create } from 'zustand';
import { ch12Reducer, initialCh12, type Beat, type Ch12Action, type Ch12State, type HideSpot, type Round } from './machine';

type Timeless<A> = A extends Ch12Action ? Omit<A, 'now'> : never;

export const clock = () => performance.now();

export interface Jump {
  beat: Beat;
  spot?: HideSpot;
  round?: Round;
  at?: number;
}

interface Ch12Store {
  started: boolean;
  s: Ch12State;
  start: (jump?: Jump) => void;
  dispatch: (a: Timeless<Ch12Action>) => void;
}

export const useCh12 = create<Ch12Store>((set) => ({
  started: false,
  s: initialCh12(0),
  start: (jump) => {
    const now = clock();
    const s = jump ? ch12Reducer(initialCh12(now), { type: 'jump', ...jump, now }) : initialCh12(now);
    set({ started: true, s });
  },
  dispatch: (a) =>
    set((st) => {
      const next = ch12Reducer(st.s, { ...a, now: clock() } as Ch12Action);
      return next === st.s ? st : { s: next };
    }),
}));
