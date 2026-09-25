import { useEffect, useRef } from 'react';
import type { World } from '../../game/types';
import { prefersReducedMotion } from '../useNow';

interface Mote {
  x: number;
  y: number;
  r: number;
  a: number;
  vx: number;
  vy: number;
  phase: number;
}

const COUNT: Record<World, number> = { normal: 46, other: 80 };

function spawn(w: number, h: number, world: World): Mote {
  const other = world === 'other';
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    r: other ? 0.6 + Math.random() * 2.2 : 0.5 + Math.random() * 1.4,
    a: other ? 0.15 + Math.random() * 0.45 : 0.08 + Math.random() * 0.3,
    vx: (Math.random() - 0.5) * (other ? 0.08 : 0.12),
    vy: other ? -0.05 - Math.random() * 0.12 : (Math.random() - 0.4) * 0.06,
    phase: Math.random() * Math.PI * 2,
  };
}

/** Dust in the lamp light on this side; drifting spores on the other. Sits under the flashlight
 *  mask, so on the other side only motes inside the beam are visible. */
export function Particles({ world }: { world: World }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || prefersReducedMotion()) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);
    const motes = Array.from({ length: COUNT[world] }, () => spawn(w, h, world));
    const color = world === 'other' ? '206, 222, 214' : '255, 226, 170';
    let raf = 0;
    let last = performance.now();
    const tick = (t: number) => {
      const dt = Math.min(50, t - last);
      last = t;
      ctx.clearRect(0, 0, w, h);
      for (const m of motes) {
        m.phase += dt * 0.0006;
        m.x += (m.vx + Math.sin(m.phase) * 0.04) * dt * 0.1;
        m.y += m.vy * dt * 0.1;
        if (m.y < -10) m.y = h + 10;
        if (m.y > h + 10) m.y = -10;
        if (m.x < -10) m.x = w + 10;
        if (m.x > w + 10) m.x = -10;
        const twinkle = 0.6 + 0.4 * Math.sin(m.phase * 3);
        ctx.beginPath();
        ctx.fillStyle = `rgba(${color}, ${m.a * twinkle})`;
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [world]);

  return <canvas ref={ref} className="particles" aria-hidden />;
}

/** Slow-drifting haze on the other side. */
export function Fog() {
  return (
    <div className="fog" aria-hidden>
      <div className="fog-layer a" />
      <div className="fog-layer b" />
    </div>
  );
}

/** Film grain + vignette over everything in the viewport (screens included). */
export function FilmGrain() {
  return <div className="film-grain" aria-hidden />;
}
