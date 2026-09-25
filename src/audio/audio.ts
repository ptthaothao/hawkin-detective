// Gray-box audio: everything is synthesized with Web Audio so the game is playable
// before real recordings exist. Swap the bodies of these methods for file playback later;
// callers only use unlock / setRadio / cue.

import type { FxKind, RadioSignal } from '../game/types';

export type Cue = 'knock' | 'breath' | 'whisper' | 'thud' | 'click' | 'heartbeat' | 'buzz';

const RADIO_LEVEL: Record<RadioSignal, number> = {
  off: 0,
  static: 0.07,
  echo1: 0.05,
  echo2: 0.05,
  echo3: 0.05,
  precall: 0.06,
  lure: 0.3,
};

const ECHO_CUE: Partial<Record<RadioSignal, Cue>> = {
  echo1: 'knock',
  echo2: 'breath',
  echo3: 'whisper',
};

const FX_CUE: Partial<Record<FxKind, Cue>> = {
  flicker: 'buzz',
  lightOff: 'click',
  lightOn: 'click',
  movement: 'thud',
  turnBack: 'heartbeat',
  rescue: 'thud',
  dark: 'click',
};

class AudioEngine {
  private ctx: AudioContext | null = null;
  private noise: AudioBuffer | null = null;
  private staticGain: GainNode | null = null;
  private echoTimer: number | null = null;

  /** Must run inside a user gesture (title screen click). */
  unlock() {
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }
    try {
      this.ctx = new AudioContext();
    } catch {
      return;
    }
    const ctx = this.ctx;
    const len = ctx.sampleRate * 2;
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 2400;
    band.Q.value = 0.6;
    this.staticGain = ctx.createGain();
    this.staticGain.gain.value = 0;
    src.connect(band).connect(this.staticGain).connect(ctx.destination);
    src.start();
  }

  setRadio(signal: RadioSignal) {
    if (!this.ctx || !this.staticGain) return;
    this.staticGain.gain.setTargetAtTime(RADIO_LEVEL[signal], this.ctx.currentTime, 0.08);
    if (this.echoTimer !== null) window.clearInterval(this.echoTimer);
    this.echoTimer = null;
    const cue = ECHO_CUE[signal];
    if (cue) {
      this.cue(cue);
      this.echoTimer = window.setInterval(() => this.cue(cue), 4_500);
    }
  }

  fx(kind: FxKind) {
    const cue = FX_CUE[kind];
    if (cue) this.cue(cue);
  }

  cue(kind: Cue) {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    switch (kind) {
      case 'knock':
        [0.35, 0.8, 1.25].forEach((d) => this.thump(t + d, 90, 0.5));
        break;
      case 'thud':
        this.thump(t, 55, 0.8);
        break;
      case 'heartbeat':
        [0, 0.28, 0.9, 1.18].forEach((d) => this.thump(t + d, 50, 0.6));
        break;
      case 'click':
        this.noiseBurst(t, 0.03, 4000, 0.3);
        break;
      case 'breath':
        this.noiseBurst(t + 0.2, 1.4, 700, 0.18, true);
        this.noiseBurst(t + 2.0, 1.2, 600, 0.14, true);
        break;
      case 'whisper':
        this.noiseBurst(t + 0.3, 0.9, 3200, 0.12, true);
        break;
      case 'buzz': {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.value = 60;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.05, t + 0.05);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
        osc.connect(g).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 2.3);
        break;
      }
    }
  }

  private thump(at: number, hz: number, level: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.frequency.setValueAtTime(hz * 2, at);
    osc.frequency.exponentialRampToValueAtTime(hz, at + 0.08);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(level, at + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.25);
    osc.connect(g).connect(ctx.destination);
    osc.start(at);
    osc.stop(at + 0.3);
  }

  private noiseBurst(at: number, dur: number, hz: number, level: number, swell = false) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = hz;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(level, at + (swell ? dur * 0.5 : 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    src.connect(f).connect(g).connect(ctx.destination);
    src.start(at);
    src.stop(at + dur + 0.05);
  }
}

export const audio = new AudioEngine();
