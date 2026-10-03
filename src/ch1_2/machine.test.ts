import { describe, expect, it } from 'vitest';
import {
  AUTO_MS,
  BLOCK_PATIENCE_MS,
  BREATH_MS,
  CATCH_MS,
  DOOR_HOLD_MS,
  HEARD_MS,
  START_CRAYONS,
  STATIONS,
  STATION_WAIT_MS,
  WAKE_MIN_MS,
  atBlock,
  canRun,
  ch12Reducer,
  initialCh12,
  isNear,
  route1,
  route2,
  searchAt,
  type Ch12Action,
  type Ch12State,
  type HideSpot,
} from './machine';
import { walkAt, type Marks } from './walk';

type Timeless<A> = A extends { now: number } ? Omit<A, 'now'> : never;
type A = Timeless<Ch12Action>;

const act = (s: Ch12State, now: number, ...actions: A[]): Ch12State =>
  actions.reduce((acc, a) => ch12Reducer(acc, { ...a, now } as Ch12Action), s);

/** Tick every 100 ms from `from` to `to`; `breathe(t)` says whether Theo is holding his breath then. */
function run(s: Ch12State, from: number, to: number, holding: (t: number) => boolean = () => false): Ch12State {
  let st = s;
  for (let t = from; t <= to; t += 100) {
    if (st.beat !== 'hide') break;
    const h = holding(t);
    if (h && st.holdingSince === null) st = act(st, t, { type: 'breath', holding: true });
    if (!h && st.holdingSince !== null) st = act(st, t, { type: 'breath', holding: false });
    st = act(st, t, { type: 'tick' });
  }
  return st;
}

/** Holds his breath exactly while it is close (plus a little either side), never longer than he can. */
function holdWhenNear(s0: Ch12State) {
  const nearAt = (t: number) => searchAt(s0.route, t - s0.routeAt).near;
  return (t: number) => nearAt(t) || nearAt(t + 400);
}

const hiding = (spot: HideSpot, round: 1 | 2 = 1, at = 0) => ch12Reducer(initialCh12(0), { type: 'jump', beat: 'hide', spot, round, at, now: 0 });

describe('Chapter 1.2: the way in', () => {
  it('nothing happens out of order', () => {
    const s = initialCh12(0);
    expect(act(s, 10, { type: 'struggle' }, { type: 'enterGarage' }, { type: 'hide', spot: 'tent' }, { type: 'run' }).beat).toBe('title');
  });

  it('title, struggle three times, tumble, yard, catch, choose', () => {
    let t = 0;
    let s = initialCh12(t);
    s = act(s, (t += AUTO_MS.title!), { type: 'tick' });
    expect(s.beat).toBe('carried');
    s = act(s, (t += 300), { type: 'struggle' }, { type: 'struggle' });
    expect(s.beat).toBe('carried');
    s = act(s, (t += 300), { type: 'struggle' });
    expect(s.beat).toBe('tumble');
    s = act(s, (t += AUTO_MS.tumble!), { type: 'tick' });
    expect(s.beat).toBe('yard');
    s = act(s, (t += 500), { type: 'enterGarage' });
    expect(s.beat).toBe('catch');
    s = act(s, (t += CATCH_MS), { type: 'tick' });
    expect(s.beat).toBe('choose');
    s = act(s, (t += 500), { type: 'hide', spot: 'buggy' });
    expect(s.beat).toBe('hide');
    expect(s.hideSpot).toBe('buggy');
    expect(s.firstSpot).toBe('buggy');
  });

  it('the yard moves on by itself if the player does nothing', () => {
    const s = ch12Reducer(initialCh12(0), { type: 'jump', beat: 'yard', now: 0 });
    expect(act(s, AUTO_MS.yard!, { type: 'tick' }).beat).toBe('catch');
  });
});

describe('Chapter 1.2: hiding, round 1', () => {
  it.each(['tent', 'buggy'] as const)('%s: holding his breath while it is close gets him through, to sleep', (spot) => {
    const s0 = hiding(spot);
    const s = run(s0, 0, 60_000, holdWhenNear(s0));
    expect(s.beat).toBe('sleep');
    expect(s.crayons).toBe(START_CRAYONS);
    expect(s.fails).toBe(0);
  });

  it('breathing while it stands close: it hears him, he loses a crayon, and the hiding starts again', () => {
    let s = run(hiding('buggy'), 0, 40_000);
    expect(s.beat).toBe('caught');
    expect(s.crayons).toBe(START_CRAYONS - 1);
    expect(s.lostCrayon).toBe(true);
    const at = s.beatAt;
    s = act(s, at + AUTO_MS.caught!, { type: 'tick' });
    expect(s.beat).toBe('hide');
    expect(s.hideSpot).toBe('buggy');
    expect(s.routeAt).toBe(at + AUTO_MS.caught!);
    expect(s.noiseMs).toBe(0);
  });

  it('the false alarm (it stops short) is only deadly in the buggy: the tent\'s shirts muffle a short pause', () => {
    const pause = route1('tent').find((l) => l.near)!;
    const length = pause.leave - pause.from;
    expect(length).toBeGreaterThan(HEARD_MS.buggy);
    expect(length).toBeLessThan(HEARD_MS.tent);
    const breathing = (spot: HideSpot) => run(hiding(spot), 0, pause.leave - 100);
    expect(breathing('buggy').beat).toBe('caught');
    expect(breathing('tent').beat).toBe('hide');
  });

  it('breathing while it is far away is safe', () => {
    const s0 = hiding('tent');
    // up to the moment it stops short, nothing is near
    const s = run(s0, 0, 8_700);
    expect(s.beat).toBe('hide');
    expect(isNear(s, 8_700)).toBe(false);
  });

  it('he can never go under one crayon', () => {
    let s = hiding('tent');
    s = { ...s, crayons: 1 };
    s = run(s, 0, 40_000);
    expect(s.beat).toBe('caught');
    expect(s.crayons).toBe(1);
    expect(s.lostCrayon).toBe(false);
  });

  it('holding too long forces the breath out: heard if it is close, harmless if it is not', () => {
    const near = hiding('tent');
    const nearAt = 10_400 + 5_200;
    let s = act(near, nearAt, { type: 'tick' });
    s = act(s, nearAt + 100, { type: 'breath', holding: true });
    s = act(s, nearAt + 100 + BREATH_MS, { type: 'tick' });
    expect(s.beat).toBe('caught');

    let far = hiding('tent');
    far = act(far, 2_100, { type: 'breath', holding: true });
    far = act(far, 2_100 + BREATH_MS, { type: 'tick' });
    expect(far.beat).toBe('hide');
    expect(far.holdingSince).toBeNull();
    // and he is winded for a moment
    expect(act(far, 2_100 + BREATH_MS + 100, { type: 'breath', holding: true }).holdingSince).toBeNull();
    expect(act(far, 2_100 + BREATH_MS + 1_000, { type: 'breath', holding: true }).holdingSince).not.toBeNull();
  });

  it('breath actions are ignored outside the hiding', () => {
    const s = initialCh12(0);
    expect(act(s, 5, { type: 'breath', holding: true })).toBe(s);
  });
});

describe('Chapter 1.2: sleep, wake, outside', () => {
  const asleep = () => run(hiding('tent'), 0, 60_000, holdWhenNear(hiding('tent')));

  it('sleep, then he wakes into the last scene of 1.1; he can only crawl out once the steps have passed', () => {
    let s = asleep();
    expect(s.beat).toBe('sleep');
    s = act(s, s.beatAt + AUTO_MS.sleep!, { type: 'tick' });
    expect(s.beat).toBe('wake');
    expect(act(s, s.beatAt + 1_000, { type: 'crawl' }).beat).toBe('wake');
    s = act(s, s.beatAt + WAKE_MIN_MS, { type: 'crawl' });
    expect(s.beat).toBe('outside');
    expect(s.station).toBe(0);
  });

  it('three stops; only at the last, after the steps return, can he run home', () => {
    let s = ch12Reducer(initialCh12(0), { type: 'jump', beat: 'outside', now: 0 });
    let t = 0;
    s = act(s, (t += 100), { type: 'home' });
    expect(s.beat).toBe('outside');
    for (let i = 1; i < STATIONS; i++) s = act(s, (t += 500), { type: 'onward' });
    expect(s.station).toBe(STATIONS - 1);
    s = act(s, (t += 500), { type: 'onward' });
    expect(s.station).toBe(STATIONS - 1);
    expect(act(s, t + 500, { type: 'home' }).beat).toBe('outside');
    s = act(s, t + STATION_WAIT_MS, { type: 'home' });
    expect(s.beat).toBe('slam');
    expect(s.round).toBe(2);
    s = act(s, s.beatAt + AUTO_MS.slam!, { type: 'tick' });
    expect(s.beat).toBe('choose');
  });
});

describe('Chapter 1.2: hiding, round 2', () => {
  const doorway = (spot: HideSpot, first: HideSpot) => {
    const s = { ...hiding(spot, 2), firstSpot: first };
    const r = route2(spot, first);
    return { s: { ...s, route: r }, blockAt: r[r.length - 1].arrive };
  };

  it('it ends up standing in the doorway', () => {
    const { s, blockAt } = doorway('tent', 'tent');
    const t = blockAt + 200;
    expect(atBlock(s, t)).toBe(true);
    expect(atBlock(s, blockAt - 500)).toBe(false);
  });

  it('it checks the place it found him first: close if he chose the same one, far if the other', () => {
    expect(route2('tent', 'tent')[1].near).toBe(true);
    expect(route2('buggy', 'tent')[1].near).toBe(false);
  });

  it('a throw is only possible while it stands in the doorway', () => {
    const { s } = doorway('tent', 'tent');
    expect(act(s, 3_000, { type: 'throw', target: 'cans' })).toBe(s);
  });

  it('thrown into the cans: it goes there, the way out opens, and he can run', () => {
    const { s, blockAt } = doorway('buggy', 'tent');
    let t = blockAt + 500;
    let st = act(s, t, { type: 'throw', target: 'cans' });
    expect(st.throws).toBe(1);
    expect(canRun(st, t + 500)).toBe(false);
    expect(act(st, t + 500, { type: 'run' }).beat).toBe('hide');
    t += 900 + 5_200 + 100;
    expect(canRun(st, t)).toBe(true);
    st = act(st, t, { type: 'run' });
    expect(st.beat).toBe('run');
    st = act(st, st.beatAt + AUTO_MS.run!, { type: 'tick' });
    expect(st.beat).toBe('door');
  });

  it('too late: it comes back to the doorway, and a second throw works', () => {
    const { s, blockAt } = doorway('tent', 'tent');
    let st = act(s, blockAt + 500, { type: 'throw', target: 'cans' });
    const at = st.routeAt;
    const back = at + 900 + 5_200 + 9_000 + 5_200 + 100;
    expect(canRun(st, back)).toBe(false);
    expect(atBlock(st, back)).toBe(true);
    st = act(st, back, { type: 'throw', target: 'cans' });
    expect(st.throws).toBe(2);
  });

  it('a bad throw (near him) brings it to his hiding place: breathe there and he is heard, hold and it goes back', () => {
    const { s, blockAt } = doorway('tent', 'buggy');
    const st = act(s, blockAt + 500, { type: 'throw', target: 'wall' });
    expect(st.route[0].stop).toBe('tent');
    expect(st.route[0].near).toBe(true);
    const heard = run(st, st.routeAt, st.routeAt + 20_000);
    expect(heard.beat).toBe('caught');
    const held = run(st, st.routeAt, st.routeAt + 30_000, holdWhenNear(st));
    expect(held.beat).toBe('hide');
    expect(atBlock(held, held.routeAt + 30_000)).toBe(true);
  });

  it('standing in the doorway for ever is not safe: it comes in', () => {
    const { s, blockAt } = doorway('tent', 'tent');
    const near = run({ ...s, lastAt: blockAt }, blockAt, blockAt + BLOCK_PATIENCE_MS + 200);
    expect(near.beat).toBe('caught');
    const still = run({ ...s, lastAt: blockAt }, blockAt, blockAt + BLOCK_PATIENCE_MS - 1_000);
    expect(still.beat).toBe('hide');
  });

  it('being caught in round 2 starts round 2 again, not round 1', () => {
    const { s } = doorway('tent', 'tent');
    let st: Ch12State = { ...s, route: route2('tent', 'tent') };
    st = run(st, 0, 40_000);
    expect(st.beat).toBe('caught');
    st = act(st, st.beatAt + AUTO_MS.caught!, { type: 'tick' });
    expect(st.beat).toBe('hide');
    expect(st.round).toBe(2);
    expect(st.route).toEqual(route2('tent', 'tent'));
  });
});

describe('Chapter 1.2: the way home and the end', () => {
  it('the door has to be held shut, and letting go starts it over', () => {
    let s = ch12Reducer(initialCh12(0), { type: 'jump', beat: 'door', now: 0 });
    s = act(s, 100, { type: 'closeDoor', holding: true });
    s = act(s, 100 + DOOR_HOLD_MS - 200, { type: 'tick' });
    expect(s.beat).toBe('door');
    s = act(s, 100 + DOOR_HOLD_MS - 100, { type: 'closeDoor', holding: false });
    expect(s.closing).toBeNull();
    s = act(s, 5_000, { type: 'closeDoor', holding: true });
    s = act(s, 5_000 + DOOR_HOLD_MS, { type: 'tick' });
    expect(s.beat).toBe('glass');
    s = act(s, s.beatAt + AUTO_MS.glass!, { type: 'tick' });
    expect(s.beat).toBe('end');
  });
});

describe('where it is', () => {
  const marks: Marks = {
    enter: { x: 0, y: 0, s: 100 },
    mid: { x: 100, y: 0, s: 200 },
    tent: { x: 100, y: 100, s: 300 },
    buggy: { x: -100, y: 100, s: 300 },
    exit: { x: 0, y: 0, s: 100 },
    block: { x: 0, y: 0, s: 100 },
    cans: { x: 500, y: 0, s: 100 },
  };

  it('stays out of sight until the doors open, then walks from the doors to each stop', () => {
    const r = route1('tent');
    expect(walkAt(r, 500, marks, 'enter').visible).toBe(false);
    expect(walkAt(r, 2_100, marks, 'enter').visible).toBe(true);
    const mid = walkAt(r, 7_300, marks, 'enter');
    expect(mid.pos.x).toBe(100);
    expect(mid.arrived).toBe(true);
    const gone = walkAt(r, 60_000, marks, 'enter');
    expect(gone.pos).toEqual(marks.exit);
  });

  it('after a throw it starts from where it stood', () => {
    const r = [{ stop: 'cans' as const, from: 900, arrive: 6_100, leave: 15_100, near: false }, ...route2('tent', 'tent').slice(2)];
    const w = walkAt(r, 100, marks, 'block');
    expect(w.visible).toBe(true);
    expect(w.pos).toEqual(marks.block);
    expect(walkAt(r, 6_200, marks, 'block').pos).toEqual(marks.cans);
  });
});
