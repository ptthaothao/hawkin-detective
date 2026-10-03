/**
 * Which chapter this page plays. `?chapter=1.1` / `?chapter=1.2` pick those chapters; anything else is Chapter 0.
 * Finished chapters are remembered per browser so the menu can offer them later.
 */
export type ChapterId = '0' | '1.1' | '1.2';

const KEY = 'static.progress';

export function currentChapter(): ChapterId {
  const c = new URLSearchParams(window.location.search).get('chapter');
  return c === '1.1' || c === '1.2' ? c : '0';
}

export function finished(): ChapterId[] {
  try {
    const v = JSON.parse(window.localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((c): c is ChapterId => c === '0' || c === '1.1' || c === '1.2') : [];
  } catch {
    return [];
  }
}

export function markFinished(id: ChapterId) {
  try {
    const all = new Set(finished());
    all.add(id);
    window.localStorage.setItem(KEY, JSON.stringify([...all]));
  } catch {
    // Private mode or blocked storage: progress just isn't remembered.
  }
}

/** Fixed targets only: the destination never comes from the current URL. */
const CHAPTER_URL: Record<ChapterId, string> = {
  '0': './',
  '1.1': './?chapter=1.1',
  '1.2': './?chapter=1.2',
};

export function goToChapter(id: ChapterId) {
  window.location.assign(CHAPTER_URL[id]);
}
