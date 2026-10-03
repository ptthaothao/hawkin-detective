import { describe, expect, it } from 'vitest';
import { DOOR_OPENS_MS, ROUTE } from '../machine';
import { walkAt, type Marks } from './hide';

const marks: Marks = {
  enter: { x: 900, y: 700, s: 200 },
  desk: { x: 500, y: 800, s: 300 },
  other: { x: 400, y: 1100, s: 500 },
  spot: { x: 1100, y: 1500, s: 1000 },
  door: { x: 900, y: 780, s: 250 },
};

describe('walkAt', () => {
  it('is not there before the door opens', () => {
    expect(walkAt(DOOR_OPENS_MS - 1, marks).visible).toBe(false);
    expect(walkAt(DOOR_OPENS_MS, marks).visible).toBe(true);
  });
  it('stands on each mark when it arrives', () => {
    for (const leg of ROUTE) {
      const w = walkAt(leg.arrive + 1, marks);
      expect(w.arrived).toBe(true);
      expect(w.pos).toEqual(marks[leg.stop]);
    }
  });
  it('is between the marks while walking', () => {
    const leg = ROUTE[1];
    const w = walkAt((leg.from + leg.arrive) / 2, marks);
    expect(w.arrived).toBe(false);
    expect(w.pos.y).toBeGreaterThan(marks.desk.y);
    expect(w.pos.y).toBeLessThan(marks.other.y);
  });
});
