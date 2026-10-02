import { useEffect, useState } from 'react';
import { audio } from '../audio/audio';
import { goToChapter, markFinished } from '../chapter';
import { ENDING, INTRO_LINES, type IntroLine } from '../game/content';
import { useStore } from '../store';

const debugMode = () => new URLSearchParams(window.location.search).has('debug');

export function TitleScreen() {
  const dispatch = useStore((s) => s.dispatch);
  const start = () => {
    audio.unlock();
    dispatch({ type: 'BEGIN', debug: debugMode() });
  };
  return (
    <div className="screen title" onClick={start}>
      <div className="title-lamp" aria-hidden />
      <h1 className="title-mark">STATIC</h1>
      <p className="sub">Chương 0 — Tín hiệu</p>
      <div className="title-notes">
        <p className="note">Nên đeo tai nghe.</p>
        <p className="note warn">Có hiệu ứng đèn chớp.</p>
      </div>
      <button className="press">Nhấn để bắt đầu</button>
    </div>
  );
}

/** How long each line holds before the next appears. */
const INTRO_HOLD_MS: Record<IntroLine['kind'], number> = { kicker: 1_400, headline: 2_800, line: 2_300 };

export function IntroScreen() {
  const dispatch = useStore((s) => s.dispatch);
  const [shown, setShown] = useState(1);
  useEffect(() => {
    if (shown >= INTRO_LINES.length) return;
    const hold = INTRO_HOLD_MS[INTRO_LINES[shown - 1].kind];
    const id = window.setTimeout(() => setShown((n) => n + 1), hold);
    return () => window.clearTimeout(id);
  }, [shown]);
  const done = shown >= INTRO_LINES.length;
  // The headline lands with a low thud.
  const headlineShown = INTRO_LINES.slice(0, shown).some((l) => l.kind === 'headline');
  useEffect(() => {
    if (headlineShown) audio.cue('thud');
  }, [headlineShown]);
  return (
    <div
      className="screen intro"
      onClick={() => (done ? dispatch({ type: 'START_PLAY' }) : setShown(INTRO_LINES.length))}
    >
      {INTRO_LINES.slice(0, shown).map((l) => (
        <p key={l.text} className={`intro-line intro-${l.kind}`}>
          {l.text}
        </p>
      ))}
      {done && <p className="press">Vào phòng</p>}
    </div>
  );
}

/** Shown over the scene once the chapter is resolved, then moves to the ending card. */
export function EndingBeat() {
  const game = useStore((s) => s.game);
  const dispatch = useStore((s) => s.dispatch);
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!game.endingReady) return;
    const a = window.setTimeout(() => setShow(true), 4_500);
    const b = window.setTimeout(() => dispatch({ type: 'END' }), 8_000);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
  }, [game.endingReady, dispatch]);
  if (!show) return null;
  return <div className="ending-beat">{ENDING.beat}</div>;
}

function mmss(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function EndingScreen() {
  const game = useStore((s) => s.game);
  const reset = useStore((s) => s.reset);
  const elapsed = (game.endedAt ?? 0) - (game.startedAt ?? 0);
  useEffect(() => markFinished('0'), []);
  return (
    <div className="screen ending">
      <h1 className="ending-title">{ENDING.title}</h1>
      <p className="teaser">{ENDING.teaser}</p>
      <dl className="summary report">
        <dt>Manh mối</dt>
        <dd>{game.clues.length} / 6</dd>
        <dt>Tìm thêm</dt>
        <dd>{Number(game.rubbed) + Number(game.sawGlint)} / 2</dd>
        <dt>Lần tắt radio hụt</dt>
        <dd>{game.finaleFails}</dd>
        <dt>Số hint đã dùng</dt>
        <dd>{game.hintsUsed}</dd>
        <dt>Thời gian</dt>
        <dd>{mmss(elapsed)}</dd>
      </dl>
      <button className="press" onClick={() => goToChapter('1.1')}>
        Sang Chương 1.1
      </button>
      <button className="press quiet" onClick={reset}>
        Chơi lại
      </button>
    </div>
  );
}
