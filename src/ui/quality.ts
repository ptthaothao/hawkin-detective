import { useEffect, useSyncExternalStore } from 'react';

/**
 * Render quality. 'low' drops the effects that cost the most on weak GPUs: blend modes
 * (multiply / screen / overlay are extra full-screen passes every frame) and the film grain.
 *
 * Chosen automatically from the frame rate of the first seconds in the room and remembered
 * per browser. `?quality=low` or `?quality=high` forces it.
 */
export type Quality = 'high' | 'low';

const KEY = 'static.quality';
const SAMPLE_MS = 3_000;
/** Below this average frame rate the room switches to low. */
const LOW_FPS = 40;

function forced(): Quality | null {
  const q = new URLSearchParams(window.location.search).get('quality');
  return q === 'low' || q === 'high' ? q : null;
}

function remembered(): Quality | null {
  try {
    const q = window.localStorage.getItem(KEY);
    return q === 'low' || q === 'high' ? q : null;
  } catch {
    return null;
  }
}

let quality: Quality = forced() ?? remembered() ?? 'high';
const listeners = new Set<() => void>();

function apply(q: Quality) {
  document.documentElement.dataset.quality = q;
}
apply(quality);

export function setQuality(q: Quality) {
  if (q === quality) return;
  quality = q;
  apply(q);
  try {
    window.localStorage.setItem(KEY, q);
  } catch {
    // Private mode or blocked storage: the choice just isn't remembered.
  }
  listeners.forEach((l) => l());
}

export function useQuality(): Quality {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => quality,
  );
}

/** Measures the frame rate once, while `active`, and drops to low if the machine can't keep up. */
export function useAutoQuality(active: boolean) {
  useEffect(() => {
    if (!active || forced() || remembered()) return;
    let frames = 0;
    let start = 0;
    let last = 0;
    let raf = 0;
    const tick = (t: number) => {
      // A long gap means the tab was hidden, not a slow machine: start over.
      if (!start || t - last > 1_000) {
        start = t;
        frames = 0;
      }
      last = t;
      frames++;
      if (t - start < SAMPLE_MS) {
        raf = requestAnimationFrame(tick);
        return;
      }
      setQuality((frames * 1000) / (t - start) < LOW_FPS ? 'low' : 'high');
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);
}
