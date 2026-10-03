import { Application, Assets, Container, Graphics, NoiseFilter, Sprite, Texture } from 'pixi.js';
import { AUTO_MS, DOOR_OPENS_MS, PASS_AT_MS, PASS_STEPS, STEP_MS, type Ch11State } from '../machine';
import { ItSprite, loadIt } from './creature';
import { ease, walkAt, type Marks } from './hide';
import VIEWS from './views.json';

/**
 * Chapter 1.1 in PixiJS: every place is a panorama baked offline from a 3D set (tools/bake); there
 * is no 3D at runtime. It, the lids, the hand and the doors are 2D things placed on the pictures.
 * Looking around slides the picture, only when the player asks for it: pointer at the screen
 * edge, the arrow keys, or a drag. Aiming at something never moves the view.
 * The flashlight is the lit bake showing through a soft round mask over the dark bake.
 */

export type SpotId = 'torch' | 'door' | 'radio' | 'wardrobe' | 'bed';
export type ViewId = keyof typeof VIEWS;

interface ViewData {
  width: number;
  height: number;
  spots: Partial<Record<SpotId, { x: number; y: number; w: number; h: number }>>;
  marks?: Record<string, { x: number; y: number; s: number }>;
  doors?: { a: [number, number]; b: [number, number] };
  lit?: boolean;
  shut?: boolean;
  layers?: string[];
  focus?: number;
  lock?: [number, number];
  roll?: number;
  crack?: { x: number; y: number; w: number; h: number };
}
const DATA = VIEWS as unknown as Record<string, ViewData>;

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
  /** Which picture to show, or null for black. */
  view: (s: Ch11State, now: number) => ViewId | null;
  torchOn: (s: Ch11State, now: number) => boolean;
  spots: () => SpotSpec[];
  onSpot: (id: SpotId) => void;
}

type View = ViewData;
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

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
/** Pictures of the same place: a change between them is not a cut. */
const place = (id: string) => (id.startsWith('room-') ? 'room' : id.startsWith('carried-') ? 'carried' : id);

const url = (file: string) => `${import.meta.env.BASE_URL}ch11/${file}.webp`;

export class PanoStage {
  private app = new Application();
  private world = new Container();
  private rig = new Container();
  private dark = new Sprite();
  private shutDoor = new Sprite();
  private lit = new Sprite();
  private beam = new Sprite();
  private layers = [new Sprite(), new Sprite()];
  private it: ItSprite | null = null;
  private crackMask = new Graphics();
  private watchGlint = new Graphics();
  private hand = new Sprite();
  private lids = new Graphics();
  private grain = new NoiseFilter({ noise: 0.08 });
  private textures = new Map<string, Texture>();
  private view: string | null = null;
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
    const files = Object.entries(DATA).flatMap(([id, d]) => [
      id,
      ...(d.lit === false ? [] : [`${id}-lit`]),
      ...(d.shut ? [`${id}-shut`] : []),
      ...(d.layers ?? []).map((l) => `${id}-${l}`),
    ]);
    const [loaded, it] = await Promise.all([Promise.all(files.map((f) => Assets.load<Texture>(url(f)))), loadIt()]);
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
    this.it = new ItSprite(it);
    this.it.visible = false;
    this.it.mask = this.crackMask;
    this.hand.texture = it.hand;
    this.hand.anchor.set(0.7, 0.7);
    this.hand.visible = false;
    for (const l of this.layers) l.visible = false;
    this.shutDoor.visible = false;
    this.world.addChild(this.dark, this.shutDoor, this.lit, this.it, this.crackMask, ...this.layers, this.watchGlint, this.beam);
    this.rig.addChild(this.world);
    this.app.stage.addChild(this.rig, this.hand, this.lids);

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
    return DATA[this.view!];
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

  private setView(id: string | null, now: number) {
    if (id === this.view) return;
    const prev = this.view;
    const first = prev === null && this.lastFrame === 0;
    this.view = id;
    if (!id) {
      this.world.visible = false;
      return;
    }
    this.world.visible = true;
    const d = DATA[id];
    this.dark.texture = this.textures.get(id)!;
    this.lit.texture = this.textures.get(`${id}-lit`) ?? Texture.EMPTY;
    const shut = this.textures.get(`${id}-shut`);
    this.shutDoor.texture = shut ?? Texture.EMPTY;
    this.layers.forEach((sp, i) => {
      const name = d.layers?.[i];
      sp.texture = (name && this.textures.get(`${id}-${name}`)) || Texture.EMPTY;
    });
    const moved = prev === null || place(prev) !== place(id);
    // a different place is a blink; the same room, changed, is not
    if (first || moved) {
      this.cutAt = now;
      const spots = d.spots;
      const focus = d.focus ?? (id === 'door-it' ? d.width / 2 : first ? 1430 : (spots.radio?.x ?? 1700));
      this.centerOn(focus);
    }
  }

  private itPos = { x: 0, y: 0, s: 100 };
  private itFlip = false;

  private frame() {
    if (!this.ready) return;
    const input = this.input;
    input.onFrame();
    const s = input.state();
    const now = input.now();
    const dt = Math.min(0.1, Math.max(0, (now - (this.lastFrame || now)) / 1000));
    const t = now - s.beatAt;
    this.setView(input.view(s, now), now);
    this.lastFrame = now;
    const { width, height } = this.app.screen;
    this.grain.seed = Math.random();
    this.world.filters = input.low() ? null : [this.grain];

    if (!this.view) {
      this.hand.visible = false;
      this.drawLids(0);
      this.placeSpots();
      return;
    }
    const id = this.view;
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
    let lo = 0;
    let hi = Math.max(0, v.width - visibleW);
    // hiding: he can only turn his head a little
    if (v.lock && visibleW < v.width) {
      lo = Math.max(lo, v.lock[0] - visibleW / 2);
      hi = Math.max(lo, Math.min(hi, v.lock[1] - visibleW / 2));
    }
    this.pan = Math.min(hi, Math.max(lo, this.pan));

    // breathing: a slow rise and fall; a jolt when the radio surges
    const surge = s.beat === 'answer' ? Math.max(0, 1 - t / 1200) : 0;
    const breathe = s.holdingSince !== null ? 0 : Math.sin(now / (s.beat === 'shut' || s.beat === 'choose' || s.beat === 'hide' ? 420 : 900)) * 4;
    const shake = surge * 10 + (s.beat === 'found' ? Math.max(0, 1 - t / 900) * 14 : 0);
    this.world.scale.set(k * 1.02);
    this.world.position.set(
      -this.pan * k + (Math.random() - 0.5) * shake,
      (height - v.height * k * 1.02) / 2 + breathe + (Math.random() - 0.5) * shake,
    );

    // carried: over its shoulder, rolling and bobbing
    const carried = id.startsWith('carried-');
    this.rig.pivot.set(width / 2, height / 2);
    this.rig.position.set(width / 2, height / 2 + (carried ? Math.sin(now / 260) * 10 : 0));
    this.rig.rotation = carried ? (v.roll ?? 0.3) * 0.5 + Math.sin(now / 520) * 0.04 : 0;
    this.rig.scale.set(carried ? 1.25 : 1);

    // ---- the pictures that change within a view ----
    const open = v.shut ? (s.beat === 'hide' ? ease((t - DOOR_OPENS_MS + 1200) / 1700) : 1) : 1;
    this.shutDoor.visible = !!v.shut && open < 1;
    this.shutDoor.alpha = 1 - open;
    const burst = id === 'hide-wardrobe' && s.beat === 'found' ? ease(t / 300) : 0;
    this.layers.forEach((sp, i) => {
      sp.visible = !!v.layers?.[i];
      sp.x = 0;
      sp.alpha = 1;
    });
    if (burst && v.doors) {
      this.layers[0].x = -(v.doors.a[1] - v.doors.a[0]) * 0.9 * burst;
      this.layers[1].x = (v.doors.b[1] - v.doors.b[0]) * 0.9 * burst;
      this.layers.forEach((sp) => (sp.alpha = 1 - burst * 0.6));
    }

    // ---- it ----
    this.placeIt(id, v, s, t, now, dt);

    // ---- the flashlight: the lit picture shows through a round hole that follows the pointer ----
    const on = input.torchOn(s, now) && v.lit !== false;
    this.lit.visible = this.beam.visible = on;
    if (on) {
      const px = this.pointer.inside ? this.pointer.x : width / 2;
      const py = this.pointer.inside ? this.pointer.y : height / 2;
      const flicker = 0.9 + 0.1 * Math.sin(now / 47) * Math.sin(now / 311);
      const at = this.world.toLocal({ x: px, y: py }, this.app.stage);
      this.beam.position.set(at.x, at.y);
      this.beam.width = this.beam.height = 760 * flicker;
      this.lit.alpha = flicker;
    }

    // ---- its hand, coming for the camera ----
    this.hand.visible = s.beat === 'found';
    if (this.hand.visible) {
      const hk = ease((t - (id === 'hide-bed' ? 500 : 250)) / 900);
      this.hand.width = this.hand.height = height * lerp(0.55, 1.05, hk);
      this.hand.position.set(width * lerp(1.0, 0.62, hk), height * lerp(0.6, 0.85, hk));
      this.hand.rotation = lerp(0.6, 0.15, hk) * (id === 'hide-bed' ? -1 : 1);
    }

    // ---- the lids: eyes opening, closing, blinking on a cut ----
    let lid = clamp01((now - this.cutAt) / BLINK_MS);
    if (carried) {
      const n = 5;
      const frac = (clamp01(t / AUTO_MS.carried!) * n) % 1;
      lid = Math.sin(frac * Math.PI) * 0.55;
    } else if (s.beat === 'awake' || s.beat === 'end') {
      lid = Math.min(lid, ease(t / 2600) - (t > 2600 && t < 2800 ? 0.4 : 0));
    }
    if (s.beat === 'found' && t > AUTO_MS.found! - 700) lid = Math.min(lid, 1 - ease((t - AUTO_MS.found! + 700) / 700));
    this.drawLids(lid);

    this.placeSpots();
  }

  private drawLids(open: number) {
    const { width, height } = this.app.screen;
    const half = (1 - clamp01(open)) * height * 0.5;
    this.lids.clear();
    if (half <= 0) return;
    this.lids.rect(0, 0, width, half + 1).rect(0, height - half - 1, width, half + 1).fill({ color: 0x000000 });
  }

  /** It, and the watch under the bed: placed on the baked marks. */
  private placeIt(id: string, v: ViewData, s: Ch11State, t: number, now: number, dt: number) {
    const it = this.it!;
    it.visible = false;
    this.watchGlint.clear();
    it.mask = null;
    const marks = v.marks;
    if (!marks) return;
    const spot = s.hideSpot;
    if (id.startsWith('hide-') && spot && ['hide', 'mmm', 'found'].includes(s.beat)) {
      const m = marks as unknown as Marks;
      const hiding = s.beat === 'hide';
      const wk = hiding ? walkAt(t, m) : { visible: true, pos: m.spot, stride: 0, arrived: true, dir: this.itFlip ? (-1 as const) : (1 as const) };
      if (!wk.visible) return;
      if (hiding) {
        Object.assign(this.itPos, wk.pos);
        this.itFlip = wk.dir < 0;
      } else {
        // when it hears him it comes back to the hiding place from wherever it was
        const a = 1 - Math.exp(-dt * 6);
        this.itPos.x = lerp(this.itPos.x, wk.pos.x, a);
        this.itPos.y = lerp(this.itPos.y, wk.pos.y, a);
        this.itPos.s = lerp(this.itPos.s, wk.pos.s, a);
      }
      const lean = s.beat === 'mmm' ? ease(t / 1500) * 0.6 : s.beat === 'found' && spot === 'wardrobe' ? 1 : 0;
      const crouch = spot === 'bed' && s.beat !== 'hide' ? (s.beat === 'found' ? 1 : ease((t - 1800) / 1600)) : 0;
      it.visible = true;
      it.pose({
        ...this.itPos,
        flip: this.itFlip,
        stride: wk.arrived ? 0 : wk.stride,
        sway: wk.arrived ? Math.sin(now / 1600) : 0,
        lean,
        crouch,
        head: marks.head,
      });
      if (id === 'hide-bed' && s.beat === 'found' && t > 2400 && marks.watch) {
        const w = marks.watch;
        const r = w.s * 0.045;
        this.watchGlint.circle(w.x, w.y, r).stroke({ width: r * 0.3, color: 0x9a8a62, alpha: 0.9 }).circle(w.x, w.y, r * 0.75).fill({ color: 0x1a1812, alpha: 0.9 });
      }
      return;
    }
    // in the garage it walks past outside, seen only through the crack between the doors
    if (id === 'garage' && v.crack && (s.beat === 'awake' || s.beat === 'end')) {
      const k = (t - PASS_AT_MS) / (PASS_STEPS * STEP_MS);
      if (k <= 0 || k >= 1) return;
      const i = Math.min(7.999, k * 8);
      const a = marks[`pass${Math.floor(i)}`];
      const b = marks[`pass${Math.floor(i) + 1}`];
      const f = i % 1;
      const c = v.crack;
      this.crackMask.clear().rect(c.x, c.y, c.w, c.h).fill({ color: 0xffffff, alpha: 0 });
      it.mask = this.crackMask;
      it.visible = true;
      it.pose({ x: lerp(a.x, b.x, f), y: lerp(a.y, b.y, f), s: lerp(a.s, b.s, f), flip: true, stride: (((t - PASS_AT_MS) / STEP_MS) % 1 + 1) % 1 });
    }
  }

  /** The click areas, kept over the things in the picture; a hinted one off screen gets an arrow. */
  private placeSpots() {
    if (!this.view) {
      for (const b of this.buttons.values()) b.style.display = 'none';
      return;
    }
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
