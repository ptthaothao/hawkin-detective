import {
  AdditiveBlending,
  CanvasTexture,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshDepthMaterial,
  PlaneGeometry,
  RGBADepthPacking,
  SRGBColorSpace,
  type Texture,
  type Vector3,
} from 'three';

/**
 * The thing, drawn flat: a pitch-black figure with two big blank milky eyes (public/ch11/it-*.svg).
 * In the 3D set it is a card that always turns to face the camera, so it reads as the drawing from
 * every angle. The eyes are their own layer and glow in the dark; the body is lit like anything else
 * black, and throws the torch's shadow.
 */

/** The drawing's frame (SVG units): it is 882 units from the top of its head to its feet. */
const FRAME = { w: 480, h: 940 };
const TALL = 2.25;
const UNIT = TALL / 882;
const W = FRAME.w * UNIT;
const H = FRAME.h * UNIT;
/** From the bottom of the frame up to its feet. */
const FEET = (1100 - 1062) * UNIT;
/** The head, as a crop of the frame (fractions, top-left origin): for when it lays its head on the floor. */
const HEAD = { x0: 0.25, x1: 0.79, y0: 0.01, y1: 0.33 };

const url = (file: string) => `${import.meta.env.BASE_URL}ch11/${file}`;

function rasterize(file: string, w: number, h: number): { texture: Texture; ready: Promise<void> } {
  if (typeof document === 'undefined') return { texture: new CanvasTexture(null as unknown as HTMLCanvasElement), ready: Promise.resolve() };
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const texture = new CanvasTexture(c);
  texture.colorSpace = SRGBColorSpace;
  const ready = new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => {
      c.getContext('2d')!.drawImage(img, 0, 0, w, h);
      texture.needsUpdate = true;
      resolve();
    };
    img.onerror = () => resolve();
    img.src = url(file);
  });
  return { texture, ready };
}

const BODY = rasterize('it-body.svg', 512, 1003);
const EYES = rasterize('it-eyes.svg', 512, 1003);
const HAND = rasterize('it-hand.svg', 512, 512);
/** Resolves when the drawings are loaded (the bake waits for it). */
export const creatureReady = Promise.all([BODY.ready, EYES.ready, HAND.ready]).then(() => undefined);

function bodyMaterial(map: Texture) {
  return new MeshBasicMaterial({ map, transparent: true, alphaTest: 0.35, side: DoubleSide, color: 0xffffff });
}

function eyeMaterial(map: Texture) {
  return new MeshBasicMaterial({ map, transparent: true, blending: AdditiveBlending, depthWrite: false, toneMapped: false, side: DoubleSide });
}

function card(w: number, h: number, body: Texture, eyes: Texture | null) {
  const g = new Group();
  const plane = new PlaneGeometry(w, h);
  const b = new Mesh(plane, bodyMaterial(body));
  b.castShadow = true;
  b.customDepthMaterial = new MeshDepthMaterial({ map: body, alphaTest: 0.35, depthPacking: RGBADepthPacking });
  g.add(b);
  if (eyes) {
    const e = new Mesh(plane, eyeMaterial(eyes));
    e.position.z = 0.01;
    e.renderOrder = 2;
    g.add(e);
  }
  return g;
}

function cropped(t: Texture) {
  const c = t.clone();
  c.repeat.set(HEAD.x1 - HEAD.x0, HEAD.y1 - HEAD.y0);
  c.offset.set(HEAD.x0, 1 - HEAD.y1);
  c.needsUpdate = true;
  return c;
}

export class Creature2D extends Group {
  /** Turns to face the camera; its feet are at this group's origin. */
  private standing = card(W, H, BODY.texture, EYES.texture);
  /** Only its head, laid sideways on the floor: looking under the bed. */
  private headDown = card(W * (HEAD.x1 - HEAD.x0), H * (HEAD.y1 - HEAD.y0), cropped(BODY.texture), cropped(EYES.texture));
  private sway = new Group();

  constructor() {
    super();
    this.add(this.sway);
    this.standing.position.y = H / 2 - FEET;
    this.sway.add(this.standing);
    this.headDown.rotation.z = Math.PI / 2;
    this.headDown.visible = false;
    this.add(this.headDown);
  }

  /** Turn the card toward a point (the camera). */
  face(at: Vector3) {
    this.updateMatrixWorld();
    const p = this.getWorldPosition(this.position.clone());
    this.rotation.y = Math.atan2(at.x - p.x, at.z - p.z);
  }

  /**
   * `stride` 0..1 through a step; `look` sways the head (-1..1); `lean` bends toward a hiding place
   * (0..1); `crouch` takes it down to the floor to look under a bed (0..1).
   */
  pose(stride: number, look = 0, lean = 0, crouch = 0) {
    const s = Math.sin(stride * Math.PI * 2);
    // each step lifts it a little and rocks it, like something not used to walking
    this.sway.position.y = Math.abs(s) * 0.035 - lean * 0.12;
    this.sway.rotation.z = s * 0.03 + look * 0.06 + lean * 0.05;
    this.sway.scale.y = 1 - lean * 0.06;
    const down = crouch > 0.5;
    this.standing.visible = !down;
    this.headDown.visible = down;
    this.headDown.position.set(0, 0.32 - (crouch - 0.5) * 0.2, 0.25);
  }
}

/** Its hand coming at the camera. Lives in camera space; the stage moves it. */
export class Hand2D extends Group {
  constructor() {
    super();
    const m = new Mesh(new PlaneGeometry(0.42, 0.42), bodyMaterial(HAND.texture));
    m.renderOrder = 3;
    this.add(m);
  }
}
