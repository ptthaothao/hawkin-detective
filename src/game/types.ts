export type World = 'normal' | 'other';

export type Phase = 'title' | 'intro' | 'play' | 'ending';

export type ClueId = 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6';

export type SlotId = 'A' | 'C' | 'D';

export type ChipId =
  | 'tat-den'
  | 'noi-vao-micro'
  | 'chui-hoc-san'
  | 'bo-nha-di'
  | 'hoc-duoi-san'
  | 'ban-radio'
  | 'cua-phong'
  | 'buc-tuong'
  | 'anh-sang'
  | 'tieng-radio'
  | 'canh-cua-phong';

export type NormalHotspotId =
  | 'flyer'
  | 'watch'
  | 'radio'
  | 'mic'
  | 'wall-clock'
  | 'poster'
  | 'rug'
  | 'desk-edge'
  | 'door-normal';

export type OtherHotspotId = 'os-wall' | 'os-clock' | 'os-floor' | 'os-desk' | 'os-door';

export type HotspotId = NormalHotspotId | OtherHotspotId;

export type HintStage =
  | 'flip'
  | 'diary'
  | 'leap1'
  | 'hour'
  | 'minute'
  /** Both clocks found; still has to put hour and minutes together. */
  | 'combine'
  | 'dedA'
  | 'dedC'
  | 'dedD'
  /** Doc §K: the closing beat, turning the radio off between two footsteps. */
  | 'hush';

/** Presentation cue emitted by the reducer; the UI plays it and never feeds it back as logic. */
export type FxKind =
  | 'arrive'
  | 'motherVoice'
  | 'flicker'
  | 'lightOff'
  | 'lightOn'
  | 'movement'
  | 'contact'
  | 'precall'
  | 'turnBack'
  | 'hush'
  | 'dark'
  | 'theoLight';

export type RadioSignal = 'off' | 'static' | 'echo1' | 'echo2' | 'echo3' | 'precall' | 'steps';

export interface RadioState {
  on: boolean;
  /** [x, y, z] → x.yz MHz. x ∈ 1..4, y/z ∈ 0..9. */
  wheels: [number, number, number];
  /** The volume knob snapped off in the player's hand once 3.17 went live (doc §K). */
  knobSnapped: boolean;
}

export interface GameState {
  phase: Phase;
  debug: boolean;
  startedAt: number | null;
  endedAt: number | null;

  world: World;
  flicker: 'none' | 'pending' | 'done';
  /** Player turned the light off before the flicker ran; the flicker plays first, then the room goes dark. */
  queuedLightOff: boolean;
  lightOffCount: number;

  inspected: HotspotId[];
  clues: ClueId[];
  /** Tally counts recorded on C5, one entry per visit once C5 is known. */
  tallyLog: number[];
  diaryFound: boolean;

  radio: RadioState;
  heardFreqs: string[];
  /** Everything heard on the radio, in order: echoes and Theo's lines. */
  radioLog: string[];
  contactMade: boolean;
  /** Took in the radio after hearing the voice on it: the diary becomes the next lead. */
  dialNoticed: boolean;
  /** Light-off count at first contact; any later light-off means the player went looking for Theo. */
  lightOffsAtContact: number | null;
  /** Looked at the radio desk on the other side after contact (fresh claws, the thing standing there). */
  sawAftermath: boolean;
  /** Looked at the counted marks again after Theo said "em vẫn ở chỗ em đếm". */
  wallAfterContact: boolean;

  slots: Record<SlotId, ChipId | null>;
  wrongSubmits: number;
  deductionFeedback: string | null;
  deductionSolved: boolean;

  /** When the footstep rhythm of the closing beat started (doc §K). Null until Theo has finished speaking. */
  finaleStartedAt: number | null;
  /** Times the radio was switched off mid-step. The thing turns back, the radio comes on again. */
  finaleFails: number;
  /** The radio was switched off between two steps. */
  hushed: boolean;
  theoLightSeen: boolean;
  endingReady: boolean;

  message: { id: number; text: string } | null;
  fx: { id: number; kind: FxKind } | null;
  seq: number;

  lastProgressAt: number;
  hintStage: HintStage | null;
  hintRevealed: number;
  hintsUsed: number;
}

export type Action =
  | { type: 'BEGIN'; now: number; debug?: boolean }
  | { type: 'START_PLAY'; now: number }
  | { type: 'INSPECT'; id: HotspotId; now: number }
  | { type: 'TOGGLE_LIGHT'; now: number }
  /** The player has taken in the radio after hearing the voice (the dial reads 2.58). */
  | { type: 'NOTICE_DIAL'; now: number }
  | { type: 'FLICKER_DONE'; now: number }
  | { type: 'RADIO_POWER'; on: boolean; now: number }
  /** One wheel turned by `delta` notches. A drag or a spin lands as one turn: only where it stops is heard. */
  | { type: 'RADIO_WHEEL'; index: 0 | 1 | 2; delta: number; now: number }
  | { type: 'FILL_SLOT'; slot: SlotId; chip: ChipId | null; now: number }
  | { type: 'SUBMIT_DEDUCTION'; now: number }
  /** Theo has finished speaking: the footsteps start and the radio can be switched off. */
  | { type: 'FINALE_BEGIN'; now: number }
  /** The player tried to turn the volume up; the knob comes off. */
  | { type: 'KNOB_TRY'; now: number }
  | { type: 'THEO_LIGHT'; now: number }
  | { type: 'END'; now: number }
  | { type: 'REQUEST_HINT'; now: number };
