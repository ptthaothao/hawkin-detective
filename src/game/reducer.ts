import {
  CLUES,
  CORRECT,
  ECHOES,
  FEEDBACK_NEAR,
  FEEDBACK_WRONG,
  HOTSPOT_TEXT,
  INITIAL_WHEELS,
  LIVE_FREQ,
  OBJECTIVE_ALIVE,
  OBJECTIVE_START,
  THEO_CONTACT,
  THEO_PRECALL,
} from './content';
import {
  chipAvailable,
  clueText,
  freq,
  hasClue,
  hintStage,
  hintTiersUnlocked,
  LURE_MS,
  tally,
} from './selectors';
import type { Action, ClueId, FxKind, GameState, HotspotId, SlotId } from './types';

const NORMAL_IDS: HotspotId[] = [
  'flyer',
  'watch',
  'radio',
  'mic',
  'wall-clock',
  'poster',
  'rug',
  'desk-edge',
  'door-normal',
];
const FLICKER_AFTER_INSPECTIONS = 3;

export function initialState(): GameState {
  return {
    phase: 'title',
    debug: false,
    startedAt: null,
    endedAt: null,
    world: 'normal',
    flicker: 'none',
    queuedLightOff: false,
    lightOffCount: 0,
    inspected: [],
    clues: [],
    tallyLog: [],
    diaryFound: false,
    radio: { on: false, wheels: [...INITIAL_WHEELS], volumeMax: false, broken: false, locked: false },
    heardFreqs: [],
    radioLog: [],
    contactMade: false,
    slots: { A: null, C: null, D: null },
    wrongSubmits: 0,
    deductionFeedback: null,
    deductionSolved: false,
    choice: null,
    lureStartedAt: null,
    rescued: false,
    flashlightGiven: false,
    theoLightSeen: false,
    endingReady: false,
    objective: OBJECTIVE_START,
    message: null,
    fx: null,
    seq: 0,
    lastProgressAt: 0,
    hintStage: null,
    hintRevealed: 0,
    hintsUsed: 0,
  };
}

// --- small immutable helpers ------------------------------------------------

function say(s: GameState, text: string): GameState {
  return { ...s, message: { id: s.seq + 1, text }, seq: s.seq + 1 };
}

function fx(s: GameState, kind: FxKind): GameState {
  return { ...s, fx: { id: s.seq + 1, kind }, seq: s.seq + 1 };
}

function addClue(s: GameState, id: ClueId): GameState {
  return hasClue(s, id) ? s : { ...s, clues: [...s.clues, id] };
}

function markInspected(s: GameState, id: HotspotId): GameState {
  return s.inspected.includes(id) ? s : { ...s, inspected: [...s.inspected, id] };
}

function logRadio(s: GameState, lines: string[]): GameState {
  return { ...s, radioLog: [...s.radioLog, ...lines] };
}

// --- world ------------------------------------------------------------------

function enterOtherSide(s: GameState, now: number): GameState {
  let next: GameState = { ...s, world: 'other', lightOffCount: s.lightOffCount + 1 };
  if (hasClue(next, 'C5')) next = { ...next, tallyLog: [...next.tallyLog, tally(next)] };
  if (next.choice === 'A' && !next.rescued) next = { ...next, lureStartedAt: now };
  if (next.flashlightGiven && !next.theoLightSeen) return fx(next, 'dark');
  return fx(next, 'lightOff');
}

function toggleLight(s: GameState, now: number): GameState {
  if (s.flicker === 'pending') return s;
  if (s.world === 'other') return fx({ ...s, world: 'normal' }, 'lightOn');
  if (s.flicker === 'none') {
    // Doc §I: the first light-off always comes after the three flickers.
    return fx({ ...s, flicker: 'pending', queuedLightOff: true }, 'flicker');
  }
  return enterOtherSide(s, now);
}

// --- radio ------------------------------------------------------------------

function afterRadioChange(s: GameState): GameState {
  if (!s.radio.on || s.radio.broken || s.choice) return s;
  const f = freq(s);
  const echo = ECHOES[f];
  if (echo) {
    if (s.heardFreqs.includes(f)) return s;
    return logRadio({ ...s, heardFreqs: [...s.heardFreqs, f] }, [echo.line]);
  }
  if (f === LIVE_FREQ && !s.contactMade) {
    // Doc §F, §H: first live contact. Luật 7: only 3.17 draws it to the desk.
    const next = logRadio(
      { ...s, contactMade: true, objective: OBJECTIVE_ALIVE, heardFreqs: [...s.heardFreqs, f] },
      THEO_CONTACT.map((l) => `[${LIVE_FREQ}] ${l}`),
    );
    return fx(next, 'contact');
  }
  if (!s.heardFreqs.includes(f)) return { ...s, heardFreqs: [...s.heardFreqs, f] };
  return s;
}

const WHEEL_RANGE: [number, number][] = [
  [1, 4],
  [0, 9],
  [0, 9],
];

function turnWheel(s: GameState, index: 0 | 1 | 2, delta: 1 | -1): GameState {
  const [min, max] = WHEEL_RANGE[index];
  const span = max - min + 1;
  const wheels = [...s.radio.wheels] as GameState['radio']['wheels'];
  wheels[index] = ((wheels[index] - min + delta + span) % span) + min;
  return afterRadioChange({ ...s, radio: { ...s.radio, wheels } });
}

// --- hotspots ---------------------------------------------------------------

function inspectClue(s: GameState, id: ClueId): GameState {
  const next = addClue(s, id);
  return say(next, `${CLUES[id].title}: ${clueText(next, id)}`);
}

function inspectNormal(s: GameState, id: HotspotId): GameState {
  switch (id) {
    case 'flyer':
      return inspectClue(s, 'C1');
    case 'watch':
      return inspectClue(s, 'C2');
    case 'mic':
      return say(s, HOTSPOT_TEXT.mic);
    case 'wall-clock':
      return say(s, s.rescued ? HOTSPOT_TEXT.wallClockStopped : HOTSPOT_TEXT.wallClock);
    case 'poster':
      return say(s, HOTSPOT_TEXT.poster);
    case 'rug':
      return s.diaryFound ? s : say(addClue({ ...s, diaryFound: true }, 'C3'), HOTSPOT_TEXT.rugFirst);
    case 'desk-edge':
      return say(s, HOTSPOT_TEXT.deskEdge);
    case 'door-normal':
      return say(s, HOTSPOT_TEXT.doorNormal);
    default:
      // 'radio' only opens the radio panel.
      return s;
  }
}

function inspectOther(s: GameState, id: HotspotId, now: number): GameState {
  switch (id) {
    case 'os-wall':
      return inspectWall(s, now);
    case 'os-clock':
      return inspectClue(s, 'C4');
    case 'os-floor':
      return say(s, HOTSPOT_TEXT.osFloor);
    case 'os-desk':
      return inspectClue(s, 'C6');
    case 'os-door':
      return fx(say(s, HOTSPOT_TEXT.osDoor), 'movement');
    default:
      return s;
  }
}

function inspect(s: GameState, id: HotspotId, now: number): GameState {
  const isNormal = NORMAL_IDS.includes(id);
  if ((s.world === 'normal') !== isNormal) return s;
  const seen = markInspected(s, id);
  if (!isNormal) return inspectOther(seen, id, now);

  const next = inspectNormal(seen, id);
  const normalSeen = next.inspected.filter((h) => NORMAL_IDS.includes(h)).length;
  if (next.flicker === 'none' && normalSeen >= FLICKER_AFTER_INSPECTIONS) {
    return fx({ ...next, flicker: 'pending' }, 'flicker');
  }
  return next;
}

function inspectWall(s: GameState, now: number): GameState {
  if (s.choice === 'A' && !s.rescued) {
    const started = s.lureStartedAt ?? now;
    if (now - started < LURE_MS) {
      return fx(say({ ...s, lureStartedAt: now }, HOTSPOT_TEXT.turnBack), 'turnBack');
    }
    const radio = { ...s.radio, broken: true, on: false };
    return fx(
      say({ ...s, rescued: true, world: 'normal', radio, endingReady: true }, HOTSPOT_TEXT.rescue),
      'rescue',
    );
  }
  let next = s;
  if (!hasClue(next, 'C5')) next = addClue({ ...next, tallyLog: [tally(next)] }, 'C5');
  return say(next, `${CLUES.C5.text} ${tally(next)} vạch.`);
}

// --- deduction & choice -----------------------------------------------------

function submitDeduction(s: GameState): GameState {
  if (!s.contactMade || s.deductionSolved) return s;
  const slots = Object.keys(CORRECT) as SlotId[];
  if (slots.some((k) => !s.slots[k])) return s;
  const wrong = slots.filter((k) => s.slots[k] !== CORRECT[k]).length;
  if (wrong === 0) {
    const radio = { ...s.radio, on: true, wheels: [3, 1, 7] as GameState['radio']['wheels'] };
    const next = logRadio(
      { ...s, deductionSolved: true, deductionFeedback: null, radio },
      THEO_PRECALL.map((l) => `[${LIVE_FREQ}] ${l}`),
    );
    return fx(next, 'precall');
  }
  const wrongSubmits = s.wrongSubmits + 1;
  const deductionFeedback = wrongSubmits >= 2 && wrong === 1 ? FEEDBACK_NEAR : FEEDBACK_WRONG;
  return { ...s, wrongSubmits, deductionFeedback };
}

function choose(s: GameState, option: 'A' | 'B', now: number): GameState {
  if (!s.deductionSolved || s.choice) return s;
  if (option === 'A') {
    return {
      ...s,
      choice: 'A',
      radio: { ...s.radio, on: true, volumeMax: true, locked: true },
      lureStartedAt: s.world === 'other' ? now : null,
    };
  }
  return { ...s, choice: 'B', radio: { ...s.radio, on: false, locked: true } };
}

function placeFlashlight(s: GameState): GameState {
  if (s.world !== 'normal' || !s.diaryFound || s.flashlightGiven) return s;
  if (s.choice !== 'B') return say(s, HOTSPOT_TEXT.flashlightRefused);
  return say({ ...s, flashlightGiven: true }, HOTSPOT_TEXT.flashlightGiven);
}

// --- main reducer -----------------------------------------------------------

function step(s: GameState, a: Action): GameState {
  switch (a.type) {
    case 'BEGIN':
      return s.phase === 'title' ? { ...s, phase: 'intro', debug: !!a.debug } : s;
    case 'START_PLAY':
      return s.phase === 'intro'
        ? { ...s, phase: 'play', startedAt: a.now, lastProgressAt: a.now }
        : s;
    case 'END':
      return s.endingReady && s.phase === 'play' ? { ...s, phase: 'ending', endedAt: a.now } : s;
  }

  if (s.phase !== 'play') return s;
  if (s.endingReady) return s;

  switch (a.type) {
    case 'INSPECT':
      return s.flicker === 'pending' ? s : inspect(s, a.id, a.now);
    case 'TOGGLE_LIGHT':
      return toggleLight(s, a.now);
    case 'FLICKER_DONE': {
      if (s.flicker !== 'pending') return s;
      const next: GameState = { ...s, flicker: 'done', queuedLightOff: false };
      return s.queuedLightOff ? enterOtherSide(next, a.now) : next;
    }
    case 'RADIO_POWER':
      if (s.radio.locked || s.world !== 'normal') return s;
      return afterRadioChange({ ...s, radio: { ...s.radio, on: a.on } });
    case 'RADIO_WHEEL':
      if (s.radio.locked || s.world !== 'normal') return s;
      return turnWheel(s, a.index, a.delta);
    case 'PLACE_FLASHLIGHT':
      return placeFlashlight(s);
    case 'FILL_SLOT':
      if (!s.contactMade || s.deductionSolved) return s;
      if (a.chip && !chipAvailable(s, a.chip)) return s;
      return { ...s, slots: { ...s.slots, [a.slot]: a.chip }, deductionFeedback: null };
    case 'SUBMIT_DEDUCTION':
      return submitDeduction(s);
    case 'CHOOSE':
      return choose(s, a.option, a.now);
    case 'THEO_LIGHT':
      if (!s.flashlightGiven || s.world !== 'other' || s.theoLightSeen) return s;
      return fx(say({ ...s, theoLightSeen: true, endingReady: true }, HOTSPOT_TEXT.theoLight), 'theoLight');
    case 'REQUEST_HINT': {
      if (s.hintRevealed >= hintTiersUnlocked(s, a.now)) return s;
      return { ...s, hintRevealed: s.hintRevealed + 1, hintsUsed: s.hintsUsed + 1 };
    }
  }
  return s;
}

/** Anything that counts as "the player learned something" resets the stuck timer for hints. */
function progressKey(s: GameState): string {
  return [
    s.inspected.length,
    s.clues.length,
    s.heardFreqs.length,
    s.lightOffCount > 0,
    s.diaryFound,
    s.contactMade,
    s.deductionSolved,
    s.choice,
    s.flashlightGiven,
  ].join('|');
}

export function reducer(s: GameState, a: Action): GameState {
  let next = step(s, a);
  if (next === s) return s;
  if (next.phase === 'play' && progressKey(next) !== progressKey(s)) {
    next = { ...next, lastProgressAt: a.now };
  }
  const stage = hintStage(next);
  if (stage !== next.hintStage) {
    next = { ...next, hintStage: stage, hintRevealed: 0, lastProgressAt: a.now };
  }
  return next;
}
