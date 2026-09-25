import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { useStore } from '../store';
import type { HotspotId } from '../game/types';
import { NORMAL_HOTSPOTS, OTHER_HOTSPOTS, type HotspotDef, type Rect } from './layout';
import { NormalRoom, OtherRoom } from './RoomArt';
import { prefersReducedMotion, useNow } from './useNow';

/** Flashlight radius as a fraction of scene width. */
const LIGHT_R = 0.13;
const FLICKER_MS = 2_000;
const DARK_BEFORE_THEO_MS = 2_500;

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

export function Scene() {
  const game = useStore((s) => s.game);
  const showHotspots = useStore((s) => s.ui.showHotspots);
  const dispatch = useStore((s) => s.dispatch);
  const setUi = useStore((s) => s.setUi);
  const sceneRef = useRef<HTMLDivElement>(null);
  const light = useRef({ x: 0.5, y: 0.5 });
  const [flickerT, setFlickerT] = useState<number | null>(null);
  const [blackout, setBlackout] = useState(false);

  const other = game.world === 'other';
  const dark = other && game.flashlightGiven;
  const now = useNow(100, game.choice === 'A' && !game.rescued);

  // Flicker sequence → FLICKER_DONE (doc §J.1 beat 2). < 3 flashes per second.
  useEffect(() => {
    if (game.flicker !== 'pending') return;
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
  }, [game.flicker, dispatch]);

  // Short blackout when the light goes off (and when it snaps back on after the rescue).
  const fxId = game.fx?.id;
  const fxKind = game.fx?.kind;
  useEffect(() => {
    if (fxKind !== 'lightOff' && fxKind !== 'dark' && fxKind !== 'rescue') return;
    setBlackout(true);
    const id = window.setTimeout(() => setBlackout(false), fxKind === 'rescue' ? 400 : 900);
    return () => window.clearTimeout(id);
  }, [fxId, fxKind]);

  // Branch B: pitch black until Theo turns the flashlight on.
  useEffect(() => {
    if (!dark || game.theoLightSeen) return;
    const id = window.setTimeout(() => dispatch({ type: 'THEO_LIGHT' }), DARK_BEFORE_THEO_MS);
    return () => window.clearTimeout(id);
  }, [dark, game.theoLightSeen, dispatch]);

  const setLight = (e: ReactPointerEvent) => {
    const el = sceneRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    light.current = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
    el.style.setProperty('--lx', `${light.current.x * 100}%`);
    el.style.setProperty('--ly', `${light.current.y * 100}%`);
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    // Mouse: light follows the cursor. Touch: drag with a finger to move it.
    if (e.pointerType === 'mouse' || e.buttons > 0) setLight(e);
  };

  /** Doc §M: on the other side only what the flashlight shows can be inspected. */
  const isLit = (rect: Rect) => {
    const el = sceneRef.current;
    if (!el) return false;
    const { width, height } = el.getBoundingClientRect();
    const cx = light.current.x * width;
    const cy = light.current.y * height;
    const nx = Math.max((rect.x / 100) * width, Math.min(cx, ((rect.x + rect.w) / 100) * width));
    const ny = Math.max((rect.y / 100) * height, Math.min(cy, ((rect.y + rect.h) / 100) * height));
    return Math.hypot(cx - nx, cy - ny) <= LIGHT_R * width;
  };

  const locked = game.flicker === 'pending' || blackout || game.endingReady;

  const onHotspot = (h: HotspotDef) => {
    if (locked) return;
    if (h.id === 'switch') {
      dispatch({ type: 'TOGGLE_LIGHT' });
      return;
    }
    if (other && (dark || !isLit(h.rect))) return;
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

  const frame = flickerT === null ? null : flickerFrame(flickerT);
  const hotspots = (other ? OTHER_HOTSPOTS : NORMAL_HOTSPOTS).filter((h) => !h.visible || h.visible(game));

  return (
    <div
      ref={sceneRef}
      className={`scene ${other ? 'is-other' : 'is-normal'} ${showHotspots ? 'debug-hotspots' : ''}`}
      onPointerMove={onPointerMove}
      onPointerDown={(e) => e.pointerType === 'mouse' && setLight(e)}
    >
      {other ? <OtherRoom s={game} now={now} /> : <NormalRoom s={game} />}

      {other && !dark && <div className="flashlight" />}
      {dark && <div className={`darkness ${game.theoLightSeen ? 'theo-light' : ''}`} />}

      {hotspots.map((h) => (
        <button
          key={h.id}
          className={`hotspot ${h.id === 'switch' ? 'switch-spot' : ''}`}
          style={{ left: `${h.rect.x}%`, top: `${h.rect.y}%`, width: `${h.rect.w}%`, height: `${h.rect.h}%` }}
          aria-label={HOTSPOT_NAMES[h.id]}
          onClick={() => onHotspot(h)}
        />
      ))}

      {frame === 'dark' && <div className="flicker-dark" />}
      {frame === 'glimpse' && (
        <div className="flicker-glimpse">
          <OtherRoom s={game} now={now} />
        </div>
      )}
      {blackout && <div className="blackout" />}
    </div>
  );
}
