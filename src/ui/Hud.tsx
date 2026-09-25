import { useEffect, useState } from 'react';
import { hintTiersUnlocked } from '../game/selectors';
import { useStore } from '../store';
import { useNow } from './useNow';

const MESSAGE_MS = 7_000;

export function Hud() {
  const game = useStore((s) => s.game);
  const setUi = useStore((s) => s.setUi);
  const dispatch = useStore((s) => s.dispatch);
  const now = useNow(1_000);
  const [visibleMsg, setVisibleMsg] = useState<number | null>(null);

  const msgId = game.message?.id ?? null;
  useEffect(() => {
    if (msgId === null) return;
    setVisibleMsg(msgId);
    const id = window.setTimeout(() => setVisibleMsg(null), MESSAGE_MS);
    return () => window.clearTimeout(id);
  }, [msgId]);

  const unlocked = hintTiersUnlocked(game, now);
  const hintReady = unlocked > game.hintRevealed;
  const hintEnabled = hintReady || game.hintRevealed > 0;

  const openHint = () => {
    if (hintReady) dispatch({ type: 'REQUEST_HINT' });
    setUi({ panel: 'hint' });
  };

  return (
    <>
      <div className="objective">{game.objective}</div>
      {visibleMsg !== null && game.message && (
        <div className="narration" aria-live="polite">
          {game.message.text}
        </div>
      )}
      <div className="toolbar">
        <button onClick={() => setUi({ panel: 'casefile' })}>Hồ sơ</button>
        <button className={`hint-btn ${hintReady ? 'ready' : ''}`} disabled={!hintEnabled} onClick={openHint}>
          Nghĩ
        </button>
      </div>
    </>
  );
}
