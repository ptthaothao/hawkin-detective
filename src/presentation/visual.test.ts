import { describe, expect, it } from 'vitest';
import { BRANCH_A, CONTACT, DIARY_AND_RULE, EXPLORE_NORMAL, OPENING, run, TO_PRECHOICE } from '../game/scripts';
import { CREATURE_POS, deriveVisual } from './visual';

const toOther = { type: 'TOGGLE_LIGHT' } as const;

describe('deriveVisual', () => {
  it('starts in a calm, lamp-lit room with the clock running', () => {
    const { state, now } = run([...OPENING]);
    const v = deriveVisual(state, now);
    expect(v).toMatchObject({ world: 'normal', lighting: 'lamp', dread: 0, creature: null, wallClock: 'running' });
  });

  it('the other side is seen by flashlight and is uneasy before anything hunts', () => {
    const { state, now } = run([...OPENING, ...EXPLORE_NORMAL, toOther]);
    const v = deriveVisual(state, now);
    expect(v.lighting).toBe('flashlight');
    expect(v.dread).toBeGreaterThan(0);
    expect(v.creature).toBeNull();
  });

  it('after contact the creature waits at the radio desk, and this side grows uneasy too', () => {
    const base = [...OPENING, ...EXPLORE_NORMAL, toOther, toOther, ...DIARY_AND_RULE, ...CONTACT];
    const normal = run(base);
    expect(deriveVisual(normal.state, normal.now).dread).toBeGreaterThan(0);
    const other = run([...base, toOther]);
    const v = deriveVisual(other.state, other.now);
    expect(v.creature).toMatchObject(CREATURE_POS.desk);
    expect(v.dread).toBeGreaterThan(deriveVisual(normal.state, normal.now).dread);
  });

  it('branch A: dread climbs as the creature crosses to the desk', () => {
    const { state, now } = run([...TO_PRECHOICE, { type: 'CHOOSE', option: 'A' }, toOther]);
    const early = deriveVisual(state, now);
    const late = deriveVisual(state, now + 7_000);
    expect(late.dread).toBeGreaterThan(early.dread);
    expect(late.creature!.x).toBeGreaterThan(early.creature!.x);
    expect(late.radio.clarity).toBeLessThan(0.1);
  });

  it('branch A aftermath: the clock on this side has stopped and the room is scarred', () => {
    const { state, now } = run([...TO_PRECHOICE, ...BRANCH_A.slice(0, -1)]);
    const v = deriveVisual(state, now);
    expect(v).toMatchObject({ world: 'normal', wallClock: 'stopped', scarred: true, dread: 0, creature: null });
  });

  it('branch B: pitch dark without the flashlight until Theo turns it on', () => {
    const chosen = [...TO_PRECHOICE, { type: 'CHOOSE', option: 'B' } as const, { type: 'PLACE_FLASHLIGHT' } as const];
    const dark = run([...chosen, toOther]);
    expect(deriveVisual(dark.state, dark.now).lighting).toBe('dark');
    const lit = run([...chosen, toOther, { type: 'THEO_LIGHT' }]);
    expect(deriveVisual(lit.state, lit.now).lighting).toBe('theo-light');
  });

  it('is pure: same state and time give the same picture', () => {
    const { state, now } = run([...TO_PRECHOICE, toOther]);
    expect(deriveVisual(state, now)).toEqual(deriveVisual(state, now));
  });
});
