import { describe, expect, it } from 'vitest';
import { CLUES, DIARY_PAGES, HINTS, THEO_CONTACT } from './content';
import { initialState, reducer } from './reducer';
import {
  BRANCH_A,
  BRANCH_B,
  CONTACT,
  DEDUCTION,
  DIARY_AND_RULE,
  EXPLORE_NORMAL,
  FIRST_VISIT,
  OPENING,
  run,
  TO_PRECHOICE,
  type Step,
} from './scripts';
import { clueText, hintStage, hintTiersUnlocked, radioSignal, tally } from './selectors';
import type { GameState, HintStage } from './types';

const LEAK_17 = /3[:.]17|(^|[^0-9])17([^0-9]|$)/;

const inOther = (steps: Step[]) => run([...OPENING, ...EXPLORE_NORMAL, ...steps]).state;

describe('luật đếm vạch (doc §I)', () => {
  it('lần đầu nhìn thấy bức tường là 4 vạch', () => {
    const s = inOther([{ type: 'TOGGLE_LIGHT' }, { type: 'INSPECT', id: 'os-wall' }]);
    expect(s.tallyLog).toEqual([4]);
    expect(clueText(s, 'C5')).toContain('Lần 1: 4 vạch.');
  });

  it('mỗi lần tắt đèn thêm đúng 1 vạch, bật đèn không tính', () => {
    const s = inOther([
      { type: 'TOGGLE_LIGHT' },
      { type: 'INSPECT', id: 'os-wall' },
      { type: 'TOGGLE_LIGHT' },
      { type: 'TOGGLE_LIGHT' },
      { type: 'TOGGLE_LIGHT' },
      { type: 'TOGGLE_LIGHT' },
    ]);
    expect(s.tallyLog).toEqual([4, 5, 6]);
    expect(tally(s)).toBe(6);
  });

  it('tắt đèn trước khi đèn chớp: đèn chớp chạy trước, vẫn ra 4 vạch', () => {
    let s = run([...OPENING, { type: 'TOGGLE_LIGHT' }]).state;
    expect(s.flicker).toBe('pending');
    expect(s.world).toBe('normal');
    s = run([{ type: 'FLICKER_DONE' }, { type: 'INSPECT', id: 'os-wall' }], 100, s).state;
    expect(s.world).toBe('other');
    expect(s.tallyLog).toEqual([4]);
  });

  it('đèn chớp kích hoạt sau 3 lần xem ở phía này', () => {
    const s = run([
      ...OPENING,
      { type: 'INSPECT', id: 'flyer' },
      { type: 'INSPECT', id: 'poster' },
    ]).state;
    expect(s.flicker).toBe('none');
    expect(reducer(s, { type: 'INSPECT', id: 'mic', now: 99_999 }).flicker).toBe('pending');
  });
});

describe('radio (doc §H)', () => {
  // Set the wheels with the radio off, then switch on: turning wheel by wheel would pass
  // through other frequencies (possibly 3.17) on the way.
  const tuned = (freq: string) => {
    const off = run([...OPENING, ...EXPLORE_NORMAL, { type: 'RADIO_POWER', on: false }]).state;
    const wheels = [Number(freq[0]), Number(freq[2]), Number(freq[3])] as GameState['radio']['wheels'];
    return reducer({ ...off, radio: { ...off.radio, wheels } }, { type: 'RADIO_POWER', on: true, now: 1e6 });
  };

  it('trả về đúng tiếng vọng, theo bất kỳ thứ tự nào', () => {
    expect(radioSignal(run([...OPENING, ...EXPLORE_NORMAL]).state)).toBe('echo3');
    expect(radioSignal(tuned('2.34'))).toBe('echo2');
    expect(radioSignal(tuned('1.52'))).toBe('echo1');
    expect(radioSignal(tuned('2.58'))).toBe('echo3');
  });

  it('3.00 và các tần số khác chỉ có rè', () => {
    for (const f of ['3.00', '3.16', '3.18', '1.17', '4.17', '2.17']) {
      const s = tuned(f);
      expect(radioSignal(s)).toBe('static');
      expect(s.contactMade).toBe(false);
    }
  });

  it('luật 7: chỉ 3.17 tạo liên lạc và vết cào mới, tiếng vọng thì không', () => {
    const echoes = run([...OPENING, ...EXPLORE_NORMAL, ...DIARY_AND_RULE]).state;
    expect(echoes.contactMade).toBe(false);
    expect(clueText({ ...echoes, clues: ['C6'] }, 'C6')).not.toContain('vết cào mới');

    const live = run([...OPENING, ...EXPLORE_NORMAL, ...CONTACT]).state;
    expect(live.contactMade).toBe(true);
    expect(clueText(live, 'C6')).toContain('Có thêm vết cào mới quanh radio.');
  });

  it('sau lần liên lạc đầu, 3.17 chỉ còn rè cho tới khi nộp deduction đúng', () => {
    const s = run([...OPENING, ...EXPLORE_NORMAL, ...CONTACT]).state;
    expect(radioSignal(s)).toBe('static');
  });

  it('radio không chỉnh được từ phía bên kia', () => {
    const s = inOther([{ type: 'TOGGLE_LIGHT' }]);
    expect(reducer(s, { type: 'RADIO_WHEEL', index: 0, delta: 1, now: 99_999 })).toBe(s);
  });
});

describe('khóa cứng (doc §J.1)', () => {
  it('deduction chỉ mở sau khi liên lạc được', () => {
    const s = run([...OPENING, ...EXPLORE_NORMAL, ...FIRST_VISIT, ...DIARY_AND_RULE, ...DEDUCTION]).state;
    expect(s.slots).toEqual({ A: null, C: null, D: null });
    expect(s.deductionSolved).toBe(false);
  });

  it('choice chỉ mở sau khi nộp deduction đúng', () => {
    const s = run([
      ...OPENING,
      ...EXPLORE_NORMAL,
      ...FIRST_VISIT,
      ...DIARY_AND_RULE,
      ...CONTACT,
      { type: 'CHOOSE', option: 'A' },
    ]).state;
    expect(s.choice).toBeNull();
  });

  it('ending chỉ xảy ra sau khi đã chọn', () => {
    const s = run([...TO_PRECHOICE, { type: 'END' }]).state;
    expect(s.phase).toBe('play');
  });
});

describe('deduction (doc §F)', () => {
  const contacted = [...OPENING, ...EXPLORE_NORMAL, ...FIRST_VISIT, ...DIARY_AND_RULE, ...CONTACT];
  const fill = (a: string, c: string, d: string): Step[] => [
    { type: 'FILL_SLOT', slot: 'A', chip: a as never },
    { type: 'FILL_SLOT', slot: 'C', chip: c as never },
    { type: 'FILL_SLOT', slot: 'D', chip: d as never },
    { type: 'SUBMIT_DEDUCTION' },
  ];

  it('"gần đúng" chỉ xuất hiện từ lần nộp sai thứ 2', () => {
    const first = run([...contacted, ...fill('tat-den', 'buc-tuong', 'tieng-radio')]).state;
    expect(first.deductionFeedback).toBe('Câu chuyện này chưa khớp với bằng chứng.');
    const second = run([{ type: 'SUBMIT_DEDUCTION' }], 1e6, first).state;
    expect(second.deductionFeedback).toBe('Gần đúng. Có một chi tiết chưa khớp.');
    const twoWrong = run(fill('tat-den', 'cua-phong', 'tieng-radio'), 2e6, second).state;
    expect(twoWrong.deductionFeedback).toBe('Câu chuyện này chưa khớp với bằng chứng.');
  });

  it('đúng cả ba thì radio tự rè lên ở 3.17', () => {
    const s = run([...contacted, ...DEDUCTION]).state;
    expect(s.deductionSolved).toBe(true);
    expect(radioSignal(s)).toBe('precall');
  });

  it('chip chỉ dùng được khi đã có clue nguồn', () => {
    // No trip to the other side: C5 and C6 unknown.
    const s = run([...OPENING, ...EXPLORE_NORMAL, { type: 'INSPECT', id: 'rug' }, ...CONTACT]).state;
    const tried = reducer(s, { type: 'FILL_SLOT', slot: 'C', chip: 'buc-tuong', now: 1e7 });
    expect(tried.slots.C).toBeNull();
  });
});

describe('không để lộ đáp án (doc §D, §F, §L)', () => {
  it('không có chữ nào hiện "3:17" hay "17" trước khi xem C4', () => {
    const { history } = run([
      ...OPENING,
      { type: 'INSPECT', id: 'flyer' },
      { type: 'INSPECT', id: 'watch' },
      { type: 'INSPECT', id: 'radio' },
      { type: 'INSPECT', id: 'mic' },
      { type: 'INSPECT', id: 'wall-clock' },
      { type: 'INSPECT', id: 'poster' },
      { type: 'FLICKER_DONE' },
      { type: 'RADIO_POWER', on: true },
      { type: 'TOGGLE_LIGHT' },
      { type: 'INSPECT', id: 'os-wall' },
      { type: 'INSPECT', id: 'os-floor' },
      { type: 'INSPECT', id: 'os-desk' },
      { type: 'INSPECT', id: 'os-door' },
      { type: 'TOGGLE_LIGHT' },
      { type: 'INSPECT', id: 'rug' },
      { type: 'TUNE', freq: '2.34' },
      { type: 'TUNE', freq: '1.52' },
      { type: 'TUNE', freq: '3.00' },
    ]);
    const visible = (s: GameState) => [
      s.message?.text ?? '',
      s.objective,
      ...s.radioLog,
      ...s.clues.map((c) => clueText(s, c)),
      ...(s.diaryFound ? DIARY_PAGES : []),
    ];
    for (const s of history) {
      expect(s.clues).not.toContain('C4');
      for (const text of visible(s)) expect(text).not.toMatch(LEAK_17);
    }
  });

  it('hint trước khi liên lạc không nói ra 17', () => {
    const before: HintStage[] = ['flip', 'diary', 'leap1', 'hour', 'minute'];
    for (const stage of before) for (const h of HINTS[stage]) expect(h).not.toMatch(LEAK_17);
  });

  it('lời Theo không chứa khắc, vạch, tường, micro, radio', () => {
    for (const line of THEO_CONTACT) {
      expect(line).not.toMatch(/khắc|vạch|tường|micro|radio/i);
    }
  });

  it('clue card không diễn giải', () => {
    for (const c of Object.values(CLUES)) expect(c.text).not.toMatch(/có vẻ|liên quan|nghĩa là/);
  });
});

describe('hint (doc §L)', () => {
  it('chọn stage theo mảnh thông tin còn thiếu', () => {
    expect(hintStage(run([...OPENING, ...EXPLORE_NORMAL]).state)).toBe('flip');
    expect(hintStage(run([...OPENING, ...EXPLORE_NORMAL, ...FIRST_VISIT]).state)).toBe('diary');
    expect(
      hintStage(run([...OPENING, ...EXPLORE_NORMAL, ...FIRST_VISIT, { type: 'INSPECT', id: 'rug' }]).state),
    ).toBe('leap1');
    expect(
      hintStage(run([...OPENING, ...EXPLORE_NORMAL, ...FIRST_VISIT, ...DIARY_AND_RULE]).state),
    ).toBe('minute');
  });

  it('tầng 1 mở sau khoảng 2 phút kẹt, mỗi tầng sau thêm khoảng 60 giây', () => {
    const { state: s, now } = run([...OPENING, ...EXPLORE_NORMAL]);
    expect(hintTiersUnlocked(s, now + 60_000)).toBe(0);
    expect(hintTiersUnlocked(s, s.lastProgressAt + 120_000)).toBe(1);
    expect(hintTiersUnlocked(s, s.lastProgressAt + 180_000)).toBe(2);
    expect(hintTiersUnlocked(s, s.lastProgressAt + 999_000)).toBe(3);
  });

  it('không mở hint khi chưa đến lúc', () => {
    const { state: s, now } = run([...OPENING, ...EXPLORE_NORMAL]);
    expect(reducer(s, { type: 'REQUEST_HINT', now: now + 1_000 })).toBe(s);
    const later = reducer(s, { type: 'REQUEST_HINT', now: s.lastProgressAt + 130_000 });
    expect(later.hintRevealed).toBe(1);
    expect(later.hintsUsed).toBe(1);
  });
});

describe('playthrough (doc §J.2)', () => {
  it('nhánh A tới được ending', () => {
    const s = run([...TO_PRECHOICE, ...BRANCH_A]).state;
    expect(s.rescued).toBe(true);
    expect(s.radio.broken).toBe(true);
    expect(s.phase).toBe('ending');
  });

  it('nhánh A: click tường quá sớm thì nó quay đầu lại', () => {
    const s = run([
      ...TO_PRECHOICE,
      { type: 'CHOOSE', option: 'A' },
      { type: 'TOGGLE_LIGHT' },
      { type: 'INSPECT', id: 'os-wall' },
    ]).state;
    expect(s.rescued).toBe(false);
    expect(s.fx?.kind).toBe('turnBack');
  });

  it('nhánh B tới được ending', () => {
    const s = run([...TO_PRECHOICE, ...BRANCH_B]).state;
    expect(s.flashlightGiven).toBe(true);
    expect(s.theoLightSeen).toBe(true);
    expect(s.phase).toBe('ending');
  });

  it('đặt đèn pin trước nhánh B thì bị từ chối', () => {
    const s = run([...OPENING, ...EXPLORE_NORMAL, { type: 'INSPECT', id: 'rug' }, { type: 'PLACE_FLASHLIGHT' }]).state;
    expect(s.flashlightGiven).toBe(false);
    expect(s.message?.text).toBe('Bạn còn cần nó.');
  });

  it('thứ tự khác vẫn tới được ending (J.2 không phải flow bắt buộc)', () => {
    const s = run([
      ...OPENING,
      { type: 'TOGGLE_LIGHT' }, // flip before exploring anything
      { type: 'FLICKER_DONE' },
      { type: 'INSPECT', id: 'os-clock' },
      { type: 'INSPECT', id: 'os-desk' },
      { type: 'INSPECT', id: 'os-wall' },
      { type: 'TOGGLE_LIGHT' },
      { type: 'INSPECT', id: 'rug' },
      { type: 'INSPECT', id: 'watch' },
      { type: 'RADIO_POWER', on: true },
      { type: 'TUNE', freq: '3.17' }, // guesses straight away
      ...DEDUCTION,
      ...BRANCH_B,
    ]).state;
    expect(s.phase).toBe('ending');
  });

  it('state ban đầu hợp lệ', () => {
    const s = initialState();
    expect(s.radio.wheels).toEqual([2, 5, 8]);
    expect(s.phase).toBe('title');
  });
});
