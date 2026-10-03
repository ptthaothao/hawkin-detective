import { Container, Rectangle, Sprite, Texture } from 'pixi.js';

/**
 * It, as sprites: the black drawing (public/ch11/it-body.svg) with its eyes on a separate layer
 * that glows. Placed at a spot in a baked picture, scaled by that spot's pixels-per-metre.
 */

/** The drawing's frame (SVG units): 882 units from the top of its head to its feet; 2.25 m tall. */
const FRAME = { w: 480, h: 940 };
const UNIT = 2.25 / 882;
/** Where its feet are in the frame, from the top (fraction). */
const FEET = (1062 - 160) / 940;
/** The head, as a crop of the frame, for when it lays its head on the floor. */
const HEAD = { x0: 0.25, x1: 0.79, y0: 0.01, y1: 0.33 };
const TEX = { w: 512, h: 1003 };

const url = (file: string) => `${import.meta.env.BASE_URL}ch11/${file}`;

function raster(file: string, w: number, h: number): Promise<Texture> {
  return new Promise((resolve) => {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const img = new Image();
    const done = () => resolve(Texture.from(c));
    img.onload = () => {
      c.getContext('2d')!.drawImage(img, 0, 0, w, h);
      done();
    };
    img.onerror = done;
    img.src = url(file);
  });
}

export interface ItTextures {
  body: Texture;
  eyes: Texture;
  hand: Texture;
  headBody: Texture;
  headEyes: Texture;
}

export async function loadIt(): Promise<ItTextures> {
  const [body, eyes, hand] = await Promise.all([raster('it-body.svg', TEX.w, TEX.h), raster('it-eyes.svg', TEX.w, TEX.h), raster('it-hand.svg', 512, 512)]);
  const crop = (t: Texture) =>
    new Texture({ source: t.source, frame: new Rectangle(HEAD.x0 * TEX.w, HEAD.y0 * TEX.h, (HEAD.x1 - HEAD.x0) * TEX.w, (HEAD.y1 - HEAD.y0) * TEX.h) });
  return { body, eyes, hand, headBody: crop(body), headEyes: crop(eyes) };
}

export interface ItPose {
  x: number;
  y: number;
  /** Pixels per metre where it stands. */
  s: number;
  flip?: boolean;
  /** 0..1 through a footstep: bobs and sways. */
  stride?: number;
  /** Slow sway while it stands, -1..1. */
  sway?: number;
  /** Leans toward the viewer, 0..1. */
  lean?: number;
  /** 0..1: the body gives way to just its head, laid on the floor at (headX, headY, headS). */
  crouch?: number;
  head?: { x: number; y: number; s: number };
  alpha?: number;
}

const pair = (body: Texture, eyes: Texture) => {
  const b = new Sprite(body);
  const e = new Sprite(eyes);
  e.blendMode = 'add';
  return [b, e] as const;
};

export class ItSprite extends Container {
  private full: Container = new Container();
  private head: Container = new Container();
  private parts: Sprite[];
  private headParts: Sprite[];

  constructor(tex: ItTextures) {
    super();
    const [b, e] = pair(tex.body, tex.eyes);
    const [hb, he] = pair(tex.headBody, tex.headEyes);
    for (const p of [b, e]) p.anchor.set(0.5, FEET);
    for (const p of [hb, he]) p.anchor.set(0.5, 0.85);
    this.parts = [b, e];
    this.headParts = [hb, he];
    this.full.addChild(b, e);
    this.head.addChild(hb, he);
    this.addChild(this.full, this.head);
  }

  pose(p: ItPose) {
    const stride = p.stride ?? 0;
    const lean = p.lean ?? 0;
    const crouch = p.crouch ?? 0;
    const bob = Math.abs(Math.sin(stride * Math.PI)) * 0.05 * p.s;
    const k = 1 + lean * 0.12;
    const w = FRAME.w * UNIT * p.s * k;
    const h = FRAME.h * UNIT * p.s * k;
    for (const part of this.parts) {
      part.width = w;
      part.height = h;
    }
    this.full.position.set(p.x, p.y - bob + lean * 0.7 * p.s);
    this.full.scale.x = p.flip ? -1 : 1;
    this.full.rotation = (stride ? Math.sin(stride * Math.PI * 2) * 0.03 : (p.sway ?? 0) * 0.015) + lean * 0.05;
    this.full.alpha = (1 - crouch) * (p.alpha ?? 1);
    this.full.visible = this.full.alpha > 0.01;
    const hd = p.head ?? { x: p.x, y: p.y, s: p.s };
    const hs = hd.s * UNIT;
    for (const part of this.headParts) {
      part.width = (HEAD.x1 - HEAD.x0) * FRAME.w * hs;
      part.height = (HEAD.y1 - HEAD.y0) * FRAME.h * hs;
    }
    this.head.position.set(hd.x, hd.y);
    this.head.alpha = crouch * (p.alpha ?? 1);
    this.head.visible = crouch > 0.01;
  }
}
