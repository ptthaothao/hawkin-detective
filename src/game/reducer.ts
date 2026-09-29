import {
  CLUES,
  CORRECT,
  ECHOES,
  FEEDBACK_NEAR,
  FEEDBACK_WRONG,
  HOTSPOT_TEXT,
  INITIAL_WHEELS,
  CLUE_FOUND,
  CLUE_FOUND_PAIRED,
  type DialogueLine,
  LIVE_FREQ,
  NARRATION,
  THEO_CONTACT,
  THEO_PRECALL,
} from './content';
import {
  chipAvailable,
  clueText,
  evidenceReady,
  freq,
  hasClue,
  hintStage,
  hintTiersUnlocked,
  inQuiet,
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
    // Doc §R: the radio is on when the player walks in; it is the first thing to check.
    radio: { on: true, wheels: [...INITIAL_WHEELS], knobSnapped: false },
    heardFreqs: [],
    radioLog: [],
    contactMade: false,
    sawAftermath: false,
    dialNoticed: false,
    wallAfterContact: false,
    lightOffsAtContact: null,
    slots: { A: null, C: null, D: null },
    wrongSubmits: 0,
    deductionFeedback: null,
    deductionSolved: false,
    finaleStartedAt: null,
    finaleFails: 0,
    hushed: false,
    theoLightSeen: false,
    endingReady: false,
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

/** What the radio log keeps of a scene: only what came through the speaker. */
const spoken = (lines: DialogueLine[]) =>
  lines.filter((l) => l.who === 'theo').map((l) => `[${LIVE_FREQ}] ${l.text}`);

function logRadio(s: GameState, lines: string[]): GameState {
  return { ...s, radioLog: [...s.radioLog, ...lines] };
}

// --- world ------------------------------------------------------------------

function enterOtherSide(s: GameState): GameState {
  let next: GameState = { ...s, world: 'other', lightOffCount: s.lightOffCount + 1 };
  if (hasClue(next, 'C5')) next = { ...next, tallyLog: [...next.tallyLog, tally(next)] };
  if (next.hushed && !next.theoLightSeen) return fx(next, 'dark');
  if (next.lightOffCount === 1) next = say(next, NARRATION.firstOtherSide);
  else if (next.contactMade && !next.sawAftermath && !next.deductionSolved) next = say(next, NARRATION.somethingAtDesk);
  return fx(next, 'lightOff');
}

function toggleLight(s: GameState): GameState {
  if (s.flicker === 'pending') return s;
  if (s.world === 'other') return fx({ ...s, world: 'normal' }, 'lightOn');
  if (s.flicker === 'none') {
    // Doc §I: the first light-off always comes after the three flickers.
    return fx({ ...s, flicker: 'pending', queuedLightOff: true }, 'flicker');
  }
  return enterOtherSide(s);
}

// --- radio ------------------------------------------------------------------

function afterRadioChange(s: GameState): GameState {
  if (!s.radio.on || s.deductionSolved) return s;
  const f = freq(s);
  const echo = ECHOES[f];
  if (echo) {
    if (s.heardFreqs.includes(f)) return s;
    return logRadio({ ...s, heardFreqs: [...s.heardFreqs, f] }, [echo.line]);
  }
  if (f === LIVE_FREQ && !s.contactMade) {
    // Doc §F, §H: first live contact. Luật 7: only 3.17 draws it to the desk.
    const next = logRadio(
      { ...s, contactMade: true, lightOffsAtContact: s.lightOffCount, heardFreqs: [...s.heardFreqs, f] },
      spoken(THEO_CONTACT),
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

function turnWheel(s: GameState, index: 0 | 1 | 2, delta: number): GameState {
  if (!delta) return s;
  const [min, max] = WHEEL_RANGE[index];
  const span = max - min + 1;
  const wheels = [...s.radio.wheels] as GameState['radio']['wheels'];
  wheels[index] = ((((wheels[index] - min + delta) % span) + span) % span) + min;
  return afterRadioChange({ ...s, radio: { ...s.radio, wheels } });
}

// --- hotspots ---------------------------------------------------------------

/** The two stopped clocks: whichever is found second is recognised as the other half. */
const PAIR: Partial<Record<ClueId, ClueId>> = { C2: 'C4', C4: 'C2' };

function inspectClue(s: GameState, id: ClueId): GameState {
  const next = addClue(s, id);
  if (hasClue(s, id)) return say(next, `${CLUES[id].title}: ${clueText(next, id)}`);
  const pair = PAIR[id];
  return say(next, (pair && hasClue(s, pair) && CLUE_FOUND_PAIRED[id]) || CLUE_FOUND[id]);
}

const heardMother = (s: GameState) => s.heardFreqs.includes('2.58');

/** Doc §R: the first time the player listens, the radio plays a voice that cannot be there. */
function listen(s: GameState): GameState {
  const next = afterRadioChange(s);
  return !heardMother(s) && heardMother(next) ? fx(next, 'motherVoice') : next;
}

/** Any other lead followed after the voice counts as having taken in the radio. */
function moveOn(s: GameState): GameState {
  return heardMother(s) && !s.dialNoticed ? { ...s, dialNoticed: true } : s;
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
      return say(s, HOTSPOT_TEXT.wallClock);
    case 'poster':
      return say(s, HOTSPOT_TEXT.poster);
    case 'rug':
      return s.diaryFound ? s : say(addClue({ ...s, diaryFound: true }, 'C3'), HOTSPOT_TEXT.rugFirst);
    case 'desk-edge':
      return say(s, HOTSPOT_TEXT.deskEdge);
    case 'door-normal':
      return say(s, HOTSPOT_TEXT.doorNormal);
    case 'radio':
      return listen(s);
    default:
      return s;
  }
}

function inspectOther(s: GameState, id: HotspotId): GameState {
  switch (id) {
    case 'os-wall':
      return inspectWall(s.contactMade ? { ...s, wallAfterContact: true } : s);
    case 'os-clock':
      return inspectClue(s, 'C4');
    case 'os-floor':
      return say(s, HOTSPOT_TEXT.osFloor);
    case 'os-desk':
      if (s.contactMade && hasClue(s, 'C6')) return say({ ...s, sawAftermath: true }, HOTSPOT_TEXT.osDeskAfter);
      return inspectClue(s.contactMade ? { ...s, sawAftermath: true } : s, 'C6');
    case 'os-door':
      return fx(say(s, HOTSPOT_TEXT.osDoor), 'movement');
    default:
      return s;
  }
}

function inspect(s: GameState, id: HotspotId): GameState {
  const isNormal = NORMAL_IDS.includes(id);
  if ((s.world === 'normal') !== isNormal) return s;
  const seen = markInspected(s, id);
  if (!isNormal) return inspectOther(moveOn(seen), id);

  const next = inspectNormal(id === 'radio' ? seen : moveOn(seen), id);
  const normalSeen = next.inspected.filter((h) => NORMAL_IDS.includes(h)).length;
  if (next.flicker === 'none' && normalSeen >= FLICKER_AFTER_INSPECTIONS) {
    return fx({ ...next, flicker: 'pending' }, 'flicker');
  }
  return next;
}

function inspectWall(s: GameState): GameState {
  let next = s;
  if (!hasClue(next, 'C5')) next = addClue({ ...next, tallyLog: [tally(next)] }, 'C5');
  return say(next, `${CLUES.C5.text} ${tally(next)} vạch.`);
}

// --- deduction & the closing beat -----------------------------------------------------

function submitDeduction(s: GameState): GameState {
  if (!s.contactMade || s.deductionSolved) return s;
  const slots = Object.keys(CORRECT) as SlotId[];
  if (slots.some((k) => !s.slots[k])) return s;
  const wrong = slots.filter((k) => s.slots[k] !== CORRECT[k]).length;
  if (wrong === 0) {
    const radio = { ...s.radio, on: true, wheels: [3, 1, 7] as GameState['radio']['wheels'] };
    const next = logRadio(
      { ...s, deductionSolved: true, deductionFeedback: null, radio },
      spoken(THEO_PRECALL),
    );
    return fx(say(next, NARRATION.truth), 'precall');
  }
  const wrongSubmits = s.wrongSubmits + 1;
  const deductionFeedback = wrongSubmits >= 2 && wrong === 1 ? FEEDBACK_NEAR : FEEDBACK_WRONG;
  return { ...s, wrongSubmits, deductionFeedback };
}

/** Doc §K: Theo has finished speaking. The knob snaps when tried, the footsteps start. */
function beginFinale(s: GameState, now: number): GameState {
  if (!s.deductionSolved || s.finaleStartedAt !== null) return s;
  return { ...s, finaleStartedAt: now };
}

function tryKnob(s: GameState): GameState {
  if (!s.deductionSolved || s.radio.knobSnapped) return s;
  return say({ ...s, radio: { ...s.radio, knobSnapped: true } }, HOTSPOT_TEXT.knobSnapped);
}

/** Doc §K: the switch-off. In the quiet between two steps it works; anywhere else the thing turns back. */
function switchOff(s: GameState, now: number): GameState {
  if (s.hushed) return s;
  if (inQuiet(s, now)) {
    return fx(say({ ...s, hushed: true, radio: { ...s.radio, on: false } }, HOTSPOT_TEXT.hushed), 'hush');
  }
  // Nothing is lost: the radio comes on again by itself and the rhythm starts over.
  return fx(say({ ...s, finaleFails: s.finaleFails + 1, finaleStartedAt: now }, HOTSPOT_TEXT.turnBack), 'turnBack');
}

// --- main reducer -----------------------------------------------------------

function step(s: GameState, a: Action): GameState {
  switch (a.type) {
    case 'BEGIN':
      return s.phase === 'title' ? { ...s, phase: 'intro', debug: !!a.debug } : s;
    case 'START_PLAY':
      return s.phase === 'intro'
        ? fx(say({ ...s, phase: 'play', startedAt: a.now, lastProgressAt: a.now }, NARRATION.arrive), 'arrive')
        : s;
    case 'END':
      return s.endingReady && s.phase === 'play' ? { ...s, phase: 'ending', endedAt: a.now } : s;
  }

  if (s.phase !== 'play') return s;
  if (s.endingReady) return s;

  switch (a.type) {
    case 'INSPECT':
      return s.flicker === 'pending' ? s : inspect(s, a.id);
    case 'TOGGLE_LIGHT':
      return toggleLight(s);
    case 'FLICKER_DONE': {
      if (s.flicker !== 'pending') return s;
      const next: GameState = { ...s, flicker: 'done', queuedLightOff: false };
      return s.queuedLightOff ? enterOtherSide(next) : say(next, NARRATION.glimpse);
    }
    case 'NOTICE_DIAL':
      if (!heardMother(s) || s.dialNoticed) return s;
      return say({ ...s, dialNoticed: true }, NARRATION.noticeDial);
    case 'RADIO_POWER':
      if (s.world !== 'normal') return s;
      if (s.deductionSolved) return !a.on && s.finaleStartedAt !== null ? switchOff(s, a.now) : s;
      return afterRadioChange({ ...s, radio: { ...s.radio, on: a.on } });
    case 'RADIO_WHEEL':
      if (s.deductionSolved || s.world !== 'normal') return s;
      return turnWheel(moveOn(s), a.index, a.delta);
    case 'FINALE_BEGIN':
      return beginFinale(s, a.now);
    case 'KNOB_TRY':
      return s.world === 'normal' ? tryKnob(s) : s;
    case 'FILL_SLOT':
      if (!s.contactMade || s.deductionSolved) return s;
      if (a.chip && !chipAvailable(s, a.chip)) return s;
      return { ...s, slots: { ...s.slots, [a.slot]: a.chip }, deductionFeedback: null };
    case 'SUBMIT_DEDUCTION':
      return submitDeduction(s);
    case 'THEO_LIGHT':
      if (!s.hushed || s.world !== 'other' || s.theoLightSeen) return s;
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
    s.sawAftermath,
    s.dialNoticed,
    s.wallAfterContact,
    s.deductionSolved,
    s.hushed,
    s.finaleFails,
  ].join('|');
}

export function reducer(s: GameState, a: Action): GameState {
  let next = step(s, a);
  if (next === s) return s;
  if (!evidenceReady(s) && evidenceReady(next)) {
    const said = next.message && next.message.id !== s.message?.id ? `${next.message.text}\n` : '';
    next = say(next, said + NARRATION.evidenceReady);
  }
  if (next.phase === 'play' && progressKey(next) !== progressKey(s)) {
    next = { ...next, lastProgressAt: a.now };
  }
  const stage = hintStage(next);
  if (stage !== next.hintStage) {
    next = { ...next, hintStage: stage, hintRevealed: 0, lastProgressAt: a.now };
  }
  return next;
}
