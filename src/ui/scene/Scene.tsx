import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { audio } from '../../audio/audio';
import { VERBS } from '../../game/content';
import { currentStep } from '../../game/selectors';
import type { HotspotId } from '../../game/types';
import type { VisualState } from '../../presentation/visual';
import { useStore } from '../../store';
import { NORMAL_HOTSPOTS, OTHER_HOTSPOTS, SWITCH_RECT, type HotspotDef, type Rect } from '../layout';
import { prefersReducedMotion } from '../useNow';
import { Fog, Particles } from './Atmosphere';
import { useAutoQuality } from '../quality';
import { Room } from './Room';
import { useRandomEvent } from './useRandomEvent';

/** Flashlight radius as a fraction of scene width. Gameplay: only what this circle touches is inspectable. */
const LIGHT_R = 0.13;
const FLICKER_MS = 2_000;
const DARK_BEFORE_THEO_MS = 2_500;
/** Leaning in to an object before its close-up opens (doc §12: approach → touch → it reacts). */
const APPROACH_MS = 440;
/** A shorter reach: flicking the switch, touching something on the desk. */
const REACH_MS = 200;
/** Close-ups the player leans into; everything else is a reach. */
const CLOSE_UPS = new Set(['radio', 'watch', 'os-clock', 'rug']);
/** When the new mark is carved, after the room settles (matches `.carved .fresh`). */
const SCRATCH_AT_MS = 2_350;

const HOTSPOT_NAMES: Record<string, string> = {
  switch: 'Công tắc đèn',
  'wall-clock': 'Đồng hồ treo tường',
  poster: 'Poster',
  rug: 'Tấm thảm',
  radio: 'Radio',
  flyer: 'Tờ tìm người',
  watch: 'Đồng hồ đeo tay',
  mic: 'Micro',
  'desk-edge': 'Mép bàn',
  'door-normal': 'Cửa phòng',
  'os-clock': 'Đồng hồ',
  'os-wall': 'Bức tường',
  'os-floor': 'Sàn nhà',
  'os-desk': 'Bàn radio',
  'os-door': 'Cửa phòng',
};

/** Glimpse window inside the flicker sequence (second flicker). */
function flickerFrame(t: number): 'lit' | 'dark' | 'glimpse' {
  if (t < 300) return 'dark';
  if (t < 600) return 'lit';
  if (t < 1000) return 'glimpse';
  if (t < 1300) return 'lit';
  if (t < 1600) return 'dark';
  return 'lit';
}

const pct = (r: Rect) => ({ left: `${r.x}%`, top: `${r.y}%`, width: `${r.w}%`, height: `${r.h}%` });

/** 0 when the pointer is far from `rect`, 1 on it. `aim` is in scene fractions. */
function nearness(aim: { x: number; y: number }, rect: Rect) {
  const cx = (rect.x + rect.w / 2) / 100;
  const cy = (rect.y + rect.h / 2) / 100;
  const d = Math.hypot(((aim.x - cx) * 16) / 9, aim.y - cy);
  return Math.max(0, Math.min(1, 1 - d / 0.42));
}

/** Beam follows the pointer with a little lag and a hand-held sway that grows with dread. */
function useFlashlight(stageRef: React.RefObject<HTMLDivElement | null>, active: boolean, dread: number) {
  const target = useRef({ x: 0, y: 0 });
  const shown = useRef({ x: 0, y: 0 });
  const dreadRef = useRef(dread);
  dreadRef.current = dread;

  useEffect(() => {
    const el = stageRef.current;
    if (!el || !active) return;
    const reduced = prefersReducedMotion();
    if (!target.current.x && !target.current.y) {
      target.current = { x: el.clientWidth / 2, y: el.clientHeight / 2 };
    }
    shown.current = { ...target.current };
    // The beam is a fixed gradient twice the stage's size, moved with a transform: repainting a
    // full-screen gradient every frame is what made the other side stutter on weak machines.
    const light = el.querySelector<HTMLElement>('.flashlight');
    let raf = 0;
    const tick = (t: number) => {
      const k = reduced ? 1 : 0.22;
      shown.current.x += (target.current.x - shown.current.x) * k;
      shown.current.y += (target.current.y - shown.current.y) * k;
      const sway = reduced ? 0 : 1.5 + dreadRef.current * 5;
      const sx = Math.sin(t / 530) * sway + Math.sin(t / 170) * sway * 0.3;
      const sy = Math.cos(t / 610) * sway;
      const x = shown.current.x + sx - el.clientWidth;
      const y = shown.current.y + sy - el.clientHeight;
      if (light) light.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [stageRef, active]);

  return target;
}

export function Scene({ v }: { v: VisualState }) {
  useAutoQuality(true);
  const game = useStore((s) => s.game);
  const showHotspots = useStore((s) => s.ui.showHotspots);
  const transition = useStore((s) => s.ui.transition);
  const sceneLocked = useStore((s) => s.ui.sceneLocked);
  const leaning = useStore((s) => s.ui.panel !== null);
  const dispatch = useStore((s) => s.dispatch);
  const setUi = useStore((s) => s.setUi);
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  /** Pointer in scene fractions: what the flashlight is actually pointing at (for isLit). */
  const aim = useRef({ x: 0.5, y: 0.5 });
  const [flickerT, setFlickerT] = useState<number | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [approach, setApproach] = useState<{ id: string; reach: boolean } | null>(null);
  const approachTimer = useRef(0);
  const radioNear = useRef(-1);
  const surge = useStore((s) => s.ui.surge !== null);
  const voiceOn = useStore((s) => s.ui.subtitle !== null);

  const other = v.world === 'other';
  const beam = useFlashlight(stageRef, v.lighting === 'flashlight', v.dread);
  useEffect(() => () => window.clearTimeout(approachTimer.current), []);

  // Something in the house answers the signal (doc §23): only once Theo has been heard, never shown.
  const hunted = game.contactMade && !game.rescued && !game.theoLightSeen && !game.endingReady;
  const presence = useRandomEvent(hunted && !leaning && !sceneLocked, 24_000, 46_000, 2_800, 16_000);
  useEffect(() => {
    if (!presence) return;
    // Radio louder → the lamp sags → a board creaks somewhere → a scrape → a shadow passes the door.
    if (!other && game.radio.on) audio.surge(800, 0.16);
    const creak = window.setTimeout(() => audio.cue('creak'), 900);
    const scrape = window.setTimeout(() => audio.cue('scratch'), 1_700);
    return () => {
      window.clearTimeout(creak);
      window.clearTimeout(scrape);
    };
    // Plays once per event; the radio state at that moment is enough.
  }, [presence]);

  // Rain outside, and now and then lightning (this side only; the other side has no weather).
  const lightning = useRandomEvent(!other && !game.rescued, 30_000, 70_000, 1_300, 12_000);
  const flash = lightning !== null && !voiceOn;
  useEffect(() => {
    if (!flash) return;
    const id = window.setTimeout(() => audio.cue('thunder'), 1_100 + Math.random() * 1_400);
    return () => window.clearTimeout(id);
  }, [flash]);

  // Each time this side goes dark, Theo carves another mark. Once the player knows the marks, they hear it.
  const knowsMarks = useRef(false);
  knowsMarks.current = game.clues.includes('C5');
  useEffect(() => {
    if (!other || !knowsMarks.current || game.flashlightGiven) return;
    const id = window.setTimeout(() => audio.cue('scratch'), SCRATCH_AT_MS);
    return () => window.clearTimeout(id);
  }, [other, game.lightOffCount, game.flashlightGiven]);

  // The static only comes up to meet the hand on this side.
  useEffect(() => {
    if (other) {
      radioNear.current = 0;
      audio.radioNear(0);
    }
  }, [other]);

  // Flicker sequence → FLICKER_DONE (doc §J.1 beat 2). < 3 flashes per second.
  // Held until the player is looking at the room, or the glimpse would play behind a close-up.
  useEffect(() => {
    if (game.flicker !== 'pending' || leaning) return;
    const reduced = prefersReducedMotion();
    const start = performance.now();
    let raf = 0;
    const tick = () => {
      const t = performance.now() - start;
      setFlickerT(reduced ? (t > 700 && t < 1300 ? 700 : 400) : t);
      if (t < FLICKER_MS) raf = requestAnimationFrame(tick);
      else {
        setFlickerT(null);
        dispatch({ type: 'FLICKER_DONE' });
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [game.flicker, leaning, dispatch]);

  // Branch B: pitch black until Theo turns the flashlight on.
  useEffect(() => {
    if (v.lighting !== 'dark') return;
    const id = window.setTimeout(() => dispatch({ type: 'THEO_LIGHT' }), DARK_BEFORE_THEO_MS);
    return () => window.clearTimeout(id);
  }, [v.lighting, dispatch]);

  // Beam radius tracks the scene size.
  useEffect(() => {
    const stage = stageRef.current;
    const frame = frameRef.current;
    if (!stage || !frame) return;
    const sync = () => {
      const f = frame.getBoundingClientRect();
      const s = stage.getBoundingClientRect();
      stage.style.setProperty('--lr', `${LIGHT_R * f.width}px`);
      stage.style.setProperty('--fx', `${f.left - s.left}px`);
      stage.style.setProperty('--fy', `${f.top - s.top}px`);
      stage.style.setProperty('--fw', `${f.width}px`);
      stage.style.setProperty('--fh', `${f.height}px`);
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(stage);
    return () => ro.disconnect();
  }, []);

  const hotspots = (other ? OTHER_HOTSPOTS : NORMAL_HOTSPOTS).filter((h) => !h.visible || h.visible(game));
  // The object the current step is about glows softly; the glow grows as the hand comes near.
  const target = currentStep(game).target;
  const beckon = hotspots.some((h) => h.id === target) ? target : null;

  const track = (e: ReactPointerEvent) => {
    const stage = stageRef.current;
    const frame = frameRef.current;
    if (!stage || !frame || leaning) return;
    const s = stage.getBoundingClientRect();
    const f = frame.getBoundingClientRect();
    aim.current = { x: (e.clientX - f.left) / f.width, y: (e.clientY - f.top) / f.height };
    beam.current = { x: e.clientX - s.left, y: e.clientY - s.top };
    stage.style.setProperty('--cx', `${e.clientX - s.left}px`);
    stage.style.setProperty('--cy', `${e.clientY - s.top}px`);
    // Head follows the hand a little: the room shifts against the pointer.
    stage.style.setProperty('--par-x', `${(aim.current.x - 0.5) * 2}`);
    stage.style.setProperty('--par-y', `${(aim.current.y - 0.5) * 2}`);
    // NEARBY: the object you are meant to look at brightens as the hand gets close.
    const targetDef = hotspots.find((h) => h.id === beckon);
    stage.style.setProperty('--near', targetDef ? nearness(aim.current, targetDef.rect).toFixed(2) : '0');
    if (!other) {
      const radioDef = hotspots.find((h) => h.id === 'radio');
      const k = radioDef ? Math.round(nearness(aim.current, radioDef.rect) * 10) / 10 : 0;
      if (k !== radioNear.current) {
        radioNear.current = k;
        audio.radioNear(k);
      }
    }
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    // Mouse: light follows the cursor. Touch: drag with a finger to move it.
    if (e.pointerType === 'mouse' || e.buttons > 0) track(e);
  };

  /** Doc §M: on the other side only what the flashlight shows can be inspected. */
  const isLit = (rect: Rect) => {
    const frame = frameRef.current;
    if (!frame) return false;
    const { width, height } = frame.getBoundingClientRect();
    const cx = aim.current.x * width;
    const cy = aim.current.y * height;
    const nx = Math.max((rect.x / 100) * width, Math.min(cx, ((rect.x + rect.w) / 100) * width));
    const ny = Math.max((rect.y / 100) * height, Math.min(cy, ((rect.y + rect.h) / 100) * height));
    return Math.hypot(cx - nx, cy - ny) <= LIGHT_R * width;
  };

  const locked = game.flicker === 'pending' || sceneLocked || game.endingReady;
  const canSee = (h: HotspotDef) => h.id === 'switch' || !other || (v.lighting === 'flashlight' && isLit(h.rect));

  /** Lean toward the object (the camera moves in on it), then act. */
  const lean = (h: HotspotDef, reach: boolean, then: () => void) => {
    const stage = stageRef.current;
    const frame = frameRef.current;
    if (!stage || !frame || prefersReducedMotion()) {
      then();
      return;
    }
    const s = stage.getBoundingClientRect();
    const f = frame.getBoundingClientRect();
    stage.style.setProperty('--look-x', `${f.left - s.left + ((h.rect.x + h.rect.w / 2) / 100) * f.width}px`);
    stage.style.setProperty('--look-y', `${f.top - s.top + ((h.rect.y + h.rect.h / 2) / 100) * f.height}px`);
    setApproach({ id: h.id, reach });
    approachTimer.current = window.setTimeout(
      () => {
        setApproach(null);
        then();
      },
      reach ? REACH_MS : APPROACH_MS,
    );
  };

  const act = (h: HotspotDef) => {
    if (h.id === 'switch') {
      dispatch({ type: 'TOGGLE_LIGHT' });
      return;
    }
    const id = h.id as HotspotId;
    dispatch({ type: 'INSPECT', id });
    if (id === 'radio') setUi({ panel: 'radio' });
    else if (id === 'watch') setUi({ panel: 'inspect', inspect: 'watch' });
    else if (id === 'os-clock') setUi({ panel: 'inspect', inspect: 'os-clock' });
    else if (id === 'rug') {
      if (game.diaryFound) setUi({ panel: 'floor' });
      else setUi({ panel: 'inspect', inspect: 'diary', diaryPage: 0 });
    }
  };

  const onHotspot = (h: HotspotDef) => {
    if (locked || approach) return;
    if (!canSee(h)) return;
    const closeUp = CLOSE_UPS.has(h.id);
    // Kneeling on old floorboards.
    if (h.id === 'rug') audio.cue('creak');
    lean(h, !closeUp, () => act(h));
  };

  const frame = flickerT === null ? null : flickerFrame(flickerT);
  const uneasy = !other && v.dread > 0;

  // [E] or Enter acts on whatever the pointer rests on.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'e' && e.key !== 'E') return;
      const h = hover && !leaning ? hotspots.find((x) => x.id === hover) : null;
      if (h) onHotspot(h);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const verb = (id: string) => {
    if (id === 'switch') return other ? 'Bật đèn' : 'Tắt đèn';
    if (id === 'rug' && game.diaryFound) return 'Xem hốc sàn';
    return VERBS[id] ?? null;
  };
  // What the hand would do: shown while pointing at something, and while reaching for it (touch too).
  let promptFor: string | null = null;
  if (approach) promptFor = approach.id;
  else if (hover && !locked) promptFor = hover;
  const prompt = promptFor ? verb(promptFor) : null;

  return (
    <div
      ref={stageRef}
      className={[
        'stage',
        other ? 'is-other' : 'is-normal',
        leaning ? 'leaning' : '',
        approach ? (approach.reach ? 'approaching reach' : 'approaching') : '',
        surge || (presence && !other) ? 'drawn' : '',
        presence ? 'presence' : '',
        showHotspots ? 'debug-hotspots' : '',
        hover && !locked ? 'hovering' : '',
        (approach?.id ?? hover) === target ? 'on-target' : '',
      ].join(' ')}
      onPointerMove={onPointerMove}
      onPointerDown={track}
    >
      <div ref={frameRef} className="scene-frame">
        <Room s={game} v={v} live surge={surge || (presence !== null && !other)} presence={presence !== null} />
        {!other && <div className={`lamp-light ${uneasy ? 'uneasy' : ''}`} aria-hidden />}
        {!other && flash && <div key={lightning} className="lightning" aria-hidden />}
        {frame === 'glimpse' && (
          <div className="flicker-glimpse">
            <Room s={game} v={v} world="other" glimpse />
          </div>
        )}
        {other && <div className="switch-glow" style={pct(SWITCH_RECT)} aria-hidden />}
        {other && v.lighting !== 'dark' && <div className="door-glow" aria-hidden />}
        {transition?.kind === 'lightOff' && <div key={transition.id} className="afterglow" aria-hidden />}
        {hotspots.map((h) => (
          <button
            key={h.id}
            className={`hotspot ${h.id === 'switch' ? 'switch-spot' : ''} ${h.id === beckon ? 'beckon' : ''}`}
            style={pct(h.rect)}
            aria-label={HOTSPOT_NAMES[h.id]}
            onClick={() => onHotspot(h)}
            onPointerEnter={() => setHover(canSee(h) ? h.id : null)}
            onPointerLeave={() => setHover(null)}
          />
        ))}
      </div>

      <Particles key={v.world} world={v.world} />
      {other && <Fog />}
      {v.lighting === 'flashlight' && <div className="flashlight" aria-hidden />}
      {(v.lighting === 'dark' || v.lighting === 'theo-light') && (
        <div className={`darkness ${v.lighting === 'theo-light' ? 'theo-light' : ''}`} aria-hidden />
      )}
      {frame === 'dark' && <div className="flicker-dark" aria-hidden />}
      {transition && <div key={transition.id} className={`veil veil-${transition.kind}`} aria-hidden />}
      <div className="cursor-ring" aria-hidden />
      {prompt && (
        <span className="verb-prompt" aria-hidden>
          <kbd>E</kbd>
          {prompt}
        </span>
      )}
    </div>
  );
}
