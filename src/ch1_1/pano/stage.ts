import { Application, Assets, Container, Graphics, NoiseFilter, Sprite, Texture } from 'pixi.js';
import type { Ch11State } from '../machine';
import VIEWS from './views.json';

/**
 * Chapter 1.1 in PixiJS: Theo's room as panoramas baked from the 3D set (src/ch1_1/bake).
 * Looking around slides the picture, only when the player asks for it: pointer at the screen
 * edge, the arrow keys, or a drag. Aiming at something never moves the view.
 * The flashlight is the lit bake showing through a soft round mask over the dark bake.
 */

export type SpotId = 'torch' | 'door' | 'radio' | 'wardrobe' | 'bed';
export type ViewId = keyof typeof VIEWS;

export interface SpotSpec {
  id: SpotId;
  label: string;
  /** Point it out: the player has been stuck a while. */
  hint: boolean;
}

export interface PanoInput {
  state: () => Ch11State;
  now: () => number;
  low: () => boolean;
  onFrame: () => void;
  view: (s: Ch11State) => ViewId;
  torchOn: (s: Ch11State) => boolean;
  spots: () => SpotSpec[];
  onSpot: (id: SpotId) => void;
}

type View = (typeof VIEWS)[ViewId];
type Rect = { x: number; y: number; w: number; h: number };

/** How close to the screen edge (fraction of the width) starts turning the head, and how fast. */
const EDGE = 0.14;
const TURN_SPEED = 1100;
const BLINK_MS = 420;
/** Smallest click area, in screen pixels. */
const MIN_SPOT = 110;

function beamTexture(): Texture {
  const size = 512;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  const r = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  r.addColorStop(0, 'rgba(255,255,255,1)');
  r.addColorStop(0.45, 'rgba(255,255,255,0.85)');
  r.addColorStop(0.8, 'rgba(255,255,255,0.18)');
  r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r;
  g.fillRect(0, 0, size, size);
  return Texture.from(c);
}

const url = (file: string) => `${import.meta.env.BASE_URL}ch11/${file}.webp`;

export class PanoStage {
  private app = new Application();
  private world = new Container();
  private dark = new Sprite();
  private lit = new Sprite();
  private beam = new Sprite();
  private black = new Graphics();
  private grain = new NoiseFilter({ noise: 0.08 });
  private textures = new Map<string, Texture>();
  private view: ViewId | null = null;
  private pan = 0;
  private pointer = { x: -1, y: -1, inside: false };
  private drag: { x: number; pan: number } | null = null;
  private keys = { left: false, right: false };
  private cutAt = -1e9;
  private lastFrame = 0;
  private overlay = document.createElement('div');
  private buttons = new Map<SpotId, HTMLButtonElement>();
  private arrows = { left: document.createElement('div'), right: document.createElement('div') };
  private ready = false;
  private destroyed = false;
  private input!: PanoInput;
  private el!: HTMLElement;

  async mount(el: HTMLElement, input: PanoInput) {
    this.el = el;
    this.input = input;
    await this.app.init({
      resizeTo: el,
      background: 0x000000,
      antialias: false,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
      preference: 'webgl',
    });
    const files = Object.keys(VIEWS).flatMap((id) => [id, `${id}-lit`]);
    const loaded = await Promise.all(files.map((f) => Assets.load<Texture>(url(f))));
    files.forEach((f, i) => this.textures.set(f, loaded[i]));
    if (this.destroyed) {
      this.app.destroy(true, { children: true });
      return;
    }
    this.ready = true;
    el.appendChild(this.app.canvas);

    this.beam.texture = beamTexture();
    this.beam.anchor.set(0.5);
    this.lit.mask = this.beam;
    this.world.addChild(this.dark, this.lit, this.beam);
    this.app.stage.addChild(this.world, this.black);

    this.overlay.className = 'ch11-pano-overlay';
    for (const side of ['left', 'right'] as const) {
      const a = this.arrows[side];
      a.className = `ch11-turn ${side}`;
      a.textContent = side === 'left' ? '‹' : '›';
      this.overlay.appendChild(a);
    }
    el.appendChild(this.overlay);

    const canvas = this.app.canvas;
    canvas.addEventListener('pointerdown', this.onDown);
    window.addEventListener('pointermove', this.onMove);
    window.addEventListener('pointerup', this.onUp);
    window.addEventListener('keydown', this.onKey);
    window.addEventListener('keyup', this.onKey);
    el.addEventListener('pointerleave', this.onLeave);

    this.app.ticker.add(() => this.frame());
  }

  private onDown = (e: PointerEvent) => {
    this.drag = { x: e.clientX, pan: this.pan };
  };
  private onUp = () => {
    this.drag = null;
  };
  private onLeave = () => {
    this.pointer.inside = false;
  };
  private onMove = (e: PointerEvent) => {
    const r = this.el.getBoundingClientRect();
    this.pointer.x = e.clientX - r.left;
    this.pointer.y = e.clientY - r.top;
    this.pointer.inside = this.pointer.x >= 0 && this.pointer.y >= 0 && this.pointer.x <= r.width && this.pointer.y <= r.height;
    if (this.drag) this.pan = this.drag.pan - (e.clientX - this.drag.x) / this.scale();
  };
  private onKey = (e: KeyboardEvent) => {
    const down = e.type === 'keydown';
    if (e.key === 'ArrowLeft' || e.key === 'a') this.keys.left = down;
    if (e.key === 'ArrowRight' || e.key === 'd') this.keys.right = down;
  };

  private v(): View {
    return VIEWS[this.view!];
  }

  /** Screen pixels per panorama pixel: the picture's height fills the screen. */
  private scale() {
    if (!this.view) return 1;
    const { width, height } = this.app.screen;
    return Math.max(height / this.v().height, width / this.v().width);
  }

  /** Pan so that a panorama x sits in the middle of the screen. */
  private centerOn(x: number) {
    this.pan = x - this.app.screen.width / this.scale() / 2;
  }

  private setView(id: ViewId, now: number) {
    if (id === this.view) return;
    const fromDoor = this.view === 'door-it' || id === 'door-it';
    const first = this.view === null;
    this.view = id;
    this.dark.texture = this.textures.get(id)!;
    this.lit.texture = this.textures.get(`${id}-lit`)!;
    // a different place is a blink; the same room, changed, is not
    if (first || fromDoor) {
      this.cutAt = now;
      const spots = this.v().spots as Partial<Record<SpotId, Rect>>;
      const focus = id === 'door-it' ? this.v().width / 2 : first ? 1430 : (spots.radio?.x ?? 1700);
      this.centerOn(focus);
    }
  }

  private frame() {
    if (!this.ready) return;
    const input = this.input;
    input.onFrame();
    const s = input.state();
    const now = input.now();
    const dt = Math.min(0.1, Math.max(0, (now - (this.lastFrame || now)) / 1000));
    this.lastFrame = now;
    this.setView(input.view(s), now);

    const { width, height } = this.app.screen;
    const k = this.scale();
    const v = this.v();
    const visibleW = width / k;

    // turning the head: edge of the screen, arrow keys, or a drag
    if (!this.drag) {
      let turn = 0;
      if (this.pointer.inside) {
        const fx = this.pointer.x / width;
        if (fx < EDGE) turn = -(1 - fx / EDGE);
        else if (fx > 1 - EDGE) turn = (fx - (1 - EDGE)) / EDGE;
      }
      if (this.keys.left) turn = -1;
      if (this.keys.right) turn = 1;
      this.pan += turn * Math.abs(turn) * TURN_SPEED * dt;
    }
    const maxPan = Math.max(0, v.width - visibleW);
    this.pan = Math.min(maxPan, Math.max(0, this.pan));

    // breathing: a slow rise and fall; a jolt when the radio surges
    const t = now - s.beatAt;
    const surge = s.beat === 'answer' ? Math.max(0, 1 - t / 1200) : 0;
    const breathe = Math.sin(now / (s.beat === 'shut' || s.beat === 'choose' ? 420 : 900)) * 4;
    const shake = surge * 10;
    this.world.scale.set(k * 1.02);
    this.world.position.set(
      -this.pan * k + (Math.random() - 0.5) * shake,
      (height - v.height * k * 1.02) / 2 + breathe + (Math.random() - 0.5) * shake,
    );
    // the flashlight follows the pointer, in panorama coordinates
    const on = input.torchOn(s);
    this.lit.visible = this.beam.visible = on;
    if (on) {
      const px = this.pointer.inside ? this.pointer.x : width / 2;
      const py = this.pointer.inside ? this.pointer.y : height / 2;
      const flicker = 0.9 + 0.1 * Math.sin(now / 47) * Math.sin(now / 311);
      this.beam.position.set((px - this.world.x) / this.world.scale.x, (py - this.world.y) / this.world.scale.y);
      const size = 760 * flicker;
      this.beam.width = this.beam.height = size;
      this.lit.alpha = flicker;
    }

    // blink on a cut
    const blink = 1 - Math.min(1, (now - this.cutAt) / BLINK_MS);
    this.black.clear().rect(0, 0, width, height).fill({ color: 0x000000, alpha: blink });
    this.grain.seed = Math.random();
    this.world.filters = input.low() ? null : [this.grain];

    this.placeSpots();
  }

  /** The click areas, kept over the things in the picture; a hinted one off screen gets an arrow. */
  private placeSpots() {
    const specs = this.input.spots();
    const rects = this.v().spots as Partial<Record<SpotId, Rect>>;
    const { width } = this.app.screen;
    const shown = new Set<SpotId>();
    let offLeft = false;
    let offRight = false;
    for (const spec of specs) {
      const r = rects[spec.id];
      if (!r) continue;
      let b = this.buttons.get(spec.id);
      if (!b) {
        b = document.createElement('button');
        b.className = 'ch11-hot';
        b.appendChild(document.createElement('span'));
        const id = spec.id;
        b.addEventListener('click', () => this.input.onSpot(id));
        this.overlay.appendChild(b);
        this.buttons.set(spec.id, b);
      }
      // small things (the torch) get a click area big enough to hit without aiming
      const w = Math.max(MIN_SPOT, r.w * this.world.scale.x);
      const h = Math.max(MIN_SPOT * 0.7, r.h * this.world.scale.y);
      const x = (r.x + r.w / 2) * this.world.scale.x + this.world.x - w / 2;
      const y = (r.y + r.h / 2) * this.world.scale.y + this.world.y - h / 2;
      b.style.left = `${x}px`;
      b.style.top = `${y}px`;
      b.style.width = `${w}px`;
      b.style.height = `${h}px`;
      b.classList.toggle('hint', spec.hint);
      b.firstElementChild!.textContent = spec.label;
      b.setAttribute('aria-label', spec.label);
      b.style.display = 'block';
      shown.add(spec.id);
      if (spec.hint && x + w < 0) offLeft = true;
      if (spec.hint && x > width) offRight = true;
    }
    for (const [id, b] of this.buttons) if (!shown.has(id)) b.style.display = 'none';
    this.arrows.left.classList.toggle('on', offLeft);
    this.arrows.right.classList.toggle('on', offRight);
  }

  destroy() {
    this.destroyed = true;
    window.removeEventListener('pointermove', this.onMove);
    window.removeEventListener('pointerup', this.onUp);
    window.removeEventListener('keydown', this.onKey);
    window.removeEventListener('keyup', this.onKey);
    this.el?.removeEventListener('pointerleave', this.onLeave);
    this.overlay.remove();
    if (this.ready) this.app.destroy(true, { children: true });
  }
}
