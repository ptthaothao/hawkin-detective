import { useEffect, useRef, useState } from 'react';
import { markFinished } from '../chapter';
import { useQuality } from '../ui/quality';
import { FilmGrain } from '../ui/scene/Atmosphere';
import { AFTER, END, FAINT, FOUND, FOUND_AFTER, HIDE_LABEL, HIDE_LINES, MMM, NARRATION, OBJECTIVE, PROMPT } from './content';
import { AUTO_MS, BREATH_MS, DOOR_OPENS_MS, NEAR_AT_MS, PASS_AT_MS, PASS_STEPS, STEP_MS, isNear, type Beat, type Ch11State, type HideSpot } from './machine';
import { PanoStage, type SpotId, type SpotSpec, type ViewId } from './pano/stage';
import { Stage3D } from './three/stage3d';
import { sound } from './sound';
import { clock, useCh11 } from './store';
import '../styles/ch11.css';

const AUTO_BEATS: Beat[] = ['back', 'answer', 'hide', 'mmm', 'found', 'faint', 'carried'];
const LINE_MS = 2_300;

const JUMPS: readonly Beat[] = ['back', 'bark', 'answer', 'torch', 'look', 'shut', 'choose', 'hide', 'mmm', 'found', 'faint', 'carried', 'awake'];

/** `?beat=hide&spot=bed` jumps straight to a beat, for testing and sharing a preview. Only known values are taken. */
function jumpFromUrl(): { beat: Beat; spot?: HideSpot } | undefined {
  const q = new URLSearchParams(window.location.search);
  const beat = JUMPS.find((b) => b === q.get('beat'));
  const spot = q.get('spot') === 'bed' ? 'bed' : 'wardrobe';
  return beat ? { beat, spot } : undefined;
}

function useNow(active: boolean) {
  const [now, setNow] = useState(clock);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const loop = () => {
      setNow(clock());
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active]);
  return now;
}

/** Plays the sounds that belong to each beat, and keeps the continuous ones in step with the state. */
function useSoundDriver(s: Ch11State, started: boolean) {
  const prev = useRef<Ch11State | null>(null);
  const steps = useRef(-1);
  const radioBack = useRef(false);
  useEffect(() => {
    if (!started) return;
    const p = prev.current;
    prev.current = s;
    if (p?.beat !== s.beat) {
      steps.current = -1;
      radioBack.current = false;
      if (s.beat === 'back') sound.setRoom(0.6);
      if (s.beat === 'bark') sound.play('bark');
      if (s.beat === 'answer') sound.play('surge');
      if (s.beat === 'look') sound.play('torch');
      if (s.beat === 'shut') sound.heart(110);
      if (s.beat === 'hide') sound.play('rustle');
      if (s.beat === 'mmm') sound.play('mmm');
      if (s.beat === 'found') sound.play(s.outcome === 'gasped' ? 'gasp' : 'rip');
      if (s.beat === 'faint') {
        sound.play('inhale');
        window.setTimeout(() => sound.silence(true), 350);
      }
      if (s.beat === 'carried') {
        sound.silence(false);
        sound.setRoom(0.3);
      }
      if (s.beat === 'awake') sound.setRoom(0.5);
    }
    if (p && !p.doorShut && s.doorShut) sound.play('slam');
    if (p && !p.radioOff && s.radioOff) {
      sound.play('click');
      sound.play('drop');
    }
    if (p && p.holdingSince === null && s.holdingSince !== null) sound.play('inhale');
    const radio = s.radioOff ? 0 : s.beat === 'answer' ? 0.3 : 0.06;
    sound.setRadio(radio);
  }, [s, started]);

  // Things on a clock inside a beat: the door, its steps, the heart, the radio coming back on.
  const now = useNow(started && (s.beat === 'hide' || s.beat === 'carried' || s.beat === 'awake'));
  useEffect(() => {
    if (!started) return;
    const t = now - s.beatAt;
    if (s.beat === 'hide') {
      if (t >= DOOR_OPENS_MS && steps.current < 0) {
        sound.play('creak');
        steps.current = 0;
      }
      const k = Math.floor((t - DOOR_OPENS_MS) / STEP_MS) + 1;
      if (t < NEAR_AT_MS && k > steps.current && k > 0) {
        steps.current = k;
        sound.play('step');
      }
      sound.heart(isNear(s, now) ? 150 : 120);
      // Breathing is the thing he must stop: loud and quick while it is close, gone while he holds it.
      sound.breathing(s.holdingSince !== null ? 0 : isNear(s, now) ? 48 : 34);
    }
    if (s.beat === 'awake') {
      const k = Math.floor((t - PASS_AT_MS) / STEP_MS) + 1;
      if (k > 0 && k <= PASS_STEPS && k > steps.current) {
        steps.current = k;
        sound.play('step');
      }
    }
    if (s.beat === 'carried' && !radioBack.current && t > AUTO_MS.carried! * 0.7) {
      radioBack.current = true;
      sound.play('radioOn');
    }
    if (s.beat !== 'hide' && s.beat !== 'shut' && s.beat !== 'choose') sound.heart(0);
    if (s.beat === 'back' || s.beat === 'bark' || s.beat === 'answer' || s.beat === 'torch') sound.breathing(14);
    if (s.beat === 'look') sound.breathing(22);
    if (s.beat === 'shut' || s.beat === 'choose') sound.breathing(40);
    if (s.beat === 'mmm' || s.beat === 'found' || s.beat === 'carried' || s.beat === 'end') sound.breathing(0);
    if (s.beat === 'awake') sound.breathing(20);
  }, [now, s, started]);
}

/** The beats played in the PixiJS panoramas of Theo's room; the rest is still the 3D stage for now. */
const ROOM_BEATS: Beat[] = ['back', 'bark', 'answer', 'torch', 'look', 'shut', 'choose'];

export function viewFor(s: Ch11State): ViewId {
  switch (s.beat) {
    case 'look':
      return 'room-torch';
    case 'shut':
      if (!s.doorShut) return 'door-it';
      return s.radioOff ? 'room-quiet' : 'room-shut';
    case 'choose':
      return 'room-quiet';
    default:
      return 'room-start';
  }
}

const torchOn = (s: Ch11State) => s.beat === 'look' || s.beat === 'shut' || s.beat === 'choose';

/** What the player can use right now, and whether to point it out (stuck for a while). */
export function spotsFor(s: Ch11State, t: number): SpotSpec[] {
  const stuck = t > 4_000;
  switch (s.beat) {
    case 'torch':
      return [{ id: 'torch', label: PROMPT.torch, hint: stuck }];
    case 'look':
      return [{ id: 'door', label: PROMPT.look, hint: stuck }];
    case 'shut':
      if (t < 1_700) return [];
      if (!s.doorShut) return [{ id: 'door', label: PROMPT.slam, hint: true }];
      return s.radioOff ? [] : [{ id: 'radio', label: PROMPT.radio, hint: true }];
    case 'choose':
      return (['wardrobe', 'bed'] as const).map((id) => ({ id, label: HIDE_LABEL[id], hint: stuck }));
    default:
      return [];
  }
}

function act(s: Ch11State, id: SpotId) {
  const { dispatch } = useCh11.getState();
  if (id === 'torch') dispatch({ type: 'grabTorch' });
  if (id === 'door') dispatch({ type: s.beat === 'look' ? 'shineDoor' : 'slamDoor' });
  if (id === 'radio') dispatch({ type: 'radioOff' });
  if (id === 'wardrobe' || id === 'bed') dispatch({ type: 'hide', spot: id });
}

function tickAuto() {
  const { s, dispatch } = useCh11.getState();
  if (AUTO_BEATS.includes(s.beat)) dispatch({ type: 'tick' });
}

function PanoHost() {
  const ref = useRef<HTMLDivElement>(null);
  const quality = useQuality();
  const low = useRef(quality === 'low');
  low.current = quality === 'low';
  useEffect(() => {
    const stage = new PanoStage();
    void stage.mount(ref.current!, {
      state: () => useCh11.getState().s,
      now: clock,
      low: () => low.current,
      onFrame: tickAuto,
      view: viewFor,
      torchOn,
      spots: () => {
        const { s, started } = useCh11.getState();
        return started ? spotsFor(s, clock() - s.beatAt) : [];
      },
      onSpot: (id) => act(useCh11.getState().s, id),
    });
    return () => stage.destroy();
  }, []);
  return <div className="ch11-stage" ref={ref} />;
}

function ThreeHost() {
  const ref = useRef<HTMLDivElement>(null);
  const quality = useQuality();
  const low = useRef(quality === 'low');
  low.current = quality === 'low';
  useEffect(() => {
    const stage = new Stage3D();
    stage.mount(ref.current!, {
      state: () => useCh11.getState().s,
      now: clock,
      low: () => low.current,
      onFrame: tickAuto,
    });
    return () => stage.destroy();
  }, []);
  return <div className="ch11-stage" ref={ref} />;
}

/** The room is panoramas; hiding and after are still the 3D stage until they are baked too. */
function StageHost() {
  const inRoom = useCh11((st) => !st.started || ROOM_BEATS.includes(st.s.beat));
  return inRoom ? <PanoHost /> : <ThreeHost />;
}

/** The note in the corner, as in Chapter 0: where Theo is, what he is wondering, what to do. */
function Objective({ s, t }: { s: Ch11State; t: number }) {
  const o = OBJECTIVE[s.beat];
  if (!o) return null;
  // as in Chapter 0: a new note is written in at full strength, then settles into a quiet pencil line
  return (
    <div className={`objective ch11-objective ${t < 4_500 ? 'fresh' : ''}`} key={s.beat}>
      <span className="location">{o.where}</span>
      <span className="objective-kicker">Câu hỏi</span>
      <p>{o.goal}</p>
      {o.action && <span className="objective-action">→ {o.action}</span>}
    </div>
  );
}

/** Lines appear one after another from the start of a beat. */
function Lines({ lines, since, every = LINE_MS, fade }: { lines: string[]; since: number; every?: number; fade?: number }) {
  if (since < 0 || (fade !== undefined && since > fade)) return null;
  const shown = Math.min(lines.length, Math.floor(since / every) + 1);
  return (
    <div className="ch11-lines">
      {lines.slice(0, shown).map((l) => (
        <p key={l}>{l}</p>
      ))}
    </div>
  );
}

function BreathButton({ s, now }: { s: Ch11State; now: number }) {
  const dispatch = useCh11((st) => st.dispatch);
  useEffect(() => {
    const down = (e: KeyboardEvent) => e.code === 'Space' && !e.repeat && dispatch({ type: 'breath', holding: true });
    const up = (e: KeyboardEvent) => e.code === 'Space' && dispatch({ type: 'breath', holding: false });
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      dispatch({ type: 'breath', holding: false });
    };
  }, [dispatch]);
  const holding = s.holdingSince !== null;
  const left = holding ? Math.max(0, 1 - (now - s.holdingSince!) / BREATH_MS) : 1;
  return (
    <div className={`ch11-breath ${isNear(s, now) ? 'urgent' : ''} ${holding ? 'holding' : ''}`}>
      <button
        onPointerDown={() => dispatch({ type: 'breath', holding: true })}
        onPointerUp={() => dispatch({ type: 'breath', holding: false })}
        onPointerLeave={() => holding && dispatch({ type: 'breath', holding: false })}
      >
        {PROMPT.hold}
      </button>
      <div className="ch11-lungs">
        <i style={{ width: `${left * 100}%` }} />
      </div>
      <small>{PROMPT.holdKey}</small>
    </div>
  );
}

function Play() {
  const s = useCh11((st) => st.s);
  const dispatch = useCh11((st) => st.dispatch);
  const now = useNow(true);
  const t = now - s.beatAt;
  useSoundDriver(s, true);

  useEffect(() => {
    if (s.beat === 'end') markFinished('1.1');
  }, [s.beat]);

  const narration = NARRATION[s.beat] ?? [];
  return (
    <div className={`ch11-frame beat-${s.beat}`}>
      <Objective s={s} t={t} />
      <div className="ch11-text">
        {s.beat !== 'shut' && s.beat !== 'mmm' && s.beat !== 'found' && s.beat !== 'faint' && s.beat !== 'hide' && (
          <Lines lines={narration} since={t} />
        )}
        {s.beat === 'shut' && (
          <Lines lines={narration} since={t - 600} fade={3_200} />
        )}
        {s.beat === 'hide' && s.hideSpot && <Lines lines={[AFTER.pocket, ...HIDE_LINES[s.hideSpot]]} since={t} every={1_800} fade={4_000} />}
        {s.beat === 'mmm' && <p className="ch11-mmm">{MMM}</p>}
        {s.beat === 'found' && s.hideSpot && s.outcome && (
          <Lines lines={[FOUND[s.outcome], ...FOUND_AFTER[s.hideSpot]].filter((l): l is string => !!l)} since={t - 2_200} every={1_700} />
        )}
        {s.beat === 'faint' && <Lines lines={[FAINT]} since={t} />}
      </div>

      {s.beat === 'bark' && t > 2_000 && (
        <button className="ch11-say" onClick={() => dispatch({ type: 'call' })}>
          {PROMPT.call}
        </button>
      )}
      {s.beat === 'choose' && (
        <div className="ch11-choices">
          {(['wardrobe', 'bed'] as const).map((spot) => (
            <button key={spot} onClick={() => dispatch({ type: 'hide', spot })}>
              {HIDE_LABEL[spot]}
            </button>
          ))}
        </div>
      )}
      {s.beat === 'hide' && <BreathButton s={s} now={now} />}
      {s.beat === 'awake' && t > (NARRATION.awake!.length + 1) * LINE_MS && (
        <button className="ch11-say" onClick={() => dispatch({ type: 'finish' })}>
          {PROMPT.finish}
        </button>
      )}
      {s.beat === 'end' && (
        <div className="ch11-end">
          <h1>{END.title}</h1>
          <p>{END.teaser}</p>
          <button onClick={() => useCh11.getState().start()}>{END.replay}</button>
        </div>
      )}
    </div>
  );
}

function Title() {
  const start = useCh11((st) => st.start);
  return (
    <div className="ch11-title">
      <p className="ch11-kicker">STATIC</p>
      <h1>Chương 1.1</h1>
      <p className="ch11-sub">Đêm thứ tư</p>
      <button
        onClick={() => {
          sound.unlock();
          start(jumpFromUrl());
        }}
      >
        NHẤN ĐỂ BẮT ĐẦU
      </button>
      <small>Nên đeo tai nghe.</small>
    </div>
  );
}

export default function Chapter11() {
  const started = useCh11((st) => st.started);
  return (
    <div className="ch11">
      <StageHost />
      <div className="ch11-vignette" />
      <FilmGrain />
      {started ? <Play /> : <Title />}
    </div>
  );
}
