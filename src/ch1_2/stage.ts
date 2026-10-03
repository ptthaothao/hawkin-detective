import { Application, Assets, Container, Graphics, NoiseFilter, Sprite, Texture } from 'pixi.js';
import VIEWS from '../ch1_1/pano/views.json';
import { ItSprite, loadIt } from '../ch1_1/pano/creature';
import { BLOCK_HINT_MS, STEP_MS, blockedFor, type Ch12State, type HideSpot } from './machine';
import { SCENE_H, SCENE_W, drawScene, type DrawnScene } from './scenes';
import { ease, walkAt, type Marks } from './walk';

/**
 * Chapter 1.2 in PixiJS, built the way 1.1's stage is (pictures that slide under the head turn, a
 * flashlight that is the lit picture showing through a soft round hole) but self-contained: the
 * baked garage and hallway pictures are 1.1's, the rest are drawn placeholders (see scenes.ts).
 * While he hides, the picture is seen through a hole: the tent's doorway or the buggy's window.
 */

export type SceneId = 'black' | 'garage' | 'carried-0' | 'carried-1' | 'carried-2' | 'carried-3' | 'carried-4' | DrawnScene;
export type SpotId = 'tent' | 'buggy' | 'cans' | 'wall' | 'door' | 'garage' | 'onward' | 'home' | 'crawl';

export interface SpotSpec {
  id: SpotId;
  label: string;
  /** Point it out: the player has been stuck a while. */
  hint: boolean;
}

export interface StageInput {
  state: () => Ch12State;
  now: () => number;
  low: () => boolean;
  onFrame: () => void;
  scene: (s: Ch12State, now: number) => SceneId;
  torchOn: (s: Ch12State, now: number) => boolean;
  spots: () => SpotSpec[];
  onSpot: (id: SpotId) => void;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
interface PanoData {
  width: number;
  height: number;
  focus?: number;
  roll?: number;
}
const DATA = VIEWS as unknown as Record<string, PanoData>;
const PANO: SceneId[] = ['garage', 'carried-0', 'carried-1', 'carried-2', 'carried-3', 'carried-4'];
const DRAWN: DrawnScene[] = ['yard', 'out0', 'out1', 'out2', 'glass', 'cloth'];

/** Where the click areas are, in each picture's own pixels. */
const SPOT_RECTS: Partial<Record<SceneId, Partial<Record<SpotId, Rect>>>> = {
  garage: {
    tent: { x: 940, y: 380, w: 620, h: 420 },
    buggy: { x: 0, y: 150, w: 540, h: 620 },
    cans: { x: 1640, y: 790, w: 280, h: 200 },
    wall: { x: 1500, y: 330, w: 330, h: 420 },
    door: { x: 640, y: 230, w: 300, h: 380 },
  },
  yard: { garage: { x: 1000, y: 430, w: 640, h: 300 } },
  out0: { onward: { x: 1100, y: 300, w: 700, h: 600 } },
  out1: { onward: { x: 1100, y: 300, w: 700, h: 600 } },
  out2: { home: { x: 0, y: 300, w: 800, h: 600 } },
  cloth: { crawl: { x: 860, y: 200, w: 300, h: 700 } },
};

/** Where it stands in the garage picture for each stop, as seen from each hiding place. */
const START = { x: 560, y: 700, s: 150 };
const FAR = {
  mid: { x: 1450, y: 810, s: 250 },
  block: { x: 800, y: 690, s: 130 },
  cans: { x: 1780, y: 900, s: 260 },
  exit: START,
  enter: START,
};
export const MARKS: Record<HideSpot, Marks> = {
  tent: { ...FAR, buggy: { x: 330, y: 860, s: 320 }, tent: { x: 960, y: 1075, s: 560 } },
  buggy: { ...FAR, tent: { x: 1130, y: 830, s: 300 }, buggy: { x: 330, y: 1075, s: 560 } },
};

const EDGE = 0.14;
const TURN_SPEED = 1100;
const BLINK_MS = 420;
const MIN_SPOT = 110;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

function softTexture(size: number, stops: [number, string][]): Texture {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  const r = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [at, color] of stops) r.addColorStop(at, color);
  g.fillStyle = r;
  g.fillRect(0, 0, size, size);
  return Texture.from(c);
}

const url = (file: string) => `${import.meta.env.BASE_URL}ch11/${file}.webp`;
const sizeOf = (id: SceneId) => (id === 'black' ? { width: SCENE_W, height: SCENE_H } : id in DATA ? DATA[id] : { width: SCENE_W, height: SCENE_H });

export class Stage12 {
  private app = new Application();
  private world = new Container();
  private rig = new Container();
  private dark = new Sprite();
  private lit = new Sprite();
  private beam = new Sprite();
  private cans = new Graphics();
  private fog: Sprite[] = [];
  private it: ItSprite | null = null;
  private hand = new Sprite();
  private peep = new Graphics();
  private peepRim = new Graphics();
  private tint = new Graphics();
  private lids = new Graphics();
  private grain = new NoiseFilter({ noise: 0.08 });
  private textures = new Map<string, { dark: Texture; lit: Texture | null }>();
  private scene: SceneId | null = null;
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
  private input!: StageInput;
  private el!: HTMLElement;
  private itPos = { x: 0, y: 0, s: 100 };
  private itFlip = false;

  async mount(el: HTMLElement, input: StageInput) {
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
    const files = PANO.flatMap((id) => (id === 'garage' ? [id, `${id}-lit`] : [id]));
    const [loaded, it] = await Promise.all([Promise.all(files.map((f) => Assets.load<Texture>(url(f)))), loadIt()]);
    if (this.destroyed) {
      this.app.destroy(true, { children: true });
      return;
    }
    const byFile = new Map(files.map((f, i) => [f, loaded[i]]));
    for (const id of PANO) this.textures.set(id, { dark: byFile.get(id)!, lit: byFile.get(`${id}-lit`) ?? null });
    for (const id of DRAWN) {
      const { dark, lit } = drawScene(id);
      this.textures.set(id, { dark: Texture.from(dark), lit: Texture.from(lit) });
    }
    this.ready = true;
    el.appendChild(this.app.canvas);

    this.beam.texture = softTexture(512, [
      [0, 'rgba(255,255,255,1)'],
      [0.45, 'rgba(255,255,255,0.85)'],
      [0.8, 'rgba(255,255,255,0.18)'],
      [1, 'rgba(255,255,255,0)'],
    ]);
    this.beam.anchor.set(0.5);
    this.lit.mask = this.beam;
    this.drawCans();
    const fogTex = softTexture(256, [
      [0, 'rgba(150,170,190,0.5)'],
      [1, 'rgba(150,170,190,0)'],
    ]);
    for (let i = 0; i < 6; i++) {
      const f = new Sprite(fogTex);
      f.anchor.set(0.5);
      this.fog.push(f);
    }
    this.it = new ItSprite(it);
    this.it.visible = false;
    this.hand.texture = it.hand;
    this.hand.anchor.set(0.7, 0.7);
    this.hand.visible = false;
    this.world.addChild(this.dark, this.cans, ...this.fog, this.lit, this.it, this.beam);
    this.rig.addChild(this.world);
    this.app.stage.addChild(this.rig, this.peep, this.peepRim, this.tint, this.hand, this.lids);

    this.overlay.className = 'ch11-pano-overlay';
    for (const side of ['left', 'right'] as const) {
      const a = this.arrows[side];
      a.className = `ch11-turn ${side}`;
      a.textContent = side === 'left' ? '‹' : '›';
      this.overlay.appendChild(a);
    }
    el.appendChild(this.overlay);

    this.app.canvas.addEventListener('pointerdown', this.onDown);
    window.addEventListener('pointermove', this.onMove);
    window.addEventListener('pointerup', this.onUp);
    window.addEventListener('keydown', this.onKey);
    window.addEventListener('keyup', this.onKey);
    el.addEventListener('pointerleave', this.onLeave);
    this.app.ticker.add(() => this.frame());
  }

  /** The pile of cans in the far corner: placed on the garage picture, dim, with a rim of moonlight. */
  private drawCans() {
    const g = this.cans;
    const cans: [number, number, number][] = [
      [1740, 925, 1],
      [1815, 930, 1.05],
      [1782, 880, 0.95],
      [1850, 905, 0.9],
      [1700, 905, 0.85],
    ];
    for (const [x, y, k] of cans) {
      const w = 54 * k;
      const h = 74 * k;
      g.ellipse(x, y, w / 2 + 3, 10 * k).fill({ color: 0x08090b, alpha: 0.8 });
      g.rect(x - w / 2, y - h, w, h).fill({ color: 0x4a4f55 });
      g.rect(x - w / 2, y - h, w * 0.22, h).fill({ color: 0x8e98a4, alpha: 0.55 });
      g.ellipse(x, y - h, w / 2, 9 * k).fill({ color: 0x6d737a });
      g.ellipse(x, y - h, w / 2 - 6, 5 * k).fill({ color: 0x23272b });
    }
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

  /** Screen pixels per picture pixel: the picture's height fills the screen. */
  private scale() {
    if (!this.scene) return 1;
    const { width, height } = this.app.screen;
    const d = sizeOf(this.scene);
    return Math.max(height / d.height, width / d.width);
  }

  private setScene(id: SceneId, now: number) {
    if (id === this.scene) return;
    const prev = this.scene;
    const first = prev === null && this.lastFrame === 0;
    this.scene = id;
    if (id === 'black') {
      this.world.visible = false;
      return;
    }
    this.world.visible = true;
    const tex = this.textures.get(id)!;
    this.dark.texture = tex.dark;
    this.lit.texture = tex.lit ?? Texture.EMPTY;
    const moved = prev === null || (prev.startsWith('carried-') ? 'carried' : prev) !== (id.startsWith('carried-') ? 'carried' : id);
    if (first || moved) {
      this.cutAt = now;
      const d = sizeOf(id);
      this.pan = (('focus' in d && d.focus) || d.width / 2) - this.app.screen.width / this.scale() / 2;
    }
  }

  private frame() {
    if (!this.ready) return;
    const input = this.input;
    input.onFrame();
    const s = input.state();
    const now = input.now();
    const dt = Math.min(0.1, Math.max(0, (now - (this.lastFrame || now)) / 1000));
    const t = now - s.beatAt;
    this.setScene(input.scene(s, now), now);
    this.lastFrame = now;
    const { width, height } = this.app.screen;
    this.grain.seed = Math.random();
    this.world.filters = input.low() ? null : [this.grain];

    if (!this.scene || this.scene === 'black') {
      this.hand.visible = false;
      this.peep.clear();
      this.peepRim.clear();
      this.tint.clear();
      this.drawLids(0);
      this.placeSpots();
      return;
    }
    const id = this.scene;
    const d = sizeOf(id);
    const k = this.scale();
    const visibleW = width / k;
    const hiding = s.hideSpot !== null && (s.beat === 'hide' || s.beat === 'caught' || s.beat === 'sleep');

    // turning the head: edge of the screen, arrow keys, or a drag. Hiding, he only looks straight ahead.
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
    const range = Math.max(0, d.width - visibleW);
    this.pan = hiding ? range / 2 : Math.min(range, Math.max(0, this.pan));

    const carried = id.startsWith('carried-');
    const bob = (carried ? 1 + s.struggles * 0.7 : 1) * 4;
    const breathe = s.holdingSince !== null ? 0 : Math.sin(now / (hiding || s.beat === 'catch' ? 420 : 900)) * bob;
    const shake = s.beat === 'caught' ? Math.max(0, 1 - t / 900) * 14 : carried ? s.struggles * 2 : 0;
    this.world.scale.set(k * 1.02);
    this.world.position.set(-this.pan * k + (Math.random() - 0.5) * shake, (height - d.height * k * 1.02) / 2 + breathe + (Math.random() - 0.5) * shake);
    this.rig.pivot.set(width / 2, height / 2);
    this.rig.position.set(width / 2, height / 2 + (carried ? Math.sin(now / 260) * 10 : 0));
    this.rig.rotation = carried ? (('roll' in d && d.roll) || 0.3) * 0.5 + Math.sin(now / 520) * (0.04 + s.struggles * 0.03) : 0;
    this.rig.scale.set(carried ? 1.25 : 1);

    // cans are part of the garage; fog drifts over everything outdoors
    this.cans.visible = id === 'garage';
    this.cans.alpha = id === 'garage' && s.round === 2 && blockedFor(s, now) >= BLOCK_HINT_MS ? 0.75 + 0.25 * Math.sin(now / 260) : 0.8;
    const foggy = (id === 'yard' || id.startsWith('out') || id === 'glass') && !input.low();
    this.fog.forEach((f, i) => {
      f.visible = foggy;
      if (!foggy) return;
      const phase = now / (9000 + i * 1700) + i * 1.9;
      f.x = ((i * 520 + Math.sin(phase) * 260 + now * 0.012 * (i % 2 ? 1 : -1)) % (d.width + 600)) - 200;
      f.y = d.height * (0.58 + (i % 3) * 0.1);
      f.width = f.height = 760 + i * 70;
      f.alpha = 0.16 + 0.05 * Math.sin(phase * 1.7);
    });

    this.placeIt(id, s, t, now, dt);

    // the flashlight: the lit picture shows through a round hole that follows the pointer
    const on = input.torchOn(s, now) && !!this.textures.get(id)?.lit;
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

    this.placeHole(s.beat === 'hide' || s.beat === 'caught' || s.beat === 'sleep' ? s.hideSpot : null);

    // its hand, coming for the camera
    this.hand.visible = s.beat === 'caught' && t < 3_300;
    if (this.hand.visible) {
      const hk = ease((t - 350) / 900);
      this.hand.width = this.hand.height = height * lerp(0.55, 1.05, hk);
      this.hand.position.set(width * lerp(1.0, 0.62, hk), height * lerp(0.6, 0.85, hk));
      this.hand.rotation = lerp(0.6, 0.15, hk);
    }

    // the lids: eyes opening, closing, blinking on a cut
    let lid = clamp01((now - this.cutAt) / BLINK_MS);
    if (carried) lid = Math.sin(((t % 2400) / 2400) * Math.PI) * 0.55 + 0.15;
    else if (s.beat === 'sleep') lid = Math.min(lid, 1 - ease(t / 4_200));
    else if (s.beat === 'wake') lid = Math.min(lid, ease(t / 2_600) - (t > 2_600 && t < 2_800 ? 0.4 : 0));
    else if (s.beat === 'caught') lid = Math.min(lid, 1 - ease((t - 2_000) / 1_500));
    this.drawLids(lid);

    this.placeSpots();
  }

  /** The hole he sees through: the tent's doorway, or the buggy's little window with its brown, clouded pane. */
  private placeHole(spot: HideSpot | null) {
    const { width: w, height: h } = this.app.screen;
    this.peep.clear();
    this.peepRim.clear();
    this.tint.clear();
    if (!spot) return;
    this.peep.rect(0, 0, w, h).fill({ color: 0x000000 });
    if (spot === 'tent') {
      const cx = w / 2;
      const cy = h * 0.56;
      const rx = w * 0.3;
      const ry = h * 0.36;
      this.peep.ellipse(cx, cy, rx, ry).cut();
      this.peepRim.ellipse(cx, cy, rx, ry).stroke({ width: Math.max(18, h * 0.04), color: 0x14110b, alpha: 0.85 });
      // old shirts hang over the doorway, left and right
      this.peepRim.rect(cx - rx - 20, cy - ry, 26, ry * 1.6).fill({ color: 0x1c1913, alpha: 0.9 });
      this.peepRim.rect(cx + rx - 6, cy - ry * 0.9, 30, ry * 1.5).fill({ color: 0x1c1913, alpha: 0.9 });
    } else {
      const ww = w * 0.34;
      const hh = h * 0.3;
      const x = w / 2 - ww / 2;
      const y = h * 0.34;
      this.peep.roundRect(x, y, ww, hh, 10).cut();
      this.peepRim.roundRect(x, y, ww, hh, 10).stroke({ width: Math.max(10, h * 0.018), color: 0x1d1610, alpha: 1 });
      this.peepRim.moveTo(x + ww / 3, y).lineTo(x + ww / 3, y + hh).stroke({ width: 3, color: 0x120d09, alpha: 0.8 });
      this.tint.roundRect(x, y, ww, hh, 10).fill({ color: 0x4a3418, alpha: 0.2 });
    }
  }

  private drawLids(open: number) {
    const { width, height } = this.app.screen;
    const half = (1 - clamp01(open)) * height * 0.5;
    this.lids.clear();
    if (half <= 0) return;
    this.lids.rect(0, 0, width, half + 1).rect(0, height - half - 1, width, half + 1).fill({ color: 0x000000 });
  }

  /** It: walks the garage from his hiding place's point of view, or stands in the yard seen through the glass. */
  private placeIt(id: SceneId, s: Ch12State, t: number, now: number, dt: number) {
    const it = this.it!;
    it.visible = false;
    if (id === 'garage' && s.hideSpot && (s.beat === 'hide' || s.beat === 'caught' || s.beat === 'sleep')) {
      const spot = s.hideSpot;
      const marks = MARKS[spot];
      if (s.beat === 'hide') {
        const rt = now - s.routeAt;
        const w = walkAt(s.route, rt, marks, s.routeFrom);
        if (!w.visible) return;
        Object.assign(this.itPos, w.pos);
        this.itFlip = w.dir < 0;
        const here = w.stop === spot && w.arrived;
        const kneel = w.stop === 'tent' && spot === 'buggy' && w.arrived;
        it.visible = true;
        it.pose({
          ...this.itPos,
          flip: this.itFlip,
          stride: w.arrived ? 0 : w.stride,
          sway: w.arrived ? Math.sin(now / 1600) : 0,
          lean: here ? 1 : 0,
          crouch: kneel ? ease((rt - 0) / 1500) : 0,
          head: kneel ? { x: marks.tent.x - 40, y: marks.tent.y + 20, s: marks.tent.s * 0.9 } : undefined,
        });
        return;
      }
      if (s.beat === 'caught') {
        const m = marks[spot];
        const a = 1 - Math.exp(-dt * 6);
        this.itPos.x = lerp(this.itPos.x, m.x, a);
        this.itPos.y = lerp(this.itPos.y, m.y, a);
        this.itPos.s = lerp(this.itPos.s, m.s, a);
        it.visible = true;
        it.pose({ ...this.itPos, flip: this.itFlip, lean: 1, sway: Math.sin(now / 1200) });
      }
      return;
    }
    if (id === 'glass' && s.beat === 'glass') {
      const away = ease((t - 5_200) / 4_800);
      const x = lerp(1180, 1560, away);
      const y = lerp(770, 690, away);
      const sc = lerp(170, 105, away);
      it.visible = true;
      it.pose({
        x,
        y,
        s: sc,
        flip: away > 0 ? true : false,
        stride: away > 0 && away < 1 ? (((t - 5_200) / STEP_MS) % 1 + 1) % 1 : 0,
        sway: Math.sin(now / 1800),
        alpha: (1 - away * 0.9) * clamp01(t / 1_800),
      });
    }
  }

  /** The click areas, kept over the things in the picture; a hinted one off screen gets an arrow. */
  private placeSpots() {
    if (!this.scene || this.scene === 'black') {
      for (const b of this.buttons.values()) b.style.display = 'none';
      return;
    }
    const specs = this.input.spots();
    const rects = SPOT_RECTS[this.scene] ?? {};
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
        const sid = spec.id;
        b.addEventListener('click', () => this.input.onSpot(sid));
        this.overlay.appendChild(b);
        this.buttons.set(spec.id, b);
      }
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
    for (const [sid, b] of this.buttons) if (!shown.has(sid)) b.style.display = 'none';
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
