import { useEffect, useState } from 'react';
import { audio } from '../audio/audio';
import { ENDING, INTRO_LINES } from '../game/content';
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
      <h1>STATIC</h1>
      <p className="sub">Chương 0 — Tín hiệu</p>
      <p className="note">Nên đeo tai nghe.</p>
      <p className="note warn">Có hiệu ứng đèn chớp.</p>
      <button className="primary">Nhấn để bắt đầu</button>
    </div>
  );
}

const INTRO_LINE_MS = 1_800;

export function IntroScreen() {
  const dispatch = useStore((s) => s.dispatch);
  const [shown, setShown] = useState(1);
  useEffect(() => {
    if (shown >= INTRO_LINES.length) return;
    const id = window.setTimeout(() => setShown((n) => n + 1), INTRO_LINE_MS);
    return () => window.clearTimeout(id);
  }, [shown]);
  const done = shown >= INTRO_LINES.length;
  return (
    <div
      className="screen intro"
      onClick={() => (done ? dispatch({ type: 'START_PLAY' }) : setShown(INTRO_LINES.length))}
    >
      {INTRO_LINES.slice(0, shown).map((l) => (
        <p key={l} className="intro-line">
          {l}
        </p>
      ))}
      {done && <p className="note">Nhấn để tiếp tục</p>}
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
  return <div className="ending-beat">{game.choice === 'A' ? ENDING.beatA : ENDING.beatB}</div>;
}

function mmss(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function EndingScreen() {
  const game = useStore((s) => s.game);
  const reset = useStore((s) => s.reset);
  const elapsed = (game.endedAt ?? 0) - (game.startedAt ?? 0);
  return (
    <div className="screen ending">
      <h1>{ENDING.title}</h1>
      <p className="teaser">{game.choice === 'A' ? ENDING.teaserA : ENDING.teaserB}</p>
      <dl className="summary">
        <dt>Manh mối</dt>
        <dd>{game.clues.length} / 6</dd>
        <dt>Lựa chọn</dt>
        <dd>{game.choice === 'A' ? 'Vặn to hết cỡ' : 'Tắt radio'}</dd>
        <dt>Số hint đã dùng</dt>
        <dd>{game.hintsUsed}</dd>
        <dt>Thời gian</dt>
        <dd>{mmss(elapsed)}</dd>
      </dl>
      <button className="primary" onClick={reset}>
        Chơi lại
      </button>
    </div>
  );
}
