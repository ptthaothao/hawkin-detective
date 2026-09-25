import type { ReactNode } from 'react';
import { CHIPS, CLUES, DEDUCTION_SENTENCE, DIARY_PAGES, ECHOES, HINTS } from '../game/content';
import { availableChips, clueText, freq, radioSignal } from '../game/selectors';
import type { ClueId, SlotId } from '../game/types';
import { SUBTITLE_MS, useStore } from '../store';
import { OtherClock, WatchFace } from './RoomArt';
import { useNow } from './useNow';

function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose?: () => void }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <header className="modal-head">
          <h2>{title}</h2>
          {onClose && (
            <button className="close" onClick={onClose} aria-label="Đóng">
              ✕
            </button>
          )}
        </header>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

// --- Radio ------------------------------------------------------------------

export function RadioPanel() {
  const game = useStore((s) => s.game);
  const subtitle = useStore((s) => s.ui.subtitle);
  const dispatch = useStore((s) => s.dispatch);
  const setUi = useStore((s) => s.setUi);
  const now = useNow(200, !!subtitle);

  const lineIndex = subtitle ? Math.floor((now - subtitle.start) / SUBTITLE_MS) : 0;
  const playing = !!subtitle && lineIndex < subtitle.lines.length;
  const signal = radioSignal(game);
  const controlsOff = playing || game.radio.locked || game.world !== 'normal';
  const close = playing || signal === 'precall' ? undefined : () => setUi({ panel: null });

  let readout = '';
  if (playing) readout = subtitle!.lines[lineIndex];
  else if (signal === 'static' || signal === 'precall') readout = '[rè]';
  else if (signal === 'lure') readout = '[rè, hết cỡ]';
  else if (signal.startsWith('echo')) readout = ECHOES[freq(game)].line.replace(/^\[[\d.]+\] /, '');

  return (
    <Modal title="Radio" onClose={close}>
      <div className="radio-panel">
        <div className={`radio-face ${game.radio.on ? 'on' : ''}`}>
          <div className="wheels">
            {game.radio.wheels.map((v, i) => (
              <span key={i} className="wheel-wrap">
                {i === 1 && <span className="dot">.</span>}
                <span className="wheel">
                  <button
                    disabled={controlsOff}
                    onClick={() => dispatch({ type: 'RADIO_WHEEL', index: i as 0 | 1 | 2, delta: 1 })}
                    aria-label="Tăng"
                  >
                    ▲
                  </button>
                  <span className="digit">{v}</span>
                  <button
                    disabled={controlsOff}
                    onClick={() => dispatch({ type: 'RADIO_WHEEL', index: i as 0 | 1 | 2, delta: -1 })}
                    aria-label="Giảm"
                  >
                    ▼
                  </button>
                </span>
              </span>
            ))}
            <span className="unit">MHz</span>
          </div>
          <button
            className="power"
            disabled={controlsOff}
            onClick={() => dispatch({ type: 'RADIO_POWER', on: !game.radio.on })}
          >
            {game.radio.on ? 'Tắt' : 'Bật'}
          </button>
        </div>
        <p className="subtitle" aria-live="polite">
          {readout}
        </p>
        {signal === 'precall' && !playing && (
          <div className="choice">
            <button
              onClick={() => {
                dispatch({ type: 'CHOOSE', option: 'A' });
                setUi({ panel: null, subtitle: null });
              }}
            >
              VẶN TO HẾT CỠ
            </button>
            <button
              onClick={() => {
                dispatch({ type: 'CHOOSE', option: 'B' });
                setUi({ panel: null, subtitle: null });
              }}
            >
              TẮT RADIO
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

// --- Case File --------------------------------------------------------------

const ZOOMABLE: Partial<Record<ClueId, 'watch' | 'os-clock' | 'diary'>> = {
  C2: 'watch',
  C3: 'diary',
  C4: 'os-clock',
};

export function CaseFile() {
  const game = useStore((s) => s.game);
  const tab = useStore((s) => s.ui.caseTab);
  const setUi = useStore((s) => s.setUi);
  const close = () => setUi({ panel: null });

  return (
    <Modal title="Hồ sơ" onClose={close}>
      <nav className="tabs">
        <button className={tab === 'clues' ? 'active' : ''} onClick={() => setUi({ caseTab: 'clues' })}>
          Manh mối ({game.clues.length})
        </button>
        <button className={tab === 'radio' ? 'active' : ''} onClick={() => setUi({ caseTab: 'radio' })}>
          Radio
        </button>
        {game.contactMade && (
          <button
            className={tab === 'deduction' ? 'active' : ''}
            onClick={() => setUi({ caseTab: 'deduction' })}
          >
            Kết luận
          </button>
        )}
      </nav>

      {tab === 'clues' && (
        <ul className="cards">
          {game.clues.length === 0 && <li className="empty">Chưa có gì.</li>}
          {game.clues.map((id) => {
            const zoom = ZOOMABLE[id];
            return (
              <li key={id} className={`card ${CLUES[id].world}`}>
                <div className="card-head">
                  <strong>{CLUES[id].title}</strong>
                  <span className="tag">{CLUES[id].world === 'normal' ? 'Phía này' : 'Phía bên kia'}</span>
                </div>
                <p className="card-text">{clueText(game, id)}</p>
                {zoom && (
                  <button
                    className="link"
                    onClick={() => setUi({ panel: 'inspect', inspect: zoom, diaryPage: 0 })}
                  >
                    {zoom === 'diary' ? 'Đọc' : 'Xem kỹ'}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {tab === 'radio' && (
        <ul className="radio-log">
          {game.radioLog.length === 0 && <li className="empty">Chưa nghe được gì ngoài tiếng rè.</li>}
          {game.radioLog.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ul>
      )}

      {tab === 'deduction' && game.contactMade && <DeductionView />}
    </Modal>
  );
}

function DeductionView() {
  const game = useStore((s) => s.game);
  const dispatch = useStore((s) => s.dispatch);
  const slots: SlotId[] = ['A', 'C', 'D'];
  const complete = slots.every((k) => game.slots[k]);

  if (game.deductionSolved) {
    return <p className="deduction-done">Đã kết luận.</p>;
  }

  return (
    <div className="deduction">
      {slots.map((slot) => {
        const [before, after] = DEDUCTION_SENTENCE[slot];
        const filled = game.slots[slot];
        return (
          <div key={slot} className="ded-row">
            <p className="ded-sentence">
              {before}{' '}
              <button
                className={`slot ${filled ? 'filled' : ''}`}
                onClick={() => dispatch({ type: 'FILL_SLOT', slot, chip: null })}
                title={filled ? 'Bỏ chọn' : undefined}
              >
                {filled ? CHIPS[filled].label : '[ … ]'}
              </button>
              {after === '.' ? '.' : ` ${after}`}
            </p>
            <div className="chips">
              {availableChips(game, slot).map((c) => (
                <button
                  key={c}
                  className={`chip ${filled === c ? 'selected' : ''}`}
                  onClick={() => dispatch({ type: 'FILL_SLOT', slot, chip: c })}
                >
                  {CHIPS[c].label}
                </button>
              ))}
            </div>
          </div>
        );
      })}
      <button className="primary" disabled={!complete} onClick={() => dispatch({ type: 'SUBMIT_DEDUCTION' })}>
        Kết luận
      </button>
      {game.deductionFeedback && <p className="feedback">{game.deductionFeedback}</p>}
    </div>
  );
}

// --- Inspect (zoom) ---------------------------------------------------------

export function InspectView() {
  const game = useStore((s) => s.game);
  const target = useStore((s) => s.ui.inspect);
  const page = useStore((s) => s.ui.diaryPage);
  const setUi = useStore((s) => s.setUi);
  const close = () => setUi({ panel: null, inspect: null });

  if (target === 'watch') {
    return (
      <Modal title={CLUES.C2.title} onClose={close}>
        <WatchFace />
        <p className="card-text">{clueText(game, 'C2')}</p>
      </Modal>
    );
  }
  if (target === 'os-clock') {
    return (
      <Modal title={CLUES.C4.title} onClose={close}>
        <div className="zoom-clock">
          <OtherClock />
        </div>
        <p className="card-text">{clueText(game, 'C4')}</p>
      </Modal>
    );
  }
  return (
    <Modal title={CLUES.C3.title} onClose={close}>
      <div className="diary-page">
        <p>{DIARY_PAGES[page]}</p>
      </div>
      <div className="pager">
        <button disabled={page === 0} onClick={() => setUi({ diaryPage: page - 1 })}>
          ◀
        </button>
        <span>
          {page + 1} / {DIARY_PAGES.length}
        </span>
        <button
          disabled={page === DIARY_PAGES.length - 1}
          onClick={() => setUi({ diaryPage: page + 1 })}
        >
          ▶
        </button>
      </div>
    </Modal>
  );
}

// --- Floor (normal side, after the diary is found) --------------------------

export function FloorMenu() {
  const game = useStore((s) => s.game);
  const dispatch = useStore((s) => s.dispatch);
  const setUi = useStore((s) => s.setUi);
  return (
    <Modal title="Hốc dưới ván sàn" onClose={() => setUi({ panel: null })}>
      <div className="menu">
        <button onClick={() => setUi({ panel: 'inspect', inspect: 'diary', diaryPage: 0 })}>Đọc nhật ký</button>
        {!game.flashlightGiven && (
          <button
            onClick={() => {
              dispatch({ type: 'PLACE_FLASHLIGHT' });
              setUi({ panel: null });
            }}
          >
            Đặt đèn pin vào hốc
          </button>
        )}
      </div>
    </Modal>
  );
}

// --- Hint -------------------------------------------------------------------

export function HintPanel() {
  const game = useStore((s) => s.game);
  const setUi = useStore((s) => s.setUi);
  const stage = game.hintStage;
  const lines = stage ? HINTS[stage].slice(0, game.hintRevealed) : [];
  return (
    <Modal title="Nghĩ" onClose={() => setUi({ panel: null })}>
      <ol className="hints">
        {lines.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ol>
    </Modal>
  );
}
