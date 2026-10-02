import { Container, Graphics, Text } from 'pixi.js';
import { Creature } from './creature';
import { Dark, H, Layer, W, beam, cameraView, clamp01, ease, glow, type Frame, type SceneNode } from './common';

/** The door on the right wall, in design space. Exported so the UI can place its hotspot. */
export const DOOR = { x: 1400, y: 180, w: 160, h: 580 };
export const BED_TORCH = { x: 492, y: 600 };
export const RADIO = { x: 982, y: 374, w: 212, h: 100 };

const P = {
  wall: 0x3a3022,
  wallDot: 0x4a3e2c,
  wains: 0x2c2218,
  floor: 0x23190f,
  plank: 0x1a120b,
  wood: 0x5a4028,
  woodDark: 0x3a2818,
  woodTop: 0x6a4c30,
  metal: 0x8a8a84,
  metalDark: 0x3a3a38,
  brass: 0xa88a4a,
  blanket: 0x5c2a24,
  sheet: 0xb8b0a0,
};

function backWall(): Graphics {
  const g = new Graphics();
  g.rect(-100, -100, W + 200, 720).fill(P.wall);
  // wallpaper: small diamonds
  for (let y = 10; y < 520; y += 46)
    for (let x = (y / 46) % 2 ? 0 : 23; x < W + 40; x += 46) g.poly([x, y - 6, x + 5, y, x, y + 6, x - 5, y]).fill(P.wallDot);
  g.rect(-100, 520, W + 200, 100).fill(P.wains);
  for (let x = -80; x < W + 100; x += 34) g.moveTo(x, 524).lineTo(x, 616).stroke({ width: 2, color: 0x1e1610 });
  g.rect(-100, 516, W + 200, 8).fill(P.woodTop);
  // floor in perspective
  g.rect(-100, 620, W + 200, 400).fill(P.floor);
  for (let i = -14; i <= 30; i++) g.moveTo(800 + i * 70, 620).lineTo(800 + i * 150, 1000).stroke({ width: 2, color: P.plank });
  // window with blinds, night outside
  g.rect(424, 84, 392, 344).fill(0x4a3a28);
  g.rect(440, 100, 360, 312).fill(0x131d2c);
  for (let y = 108; y < 410; y += 14) g.rect(440, y, 360, 5).fill({ color: 0x6a7a8a, alpha: 0.22 });
  g.rect(616, 100, 8, 312).fill(0x4a3a28);
  // curtains
  g.poly([400, 70, 470, 70, 450, 440, 396, 448]).fill(0x4a1e1a);
  g.poly([770, 70, 840, 70, 844, 448, 790, 440]).fill(0x4a1e1a);
  // wall clock, as in Chapter 0
  g.circle(264, 144, 62).fill(0x2a2620).circle(264, 144, 54).fill(0xd8d0bc);
  return g;
}

function clockHands(minute: number): Graphics {
  const g = new Graphics();
  const hourA = ((3 + minute / 60) / 12) * Math.PI * 2 - Math.PI / 2;
  const minA = (minute / 60) * Math.PI * 2 - Math.PI / 2;
  g.moveTo(264, 144).lineTo(264 + Math.cos(hourA) * 30, 144 + Math.sin(hourA) * 30).stroke({ width: 5, color: 0x1a1a18 });
  g.moveTo(264, 144).lineTo(264 + Math.cos(minA) * 46, 144 + Math.sin(minA) * 46).stroke({ width: 3, color: 0x1a1a18 });
  return g;
}

function door(open: boolean): Graphics {
  const { x, y, w, h } = DOOR;
  const g = new Graphics();
  g.rect(x - 14, y - 14, w + 28, h + 14).fill(0x6a5640);
  if (open) {
    // Ajar: a strip of hallway on the hinge side, the leaf swung in.
    g.rect(x, y, 48, h).fill(0x0c0b0a);
    // the hallway window at the far end, moonlit
    g.rect(x + 14, y + 120, 22, 80).fill(0x22324a);
    g.poly([x + 48, y, x + w + 10, y - 6, x + w + 10, y + h + 8, x + 48, y + h]).fill(0x4a3828);
    g.circle(x + w - 8, y + h / 2, 7).fill(P.brass);
  } else {
    g.rect(x, y, w, h).fill(0x4e3a28);
    g.rect(x + 18, y + 22, w - 36, h / 2 - 40).stroke({ width: 3, color: 0x3a2a1c });
    g.rect(x + 18, y + h / 2 + 10, w - 36, h / 2 - 40).stroke({ width: 3, color: 0x3a2a1c });
    g.circle(x + 18, y + h / 2, 7).fill(P.brass);
  }
  return g;
}

function wardrobe(): Graphics {
  const g = new Graphics();
  g.rect(8, 130, 172, 646).fill(P.woodDark);
  g.rect(2, 120, 184, 18).fill(P.woodTop);
  [[18, 150], [98, 150]].forEach(([x, y]) => {
    g.rect(x, y, 74, 600).fill(P.wood);
    // louvred slats
    for (let sy = y + 30; sy < y + 560; sy += 16) g.rect(x + 8, sy, 58, 7).fill(0x2a1c10);
  });
  g.circle(90, 450, 5).fill(P.brass).circle(106, 450, 5).fill(P.brass);
  return g;
}

function bed(): Graphics {
  const g = new Graphics();
  g.rect(196, 470, 22, 300).fill(P.wood); // headboard post
  g.rect(196, 470, 60, 150).fill(P.woodDark);
  g.rect(214, 600, 410, 120).fill(P.woodDark);
  g.rect(214, 570, 410, 44).fill(P.sheet);
  g.ellipse(276, 572, 56, 22).fill(0xcfc8b8); // pillow
  // rumpled blanket, thrown back
  g.poly([330, 560, 600, 556, 626, 640, 600, 720, 320, 724, 300, 640]).fill(P.blanket);
  for (let i = 0; i < 6; i++) g.moveTo(330 + i * 48, 560).lineTo(316 + i * 52, 722).stroke({ width: 3, color: 0x3a1a16 });
  g.rect(604, 600, 22, 170).fill(P.wood); // foot post
  return g;
}

function flashlight(): Graphics {
  const g = new Graphics();
  const { x, y } = BED_TORCH;
  g.roundRect(x - 34, y - 8, 56, 16, 4).fill(0x2a2a28);
  g.roundRect(x + 18, y - 11, 18, 22, 3).fill(P.metal);
  g.rect(x - 20, y - 8, 4, 16).fill(0x5a5a56);
  return g;
}

function desk(): Graphics {
  const g = new Graphics();
  g.rect(912, 513, 384, 118).fill(P.woodDark);
  g.rect(880, 505, 32, 188).fill(P.wood);
  g.rect(1296, 505, 32, 188).fill(P.wood);
  g.rect(1170, 513, 126, 92).fill(P.wood);
  g.poly([884, 456, 1326, 456, 1344, 477, 864, 477]).fill(P.woodTop);
  g.rect(864, 477, 480, 30).fill(P.wood);
  // dad's lamp, off
  g.ellipse(1296, 472, 28, 6).fill(P.brass).rect(1293, 360, 6, 112).fill(P.brass);
  g.poly([1258, 364, 1334, 364, 1318, 336, 1274, 336]).fill(0x2a4a30);
  return g;
}

function radio(): Graphics {
  const g = new Graphics();
  const x = RADIO.x;
  g.moveTo(1172, 388).lineTo(1236, 236).stroke({ width: 3, color: P.metal });
  g.rect(x, 374, 212, 10).fill(P.woodTop);
  g.rect(x + 4, 382, 204, 92).fill(P.wood);
  g.rect(x + 14, 390, 184, 76).fill(0x120f0c).stroke({ width: 1, color: P.brass });
  g.circle(1022, 414, 12).fill(0x1c1813).stroke({ width: 1.5, color: P.brass });
  g.circle(1052, 414, 12).fill(0x1c1813).stroke({ width: 1.5, color: P.brass });
  g.roundRect(1006, 434, 62, 24, 10).fill(0x2a2018);
  // dad's grey plate
  g.rect(1074, 394, 100, 68).fill(P.metalDark).stroke({ width: 1, color: P.metal });
  g.rect(1104, 400, 64, 24).fill(0x0a0806);
  for (let y = 432; y < 456; y += 4) g.rect(1082, y, 86, 2).fill(0x222220);
  return g;
}

/** The mic lying on the desk with Theo's drawing book thrown on top of it, the spine on the talk button. */
function micAndBook(onFloor: boolean): Graphics {
  const g = new Graphics();
  if (!onFloor) {
    g.moveTo(1004, 466).bezierCurveTo(990, 466, 980, 458, 986, 446).stroke({ width: 3, color: 0x0d0c0b });
    g.roundRect(1004, 458, 56, 16, 7).fill(P.metalDark);
    g.poly([1018, 440, 1092, 436, 1098, 458, 1022, 466]).fill(0x2f4a6e);
    for (let i = 0; i < 5; i++) g.circle(1020 + i * 0.8, 444 + i * 5, 2).stroke({ width: 1.2, color: P.metal });
  } else {
    g.moveTo(980, 450).bezierCurveTo(960, 560, 900, 640, 860, 700).stroke({ width: 3, color: 0x0d0c0b });
    g.roundRect(830, 696, 56, 18, 8).fill(P.metalDark);
    g.poly([846, 690, 930, 684, 938, 716, 852, 724]).fill(0x2f4a6e);
  }
  return g;
}

export class RoomScene implements SceneNode {
  root = new Container();
  private back = new Layer(0.25);
  private mid = new Layer(0.55);
  private front = new Layer(1);
  private dark = new Dark();
  private hands = new Container();
  private doorG = new Container();
  private micG = new Container();
  private torchG = flashlight();
  private digits = new Text({ text: '2.58', style: { fontFamily: 'VT323, monospace', fontSize: 26, fill: 0xe4b262 } });
  private radioGlow = glow(0xffb050, 1088, 424, 340, 0.35);
  private txGlow = glow(0xff3020, 1156, 398, 40, 0.9);
  private tx = new Graphics().circle(1156, 398, 2.6).fill(0xff4a30);
  private moon = beam([[440, 100], [800, 100], [1060, 900], [240, 900]], 'rgba(120,150,190,0.16)', 30);
  private doorOpen: boolean | null = null;
  private micOnFloor: boolean | null = null;
  private hallway = new Creature(0.35);
  private lastMinute = -1;
  private camera = new Container();
  /** Smoothed look direction, -0.5..0.5 each way. */
  private look = { x: 0, y: 0 };

  constructor() {
    this.back.addChild(backWall(), this.hands, this.doorG);
    this.hallway.scale.set(0.14);
    this.hallway.position.set(DOOR.x + 26, DOOR.y + 214);
    this.back.addChild(this.hallway);
    this.mid.addChild(wardrobe(), bed(), this.torchG, desk(), radio(), this.digits, this.tx, this.micG);
    this.digits.anchor.set(0.5);
    this.digits.position.set(1136, 412);
    const rug = new Graphics().ellipse(800, 770, 220, 44).fill(0x3a2218).ellipse(800, 770, 170, 32).stroke({ width: 4, color: 0x5a3424 });
    this.front.addChild(rug);
    this.dark.glows.addChild(this.moon, this.radioGlow, this.txGlow);
    this.camera.addChild(this.back, this.mid, this.front);
    this.root.addChild(this.camera, this.dark);
  }

  update(f: Frame) {
    const { s, t, now } = f;
    const minute = ['back', 'bark'].includes(s.beat) ? 16 : 17;
    if (minute !== this.lastMinute) {
      this.lastMinute = minute;
      this.hands.removeChildren().forEach((c) => c.destroy());
      this.hands.addChild(clockHands(minute));
    }
    if (this.doorOpen !== !s.doorShut) {
      this.doorOpen = !s.doorShut;
      this.doorG.removeChildren().forEach((c) => c.destroy());
      this.doorG.addChild(door(this.doorOpen));
    }
    if (this.micOnFloor !== s.radioOff) {
      this.micOnFloor = s.radioOff;
      this.micG.removeChildren().forEach((c) => c.destroy());
      this.micG.addChild(micAndBook(s.radioOff));
    }

    const radioOn = !s.radioOff;
    const surge = s.beat === 'answer' ? Math.max(0, 1 - t / 2600) : 0;
    this.digits.visible = radioOn;
    this.radioGlow.visible = radioOn;
    this.radioGlow.alpha = 0.3 + surge * 0.9 + Math.sin(now / 140) * 0.03;
    this.radioGlow.width = this.radioGlow.height = 340 + surge * 500;
    // The transmit light: on while the book holds the button down. Nobody notices it.
    this.tx.visible = this.txGlow.visible = radioOn;
    this.torchG.visible = ['back', 'bark', 'answer', 'torch'].includes(s.beat);

    // It, at the end of the hallway: only once he is looking, and gone when the door shuts.
    this.hallway.visible = (s.beat === 'look' || s.beat === 'shut') && !s.doorShut;
    this.hallway.pose(0, Math.sin(now / 1400) * 0.3);

    // Camera: the room is a little wider than the screen and he looks around it with the pointer.
    // When he sees it, a jolt toward the door and back (back in place before the hotspots appear).
    const sawFor = s.beat === 'shut' ? ease(t / 700) * (1 - ease((t - 1100) / 600)) : 0;
    const zoom = 1.12 * (1 + sawFor * 0.2);
    this.look.x += (f.px / W - 0.5 - this.look.x) * 0.05;
    this.look.y += (f.py / H - 0.5 - this.look.y) * 0.05;
    const spareX = W * (zoom - 1);
    const spareY = H * (zoom - 1);
    let camX = -spareX / 2 - this.look.x * spareX * 0.9;
    let camY = -spareY / 2 - this.look.y * spareY * 0.9;
    const fx = DOOR.x + 30;
    const fy = DOOR.y + 260;
    camX += (W / 2 - fx * zoom - camX) * sawFor;
    camY += (H / 2 - fy * zoom - camY) * sawFor;
    camX = Math.min(0, Math.max(W - W * zoom, camX));
    camY = Math.min(0, Math.max(H - H * zoom, camY));
    this.camera.scale.set(zoom);
    this.camera.position.set(camX, camY);
    cameraView.x = camX;
    cameraView.y = camY;
    cameraView.scale = zoom;
    const shake = surge * 10 + (s.doorShut && s.beat === 'shut' ? Math.max(0, 1 - t / 400) * 6 : 0);
    this.camera.x += (Math.random() - 0.5) * shake;
    this.camera.y += (Math.random() - 0.5) * shake;

    for (const l of [this.back, this.mid, this.front]) l.drift(f);

    const torchOn = ['look', 'shut', 'choose'].includes(s.beat);
    const ambient = torchOn ? 0.93 : 0.8 + clamp01(1 - t / 3000) * (s.beat === 'back' ? 0.18 : 0);
    this.dark.set(ambient, torchOn ? { x: f.px, y: f.py } : null);
  }
}

