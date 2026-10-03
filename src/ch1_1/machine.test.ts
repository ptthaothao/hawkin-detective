import { describe, expect, it } from 'vitest';
import {
  AUTO_MS,
  AT_DOOR_MS,
  BREATH_MS,
  GIVE_UP_MS,
  HEARD_MS,
  NEAR_AT_MS,
  ROUTE,
  stepsBy,
  ch11Reducer,
  initialCh11,
  type Ch11Action,
  type Ch11State,
  type HideSpot,
} from './machine';

type A = Ch11Action extends infer X ? (X extends { now: number } ? Omit<X, 'now'> : never) : never;

function play(s: Ch11State, now: number, ...actions: A[]): Ch11State {
  return actions.reduce((acc, a) => ch11Reducer(acc, { ...a, now } as Ch11Action), s);
}

/** Plays from the start to the moment Theo is hiding. */
function toHide(spot: HideSpot): { s: Ch11State; t: number } {
  let t = 0;
  let s = initialCh11(t);
  t += AUTO_MS.back!;
  s = play(s, t, { type: 'tick' });
  expect(s.beat).toBe('bark');
  s = play(s, (t += 500), { type: 'call' });
  expect(s.beat).toBe('answer');
  t += AUTO_MS.answer!;
  s = play(s, t, { type: 'tick' });
  s = play(s, (t += 500), { type: 'grabTorch' }, { type: 'shineDoor' });
  expect(s.sawIt).toBe(true);
  s = play(s, (t += 500), { type: 'slamDoor' });
  expect(s.beat).toBe('shut');
  s = play(s, (t += 500), { type: 'radioOff' });
  expect(s.beat).toBe('choose');
  s = play(s, (t += 500), { type: 'hide', spot });
  expect(s.beat).toBe('hide');
  return { s, t };
}

describe('Chapter 1.1', () => {
  it('nothing happens out of order: no "Mom?" before the dog barks, no hiding before the door is shut', () => {
    const s = initialCh11(0);
    expect(play(s, 10, { type: 'call' }, { type: 'grabTorch' }, { type: 'hide', spot: 'bed' }).beat).toBe('back');
  });

  it('door and radio can be done in either order', () => {
    const s = ch11Reducer(initialCh11(0), { type: 'jump', beat: 'shut', now: 0 });
    expect(play(s, 1, { type: 'radioOff' }, { type: 'slamDoor' }).beat).toBe('choose');
  });

  it('breathing while it is across the room is safe: it does not hear him at the desk', () => {
    let { s, t } = toHide('wardrobe');
    s = play(s, (t += NEAR_AT_MS - 100), { type: 'tick' });
    expect(s.beat).toBe('hide');
  });

  it('it searches, gives up, turns for the door, and hears the breath he lets go', () => {
    let { s, t } = toHide('wardrobe');
    const start = t;
    // breathe at the desk, hold while it is at the bed, breathe while it walks over, hold at the wardrobe
    s = play(s, (t = start + NEAR_AT_MS - 200), { type: 'breath', holding: true });
    s = play(s, (t = start + ROUTE[1].leave + 100), { type: 'breath', holding: false });
    s = play(s, (t = start + ROUTE[2].from + 1_000), { type: 'breath', holding: true });
    s = play(s, (t = start + GIVE_UP_MS - 10), { type: 'tick' });
    expect(s.beat).toBe('hide');
    // it gives up and turns away: he lets the breath out, and it hears it
    s = play(s, (t = start + GIVE_UP_MS + 900), { type: 'breath', holding: false });
    expect(s.beat).toBe('mmm');
    expect(s.outcome).toBe('gasped');
  });

  it('holding on past the moment it turns away: the breath comes out of him by the door at the latest', () => {
    let { s, t } = toHide('bed');
    const start = t;
    s = play(s, (t = start + ROUTE[2].from + 2_000), { type: 'breath', holding: true });
    s = play(s, start + AT_DOOR_MS, { type: 'tick' });
    expect(s.beat).toBe('mmm');
    expect(s.outcome).toBe('gasped');
  });

  it('it always finds him: no way to wait it out', () => {
    for (const spot of ['wardrobe', 'bed'] as const) {
      let { s, t } = toHide(spot);
      for (let k = 0; k < 400 && s.beat === 'hide'; k++) {
        const holding = Math.sin(k / 3) > 0;
        s = play(s, (t += 100), { type: 'breath', holding }, { type: 'tick' });
      }
      expect(s.beat).toBe('mmm');
    }
  });

  it('one footstep per step of its route', () => {
    expect(stepsBy(0)).toBe(0);
    expect(stepsBy(ROUTE[0].from)).toBe(1);
    expect(stepsBy(AT_DOOR_MS)).toBe(7);
  });

  it('breathing while it is close: it hears him', () => {
    let { s, t } = toHide('bed');
    s = play(s, (t += NEAR_AT_MS + HEARD_MS), { type: 'tick' });
    expect(s.outcome).toBe('heard');
  });

  it('holding too early runs out of air', () => {
    let { s, t } = toHide('bed');
    s = play(s, (t += NEAR_AT_MS - BREATH_MS + 1_000), { type: 'breath', holding: true });
    expect(s.beat).toBe('hide');
    s = play(s, t + BREATH_MS, { type: 'tick' });
    expect(s.outcome).toBe('gasped');
  });

  it('every hiding place and outcome ends in the garage, then the end card', () => {
    for (const spot of ['wardrobe', 'bed'] as const) {
      let { s, t } = toHide(spot);
      s = play(s, (t += NEAR_AT_MS + HEARD_MS), { type: 'tick' });
      for (const beat of ['mmm', 'found', 'faint', 'carried'] as const) {
        expect(s.beat).toBe(beat);
        s = play(s, (t += AUTO_MS[beat]!), { type: 'tick' });
      }
      expect(s.beat).toBe('awake');
      expect(s.hideSpot).toBe(spot);
      expect(play(s, t + 1, { type: 'finish' }).beat).toBe('end');
    }
  });

  it('jumping to a beat sets up what came before it', () => {
    const s = ch11Reducer(initialCh11(0), { type: 'jump', beat: 'hide', spot: 'bed', now: 5 });
    expect(s).toMatchObject({ beat: 'hide', sawIt: true, doorShut: true, radioOff: true, hideSpot: 'bed', outcome: null });
    expect(ch11Reducer(s, { type: 'jump', beat: 'awake', now: 6 }).outcome).toBe('gasped');
  });
});
