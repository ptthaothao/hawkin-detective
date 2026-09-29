import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ECHOES, HOTSPOT_TEXT } from '../game/content';
import { freq, radioSignal } from '../game/selectors';
import type { VisualState } from '../presentation/visual';
import { audio } from '../audio/audio';
import { lineMs, useStore, voiceAt } from '../store';
import { Dialogue, type LineKind } from './Dialogue';
import { Overlay } from './Overlay';
import { prefersReducedMotion, useNow } from './useNow';

const WHEEL_RANGE: [number, number][] = [
  [1, 4],
  [0, 9],
  [0, 9],
];
const CLOSE_AFTER_CHOICE_MS = 1_100;
/** Doc §K: after Theo's question, a beat of silence before the controls answer to the hand. */
const SILENCE_BEFORE_CHOICE_MS = 1_800;

function wrap(v: number, [min, max]: [number, number]) {
  const span = max - min + 1;
  return ((v - min + span) % span) + min;
}

/** Pixels of drag per notch of the wheel. */
const NOTCH_PX = 18;
/** Scroll-wheel turns land once the hand stops. */
const WHEEL_SETTLE_MS = 240;

/**
 * A ridged thumbwheel behind glass. Drag it (mouse or finger) and it rolls notch by notch with a
 * click each time; flick it and it keeps spinning a little. Only where it stops is dispatched,
 * so the radio tunes to the station you land on, not every one you roll past.
 */
function Thumbwheel({
  value,
  range,
  disabled,
  onNotch,
  onTurn,
}: {
  value: number;
  range: [number, number];
  disabled: boolean;
  /** Every notch the wheel rolls past (preview value): the click and the static shifting. */
  onNotch: (preview: number) => void;
  /** Where it came to rest, as a number of notches from `value`. */
  onTurn: (delta: number) => void;
}) {
  const [pending, setPending] = useState(0);
  const pendingRef = useRef(0);
  const dir = useRef<1 | -1>(1);
  const drag = useRef<{ y0: number; y: number; t: number; acc: number; v: number; captured: boolean } | null>(null);
  const spin = useRef(0);
  const settleTimer = useRef(0);

  const notch = (d: 1 | -1) => {
    dir.current = d;
    pendingRef.current += d;
    setPending(pendingRef.current);
    onNotch(wrap(value + pendingRef.current, range));
  };
  const settle = () => {
    window.clearTimeout(settleTimer.current);
    const d = pendingRef.current;
    pendingRef.current = 0;
    setPending(0);
    if (d) onTurn(d);
  };
  const stopSpin = () => {
    cancelAnimationFrame(spin.current);
    spin.current = 0;
  };
  useEffect(() => () => {
    stopSpin();
    window.clearTimeout(settleTimer.current);
  }, []);
  // Controls lock mid-spin (a voice came through): whatever was turned still counts.
  useEffect(() => {
    if (disabled && pendingRef.current) {
      stopSpin();
      settle();
    }
  });

  const roll = (acc: number) => {
    let a = acc;
    while (a >= NOTCH_PX) {
      notch(1);
      a -= NOTCH_PX;
    }
    while (a <= -NOTCH_PX) {
      notch(-1);
      a += NOTCH_PX;
    }
    return a;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    stopSpin();
    drag.current = { y0: e.clientY, y: e.clientY, t: performance.now(), acc: 0, v: 0, captured: false };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    if (!d.captured) {
      // A small wobble is still a tap on the up/down half.
      if (Math.abs(e.clientY - d.y0) < 5) return;
      d.captured = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    const now = performance.now();
    const dy = d.y - e.clientY; // up = higher digit, as if rolling the wheel with a thumb
    const dt = Math.max(1, now - d.t);
    d.v = d.v * 0.5 + (dy / dt) * 0.5;
    d.y = e.clientY;
    d.t = now;
    d.acc = roll(d.acc + dy);
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    drag.current = null;
    if (!d?.captured) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    // A flick keeps the wheel going; friction brings it to rest.
    if (Math.abs(d.v) < 0.3 || prefersReducedMotion()) {
      settle();
      return;
    }
    let v = Math.max(-1.4, Math.min(1.4, d.v));
    let acc = d.acc;
    let last = performance.now();
    const tick = (t: number) => {
      const dt = Math.min(40, t - last);
      last = t;
      acc = roll(acc + v * dt);
      v *= Math.pow(0.86, dt / 16);
      if (Math.abs(v) > 0.04) spin.current = requestAnimationFrame(tick);
      else {
        spin.current = 0;
        settle();
      }
    };
    spin.current = requestAnimationFrame(tick);
  };

  const shown = wrap(value + pending, range);
  return (
    <div
      className={`thumbwheel ${drag.current?.captured || spin.current ? 'turning' : ''}`}
      onWheel={(e) => {
        if (disabled) return;
        notch(e.deltaY < 0 ? 1 : -1);
        window.clearTimeout(settleTimer.current);
        settleTimer.current = window.setTimeout(settle, WHEEL_SETTLE_MS);
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      aria-disabled={disabled}
    >
      <button
        className="tw-btn up"
        disabled={disabled}
        onClick={() => {
          notch(1);
          settle();
        }}
        aria-label="Tăng"
      />
      <div className="tw-drum" key={shown} data-dir={dir.current}>
        <span className="tw-ghost">{wrap(shown + 1, range)}</span>
        <span className="tw-digit">{shown}</span>
        <span className="tw-ghost">{wrap(shown - 1, range)}</span>
      </div>
      <button
        className="tw-btn down"
        disabled={disabled}
        onClick={() => {
          notch(-1);
          settle();
        }}
        aria-label="Giảm"
      />
    </div>
  );
}

/** Analog S-meter. The needle jitters with noise; a clean signal holds it steady. */
function SignalMeter({ on, clarity }: { on: boolean; clarity: number }) {
  const needle = useRef<SVGLineElement>(null);
  useEffect(() => {
    const el = needle.current;
    if (!el) return;
    const reduced = prefersReducedMotion();
    let raf = 0;
    let shown = -52;
    const tick = (t: number) => {
      const noise = reduced ? 0 : (Math.sin(t / 47) + Math.sin(t / 113) * 0.7 + Math.random() - 0.5) * (1 - clarity) * 9;
      const target = on ? -40 + clarity * 80 + noise : -52;
      shown += (target - shown) * 0.2;
      el.setAttribute('transform', `rotate(${shown} 60 62)`);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [on, clarity]);

  return (
    <svg viewBox="0 0 120 70" className="s-meter" aria-hidden>
      <rect width="120" height="70" rx="3" className="s-meter-face" />
      <path d="M18 44 A48 48 0 0 1 102 44" className="s-arc" />
      <path d="M84 30 A48 48 0 0 1 102 44" className="s-arc red" />
      {Array.from({ length: 11 }, (_, i) => (
        <line key={i} x1="60" y1="18" x2="60" y2={i % 2 ? 23 : 26} transform={`rotate(${-50 + i * 10} 60 62)`} className="s-tick" />
      ))}
      <text x="18" y="60" className="s-label">S</text>
      <text x="94" y="60" className="s-label">+</text>
      <line ref={needle} x1="60" y1="62" x2="60" y2="16" className="s-needle" />
      <circle cx="60" cy="62" r="4" className="s-pivot" />
    </svg>
  );
}

/** Phosphor trace: a sine buried in noise. Dread tears the trace apart. */
function Scope({ on, clarity, dread }: { on: boolean; clarity: number; dread: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const w = (canvas.width = 240);
    const h = (canvas.height = 90);
    const reduced = prefersReducedMotion();
    let raf = 0;
    const draw = (t: number) => {
      ctx.fillStyle = 'rgba(8, 6, 3, 0.38)';
      ctx.fillRect(0, 0, w, h);
      if (on) {
        ctx.strokeStyle = '#ffbf5c';
        ctx.shadowColor = '#ff9d2e';
        ctx.shadowBlur = 6;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        const tear = dread > 0.45 && Math.random() < dread * 0.08;
        for (let x = 0; x <= w; x += 3) {
          const phase = x / 14 + t / 180;
          const signal = Math.sin(phase) * clarity * 26;
          const noise = (Math.random() - 0.5) * (1 - clarity) * 60;
          const y = h / 2 + signal + noise + (tear && x > w * 0.4 && x < w * 0.7 ? 30 : 0);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
      if (!reduced) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [on, clarity, dread]);
  return <canvas ref={ref} className="scope" aria-hidden />;
}

export function RadioView({ v }: { v: VisualState }) {
  const game = useStore((s) => s.game);
  const subtitle = useStore((s) => s.ui.subtitle);
  const dispatch = useStore((s) => s.dispatch);
  const setUi = useStore((s) => s.setUi);
  const now = useNow(200, !!subtitle);

  const voice = subtitle ? voiceAt(subtitle, now) : null;
  const playing = !!voice && voice.phase !== 'done';
  const signal = radioSignal(game);
  const precall = signal === 'precall';
  // Theo has finished: the footsteps begin and the switch and knob come alive (doc §K).
  const ready = precall && !playing && (!voice || voice.sinceDone >= SILENCE_BEFORE_CHOICE_MS);
  useEffect(() => {
    if (ready) dispatch({ type: 'FINALE_BEGIN' });
  }, [ready, dispatch]);
  const finale = game.finaleStartedAt !== null && !game.hushed;
  const controlsOff = playing || precall || game.deductionSolved || game.world !== 'normal';
  const close = playing || precall ? undefined : () => setUi({ panel: null, subtitle: null });

  // Static → silence → voice. The static comes back when the voice is gone.
  const hushed = voice?.phase === 'hush' || voice?.phase === 'speaking' || (precall && voice?.phase === 'done');
  useEffect(() => {
    audio.duck(!!hushed);
    return () => audio.duck(false);
  }, [hushed]);
  const lineIndex = voice?.index ?? -1;
  const line = voice?.phase === 'speaking' && subtitle ? subtitle.lines[voice.index] : null;
  useEffect(() => {
    if (line && (line.who === 'theo' || line.who === 'radio')) {
      audio.cue('squelch');
      audio.voice(lineMs(line));
    }
  }, [lineIndex, line]);
  // Doc §14: static tears → silence (a breath in it) → the voice → the radio cuts out / something answers.
  const phase = voice?.phase ?? null;
  useEffect(() => {
    if (!subtitle || !phase) return;
    if (phase === 'surge') audio.cue('distort');
    else if (phase === 'hush' && subtitle.hushCue) audio.cue(subtitle.hushCue);
    else if (phase === 'done' && subtitle.endCue) audio.cue(subtitle.endCue);
  }, [phase, subtitle]);

  // The dial rolling under the thumb: a click per notch, and the static shifts with the number.
  const preview = useRef<(number | null)[]>([null, null, null]);
  const onNotch = (i: number, digit: number) => {
    preview.current[i] = digit;
    const [a, b, c] = game.radio.wheels.map((w, k) => preview.current[k] ?? w);
    audio.cue('detent');
    audio.tune(a + b / 10 + c / 100);
  };

  // After the switch-off the radio stays in view a moment so the player sees the lever drop.
  const hushedAtOpen = useRef(game.hushed);
  useEffect(() => {
    if (!game.hushed || hushedAtOpen.current) return;
    const id = window.setTimeout(() => setUi({ panel: null, subtitle: null }), CLOSE_AFTER_CHOICE_MS);
    return () => window.clearTimeout(id);
  }, [game.hushed, setUi]);

  const KIND = { theo: 'voice', radio: 'voice', you: 'you', stage: 'aside' } as const;
  let readout: { kind: LineKind; text: string; who?: string } | null = null;
  if (voice?.phase === 'surge') readout = { kind: 'sound', text: 'rè… rè…' };
  else if (voice?.phase === 'hush') readout = null;
  else if (line) readout = { kind: KIND[line.who], text: line.text, who: line.who };
  else if (precall && subtitle) {
    const last = subtitle.lines[subtitle.lines.length - 1];
    readout = ready ? { kind: 'voice', text: last.text, who: last.who } : null;
  }
  else if (subtitle?.after) readout = { kind: 'thought', text: subtitle.after };
  else if (signal === 'static' || signal === 'precall' || signal === 'steps') readout = { kind: 'sound', text: 'rè' };
  else if (signal.startsWith('echo')) {
    readout = { kind: 'sound', text: ECHOES[freq(game)].line.replace(/^\[[\d.]+\] /, '') };
  }

  const on = game.radio.on;
  // While a voice is coming through, the signal locks on clean.
  const clarity = voice?.phase === 'speaking' ? 0.9 : v.radio.clarity;
  const style = { '--clarity': clarity, '--dread': v.dread } as CSSProperties;

  return (
    <Overlay
      label="Radio"
      onClose={close}
      className={`radio-overlay ${playing ? 'listening' : ''} ${line?.who === 'stage' ? 'looking-around' : ''}`}
    >
      <div
        className={`radio-set ${on ? 'on' : ''} ${finale ? 'choosing' : ''} ${phase === 'speaking' ? 'speaking' : ''} ${phase === 'surge' ? 'surging' : ''}`}
        style={style}
      >
        <div className="radio-cheek" aria-hidden />
        <div className="radio-face">
          <div className="radio-row">
            <div className="meter-window">
              <SignalMeter on={on} clarity={clarity} />
              <span className="engrave">SIGNAL</span>
            </div>
            <div className="freq-block">
              <div className={`freq-window ${phase === 'surge' ? 'flicker' : ''}`}>
                {game.radio.wheels.map((val, i) => (
                  <span key={i} className="tw-slot">
                    {i === 1 && <span className="tw-dot">.</span>}
                    <Thumbwheel
                      value={val}
                      range={WHEEL_RANGE[i]}
                      disabled={controlsOff}
                      onNotch={(digit) => onNotch(i, digit)}
                      onTurn={(delta) => {
                        preview.current[i] = null;
                        dispatch({ type: 'RADIO_WHEEL', index: i as 0 | 1 | 2, delta });
                      }}
                    />
                  </span>
                ))}
              </div>
              <span className="engrave">FREQ · MHz</span>
            </div>
            <div className="scope-window">
              <Scope on={on} clarity={clarity} dread={v.dread} />
              <span
                className={`rx-led ${on && (signal !== 'static' || phase === 'speaking') ? 'lit' : ''} ${phase === 'speaking' ? 'steady' : ''}`}
                aria-hidden
              />
              <span className="engrave">RX</span>
            </div>
          </div>
          <div className="radio-row controls">
            <span className="brand" aria-hidden>
              KESTREL <em>SW-3</em>
            </span>
            <div className="speaker" aria-hidden />
            <div className="control">
              <button
                className={`toggle ${game.radio.on ? 'up' : 'down'}`}
                role="switch"
                aria-checked={game.radio.on}
                aria-label={finale ? 'Tắt radio' : 'Nguồn'}
                disabled={finale ? false : controlsOff}
                onClick={() => dispatch({ type: 'RADIO_POWER', on: !game.radio.on })}
              >
                <span className="toggle-lever" />
              </button>
              <span className="engrave">
                POWER <small>OFF · ON</small>
              </span>
            </div>
            <div className="control">
              <button
                className={`knob ${game.radio.knobSnapped ? 'snapped' : ''}`}
                aria-label={game.radio.knobSnapped ? 'Núm âm lượng đã gãy' : 'Núm âm lượng'}
                disabled={!finale}
                onClick={() => {
                  if (!game.radio.knobSnapped) audio.cue('thud');
                  dispatch({ type: 'KNOB_TRY' });
                }}
              >
                <span className="knob-cap" />
              </button>
              <span className="engrave">
                VOLUME <small className="max-mark">MAX</small>
              </span>
            </div>
          </div>
        </div>
        <div className="radio-cheek" aria-hidden />
      </div>
      {game.crayonTaken && !game.rubbed && !playing && !precall && !finale && game.world === 'normal' && (
        <button className="radio-flip" onClick={() => setUi({ panel: 'rub' })}>
          {HOTSPOT_TEXT.radioFaint} Chà thử?
        </button>
      )}
      <Dialogue
        who={readout?.who}
        kind={readout?.kind ?? null}
        text={readout?.text ?? ''}
        lineKey={`${lineIndex}:${readout?.text ?? ''}`}
        speaking={!!line}
        transmitted={readout?.who !== 'you'}
        durationMs={line ? lineMs(line) : undefined}
        unstable={v.dread > 0.4}
      />

    </Overlay>
  );
}
