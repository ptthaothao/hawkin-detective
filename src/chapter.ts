/**
 * Which chapter this page plays. `?chapter=1.1` picks Chapter 1.1; anything else is Chapter 0.
 * Finished chapters are remembered per browser so the menu can offer them later.
 */
export type ChapterId = '0' | '1.1';

const KEY = 'static.progress';

export function currentChapter(): ChapterId {
  return new URLSearchParams(window.location.search).get('chapter') === '1.1' ? '1.1' : '0';
}

export function finished(): ChapterId[] {
  try {
    const v = JSON.parse(window.localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((c): c is ChapterId => c === '0' || c === '1.1') : [];
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

export function goToChapter(id: ChapterId) {
  const url = new URL(window.location.href);
  if (id === '0') url.searchParams.delete('chapter');
  else url.searchParams.set('chapter', id);
  window.location.assign(url.toString());
}
