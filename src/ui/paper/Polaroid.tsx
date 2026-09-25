import { CLUES } from '../../game/content';
import type { ClueId, GameState } from '../../game/types';
import type { VisualState } from '../../presentation/visual';
import { Room } from '../scene/Room';

/** Crop of the room each clue photo shows (4:3, scene units). */
const SHOTS: Record<ClueId, string> = {
  C1: '850 408 160 120',
  C2: '1172 420 120 90',
  C3: '660 640 240 180',
  C4: '176 56 176 132',
  C5: '56 250 400 300',
  C6: '880 310 400 300',
};

/** Deterministic "hand-placed" tilt per id. */
export function tilt(key: string, spread = 3): number {
  let h = 0;
  for (const c of key) h = (h * 31 + c.charCodeAt(0)) % 997;
  return ((h % 100) / 100 - 0.5) * 2 * spread;
}

export function ClueSnapshot({ id, s, v }: { id: ClueId; s: GameState; v: VisualState }) {
  const world = CLUES[id].world;
  return (
    <div className={`snapshot snapshot-${world}`}>
      <Room s={s} v={{ ...v, creature: null }} world={world} viewBox={SHOTS[id]} grain={false} />
    </div>
  );
}

export function Polaroid({
  id,
  s,
  v,
  caption,
  className = '',
}: {
  id: ClueId;
  s: GameState;
  v: VisualState;
  caption?: string;
  className?: string;
}) {
  return (
    <figure className={`polaroid ${className}`} style={{ rotate: `${tilt(id)}deg` }}>
      <span className="tape" style={{ rotate: `${tilt(id + 't', 8)}deg` }} aria-hidden />
      <ClueSnapshot id={id} s={s} v={v} />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
