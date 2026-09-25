import { describe, expect, it } from 'vitest';
import { PRESENTATION } from './cues';

describe('presentation timelines', () => {
  it('a scene lock outlasts its transition by at most the moment that follows it', () => {
    for (const p of Object.values(PRESENTATION)) {
      if (p.transition) expect(p.transition.lockMs).toBeLessThanOrEqual(p.transition.ms + 2_000);
    }
  });

  it('beats play in order', () => {
    for (const p of Object.values(PRESENTATION)) {
      const at = (p.beats ?? []).map((b) => b.atMs);
      expect(at).toEqual([...at].sort((a, b) => a - b));
    }
  });

  it('walking in: the door closes, the room is quiet, then the radio surges before control returns', () => {
    const { arrive } = PRESENTATION;
    expect(arrive.holdRadio).toBe(true);
    const close = arrive.beats!.find((b) => b.sound === 'doorClose')!.atMs;
    const surge = arrive.beats!.find((b) => b.surgeMs)!;
    expect(surge.atMs).toBeGreaterThan(close);
    expect(arrive.transition!.lockMs).toBeGreaterThanOrEqual(surge.atMs + surge.surgeMs! - 200);
  });

  it('the world flip hands the player a working flashlight only after the room has changed', () => {
    const { lightOff } = PRESENTATION;
    const torch = lightOff.beats!.find((b) => b.sound === 'torch')!.atMs;
    expect(torch).toBeGreaterThanOrEqual(lightOff.transition!.lockMs);
  });

  it('the voice at 02:58 ends with the radio cutting out; Theo at 3.17 with something answering', () => {
    expect(PRESENTATION.motherVoice.radioVoice?.endCue).toBe('cut');
    expect(PRESENTATION.contact.radioVoice?.endCue).toBe('scratch');
  });
});
