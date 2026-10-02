import {
  BufferGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  RepeatWrapping,
  SRGBColorSpace,
  SphereGeometry,
  Vector3,
  type Object3D,
} from 'three';

/**
 * The thing, in 3D. Over two metres even hunched: a starved human frame stretched too long.
 * Ribs and spine pushing through wet grey skin, arms that hang past its knees, fingers with one
 * joint too many, a long skull with empty sockets and a jaw that hangs open. Something of a man
 * is left in the shape of it (the father, later): it is never an animal.
 * Seen dark: backlit by the moon or a candle, picked out by the flashlight.
 */

// ---------- skin ----------

function hash(x: number, y: number, z: number) {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return s - Math.floor(s);
}

/** Smooth 3D value noise in 0..1. */
function noise(x: number, y: number, z: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  const f = (t: number) => t * t * (3 - 2 * t);
  const u = f(x - xi);
  const v = f(y - yi);
  const w = f(z - zi);
  const l = (a: number, b: number, t: number) => a + (b - a) * t;
  const c = (dx: number, dy: number, dz: number) => hash(xi + dx, yi + dy, zi + dz);
  return l(
    l(l(c(0, 0, 0), c(1, 0, 0), u), l(c(0, 1, 0), c(1, 1, 0), u), v),
    l(l(c(0, 0, 1), c(1, 0, 1), u), l(c(0, 1, 1), c(1, 1, 1), u), v),
    w,
  );
}

function skinCanvas(size: number, paint: (g: CanvasRenderingContext2D, size: number) => void) {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  paint(c.getContext('2d')!, size);
  return c;
}

/** Mottled grey, bruised, with dark veins: the colour map. */
function paintSkin(g: CanvasRenderingContext2D, n: number) {
  const img = g.createImageData(n, n);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const a = noise(x / 22, y / 22, 0.5) * 0.6 + noise(x / 6, y / 6, 3.1) * 0.4;
      const bruise = Math.max(0, noise(x / 40, y / 40, 9.2) - 0.55) * 2;
      const vein = Math.max(0, 1 - Math.abs(noise(x / 14, y / 30, 5.7) - 0.5) / 0.02);
      const base = 70 + a * 34;
      const i = (y * n + x) * 4;
      img.data[i] = base - 4 - bruise * 16 - vein * 14;
      img.data[i + 1] = base - bruise * 22 - vein * 16;
      img.data[i + 2] = base + 6 + bruise * 8 - vein * 4;
      img.data[i + 3] = 255;
    }
  g.putImageData(img, 0, 0);
}

/** Pores, wrinkles and veins as a bump map. */
function paintBump(g: CanvasRenderingContext2D, n: number) {
  const img = g.createImageData(n, n);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const wrinkle = Math.abs(Math.sin(y / 3 + noise(x / 10, y / 10, 1) * 6)) * 0.15;
      const pore = noise(x / 2.5, y / 2.5, 7) * 0.4;
      const vein = Math.max(0, 1 - Math.abs(noise(x / 14, y / 30, 5.7) - 0.5) / 0.03) * 0.25;
      const v = Math.min(255, (wrinkle + pore + vein) * 255);
      const i = (y * n + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
  g.putImageData(img, 0, 0);
}

function skinMaterial() {
  const color = skinCanvas(256, paintSkin);
  const bump = skinCanvas(256, paintBump);
  const m = new MeshStandardMaterial({ color: 0x9a9c98, roughness: 0.5, metalness: 0.05 });
  if (color && bump) {
    const map = new CanvasTexture(color);
    map.colorSpace = SRGBColorSpace;
    const bumpMap = new CanvasTexture(bump);
    for (const t of [map, bumpMap]) {
      t.wrapS = t.wrapT = RepeatWrapping;
      t.repeat.set(2, 3);
    }
    m.map = map;
    m.bumpMap = bumpMap;
    m.bumpScale = 0.7;
  }
  return m;
}

const SKIN = skinMaterial();
/** Inside the mouth and the eye sockets. */
const HOLLOW = new MeshBasicMaterial({ color: 0x000000 });
const NAIL = new MeshStandardMaterial({ color: 0x2a241c, roughness: 0.3, metalness: 0.1 });
const HAIR = new MeshStandardMaterial({ color: 0x0c0b0a, roughness: 0.25 });
const TOOTH = new MeshStandardMaterial({ color: 0x2e2a22, roughness: 0.45 });

// ---------- geometry ----------

/**
 * A tube swept along a smooth curve, with its own radius at each control point and an optional
 * flattening; the surface is pushed in and out by noise so nothing looks turned on a lathe.
 */
function sweep(points: Vector3[], radii: number[], opts: { flat?: number; lumps?: number; seg?: number; rad?: number } = {}) {
  const { flat = 1, lumps = 0.12, seg = 28, rad = 14 } = opts;
  const curve = new CatmullRomCurve3(points);
  const frames = curve.computeFrenetFrames(seg, false);
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const r = (t: number) => {
    const k = t * (radii.length - 1);
    const i = Math.min(radii.length - 2, Math.floor(k));
    const f = k - i;
    const s = f * f * (3 - 2 * f);
    return radii[i] + (radii[i + 1] - radii[i]) * s;
  };
  for (let i = 0; i <= seg; i++) {
    const t = i / seg;
    const p = curve.getPointAt(t);
    const N = frames.normals[i];
    const B = frames.binormals[i];
    for (let j = 0; j <= rad; j++) {
      const a = (j / rad) * Math.PI * 2;
      const cx = Math.cos(a);
      const cy = Math.sin(a) * flat;
      const base = r(t);
      const bump = 1 + (noise(p.x * 9 + cx * 2, p.y * 9, p.z * 9 + cy * 2) - 0.5) * lumps * 2;
      const rr = base * bump;
      pos.push(p.x + (N.x * cx + B.x * cy) * rr, p.y + (N.y * cx + B.y * cy) * rr, p.z + (N.z * cx + B.z * cy) * rr);
      uv.push(j / rad, t);
    }
  }
  for (let i = 0; i < seg; i++)
    for (let j = 0; j < rad; j++) {
      const a = i * (rad + 1) + j;
      const b = a + rad + 1;
      idx.push(a, a + 1, b, b, a + 1, b + 1);
    }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function mesh(g: BufferGeometry, mat = SKIN, parent?: Object3D) {
  const m = new Mesh(g, mat);
  m.castShadow = true;
  m.receiveShadow = true;
  parent?.add(m);
  return m;
}

/** A knobbly joint: a lumpy sphere. */
function knob(r: number, parent: Object3D, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) {
  const g = new SphereGeometry(r, 14, 10);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const v = new Vector3().fromBufferAttribute(p, i);
    const k = 1 + (noise(v.x * 40, v.y * 40, v.z * 40) - 0.5) * 0.35;
    p.setXYZ(i, v.x * k, v.y * k, v.z * k);
  }
  g.computeVertexNormals();
  const m = mesh(g, SKIN, parent);
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  return m;
}

function joint(parent: Object3D, x: number, y: number, z: number): Group {
  const g = new Group();
  g.position.set(x, y, z);
  parent.add(g);
  return g;
}

const v = (x: number, y: number, z: number) => new Vector3(x, y, z);

/** A bone segment hanging down from its joint: thick at the ends, starved in the middle. */
function bone(len: number, rTop: number, rMid: number, rEnd: number, parent: Object3D, bow = 0.02) {
  return mesh(sweep([v(0, 0, 0), v(0, -len * 0.35, bow), v(0, -len * 0.7, bow * 0.6), v(0, -len, 0)], [rTop, rMid, rMid * 0.95, rEnd], { lumps: 0.16 }), SKIN, parent);
}

/** A finger of `n` long segments with a dark nail at the tip, curling as it goes. */
function finger(parent: Object3D, lens: number[], r: number, curl: number) {
  let j: Object3D = parent;
  lens.forEach((len, i) => {
    const seg = joint(j, 0, i === 0 ? 0 : -lens[i - 1], 0);
    seg.rotation.x = i === 0 ? 0 : curl;
    bone(len, r * (1 - i * 0.18), r * (0.8 - i * 0.15), r * (0.9 - i * 0.18), seg, 0.003);
    knob(r * (1.15 - i * 0.18), seg, 0, 0, 0);
    if (i === lens.length - 1) {
      const nail = new Mesh(new SphereGeometry(r * 0.75, 8, 6), NAIL);
      nail.scale.set(0.9, 2.6, 0.6);
      nail.position.set(0, -len - r * 0.8, -r * 0.3);
      seg.add(nail);
    }
    j = seg;
  });
}

/** A hand: a narrow bony palm and four fingers with one joint too many, plus a thumb. */
function buildHand(parent: Object3D, scale = 1) {
  const s = scale;
  mesh(sweep([v(0, 0.01, 0), v(0, -0.05 * s, 0.005), v(0, -0.1 * s, 0)], [0.03 * s, 0.038 * s, 0.032 * s], { flat: 0.45, lumps: 0.2 }), SKIN, parent);
  for (let i = 0; i < 4; i++) {
    const f = joint(parent, (i - 1.5) * 0.019 * s, -0.1 * s, 0);
    f.rotation.z = (i - 1.5) * 0.06;
    const long = i === 1 || i === 2 ? 1 : 0.85;
    finger(f, [0.075 * s * long, 0.065 * s * long, 0.055 * s * long, 0.04 * s * long], 0.0085 * s, 0.22 + i * 0.04);
  }
  const th = joint(parent, -0.03 * s, -0.04 * s, 0.01 * s);
  th.rotation.set(0.3, 0, 0.7);
  finger(th, [0.05 * s, 0.045 * s, 0.035 * s], 0.009 * s, 0.25);
}

// ---------- the body ----------

export class Creature3D extends Group {
  private hipL: Group;
  private hipR: Group;
  private kneeL: Group;
  private kneeR: Group;
  private shoulderL: Group;
  private shoulderR: Group;
  private elbowL: Group;
  private elbowR: Group;
  private spine: Group;
  private neck: Group;
  private jaw: Group;
  /** The right hand: it reaches when it finds him. */
  readonly reach: Group;

  constructor() {
    super();
    const pelvis = joint(this, 0, 1.3, 0);
    // narrow hips, the pelvic bones showing
    knob(0.11, pelvis, 0, 0, 0, 1.35, 0.7, 0.75);
    knob(0.05, pelvis, -0.11, 0.04, 0.05, 1, 1.2, 0.8);
    knob(0.05, pelvis, 0.11, 0.04, 0.05, 1, 1.2, 0.8);

    this.spine = joint(pelvis, 0, 0.04, 0);
    // the torso: a starved trunk, belly sucked in under the ribs, a hunched back
    mesh(
      sweep(
        [v(0, 0, 0), v(0, 0.14, 0.01), v(0, 0.3, -0.01), v(0, 0.48, -0.03), v(0, 0.64, -0.02), v(0, 0.74, 0.01)],
        [0.1, 0.075, 0.12, 0.15, 0.14, 0.1],
        { flat: 0.62, lumps: 0.1, seg: 36, rad: 18 },
      ),
      SKIN,
      this.spine,
    );
    // ribs pushing through the skin
    for (let i = 0; i < 7; i++) {
      const y = 0.32 + i * 0.055;
      const w = 0.14 - Math.abs(i - 2.5) * 0.012;
      for (const side of [-1, 1]) {
        const pts = [v(0, y + 0.02, -0.085), v(side * w * 0.8, y, -0.06), v(side * w * 1.02, y - 0.03, 0.01), v(side * w * 0.75, y - 0.06, 0.075), v(side * 0.02, y - 0.05, 0.088)];
        mesh(sweep(pts, [0.011, 0.012, 0.012, 0.01, 0.008], { lumps: 0.05, seg: 16, rad: 6 }), SKIN, this.spine);
      }
    }
    // the spine, each vertebra a knuckle down the back
    for (let i = 0; i < 12; i++) knob(0.022 - i * 0.0005, this.spine, 0, 0.06 + i * 0.058, -0.09 - Math.sin((i / 11) * Math.PI) * 0.025, 1.2, 0.8, 1);
    // shoulder blades
    knob(0.06, this.spine, -0.08, 0.6, -0.085, 1, 1.4, 0.4);
    knob(0.06, this.spine, 0.08, 0.6, -0.085, 1, 1.4, 0.4);
    // collarbones
    for (const side of [-1, 1]) mesh(sweep([v(0, 0.71, 0.06), v(side * 0.1, 0.72, 0.05), v(side * 0.19, 0.7, 0)], [0.012, 0.014, 0.018], { seg: 10, rad: 6 }), SKIN, this.spine);
    this.spine.rotation.x = 0.3;

    // neck: long, thin, the tendons standing out
    this.neck = joint(this.spine, 0, 0.74, 0.02);
    this.neck.rotation.x = 0.5;
    mesh(sweep([v(0, 0, 0), v(0, 0.1, 0.01), v(0, 0.2, 0.0)], [0.05, 0.035, 0.04], { flat: 0.85, lumps: 0.2, seg: 12 }), SKIN, this.neck);
    for (const side of [-1, 1]) mesh(sweep([v(side * 0.03, 0.0, 0.03), v(side * 0.02, 0.1, 0.035), v(side * 0.012, 0.2, 0.03)], [0.009, 0.007, 0.006], { seg: 8, rad: 6 }), SKIN, this.neck);

    // the head: a long skull, sockets with nothing in them, the jaw hanging open too far
    const head = joint(this.neck, 0, 0.2, 0.0);
    head.name = 'head';
    head.rotation.x = -0.45;
    const skull = new SphereGeometry(0.1, 28, 22);
    const sp = skull.attributes.position;
    for (let i = 0; i < sp.count; i++) {
      const p = new Vector3().fromBufferAttribute(sp, i);
      // stretched long and narrow, temples sunk in
      let x = p.x * 0.72;
      let y = p.y * 1.4;
      // the back of the skull swept back, like a man's, not an egg
      let z = p.z * (p.z < 0 ? 1.3 : 1.05) - Math.max(0, p.y) * 0.25;
      x *= 1 - Math.exp(-((p.y - 0.02) ** 2) / 0.0012) * 0.14;
      const k = 1 + (noise(p.x * 30, p.y * 30, p.z * 30) - 0.5) * 0.08;
      x *= k;
      y *= k;
      z *= k;
      // the face is carved into the front of it: deep sockets, hollow cheeks, a long mouth
      if (z > 0) {
        const hy = y + 0.06;
        const g = (cx: number, cy: number, sx: number, sy: number) => Math.exp(-((x - cx) ** 2) / (2 * sx * sx) - ((hy - cy) ** 2) / (2 * sy * sy));
        const dent =
          (g(-0.03, 0.075, 0.016, 0.014) + g(0.031, 0.072, 0.014, 0.013)) * 0.04 +
          (g(-0.05, 0.02, 0.014, 0.03) + g(0.05, 0.02, 0.014, 0.03)) * 0.014 +
          g(0, -0.035, 0.022, 0.04) * 0.05;
        z -= dent * Math.min(1, z / 0.04);
      }
      sp.setXYZ(i, x, y, z);
    }
    skull.computeVertexNormals();
    mesh(skull, SKIN, head).position.set(0, 0.06, 0);
    // in the sockets: nothing, a black that does not reflect the torch
    for (const [side, s] of [
      [-1, 1],
      [1, 0.85],
    ] as const) {
      const pit = new Mesh(new SphereGeometry(0.02 * s, 12, 10), HOLLOW);
      pit.scale.set(1, 0.95, 0.6);
      pit.position.set(side * 0.03, 0.074, 0.062);
      head.add(pit);
    }
    // no nose: two slits
    for (const side of [-1, 1]) {
      const slit = new Mesh(new SphereGeometry(0.006, 6, 6), HOLLOW);
      slit.scale.set(0.6, 2, 0.6);
      slit.position.set(side * 0.007, 0.035, 0.094);
      head.add(slit);
    }
    // the jaw: hinged under the ears, hanging open, a black mouth with a few long teeth
    this.jaw = joint(head, 0, -0.01, -0.01);
    this.jaw.rotation.x = 0.55;
    mesh(
      sweep([v(-0.055, 0, -0.01), v(-0.05, -0.08, 0.04), v(0, -0.115, 0.085), v(0.05, -0.08, 0.04), v(0.055, 0, -0.01)], [0.016, 0.02, 0.022, 0.02, 0.016], { seg: 20, rad: 8, lumps: 0.15 }),
      SKIN,
      this.jaw,
    );
    const mouth = new Mesh(new SphereGeometry(0.05, 14, 10), HOLLOW);
    mouth.scale.set(0.5, 1.2, 0.5);
    mouth.position.set(0, -0.03, 0.04);
    head.add(mouth);
    // too many teeth, thin and uneven, some missing
    for (let i = 0; i < 13; i++) {
      if (hash(i, 9, 9) < 0.2) continue;
      const tooth = new Mesh(new SphereGeometry(0.0032, 6, 6), TOOTH);
      tooth.scale.set(0.8, 3.5 + hash(i, 1, 2) * 3, 0.8);
      const a = (i / 12 - 0.5) * 1.9;
      tooth.position.set(Math.sin(a) * 0.022, -0.004 - Math.abs(Math.sin(a)) * 0.01, 0.06 + Math.cos(a) * 0.006);
      tooth.rotation.z = (hash(i, 3, 3) - 0.5) * 0.4;
      head.add(tooth);
    }
    // a few long strands of hair, lank and wet: something of a person was here
    for (let i = 0; i < 22; i++) {
      const a = -1.3 + (i / 21) * 2.6 + (hash(i, 2, 3) - 0.5) * 0.15;
      const len = 0.3 + hash(i, 4, 1) * 0.35;
      const x0 = Math.sin(a) * 0.07;
      const z0 = -0.01 - Math.cos(a) * 0.05;
      const wob = (k: number) => (hash(i, k, 7) - 0.5) * 0.03;
      const strand = sweep(
        [v(x0, 0.2, z0 + 0.02), v(x0 * 1.25, 0.14, z0 - 0.04), v(x0 * 1.35 + wob(1), 0.12 - len * 0.45, z0 - 0.07 + wob(2)), v(x0 * 1.3 + wob(3), 0.12 - len, z0 - 0.04 + wob(4))],
        [0.0045, 0.004, 0.003, 0.0012],
        { seg: 12, rad: 4, lumps: 0 },
      );
      mesh(strand, HAIR, head);
    }

    // legs: too long, knees like knots, walking on the balls of long feet
    const leg = (x: number) => {
      const hip = joint(pelvis, x, -0.02, 0);
      bone(0.56, 0.06, 0.042, 0.05, hip, 0.02);
      const knee = joint(hip, 0, -0.56, 0);
      knob(0.055, knee, 0, 0, 0.015, 1, 1.15, 1);
      bone(0.56, 0.045, 0.03, 0.035, knee, -0.015);
      const ankle = joint(knee, 0, -0.56, 0);
      ankle.rotation.x = 0.6;
      knob(0.04, ankle, 0, 0, 0, 1.1, 1, 1);
      bone(0.16, 0.035, 0.028, 0.03, ankle, 0.0);
      const ball = joint(ankle, 0, -0.16, 0);
      ball.rotation.x = -1.6;
      for (let i = 0; i < 4; i++) {
        const toe = joint(ball, (i - 1.5) * 0.018, 0, 0);
        toe.rotation.z = (i - 1.5) * 0.08;
        finger(toe, [0.05, 0.04, 0.03].map((l) => l * (1 - Math.abs(i - 1.5) * 0.12)), 0.009, 0.4);
      }
      return { hip, knee };
    };
    const l = leg(-0.1);
    const r = leg(0.1);
    this.hipL = l.hip;
    this.kneeL = l.knee;
    this.hipR = r.hip;
    this.kneeR = r.knee;

    // arms: hanging past the knees
    const arm = (x: number) => {
      const shoulder = joint(this.spine, x, 0.68, 0.0);
      knob(0.045, shoulder, 0, 0, 0, 1.1, 1, 1);
      bone(0.52, 0.04, 0.026, 0.032, shoulder, 0.01);
      const elbow = joint(shoulder, 0, -0.52, 0);
      knob(0.034, elbow, 0, 0, -0.01, 1, 1.2, 1.1);
      bone(0.5, 0.03, 0.02, 0.022, elbow, 0.012);
      const wrist = joint(elbow, 0, -0.5, 0);
      knob(0.025, wrist, 0, 0, 0, 1.3, 0.8, 0.9);
      buildHand(wrist, 1.25);
      return { shoulder, elbow, hand: wrist };
    };
    const al = arm(-0.2);
    const ar = arm(0.2);
    this.shoulderL = al.shoulder;
    this.elbowL = al.elbow;
    this.shoulderR = ar.shoulder;
    this.elbowR = ar.elbow;
    this.reach = ar.hand;
    this.pose(0);
  }

  /**
   * `stride` 0..1 through a step; `look` turns the head (-1..1); `lean` bends it down toward
   * a hiding place (0..1); `crouch` folds it down to look under a bed (0..1).
   */
  pose(stride: number, look = 0, lean = 0, crouch = 0) {
    const s = Math.sin(stride * Math.PI * 2);
    this.hipL.rotation.x = s * 0.3 - crouch * 1.3;
    this.hipR.rotation.x = -s * 0.3 - crouch * 1.3;
    this.kneeL.rotation.x = Math.max(0, -s) * 0.55 + 0.08 + crouch * 2.3;
    this.kneeR.rotation.x = Math.max(0, s) * 0.55 + 0.08 + crouch * 2.3;
    this.spine.rotation.x = 0.3 + lean * 0.5 + crouch * 0.6;
    this.neck.rotation.x = 0.5 - lean * 0.2;
    this.neck.rotation.y = look * 0.7;
    this.neck.rotation.z = look * 0.6;
    this.jaw.rotation.x = 0.55 + lean * 0.2;
    // arms swing a little out of step, hang slightly forward and out
    this.shoulderL.rotation.set(-s * 0.2 - lean * 0.4 - 0.15, 0, -0.08);
    this.shoulderR.rotation.set(s * 0.2 - lean * 0.4 - 0.15, 0, 0.08);
    this.elbowL.rotation.x = -0.25;
    this.elbowR.rotation.x = -0.25;
    // folding at the knees lowers the body
    this.position.y = -crouch * 0.6;
  }
}

/** Its hand coming at the camera: the forearm, the bony palm, the too-long fingers. Lives in camera space. */
export class Hand3D extends Group {
  constructor() {
    super();
    const g = new Group();
    // the hand hangs along -y; turn it so the fingers point at -x, toward the middle of the view
    g.rotation.z = -Math.PI / 2 - 0.15;
    this.add(g);
    const forearm = joint(g, 0, 0.55, 0);
    bone(0.55, 0.035, 0.024, 0.026, forearm, 0.01);
    knob(0.028, g, 0, 0, 0, 1.3, 0.8, 0.9);
    buildHand(g, 1.3);
  }
}
