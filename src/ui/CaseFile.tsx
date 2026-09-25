import { CHIPS, CLUES, DEDUCTION_SENTENCE, NARRATION, TRUTH_QUESTION } from '../game/content';
import { availableChips, clueText, evidenceReady, objective } from '../game/selectors';
import type { ClueId, SlotId } from '../game/types';
import type { VisualState } from '../presentation/visual';
import { useStore, type CaseTab } from '../store';
import { Overlay } from './Overlay';
import { Polaroid, tilt } from './paper/Polaroid';

const ZOOMABLE: Partial<Record<ClueId, 'watch' | 'os-clock' | 'diary'>> = {
  C2: 'watch',
  C3: 'diary',
  C4: 'os-clock',
};

const SLOT_CUE: Record<SlotId, string> = {
  A: 'đêm đó, Theo đã…',
  C: 'em đang trốn ở…',
  D: 'thứ đó tìm đến…',
};

function ClueEntry({ id, v }: { id: ClueId; v: VisualState }) {
  const game = useStore((s) => s.game);
  const setUi = useStore((s) => s.setUi);
  const zoom = ZOOMABLE[id];
  return (
    <li className="clue-entry">
      <Polaroid id={id} s={game} v={v} caption={CLUES[id].title} />
      <div className="clue-notes">
        <p className="typed">{clueText(game, id)}</p>
        {zoom && (
          <button className="pen-link" onClick={() => setUi({ panel: 'inspect', inspect: zoom, diaryPage: 0 })}>
            {zoom === 'diary' ? 'đọc lại →' : 'xem kỹ →'}
          </button>
        )}
      </div>
    </li>
  );
}

function CluePages({ v }: { v: VisualState }) {
  const game = useStore((s) => s.game);
  const side = (w: 'normal' | 'other') => game.clues.filter((c) => CLUES[c].world === w);
  const page = (w: 'normal' | 'other', title: string) => {
    const ids = side(w);
    return (
      <section className={`page page-${w}`}>
        <h3 className="page-head">{title}</h3>
        {ids.length === 0 ? (
          <p className="pencil faint">…</p>
        ) : (
          <ul className="clue-list">
            {ids.map((id) => (
              <ClueEntry key={id} id={id} v={v} />
            ))}
          </ul>
        )}
      </section>
    );
  };
  return (
    <>
      {page('normal', 'phía này')}
      {page('other', 'phía bên kia')}
    </>
  );
}

function RadioPages() {
  const log = useStore((s) => s.game.radioLog);
  const entries = log.map((line) => {
    const m = line.match(/^\[([\d.]+)\]\s*(.*)$/);
    return m ? { freq: m[1], text: m[2] } : { freq: '', text: line };
  });
  const half = Math.ceil(entries.length / 2);
  const page = (items: typeof entries, offset: number, head?: string) => (
    <section className="page page-lined">
      {head && <h3 className="page-head">{head}</h3>}
      {items.length === 0 && offset === 0 ? (
        <p className="pencil faint">Chưa nghe được gì ngoài tiếng rè.</p>
      ) : (
        <ol className="transcript">
          {items.map((e, i) => (
            <li key={offset + i}>
              <span className="margin-freq">{e.freq}</span>
              <span className="pencil">{e.text}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
  return (
    <>
      {page(entries.slice(0, half), 0, 'nghe được')}
      {page(entries.slice(half), half)}
    </>
  );
}

function DeductionPages() {
  const game = useStore((s) => s.game);
  const dispatch = useStore((s) => s.dispatch);
  const slots: SlotId[] = ['A', 'C', 'D'];
  const complete = slots.every((k) => game.slots[k]);
  const solved = game.deductionSolved;

  return (
    <>
      <section className="page page-lined deduction-page">
        <h3 className="page-head">{TRUTH_QUESTION}</h3>
        {!solved && (
          <p className="pencil ded-intro">
            {evidenceReady(game)
              ? 'Mình đã có đủ bằng chứng. Ghép lại chuyện đêm đó.'
              : 'Chưa chắc lắm… có lẽ vẫn còn thiếu gì đó.'}
          </p>
        )}
        {slots.map((slot) => {
          const [before, after] = DEDUCTION_SENTENCE[slot];
          const filled = game.slots[slot];
          return (
            <p key={slot} className="ded-sentence">
              {before}{' '}
              <button
                className={`blank ${filled ? 'filled' : ''}`}
                disabled={solved || !filled}
                onClick={() => dispatch({ type: 'FILL_SLOT', slot, chip: null })}
                aria-label={filled ? `Bỏ “${CHIPS[filled].label}”` : 'Ô trống'}
              >
                {filled ? CHIPS[filled].label : ' '}
              </button>
              {after === '.' ? '.' : ` ${after}`}
            </p>
          );
        })}
        {!solved && (
          <button className="stamp-btn" disabled={!complete} onClick={() => dispatch({ type: 'SUBMIT_DEDUCTION' })}>
            KẾT LUẬN
          </button>
        )}
        {game.deductionFeedback && <p className="red-pen">{game.deductionFeedback}</p>}
        {solved && <p className="truth-note">{NARRATION.truth}</p>}
        {solved && (
          <div className="stamp" aria-label="Đã kết luận">
            ĐÃ KẾT LUẬN
          </div>
        )}
      </section>
      <section className="page scraps-page">
        {!solved &&
          slots.map((slot) => (
            <div key={slot} className="scrap-group">
              <p className="pencil scrap-cue">{SLOT_CUE[slot]}</p>
              <div className="scraps">
                {availableChips(game, slot).map((c) => (
                  <button
                    key={c}
                    className={`scrap ${game.slots[slot] === c ? 'used' : ''}`}
                    style={{ rotate: `${tilt(c, 3)}deg` }}
                    onClick={() => dispatch({ type: 'FILL_SLOT', slot, chip: c })}
                  >
                    {CHIPS[c].label}
                  </button>
                ))}
              </div>
            </div>
          ))}
      </section>
    </>
  );
}

export function CaseFile({ v }: { v: VisualState }) {
  const game = useStore((s) => s.game);
  const tab = useStore((s) => s.ui.caseTab);
  const setUi = useStore((s) => s.setUi);
  const tabs: { id: CaseTab; label: string }[] = [
    { id: 'clues', label: 'manh mối' },
    { id: 'radio', label: 'radio' },
    ...(game.contactMade ? [{ id: 'deduction' as const, label: 'kết luận' }] : []),
  ];
  const current = tab === 'deduction' && !game.contactMade ? 'clues' : tab;

  return (
    <Overlay label="Hồ sơ" onClose={() => setUi({ panel: null })} className="casefile-overlay">
      <div className="casebook">
        <header className="case-question">
          <s className="pencil struck">Theo bỏ nhà đi?</s>
          <span className="pencil">{objective(game) || TRUTH_QUESTION}</span>
        </header>
        <nav className="index-tabs" role="tablist">
          {tabs.map((t, i) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={current === t.id}
              className={`index-tab tab-${i} ${current === t.id ? 'active' : ''}`}
              onClick={() => setUi({ caseTab: t.id })}
            >
              {t.label}
              {t.id === 'clues' && <small> {game.clues.length}</small>}
            </button>
          ))}
        </nav>
        <div className="spread">
          {current === 'clues' && <CluePages v={v} />}
          {current === 'radio' && <RadioPages />}
          {current === 'deduction' && <DeductionPages />}
          <div className="spiral" aria-hidden />
        </div>
      </div>
    </Overlay>
  );
}
