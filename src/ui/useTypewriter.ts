import { useEffect, useState } from 'react';
import { prefersReducedMotion } from './useNow';

const CHAR_MS = 22;

/** Reveals `text` a few characters at a time, like a line being typed out. Restarts when `key` changes. */
export function useTypewriter(text: string, key: unknown): string {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (prefersReducedMotion()) {
      setN(text.length);
      return;
    }
    setN(0);
    const id = window.setInterval(() => {
      setN((k) => {
        if (k >= text.length) window.clearInterval(id);
        return Math.min(text.length, k + 2);
      });
    }, CHAR_MS * 2);
    return () => window.clearInterval(id);
  }, [text, key]);
  return text.slice(0, n);
}
