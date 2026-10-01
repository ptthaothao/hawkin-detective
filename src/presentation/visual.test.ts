import { describe, expect, it } from 'vitest';
import {
  CONTACT,
  DIARY_AND_RULE,
  EXPLORE_NORMAL,
  FINALE_ALL,
  FINALE_START,
  OPENING,
  run,
  TO_FINALE,
} from '../game/scripts';
import { CREATURE_POS, deriveVisual } from './visual';

const toOther = { type: 'TOGGLE_LIGHT' } as const;

describe('deriveVisual', () => {
  it('starts in a calm, lamp-lit room with the clock running', () => {
    const { state } = run([...OPENING]);
    const v = deriveVisual(state);
    expect(v).toMatchObject({ world: 'normal', lighting: 'lamp', dread: 0, creature: null, wallClock: 'running' });
  });

  it('the other side is seen by flashlight and is uneasy before anything hunts', () => {
    const { state } = run([...OPENING, ...EXPLORE_NORMAL, toOther]);
    const v = deriveVisual(state);
    expect(v.lighting).toBe('flashlight');
    expect(v.dread).toBeGreaterThan(0);
    expect(v.creature).toBeNull();
  });

  it('after contact the creature waits at the radio desk, and this side grows uneasy too', () => {
    const base = [...OPENING, ...EXPLORE_NORMAL, toOther, toOther, ...DIARY_AND_RULE, ...CONTACT];
    const normal = run(base);
    expect(deriveVisual(normal.state).dread).toBeGreaterThan(0);
    const other = run([...base, toOther]);
    const v = deriveVisual(other.state);
    expect(v.creature).toMatchObject(CREATURE_POS.desk);
    expect(v.dread).toBeGreaterThan(deriveVisual(normal.state).dread);
  });

  it('closing beat: while it walks past, dread is up on both sides and it is seen at the door', () => {
    const before = deriveVisual(run([...TO_FINALE]).state);
    const walking = run([...TO_FINALE, ...FINALE_START]);
    expect(deriveVisual(walking.state).dread).toBeGreaterThan(before.dread);
    const across = deriveVisual(run([...TO_FINALE, ...FINALE_START, toOther]).state);
    expect(across.creature).toMatchObject(CREATURE_POS.door);
    expect(across.dread).toBeGreaterThan(deriveVisual(walking.state).dread);
  });

  it('after the switch-off: it is gone and the room is calm', () => {
    const { state } = run([...TO_FINALE, ...FINALE_ALL.slice(0, 4)]);
    const v = deriveVisual(state);
    expect(v).toMatchObject({ world: 'normal', wallClock: 'running', dread: 0, creature: null });
  });

  it('then pitch dark on the other side until Theo turns his flashlight on', () => {
    const dark = run([...TO_FINALE, ...FINALE_ALL.slice(0, 5)]);
    expect(deriveVisual(dark.state).lighting).toBe('dark');
    const lit = run([...TO_FINALE, ...FINALE_ALL.slice(0, 6)]);
    expect(deriveVisual(lit.state).lighting).toBe('theo-light');
  });

  it('is pure: same state gives the same picture', () => {
    const { state } = run([...TO_FINALE, toOther]);
    expect(deriveVisual(state)).toEqual(deriveVisual(state));
  });
});
