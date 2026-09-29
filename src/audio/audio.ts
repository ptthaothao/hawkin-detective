// Gray-box audio: everything is synthesized with Web Audio so the game is playable
// before real recordings exist. Swap the bodies of these methods for file playback later;
// callers only use unlock / setRadio / setAmbience / tune / surge / duck / voice / cue.

import type { RadioSignal, World } from '../game/types';

export type Cue =
  | 'knock'
  | 'breath'
  | 'whisper'
  | 'thud'
  | 'click'
  | 'heartbeat'
  | 'buzz'
  | 'door'
  | 'squelch'
  | 'note'
  // physical actions
  | 'detent'
  | 'page'
  | 'creak'
  | 'switch'
  | 'torch'
  | 'drop'
  | 'doorOpen'
  | 'doorClose'
  // the world answering
  | 'distort'
  | 'cut'
  | 'scratch'
  | 'thunder'
  // the closing beat
  | 'footstep'
  | 'whistle';

/** What the room sounds like: nothing (title, ending), rain only (intro), or the full room. */
export type AmbienceMode = 'off' | 'intro' | 'play';

const RADIO_LEVEL: Record<RadioSignal, number> = {
  off: 0,
  static: 0.07,
  echo1: 0.05,
  echo2: 0.05,
  echo3: 0.05,
  precall: 0.06,
  steps: 0.09,
};

const ECHO_CUE: Partial<Record<RadioSignal, Cue>> = {
  echo1: 'knock',
  echo2: 'breath',
  echo3: 'whisper',
};

class AudioEngine {
  private ctx: AudioContext | null = null;
  private noise: AudioBuffer | null = null;
  private staticGain: GainNode | null = null;
  private staticBand: BiquadFilterNode | null = null;
  private staticTone: BiquadFilterNode | null = null;
  private echoTimer: number | null = null;
  /** Everything that is "the room" (hum, rain, clock, drone) goes through here so a voice can hush it. */
  private room: GainNode | null = null;
  private droneGain: GainNode | null = null;
  private humGain: GainNode | null = null;
  private rainGain: GainNode | null = null;
  private tickTimer: number | null = null;
  private signal: RadioSignal = 'off';
  private ducked = false;
  /** The radio is held silent (arrival: the room is quiet before the radio surges). */
  private held = false;
  private surging = false;
  private near = 0;

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

    this.room = ctx.createGain();
    this.room.connect(ctx.destination);

    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    this.staticBand = ctx.createBiquadFilter();
    this.staticBand.type = 'bandpass';
    this.staticBand.frequency.value = 2400;
    this.staticBand.Q.value = 0.6;
    this.staticGain = ctx.createGain();
    this.staticGain.gain.value = 0;
    // Heard through the wall from the other side: muffled.
    this.staticTone = ctx.createBiquadFilter();
    this.staticTone.type = 'lowpass';
    this.staticTone.frequency.value = 9000;
    src.connect(this.staticBand).connect(this.staticTone).connect(this.staticGain).connect(ctx.destination);
    src.start();

    // Other side: two detuned low tones beating against each other + filtered wind.
    this.droneGain = ctx.createGain();
    this.droneGain.gain.value = 0;
    this.droneGain.connect(this.room);
    [41, 43.7].forEach((hz) => {
      const o = ctx.createOscillator();
      o.frequency.value = hz;
      o.connect(this.droneGain!);
      o.start();
    });
    const wind = ctx.createBufferSource();
    wind.buffer = this.noise;
    wind.loop = true;
    const windTone = ctx.createBiquadFilter();
    windTone.type = 'lowpass';
    windTone.frequency.value = 320;
    const windGain = ctx.createGain();
    windGain.gain.value = 0.5;
    wind.connect(windTone).connect(windGain).connect(this.droneGain);
    wind.start();

    // This side: the desk lamp's mains hum.
    this.humGain = ctx.createGain();
    this.humGain.gain.value = 0;
    this.humGain.connect(this.room);
    const hum = ctx.createOscillator();
    hum.frequency.value = 120;
    hum.connect(this.humGain);
    hum.start();

    // This side: rain on the window. Soft, high, with a slow swell so it never sounds looped.
    const rain = ctx.createBufferSource();
    rain.buffer = this.noise;
    rain.loop = true;
    rain.playbackRate.value = 0.83;
    const rainHi = ctx.createBiquadFilter();
    rainHi.type = 'highpass';
    rainHi.frequency.value = 900;
    const rainLo = ctx.createBiquadFilter();
    rainLo.type = 'lowpass';
    rainLo.frequency.value = 5200;
    this.rainGain = ctx.createGain();
    this.rainGain.gain.value = 0;
    const swell = ctx.createOscillator();
    swell.frequency.value = 0.07;
    const swellDepth = ctx.createGain();
    swellDepth.gain.value = 0.006;
    swell.connect(swellDepth).connect(this.rainGain.gain);
    swell.start();
    rain.connect(rainHi).connect(rainLo).connect(this.rainGain).connect(this.room);
    rain.start();
  }

  /** Room tone per world. `dread` 0..1 swells the drone; the wall clock ticks only while it runs. */
  setAmbience(world: World, dread: number, clockRunning: boolean, mode: AmbienceMode) {
    const ctx = this.ctx;
    if (!ctx || !this.droneGain || !this.humGain || !this.staticTone || !this.rainGain) return;
    const t = ctx.currentTime;
    const other = world === 'other';
    const play = mode === 'play';
    this.droneGain.gain.setTargetAtTime(play && other ? 0.05 + dread * 0.12 : 0, t, 0.6);
    this.humGain.gain.setTargetAtTime(play && !other ? 0.006 : 0, t, 0.3);
    // No rain on the other side: the window there looks out on nothing.
    let rain = 0;
    if (mode === 'intro') rain = 0.02;
    else if (play && !other) rain = 0.014;
    this.rainGain.gain.setTargetAtTime(rain, t, other ? 0.08 : 0.8);
    this.staticTone.frequency.setTargetAtTime(other ? 700 : 9000, t, 0.2);
    const tick = play && !other && clockRunning;
    if (tick && this.tickTimer === null) {
      this.tickTimer = window.setInterval(() => this.noiseBurst(ctx.currentTime, 0.012, 5200, 0.05, false, this.room!), 1_000);
    } else if (!tick && this.tickTimer !== null) {
      window.clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
  }

  setRadio(signal: RadioSignal) {
    this.signal = signal;
    this.applyStatic(0.08);
    if (this.echoTimer !== null) window.clearInterval(this.echoTimer);
    this.echoTimer = null;
    const cue = ECHO_CUE[signal];
    if (cue) {
      this.cue(cue);
      this.echoTimer = window.setInterval(() => this.cue(cue), 4_500);
    }
  }

  private staticLevel() {
    if (this.ducked || this.held) return 0.004;
    return RADIO_LEVEL[this.signal] * (0.75 + this.near * 0.7);
  }

  private applyStatic(tc: number) {
    if (!this.ctx || !this.staticGain || this.surging) return;
    this.staticGain.gain.setTargetAtTime(this.staticLevel(), this.ctx.currentTime, tc);
  }

  /** A voice is coming through: the static drops away almost to silence, and the room with it. */
  duck(on: boolean) {
    if (this.ducked === on) return;
    this.ducked = on;
    this.applyStatic(on ? 0.25 : 0.05);
    if (this.ctx && this.room) this.room.gain.setTargetAtTime(on ? 0.25 : 1, this.ctx.currentTime, on ? 0.8 : 0.4);
  }

  /** Hold the radio silent until the next surge. */
  hold(on: boolean) {
    this.held = on;
    this.applyStatic(0.05);
  }

  /** The radio bursts loud for `ms`, then settles back. Releases a hold. */
  surge(ms: number, level = 0.28) {
    const ctx = this.ctx;
    if (!ctx || !this.staticGain) return;
    this.held = false;
    this.surging = true;
    const t = ctx.currentTime;
    this.staticGain.gain.cancelScheduledValues(t);
    this.staticGain.gain.setTargetAtTime(level, t, 0.02);
    this.staticGain.gain.setTargetAtTime(level * 0.55, t + ms / 2000, 0.05);
    window.setTimeout(() => {
      this.surging = false;
      this.applyStatic(0.25);
    }, ms);
  }

  /** How close the pointer is to the radio on the desk (0 far … 1 on it): static comes up to meet you. */
  radioNear(k: number) {
    this.near = k;
    this.applyStatic(0.3);
  }

  /** The dial moved: static shifts pitch with the frequency. */
  tune(mhz: number) {
    const ctx = this.ctx;
    if (!ctx || !this.staticBand) return;
    const hz = 700 + (mhz - 1) * 780 + ((Math.round(mhz * 100) * 37) % 11) * 55;
    this.staticBand.frequency.setTargetAtTime(hz, ctx.currentTime, 0.03);
  }

  /** Murmur under a subtitle line: syllable-sized bursts in the voice band, never words. */
  voice(ms: number, level = 0.045) {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime + 0.05;
    const end = (ms / 1000) * 0.8;
    for (let at = 0; at < end; ) {
      const dur = 0.09 + Math.random() * 0.08;
      this.noiseBurst(t + at, dur, 480 + Math.random() * 700, level * (0.6 + Math.random() * 0.4), true);
      at += dur + 0.04 + (Math.random() < 0.2 ? 0.22 : Math.random() * 0.06);
    }
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
      case 'door':
        // Radio static heard through a closed door.
        this.noiseBurst(t, 2.6, 420, 0.12, true);
        break;
      case 'note': {
        // A new objective: a soft pencil-tap of a tone, felt more than heard.
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.frequency.value = 660;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.04, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
        osc.connect(g).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.65);
        break;
      }
      case 'squelch':
        this.noiseBurst(t, 0.09, 1800, 0.08);
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
      case 'detent':
        // One notch of a thumbwheel.
        this.noiseBurst(t, 0.008, 5200, 0.09);
        this.thump(t, 900, 0.02);
        break;
      case 'page':
        this.noiseBurst(t, 0.28, 2600, 0.05, true);
        this.noiseBurst(t + 0.22, 0.05, 1500, 0.06);
        break;
      case 'creak':
        this.creak(t, 0.8, 340, 190, 0.1);
        break;
      case 'switch':
        // Heavy bakelite switch: snap + the mains pop in the bulb.
        this.noiseBurst(t, 0.02, 2600, 0.35);
        this.thump(t + 0.01, 70, 0.25);
        break;
      case 'torch':
        this.noiseBurst(t, 0.012, 5600, 0.18);
        break;
      case 'drop':
        // A flashlight falling into the dark under the floor: knocks, then less, then nothing.
        [0.35, 0.8, 1.15].forEach((d, i) => {
          this.thump(t + d, 240 - i * 40, 0.22 / (i + 1));
          this.noiseBurst(t + d, 0.04, 2800, 0.05 / (i + 1));
        });
        break;
      case 'footstep':
        // One heavy step on old boards, the radio catching it.
        this.thump(t, 62, 0.9);
        this.noiseBurst(t + 0.02, 0.09, 700, 0.22);
        this.creak(t + 0.05, 0.35, 300, 200, 0.05);
        break;
      case 'whistle': {
        // Two faint notes from far off. Nobody is there.
        [0, 0.7].forEach((d, i) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(i === 0 ? 784 : 659, t + d);
          g.gain.setValueAtTime(0.0001, t + d);
          g.gain.exponentialRampToValueAtTime(0.03, t + d + 0.08);
          g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.6);
          osc.connect(g).connect(ctx.destination);
          osc.start(t + d);
          osc.stop(t + d + 0.65);
        });
        break;
      }
      case 'doorOpen':
        this.creak(t, 1.3, 260, 150, 0.08);
        break;
      case 'doorClose':
        this.thump(t, 60, 0.6);
        this.noiseBurst(t + 0.09, 0.02, 3000, 0.14);
        break;
      case 'distort': {
        // The radio tearing: two square waves stepping between wrong pitches.
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.045, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
        const f = ctx.createBiquadFilter();
        f.type = 'bandpass';
        f.frequency.value = 1400;
        g.connect(f).connect(ctx.destination);
        [180, 187].forEach((hz) => {
          const o = ctx.createOscillator();
          o.type = 'square';
          for (let k = 0; k < 12; k++) o.frequency.setValueAtTime(hz * (0.6 + Math.random()), t + k * 0.045);
          o.connect(g);
          o.start(t);
          o.stop(t + 0.6);
        });
        break;
      }
      case 'cut': {
        // The radio cuts out: a snap, then no static at all for a moment.
        this.noiseBurst(t, 0.015, 3000, 0.25);
        if (!this.staticGain) break;
        this.surging = true;
        this.staticGain.gain.cancelScheduledValues(t);
        this.staticGain.gain.setTargetAtTime(0, t, 0.005);
        window.setTimeout(() => {
          this.surging = false;
          this.applyStatic(0.4);
        }, 1_400);
        break;
      }
      case 'scratch':
        // Three slow drags of something hard across wood.
        [0, 0.55, 1.2].forEach((d, i) => {
          this.noiseBurst(t + d, 0.32, 2400 + i * 300, 0.1, true);
          this.noiseBurst(t + d + 0.05, 0.25, 900, 0.05, true);
        });
        break;
      case 'thunder':
        this.noiseBurst(t, 3.4, 110, 0.5, true);
        this.noiseBurst(t + 0.2, 1.6, 260, 0.12, true);
        break;
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

  /** Wood under weight: a narrow resonance sliding down through noise. */
  private creak(at: number, dur: number, fromHz: number, toHz: number, level: number) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.Q.value = 18;
    f.frequency.setValueAtTime(fromHz, at);
    f.frequency.exponentialRampToValueAtTime(toHz, at + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(level, at + dur * 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    src.connect(f).connect(g).connect(ctx.destination);
    src.start(at);
    src.stop(at + dur + 0.05);
  }

  private noiseBurst(at: number, dur: number, hz: number, level: number, swell = false, out?: AudioNode) {
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
    src.connect(f).connect(g).connect(out ?? ctx.destination);
    src.start(at);
    src.stop(at + dur + 0.05);
  }
}

export const audio = new AudioEngine();
