import { useEffect, useRef, useState } from 'react';
import { markFinished } from '../chapter';
import { useQuality } from '../ui/quality';
import { FilmGrain } from '../ui/scene/Atmosphere';
import { sound } from '../ch1_1/sound';
import {
  CAUGHT,
  CAUGHT_LOST,
  END,
  HIDE_LABEL,
  HIDE_OBJECTIVE,
  NARRATION,
  OBJECTIVE,
  OUTSIDE,
  OUTSIDE_OBJECTIVE,
  OUTSIDE_STEPS,
  OUTSIDE_STEPS_OBJECTIVE,
  PROMPT,
  REWARD,
  TARGET_LABEL,
  TITLE,
  type Objective as ObjectiveNote,
} from './content';
import {
  AUTO_MS,
  BLOCK_HINT_MS,
  BREATH_MS,
  DOOR_HOLD_MS,
  DOOR_OPENS_MS,
  STATIONS,
  STATION_WAIT_MS,
  STEP_MS,
  WAKE_MIN_MS,
  atBlock,
  blockedFor,
  canRun,
  isNear,
  searchAt,
  stepsBy,
  type Beat,
  type Ch12State,
  type HideSpot,
  type Round,
} from './machine';
import { Stage12, type SceneId, type SpotId, type SpotSpec } from './stage';
import { clock, useCh12, type Jump } from './store';
import '../styles/ch11.css';
import '../styles/ch12.css';

const LINE_MS = 2_300;
const AUTO_BEATS: Beat[] = ['title', 'tumble', 'yard', 'catch', 'hide', 'caught', 'sleep', 'slam', 'run', 'door', 'glass'];
const JUMPS: readonly Beat[] = ['title', 'carried', 'tumble', 'yard', 'catch', 'choose', 'hide', 'caught', 'sleep', 'wake', 'outside', 'slam', 'run', 'door', 'glass', 'end'];

/** `?beat=hide&spot=tent&round=2&at=9000` jumps straight into a beat, `at` ms in. Only known values are taken. */
function jumpFromUrl(): Jump | undefined {
  const q = new URLSearchParams(window.location.search);
  const beat = JUMPS.find((b) => b === q.get('beat'));
  if (!beat) return undefined;
  const spot: HideSpot = q.get('spot') === 'buggy' ? 'buggy' : 'tent';
  const round: Round = q.get('round') === '2' ? 2 : 1;
  const at = Math.max(0, Math.min(120_000, Number(q.get('at')) || 0));
  return { beat, spot, round, at };
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

/** The sounds that belong to each beat, and the continuous ones kept in step with the state. */
function useSoundDriver(s: Ch12State, started: boolean) {
  const prev = useRef<Ch12State | null>(null);
  const steps = useRef(-1);
  const touched = useRef(0);
  const routeAt = useRef(-1);
  const fired = useRef(0);
  useEffect(() => {
    if (!started) return;
    const p = prev.current;
    prev.current = s;
    if (p?.beat !== s.beat) {
      steps.current = -1;
      touched.current = 0;
      fired.current = 0;
      if (s.beat === 'title') {
        sound.setRoom(0.25);
        sound.setRadio(0);
      }
      if (s.beat === 'carried') {
        sound.play12('scream');
        sound.setRoom(0.3);
      }
      if (s.beat === 'tumble') sound.play12('tumble');
      if (s.beat === 'yard') sound.setRoom(0.55);
      if (s.beat === 'hide') sound.play('rustle');
      if (s.beat === 'caught') sound.play(s.fails > 0 ? 'gasp' : 'rip');
      if (s.beat === 'sleep') sound.setRoom(0.2);
      if (s.beat === 'wake') sound.setRoom(0.35);
      if (s.beat === 'outside') sound.setRoom(0.12);
      if (s.beat === 'run') {
        sound.setRoom(0.4);
        sound.setRadio(0.1);
      }
      if (s.beat === 'door') sound.setRadio(0.12);
      if (s.beat === 'glass') sound.setRadio(0.04);
      if (s.beat === 'end') sound.setRadio(0);
    }
    if (p && p.station !== s.station) steps.current = -1;
    if (p && s.throws > p.throws) sound.play12(s.route[0]?.stop === 'cans' ? 'cans' : 'tick');
    if (p && p.closing === null && s.closing !== null) sound.play12('doorSoft');
    if (p && p.closing !== null && s.closing === null && s.beat === 'door') sound.play12('doorCreak');
    if (p && p.holdingSince === null && s.holdingSince !== null) sound.play('inhale');
  }, [s, started]);

  // Things on a clock inside a beat: its steps, the door, the heart, the breathing.
  const clocked = s.beat === 'hide' || s.beat === 'yard' || s.beat === 'catch' || s.beat === 'choose' || s.beat === 'wake' || s.beat === 'outside' || s.beat === 'slam' || s.beat === 'run' || s.beat === 'glass';
  const now = useNow(started && clocked);
  useEffect(() => {
    if (!started) return;
    const t = now - s.beatAt;
    if (s.beat === 'hide') {
      const rt = now - s.routeAt;
      if (routeAt.current !== s.routeAt) {
        routeAt.current = s.routeAt;
        steps.current = -1;
        touched.current = 0;
      }
      if (s.routeFrom === 'enter' && rt >= DOOR_OPENS_MS && steps.current < 0) {
        sound.play('creak');
        steps.current = 0;
      } else if (s.routeFrom !== 'enter' && steps.current < 0) steps.current = 0;
      const k = stepsBy(s.route, rt);
      if (k > steps.current && steps.current >= 0) {
        steps.current = k;
        sound.play('step');
      }
      const arrived = s.route.filter((l, i) => (l.stop === 'tent' || l.stop === 'buggy') && searchAt(s.route, rt).leg >= i && rt >= l.arrive).length;
      if (arrived > touched.current) {
        touched.current = arrived;
        sound.play('rustle');
        if (s.hideSpot === 'buggy' && s.route.some((l) => l.stop === 'tent' && rt >= l.arrive)) sound.play('mmm');
      }
      sound.heart(isNear(s, now) ? 150 : 120);
      sound.breathing(s.holdingSince !== null ? 0 : isNear(s, now) ? 48 : 34);
      return;
    }
    if (s.beat === 'yard' || s.beat === 'run' || s.beat === 'slam' || s.beat === 'glass') {
      const from = s.beat === 'slam' ? 3_800 : s.beat === 'glass' ? 5_200 : 600;
      const k = Math.floor((t - from) / (s.beat === 'yard' ? 1_300 : STEP_MS)) + 1;
      if (k > 0 && k > steps.current && (s.beat !== 'glass' || k <= 4)) {
        steps.current = k;
        sound.play12('stepYard');
      }
      if (s.beat === 'slam' && t >= 1_600 && fired.current < 1) {
        fired.current = 1;
        sound.play12('garageSlam');
      }
      if (s.beat === 'run') sound.heart(130);
      else sound.heart(s.beat === 'slam' && t > 1_800 ? 150 : s.beat === 'yard' ? 130 : 0);
      sound.breathing(s.beat === 'glass' ? 0 : 40);
      return;
    }
    if (s.beat === 'wake') {
      const k = Math.floor((t - 2_300) / STEP_MS) + 1;
      if (k > 0 && k <= 5 && k > steps.current) {
        steps.current = k;
        sound.play('step');
      }
      sound.heart(0);
      sound.breathing(16);
      return;
    }
    if (s.beat === 'outside') {
      const ts = now - s.stationAt;
      if (s.station === STATIONS - 1 && ts > STATION_WAIT_MS - 1_500) {
        const k = Math.floor((ts - (STATION_WAIT_MS - 1_500)) / STEP_MS) + 1;
        if (k > steps.current) {
          steps.current = k;
          sound.play12('stepYard');
        }
      }
      sound.heart(0);
      sound.breathing(s.station === STATIONS - 1 ? 30 : 22);
      return;
    }
    if (s.beat === 'catch') {
      sound.heart(t > 11_000 ? 130 : 100);
      sound.breathing(t < 8_000 ? 38 : 24);
      const k = Math.floor((t - 12_000) / STEP_MS) + 1;
      if (k > 0 && k > steps.current) {
        steps.current = k;
        sound.play12('stepYard');
      }
      return;
    }
    if (s.beat === 'choose') {
      sound.heart(140);
      sound.breathing(44);
      return;
    }
    sound.heart(0);
    sound.breathing(s.beat === 'carried' ? 44 : s.beat === 'door' ? 24 : 0);
  }, [now, s, started]);
}

export function sceneFor(s: Ch12State, now: number): SceneId {
  const t = now - s.beatAt;
  switch (s.beat) {
    case 'title':
    case 'tumble':
      return 'black';
    case 'carried':
      return `carried-${Math.min(4, Math.floor(t / 2_400))}` as SceneId;
    case 'yard':
    case 'run':
      return 'yard';
    case 'slam':
      return t < 2_200 ? 'black' : 'garage';
    case 'wake':
      return 'cloth';
    case 'outside':
      return (['out0', 'out1', 'out2'] as const)[Math.min(2, s.station)];
    case 'door':
    case 'glass':
    case 'end':
      return 'glass';
    default:
      return 'garage';
  }
}

/** The flashlight is on while he runs and looks, off while he hides and sleeps. */
const torchOn = (s: Ch12State, now: number) => {
  const t = now - s.beatAt;
  return (s.beat === 'yard' || s.beat === 'run' || s.beat === 'outside') || ((s.beat === 'catch' || s.beat === 'choose') && t > 1_800);
};

/** What the player can use right now, and whether to point it out (stuck for a while). */
export function spotsFor(s: Ch12State, now: number): SpotSpec[] {
  const t = now - s.beatAt;
  const stuck = t > 4_000;
  switch (s.beat) {
    case 'yard':
      return [{ id: 'garage', label: PROMPT.enter, hint: stuck }];
    case 'choose':
      return (['tent', 'buggy'] as const).map((id) => ({ id, label: HIDE_LABEL[id], hint: stuck }));
    case 'hide': {
      if (s.round !== 2) return [];
      if (canRun(s, now)) return [{ id: 'door', label: PROMPT.run, hint: true }];
      if (!atBlock(s, now)) return [];
      const hint = blockedFor(s, now) >= BLOCK_HINT_MS;
      return [
        { id: 'cans', label: TARGET_LABEL.cans, hint },
        { id: 'wall', label: TARGET_LABEL.wall, hint: false },
      ];
    }
    case 'wake':
      return t >= WAKE_MIN_MS ? [{ id: 'crawl', label: PROMPT.crawl, hint: true }] : [];
    case 'outside': {
      const ts = now - s.stationAt;
      if (s.station < STATIONS - 1) return [{ id: 'onward', label: PROMPT.onward, hint: ts > 5_000 }];
      return ts >= STATION_WAIT_MS ? [{ id: 'home', label: PROMPT.home, hint: true }] : [];
    }
    default:
      return [];
  }
}

function act(id: SpotId) {
  const { dispatch } = useCh12.getState();
  if (id === 'garage') dispatch({ type: 'enterGarage' });
  if (id === 'tent' || id === 'buggy') dispatch({ type: 'hide', spot: id });
  if (id === 'cans' || id === 'wall') dispatch({ type: 'throw', target: id });
  if (id === 'door') dispatch({ type: 'run' });
  if (id === 'crawl') dispatch({ type: 'crawl' });
  if (id === 'onward') dispatch({ type: 'onward' });
  if (id === 'home') dispatch({ type: 'home' });
}

function tickAuto() {
  const { s, dispatch } = useCh12.getState();
  if (AUTO_BEATS.includes(s.beat)) dispatch({ type: 'tick' });
}

function PanoHost() {
  const ref = useRef<HTMLDivElement>(null);
  const quality = useQuality();
  const low = useRef(quality === 'low');
  low.current = quality === 'low';
  useEffect(() => {
    const stage = new Stage12();
    void stage.mount(ref.current!, {
      state: () => useCh12.getState().s,
      now: clock,
      low: () => low.current,
      onFrame: tickAuto,
      scene: sceneFor,
      torchOn,
      spots: () => {
        const { s, started } = useCh12.getState();
        return started ? spotsFor(s, clock()) : [];
      },
      onSpot: act,
    });
    return () => stage.destroy();
  }, []);
  return <div className="ch11-stage" ref={ref} />;
}

function objectiveFor(s: Ch12State, now: number): ObjectiveNote | null {
  if (s.beat === 'hide') {
    if (s.round === 2) {
      if (canRun(s, now)) return HIDE_OBJECTIVE.lured;
      if (atBlock(s, now)) return blockedFor(s, now) >= BLOCK_HINT_MS ? HIDE_OBJECTIVE.blockHint : HIDE_OBJECTIVE.block;
    }
    return HIDE_OBJECTIVE.round1;
  }
  if (s.beat === 'outside') {
    if (s.station < STATIONS - 1) return OUTSIDE_OBJECTIVE[s.station];
    return now - s.stationAt >= STATION_WAIT_MS ? OUTSIDE_STEPS_OBJECTIVE : OUTSIDE_OBJECTIVE[STATIONS - 1];
  }
  const o = OBJECTIVE[s.beat];
  return o && o.goal ? o : null;
}

/** The note in the corner, as in Chapter 0 and 1.1: where Theo is, what he is wondering, what to do. */
function Objective({ s, now }: { s: Ch12State; now: number }) {
  const o = objectiveFor(s, now);
  if (!o) return null;
  const key = `${s.beat}-${o.goal}`;
  const since = useRef({ key, at: now });
  if (since.current.key !== key) since.current = { key, at: now };
  const fresh = now - since.current.at < 4_500;
  return (
    <div className={`objective ch11-objective ${fresh ? 'fresh' : ''}`} key={key}>
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

/** Hold Space or the button: `onChange(true)` while held. */
function useHold(onChange: (holding: boolean) => void) {
  useEffect(() => {
    const down = (e: KeyboardEvent) => e.code === 'Space' && !e.repeat && onChange(true);
    const up = (e: KeyboardEvent) => e.code === 'Space' && onChange(false);
    const blur = () => onChange(false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    document.addEventListener('visibilitychange', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
      document.removeEventListener('visibilitychange', blur);
      onChange(false);
    };
  }, [onChange]);
}

function BreathButton({ s, now }: { s: Ch12State; now: number }) {
  const dispatch = useCh12((st) => st.dispatch);
  const hold = (holding: boolean) => dispatch({ type: 'breath', holding });
  useHold(hold);
  const holding = s.holdingSince !== null;
  const left = holding ? Math.max(0, 1 - (now - s.holdingSince!) / BREATH_MS) : 1;
  return (
    <div className={`ch11-breath ${isNear(s, now) ? 'urgent' : ''} ${holding ? 'holding' : ''}`}>
      <button onPointerDown={() => hold(true)} onPointerUp={() => hold(false)} onPointerLeave={() => holding && hold(false)}>
        {PROMPT.hold}
      </button>
      <div className="ch11-lungs">
        <i style={{ width: `${left * 100}%` }} />
      </div>
      <small>{PROMPT.holdKey}</small>
    </div>
  );
}

function DoorButton({ s, now }: { s: Ch12State; now: number }) {
  const dispatch = useCh12((st) => st.dispatch);
  const hold = (holding: boolean) => dispatch({ type: 'closeDoor', holding });
  useHold(hold);
  const done = s.closing !== null ? Math.min(1, (now - s.closing) / DOOR_HOLD_MS) : 0;
  return (
    <div className={`ch11-breath ch12-door ${s.closing !== null ? 'holding' : ''}`} style={{ opacity: 1 }}>
      <button onPointerDown={() => hold(true)} onPointerUp={() => hold(false)} onPointerLeave={() => s.closing !== null && hold(false)}>
        {PROMPT.door}
      </button>
      <div className="ch11-lungs">
        <i style={{ width: `${done * 100}%` }} />
      </div>
      <small>{PROMPT.doorKey}</small>
    </div>
  );
}

function Struggle({ s }: { s: Ch12State }) {
  const dispatch = useCh12((st) => st.dispatch);
  useEffect(() => {
    const down = (e: KeyboardEvent) => (e.code === 'Space' || e.code === 'Enter') && !e.repeat && dispatch({ type: 'struggle' });
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, [dispatch]);
  return (
    <button className="ch11-say ch12-struggle" onClick={() => dispatch({ type: 'struggle' })}>
      {PROMPT.struggle}
      <span className="ch12-pips">
        {[0, 1, 2].map((i) => (
          <i key={i} className={i < s.struggles ? 'on' : ''} />
        ))}
      </span>
    </button>
  );
}

function Play() {
  const s = useCh12((st) => st.s);
  const dispatch = useCh12((st) => st.dispatch);
  const now = useNow(true);
  const t = now - s.beatAt;
  useSoundDriver(s, true);

  useEffect(() => {
    if (s.beat === 'end') markFinished('1.2');
  }, [s.beat]);

  const narration = NARRATION[s.beat] ?? [];
  const showNarration = s.beat !== 'title' && s.beat !== 'caught' && s.beat !== 'sleep' && s.beat !== 'glass' && s.beat !== 'outside';
  const sleepLines = s.hideSpot ? [...(NARRATION.sleep ?? []), REWARD[s.hideSpot]] : (NARRATION.sleep ?? []);
  const wakeReady = s.beat === 'wake' && t >= WAKE_MIN_MS;

  return (
    <div className={`ch11-frame ch12-frame beat-${s.beat}`}>
      <Objective s={s} now={now} />
      <div className="ch11-text">
        {s.beat === 'title' && <p className="ch12-title-card" style={{ animationDuration: `${AUTO_MS.title}ms` }}>{TITLE}</p>}
        {showNarration && <Lines lines={narration} since={t} fade={s.beat === 'tumble' ? 3_000 : s.beat === 'catch' ? 6_000 : undefined} />}
        {s.beat === 'sleep' && <Lines lines={sleepLines} since={t} every={1_900} />}
        {s.beat === 'caught' && <Lines lines={s.lostCrayon ? [...CAUGHT, CAUGHT_LOST] : CAUGHT} since={t - 1_200} every={1_600} />}
        {s.beat === 'outside' && (
          <Lines
            lines={s.station === STATIONS - 1 && now - s.stationAt >= STATION_WAIT_MS - 1_500 ? [...OUTSIDE[s.station], OUTSIDE_STEPS] : OUTSIDE[s.station]}
            since={now - s.stationAt}
          />
        )}
        {s.beat === 'glass' && <Lines lines={NARRATION.glass!} since={t} every={3_400} />}
      </div>

      {s.beat === 'carried' && <Struggle s={s} />}
      {s.beat === 'yard' && t > 2_000 && (
        <button className="ch11-say" onClick={() => dispatch({ type: 'enterGarage' })}>
          {PROMPT.enter}
        </button>
      )}
      {s.beat === 'choose' && (
        <div className="ch11-choices">
          {(['tent', 'buggy'] as const).map((spot) => (
            <button key={spot} onClick={() => dispatch({ type: 'hide', spot })}>
              {HIDE_LABEL[spot]}
            </button>
          ))}
        </div>
      )}
      {s.beat === 'hide' && <BreathButton s={s} now={now} />}
      {s.beat === 'door' && <DoorButton s={s} now={now} />}
      {wakeReady && (
        <button className="ch11-say" onClick={() => dispatch({ type: 'crawl' })}>
          {PROMPT.crawl}
        </button>
      )}
      {s.beat === 'end' && (
        <div className="ch11-end">
          <h1>{END.title}</h1>
          <p>{END.teaser}</p>
          <button onClick={() => useCh12.getState().start()}>{END.replay}</button>
        </div>
      )}
    </div>
  );
}

function Title() {
  const start = useCh12((st) => st.start);
  return (
    <div className="ch11-title">
      <p className="ch11-kicker">STATIC</p>
      <h1>Chương 1.2</h1>
      <p className="ch11-sub">Bên kia</p>
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

export default function Chapter12() {
  const started = useCh12((st) => st.started);
  return (
    <div className="ch11 ch12">
      <PanoHost />
      <div className="ch11-vignette" />
      <FilmGrain />
      {started ? <Play /> : <Title />}
    </div>
  );
}
