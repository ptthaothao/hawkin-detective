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

/**
 * This side, after the diary is found: kneeling at the hole under the loose board. The board shifts
 * aside as you look; cold air comes up out of it. Only the diary is in it.
 */
export function FloorView() {
  const game = useStore((s) => s.game);
  const setUi = useStore((s) => s.setUi);
  return (
    <Overlay label="Hốc dưới ván sàn" onClose={() => setUi({ panel: null })} className="floor-overlay">
      <div className="closeup floor-closeup">
        <div className="floorboards">
          <div className={`floor-hole ${game.deductionSolved ? 'drafty' : ''}`}>
            <span className="hole-draft" aria-hidden />
            <button className="floor-item diary-item" onClick={() => setUi({ panel: 'inspect', inspect: 'diary', diaryPage: 0 })}>
              <span className="diary-cover" aria-hidden />
              <span className="item-label">Đọc</span>
            </button>
          </div>
          <span className="loose-board" aria-hidden />
        </div>
      </div>
    </Overlay>
  );
}

const RUB_COLS = 20;
const RUB_ROWS = 6;
/** Share of the patch that has to be covered before the letters are fully there. */
const RUB_ENOUGH = 0.65;

/**
 * Rubbing the back of the radio with Theo's crayon: drag over the paper and the carved letters
 * come up through it. Optional; nothing depends on it.
 */
export function RubView() {
  const game = useStore((s) => s.game);
  const dispatch = useStore((s) => s.dispatch);
  const setUi = useStore((s) => s.setUi);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cells = useRef(new Set<number>());
  const last = useRef<{ x: number; y: number } | null>(null);
  const [progress, setProgress] = useState(game.rubbed ? 1 : 0);
  const done = useRef(game.rubbed);

  useEffect(() => {
    if (!game.rubbed) return;
    const id = window.setTimeout(() => setUi({ panel: null }), 2_200);
    return () => window.clearTimeout(id);
  }, [game.rubbed, setUi]);

  const at = (e: React.PointerEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 };
  };
  const stroke = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || done.current) return;
    const p = at(e);
    const from = last.current ?? p;
    const w = canvas.width;
    const h = canvas.height;
    ctx.lineCap = 'round';
    ctx.lineWidth = 30;
    ctx.strokeStyle = 'rgba(214, 120, 48, 0.32)';
    ctx.beginPath();
    ctx.moveTo((from.x / 100) * w, (from.y / 100) * h);
    ctx.lineTo((p.x / 100) * w, (p.y / 100) * h);
    ctx.stroke();
    last.current = p;
    const col = Math.min(RUB_COLS - 1, Math.max(0, Math.floor((p.x / 100) * RUB_COLS)));
    const row = Math.min(RUB_ROWS - 1, Math.max(0, Math.floor((p.y / 100) * RUB_ROWS)));
    for (let dc = -1; dc <= 1; dc++) {
      for (let dr = 0; dr <= 0; dr++) {
        const c = col + dc;
        const r = row + dr;
        if (c >= 0 && c < RUB_COLS && r >= 0 && r < RUB_ROWS) cells.current.add(r * RUB_COLS + c);
      }
    }
    const share = cells.current.size / (RUB_COLS * RUB_ROWS);
    setProgress(Math.min(1, share / RUB_ENOUGH));
    if (share >= RUB_ENOUGH) {
      done.current = true;
      audio.cue('page');
      dispatch({ type: 'RUB_DONE' });
    }
  };

  return (
    <Overlay label="Chà bút sáp lên vỏ radio" onClose={() => setUi({ panel: null })} className="rub-overlay">
      <div className="closeup rub-closeup">
        <div className="rub-wall">
          <canvas
            ref={canvasRef}
            className="rub-canvas"
            width={640}
            height={200}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              last.current = at(e);
              stroke(e);
            }}
            onPointerMove={(e) => e.buttons > 0 && stroke(e)}
            onPointerUp={() => (last.current = null)}
          />
          <span className="rub-letters" style={{ opacity: progress }} aria-hidden>
            MARTIN
          </span>
        </div>
        <p className="rub-hint">{game.rubbed ? 'M-A-R-T-I-N.' : 'Chà bút sáp lên vỏ radio.'}</p>
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
