import { describe, expect, it } from 'vitest';
import { CHIPS, CLUES, CLUE_FOUND_PAIRED, DIARY_PAGES, NARRATION, STEPS, THEO_CONTACT, THEO_PRECALL } from './content';
import { FINALE_ALL, FINALE_START, run, TO_FINALE, type Step } from './scripts';
import { reducer } from './reducer';
import { currentStep, discoveries, evidenceReady, freq } from './selectors';

const at = (steps: Step[]) => run(steps).state;
const OPEN: Step[] = [{ type: 'BEGIN' }, { type: 'START_PLAY' }];
const LIGHT: Step = { type: 'TOGGLE_LIGHT' };
const I = (id: Extract<Step, { type: 'INSPECT' }>['id']): Step => ({ type: 'INSPECT', id });

/** A first-time player following each objective in turn. */
const HEAR: Step[] = [...OPEN, I('radio')];
const NOTICE: Step[] = [...HEAR, { type: 'NOTICE_DIAL' }];
const DIARY: Step[] = [...NOTICE, I('rug')];
const ECHO: Step[] = [...DIARY, { type: 'TUNE', freq: '2.34' }];
const WATCH: Step[] = [...ECHO, I('watch'), { type: 'FLICKER_DONE' }];
const FLIP: Step[] = [...WATCH, LIGHT];
const CLOCK: Step[] = [...FLIP, I('os-clock'), I('os-wall'), LIGHT];
const CONTACT: Step[] = [...CLOCK, { type: 'TUNE', freq: '3.17' }];

describe('guidance spine (doc §R)', () => {
  it('no objective hands over a puzzle answer', () => {
    for (const { question, action, nudge } of Object.values(STEPS)) {
      expect(question + action + nudge).not.toMatch(/17|3\.17|micro|bức tường có vạch|tiếng radio/);
    }
  });

  it('walks in with one clear action: check the radio, which is on', () => {
    const s = at(OPEN);
    expect(s.radio.on).toBe(true);
    expect(currentStep(s)).toMatchObject({ id: 'check-radio', target: 'radio' });
    expect(s.message?.text).toBe(NARRATION.arrive);
  });

  it('listening plays the voice; taking in the dial points at the diary', () => {
    const heard = at(HEAR);
    expect(heard.fx?.kind).toBe('motherVoice');
    expect(currentStep(heard)).toMatchObject({ id: 'radio-why', target: 'radio' });
    const noticed = at(NOTICE);
    expect(noticed.message?.text).toBe(NARRATION.noticeDial);
    expect(currentStep(noticed)).toMatchObject({ id: 'find-diary', target: 'rug' });
    // Following any other lead also moves the player on, so nobody is stuck waiting.
    expect(at([...HEAR, I('flyer')]).dialNoticed).toBe(true);
  });

  it('diary → test frequencies → another night answers → investigate 02:58 at the watch', () => {
    expect(currentStep(at(DIARY))).toMatchObject({ id: 'test-frequencies', target: 'radio' });
    expect(currentStep(at(ECHO))).toMatchObject({ id: 'investigate-0258', target: 'watch' });
  });

  it('the flicker interrupts with its own step, pointing at the switch', () => {
    expect(currentStep(at(WATCH))).toMatchObject({ id: 'glimpse', target: 'switch' });
    const flipped = at(FLIP);
    expect(flipped.message?.text).toBe(NARRATION.firstOtherSide);
    expect(currentStep(flipped)).toMatchObject({ id: 'find-minutes', target: 'os-clock' });
  });

  it('with the minutes found, go back and tune the night Theo vanished', () => {
    expect(currentStep(at(CLOCK))).toMatchObject({ id: 'tune-night', target: 'radio' });
  });

  it('contact is a conversation: you ask where he is, look around, and he says "not your room"', () => {
    const who = THEO_CONTACT.map((l) => l.who);
    expect(who).toContain('you');
    expect(who).toContain('stage');
    const notYours = THEO_CONTACT.findIndex((l) => l.text.includes('không phải phòng của chị'));
    const lookAround = THEO_CONTACT.findIndex((l) => l.who === 'stage');
    expect(lookAround).toBeGreaterThan(-1);
    expect(notYours).toBeGreaterThan(lookAround);
    // Only what came through the speaker goes into the radio log.
    expect(at(CONTACT).radioLog.some((l) => l.includes('Em đang ở đâu'))).toBe(false);
  });

  it('Theo is alive is a discovery that opens "where is he?", not an objective', () => {
    const s = at(CONTACT);
    expect(discoveries(s)).toContain('alive');
    expect(currentStep(s)).toMatchObject({ id: 'find-theo', question: 'Theo đang ở đâu?', target: 'switch' });
  });

  it('after contact: the thing at the desk → where Theo counts → reconstruct', () => {
    const over = at([...CONTACT, LIGHT]);
    expect(over.message?.text).toBe(NARRATION.somethingAtDesk);
    expect(currentStep(over)).toMatchObject({ id: 'investigate-creature', target: 'os-desk' });
    const desk = at([...CONTACT, LIGHT, I('os-desk')]);
    expect(discoveries(desk)).toContain('followed');
    // The marks were seen before Theo spoke; now they mean something, so he sends you back to them.
    expect(currentStep(desk)).toMatchObject({ id: 'find-count', target: 'os-wall' });
    expect(evidenceReady(desk)).toBe(false);
    const ready = at([...CONTACT, LIGHT, I('os-desk'), I('os-wall')]);
    expect(evidenceReady(ready)).toBe(true);
    expect(currentStep(ready)).toMatchObject({ id: 'reconstruct', target: 'notebook' });
  });

  it('when the next thing to do is on this side, the other side says to go back first', () => {
    const across = at([...DIARY, I('flyer'), { type: 'FLICKER_DONE' }, LIGHT]);
    expect(across.world).toBe('other');
    expect(currentStep(across)).toMatchObject({ id: 'test-frequencies', target: 'switch' });
    expect(currentStep(across).action).toBe('Bật đèn quay về, rồi thử những tần số khác.');
  });

  it('a player who finds things early skips ahead instead of being sent back', () => {
    const early = at([...OPEN, I('watch'), I('radio'), I('rug'), { type: 'TUNE', freq: '1.52' }]);
    expect(currentStep(early).id).toBe('find-minutes');
  });

  it('the truth lands, then Theo warns, then the only thing left is to switch off between steps', () => {
    const s = at(TO_FINALE);
    expect(s.message?.text).toBe(NARRATION.truth);
    expect(currentStep(s)).toMatchObject({ id: 'hush', target: 'radio' });
    expect(discoveries(s)).toContain('connected');
    expect(THEO_PRECALL.some((l) => l.text.includes('micro'))).toBe(true);
    expect(THEO_PRECALL.some((l) => /hốc|mẹ đang ngủ/i.test(l.text))).toBe(false);
    expect(currentStep(at([...TO_FINALE, ...FINALE_START])).id).toBe('hush');
    expect(currentStep(at([...TO_FINALE, ...FINALE_ALL.slice(0, 4)]))).toMatchObject({ id: 'cross-over', target: 'switch' });
  });
});

describe('the dial under the hand (brief §14)', () => {
  const at314 = at([...CLOCK, { type: 'TUNE', freq: '3.14' }]);
  const spin = (delta: number) => reducer(at314, { type: 'RADIO_WHEEL', index: 2, delta, now: 1e9 });

  it('a spin is heard where it stops, not at every station it rolls past', () => {
    const past = spin(5);
    expect(freq(past)).toBe('3.19');
    expect(past.contactMade).toBe(false);
    expect(spin(3).contactMade).toBe(true);
  });

  it('a long spin wraps around the wheel', () => {
    expect(freq(spin(-7))).toBe('3.17');
    expect(freq(spin(16))).toBe('3.10');
  });
});

describe('the way to the night Theo vanished', () => {
  it('Theo is 7, so the police think he got lost, not that he ran away', () => {
    expect(CLUES.C1.text).toMatch(/7 tuổi/);
    expect(CLUES.C1.text).toMatch(/đi lạc trong rừng/);
    expect(CHIPS['di-lac'].label).toBe('đi lạc trong rừng');
  });

  it('the diary logs every night with its time, and leaves the last one blank', () => {
    const last = DIARY_PAGES[DIARY_PAGES.length - 1];
    expect(last).toMatch(/Đêm 4 — __:__\./);
    expect(last).toMatch(/nhà Danny/);
    expect(last).toMatch(/muộn hơn/);
  });

  it('once the radio is known to replay the nights, the question becomes that night', () => {
    const q = currentStep(at(ECHO)).question;
    expect(q).toBe(currentStep(at(WATCH.slice(0, -1))).question);
    expect(q).toMatch(/Đêm Theo biến mất/);
  });

  it('the second stopped clock is recognised as the other half of the first', () => {
    const watchFirst = at([...FLIP, I('os-clock')]);
    expect(watchFirst.message?.text).toBe(CLUE_FOUND_PAIRED.C4);
    const clockFirst = at([...OPEN, I('radio'), I('flyer'), I('poster'), { type: 'FLICKER_DONE' }, LIGHT, I('os-clock'), LIGHT, I('watch')]);
    expect(clockFirst.message?.text).toBe(CLUE_FOUND_PAIRED.C2);
  });
});
