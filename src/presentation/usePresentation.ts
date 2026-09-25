import { useEffect } from 'react';
import { audio, type AmbienceMode } from '../audio/audio';
import { useStore } from '../store';
import { useNow } from '../ui/useNow';
import { PRESENTATION, type Beat } from './cues';
import { deriveVisual, type VisualState } from './visual';

/** Current VisualState. Re-derives on a timer only while something is animating (branch A lure). */
export function useVisual(): VisualState {
  const game = useStore((s) => s.game);
  const now = useNow(100, game.lureStartedAt !== null && !game.rescued);
  return deriveVisual(game, now);
}

/** Plays one beat of an event. Returns timers to cancel if the event is superseded. */
function playBeat(b: Beat, fxId: number, setUi: ReturnType<typeof useStore.getState>['setUi']): number[] {
  const timers: number[] = [];
  if (b.sound) audio.cue(b.sound);
  if (b.glitchMs) {
    setUi({ glitch: true });
    timers.push(window.setTimeout(() => setUi({ glitch: false }), b.glitchMs));
  }
  if (b.surgeMs) {
    audio.surge(b.surgeMs);
    setUi({ surge: fxId });
    timers.push(
      window.setTimeout(() => {
        if (useStore.getState().ui.surge === fxId) setUi({ surge: null });
      }, b.surgeMs),
    );
  }
  return timers;
}

/** Mounted once. Plays each reducer fx through the presentation table and keeps ambience in sync. */
export function usePresentation(): VisualState {
  const visual = useVisual();
  const fx = useStore((s) => s.game.fx);
  const phase = useStore((s) => s.game.phase);
  const playing = phase === 'play';
  const setUi = useStore((s) => s.setUi);

  const { world, dread, wallClock } = visual;
  const signal = visual.radio.signal;
  const dreadStep = Math.round(dread * 10) / 10;
  let mode: AmbienceMode = 'off';
  if (playing) mode = 'play';
  else if (phase === 'intro') mode = 'intro';
  useEffect(() => audio.setRadio(playing ? signal : 'off'), [signal, playing]);
  useEffect(
    () => audio.setAmbience(world, dreadStep, wallClock === 'running', mode),
    [world, dreadStep, wallClock, mode],
  );

  const dispatch = useStore((s) => s.dispatch);

  const fxId = fx?.id;
  const fxKind = fx?.kind;
  useEffect(() => {
    if (!fxKind || fxId === undefined) return;
    const p = PRESENTATION[fxKind];
    const timers: number[] = [];
    if (p.sound) audio.cue(p.sound);
    if (p.holdRadio) audio.hold(true);
    if (p.transition) {
      setUi({ transition: { kind: p.transition.kind, id: fxId }, sceneLocked: p.transition.lockMs > 0 });
      timers.push(window.setTimeout(() => setUi({ sceneLocked: false }), p.transition.lockMs));
      timers.push(window.setTimeout(() => setUi({ transition: null }), p.transition.ms));
    }
    for (const b of p.beats ?? []) {
      if (b.atMs <= 0) timers.push(...playBeat(b, fxId, setUi));
      else timers.push(window.setTimeout(() => timers.push(...playBeat(b, fxId, setUi)), b.atMs));
    }
    // Not cancelled with the fx: the story must move on even if another event follows quickly.
    // The reducer ignores a repeat, so StrictMode's double run is harmless.
    if (p.followUp) {
      const { type, delayMs } = p.followUp;
      window.setTimeout(() => dispatch({ type }), delayMs);
    }
    if (p.glitchMs) {
      setUi({ glitch: true });
      timers.push(window.setTimeout(() => setUi({ glitch: false }), p.glitchMs));
    }
    const voice = p.radioVoice;
    if (voice) {
      const open = () => {
        const preRollMs = voice.preRollMs ?? 0;
        setUi({
          panel: 'radio',
          subtitle: {
            lines: voice.lines,
            start: Date.now() + preRollMs,
            preRollMs,
            after: voice.after,
            hushCue: voice.hushCue,
            endCue: voice.endCue,
          },
        });
      };
      if (voice.delayMs) timers.push(window.setTimeout(open, voice.delayMs));
      else open();
    }
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      if (p.holdRadio) audio.hold(false);
      // A superseded transition must not leave the scene locked.
      if (p.transition && useStore.getState().ui.transition?.id === fxId) {
        setUi({ transition: null, sceneLocked: false });
      }
      if (useStore.getState().ui.surge === fxId) setUi({ surge: null });
      if (p.glitchMs || p.beats?.some((b) => b.glitchMs)) setUi({ glitch: false });
    };
  }, [fxId, fxKind, setUi, dispatch]);

  return visual;
}
