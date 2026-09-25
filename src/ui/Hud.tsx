import { useEffect, useRef, useState } from 'react';
import { CLUES } from '../game/content';
import { audio } from '../audio/audio';
import { DISCOVERIES, LOCATION, type DiscoveryId } from '../game/content';
import { currentStep, discoveries, hintTiersUnlocked, objective as currentObjective } from '../game/selectors';
import type { ClueId } from '../game/types';
import type { VisualState } from '../presentation/visual';
import { useStore, voiceAt } from '../store';
import { Polaroid } from './paper/Polaroid';
import { prefersReducedMotion, useNow } from './useNow';

const MESSAGE_MS = 7_000;
const OBJECTIVE_MS = 6_500;
const TOAST_MS = 3_400;
const CHAR_MS = 22;

/** Reveals `text` a few characters at a time, like a line being typed out. */
function useTypewriter(text: string, key: number | null): string {
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

/**
 * Shows `key` for `ms` once it can be seen: while `held` (a cinematic moment is playing) the clock
 * does not start. A key that has had its full time is not shown again.
 */
function useHeldTransient(key: number | null, ms: number, held: boolean): number | null {
  const [shown, setShown] = useState<number | null>(null);
  const done = useRef(new Set<number>());
  useEffect(() => {
    if (key === null || held || done.current.has(key)) return;
    setShown(key);
    const id = window.setTimeout(() => {
      done.current.add(key);
      setShown((k) => (k === key ? null : k));
    }, ms);
    return () => window.clearTimeout(id);
  }, [key, ms, held]);
  return held ? null : shown;
}

/** Shows `key` for `ms` after it changes. */
function useTransient<T>(key: T, ms: number): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (key === null || key === undefined) return;
    setOn(true);
    const id = window.setTimeout(() => setOn(false), ms);
    return () => window.clearTimeout(id);
  }, [key, ms]);
  return on;
}

function Narration() {
  const message = useStore((s) => s.game.message);
  // The notebook, Theo's voice and the big moments (walking in, the world turning) hold the stage on their own.
  const casefile = useStore((s) => s.ui.panel === 'casefile');
  const cinematic = useStore((s) => s.ui.sceneLocked);
  const voice = useVoicePlaying();
  const quiet = casefile || voice || cinematic;
  const shownId = useHeldTransient(message?.id ?? null, MESSAGE_MS, quiet);
  const typed = useTypewriter(message?.text ?? '', shownId);
  if (shownId === null || !message || shownId !== message.id) return null;
  return (
    <div className="narration" aria-live="polite">
      <span className="sr-only">{message.text}</span>
      <p aria-hidden>{typed}</p>
    </div>
  );
}

interface Card {
  id: number;
  kind: 'first' | 'question' | 'next' | 'discovery';
  title: string;
  action?: string;
}

const KICKER: Record<Card['kind'], string> = {
  first: 'Câu hỏi',
  question: 'Câu hỏi mới',
  next: 'Tiếp theo',
  discovery: 'Phát hiện',
};
const CARD_MS: Record<Card['kind'], number> = { first: 4_600, question: 4_600, next: 3_600, discovery: 3_800 };

/** Is a voice on the radio right now? Nothing else should talk over it. */
function useVoicePlaying(): boolean {
  const subtitle = useStore((s) => (s.ui.panel === 'radio' ? s.ui.subtitle : null));
  const now = useNow(400, !!subtitle);
  return !!subtitle && voiceAt(subtitle, now).phase !== 'done';
}

/**
 * Story beats, announced one at a time: first what was just found out ("PHÁT HIỆN"), then the
 * question it opens and the next thing to do. Held back while the notebook is open or a voice plays.
 */
function StoryBanner() {
  const question = useStore((s) => currentStep(s.game).question);
  const action = useStore((s) => currentStep(s.game).action);
  const found = useStore((s) => discoveries(s.game).join(','));
  const notebookOpen = useStore((s) => s.ui.panel === 'casefile');
  const cinematic = useStore((s) => s.ui.sceneLocked);
  const voice = useVoicePlaying();
  const blocked = notebookOpen || voice || cinematic;
  const seen = useRef({ started: false, question: '', action: '', found: new Set<string>(), next: 0 });
  const [queue, setQueue] = useState<Card[]>([]);

  useEffect(() => {
    if (blocked) return;
    const mem = seen.current;
    const cards: Card[] = [];
    for (const id of found ? (found.split(',') as DiscoveryId[]) : []) {
      if (mem.found.has(id)) continue;
      mem.found.add(id);
      if (mem.started) cards.push({ id: mem.next++, kind: 'discovery', title: DISCOVERIES[id] });
    }
    if (question && (question !== mem.question || action !== mem.action)) {
      const kind = !mem.started ? 'first' : question !== mem.question ? 'question' : 'next';
      cards.push({ id: mem.next++, kind, title: question, action });
      mem.question = question;
      mem.action = action;
    }
    mem.started = true;
    if (cards.length) setQueue((q) => [...q, ...cards]);
  }, [question, action, found, blocked]);

  // A card only starts its clock once it can actually be seen.
  const head = queue[0];
  useEffect(() => {
    if (!head || blocked) return;
    if (head.kind !== 'first') audio.cue(head.kind === 'discovery' ? 'thud' : 'note');
    const id = window.setTimeout(() => setQueue((q) => q.slice(1)), CARD_MS[head.kind]);
    return () => window.clearTimeout(id);
  }, [head, blocked]);

  if (!head || blocked) return null;
  return (
    <div className={`objective-banner card-${head.kind}`} key={head.id} aria-live="polite">
      <span className="objective-kicker">{KICKER[head.kind]}</span>
      <p>{head.title}</p>
      {head.action && <span className="banner-action">→ {head.action}</span>}
    </div>
  );
}

const IDLE_MS = 12_000;
const NUDGE_MS = 6_500;

/** Standing still too long: a quiet line that points back at the current objective. */
function IdleNudge() {
  const stepNudge = useStore((s) => currentStep(s.game).nudge);
  const messageId = useStore((s) => s.game.message?.id ?? null);
  const panel = useStore((s) => s.ui.panel);
  const [nudge, setNudge] = useState<string | null>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const wake = () => {
      setNudge(null);
      setActive((n) => n + 1);
    };
    window.addEventListener('pointerdown', wake);
    window.addEventListener('keydown', wake);
    return () => {
      window.removeEventListener('pointerdown', wake);
      window.removeEventListener('keydown', wake);
    };
  }, []);

  useEffect(() => {
    if (panel !== null || !stepNudge) return;
    const show = window.setTimeout(() => setNudge(stepNudge), IDLE_MS);
    return () => window.clearTimeout(show);
  }, [stepNudge, messageId, panel, active]);

  useEffect(() => {
    if (!nudge) return;
    const hide = window.setTimeout(() => {
      setNudge(null);
      setActive((n) => n + 1);
    }, NUDGE_MS);
    return () => window.clearTimeout(hide);
  }, [nudge]);

  if (!nudge || panel !== null) return null;
  return (
    <p className="nudge" aria-live="polite">
      {nudge}
    </p>
  );
}

/** Where you are and what to do next. Always there, faint; a new objective is written over the old. */
function Objective() {
  const objective = useStore((s) => currentObjective(s.game));
  const action = useStore((s) => currentStep(s.game).action);
  const where = useStore((s) =>
    s.game.world === 'normal' ? LOCATION.normal : s.game.contactMade ? LOCATION.other : LOCATION.otherUnknown,
  );
  const fresh = useTransient(objective, OBJECTIVE_MS);
  const [prev, setPrev] = useState<{ now: string; before: string | null }>({ now: objective, before: null });
  if (prev.now !== objective) setPrev({ now: objective, before: prev.now });
  return (
    <div className={`objective ${fresh ? 'fresh' : ''}`} hidden={!objective}>
      <span className="location">{where}</span>
      <span className="objective-kicker">Câu hỏi</span>
      {fresh && prev.before && (
        <s className="objective-old" aria-hidden>
          {prev.before}
        </s>
      )}
      <p key={objective}>{objective}</p>
      {action && <span className="objective-action">→ {action}</span>}
    </div>
  );
}

/** A photo of the new clue drops in, then slides into the notebook. */
function ClueToast({ v }: { v: VisualState }) {
  const game = useStore((s) => s.game);
  const seen = useRef(game.clues.length);
  const [toast, setToast] = useState<{ id: ClueId; key: number } | null>(null);

  useEffect(() => {
    if (game.clues.length > seen.current) {
      setToast({ id: game.clues[game.clues.length - 1], key: Date.now() });
    }
    seen.current = game.clues.length;
  }, [game.clues]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), TOAST_MS);
    return () => window.clearTimeout(id);
  }, [toast]);

  if (!toast) return null;
  return (
    <div key={toast.key} className="clue-toast" aria-hidden>
      <Polaroid id={toast.id} s={game} v={v} caption={CLUES[toast.id].title} />
      <span className="clue-toast-note">đã ghi vào hồ sơ</span>
    </div>
  );
}

export function Hud({ v }: { v: VisualState }) {
  const game = useStore((s) => s.game);
  const setUi = useStore((s) => s.setUi);
  const dispatch = useStore((s) => s.dispatch);
  const now = useNow(1_000);
  const closeup = useStore((s) => s.ui.panel !== null);
  const cinematic = useStore((s) => s.ui.sceneLocked);
  const evidenceReady = currentStep(game).target === 'notebook';

  const unlocked = hintTiersUnlocked(game, now);
  const hintReady = unlocked > game.hintRevealed;
  const hintEnabled = hintReady || game.hintRevealed > 0;

  const openHint = () => {
    if (hintReady) dispatch({ type: 'REQUEST_HINT' });
    setUi({ panel: 'hint' });
  };

  return (
    <div className={`hud ${closeup ? 'behind' : ''} ${cinematic ? 'cinematic' : ''}`}>
      <p className="rotate-hint" aria-hidden>
        xoay ngang màn hình để nhìn rõ hơn
      </p>
      <Objective />
      <StoryBanner />
      <IdleNudge />
      <Narration />
      <ClueToast v={v} />
      <div className="corner">
        <button
          className={`think ${hintReady ? 'ready' : ''}`}
          disabled={!hintEnabled}
          onClick={openHint}
          aria-label="Nghĩ"
          title="Nghĩ"
        >
          <span aria-hidden>…?</span>
        </button>
        <button className={`notebook ${evidenceReady ? 'calling' : ''}`} onClick={() => setUi(evidenceReady ? { panel: 'casefile', caseTab: 'deduction' } : { panel: 'casefile' })} aria-label="Hồ sơ" title="Hồ sơ">
          <span className="notebook-cover" aria-hidden>
            <span className="notebook-label">HỒ SƠ</span>
          </span>
          {game.clues.length > 0 && (
            <span className="notebook-count" aria-hidden>
              {game.clues.length}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
