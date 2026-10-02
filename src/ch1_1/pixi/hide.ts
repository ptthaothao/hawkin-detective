import { BlurFilter, Container, Graphics } from 'pixi.js';
import { DOOR_OPENS_MS, NEAR_AT_MS, STEP_MS } from '../machine';
import { Creature, Hand } from './creature';
import { Dark, H, Layer, W, clamp01, ease, flicker, glow, type Frame, type SceneNode } from './common';

/** The room as it is now: slid into 1920, lit by a candle sconce where the light switch was. */
function room1920(floorY: number): Graphics {
  const g = new Graphics();
  g.rect(-100, -100, W + 200, floorY + 100).fill(0x3a2a1c);
  // old striped wallpaper
  for (let x = -100; x < W + 100; x += 60) g.rect(x, -100, 22, floorY + 100).fill({ color: 0x3a2a1a, alpha: 0.6 });
  g.rect(-100, floorY - 40, W + 200, 40).fill(0x1c140c);
  g.rect(-100, floorY, W + 200, H - floorY + 100).fill(0x1a120a);
  for (let i = -20; i < 40; i++) g.moveTo(800 + i * 60, floorY).lineTo(800 + i * 200, H + 100).stroke({ width: 2, color: 0x120c07 });
  // the sconce
  g.rect(1290, floorY - 330, 18, 60).fill(0x6a5228);
  g.rect(1295, floorY - 350, 8, 22).fill(0xe8dcc0);
  return g;
}

/** Where it stands over the visit: walks in from the door, stops at the hiding place. */
function walk(t: number) {
  const since = t - DOOR_OPENS_MS;
  const walkMs = NEAR_AT_MS - DOOR_OPENS_MS;
  const k = clamp01(since / walkMs);
  // It moves in steps, not a glide: each step eases, then a pause.
  const steps = walkMs / STEP_MS;
  const stepK = (Math.floor(k * steps) + ease((k * steps) % 1)) / steps;
  return { k: since < 0 ? -1 : Math.min(1, stepK), stride: ((since / STEP_MS) % 1 + 1) % 1, arrived: k >= 1 };
}

/** Seen through the louvres of the wardrobe door. */
export class WardrobeScene implements SceneNode {
  root = new Container();
  private back = new Layer(0.3);
  private slats = new Layer(1.1);
  private it = new Creature(0.3);
  private hand = new Hand();
  private dark = new Dark();
  private candle = glow(0xffa040, 1300, 290, 700, 0.55);
  /** Candlelight on the far wall, so whatever stands in front of it is a silhouette. */
  private wash = glow(0xff9a50, 900, 420, 1500, 0.22);
  private dof = new BlurFilter({ strength: 5 });
  private leftDoor = new Container();
  private rightDoor = new Container();

  constructor() {
    this.back.addChild(room1920(640), this.it, this.hand);
    this.hand.visible = false;
    const slatDoor = (x0: number) => {
      const g = new Graphics();
      g.rect(x0, -60, 820, H + 120).fill({ color: 0x000000, alpha: 0 });
      // a solid frame around, louvres in the middle
      g.rect(x0, -60, 820, 130).fill(0x0e0906);
      g.rect(x0, H - 80, 820, 160).fill(0x0e0906);
      for (let y = 70; y < H - 80; y += 34) {
        g.poly([x0, y, x0 + 820, y, x0 + 820, y + 16, x0, y + 13]).fill(0x1a120b);
        g.moveTo(x0, y + 16).lineTo(x0 + 820, y + 17).stroke({ width: 2, color: 0x3a2818, alpha: 0.9 });
      }
      return g;
    };
    this.leftDoor.addChild(slatDoor(-20));
    this.rightDoor.addChild(slatDoor(800));
    // the seam between the two doors, and clothes hanging in front
    const inside = new Graphics();
    inside.rect(790, -60, 20, H + 120).fill(0x080504);
    inside.poly([-40, -60, 220, -60, 180, 300, 120, 520, 40, 560, -40, 540]).fill(0x0a0807);
    inside.poly([1400, -60, 1660, -60, 1660, 600, 1540, 640, 1460, 420]).fill(0x0b0907);
    this.slats.addChild(this.leftDoor, this.rightDoor, inside);
    this.dark.glows.addChild(this.wash, this.candle);
    this.root.addChild(this.back, this.dark, this.slats);
  }

  update(f: Frame) {
    const { s, t, now } = f;
    const hiding = s.beat === 'hide';
    const w = hiding ? walk(t) : { k: 1, stride: 0, arrived: true };
    this.it.visible = w.k >= 0;
    // far by the door (small, right) → right in front of the louvres (big, centre)
    this.it.position.set(1340 - w.k * 560, 640 + w.k * 340);
    this.it.scale.set(0.55 + w.k * 1.25);
    const lean = s.beat === 'mmm' ? ease(t / 1500) : s.beat === 'found' ? 1 : 0;
    this.it.pose(w.arrived ? 0 : w.stride, w.arrived ? Math.sin(now / 1600) * 0.6 : 0, lean);

    const found = s.beat === 'found';
    const open = found ? ease(t / 350) : 0;
    this.leftDoor.x = -open * 760;
    this.rightDoor.x = open * 760;
    this.hand.visible = found;
    if (found) {
      const reach = ease((t - 300) / 900);
      this.hand.position.set(1100 - reach * 260, 120 + reach * 300);
      this.hand.scale.set(1.6);
    }

    // Doors open, the hand fills the view; the body behind it falls out of focus.
    this.it.filters = found && !f.low ? [this.dof] : null;
    this.candle.alpha = 0.5 * flicker(now);
    this.wash.alpha = 0.2 * flicker(now, 1);
    // Holding his breath, the view holds still.
    const sway = s.holdingSince !== null ? 0.1 : 1;
    this.back.drift(f, sway);
    this.slats.drift(f, sway);
    this.dark.set(0.45, null);
  }
}

/** Seen from under the bed: the bed's slats above, a strip of floor, its legs. */
export class UnderBedScene implements SceneNode {
  root = new Container();
  private back = new Layer(0.3);
  private front = new Layer(1.1);
  private it = new Creature(0.25);
  private hand = new Hand();
  private watch = new Graphics();
  private dark = new Dark();
  private candle = glow(0xffa040, 1300, 380, 800, 0.5);
  private wash = glow(0xff9a50, 820, 480, 1700, 0.2);

  constructor() {
    this.back.addChild(room1920(470), this.it);
    const above = new Graphics();
    above.rect(-100, -100, W + 200, 430).fill(0x090605);
    for (let x = 0; x < W; x += 120) above.rect(x, -100, 26, 420).fill(0x150e09);
    // springs
    for (let x = 60; x < W; x += 120)
      for (let y = 40; y < 300; y += 70) above.circle(x, y, 18).stroke({ width: 2, color: 0x2a2620, alpha: 0.6 });
    // the hanging edge of the blanket
    above.poly([-100, 320, W + 100, 320, W + 100, 352, 1300, 368, 900, 356, 500, 370, 100, 358, -100, 366]).fill(0x3a1612);
    // the floor right under his face, dust
    const near = new Graphics();
    near.rect(-100, 820, W + 200, 200).fill({ color: 0x0c0806, alpha: 0.8 });
    this.watch.roundRect(300, 800, 60, 26, 6).fill(0x1a1a18).rect(312, 805, 36, 14).fill(0x55604a);
    this.watch.visible = false;
    this.front.addChild(above, near, this.watch, this.hand);
    this.hand.visible = false;
    this.dark.glows.addChild(this.wash, this.candle);
    this.root.addChild(this.back, this.front, this.dark);
  }

  update(f: Frame) {
    const { s, t, now } = f;
    const w = s.beat === 'hide' ? walk(t) : { k: 1, stride: 0, arrived: true };
    this.it.visible = w.k >= 0;
    // Only the legs show below the blanket: big, and coming closer.
    this.it.position.set(1300 - w.k * 520, 470 + w.k * 330);
    this.it.scale.set(1.2 + w.k * 1.6);
    const crouch = s.beat === 'found' ? ease(t / 600) : 0;
    this.it.y += crouch * 140;
    this.it.pose(w.arrived ? 0 : w.stride, 0, 0);

    const found = s.beat === 'found';
    this.hand.visible = found;
    this.watch.visible = found && t > 2400;
    if (found) {
      const reach = ease((t - 500) / 800);
      this.hand.position.set(1000 - reach * 200, 500 + reach * 160);
      this.hand.scale.set(1.8);
      this.hand.rotation = -0.6;
    }
    this.candle.alpha = 0.45 * flicker(now, 2);
    this.wash.alpha = 0.2 * flicker(now, 3);
    const sway = s.holdingSince !== null ? 0.1 : 1;
    this.back.drift(f, sway);
    this.front.drift(f, sway);
    this.dark.set(0.45, null);
  }
}
