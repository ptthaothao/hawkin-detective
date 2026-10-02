import { BlurFilter, Container, Graphics } from 'pixi.js';
import { AUTO_MS } from '../machine';
import { Dark, H, Layer, W, beam, clamp01, ease, glow, type Frame, type SceneNode } from './common';

function hallway(): Graphics {
  const g = new Graphics();
  g.rect(-200, -200, W + 400, H + 400).fill(0x120d09);
  // walls converging to the far end
  g.poly([-200, -200, 640, 300, 640, 640, -200, H + 200]).fill(0x24190f);
  g.poly([W + 200, -200, 960, 300, 960, 640, W + 200, H + 200]).fill(0x1e150d);
  g.rect(640, 300, 320, 340).fill(0x0a0806);
  // door frames passing by
  [[-60, 120, 220], [1500, 100, 260]].forEach(([x, y, h]) => g.rect(x, y, 140, h * 3).stroke({ width: 10, color: 0x3a2a1a }));
  g.rect(760, 360, 80, 140).fill(0x26364a);
  return g;
}

function backDoor(): Graphics {
  const g = new Graphics();
  g.rect(-200, -200, W + 400, H + 400).fill(0x15100b);
  g.rect(560, 120, 480, 700).fill(0x6a5640);
  // open: fog outside
  g.rect(580, 140, 440, 680).fill(0x5a6670);
  g.rect(580, 560, 440, 260).fill({ color: 0x7a8690, alpha: 0.6 });
  return g;
}

function yard(): Graphics {
  const g = new Graphics();
  g.rect(-200, -200, W + 400, H + 400).fill(0x4a5660);
  g.rect(-200, 600, W + 400, 500).fill(0x2a3028);
  // the old garage across the yard, and a bare tree
  g.poly([980, 600, 980, 380, 1170, 300, 1360, 380, 1360, 600]).fill(0x1a1c1c);
  g.rect(1060, 450, 200, 150).fill(0x101212);
  g.moveTo(300, 620).lineTo(320, 260).stroke({ width: 22, color: 0x15181a });
  g.moveTo(316, 360).lineTo(200, 240).moveTo(320, 320).lineTo(430, 200).stroke({ width: 8, color: 0x15181a });
  // fog banks
  g.rect(-200, 500, W + 400, 220).fill({ color: 0x9aa6b0, alpha: 0.25 });
  return g;
}

function garageDoors(): Graphics {
  const g = new Graphics();
  g.rect(-200, -200, W + 400, H + 400).fill(0x0c0b0a);
  g.rect(400, 80, 380, 760).fill(0x2a2016);
  g.rect(820, 80, 380, 760).fill(0x2a2016);
  for (let x = 410; x < 1200; x += 46) g.rect(x, 80, 4, 760).fill(0x1a120b);
  g.rect(780, 80, 40, 760).fill({ color: 0x6a7680, alpha: 0.5 });
  return g;
}

/** Glimpses through half-open eyes, hanging over its shoulder. */
export class CarriedScene implements SceneNode {
  root = new Container();
  private frames = [hallway(), backDoor(), yard(), garageDoors()];
  private lids = new Graphics();
  private holder = new Container();
  private blur = new BlurFilter({ strength: 6 });

  constructor() {
    this.frames.forEach((g) => this.holder.addChild(g));
    this.holder.pivot.set(W / 2, H / 2);
    this.holder.position.set(W / 2, H / 2);
    this.root.addChild(this.holder, this.lids);
  }

  update(f: Frame) {
    const total = AUTO_MS.carried!;
    const k = clamp01(f.t / total);
    const n = this.frames.length;
    const idx = Math.min(n - 1, Math.floor(k * n));
    const local = (k * n) % 1;
    this.frames.forEach((g, i) => (g.visible = i === idx));
    // Upside down-ish and swinging with its walk.
    this.holder.rotation = Math.PI * 0.12 + Math.sin(f.now / 520) * 0.06;
    this.holder.scale.set(1.15 + Math.sin(f.now / 520) * 0.02);
    this.holder.filters = f.low ? null : [this.blur];
    // Eyelids: open in the middle of each glimpse, closed between.
    const open = Math.sin(local * Math.PI) * 0.75;
    const gap = (H / 2) * open;
    this.lids.clear();
    this.lids.rect(-100, -100, W + 200, H / 2 - gap + 100).fill(0x000000);
    this.lids.rect(-100, H / 2 + gap, W + 200, H / 2 - gap + 100).fill(0x000000);
  }
}

/** The old garage, 1920. He wakes on the floor; the flashlight is still in his pocket. */
export class GarageScene implements SceneNode {
  root = new Container();
  private back = new Layer(0.3);
  private mid = new Layer(0.7);
  private dark = new Dark();
  private beam = beam([[1176, 120], [1244, 120], [1000, 900], [680, 900]], 'rgba(140,165,200,0.22)', 20);
  private lids = new Graphics();

  constructor() {
    const g = new Graphics();
    g.rect(-100, -100, W + 200, 760).fill(0x2a2016);
    for (let x = -100; x < W + 100; x += 52) g.rect(x, -100, 4, 760).fill(0x1a120b);
    g.rect(-100, 640, W + 200, 400).fill(0x1c1610);
    // a small high window, moonlight through dust
    g.rect(1170, 110, 80, 60).fill(0x2a3a50);
    g.moveTo(1210, 110).lineTo(1210, 170).moveTo(1170, 140).lineTo(1250, 140).stroke({ width: 4, color: 0x2a2016 });
    // the doors, a thin line of fog light between them
    g.rect(40, 180, 360, 470).fill(0x241a10);
    g.rect(214, 180, 8, 470).fill({ color: 0x6a7680, alpha: 0.5 });
    // workbench
    g.rect(1240, 470, 340, 24).fill(0x4a3420).rect(1260, 494, 20, 150).fill(0x3a2818).rect(1540, 494, 20, 150).fill(0x3a2818);
    g.rect(1300, 430, 40, 40).fill(0x5a4a2a); // oil can
    this.back.addChild(g);
    // a 1920 motor car under a sheet, spoked wheels showing
    const car = new Graphics();
    car.poly([520, 620, 560, 420, 760, 380, 980, 400, 1060, 520, 1100, 620]).fill(0x6a645a);
    car.poly([560, 420, 760, 380, 980, 400, 960, 430, 760, 410, 580, 450]).fill({ color: 0x8a8478, alpha: 0.5 });
    [[620, 640], [1000, 640]].forEach(([x, y]) => {
      car.circle(x, y, 56).fill(0x14100c).circle(x, y, 44).stroke({ width: 3, color: 0x3a3228 });
      for (let a = 0; a < 12; a++) car.moveTo(x, y).lineTo(x + Math.cos(a / 1.9) * 44, y + Math.sin(a / 1.9) * 44).stroke({ width: 2, color: 0x3a3228 });
    });
    this.mid.addChild(car);
    this.dark.glows.addChild(this.beam, glow(0x8aa0c0, 1210, 140, 260, 0.25));
    this.root.addChild(this.back, this.mid, this.dark, this.lids);
  }

  update(f: Frame) {
    for (const l of [this.back, this.mid]) l.drift(f, 0.6);
    // Waking: eyes open slowly, blink once.
    const k = ease(f.t / 2600);
    const blink = f.t > 2600 && f.t < 2800 ? 0.4 : 0;
    const gap = (H / 2) * (k - blink);
    this.lids.clear();
    if (gap < H / 2) {
      this.lids.rect(-100, -100, W + 200, H / 2 - gap + 100).fill(0x000000);
      this.lids.rect(-100, H / 2 + gap, W + 200, H / 2 - gap + 100).fill(0x000000);
    }
    // He finds the flashlight in his pocket after a moment.
    const torch = f.t > 4200;
    this.dark.set(0.9, torch ? { x: f.px, y: f.py } : null);
  }
}
