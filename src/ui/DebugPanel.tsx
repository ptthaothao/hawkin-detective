import { useState } from 'react';
import { DEBUG_PRESETS } from '../game/scripts';
import { freq, hintStage, radioSignal, tally } from '../game/selectors';
import { useStore } from '../store';

/** ?debug — jump to any beat through the real reducer, show hotspots, inspect state. */
export function DebugPanel() {
  const game = useStore((s) => s.game);
  const showHotspots = useStore((s) => s.ui.showHotspots);
  const setUi = useStore((s) => s.setUi);
  const loadPreset = useStore((s) => s.loadPreset);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button className="debug-toggle" onClick={() => setOpen(true)}>
        debug
      </button>
    );
  }
  return (
    <div className="debug-panel">
      <button className="close" onClick={() => setOpen(false)}>
        ✕
      </button>
      <div className="debug-state">
        phase={game.phase} world={game.world} flicker={game.flicker}
        <br />
        tally={tally(game)} freq={freq(game)} signal={radioSignal(game)}
        <br />
        clues={game.clues.join(',') || '—'} contact={String(game.contactMade)}
        <br />
        hint={hintStage(game) ?? '—'} revealed={game.hintRevealed} choice={game.choice ?? '—'}
      </div>
      <label>
        <input type="checkbox" checked={showHotspots} onChange={(e) => setUi({ showHotspots: e.target.checked })} />{' '}
        hiện hotspot
      </label>
      <div className="debug-presets">
        {DEBUG_PRESETS.map((p) => (
          <button key={p.label} onClick={() => loadPreset(p.steps)}>
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
