import { useState, type CSSProperties } from 'react';
import { speakerOf, type Speaker } from './speakers';
import { useTypewriter } from './useTypewriter';

export type LineKind = 'voice' | 'you' | 'aside' | 'sound' | 'thought';

type Shown = (Speaker & { id: string }) | null;

/** The speaker's portrait. On a change of speaker the old one fades out under the new one. */
function Portrait({ speaker, transmitted }: { speaker: Shown; transmitted: boolean }) {
  const [slots, setSlots] = useState<{ cur: Shown; prev: Shown }>({ cur: speaker, prev: null });
  if (slots.cur?.id !== speaker?.id) setSlots({ cur: speaker, prev: slots.cur });
  const face = (s: Speaker) => ({ '--fx': `${s.face[0]}%`, '--fy': `${s.face[1]}%` }) as CSSProperties;
  return (
    <div className="dialogue-portrait" aria-hidden>
      {slots.prev && (
        <span key={`prev-${slots.prev.id}`} className="portrait leaving" style={face(slots.prev)}>
          <img src={slots.prev.portrait} alt="" />
        </span>
      )}
      {slots.cur && (
        <span
          key={`cur-${slots.cur.id}`}
          className={`portrait current ${transmitted ? 'transmitted' : ''}`}
          style={face(slots.cur)}
        >
          <img src={slots.cur.portrait} alt="" />
        </span>
      )}
    </div>
  );
}

/**
 * One line of a scene. A line with a known speaker gets their portrait and name; anything else
 * (static, stage directions, inner thoughts, an unknown voice) reads as narration.
 */
export function Dialogue({
  who,
  kind,
  text,
  lineKey,
  speaking,
  transmitted = false,
  durationMs,
  unstable = false,
}: {
  who?: string;
  kind: LineKind | null;
  text: string;
  /** Changes on every new line: restarts the typing and the fade. */
  lineKey: string | number;
  /** The speaker is talking right now (not just their last words left on screen). */
  speaking: boolean;
  /** Heard through a device rather than in the room. */
  transmitted?: boolean;
  /** How long the line stays: drawn as a thin run-down, since lines move on by themselves. */
  durationMs?: number;
  unstable?: boolean;
}) {
  const speaker = speakerOf(who);
  const spoken = !!speaker && (kind === 'voice' || kind === 'you');
  const typed = useTypewriter(spoken ? text : '', lineKey);
  const shown = !kind ? '' : kind === 'sound' ? `[${text}]` : spoken ? typed : text;

  return (
    <div
      className={`dialogue ${spoken ? 'attributed' : 'narrated'} ${kind ? `kind-${kind}` : ''} ${speaking ? 'speaking' : ''} ${unstable ? 'unstable' : ''}`}
    >
      <Portrait speaker={spoken ? speaker : null} transmitted={transmitted} />
      <div className="dialogue-body">
        <span className="dialogue-name" key={spoken ? speaker.id : 'none'} aria-hidden>
          {spoken && (
            <>
              {transmitted && <i className="on-air" />}
              {speaker.name}
            </>
          )}
        </span>
        <p className="sr-only" aria-live="polite">
          {kind && (spoken ? `${speaker.name}: ${text}` : text)}
        </p>
        <p className="dialogue-text" key={lineKey} aria-hidden>
          {shown}
        </p>
        {durationMs && kind && (
          <span className="dialogue-clock" key={`clock-${lineKey}`} style={{ animationDuration: `${durationMs}ms` }} aria-hidden />
        )}
      </div>
      <div aria-hidden />
    </div>
  );
}
