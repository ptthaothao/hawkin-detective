import { Container, Graphics, Sprite } from 'pixi.js';
import { glow } from './common';

const SKIN = 0x070605;
const RIM = 0xff9a50;

/**
 * The thing, as a silhouette. Origin is between its feet. About 600 units tall at scale 1:
 * long thin legs, a hunched narrow body, arms that hang past its knees, a small head bowed forward.
 * Never shown in detail: it is always backlit or half-hidden.
 */
export class Creature extends Container {
  private legL = new Graphics();
  private legR = new Graphics();
  private body = new Graphics();
  private head = new Graphics();
  private armL = new Graphics();
  private armR = new Graphics();

  constructor(rim = 0.22) {
    super();
    // A hunched torso: the back bows up and over, the chest is caved in, bony shoulders.
    this.body
      .moveTo(-22, -300)
      .bezierCurveTo(-58, -350, -74, -430, -46, -488)
      .bezierCurveTo(-30, -500, 10, -496, 34, -478)
      .bezierCurveTo(40, -430, 28, -370, 20, -300)
      .closePath()
      .fill(SKIN)
      // ribs catching the light on the near side
      .moveTo(22, -440).bezierCurveTo(14, -436, 6, -430, 0, -424)
      .moveTo(24, -414).bezierCurveTo(16, -410, 8, -404, 2, -398)
      .moveTo(24, -388).bezierCurveTo(16, -384, 10, -378, 4, -372)
      .stroke({ width: 2, color: RIM, alpha: rim * 0.8 })
      .moveTo(34, -478).bezierCurveTo(40, -430, 28, -370, 20, -300)
      .stroke({ width: 3, color: RIM, alpha: rim })
      // neck reaching forward and down
      .moveTo(-10, -486).bezierCurveTo(10, -500, 34, -486, 48, -462)
      .stroke({ width: 16, color: SKIN, cap: 'round' });
    // A long skull hanging lower than the shoulders.
    this.head
      .moveTo(0, -30)
      .bezierCurveTo(22, -34, 30, -6, 24, 22)
      .bezierCurveTo(18, 44, 4, 52, -4, 40)
      .bezierCurveTo(-16, 20, -18, -24, 0, -30)
      .fill(SKIN)
      .moveTo(0, -30).bezierCurveTo(22, -34, 30, -6, 24, 22)
      .stroke({ width: 2.5, color: RIM, alpha: rim * 0.9 });
    this.head.position.set(54, -450);
    this.head.rotation = -0.5;
    const leg = (g: Graphics) =>
      g
        // thigh, knob of a knee, shin: thin and slightly bent
        .moveTo(-8, -300)
        .bezierCurveTo(-12, -240, -16, -190, -14, -158)
        .bezierCurveTo(-20, -150, -18, -134, -10, -128)
        .bezierCurveTo(-8, -80, -8, -40, -6, 0)
        .lineTo(6, 0)
        .bezierCurveTo(4, -40, 6, -80, 6, -128)
        .bezierCurveTo(12, -136, 12, -152, 6, -158)
        .bezierCurveTo(8, -200, 10, -250, 10, -300)
        .closePath()
        .fill(SKIN)
        // a long bare foot, toes splayed
        .moveTo(-8, 2).bezierCurveTo(-10, -8, 10, -10, 26, -6).lineTo(52, -4).lineTo(50, 0).lineTo(56, 2).lineTo(-8, 4)
        .closePath()
        .fill(SKIN);
    leg(this.legL);
    leg(this.legR);
    this.legL.x = -16;
    this.legR.x = 18;
    const arm = (g: Graphics, side: 1 | -1) => {
      // upper arm, elbow, forearm tapering to a narrow wrist
      g.moveTo(-6 * side, 0)
        .bezierCurveTo(-10 * side, 60, -8 * side, 120, -4 * side, 168)
        .bezierCurveTo(-8 * side, 176, -6 * side, 186, 0, 190)
        .bezierCurveTo(4 * side, 240, 8 * side, 280, 10 * side, 300)
        .lineTo(16 * side, 300)
        .bezierCurveTo(14 * side, 270, 12 * side, 230, 10 * side, 186)
        .bezierCurveTo(14 * side, 178, 12 * side, 166, 6 * side, 162)
        .bezierCurveTo(8 * side, 110, 10 * side, 50, 10 * side, 0)
        .closePath()
        .fill(SKIN);
      // fingers, longer than a hand should be
      for (let i = 0; i < 4; i++) {
        g.moveTo((10 + i * 2) * side, 298)
          .bezierCurveTo((8 + i * 3) * side, 330, (4 + i * 4) * side, 350, (i * 5 - 2) * side, 372 + i * 3)
          .stroke({ width: 3.2 - i * 0.3, color: SKIN, cap: 'round' });
      }
    };
    arm(this.armL, -1);
    arm(this.armR, 1);
    this.armL.position.set(-40, -478);
    this.armR.position.set(30, -470);
    this.addChild(this.legL, this.legR, this.armL, this.armR, this.body, this.head);
  }

  /** `stride` 0..1 through one step; `look` turns the head (-1 left .. 1 right); `lean` bends it forward. */
  pose(stride: number, look = 0, lean = 0) {
    const s = Math.sin(stride * Math.PI * 2);
    this.legL.x = -16 + s * 18;
    this.legR.x = 18 - s * 18;
    this.legL.y = Math.max(0, s) * -8;
    this.legR.y = Math.max(0, -s) * -8;
    this.armL.rotation = 0.05 - s * 0.05 + lean * 0.25;
    this.armR.rotation = -0.03 + s * 0.05 - lean * 0.1;
    this.head.rotation = -0.5 + look * 0.45 + lean * 0.5;
    this.head.position.set(54 + look * 8 + lean * 26, -450 + lean * 30);
    this.body.skew.x = -lean * 0.2;
  }
}

/** Its hand reaching in, long jointed fingers lit along one edge, and the glint on one of them. */
export class Hand extends Container {
  readonly glint: Sprite;
  constructor() {
    super();
    const g = new Graphics();
    const skin = 0x0c0a09;
    // forearm coming from off-screen top-right
    g.moveTo(420, -520).bezierCurveTo(300, -300, 180, -120, 90, -10).lineTo(20, -40).bezierCurveTo(120, -160, 240, -340, 340, -540).closePath().fill(skin);
    g.moveTo(420, -520).bezierCurveTo(300, -300, 180, -120, 90, -10).stroke({ width: 3, color: RIM, alpha: 0.35 });
    // palm
    g.moveTo(20, -40).bezierCurveTo(-20, -10, -30, 50, 0, 80).lineTo(110, 70).bezierCurveTo(120, 30, 110, 0, 90, -10).closePath().fill(skin);
    // fingers: three segments each, knuckles showing, much too long
    const fingers: [number, number, number][] = [
      [4, 80, 2.1],
      [34, 84, 1.85],
      [64, 80, 1.65],
      [96, 70, 1.45],
    ];
    fingers.forEach(([x, y, a], i) => {
      const len = 70 - i * 6;
      let px = x;
      let py = y;
      let ang = a;
      for (let seg = 0; seg < 3; seg++) {
        const nx = px + Math.cos(ang) * len;
        const ny = py + Math.sin(ang) * len;
        g.moveTo(px, py).lineTo(nx, ny).stroke({ width: 15 - seg * 3, color: skin, cap: 'round' });
        g.moveTo(px + 5, py - 2).lineTo(nx + 4, ny - 2).stroke({ width: 1.5, color: RIM, alpha: 0.45 });
        g.circle(nx, ny, 8 - seg * 1.5).fill(skin);
        px = nx;
        py = ny;
        ang += 0.28;
      }
    });
    // thumb
    g.moveTo(100, 20).lineTo(160, 70).lineTo(170, 130).stroke({ width: 16, color: skin, cap: 'round', join: 'round' });
    // a band on one finger, catching the light
    const bx = 34 + Math.cos(1.85) * 55;
    const by = 84 + Math.sin(1.85) * 55;
    g.circle(bx, by, 10).stroke({ width: 5, color: 0x9a7a34 });
    this.addChild(g);
    this.glint = glow(0xfff1c0, bx + 4, by - 4, 110, 0);
    this.glint.blendMode = 'add';
    this.addChild(this.glint);
  }
}
