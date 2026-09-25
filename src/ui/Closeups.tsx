// Close-ups the player leans into: the watch, the clock on the other side, Theo's diary,
// the hole under the floorboard, and their own thoughts (hints).

import { useEffect, useRef, useState } from 'react';
import { audio } from '../audio/audio';
import { CLUES, DIARY_PAGES, HINTS } from '../game/content';
import { clueText } from '../game/selectors';
import { useStore } from '../store';
import { OtherClock, SegDigit } from './art/Props';
import { Overlay } from './Overlay';
import { tilt } from './paper/Polaroid';

function Caption({ text }: { text: string }) {
  return <p className="closeup-caption">{text}</p>;
}

function WatchCloseup() {
  const game = useStore((s) => s.game);
  const [look, note] = clueText(game, 'C2').split('\n');
  const quote = note?.match(/“(.+)”/)?.[1] ?? note;
  return (
    <div className="closeup watch-closeup">
      <div className="lamp-spot" aria-hidden />
      <svg viewBox="0 0 300 360" className="watch-art" aria-hidden>
        <path d="M100 0 L200 0 L196 110 L104 110 Z" className="strap" />
        <path d="M104 250 L196 250 L200 360 L100 360 Z" className="strap" />
        {[20, 44, 68, 290, 314].map((y) => (
          <rect key={y} x="138" y={y} width="24" height="8" rx="3" className="strap-hole" />
        ))}
        <rect x="62" y="96" width="176" height="168" rx="30" className="watch-case" />
        <rect x="74" y="108" width="152" height="144" rx="20" className="watch-bezel" />
        <text x="150" y="134" textAnchor="middle" className="watch-brand">
          QUARTZ · ALARM
        </text>
        <rect x="88" y="146" width="124" height="70" rx="6" className="lcd" />
        <g transform="translate(96 156) scale(2.4)">
          <SegDigit ch="0" x={0} />
          <SegDigit ch="3" x={12} />
          <g className="colon">
            <rect x="25" y="5" width="2" height="2" />
            <rect x="25" y="13" width="2" height="2" />
          </g>
          <SegDigit ch="8" x={30} dead />
          <SegDigit ch="8" x={42} dead />
        </g>
        <path d="M120 146 L146 188 L138 216 M146 188 L176 176 L212 190" className="crack" />
        <circle cx="68" cy="160" r="6" className="watch-btn" />
        <circle cx="232" cy="160" r="6" className="watch-btn" />
        <circle cx="232" cy="200" r="6" className="watch-btn" />
      </svg>
      {quote && (
        <div className="paper-scrap mom-note" style={{ rotate: `${tilt('mom', 4)}deg` }}>
          <span className="tape" aria-hidden />
          <p>{quote}</p>
        </div>
      )}
      <Caption text={look} />
    </div>
  );
}

function OtherClockCloseup() {
  const game = useStore((s) => s.game);
  return (
    <div className="closeup clock-closeup">
      <div className="beam-frame">
        <OtherClock />
        <svg viewBox="-50 -50 100 100" className="glass-cracks" aria-hidden>
          <path d="M-30 -38 L-8 -10 L-20 20 M-8 -10 L26 -4 L40 -22 M26 -4 L30 30" />
        </svg>
      </div>
      <Caption text={clueText(game, 'C4')} />
    </div>
  );
}

/** How far (fraction of the page width) a drag must carry the page before it turns. */
const TURN_AT = 0.2;
const LEAF_MS = 560;

function DiaryPage({ page }: { page: number }) {
  const text = DIARY_PAGES[page];
  const m = text.match(/^(Đêm \d+ — [\d_:]+\.)\s*([\s\S]*)$/);
  return (
    <>
      {m ? (
        <>
          <h3 className="diary-date">
            {/* A time Theo never got to write in: blank boxes, not underscores. */}
            {m[1].split('__').map((part, i) => (
              <span key={i}>
                {i > 0 && <span className="diary-blank" aria-label="trống" />}
                {part}
              </span>
            ))}
          </h3>
          <p>{m[2]}</p>
        </>
      ) : (
        <p>{text}</p>
      )}
      <footer className="diary-folio">— {page + 1} —</footer>
    </>
  );
}

/**
 * Theo's diary as an object: the cover opens, and pages turn on the spiral — drag or swipe the page
 * (arrow keys and the small arrows still work). A turned page lifts off and flips over the rings.
 */
function DiaryCloseup() {
  const page = useStore((s) => s.ui.diaryPage);
  const setUi = useStore((s) => s.setUi);
  const last = DIARY_PAGES.length - 1;
  const [turning, setTurning] = useState<{ from: number; to: number; angle: number; key: number } | null>(null);
  const [angle, setAngle] = useState(0);
  const drag = useRef<{ x0: number; w: number } | null>(null);

  useEffect(() => {
    audio.cue('page');
  }, []);
  useEffect(() => {
    if (!turning) return;
    const id = window.setTimeout(() => setTurning(null), LEAF_MS);
    return () => window.clearTimeout(id);
  }, [turning]);

  const go = (p: number, fromAngle = 0) => {
    const to = Math.max(0, Math.min(last, p));
    setAngle(0);
    if (to === page || turning) return;
    audio.cue('page');
    setTurning({ from: page, to, angle: fromAngle, key: Date.now() });
    setUi({ diaryPage: to });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(page + 1);
      if (e.key === 'ArrowLeft') go(page - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const onPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if (turning) return;
    drag.current = { x0: e.clientX, w: e.currentTarget.getBoundingClientRect().width };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const r = (e.clientX - d.x0) / d.w;
    // Dragging left lifts the page off the rings toward the next one; right, back toward the last.
    if ((r < 0 && page === last) || (r > 0 && page === 0)) setAngle(r * 12);
    else setAngle(Math.max(-70, Math.min(70, r * 110)));
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    const r = (e.clientX - d.x0) / d.w;
    if (r <= -TURN_AT) go(page + 1, angle);
    else if (r >= TURN_AT) go(page - 1, angle);
    else setAngle(0);
  };

  // Turning forward, the new page is already underneath; turning back, the old one stays until covered.
  const base = turning && turning.to < turning.from ? turning.from : page;
  return (
    <div className="closeup diary-closeup">
      <div className="diary-book">
        <article
          className={`diary diary-base ${angle ? 'held' : ''}`}
          style={{ transform: angle < 0 ? `rotateY(${angle}deg)` : undefined, translate: angle > 0 ? `${angle * 0.3}px 0` : undefined }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <DiaryPage page={base} />
        </article>
        {turning && (
          <article
            key={turning.key}
            className={`diary diary-leaf ${turning.to > turning.from ? 'leaf-away' : 'leaf-back'}`}
            style={{ '--from-angle': `${Math.min(0, turning.angle)}deg` } as React.CSSProperties}
            aria-hidden
          >
            <DiaryPage page={turning.to > turning.from ? turning.from : turning.to} />
          </article>
        )}
        <div className="diary-cover-open" aria-hidden />
      </div>
      <div className="diary-turn">
        <button disabled={page === 0} onClick={() => go(page - 1)} aria-label="Trang trước">
          ←
        </button>
        <span>
          {page + 1} / {DIARY_PAGES.length}
        </span>
        <button disabled={page === last} onClick={() => go(page + 1)} aria-label="Trang sau">
          →
        </button>
      </div>
    </div>
  );
}

export function InspectView() {
  const target = useStore((s) => s.ui.inspect);
  const setUi = useStore((s) => s.setUi);
  const close = () => setUi({ panel: null, inspect: null });
  const label = target === 'watch' ? CLUES.C2.title : target === 'os-clock' ? CLUES.C4.title : CLUES.C3.title;
  return (
    <Overlay label={label} onClose={close} className={`inspect-overlay inspect-${target}`}>
      {target === 'watch' && <WatchCloseup />}
      {target === 'os-clock' && <OtherClockCloseup />}
      {target === 'diary' && <DiaryCloseup />}
    </Overlay>
  );
}

/** When the flashlight is let go into the hole: it tips in, its light sinks and goes out, a pause. */
const SEND_MS = { tip: 900, dark: 1_700, done: 2_900 };

/**
 * This side, after the diary is found: kneeling at the hole under the loose board. The board shifts
 * aside as you look; cold air comes up out of it. In branch B the flashlight lies on the boards,
 * switched on: drag it into the hole (or tap it) and let it go.
 */
export function FloorView() {
  const game = useStore((s) => s.game);
  const dispatch = useStore((s) => s.dispatch);
  const setUi = useStore((s) => s.setUi);
  const boardsRef = useRef<HTMLDivElement>(null);
  const holeRef = useRef<HTMLDivElement>(null);
  const [held, setHeld] = useState<{ x: number; y: number } | null>(null);
  const [sent, setSent] = useState<{ x: number; y: number; stage: 'tip' | 'lit' | 'dark' } | null>(null);
  const grab = useRef<{ x0: number; y0: number; moved: boolean } | null>(null);
  /** A drag ends in a click too; that click must not count as a tap. */
  const dragged = useRef(false);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  // Only once Theo has said the hole reaches his side, and the radio has gone silent.
  const giving = game.choice === 'B' && !game.flashlightGiven;

  /** Where the torch rests, in % of the boards. */
  const REST = { x: 82, y: 76 };
  const sending = useRef(false);
  const send = (at: { x: number; y: number }) => {
    if (sending.current) return;
    sending.current = true;
    setHeld(null);
    setSent({ ...at, stage: 'tip' });
    const t = timers.current;
    t.push(window.setTimeout(() => setSent((s) => s && { ...s, stage: 'lit' }), 350));
    t.push(window.setTimeout(() => audio.cue('drop'), SEND_MS.tip - 450));
    t.push(window.setTimeout(() => setSent((s) => s && { ...s, stage: 'dark' }), SEND_MS.dark));
    t.push(
      window.setTimeout(() => {
        dispatch({ type: 'PLACE_FLASHLIGHT' });
        setUi({ panel: null });
      }, SEND_MS.done),
    );
  };

  const toBoards = (e: React.PointerEvent) => {
    const r = boardsRef.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 };
  };
  const overHole = (e: React.PointerEvent) => {
    const h = holeRef.current!.getBoundingClientRect();
    return e.clientX > h.left - 20 && e.clientX < h.right + 20 && e.clientY > h.top - 20 && e.clientY < h.bottom + 20;
  };

  return (
    <Overlay label="Hốc dưới ván sàn" onClose={sent ? undefined : () => setUi({ panel: null })} className="floor-overlay">
      <div className="closeup floor-closeup">
        <div ref={boardsRef} className={`floorboards ${held ? 'holding' : ''}`}>
          <div ref={holeRef} className={`floor-hole ${sent?.stage === 'lit' ? 'lit' : ''} ${game.deductionSolved ? 'drafty' : ''}`}>
            <span className="hole-draft" aria-hidden />
            <button
              className="floor-item diary-item"
              disabled={!!sent}
              onClick={() => setUi({ panel: 'inspect', inspect: 'diary', diaryPage: 0 })}
            >
              <span className="diary-cover" aria-hidden />
              <span className="item-label">Đọc</span>
            </button>
          </div>
          <span className="loose-board" aria-hidden />
          {giving && (
            <button
              className={`floor-item torch-item ${held ? 'held' : ''} ${sent ? 'sending' : ''}`}
              style={
                {
                  left: `${sent?.x ?? held?.x ?? REST.x}%`,
                  top: `${sent?.y ?? held?.y ?? REST.y}%`,
                } as React.CSSProperties
              }
              aria-label="Thả đèn pin xuống hốc"
              onPointerDown={(e) => {
                if (sent) return;
                grab.current = { x0: e.clientX, y0: e.clientY, moved: false };
                e.currentTarget.setPointerCapture(e.pointerId);
              }}
              onPointerMove={(e) => {
                const g = grab.current;
                if (!g) return;
                if (!g.moved && Math.hypot(e.clientX - g.x0, e.clientY - g.y0) < 6) return;
                g.moved = true;
                setHeld(toBoards(e));
              }}
              onPointerUp={(e) => {
                const g = grab.current;
                grab.current = null;
                if (!g?.moved) return;
                dragged.current = true;
                if (overHole(e)) send(toBoards(e));
                else setHeld(null);
              }}
              // A tap (or Enter) lowers it in without the drag.
              onClick={() => {
                if (dragged.current) dragged.current = false;
                else send(REST);
              }}
            >
              <span className="torch" aria-hidden>
                <span className="torch-beam" />
              </span>
              <span className="item-label">Thả xuống hốc</span>
            </button>
          )}
        </div>
      </div>
    </Overlay>
  );
}

export function HintNote() {
  const game = useStore((s) => s.game);
  const setUi = useStore((s) => s.setUi);
  const stage = game.hintStage;
  const lines = stage ? HINTS[stage].slice(0, game.hintRevealed) : [];
  return (
    <Overlay label="Nghĩ" onClose={() => setUi({ panel: null })} className="hint-overlay">
      <div className="sticky-note" style={{ rotate: `${tilt(stage ?? 'x', 3)}deg` }}>
        {lines.length === 0 ? (
          <p className="thought">…</p>
        ) : (
          lines.map((l, i) => (
            <p key={i} className="thought">
              {l}
            </p>
          ))
        )}
      </div>
    </Overlay>
  );
}
