import { useEffect, useState } from 'react';

const between = (min: number, max: number) => min + Math.random() * (max - min);

/**
 * Something that happens now and then, never on a beat: lightning, a presence in the house.
 * Returns a key while the event is playing (`holdMs`), null otherwise. Irregular gaps keep the
 * room from feeling like a looping animation.
 */
export function useRandomEvent(active: boolean, minMs: number, maxMs: number, holdMs: number, firstMs?: number) {
  const [event, setEvent] = useState<number | null>(null);
  useEffect(() => {
    if (!active) return;
    let timer = 0;
    const schedule = (ms: number) => {
      timer = window.setTimeout(() => {
        setEvent(Date.now());
        timer = window.setTimeout(() => {
          setEvent(null);
          schedule(between(minMs, maxMs));
        }, holdMs);
      }, ms);
    };
    schedule(firstMs ?? between(minMs, maxMs));
    return () => {
      window.clearTimeout(timer);
      setEvent(null);
    };
  }, [active, minMs, maxMs, holdMs, firstMs]);
  return event;
}
