// One table for "what the player perceives when the reducer emits an fx".
// A single game event can fan out to a sound, a scene transition, a UI glitch and a UI response.
// Major events are short timelines (`beats`) so a moment can unfold: click → dark → hum → silence → the other room.

import { MOTHER_VOICE, NARRATION, THEO_CONTACT, THEO_PRECALL, type DialogueLine } from '../game/content';
import type { Action, FxKind } from '../game/types';
import type { Cue } from '../audio/audio';

export type Transition = 'arrive' | 'lightOff' | 'lightOn' | 'dark';

export interface RadioVoice {
  lines: DialogueLine[];
  /** Wait before the radio close-up opens (let the previous moment land). */
  delayMs?: number;
  /** Static surge, then silence, before the first line. */
  preRollMs?: number;
  /** The player's own thought once the voice is gone. */
  after?: string;
  /** Heard in the silence before the first line. */
  hushCue?: Cue;
  /** Heard when the voice is gone: the radio cuts out, or something answers. */
  endCue?: Cue;
}

/** One moment inside an event, `atMs` after it starts. */
export interface Beat {
  atMs: number;
  sound?: Cue;
  glitchMs?: number;
  /** The radio on the desk bursts loud and the camera is drawn to it. */
  surgeMs?: number;
}

export interface Presentation {
  sound?: Cue;
  /** Scene-wide transition; `lockMs` blocks scene input while it plays, `ms` is how long it is drawn. */
  transition?: { kind: Transition; lockMs: number; ms: number };
  beats?: Beat[];
  /** Keep the radio silent from the start of the event until the first surge. */
  holdRadio?: boolean;
  /** Brief UI distortion (ms). Keep rare: horror works when effects are scarce. */
  glitchMs?: number;
  /** Open the radio close-up and play these lines as a voice on the radio. */
  radioVoice?: RadioVoice;
  /** A game action the moment leads into, once it has played out. */
  followUp?: { type: Extract<Action['type'], 'NOTICE_DIAL'>; delayMs: number };
}

export const PRESENTATION: Record<FxKind, Presentation> = {
  // Doc §J opening: the door opens, closes behind you, the room is quiet — then the radio surges.
  arrive: {
    transition: { kind: 'arrive', lockMs: 4_300, ms: 2_700 },
    holdRadio: true,
    beats: [
      { atMs: 150, sound: 'doorOpen' },
      { atMs: 1_700, sound: 'doorClose' },
      { atMs: 3_100, surgeMs: 1_300, glitchMs: 180, sound: 'distort' },
    ],
  },
  motherVoice: {
    glitchMs: 250,
    radioVoice: { lines: MOTHER_VOICE, preRollMs: 1_900, after: NARRATION.motherVoiceAfter, hushCue: 'breath', endCue: 'cut' },
    followUp: { type: 'NOTICE_DIAL', delayMs: 6_700 },
  },
  flicker: { sound: 'buzz' },
  // World flip (doc §I): switch → dark → the radio tears → a stutter of the other room → silence → torch.
  lightOff: {
    sound: 'switch',
    transition: { kind: 'lightOff', lockMs: 2_000, ms: 2_500 },
    beats: [
      { atMs: 180, sound: 'distort' },
      { atMs: 1_050, glitchMs: 160 },
      { atMs: 2_000, sound: 'torch' },
    ],
  },
  lightOn: { sound: 'switch', transition: { kind: 'lightOn', lockMs: 0, ms: 600 } },
  dark: { sound: 'switch', transition: { kind: 'dark', lockMs: 1_100, ms: 1_900 } },
  movement: { sound: 'thud', glitchMs: 350, beats: [{ atMs: 700, sound: 'creak' }] },
  // Switched off mid-step: it stops, turns towards the radio, and the radio comes back on by itself.
  turnBack: { sound: 'heartbeat', glitchMs: 600, beats: [{ atMs: 1_300, sound: 'scratch' }] },
  // Switched off between two steps: silence, a hand on the door, and it walks on.
  hush: { sound: 'cut', beats: [{ atMs: 1_100, sound: 'scratch' }] },
  // 3.17 (doc §F): the room goes quiet, Theo answers — and something answers the radio too.
  contact: {
    glitchMs: 450,
    radioVoice: { lines: THEO_CONTACT, preRollMs: 2_600, after: NARRATION.contactAfter, endCue: 'scratch' },
  },
  // The truth lands in the Case File first; then the radio crackles on by itself.
  precall: { radioVoice: { lines: THEO_PRECALL, delayMs: 3_400, preRollMs: 1_600 } },
  theoLight: { beats: [{ atMs: 1_800, sound: 'whistle' }] },
};
