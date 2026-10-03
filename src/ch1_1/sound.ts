// Chapter 1.1 sound, synthesized with Web Audio like Chapter 0 so the chapter is playable before
// real recordings exist. Swap a method body for file playback later; callers stay the same.

export type Sfx =
  | 'bark'
  | 'surge'
  | 'torch'
  | 'creak'
  | 'slam'
  | 'click'
  | 'drop'
  | 'rustle'
  | 'step'
  | 'mmm'
  | 'inhale'
  | 'gasp'
  | 'rip'
  | 'radioOn';

class Ch11Sound {
  private ctx: AudioContext | null = null;
  private noise: AudioBuffer | null = null;
  private master: GainNode | null = null;
  private staticGain: GainNode | null = null;
  private roomGain: GainNode | null = null;
  private heartTimer: number | null = null;
  private heartRate = 0;
  private breathTimer: number | null = null;
  private breathRate = 0;

  /** Must run inside a user gesture. */
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
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

    this.master = ctx.createGain();
    this.master.connect(ctx.destination);

    // The radio on the desk: band-passed hiss.
    const hiss = this.loopNoise();
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 2200;
    band.Q.value = 0.7;
    this.staticGain = ctx.createGain();
    this.staticGain.gain.value = 0;
    hiss.connect(band).connect(this.staticGain).connect(this.master);

    // The house at night: a low hum and a little wind.
    this.roomGain = ctx.createGain();
    this.roomGain.gain.value = 0;
    this.roomGain.connect(this.master);
    const wind = this.loopNoise();
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 280;
    wind.connect(lp).connect(this.roomGain);
    const hum = ctx.createOscillator();
    hum.frequency.value = 58;
    const humGain = ctx.createGain();
    humGain.gain.value = 0.02;
    hum.connect(humGain).connect(this.roomGain);
    hum.start();
  }

  private loopNoise() {
    const src = this.ctx!.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    src.start();
    return src;
  }

  private ramp(g: GainNode | null, v: number, s = 0.4) {
    if (!this.ctx || !g) return;
    const t = this.ctx.currentTime;
    g.gain.cancelScheduledValues(t);
    g.gain.setTargetAtTime(v, t, s / 3);
  }

  setRadio(level: number) {
    this.ramp(this.staticGain, level, 0.15);
  }

  setRoom(level: number) {
    this.ramp(this.roomGain, level, 1.2);
  }

  /** Everything at once falls silent (the scream that makes no sound). */
  silence(on: boolean) {
    this.ramp(this.master, on ? 0 : 1, on ? 0.05 : 1.5);
    if (on) {
      this.heart(0);
      this.breathing(0);
    }
  }

  /** Heartbeats per minute; 0 stops. */
  heart(bpm: number) {
    if (bpm === this.heartRate) return;
    this.heartRate = bpm;
    if (this.heartTimer !== null) window.clearTimeout(this.heartTimer);
    this.heartTimer = null;
    if (!bpm || !this.ctx) return;
    const beat = () => {
      const t = this.ctx!.currentTime;
      this.thump(t, 52, 0.5);
      this.thump(t + 0.16, 46, 0.32);
      this.heartTimer = window.setTimeout(beat, 60_000 / this.heartRate);
    };
    beat();
  }

  /** Theo's own breathing, close to the ear. Breaths per minute; 0 holds it (silence). */
  breathing(bpm: number) {
    if (bpm === this.breathRate) return;
    this.breathRate = bpm;
    if (this.breathTimer !== null) window.clearTimeout(this.breathTimer);
    this.breathTimer = null;
    if (!bpm || !this.ctx) return;
    const breath = () => {
      const t = this.ctx!.currentTime;
      const cycle = 60 / this.breathRate;
      const fast = this.breathRate > 30;
      this.airflow(t, cycle * 0.4, fast ? 1500 : 1100, fast ? 0.07 : 0.035, true);
      this.airflow(t + cycle * 0.45, cycle * 0.5, fast ? 900 : 700, fast ? 0.08 : 0.04, false);
      this.breathTimer = window.setTimeout(breath, cycle * 1000);
    };
    breath();
  }

  private airflow(t: number, dur: number, freq: number, gain: number, rising: boolean) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = freq;
    f.Q.value = 0.8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(gain, t + dur * (rising ? 0.8 : 0.2));
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(this.master!);
    src.start(t, Math.random());
    src.stop(t + dur + 0.05);
  }

  private noiseBurst(t: number, dur: number, freq: number, gain: number, type: BiquadFilterType = 'bandpass') {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(this.master!);
    src.start(t, Math.random());
    src.stop(t + dur + 0.05);
  }

  private thump(t: number, hz: number, gain: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.setValueAtTime(hz * 1.8, t);
    o.frequency.exponentialRampToValueAtTime(hz, t + 0.08);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    o.connect(g).connect(this.master!);
    o.start(t);
    o.stop(t + 0.35);
  }

  private creak(t: number, dur: number, from: number, to: number, gain: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(from, t);
    o.frequency.linearRampToValueAtTime(to, t + dur);
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 900;
    f.Q.value = 6;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(gain, t + dur * 0.2);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.connect(f).connect(g).connect(this.master!);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  /** A dog outside, through the window: a few rough barks. */
  private bark(t: number) {
    const ctx = this.ctx!;
    [0, 0.32, 0.62, 1.5, 1.78].forEach((d, i) => {
      const at = t + d;
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(420 + (i % 2) * 60, at);
      o.frequency.exponentialRampToValueAtTime(230, at + 0.14);
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = 1100;
      f.Q.value = 1.2;
      const muffle = ctx.createBiquadFilter();
      muffle.type = 'lowpass';
      muffle.frequency.value = 1800;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(0.22, at + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 0.18);
      o.connect(f).connect(muffle).connect(g).connect(this.master!);
      o.start(at);
      o.stop(at + 0.2);
      this.noiseBurst(at, 0.12, 1400, 0.06);
    });
  }

  /**
   * The thing's only sound: a long, choked "Mmm…" from a throat that can't make words.
   * A low buzzing source through nasal formants, with the voice catching and breaking.
   */
  private mmm(t: number) {
    const ctx = this.ctx!;
    const dur = 3.2;
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(92, t);
    o.frequency.linearRampToValueAtTime(104, t + 0.9);
    o.frequency.linearRampToValueAtTime(78, t + dur);
    // An unsteady throat: slow wobble plus fast jitter.
    const wob = ctx.createOscillator();
    wob.frequency.value = 5.3;
    const wobGain = ctx.createGain();
    wobGain.gain.value = 3.5;
    wob.connect(wobGain).connect(o.frequency);
    const nasal = ctx.createBiquadFilter();
    nasal.type = 'bandpass';
    nasal.frequency.value = 260;
    nasal.Q.value = 4;
    const murmur = ctx.createBiquadFilter();
    murmur.type = 'peaking';
    murmur.frequency.value = 1050;
    murmur.gain.value = -18;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.9, t + 0.35);
    // The voice catches: short drops, as if the throat closes.
    [0.8, 1.35, 1.6, 2.3, 2.75].forEach((c, i) => {
      g.gain.setValueAtTime(0.9 - i * 0.08, t + c);
      g.gain.linearRampToValueAtTime(0.06, t + c + 0.05);
      g.gain.linearRampToValueAtTime(0.85 - i * 0.1, t + c + 0.14);
    });
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(nasal).connect(murmur).connect(g).connect(this.master!);
    o.start(t);
    wob.start(t);
    o.stop(t + dur + 0.05);
    wob.stop(t + dur + 0.05);
    // Wet breath underneath.
    this.noiseBurst(t, dur, 500, 0.05, 'lowpass');
  }

  play(sfx: Sfx) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    switch (sfx) {
      case 'bark':
        this.bark(t);
        break;
      case 'surge':
        this.noiseBurst(t, 1.6, 2400, 0.55);
        this.noiseBurst(t, 0.9, 600, 0.3);
        break;
      case 'torch':
      case 'click':
        this.noiseBurst(t, 0.015, 5200, 0.25);
        break;
      case 'creak':
        this.creak(t, 2.2, 140, 260, 0.08);
        break;
      case 'slam':
        this.thump(t, 70, 1);
        this.noiseBurst(t, 0.25, 900, 0.4);
        break;
      case 'drop':
        [0.05, 0.3].forEach((d, i) => {
          this.thump(t + d, 180 - i * 40, 0.3 / (i + 1));
          this.noiseBurst(t + d, 0.08, 2000, 0.12 / (i + 1));
        });
        break;
      case 'rustle':
        this.noiseBurst(t, 0.6, 3000, 0.08);
        break;
      case 'step':
        this.thump(t, 58, 0.85);
        this.noiseBurst(t + 0.02, 0.1, 650, 0.2);
        this.creak(t + 0.05, 0.4, 260, 190, 0.04);
        break;
      case 'mmm':
        this.mmm(t);
        break;
      case 'inhale':
        this.noiseBurst(t, 0.5, 1800, 0.1);
        break;
      case 'gasp':
        this.noiseBurst(t, 0.35, 1500, 0.3);
        break;
      case 'rip':
        this.noiseBurst(t, 0.3, 1200, 0.5);
        this.thump(t, 90, 0.8);
        break;
      case 'radioOn':
        this.noiseBurst(t, 0.015, 5200, 0.2);
        this.noiseBurst(t + 0.05, 1.2, 2200, 0.15);
        break;
    }
  }

  /** Chapter 1.2's own sounds, on the same synth. */
  play12(sfx: Sfx12) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    switch (sfx) {
      case 'scream': {
        // a child's scream, this time with a voice: a rising, cracking tone
        const o = this.ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(620, t);
        o.frequency.linearRampToValueAtTime(980, t + 0.35);
        o.frequency.linearRampToValueAtTime(760, t + 1.1);
        const f = this.ctx.createBiquadFilter();
        f.type = 'bandpass';
        f.frequency.value = 1700;
        f.Q.value = 1.4;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.28, t + 0.06);
        g.gain.linearRampToValueAtTime(0.22, t + 0.9);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
        o.connect(f).connect(g).connect(this.master!);
        o.start(t);
        o.stop(t + 1.25);
        this.noiseBurst(t, 1.1, 3000, 0.05);
        break;
      }
      case 'tumble':
        [0, 0.16, 0.31, 0.5, 0.62, 0.9].forEach((d, i) => {
          this.thump(t + d, 90 - i * 6, 0.5);
          this.noiseBurst(t + d, 0.12, 700, 0.18);
        });
        break;
      case 'cans':
        // tin cans going over: bright, uneven clinks that die away
        [0, 0.07, 0.13, 0.3, 0.37, 0.52, 0.8].forEach((d, i) => {
          const o = this.ctx!.createOscillator();
          o.type = 'triangle';
          o.frequency.setValueAtTime(1500 + ((i * 487) % 1100), t + d);
          const g = this.ctx!.createGain();
          g.gain.setValueAtTime(0.16 / (1 + i * 0.25), t + d);
          g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.22);
          o.connect(g).connect(this.master!);
          o.start(t + d);
          o.stop(t + d + 0.25);
          this.noiseBurst(t + d, 0.05, 4500, 0.1);
        });
        break;
      case 'garageSlam':
        this.thump(t, 46, 1);
        this.thump(t + 0.04, 62, 0.8);
        this.noiseBurst(t, 0.5, 700, 0.6);
        this.noiseBurst(t + 0.12, 1.4, 250, 0.3, 'lowpass');
        this.thump(t + 0.35, 55, 0.25);
        break;
      case 'tick':
        this.noiseBurst(t, 0.03, 3800, 0.2);
        this.thump(t, 320, 0.1);
        break;
      case 'stepYard':
        this.thump(t, 70, 0.5);
        this.noiseBurst(t + 0.02, 0.18, 1400, 0.16, 'lowpass');
        break;
      case 'doorSoft':
        this.creak(t, 1.4, 120, 180, 0.04);
        this.noiseBurst(t + 1.3, 0.05, 900, 0.1);
        break;
      case 'doorCreak':
        this.creak(t, 0.9, 150, 340, 0.1);
        break;
    }
  }
}

export type Sfx12 = 'scream' | 'tumble' | 'cans' | 'garageSlam' | 'tick' | 'stepYard' | 'doorSoft' | 'doorCreak';

export const sound = new Ch11Sound();
