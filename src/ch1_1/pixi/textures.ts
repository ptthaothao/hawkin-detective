import { Texture } from 'pixi.js';

/** A radial gradient baked to a texture. Stops are [offset 0..1, css color]. */
export function radial(size: number, stops: [number, string][]): Texture {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(([o, col]) => g.addColorStop(o, col));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return Texture.from(c);
}

let cache: Record<string, Texture> | null = null;

/** Shared light textures, made once. */
export function lights() {
  if (cache) return cache;
  cache = {
    // The dark with a hole in it: the flashlight. Meant to be drawn very large (see TORCH_SPAN).
    torchHole: radial(512, [
      [0, 'rgba(0,0,0,0)'],
      [0.03, 'rgba(0,0,0,0.04)'],
      [0.055, 'rgba(0,0,0,0.45)'],
      [0.085, 'rgba(0,0,0,0.92)'],
      [0.14, 'rgba(0,0,0,1)'],
      [1, 'rgba(0,0,0,1)'],
    ]),
    // A soft white blob, tinted per light (torch warmth, radio amber, candle, moon).
    glow: radial(256, [
      [0, 'rgba(255,255,255,1)'],
      [0.25, 'rgba(255,255,255,0.45)'],
      [0.6, 'rgba(255,255,255,0.1)'],
      [1, 'rgba(255,255,255,0)'],
    ]),
    vignette: radial(512, [
      [0, 'rgba(0,0,0,0)'],
      [0.55, 'rgba(0,0,0,0)'],
      [0.8, 'rgba(0,0,0,0.55)'],
      [1, 'rgba(0,0,0,0.95)'],
    ]),
  };
  return cache;
}

/** Design-space width the torch-hole sprite is drawn at, so it covers the screen wherever it points. */
export const TORCH_SPAN = 6400;

/**
 * A soft-edged light shape (moonlight through a window, a beam through dust): a polygon drawn
 * with a vertical fade and blurred, baked once. Points are in the returned sprite's local space.
 */
export function softBeam(points: [number, number][], color: string, blur = 24): { texture: Texture; x: number; y: number } {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const pad = blur * 3;
  const x0 = Math.min(...xs) - pad;
  const y0 = Math.min(...ys) - pad;
  const w = Math.max(...xs) - x0 + pad;
  const h = Math.max(...ys) - y0 + pad;
  const scale = 0.5; // half resolution: it is blurry anyway
  const c = document.createElement('canvas');
  c.width = Math.ceil(w * scale);
  c.height = Math.ceil(h * scale);
  const ctx = c.getContext('2d')!;
  ctx.scale(scale, scale);
  ctx.filter = `blur(${blur * scale}px)`;
  const g = ctx.createLinearGradient(0, Math.min(...ys) - y0, 0, Math.max(...ys) - y0);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  points.forEach(([x, y], i) => (i ? ctx.lineTo(x - x0, y - y0) : ctx.moveTo(x - x0, y - y0)));
  ctx.closePath();
  ctx.fill();
  return { texture: Texture.from(c), x: x0, y: y0 };
}
