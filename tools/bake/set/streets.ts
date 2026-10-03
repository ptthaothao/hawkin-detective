import {
  BoxGeometry,
  CatmullRomCurve3,
  CylinderGeometry,
  DoubleSide,
  Group,
  LatheGeometry,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
} from 'three';
import { Batch, V, addLimb, board, deadTree, mat, xf } from './kit';
import { groundMist, terrain, tufts, woods } from './exterior';
import { rng, surfaces } from './surfaces';

/**
 * The dead town of Chapter 1.2, three stops. Each set is built around its own origin with Theo at
 * (0, 1.1, 0) looking toward -z; the bake moves the camera, not the set.
 *   0: the neighbour's house, only its wooden frame left
 *   1: the village road with no lights, a leaning pole, a fallen bicycle
 *   2: the fork at the edge of the woods, where the beam gives out
 */

export interface Station {
  group: Group;
  /** Named boxes in this set's coordinates, for click areas. */
  boxes: Record<string, [Vector3, Vector3]>;
  moon: Vector3;
}


function barkMat() {
  const S = surfaces();
  return new MeshStandardMaterial({ map: S.bark, bumpMap: S.bark, bumpScale: 2.4, roughness: 1, color: 0x9a948c });
}

function roadStrip(x0: number, z0: number, x1: number, z1: number, width: number, yaw: number) {
  const S = surfaces();
  const len = Math.hypot(x1 - x0, z1 - z0);
  const tex = S.road.clone();
  tex.needsUpdate = true;
  tex.repeat.set(width / 2.6, len / 2.6);
  const m = new Mesh(new PlaneGeometry(width, len, 1, 1), new MeshStandardMaterial({ map: tex, bumpMap: tex, bumpScale: 1.4, roughness: 0.85, color: 0xb8bcc4 }));
  m.rotation.x = -Math.PI / 2;
  m.rotation.z = yaw;
  m.position.set((x0 + x1) / 2, 0.012, (z0 + z1) / 2);
  m.receiveShadow = true;
  return m;
}

/** A child's bicycle on its side in the road: frame, two spoked wheels, bars turned, saddle, pedals. */
export function bicycle() {
  const S = surfaces();
  const out = new Group();
  const frameMat = new MeshStandardMaterial({ map: S.rust, bumpMap: S.rust, bumpScale: 1.2, color: 0x7f9a98, metalness: 0.5, roughness: 0.5 });
  const chrome = new MeshStandardMaterial({ color: 0xb4b8bc, metalness: 0.85, roughness: 0.35 });
  const rubber = mat(null, { color: 0x121316, roughness: 0.9 });
  const seatMat = mat(null, { color: 0x1a1816, roughness: 0.8 });
  const b = new Batch();
  const RW = 0.27; // wheel radius (a small bike, a child's)
  const rear = V(-0.4, RW, 0);
  const front = V(0.4, RW, 0);
  const bb = V(-0.02, 0.2, 0);
  const seat = V(-0.14, 0.62, 0);
  const headTop = V(0.28, 0.72, 0);
  const headBot = V(0.3, 0.6, 0);
  addLimb(b, frameMat, bb, seat, 0.014, 0.014, 8);
  addLimb(b, frameMat, seat, headTop, 0.014, 0.014, 8);
  addLimb(b, frameMat, bb, headBot, 0.017, 0.017, 8);
  addLimb(b, frameMat, headBot, headTop, 0.019, 0.019, 8);
  for (const z of [-0.035, 0.035]) {
    addLimb(b, frameMat, bb, rear.clone().setZ(z), 0.01, 0.008, 6);
    addLimb(b, frameMat, seat, rear.clone().setZ(z), 0.008, 0.007, 6);
  }
  // fork, turned a good way round (the bars have swung over as it fell)
  const turn = 0.75;
  const fork = new Group();
  fork.position.copy(headBot.clone().lerp(headTop, 0.5));
  fork.rotation.set(0, turn, 0);
  const fb = new Batch();
  const local = (v: Vector3) => v.clone().sub(fork.position);
  for (const z of [-0.04, 0.04]) addLimb(fb, chrome, local(headBot.clone().setZ(0)), local(front.clone().setZ(z)), 0.011, 0.008, 6);
  addLimb(fb, chrome, local(headTop), local(headTop).add(V(-0.02, 0.1, 0)), 0.012, 0.012, 8);
  // handlebars: a swept tube with rubber grips and a bell
  const bar = new CatmullRomCurve3([V(0, 0.0, 0.28), V(0.02, 0.0, 0.15), V(0.0, 0.0, 0.0), V(0.02, 0.0, -0.15), V(0, 0.0, -0.28), V(-0.05, 0.05, -0.31)]);
  const barMesh = new Mesh(new TubeGeometry(bar, 20, 0.011, 6), chrome);
  barMesh.position.copy(local(headTop).add(V(-0.02, 0.1, 0)));
  barMesh.castShadow = true;
  fork.add(fb.group(), barMesh);
  const grip = new Mesh(new CylinderGeometry(0.016, 0.016, 0.1, 8), rubber);
  grip.rotation.x = Math.PI / 2;
  grip.position.copy(barMesh.position).add(V(-0.01, 0.01, 0.25));
  fork.add(grip);
  const grip2 = grip.clone();
  grip2.position.z = barMesh.position.z - 0.25;
  fork.add(grip2);
  out.add(fork);
  // seat post and saddle
  addLimb(b, chrome, seat, seat.clone().add(V(-0.01, 0.09, 0)), 0.011, 0.011, 8);
  const saddle = new Mesh(new BoxGeometry(0.26, 0.05, 0.14, 4, 2, 3), seatMat);
  const sp = saddle.geometry.getAttribute('position');
  for (let i = 0; i < sp.count; i++) {
    const x = sp.getX(i);
    sp.setZ(i, sp.getZ(i) * (x > 0 ? 0.45 + (0.13 - x) * 1.5 : 1));
    sp.setY(i, sp.getY(i) + (x < 0 ? 0.0 : 0.03 * x * -1));
  }
  saddle.geometry.computeVertexNormals();
  saddle.position.copy(seat).add(V(0.0, 0.115, 0));
  saddle.castShadow = true;
  out.add(saddle);
  // wheels
  for (const [c, name] of [[rear, 'r'], [front, 'f']] as const) {
    const w = new Group();
    w.position.copy(c);
    const tire = new Mesh(new TorusGeometry(RW, 0.022, 10, 36), rubber);
    tire.castShadow = true;
    const rim = new Mesh(new TorusGeometry(RW - 0.026, 0.008, 6, 36), chrome);
    w.add(tire, rim);
    const sb = new Batch();
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      const side = i % 2 ? 0.015 : -0.015;
      addLimb(sb, chrome, V(0, 0, side), V(Math.cos(a + 0.2) * (RW - 0.03), Math.sin(a + 0.2) * (RW - 0.03), 0), 0.0014, 0.0014, 3);
    }
    const hub = new Mesh(new CylinderGeometry(0.02, 0.02, 0.07, 10), chrome);
    hub.rotation.x = Math.PI / 2;
    w.add(sb.group(false), hub);
    // the back wheel is bent: a tacoed rim
    if (name === 'r') {
      w.rotation.x = 0.0;
      w.scale.set(1, 1, 1);
      w.rotation.y = 0.12;
    }
    out.add(w);
  }
  // chainring, crank and pedals
  const ring = new Mesh(new TorusGeometry(0.05, 0.006, 6, 20), chrome);
  ring.position.copy(bb).add(V(0, 0, 0.045));
  out.add(ring);
  addLimb(b, chrome, bb.clone().add(V(0, 0, 0.05)), bb.clone().add(V(0.05, -0.14, 0.055)), 0.007, 0.007, 5);
  addLimb(b, chrome, bb.clone().add(V(0, 0, -0.05)), bb.clone().add(V(-0.05, 0.14, -0.055)), 0.007, 0.007, 5);
  b.add(new BoxGeometry(0.09, 0.016, 0.04), rubber, xf(bb.x + 0.05, bb.y - 0.14, bb.z + 0.09));
  b.add(new BoxGeometry(0.09, 0.016, 0.04), rubber, xf(bb.x - 0.05, bb.y + 0.14, bb.z - 0.09));
  // a rear fender, half off
  const fender = new Mesh(new TorusGeometry(RW + 0.04, 0.008, 4, 24, Math.PI * 0.8), frameMat);
  fender.scale.z = 4;
  fender.position.copy(rear);
  fender.rotation.z = 0.5;
  out.add(fender);
  out.add(b.group());
  return out;
}

function pole(h: number, lean: number, seed: number) {
  const S = surfaces();
  const g = new Group();
  const wood = new MeshStandardMaterial({ map: S.timber, bumpMap: S.timber, bumpScale: 2, color: 0x8a847a, roughness: 1 });
  const b = new Batch();
  addLimb(b, wood, V(0, 0, 0), V(0, h, 0), 0.15, 0.1, 12);
  b.add(board(1.9, 0.1, 0.1, seed, 0.6), wood, xf(0, h - 0.3, 0));
  b.add(board(1.1, 0.07, 0.07, seed + 1, 0.6), wood, xf(0, h - 1.1, 0));
  // braces
  addLimb(b, wood, V(0, h - 0.7, 0), V(0.75, h - 0.3, 0), 0.03, 0.03, 5);
  addLimb(b, wood, V(0, h - 0.7, 0), V(-0.75, h - 0.3, 0), 0.03, 0.03, 5);
  g.add(b.group());
  const glass = new MeshStandardMaterial({ color: 0x5a7a74, roughness: 0.2, metalness: 0.1 });
  for (const x of [-0.8, -0.3, 0.3, 0.8]) {
    const ins = new Mesh(new LatheGeometry([new Vector2(0.01, 0), new Vector2(0.04, 0.02), new Vector2(0.03, 0.06), new Vector2(0.05, 0.09), new Vector2(0.015, 0.11)], 10), glass);
    ins.position.set(x, h - 0.25, 0);
    ins.castShadow = true;
    g.add(ins);
  }
  g.rotation.z = lean;
  return g;
}

function wire(from: Vector3, to: Vector3, sag: number) {
  const mid = from.clone().lerp(to, 0.5).add(V(0, -sag, 0));
  const c = new CatmullRomCurve3([from, from.clone().lerp(mid, 0.5).add(V(0, -sag * 0.3, 0)), mid, mid.clone().lerp(to, 0.5).add(V(0, -sag * 0.3, 0)), to]);
  const m = new Mesh(new TubeGeometry(c, 30, 0.012, 4), new MeshStandardMaterial({ color: 0x0a0c0e, roughness: 0.5, metalness: 0.4 }));
  m.castShadow = true;
  return m;
}

const gen = (cond: (x: number, z: number) => boolean) => cond;

// ---------------------------------------------------------------------------------------- 0: the frame

export function stationFrame(): Station {
  const S = surfaces();
  const g = new Group();
  const boxes: Station['boxes'] = {};
  const road = (_x: number, z: number) => (z > -1.2 && z < 4 ? 1 : 0);
  g.add(terrain(0, -20, 90, 220, (x, z) => Math.max(road(x, z), Math.abs(x) < 2.0 && z < -5 && z > -10.5 ? 0.7 : 0), (_x, z) => (z > -1.2 && z < 4 ? 1 : 0)));
  g.add(roadStrip(-40, 1.4, 40, 1.4, 5.2, Math.PI / 2));
  g.add(tufts(4200, -22, 24, -26, 0.8, gen((_x, z) => !(z > -1.4 && z < 4.2)), 11, 0.5));

  const timber = new MeshStandardMaterial({ map: S.timber, bumpMap: S.timber, bumpScale: 2.2, color: 0xa9a294, roughness: 1 });
  const dark = new MeshStandardMaterial({ map: S.darkPlanks, bumpMap: S.darkPlanks, bumpScale: 2.2, color: 0x948d82, roughness: 1 });
  const stone = mat(S.brick, { color: 0x72746f, bump: 1.6, roughness: 1 });
  const r = rng(808);
  const b = new Batch();
  const X0 = -3.4;
  const X1 = 3.4;
  const ZF = -11;
  const ZB = -16.5;
  const FY = 0.55; // floor height
  const WH = 2.5;
  // footing stones and the sill beam
  for (let x = X0; x <= X1; x += 1.7) for (const z of [ZF, (ZF + ZB) / 2, ZB]) b.add(new BoxGeometry(0.5, FY, 0.5), mat(S.brick, { color: 0x6e706a, bump: 1.6, roughness: 1 }), xf(x + (r() - 0.5) * 0.1, FY / 2 - 0.05, z, r() * 0.3));
  b.add(board(X1 - X0 + 0.2, 0.2, 0.2, 1, 1), dark, xf(0, FY + 0.0, ZF));
  b.add(board(X1 - X0 + 0.2, 0.2, 0.2, 2, 1), dark, xf(0, FY, ZB));
  b.add(board(ZF - ZB, 0.2, 0.2, 3, 1), dark, xf(X0, FY, (ZF + ZB) / 2, Math.PI / 2));
  b.add(board(ZF - ZB, 0.2, 0.2, 4, 1), dark, xf(X1, FY, (ZF + ZB) / 2, Math.PI / 2));
  // floor joists, half of them sagging, the deck boards that are left
  for (let x = X0 + 0.3; x < X1; x += 0.6) b.add(board(ZF - ZB, 0.16, 0.06, Math.floor(r() * 1e6), 1.4), dark, xf(x, FY + 0.12 - (r() < 0.2 ? 0.1 : 0), (ZF + ZB) / 2, Math.PI / 2, 0, 0, 1));
  for (let i = 0; i < 18; i++) {
    if (r() < 0.5) continue;
    const z = ZF - 0.1 - r() * 5;
    b.add(board(1.2 + r() * 1.8, 0.14, 0.03, Math.floor(r() * 1e6), 1.8), timber, xf(X0 + 0.6 + r() * (X1 - X0 - 1.2), FY + 0.23, z, r() * 0.1, 0, (r() - 0.5) * 0.06));
  }
  // the front wall: studs every 40cm, a doorway, some leaning, some snapped, none with a window
  const door0 = -0.5;
  const door1 = 0.5;
  for (let x = X0; x <= X1 + 0.01; x += 0.4) {
    if (x > door0 && x < door1) continue;
    const roll = r();
    if (roll < 0.1) continue;
    const h = roll < 0.28 ? WH * (0.35 + r() * 0.45) : WH;
    const lean = roll < 0.4 ? (r() - 0.5) * 0.16 : (r() - 0.5) * 0.02;
    b.add(board(h, 0.09, 0.06, Math.floor(r() * 1e6), 1.3), timber, xf(x, FY + 0.1 + h / 2, ZF, 0, 0, Math.PI / 2 + lean));
  }
  // door jambs and a header, hanging
  for (const x of [door0, door1]) b.add(board(2.1, 0.1, 0.08, Math.floor(r() * 1e6), 0.8), timber, xf(x, FY + 1.2, ZF, 0, 0, Math.PI / 2));
  b.add(board(1.2, 0.12, 0.08, 91, 1), timber, xf(0.1, FY + 2.25, ZF, 0, 0, 0.12));
  // plates and braces
  b.add(board(3.4, 0.09, 0.09, 92, 1.3), timber, xf(-1.8, FY + WH + 0.15, ZF));
  b.add(board(2.1, 0.09, 0.09, 93, 1.3), timber, xf(2.35, FY + WH + 0.18, ZF, 0, 0, -0.05));
  b.add(board(2.4, 0.07, 0.06, 94, 1.3), timber, xf(-2.2, FY + 1.25, ZF - 0.01, 0, 0, 0.7));
  b.add(board(2.4, 0.07, 0.06, 95, 1.3), timber, xf(2.2, FY + 1.25, ZF - 0.01, 0, 0, -0.7));
  b.add(board(0.9, 0.09, 0.06, 96, 1.3), timber, xf(-1.1, FY + 1.5, ZF, 0, 0, 0.0));
  // side and back walls, only partly there
  for (const [wx, wz, wlen] of [[X0, 0, 0] as const, [X1, 0, 0] as const]) {
    void wlen;
    for (let z = ZF - 0.4; z > ZB; z -= 0.4) {
      if (r() < 0.25) continue;
      const h = r() < 0.4 ? WH * (0.4 + r() * 0.5) : WH;
      b.add(board(h, 0.09, 0.06, Math.floor(r() * 1e6), 1.3), timber, xf(wx + wz, FY + 0.1 + h / 2, z, Math.PI / 2, 0, Math.PI / 2 + (r() - 0.5) * 0.08));
    }
  }
  for (let x = X0 + 0.4; x < X1; x += 0.4) {
    if (r() < 0.2) continue;
    const h = r() < 0.4 ? WH * (0.5 + r() * 0.4) : WH;
    b.add(board(h, 0.09, 0.06, Math.floor(r() * 1e6), 1.3), timber, xf(x, FY + 0.1 + h / 2, ZB, 0, 0, Math.PI / 2 + (r() - 0.5) * 0.06));
  }
  // rafters: pairs meeting at a ridge, a few down, one fallen across the joists
  const ridgeY = FY + WH + 1.7;
  for (let z = ZF; z >= ZB - 0.01; z -= 1.1) {
    for (const side of [-1, 1]) {
      if (r() < 0.2) continue;
      const a = V(side * 3.55, FY + WH + 0.2, z);
      const c = V(0, ridgeY, z);
      const broken = r() < 0.3;
      const mid = a.clone().lerp(c, broken ? 0.5 + r() * 0.2 : 1);
      addLimb(b, timber, a, mid, 0.05, 0.045, 5);
      if (broken) addLimb(b, dark, mid, mid.clone().add(V(side * 0.2, -0.9, 0.1)), 0.045, 0.04, 5);
    }
  }
  b.add(board(ZF - ZB, 0.1, 0.07, 97, 1.5), timber, xf(0, ridgeY, (ZF + ZB) / 2 + 0.6, Math.PI / 2));
  // the ridge board has come down at one end and lies on the deck
  b.add(board(2.6, 0.1, 0.07, 98, 1.5), dark, xf(-1.0, FY + 0.35, ZF - 3.2, 0.5, 0, 0.18));
  // steps to nothing, a doorstep stone
  b.add(new BoxGeometry(1.1, 0.2, 0.5), stone, xf(0, 0.1, ZF + 0.65, 0.03));
  b.add(new BoxGeometry(1.3, 0.2, 0.5), stone, xf(0.04, 0.34, ZF + 0.28, -0.03));
  g.add(b.group());
  // chimney: brick stack with a fireplace mouth at its foot, top ragged
  const chim = new Mesh(new BoxGeometry(1.1, 6.2, 0.9, 1, 1, 1), mat(S.brick, { color: 0x8a8680, bump: 2, roughness: 1 }));
  chim.position.set(3.2, 3.05, ZB - 0.45);
  chim.castShadow = true;
  chim.receiveShadow = true;
  g.add(chim);
  const cap = new Mesh(new BoxGeometry(0.8, 0.4, 0.7), stone);
  cap.position.set(3.15, 6.3, ZB - 0.45);
  cap.rotation.z = 0.2;
  g.add(cap);
  // beyond the frame: the dark where rooms were
  const back = new Mesh(new PlaneGeometry(8, 3.4), new MeshStandardMaterial({ color: 0x090b0f, roughness: 1 }));
  back.position.set(0, FY + 1.7, ZB - 0.2);
  g.add(back);
  // front garden: leaning picket stumps, a mailbox on a post, a dead tree
  const fenceB = new Batch();
  const wood = mat(S.planks, { color: 0xa8a396, bump: 1.8, roughness: 1 });
  for (let x = -8; x <= 8; x += 0.28) {
    if (Math.abs(x) < 1.2 || r() < 0.3) continue;
    const h = 0.55 + r() * 0.3;
    fenceB.add(board(h, 0.1, 0.025, Math.floor(r() * 1e6), 2), wood, xf(x, h / 2, -7.4 + (r() - 0.5) * 0.1, 0, 0, Math.PI / 2 + (r() - 0.5) * (r() < 0.2 ? 0.7 : 0.1)));
  }
  g.add(fenceB.group());
  const mail = new Group();
  const post = new Batch();
  addLimb(post, timber, V(0, 0, 0), V(0, 1.15, 0), 0.05, 0.04, 8);
  mail.add(post.group());
  const box = new Mesh(new CylinderGeometry(0.11, 0.11, 0.42, 14, 1, false, 0, Math.PI), new MeshStandardMaterial({ map: S.rust, bumpMap: S.rust, bumpScale: 1.5, roughness: 0.55, metalness: 0.5, color: 0xa09890, side: DoubleSide }));
  box.rotation.z = Math.PI / 2;
  box.rotation.x = Math.PI;
  box.position.set(0, 1.22, 0);
  box.castShadow = true;
  mail.add(box);
  const bot = new Mesh(new BoxGeometry(0.42, 0.012, 0.22), mat(S.rust, { bump: 1.5, metalness: 0.5, roughness: 0.6 }));
  bot.position.set(0, 1.22, 0);
  mail.add(bot);
  const door = new Mesh(new PlaneGeometry(0.2, 0.2), mat(S.rust, { bump: 1.5, metalness: 0.5, roughness: 0.6 }));
  door.position.set(0.215, 1.2, 0);
  door.rotation.y = Math.PI / 2 - 0.6;
  mail.add(door);
  mail.position.set(-2.4, 0, -5.8);
  mail.rotation.z = 0.12;
  mail.rotation.y = 0.5;
  g.add(mail);
  const tb = new Batch();
  deadTree(tb, barkMat(), -7.5, -10, 8, 51);
  deadTree(tb, barkMat(), 8.5, -12, 6.5, 52);
  deadTree(tb, barkMat(), -12, -7, 7, 53);
  g.add(tb.group());
  g.add(woods(-30, 32, -48, -22, 70, 61, () => false, [0, -10]));
  g.add(woods(-34, -14, -22, 0, 12, 62, () => false, [0, -10]));
  g.add(woods(14, 36, -22, -2, 12, 63, () => false, [0, -10]));
  g.add(groundMist(0, -14, 70));
  boxes.onward = [V(-3.9, 0, -17), V(3.9, 5, -10.5)];
  boxes.frame = [V(-3.9, 0, -17), V(3.9, 5, -10.5)];
  return { group: g, boxes, moon: V(0.55, 0.62, -0.55) };
}

// ---------------------------------------------------------------------------------------- 1: the road

export function stationRoad(): Station {
  const S = surfaces();
  const g = new Group();
  const boxes: Station['boxes'] = {};
  g.add(terrain(0, -30, 120, 240, (x) => (Math.abs(x) < 2.6 ? 1 : 0), (x) => (Math.abs(x) < 2.4 ? 1 : 0)));
  g.add(roadStrip(0, 10, 0, -80, 4.8, 0));
  // faint centre line, mostly worn through
  const line = new Batch();
  const chalk = mat(null, { color: 0x8a8c86, roughness: 1 });
  const r = rng(909);
  for (let z = 8; z > -70; z -= 3) if (r() < 0.55) line.add(new BoxGeometry(0.12, 0.004, 1.6), chalk, xf(0, 0.02, z));
  g.add(line.group(false));
  g.add(tufts(7000, -24, 24, -60, 6, gen((x) => Math.abs(x) > 2.7), 21, 0.5));
  // road-edge gravel and a drainage ditch on each side
  const ditch = new Batch();
  const dirt = mat(S.earth, { color: 0x58554c, bump: 2, roughness: 1 });
  for (const s of [-1, 1]) for (let z = 6; z > -70; z -= 2.2) ditch.add(new BoxGeometry(0.5 + r() * 0.6, 0.06, 2.4), dirt, xf(s * (2.55 + r() * 0.4), 0.0, z, (r() - 0.5) * 0.3));
  g.add(ditch.group(false));
  // the bicycle: lying in the road shoulder, bars twisted, a wheel still turned up
  const bike = bicycle();
  bike.rotation.set(Math.PI / 2 + 0.12, 0.5, 0.0, 'XYZ');
  bike.rotation.order = 'YXZ';
  bike.rotation.set(Math.PI / 2 - 0.06, -0.45, 0);
  bike.position.set(0.95, 0.03, -2.7);
  g.add(bike);
  // poles: one near and leaning hard, the line running off into the fog
  const wires = new Group();
  const poles: Vector3[] = [];
  const spots: [number, number, number, number][] = [
    [-3.3, -5.5, 0.12, 6.4],
    [-3.6, -26, 0.03, 6.8],
    [-3.2, -50, -0.05, 6.6],
    [-3.3, -76, 0.0, 6.5],
  ];
  spots.forEach(([x, z, lean, h], i) => {
    const p = pole(h, lean, 1000 + i);
    p.position.set(x, 0, z);
    g.add(p);
    poles.push(V(x - Math.sin(lean) * (h - 0.3), h - 0.3 * Math.cos(lean), z));
  });
  for (let i = 0; i < poles.length - 1; i++)
    for (const dx of [-0.8, 0.8, 0.3]) {
      const a = poles[i].clone().add(V(dx, 0, 0));
      const c = poles[i + 1].clone().add(V(dx, 0, 0));
      wires.add(wire(a, c, i === 0 ? 1.4 : 0.8));
    }
  // a wire that has come down from the first pole and lies across the road's edge
  const downTo = V(-1.6, 0.04, -9);
  const sag = new CatmullRomCurve3([poles[0].clone().add(V(0.8, 0, 0)), V(-2.9, 4.5, -6.4), V(-2.4, 1.2, -7.4), V(-2, 0.05, -8.2), downTo, V(-0.8, 0.02, -9.6)]);
  wires.add(new Mesh(new TubeGeometry(sag, 40, 0.012, 4), new MeshStandardMaterial({ color: 0x0a0c0e, roughness: 0.5, metalness: 0.4 })));
  g.add(wires);
  // dead trees along both sides, nearer ones taller
  const tb = new Batch();
  const trees = new Batch();
  const bark = barkMat();
  for (let i = 0; i < 40; i++) {
    const side = i % 2 ? 1 : -1;
    const z = 2 - i * 1.9 - r() * 2;
    const x = side * (5 + r() * 14);
    deadTree(i < 14 ? tb : trees, bark, x, z, 6 + r() * 8, 1100 + i);
  }
  g.add(tb.group(true), trees.group(false));
  g.add(woods(-50, 50, -95, -70, 60, 71, () => false, [0, -10]));
  // a field fence on the right, picket-less, and a mailbox post gone to a stump
  const fb = new Batch();
  const wood = mat(S.timber, { color: 0xa09a8c, bump: 1.8, roughness: 1 });
  for (let z = 4; z > -40; z -= 2.3) {
    const lean = (r() - 0.5) * 0.35;
    fb.add(board(1.3, 0.1, 0.1, Math.floor(r() * 1e6), 1.6), wood, xf(5.1, 0.6, z, 0, 0, Math.PI / 2 + lean));
    if (r() < 0.8) fb.add(board(2.35, 0.08, 0.04, Math.floor(r() * 1e6), 1.6), wood, xf(5.1, 0.9 + (r() - 0.5) * 0.2, z - 1.15, Math.PI / 2, 0, (r() - 0.5) * 0.1));
  }
  g.add(fb.group());
  g.add(groundMist(0, -25, 100));
  boxes.onward = [V(-2.4, 0, -60), V(2.4, 3, -8)];
  return { group: g, boxes, moon: V(-0.25, 0.6, -0.75) };
}

// ---------------------------------------------------------------------------------------- 2: the fork

export function stationFork(): Station {
  const S = surfaces();
  const g = new Group();
  const boxes: Station['boxes'] = {};
  // the road comes in from behind the camera, forks left and right at the trees
  const onRoad = (x: number, z: number) => {
    if (Math.abs(x) < 2.4 && z > -12) return 1;
    if (z < -10.8 && z > -15.6 && Math.abs(x) > 1.5 && Math.abs(x) < 24) return 1;
    return 0;
  };
  g.add(terrain(0, -20, 100, 250, onRoad, (x, z) => onRoad(x, z) * 0.9));
  g.add(roadStrip(0, 6, 0, -13.5, 4.8, 0));
  g.add(roadStrip(-12, -13.2, -0.2, -13.2, 4.4, Math.PI / 2));
  g.add(roadStrip(0.2, -13.2, 12, -13.2, 4.4, Math.PI / 2));
  g.add(tufts(6000, -22, 22, -30, 4, gen((x, z) => !onRoad(x, z)), 31, 0.5));
  // the wall of trees: a close ring of dead trunks, the beam gets a few metres into it
  const bark = barkMat();
  const r = rng(1313);
  const near = new Batch();
  const far = new Batch();
  for (let i = 0; i < 90; i++) {
    const x = (r() - 0.5) * 60;
    const z = -16.5 - r() * 22;
    if (Math.abs(x) < 0.8) continue;
    deadTree(z > -26 ? near : far, bark, x, z, 7 + r() * 8, 1400 + i);
  }
  for (let i = 0; i < 16; i++) {
    const side = i % 2 ? 1 : -1;
    deadTree(near, bark, side * (5 + r() * 18), 2 - i * 1.2 - r() * 4, 6 + r() * 5, 1500 + i);
  }
  g.add(near.group(true), far.group(false));
  // a signpost at the fork with blank boards turned every way
  const sign = new Batch();
  const wood = mat(S.timber, { color: 0xaaa496, bump: 1.8, roughness: 1 });
  const dark = mat(S.darkPlanks, { color: 0x9a948a, bump: 1.8, roughness: 1 });
  addLimb(sign, wood, V(0, 0, 0), V(0.04, 2.5, 0), 0.07, 0.06, 8);
  sign.add(board(1.1, 0.2, 0.035, 1601, 1), dark, xf(0.04, 2.25, 0.07, -0.5, 0, 0.05));
  sign.add(board(1.0, 0.18, 0.035, 1602, 1), dark, xf(0.04, 1.9, -0.07, 2.3, 0, -0.04));
  sign.add(board(0.9, 0.18, 0.035, 1603, 1), dark, xf(0.04, 1.55, 0.07, -0.3, 0, 0.1));
  const sp = new Group();
  sp.add(sign.group());
  sp.position.set(1.7, 0, -6.6);
  sp.rotation.z = -0.04;
  g.add(sp);
  // stones and a rusted drum by the verge
  const drum = new Mesh(new CylinderGeometry(0.3, 0.3, 0.75, 16, 1, true), new MeshStandardMaterial({ map: S.rust, bumpMap: S.rust, bumpScale: 2, color: 0xaa9a8c, metalness: 0.55, roughness: 0.55, side: DoubleSide }));
  drum.position.set(-3.7, 0.3, -7.2);
  drum.rotation.set(0.1, 0.4, Math.PI / 2 - 0.2);
  drum.castShadow = true;
  g.add(drum);
  // the little path that leads on into the trees, straight ahead
  const path = new Mesh(new PlaneGeometry(1.1, 12), new MeshStandardMaterial({ map: S.earth, color: 0x6a665a, roughness: 1 }));
  path.rotation.x = -Math.PI / 2;
  path.position.set(0.1, 0.014, -21.5);
  g.add(path);
  g.add(groundMist(0, -14, 70, [[0.1, 0.4], [0.35, 0.3], [0.65, 0.22], [1.0, 0.14]]));
  boxes.home = [V(-8, 0, 1), V(-1.5, 3, 4)];
  boxes.forward = [V(-1.2, 0, -26), V(1.2, 3, -13)];
  return { group: g, boxes, moon: V(0.2, 0.55, -0.8) };
}
