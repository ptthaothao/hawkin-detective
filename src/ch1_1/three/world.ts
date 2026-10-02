import {
  BoxGeometry,
  Color,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  PointLight,
  SphereGeometry,
  SpotLight,
  type Material,
  type Texture,
} from 'three';
import { readout, textures } from './textures';

/*
 * The house and the yard in metres. Theo's room: floor y=0, x from -2 (left wall) to 2 (right wall),
 * z from 0.9 (behind the player) to -3.5 (the window wall). The layout follows Chapter 0:
 * bed on the left under the clock, window in the middle, desk and radio on the right,
 * the door on the right wall. The hallway runs from the door along +x to the back door at x=8,
 * the yard beyond it, and the old garage across the yard.
 */

export const ROOM = { x0: -2, x1: 2, z0: -3.5, z1: 0.9, h: 2.6 };
export const DOOR = { z0: -1.7, z1: -0.9, h: 2.0 };
export const HALL = { x1: 8, z0: -1.95, z1: -0.65, h: 2.4 };
export const GARAGE = { x: 18.5, z: -1.3, w: 5, d: 6, h: 3 };

const std = (o: { color?: number; map?: Texture; roughness?: number; metalness?: number; emissive?: number; emissiveIntensity?: number }) =>
  new MeshStandardMaterial({ roughness: 0.85, metalness: 0, ...o, color: o.color ?? 0xffffff });

function box(w: number, h: number, d: number, mat: Material, x: number, y: number, z: number, parent: Object3D, shadow = true): Mesh {
  const m = new Mesh(new BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = shadow;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

function cyl(r: number, h: number, mat: Material, x: number, y: number, z: number, parent: Object3D, seg = 16): Mesh {
  const m = new Mesh(new CylinderGeometry(r, r, h, seg), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

/** A thin invisible box used only for clicking. */
function hitBox(w: number, h: number, d: number, x: number, y: number, z: number, parent: Object3D, action: string): Mesh {
  const m = new Mesh(new BoxGeometry(w, h, d), new MeshBasicMaterial({ visible: false }));
  m.position.set(x, y, z);
  m.userData.action = action;
  parent.add(m);
  return m;
}

export interface World {
  root: Group;
  wallMat: MeshStandardMaterial;
  paper1986: Texture;
  paper1920: Texture;
  doorPivot: Group;
  clockHands: { hour: Object3D; minute: Object3D };
  radio: { setOn(on: boolean, surge: number): void; tx: Mesh; light: PointLight };
  torch: Group;
  micOnDesk: Group;
  micOnFloor: Group;
  wardrobeDoors: [Group, Group];
  louvres: Group;
  candle: { light: PointLight; flame: Mesh };
  moon: DirectionalLight;
  hallMoon: SpotLight;
  garageMoon: SpotLight;
  doorMist: Mesh;
  watch: Mesh;
  hits: Record<'torch' | 'door' | 'radio' | 'wardrobe' | 'bed', Mesh>;
  /** Where each hit target's label should float. */
  anchors: Record<'torch' | 'door' | 'radio' | 'wardrobe' | 'bed', Object3D>;
}

export function buildWorld(): World {
  const T = textures();
  const root = new Group();
  const wallMat = std({ map: T.wallpaper, roughness: 0.95 });
  const floorMat = std({ map: T.floor, roughness: 0.7 });
  const wood = std({ map: T.wood, roughness: 0.6 });
  const darkWood = std({ map: T.darkWood, roughness: 0.65 });
  const trim = std({ color: 0x5a4632, roughness: 0.6 });
  const metal = std({ color: 0x8a8a84, roughness: 0.35, metalness: 0.6 });
  const metalDark = std({ color: 0x3a3a38, roughness: 0.5, metalness: 0.4 });
  const brass = std({ color: 0xa88a4a, roughness: 0.3, metalness: 0.8 });
  const ceilingMat = std({ color: 0x6a6252, roughness: 1 });

  // ---------- Theo's room ----------
  const { x0, x1, z0, z1, h } = ROOM;
  const W = x1 - x0;
  const D = z1 - z0;
  box(W, 0.02, D, floorMat, 0, -0.01, (z0 + z1) / 2, root, false);
  box(W, 0.02, D, ceilingMat, 0, h, (z0 + z1) / 2, root);
  // back wall with the window hole (x -0.7..0.7, y 1.0..2.1)
  box(1.3, h, 0.1, wallMat, -1.35, h / 2, z0 - 0.05, root);
  box(1.3, h, 0.1, wallMat, 1.35, h / 2, z0 - 0.05, root);
  box(1.4, 1.0, 0.1, wallMat, 0, 0.5, z0 - 0.05, root);
  box(1.4, h - 2.1, 0.1, wallMat, 0, 2.1 + (h - 2.1) / 2, z0 - 0.05, root);
  // left wall, front wall
  box(0.1, h, D, wallMat, x0 - 0.05, h / 2, (z0 + z1) / 2, root);
  box(W, h, 0.1, wallMat, 0, h / 2, z1 + 0.05, root);
  // right wall with the door hole (z -1.7..-0.9, h 2.0)
  box(0.1, h, DOOR.z0 - z0, wallMat, x1 + 0.05, h / 2, (z0 + DOOR.z0) / 2, root);
  box(0.1, h, z1 - DOOR.z1, wallMat, x1 + 0.05, h / 2, (DOOR.z1 + z1) / 2, root);
  box(0.1, h - DOOR.h, DOOR.z1 - DOOR.z0, wallMat, x1 + 0.05, DOOR.h + (h - DOOR.h) / 2, (DOOR.z0 + DOOR.z1) / 2, root);
  // skirting boards
  box(W, 0.12, 0.02, trim, 0, 0.06, z0 + 0.01, root, false);
  box(0.02, 0.12, D, trim, x0 + 0.01, 0.06, (z0 + z1) / 2, root, false);

  // window: frame, dark glass, half-closed blinds that stripe the moonlight
  const frameMat = std({ color: 0x6a5640, roughness: 0.6 });
  box(1.5, 0.08, 0.14, frameMat, 0, 0.98, z0, root);
  box(1.5, 0.08, 0.14, frameMat, 0, 2.12, z0, root);
  box(0.08, 1.2, 0.14, frameMat, -0.73, 1.55, z0, root);
  box(0.08, 1.2, 0.14, frameMat, 0.73, 1.55, z0, root);
  box(0.05, 1.1, 0.06, frameMat, 0, 1.55, z0, root);
  const glass = new Mesh(new PlaneGeometry(1.4, 1.1), new MeshBasicMaterial({ color: 0x22324a, transparent: true, opacity: 0.6 }));
  glass.position.set(0, 1.55, z0 - 0.02);
  root.add(glass);
  const slatMat = std({ color: 0xb8b4a8, roughness: 0.5 });
  for (let i = 0; i < 16; i++) {
    const s = box(1.38, 0.006, 0.045, slatMat, 0, 2.06 - i * 0.042, z0 + 0.08, root);
    s.rotation.x = 0.45;
  }
  // curtains
  const curtain = std({ color: 0x4a1e1a, roughness: 1 });
  box(0.3, 1.5, 0.05, curtain, -0.9, 1.4, z0 + 0.1, root);
  box(0.3, 1.5, 0.05, curtain, 0.9, 1.4, z0 + 0.1, root);

  // wall clock above the bed, as in Chapter 0
  const clock = new Group();
  clock.position.set(-1.4, 2.0, z0 + 0.02);
  root.add(clock);
  const face = new Mesh(new CylinderGeometry(0.17, 0.17, 0.03, 32), std({ color: 0xd8d0bc }));
  face.rotation.x = Math.PI / 2;
  clock.add(face);
  const rim = new Mesh(new CylinderGeometry(0.19, 0.19, 0.025, 32), std({ color: 0x2a2620 }));
  rim.rotation.x = Math.PI / 2;
  rim.position.z = -0.006;
  clock.add(rim);
  const hand = (len: number, w: number) => {
    const pivot = new Group();
    pivot.position.z = 0.02;
    const m = new Mesh(new BoxGeometry(w, len, 0.005), std({ color: 0x111111 }));
    m.position.y = len / 2;
    pivot.add(m);
    clock.add(pivot);
    return pivot;
  };
  const clockHands = { hour: hand(0.09, 0.012), minute: hand(0.14, 0.008) };

  // bed: headboard against the back wall, foot toward the player
  const bed = new Group();
  root.add(bed);
  const bx = -1.42;
  box(0.95, 0.9, 0.06, darkWood, bx, 0.45, z0 + 0.04, bed);
  box(0.06, 0.6, 0.06, darkWood, bx - 0.45, 0.3, -1.55, bed);
  box(0.06, 0.6, 0.06, darkWood, bx + 0.45, 0.3, -1.55, bed);
  box(0.95, 0.12, 1.9, darkWood, bx, 0.36, -2.5, bed); // frame: underside at 0.3
  box(0.9, 0.16, 1.85, std({ color: 0xb8b0a0 }), bx, 0.5, -2.5, bed);
  const pillow = box(0.6, 0.1, 0.35, std({ color: 0xcfc8b8 }), bx, 0.62, -3.2, bed);
  pillow.rotation.z = 0.04;
  // the blanket, thrown back and hanging over the room side
  const blanket = std({ map: T.plaid, roughness: 1 });
  box(0.98, 0.05, 1.2, blanket, bx + 0.02, 0.6, -2.15, bed);
  const drape = box(0.03, 0.24, 1.2, blanket, bx + 0.5, 0.47, -2.15, bed);
  drape.rotation.z = 0.06;
  // Theo's flashlight lying on the blanket
  const torch = new Group();
  torch.position.set(bx + 0.1, 0.66, -2.0);
  torch.rotation.y = 0.6;
  const body = new Mesh(new CylinderGeometry(0.022, 0.022, 0.18, 16), std({ color: 0x22221f, roughness: 0.4 }));
  body.rotation.z = Math.PI / 2;
  torch.add(body);
  const head = new Mesh(new CylinderGeometry(0.032, 0.024, 0.05, 16), metal);
  head.rotation.z = Math.PI / 2;
  head.position.x = 0.11;
  torch.add(head);
  torch.traverse((o) => (o.castShadow = true));
  root.add(torch);

  // desk against the back wall, right
  const desk = new Group();
  root.add(desk);
  box(1.1, 0.04, 0.62, wood, 1.35, 0.75, z0 + 0.32, desk);
  for (const [x, z] of [
    [0.84, z0 + 0.05],
    [1.86, z0 + 0.05],
    [0.84, z0 + 0.6],
    [1.86, z0 + 0.6],
  ])
    box(0.05, 0.75, 0.05, wood, x, 0.375, z, desk);
  box(0.4, 0.35, 0.56, wood, 1.62, 0.55, z0 + 0.32, desk);
  // dad's lamp, off
  cyl(0.08, 0.02, brass, 1.75, 0.78, z0 + 0.15, desk);
  cyl(0.01, 0.4, brass, 1.75, 0.98, z0 + 0.15, desk);
  const shade = new Mesh(new CylinderGeometry(0.06, 0.13, 0.12, 20, 1, true), std({ color: 0x2a4a30 }));
  shade.position.set(1.75, 1.18, z0 + 0.15);
  (shade.material as MeshStandardMaterial).side = DoubleSide;
  desk.add(shade);

  // the radio: a 1920 wooden set with dad's grey plate on the front
  const radioG = new Group();
  radioG.position.set(1.2, 0.77, z0 + 0.2);
  root.add(radioG);
  box(0.46, 0.24, 0.26, wood, 0, 0.12, 0, radioG);
  box(0.48, 0.02, 0.28, std({ color: 0x6a4c30 }), 0, 0.25, 0, radioG);
  box(0.42, 0.18, 0.005, std({ color: 0x120f0c }), 0, 0.12, 0.131, radioG, false);
  cyl(0.025, 0.02, brass, -0.16, 0.16, 0.14, radioG).rotation.x = Math.PI / 2;
  cyl(0.025, 0.02, brass, -0.09, 0.16, 0.14, radioG).rotation.x = Math.PI / 2;
  box(0.22, 0.15, 0.01, metalDark, 0.08, 0.12, 0.137, radioG, false);
  const ro = readout();
  const readoutMesh = new Mesh(new PlaneGeometry(0.12, 0.045), new MeshBasicMaterial({ map: ro.texture }));
  readoutMesh.position.set(0.11, 0.165, 0.143);
  radioG.add(readoutMesh);
  const txMat = new MeshBasicMaterial({ color: 0xff3a20 });
  const tx = new Mesh(new SphereGeometry(0.005, 8, 8), txMat);
  tx.position.set(0.18, 0.18, 0.145);
  radioG.add(tx);
  const radioLight = new PointLight(0xffa040, 0.6, 2.2, 2);
  radioLight.position.set(0.05, 0.2, 0.35);
  radioG.add(radioLight);
  // aerial up the wall
  const aerial = cyl(0.004, 0.9, metal, 0.24, 0.65, -0.1, radioG, 6);
  aerial.rotation.z = -0.35;
  let lastOn: boolean | null = null;
  const radio = {
    tx,
    light: radioLight,
    setOn(on: boolean, surge: number) {
      if (on !== lastOn) {
        lastOn = on;
        ro.draw('2.58', on);
      }
      tx.visible = on;
      radioLight.visible = on;
      radioLight.intensity = 0.5 + surge * 6;
    },
  };

  // the mic, lying where it always lies, under Theo's drawing book (spine on the talk button)
  const mic = () => {
    const g = new Group();
    const m = new Mesh(new BoxGeometry(0.11, 0.035, 0.05), metalDark);
    m.castShadow = true;
    g.add(m);
    const book = new Mesh(new BoxGeometry(0.2, 0.012, 0.26), std({ color: 0x2f4a6e, roughness: 0.8 }));
    book.position.set(0.04, 0.026, 0.02);
    book.rotation.set(0.05, 0.3, 0.06);
    book.castShadow = true;
    g.add(book);
    return g;
  };
  const micOnDesk = mic();
  micOnDesk.position.set(0.95, 0.79, z0 + 0.45);
  root.add(micOnDesk);
  const micOnFloor = mic();
  micOnFloor.position.set(0.75, 0.02, z0 + 0.95);
  micOnFloor.rotation.y = 1.2;
  micOnFloor.visible = false;
  root.add(micOnFloor);

  // the wardrobe on the left wall, louvred doors facing into the room
  const wd = { x: -1.62, z: -0.8, w: 0.6, d: 1.0, h: 1.95 };
  box(wd.w, 0.04, wd.d, darkWood, wd.x, wd.h, wd.z, root);
  box(wd.w, 0.04, wd.d, darkWood, wd.x, 0.06, wd.z, root);
  box(0.03, wd.h, wd.d, darkWood, x0 + 0.03, wd.h / 2, wd.z, root);
  box(wd.w, wd.h, 0.03, darkWood, wd.x, wd.h / 2, wd.z - wd.d / 2, root);
  box(wd.w, wd.h, 0.03, darkWood, wd.x, wd.h / 2, wd.z + wd.d / 2, root);
  box(wd.w + 0.06, 0.08, wd.d + 0.06, darkWood, wd.x, wd.h + 0.04, wd.z, root);
  // clothes hanging inside
  for (let i = 0; i < 5; i++) box(0.04, 0.8, 0.3, std({ color: [0x2a3a4a, 0x4a3020, 0x30302a][i % 3] }), wd.x - 0.05, 1.35, wd.z - 0.38 + i * 0.19, root);
  const louvres = new Group();
  root.add(louvres);
  const makeDoor = (hingeZ: number, dir: 1 | -1) => {
    const pivot = new Group();
    pivot.position.set(wd.x + wd.w / 2, 0, hingeZ);
    louvres.add(pivot);
    const half = wd.d / 2;
    const cz = (dir * half) / 2;
    box(0.03, wd.h - 0.1, 0.04, wood, 0, wd.h / 2, cz - (dir * half) / 2 + dir * 0.02, pivot);
    box(0.03, wd.h - 0.1, 0.04, wood, 0, wd.h / 2, cz + (dir * half) / 2 - dir * 0.02, pivot);
    box(0.03, 0.08, half, wood, 0, 0.09, cz, pivot);
    box(0.03, 0.08, half, wood, 0, wd.h - 0.05, cz, pivot);
    for (let y = 0.18; y < wd.h - 0.1; y += 0.045) {
      const s = box(0.012, 0.035, half - 0.06, wood, 0, y, cz, pivot);
      s.rotation.z = 1.0;
    }
    return pivot;
  };
  const wardrobeDoors: [Group, Group] = [makeDoor(wd.z - wd.d / 2, 1), makeDoor(wd.z + wd.d / 2, -1)];

  // the door: hinge on the window side of the opening, opens into the room (negative angles)
  const doorPivot = new Group();
  doorPivot.position.set(x1 - 0.02, 0, DOOR.z0);
  root.add(doorPivot);
  const leaf = box(0.04, DOOR.h - 0.02, DOOR.z1 - DOOR.z0 - 0.02, std({ color: 0x5a4430, map: T.darkWood, roughness: 0.6 }), 0, DOOR.h / 2, (DOOR.z1 - DOOR.z0) / 2, doorPivot);
  leaf.userData.door = true;
  const knob = new Mesh(new SphereGeometry(0.03, 12, 12), brass);
  knob.position.set(-0.04, 1.0, DOOR.z1 - DOOR.z0 - 0.08);
  doorPivot.add(knob);
  // door frame
  box(0.12, DOOR.h, 0.06, trim, x1, DOOR.h / 2, DOOR.z0 - 0.03, root);
  box(0.12, DOOR.h, 0.06, trim, x1, DOOR.h / 2, DOOR.z1 + 0.03, root);
  box(0.12, 0.06, DOOR.z1 - DOOR.z0 + 0.12, trim, x1, DOOR.h + 0.03, (DOOR.z0 + DOOR.z1) / 2, root);

  // the light switch spot by the door: in 1920 it is a candle sconce (Chapter 0, rule 1)
  const sconce = new Group();
  sconce.position.set(x1 - 0.03, 1.35, -0.55);
  root.add(sconce);
  box(0.03, 0.14, 0.06, brass, 0, 0, 0, sconce);
  const candleStick = cyl(0.015, 0.1, std({ color: 0xe8dcc0, roughness: 0.9 }), -0.04, 0.1, 0, sconce, 10);
  candleStick.castShadow = false;
  const flame = new Mesh(new SphereGeometry(0.012, 8, 8), new MeshBasicMaterial({ color: 0xffc070 }));
  flame.scale.y = 2;
  flame.position.set(-0.04, 0.17, 0);
  sconce.add(flame);
  const candleLight = new PointLight(0xff9a40, 0, 9, 1.4);
  candleLight.position.set(-0.12, 0.2, 0);
  candleLight.castShadow = true;
  candleLight.shadow.mapSize.set(512, 512);
  candleLight.shadow.bias = -0.002;
  sconce.add(candleLight);
  sconce.visible = true;

  // ---------- the hallway ----------
  const hallWall = std({ map: T.wallpaper, roughness: 0.95 });
  const hl = HALL.x1 - x1;
  const hcx = x1 + hl / 2;
  const hcz = (HALL.z0 + HALL.z1) / 2;
  box(hl, 0.02, HALL.z1 - HALL.z0, floorMat, hcx, -0.01, hcz, root, false);
  box(hl, 0.02, HALL.z1 - HALL.z0, ceilingMat, hcx, HALL.h, hcz, root);
  box(hl, HALL.h, 0.1, hallWall, hcx, HALL.h / 2, HALL.z0 - 0.05, root);
  box(hl, HALL.h, 0.1, hallWall, hcx, HALL.h / 2, HALL.z1 + 0.05, root);
  // a picture frame and a side door, so the hallway reads as one
  box(0.5, 0.4, 0.03, frameMat, 4.2, 1.5, HALL.z0 + 0.02, root);
  box(0.8, 2.0, 0.04, std({ color: 0x4a3828 }), 5.6, 1.0, HALL.z1 - 0.01, root);
  // the back door at the end: wood with a glass top through which the moon comes in
  box(0.1, HALL.h, 0.25, hallWall, HALL.x1 + 0.05, HALL.h / 2, HALL.z0 + 0.125, root);
  box(0.1, HALL.h, 0.25, hallWall, HALL.x1 + 0.05, HALL.h / 2, HALL.z1 - 0.125, root);
  box(0.1, HALL.h - 2.0, 0.8, hallWall, HALL.x1 + 0.05, 2.0 + (HALL.h - 2.0) / 2, hcz, root);
  const backDoor = new Group();
  backDoor.position.set(HALL.x1 + 0.02, 0, hcz + 0.4);
  root.add(backDoor);
  box(0.04, 1.0, 0.8, std({ color: 0x4e3a28 }), 0, 0.5, -0.4, backDoor);
  box(0.04, 0.2, 0.8, std({ color: 0x4e3a28 }), 0, 1.9, -0.4, backDoor);
  const backGlass = new Mesh(new PlaneGeometry(0.7, 0.8), new MeshBasicMaterial({ color: 0x3a4e66 }));
  backGlass.rotation.y = -Math.PI / 2;
  backGlass.position.set(0, 1.4, -0.4);
  backDoor.add(backGlass);
  backDoor.userData.backDoor = true;
  const hallMoon = new SpotLight(0x8aa4c8, 3, 9, 0.5, 0.6, 1.5);
  hallMoon.position.set(HALL.x1 + 1.5, 2.0, hcz);
  hallMoon.target.position.set(4, 0, hcz);
  root.add(hallMoon, hallMoon.target);

  // ---------- outside: the yard, the moon, the old garage ----------
  const grass = std({ map: T.grass, roughness: 1 });
  const ground = new Mesh(new PlaneGeometry(80, 80), grass);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(20, -0.02, 0);
  ground.receiveShadow = true;
  root.add(ground);
  // the house's outer shell, so the room is closed from outside
  // (with the window cut out, or it would shade the moonlight off Theo's floor)
  const shell = std({ color: 0x3a3630 });
  const sz = z0 - 0.3;
  box(-0.75 - (x0 - 0.2), 3.2, 0.2, shell, (x0 - 0.2 - 0.75) / 2, 1.6, sz, root);
  box(HALL.x1 + 0.2 - 0.75, 3.2, 0.2, shell, (HALL.x1 + 0.2 + 0.75) / 2, 1.6, sz, root);
  box(1.5, 0.95, 0.2, shell, 0, 0.475, sz, root);
  box(1.5, 3.2 - 2.15, 0.2, shell, 0, 2.15 + (3.2 - 2.15) / 2, sz, root);
  // a bare tree
  const treeMat = std({ color: 0x15130f, roughness: 1 });
  const trunk = cyl(0.14, 4, treeMat, 12, 2, 3.5, root, 8);
  trunk.rotation.z = 0.08;
  for (let i = 0; i < 4; i++) {
    const br = cyl(0.04, 1.6, treeMat, 12 + (i % 2 ? 0.5 : -0.5), 3 + i * 0.3, 3.5, root, 6);
    br.rotation.z = i % 2 ? -0.8 : 0.9;
  }
  const moon = new DirectionalLight(0x8aa0c8, 0.9);
  moon.position.set(1.5, 6, -10);
  moon.target.position.set(-0.3, 0, -2);
  moon.castShadow = true;
  moon.shadow.mapSize.set(1024, 1024);
  moon.shadow.camera.left = -4;
  moon.shadow.camera.right = 4;
  moon.shadow.camera.top = 4;
  moon.shadow.camera.bottom = -4;
  moon.shadow.camera.near = 1;
  moon.shadow.camera.far = 20;
  moon.shadow.bias = -0.0015;
  root.add(moon, moon.target);

  // the garage, ~1920: plank walls, doors facing the house
  const g = GARAGE;
  const plankOut = std({ map: T.planks, roughness: 1, color: 0x9a8a78 });
  const plankIn = std({ map: T.planks, roughness: 1 });
  const gx0 = g.x - g.w / 2;
  const gx1 = g.x + g.w / 2;
  const gz0 = g.z - g.d / 2;
  const gz1 = g.z + g.d / 2;
  box(g.w, g.h, 0.1, plankIn, g.x, g.h / 2, gz0, root);
  box(g.w, g.h, 0.1, plankIn, g.x, g.h / 2, gz1, root);
  box(0.1, g.h, g.d, plankIn, gx1, g.h / 2, g.z, root);
  // front (house side) with two closed doors and a crack of light between them
  box(0.1, g.h, (g.d - 2.4) / 2, plankOut, gx0, g.h / 2, gz0 + (g.d - 2.4) / 4, root);
  box(0.1, g.h, (g.d - 2.4) / 2, plankOut, gx0, g.h / 2, gz1 - (g.d - 2.4) / 4, root);
  box(0.1, g.h - 2.4, 2.4, plankOut, gx0, 2.4 + (g.h - 2.4) / 2, g.z, root);
  box(0.08, 2.4, 1.16, plankOut, gx0, 1.2, g.z - 0.62, root);
  box(0.08, 2.4, 1.16, plankOut, gx0, 1.2, g.z + 0.62, root);
  // pitched roof
  const roofMat = std({ color: 0x2a2620, roughness: 1 });
  const r1 = box(g.w + 0.4, 0.08, g.d / 2 + 0.6, roofMat, g.x, g.h + 0.55, g.z - g.d / 4, root);
  r1.rotation.x = 0.35;
  const r2 = box(g.w + 0.4, 0.08, g.d / 2 + 0.6, roofMat, g.x, g.h + 0.55, g.z + g.d / 4, root);
  r2.rotation.x = -0.35;
  box(g.w, 0.04, g.d, std({ map: T.dirt }), g.x, 0.0, g.z, root, false);
  box(g.w, 0.05, g.d, std({ color: 0x1a1612 }), g.x, g.h, g.z, root, false);
  // a 1920 motor car, sheet half pulled off
  const car = new Group();
  car.position.set(g.x + 0.4, 0, g.z + 0.6);
  root.add(car);
  const paint = std({ color: 0x1a1a1c, roughness: 0.4, metalness: 0.3 });
  box(2.4, 0.5, 1.2, paint, 0, 0.75, 0, car);
  box(1.2, 0.7, 1.15, paint, -0.3, 1.35, 0, car);
  box(0.6, 0.45, 1.1, std({ color: 0x2a2a2a, metalness: 0.5, roughness: 0.3 }), 1.0, 1.05, 0, car);
  const sheet = std({ color: 0x8a8478, roughness: 1 });
  const sh = box(1.8, 0.04, 1.4, sheet, -0.4, 1.72, 0, car);
  sh.rotation.z = 0.05;
  box(0.04, 0.9, 1.4, sheet, -1.3, 1.25, 0, car).rotation.z = -0.08;
  const tyre = std({ color: 0x0e0e0e, roughness: 0.9 });
  for (const [x, z] of [
    [-0.85, -0.62],
    [-0.85, 0.62],
    [0.85, -0.62],
    [0.85, 0.62],
  ]) {
    const w = cyl(0.36, 0.1, tyre, x, 0.36, z, car, 20);
    w.rotation.x = Math.PI / 2;
    for (let a = 0; a < 12; a++) {
      const sp = box(0.012, 0.6, 0.012, std({ color: 0x5a4a32 }), x, 0.36, z + (z > 0 ? 0.06 : -0.06), car, false);
      sp.rotation.z = (a / 12) * Math.PI;
    }
  }
  // workbench, oil can, a lantern hook
  box(1.8, 0.06, 0.6, darkWood, gx1 - 0.4, 0.9, gz0 + 0.9, root).rotation.y = Math.PI / 2;
  box(0.06, 0.9, 0.06, darkWood, gx1 - 0.6, 0.45, gz0 + 0.2, root);
  box(0.06, 0.9, 0.06, darkWood, gx1 - 0.6, 0.45, gz0 + 1.6, root);
  cyl(0.08, 0.2, std({ color: 0x5a4a2a, metalness: 0.5 }), gx1 - 0.4, 1.03, gz0 + 0.6, root);
  // a high window, the moon through dust
  const gwin = new Mesh(new PlaneGeometry(0.6, 0.4), new MeshBasicMaterial({ color: 0x3a4e66 }));
  gwin.position.set(g.x + 0.8, 2.4, gz0 + 0.06);
  root.add(gwin);
  // (the light starts just inside the glass: the plank wall would shadow it otherwise)
  const garageMoon = new SpotLight(0x8aa4c8, 10, 8, 0.45, 0.7, 1.2);
  garageMoon.position.set(g.x + 0.8, 2.4, gz0 + 0.12);
  garageMoon.target.position.set(g.x - 0.4, 0, g.z + 0.4);
  garageMoon.castShadow = true;
  garageMoon.shadow.mapSize.set(512, 512);
  root.add(garageMoon, garageMoon.target);
  // moonlit ground in front of the doors, so the crack between them glows and its legs can cross it
  const doorMoon = new SpotLight(0x9ab0d0, 24, 9, 0.6, 0.5, 1.2);
  doorMoon.position.set(gx0 - 3, 5, g.z);
  doorMoon.target.position.set(gx0 - 0.6, 0, g.z);
  root.add(doorMoon, doorMoon.target);
  // moonlit mist beyond the doors: what the crack shows from inside (only shown once he is in the garage)
  const doorMist = new Mesh(new PlaneGeometry(14, 7), new MeshBasicMaterial({ color: 0x46566e }));
  doorMist.rotation.y = Math.PI / 2;
  doorMist.position.set(gx0 - 3, 3, g.z);
  doorMist.visible = false;
  root.add(doorMist);

  // the watch Theo loses, shown on the floor under the bed when it falls
  const watch = new Mesh(new BoxGeometry(0.04, 0.012, 0.035), std({ color: 0x1a1a18, roughness: 0.4 }));
  watch.position.set(-1.1, 0.01, -2.35);
  watch.visible = false;
  root.add(watch);

  // click targets
  const hits = {
    torch: hitBox(0.35, 0.2, 0.3, torch.position.x, torch.position.y, torch.position.z, root, 'torch'),
    door: hitBox(0.2, DOOR.h, DOOR.z1 - DOOR.z0 + 0.2, x1 - 0.05, DOOR.h / 2, (DOOR.z0 + DOOR.z1) / 2, root, 'door'),
    radio: hitBox(0.6, 0.4, 0.45, radioG.position.x, radioG.position.y + 0.12, radioG.position.z, root, 'radio'),
    wardrobe: hitBox(0.2, 1.9, 1.0, wd.x + 0.3, 1.0, wd.z, root, 'wardrobe'),
    bed: hitBox(1.0, 0.7, 1.9, bx, 0.35, -2.5, root, 'bed'),
  };
  // labels float at the centre of each click target, so clicking the label's point always hits it
  const anchors = hits;

  root.traverse((o) => {
    if ((o as Mesh).isMesh && !(o as Mesh).userData.action) (o as Mesh).receiveShadow = true;
  });

  return {
    root,
    wallMat,
    paper1986: T.wallpaper,
    paper1920: T.oldpaper,
    doorPivot,
    clockHands,
    radio,
    torch,
    micOnDesk,
    micOnFloor,
    wardrobeDoors,
    louvres,
    candle: { light: candleLight, flame },
    moon,
    hallMoon,
    garageMoon,
    doorMist,
    watch,
    hits,
    anchors,
  };
}

export const BG = new Color(0x020203);
