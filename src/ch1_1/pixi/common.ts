import { Container, Graphics, Sprite } from 'pixi.js';
import type { Ch11State } from '../machine';
import { TORCH_SPAN, lights, softBeam } from './textures';

export const W = 1600;
export const H = 900;

/**
 * Where the room camera is looking, in design units, so the DOM hotspots can follow it.
 * A design point p lands on screen at p * scale + (x, y).
 */
export const cameraView = { x: 0, y: 0, scale: 1 };

export interface Frame {
  s: Ch11State;
  now: number;
  /** ms since the current beat started */
  t: number;
  /** pointer in design space */
  px: number;
  py: number;
  low: boolean;
}

export interface SceneNode {
  root: Container;
  update(f: Frame): void;
}

/** A layer that drifts with the pointer: depth 0 stays put, 1 moves the most. */
export class Layer extends Container {
  constructor(public depth: number) {
    super();
  }
  drift(f: Frame, sway = 1) {
    const nx = f.px / W - 0.5;
    const ny = f.py / H - 0.5;
    // Breathing: a slow rise and fall, stronger for near layers.
    const breathe = Math.sin(f.now / 900) * 3 * sway;
    this.x = -nx * 14 * this.depth;
    this.y = -ny * 8 * this.depth + breathe * this.depth;
  }
}

/** Darkness over a scene, with an optional flashlight hole and additive lights on top. */
export class Dark extends Container {
  private flat = new Graphics().rect(-200, -200, W + 400, H + 400).fill(0x000000);
  private hole = new Sprite(lights().torchHole);
  private warm = new Sprite(lights().glow);
  readonly glows = new Container();

  constructor() {
    super();
    this.hole.anchor.set(0.5);
    this.hole.width = this.hole.height = TORCH_SPAN;
    this.warm.anchor.set(0.5);
    this.warm.width = this.warm.height = 520;
    this.warm.tint = 0xffd9a0;
    this.warm.blendMode = 'add';
    this.glows.blendMode = 'add';
    this.addChild(this.flat, this.hole, this.warm, this.glows);
  }

  /** `ambient`: how dark the room is (0..1). `torch`: where the beam points, or null when off. */
  set(ambient: number, torch: { x: number; y: number; flicker?: number } | null) {
    this.flat.visible = !torch;
    this.flat.alpha = ambient;
    this.hole.visible = this.warm.visible = !!torch;
    if (torch) {
      this.hole.position.set(torch.x, torch.y);
      this.hole.alpha = ambient;
      this.warm.position.set(torch.x, torch.y);
      this.warm.alpha = 0.16 * (torch.flicker ?? 1);
    }
  }
}

/** A tinted soft light. */
export function glow(tint: number, x: number, y: number, size: number, alpha: number): Sprite {
  const g = new Sprite(lights().glow);
  g.anchor.set(0.5);
  g.tint = tint;
  g.position.set(x, y);
  g.width = g.height = size;
  g.alpha = alpha;
  return g;
}

/** Deterministic flicker for candles and dying batteries. */
export const flicker = (now: number, seed = 0) =>
  0.82 + 0.1 * Math.sin(now / 83 + seed) + 0.08 * Math.sin(now / 37 + seed * 3);

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const ease = (v: number) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};

/** A blurred, fading light shape as an additive sprite placed in design space. */
export function beam(points: [number, number][], color: string, blur?: number): Sprite {
  const b = softBeam(points, color, blur);
  const s = new Sprite(b.texture);
  s.position.set(b.x, b.y);
  s.scale.set(2);
  return s;
}
