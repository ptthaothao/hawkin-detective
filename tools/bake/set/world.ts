import {
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Float32BufferAttribute,
  ExtrudeGeometry,
  Group,
  LatheGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  PointLight,
  RepeatWrapping,
  Shape,
  SphereGeometry,
  SpotLight,
  SRGBColorSpace,
  TorusGeometry,
  Vector2,
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
  /** The things Theo can use, for placing click areas on the baked pictures. */
  spots: Record<'torch' | 'door' | 'radio' | 'wardrobe' | 'bed', Object3D>;
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
  // 1920: a horse-drawn buggy under a half-pulled sheet, barrels and crates (nothing from 1986 on this side)
  const buggy = new Group();
  buggy.position.set(g.x + 0.4, 0, g.z + 0.6);
  buggy.rotation.y = 0.12;
  root.add(buggy);
  box(1.7, 0.1, 1.0, darkWood, 0, 0.62, 0, buggy);
  box(1.7, 0.5, 0.06, darkWood, 0, 0.9, -0.5, buggy);
  box(1.7, 0.5, 0.06, darkWood, 0, 0.9, 0.5, buggy);
  box(0.06, 1.1, 0.06, darkWood, -0.8, 1.2, -0.48, buggy);
  box(0.06, 1.1, 0.06, darkWood, -0.8, 1.2, 0.48, buggy);
  box(0.9, 0.05, 1.05, std({ color: 0x1e1a14, roughness: 1 }), -0.4, 1.75, 0, buggy);
  const shaft = box(2.0, 0.05, 0.05, darkWood, 1.7, 0.7, -0.3, buggy);
  shaft.rotation.z = -0.06;
  box(2.0, 0.05, 0.05, darkWood, 1.7, 0.7, 0.3, buggy).rotation.z = -0.06;
  const sheet = std({ color: 0x8a8478, roughness: 1 });
  box(1.0, 0.04, 1.1, sheet, 0.5, 1.16, 0, buggy).rotation.z = 0.05;
  const wheelRim = std({ color: 0x2a221a, roughness: 0.9 });
  for (const z of [-0.58, 0.58]) {
    const w = new Mesh(new TorusGeometry(0.5, 0.04, 8, 28), wheelRim);
    w.position.set(0, 0.5, z);
    w.castShadow = true;
    buggy.add(w);
    for (let a = 0; a < 8; a++) {
      const sp = box(0.03, 0.95, 0.03, darkWood, 0, 0.5, z, buggy, false);
      sp.rotation.z = (a / 8) * Math.PI;
    }
  }
  // barrels and crates along the back wall
  const barrel = std({ color: 0x5a4630, roughness: 0.9 });
  cyl(0.28, 0.7, barrel, gx0 + 0.6, 0.35, gz1 - 0.5, root, 14);
  cyl(0.28, 0.7, barrel, gx0 + 1.2, 0.35, gz1 - 0.45, root, 14);
  // ---- Martin's hideout (his secret base, ~1920): the one cared-for corner of a rotting garage ----
  // What a seven-year-old could make from what was lying about: a table and two chairs from the old
  // household things, blankets and a sheet thrown over them, a rug and a pillow, an oil lamp, a toy car,
  // and a lot of his drawings pinned to the blanket. Low, cramped, one way in.
  const denX = g.x - 0.7;
  const denZ = gz0 + 0.75;
  const paint = (draw: (x: CanvasRenderingContext2D, w: number, h: number) => void, w: number, h: number) => {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = Math.round((512 * h) / w);
    draw(c.getContext('2d')!, c.width, c.height);
    const tex = new CanvasTexture(c);
    tex.colorSpace = SRGBColorSpace;
    return tex;
  };
  const fort = new Group();
  fort.position.set(denX, 0, denZ);
  root.add(fort);
  const linen = std({ color: 0x8a8068, roughness: 1 });
  // a worn rug, a pillow, a crumpled blanket
  box(2.5, 0.03, 2.0, std({ color: 0x4a2a22, roughness: 1 }), 0.6, 0.03, 0, fort, false);
  box(0.4, 0.09, 0.28, linen, -0.5, 0.08, -0.4, fort, false).rotation.y = 0.3;
  // the shelter: old blankets and sheets thrown over a hidden frame, so the cloth falls in heavy folds and
  // makes a low rounded tent with one dark way in at the front (+x). A dome with folds pushed into it.
  const wool = paint((x, cw, ch) => {
    x.fillStyle = '#9a9a9a';
    x.fillRect(0, 0, cw, ch);
    for (let i = 0; i < 9000; i++) {
      const v = 110 + Math.floor(Math.random() * 90);
      x.fillStyle = `rgb(${v},${v},${v})`;
      x.fillRect(Math.random() * cw, Math.random() * ch, 2, 1);
    }
    x.strokeStyle = 'rgba(60,60,60,0.35)';
    x.lineWidth = 1;
    for (let i = 0; i < cw; i += 6) {
      x.beginPath();
      x.moveTo(i, 0);
      x.lineTo(i, ch);
      x.stroke();
    }
  }, 1, 1);
  wool.wrapS = wool.wrapT = RepeatWrapping;
  const smooth = (v: number, a0: number, a1: number) => {
    const k = Math.max(0, Math.min(1, (v - a0) / (a1 - a0)));
    return k * k * (3 - 2 * k);
  };
  const Rx_IN = 1.08;
  const tent = (() => {
    const NT = 360;
    const NH = 240;
    const Rx = 1.08;
    const Rz = 1.0;
    const H = 0.98;
    const pos: number[] = [];
    const col: number[] = [];
    const uv: number[] = [];
    const idx: number[] = [];
    const olive = new Color(0x5e5a3c);
    const grey = new Color(0x48463a);
    const cream = new Color(0xa89e82);
    const gold = new Color(0x7a6232);
    const brown = new Color(0x4a3824);
    const tmp = new Color();
    for (let j = 0; j <= NH; j++) {
      const t = j / NH;
      for (let i = 0; i <= NT; i++) {
        // each row starts and ends at the edge of the doorway, so the rim of the arch is a clean curve
        const open = t < 0.7 ? 0.9 * Math.pow(1 - (t / 0.7) ** 2.6, 1 / 2.6) : 0;
        const th = open + (i / NT) * (Math.PI * 2 - 2 * open);
        const calm = 1 - 0.9 * smooth(-Math.cos(th), 0.2, 0.7);
        const fold = 1 + calm * (0.085 * Math.sin(th * 13 + 2.2 * t) * (1 - 0.4 * t) + 0.045 * Math.sin(th * 31 + 5 * t) + 0.035 * Math.sin(th * 5 + 1));
        const r = Math.sqrt(Math.max(0, 1 - t * t)) * fold * (1 + 0.14 * Math.pow(1 - t, 6));
        pos.push(Math.cos(th) * Rx * r, H * t + 0.018 * Math.sin(th * 9) * (1 - t), Math.sin(th) * Rz * r);
        const wCream = smooth(th, 0.45 * Math.PI, 0.6 * Math.PI) * (1 - smooth(th, 0.9 * Math.PI, 1.05 * Math.PI));
        const wGold = smooth(th, 1.1 * Math.PI, 1.25 * Math.PI) * (1 - smooth(th, 1.6 * Math.PI, 1.75 * Math.PI));
        tmp.copy(olive).lerp(grey, 0.5 + 0.5 * Math.sin(th * 3));
        tmp.lerp(cream, wCream);
        const stripe = Math.sin(t * 46 + th * 6) > 0.2 ? gold : brown;
        tmp.lerp(stripe, wGold);
        const shade = 0.5 + 0.5 * Math.min(1, t * 1.8);
        col.push(tmp.r * shade * 1.7, tmp.g * shade * 1.7, tmp.b * shade * 1.7);
        uv.push((i / NT) * 8, (j / NH) * 3);
      }
    }
    for (let j = 0; j < NH; j++)
      for (let i = 0; i < NT; i++) {
        const k = j * (NT + 1) + i;
        idx.push(k, k + NT + 1, k + 1, k + 1, k + NT + 1, k + NT + 2);
      }
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new Float32BufferAttribute(col, 3));
    g.setAttribute('uv', new Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  })();
  const tentMesh = new Mesh(tent, new MeshStandardMaterial({ map: wool, vertexColors: true, roughness: 1, side: DoubleSide }));
  tentMesh.castShadow = true;
  tentMesh.receiveShadow = true;
  fort.add(tentMesh);
  // his drawings, crayon on paper, pinned to the back blanket; one of them his family, as stick people
  const crayon = ['#b5342a', '#2f4f8a', '#d9a62a', '#3d7a3a', '#6a3a8a'];
  const stick = (x: CanvasRenderingContext2D, cx: number, base: number, h: number, color: string) => {
    x.strokeStyle = color;
    x.beginPath();
    x.arc(cx, base - h + h * 0.13, h * 0.13, 0, Math.PI * 2);
    x.moveTo(cx, base - h * 0.74);
    x.lineTo(cx, base - h * 0.32);
    x.moveTo(cx - h * 0.2, base - h * 0.6);
    x.lineTo(cx + h * 0.2, base - h * 0.6);
    x.moveTo(cx, base - h * 0.32);
    x.lineTo(cx - h * 0.14, base);
    x.moveTo(cx, base - h * 0.32);
    x.lineTo(cx + h * 0.14, base);
    x.stroke();
  };
  const drawings: Record<string, (x: CanvasRenderingContext2D, w: number, h: number) => void> = {
    family: (x, w, h) => {
      stick(x, w * 0.36, h * 0.82, h * 0.55, crayon[1]);
      stick(x, w * 0.6, h * 0.82, h * 0.34, crayon[0]);
      x.strokeStyle = crayon[3];
      x.beginPath();
      x.moveTo(w * 0.08, h * 0.84);
      x.lineTo(w * 0.92, h * 0.86);
      x.stroke();
      x.strokeStyle = crayon[2];
      x.beginPath();
      x.arc(w * 0.82, h * 0.2, h * 0.09, 0, Math.PI * 2);
      x.stroke();
      // his signature, small, in the corner
      x.save();
      x.fillStyle = '#7a2a22';
      x.font = `bold ${Math.round(h * 0.13)}px "Comic Sans MS", "Chalkboard SE", cursive`;
      x.textAlign = 'right';
      x.rotate(-0.05);
      x.fillText('MAR', w * 0.94, h * 0.97);
      x.restore();
    },
    house: (x, w, h) => {
      x.strokeStyle = crayon[0];
      x.strokeRect(w * 0.25, h * 0.45, w * 0.5, h * 0.4);
      x.beginPath();
      x.moveTo(w * 0.2, h * 0.47);
      x.lineTo(w * 0.5, h * 0.18);
      x.lineTo(w * 0.8, h * 0.47);
      x.stroke();
      x.strokeStyle = crayon[1];
      x.strokeRect(w * 0.44, h * 0.6, w * 0.12, h * 0.25);
    },
    tree: (x, w, h) => {
      x.strokeStyle = '#5a3a1e';
      x.beginPath();
      x.moveTo(w * 0.5, h * 0.9);
      x.lineTo(w * 0.5, h * 0.5);
      x.stroke();
      x.strokeStyle = crayon[3];
      x.beginPath();
      x.arc(w * 0.5, h * 0.36, h * 0.24, 0, Math.PI * 2);
      x.stroke();
    },
    car: (x, w, h) => {
      x.strokeStyle = crayon[0];
      x.strokeRect(w * 0.15, h * 0.5, w * 0.7, h * 0.22);
      x.strokeRect(w * 0.32, h * 0.32, w * 0.34, h * 0.18);
      x.strokeStyle = '#222';
      for (const cx of [0.3, 0.7]) {
        x.beginPath();
        x.arc(w * cx, h * 0.76, h * 0.08, 0, Math.PI * 2);
        x.stroke();
      }
    },
    moon: (x, w, h) => {
      x.strokeStyle = crayon[2];
      x.beginPath();
      x.arc(w * 0.4, h * 0.45, h * 0.26, 0.6, Math.PI * 2 - 0.6);
      x.stroke();
      for (const [sx, sy] of [[0.72, 0.25], [0.8, 0.6], [0.62, 0.78]]) {
        x.beginPath();
        x.moveTo(w * sx - 14, h * sy);
        x.lineTo(w * sx + 14, h * sy);
        x.moveTo(w * sx, h * sy - 14);
        x.lineTo(w * sx, h * sy + 14);
        x.stroke();
      }
    },
    train: (x, w, h) => {
      x.strokeStyle = crayon[0];
      x.strokeRect(w * 0.15, h * 0.4, w * 0.45, h * 0.26);
      x.strokeRect(w * 0.6, h * 0.28, w * 0.22, h * 0.38);
      x.strokeStyle = '#222';
      for (const cx of [0.28, 0.46, 0.7]) {
        x.beginPath();
        x.arc(w * cx, h * 0.72, h * 0.07, 0, Math.PI * 2);
        x.stroke();
      }
      x.strokeStyle = '#777';
      x.beginPath();
      x.arc(w * 0.72, h * 0.18, h * 0.06, 0, Math.PI * 2);
      x.stroke();
    },
    horse: (x, w, h) => {
      x.strokeStyle = '#5a3a1e';
      x.strokeRect(w * 0.25, h * 0.4, w * 0.45, h * 0.2);
      x.beginPath();
      x.moveTo(w * 0.66, h * 0.4);
      x.lineTo(w * 0.78, h * 0.22);
      x.lineTo(w * 0.86, h * 0.3);
      for (const lx of [0.3, 0.38, 0.58, 0.66]) {
        x.moveTo(w * lx, h * 0.6);
        x.lineTo(w * lx, h * 0.82);
      }
      x.stroke();
    },
    dog: (x, w, h) => {
      x.strokeStyle = '#5a3a1e';
      x.strokeRect(w * 0.2, h * 0.4, w * 0.5, h * 0.22);
      x.beginPath();
      x.arc(w * 0.76, h * 0.38, h * 0.1, 0, Math.PI * 2);
      for (const lx of [0.25, 0.4, 0.55, 0.65]) {
        x.moveTo(w * lx, h * 0.62);
        x.lineTo(w * lx, h * 0.8);
      }
      x.stroke();
    },
  };
  const paper = (kind: string, w: number, h: number) =>
    new Mesh(
      new PlaneGeometry(w, h),
      new MeshStandardMaterial({
        roughness: 1,
        map: paint((x, cw, ch) => {
          x.fillStyle = '#c2b690';
          x.fillRect(0, 0, cw, ch);
          x.lineWidth = 9;
          x.lineCap = 'round';
          x.lineJoin = 'round';
          drawings[kind](x, cw, ch);
        }, w, h),
      }),
    );
  // ---- inside the shelter: his things, made to be recognised at a glance, lit by the lamp ----
  const lathe = (pts: [number, number][], mat: Material, x: number, y: number, z: number, parent: Object3D, seg = 20) => {
    const m = new Mesh(new LatheGeometry(pts.map(([r, h]) => new Vector2(r, h)), seg), mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };
  const extruded = (pts: [number, number][], depth: number, mat: Material, parent: Object3D) => {
    const sh = new Shape();
    pts.forEach(([px, py], i) => (i ? sh.lineTo(px, py) : sh.moveTo(px, py)));
    const geo = new ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelSize: 0.004, bevelThickness: 0.004, bevelSegments: 2 });
    geo.translate(0, 0, -depth / 2);
    const m = new Mesh(geo, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };
  const label = (text: string, bg: string, fg: string) =>
    paint((x, cw, ch) => {
      x.fillStyle = bg;
      x.fillRect(0, 0, cw, ch);
      x.strokeStyle = fg;
      x.lineWidth = 6;
      x.strokeRect(10, 14, cw - 20, ch - 28);
      x.fillStyle = fg;
      x.font = `bold ${Math.round(ch * 0.4)}px serif`;
      x.textAlign = 'center';
      x.textBaseline = 'middle';
      x.fillText(text, cw / 2, ch / 2);
    }, 4, 1);
  const metalRed = std({ color: 0xa8281c, roughness: 0.35, metalness: 0.5 });
  const rubber = std({ color: 0x15110e, roughness: 0.8 });
  const chrome = std({ color: 0xb8bcb8, roughness: 0.25, metalness: 0.9 });
  const toyBrass = std({ color: 0xc9a14a, roughness: 0.3, metalness: 0.85 });
  const toyWood = std({ color: 0xb98a52, roughness: 0.7 });
  const paintRed = std({ color: 0xb0302a, roughness: 0.5 });
  const paintBlue = std({ color: 0x2f5a8a, roughness: 0.5 });
  const paintYellow = std({ color: 0xd9a62a, roughness: 0.5 });
  // his drawings, pinned to the inside of the cloth at the back, and a few fallen on the rug
  const pinned: [string, number, number, number, number][] = [
    ['family', 0, 0.34, 0.5, 0.37], ['house', -0.36, 0.28, 0.26, 0.19], ['tree', 0.36, 0.28, 0.26, 0.19],
    ['moon', -0.2, 0.62, 0.22, 0.16], ['train', 0.2, 0.62, 0.24, 0.17],
  ];
  const inner = (y: number) => -Rx_IN * Math.sqrt(1 - Math.min(0.97, y / 0.98) ** 2);
  for (const [kind, pz, py, pw, ph] of pinned) {
    const m = paper(kind, pw, ph);
    const xb = inner(py - ph / 2);
    const xt = inner(py + ph / 2);
    m.position.set((xb + xt) / 2 + 0.07, py, pz);
    m.rotation.set(0, Math.PI / 2, -Math.atan2(xt - xb, ph), 'ZYX');
    fort.add(m);
  }
  for (const [kind, px, pz, ry] of [['horse', -0.35, -0.2, 0.3], ['dog', 0.05, 0.55, -0.5], ['car', 1.25, 0.5, 0.8], ['moon', 1.35, -0.4, -0.6]] as [string, number, number, number][]) {
    const m = paper(kind, 0.3, 0.22);
    m.position.set(px, 0.05, pz);
    m.rotation.set(-Math.PI / 2, 0, ry);
    fort.add(m);
  }
  // the oil lamp on two bricks, inside, by the way in: the light everything is arranged around
  const brick = std({ color: 0x8a4a38, roughness: 1 });
  box(0.24, 0.07, 0.12, brick, 0.4, 0.065, -0.5, fort, false).rotation.y = 0.2;
  box(0.22, 0.07, 0.11, brick, 0.4, 0.135, -0.5, fort, false).rotation.y = -0.1;
  const lamp = new Group();
  lamp.position.set(0.4, 0.17, -0.5);
  fort.add(lamp);
  lathe([[0, 0], [0.06, 0], [0.065, 0.03], [0.045, 0.07], [0.05, 0.09], [0.03, 0.1], [0, 0.1]], toyBrass, 0, 0, 0, lamp);
  lathe([[0.03, 0.1], [0.045, 0.14], [0.05, 0.2], [0.04, 0.26], [0.034, 0.3]], new MeshStandardMaterial({ color: 0xfff0d0, transparent: true, opacity: 0.3, roughness: 0.1, side: DoubleSide }), 0, 0, 0, lamp);
  const lampFlame = new Mesh(new SphereGeometry(0.022, 10, 10), new MeshBasicMaterial({ color: 0xffd27a }));
  lampFlame.scale.set(0.8, 1.9, 0.8);
  lampFlame.position.set(0, 0.17, 0);
  lamp.add(lampFlame);
  const lampLight = new PointLight(0xffa850, 2.4, 3.6, 2);
  lampLight.position.set(0, 0.2, 0.05);
  lamp.add(lampLight);
  // a tin car: pressed-steel body, windows, bumpers, rubber wheels with hubcaps
  const car = new Group();
  car.position.set(0.55, 0.04, 0.1);
  car.rotation.y = -0.35;
  car.scale.setScalar(1.7);
  fort.add(car);
  extruded([[-0.11, 0.02], [-0.11, 0.06], [-0.08, 0.075], [-0.055, 0.105], [-0.03, 0.135], [0.045, 0.135], [0.075, 0.105], [0.1, 0.085], [0.125, 0.065], [0.125, 0.02]], 0.085, metalRed, car);
  for (const sz of [-0.0445, 0.0445]) {
    box(0.07, 0.03, 0.002, std({ color: 0x1a2a34, roughness: 0.1, metalness: 0.6 }), 0.008, 0.108, sz, car, false);
    box(0.19, 0.008, 0.002, std({ color: 0xf0d8a0, roughness: 0.4 }), 0.0, 0.07, sz, car, false);
    for (const wx of [-0.065, 0.075]) {
      cyl(0.026, 0.014, rubber, wx, 0.026, sz * 0.9, car, 14).rotation.x = Math.PI / 2;
      cyl(0.012, 0.016, chrome, wx, 0.026, sz * 0.98, car, 10).rotation.x = Math.PI / 2;
    }
  }
  box(0.01, 0.01, 0.09, chrome, 0.132, 0.03, 0, car, false);
  box(0.01, 0.01, 0.09, chrome, -0.116, 0.03, 0, car, false);
  for (const lz of [-0.028, 0.028]) cyl(0.011, 0.008, new MeshBasicMaterial({ color: 0xffe6a0 }), 0.128, 0.058, lz, car, 10).rotation.z = Math.PI / 2;
  // a wooden horse on wheels, cut from a board: a real horse silhouette with mane, tail and a pull-string
  const horse = new Group();
  horse.position.set(0.15, 0.0, 0.5);
  horse.rotation.y = -0.6;
  horse.scale.setScalar(1.5);
  fort.add(horse);
  extruded([[-0.13, 0.1], [-0.14, 0.19], [-0.1, 0.225], [0.06, 0.225], [0.09, 0.27], [0.11, 0.35], [0.12, 0.4], [0.16, 0.42], [0.2, 0.395], [0.225, 0.34], [0.19, 0.325], [0.155, 0.33], [0.145, 0.27], [0.125, 0.19], [0.1, 0.19], [0.1, 0.07], [0.055, 0.07], [0.055, 0.15], [-0.05, 0.15], [-0.05, 0.07], [-0.1, 0.07], [-0.1, 0.12]], 0.045, toyWood, horse);
  extruded([[0.1, 0.34], [0.115, 0.42], [0.13, 0.4], [0.14, 0.43], [0.15, 0.34]], 0.05, std({ color: 0x3a2412, roughness: 1 }), horse);
  extruded([[-0.135, 0.2], [-0.19, 0.17], [-0.2, 0.08], [-0.17, 0.12], [-0.14, 0.15]], 0.04, std({ color: 0x3a2412, roughness: 1 }), horse);
  const eye = new Mesh(new SphereGeometry(0.008, 8, 8), new MeshBasicMaterial({ color: 0x120a04 }));
  eye.position.set(0.185, 0.385, 0.026);
  horse.add(eye);
  box(0.3, 0.025, 0.07, toyWood, 0, 0.055, 0, horse, false);
  for (const wx of [-0.1, 0.09]) for (const wz of [-0.04, 0.04]) {
    cyl(0.032, 0.012, paintRed, wx, 0.034, wz, horse, 14).rotation.x = Math.PI / 2;
    cyl(0.008, 0.014, toyBrass, wx, 0.034, wz * 1.1, horse, 8).rotation.x = Math.PI / 2;
  }
  // a spinning top: banded body, wooden peg and point
  const top = lathe([[0, -0.005], [0.012, 0], [0.035, 0.045], [0.05, 0.075], [0.052, 0.09], [0.04, 0.105], [0.01, 0.112], [0, 0.112]], paintBlue, 0.1, 0.0, 0.1, fort, 20);
  top.scale.setScalar(1.6);
  const topBand = lathe([[0.049, 0.07], [0.0525, 0.082], [0.0525, 0.09], [0.047, 0.098]], paintYellow, 0.1, 0.0, 0.1, fort, 20);
  topBand.scale.setScalar(1.6);
  cyl(0.008, 0.04, toyWood, 0.1, 0.2, 0.1, fort, 8);
  // three tin soldiers in a rank on a little base, with red caps and rifles
  for (let i = 0; i < 3; i++) {
    const s = new Group();
    s.position.set(-0.1, 0, -0.1 + i * 0.1);
    s.scale.setScalar(1.7);
    fort.add(s);
    box(0.045, 0.01, 0.04, std({ color: 0x3a3a34, roughness: 0.6, metalness: 0.5 }), 0, 0.005, 0, s, false);
    lathe([[0, 0.01], [0.018, 0.01], [0.02, 0.05], [0.025, 0.09], [0.02, 0.1], [0, 0.1]], paintBlue, 0, 0, 0, s, 12);
    const head = new Mesh(new SphereGeometry(0.014, 10, 8), std({ color: 0xe0b48a, roughness: 0.6 }));
    head.position.set(0, 0.116, 0);
    head.castShadow = true;
    s.add(head);
    lathe([[0.016, 0.122], [0.016, 0.136], [0.01, 0.145], [0, 0.145]], paintRed, 0, 0, 0, s, 12);
    const rifle = cyl(0.003, 0.14, chrome, 0.022, 0.08, 0, s, 6);
    rifle.rotation.z = -0.12;
    box(0.045, 0.006, 0.005, paintYellow, 0, 0.065, 0.018, s, false);
  }
  // tin cans with paper labels
  const canLabel = [label('TEA', '#c9a05a', '#4a2a10'), label('PEAS', '#7ea060', '#1f3a18')];
  [[-0.45, -0.5, 0, 1], [-0.58, -0.38, 1, 0.8], [-0.3, 0.55, 0, 0.9]].forEach(([cx, cz, li, sc]) => {
    const body = new Mesh(new CylinderGeometry(0.06 * sc, 0.06 * sc, 0.13 * sc, 24), [std({ map: canLabel[li], roughness: 0.7 }), chrome, chrome]);
    body.position.set(cx, 0.065 * sc, cz);
    body.rotation.y = 2.4;
    body.castShadow = true;
    fort.add(body);
  });
  // a ball of red yarn and its loose end
  const yarn = new Mesh(new SphereGeometry(0.065, 20, 14), std({ map: paint((x, cw, ch) => {
    x.fillStyle = '#a83f3a';
    x.fillRect(0, 0, cw, ch);
    x.strokeStyle = '#6a1d1a';
    x.lineWidth = 3;
    for (let i = 0; i < 40; i++) {
      x.beginPath();
      x.moveTo(0, (i / 40) * ch);
      x.bezierCurveTo(cw * 0.3, (i / 40) * ch + 18, cw * 0.6, (i / 40) * ch - 18, cw, (i / 40) * ch + 6);
      x.stroke();
    }
  }, 1, 1), roughness: 1 }));
  yarn.position.set(-0.25, 0.065, 0.62);
  yarn.castShadow = true;
  fort.add(yarn);
  // wooden alphabet blocks with letters
  [['A', 0xb0302a, -0.5, 0.05, 0.2, 0], ['B', 0x2f5a8a, -0.58, 0.05, 0.1, 0.3], ['C', 0x3d7a3a, -0.53, 0.14, 0.15, 0.6]].forEach(([ch, col, bx, by, bz, ry]) => {
    const tex = paint((x, cw, chh) => {
      x.fillStyle = '#d8b46f';
      x.fillRect(0, 0, cw, chh);
      x.fillStyle = `#${(col as number).toString(16).padStart(6, '0')}`;
      x.font = `bold ${Math.round(chh * 0.8)}px serif`;
      x.textAlign = 'center';
      x.textBaseline = 'middle';
      x.fillText(ch as string, cw / 2, chh / 2 + 6);
    }, 1, 1);
    const b = new Mesh(new BoxGeometry(0.1, 0.1, 0.1), std({ map: tex, roughness: 0.7 }));
    b.position.set(bx as number, by as number, bz as number);
    b.rotation.y = ry as number;
    b.castShadow = true;
    fort.add(b);
  });
  // a closed leather notebook with a pen, a key and a few coins
  const nb = box(0.22, 0.045, 0.3, std({ color: 0x4a2a1a, roughness: 0.55 }), 0.1, 0.065, -0.1, fort, false);
  nb.rotation.y = 0.5;
  box(0.2, 0.038, 0.28, std({ color: 0xd8c8a0, roughness: 1 }), 0.1, 0.065, -0.1, fort, false).rotation.y = 0.5;
  box(0.07, 0.005, 0.1, brass, 0.1, 0.091, -0.1, fort, false).rotation.y = 0.5;
  const pen = cyl(0.006, 0.14, std({ color: 0x15110e, roughness: 0.4 }), 0.26, 0.095, -0.2, fort, 8);
  pen.rotation.set(0, 0, Math.PI / 2);
  pen.rotation.y = 0.9;
  const keyRing = new Mesh(new TorusGeometry(0.03, 0.008, 8, 18), brass);
  keyRing.position.set(0.7, 0.012, -0.3);
  keyRing.rotation.x = Math.PI / 2;
  fort.add(keyRing);
  box(0.11, 0.01, 0.014, brass, 0.77, 0.012, -0.3, fort, false);
  box(0.014, 0.01, 0.03, brass, 0.82, 0.012, -0.29, fort, false);
  for (const [x, z] of [[0.9, 0.2], [0.94, 0.26], [0.88, 0.28]]) cyl(0.02, 0.005, brass, x, 0.006, z, fort, 14);
  // crayon stubs by the drawings on the rug
  for (const [cx, cz, cc, cr] of [[-0.1, -0.35, 0xb5342a, 0.4], [-0.05, -0.3, 0x2f4f8a, 1.2], [-0.15, -0.28, 0xd9a62a, 2.0]] as const) {
    cyl(0.008, 0.07, std({ color: cc, roughness: 0.7 }), cx, 0.012, cz, fort, 8).rotation.set(0, cr, Math.PI / 2);
  }
  // the old wooden radio stays out in the garage, on the workbench, not in his hideout
  const denRadio = new Group();
  denRadio.position.set(gx1 - 0.4, 0.93, gz0 + 1.25);
  denRadio.rotation.y = -Math.PI / 2;
  root.add(denRadio);
  box(0.36, 0.24, 0.2, std({ color: 0x4a3322, roughness: 0.5 }), 0, 0.12, 0, denRadio);
  box(0.26, 0.16, 0.01, std({ color: 0x0c0a08, roughness: 0.4 }), 0, 0.12, 0.105, denRadio, false);
  for (const kx of [-0.13, 0.13]) {
    const kn = cyl(0.025, 0.02, std({ color: 0xb08a4a, metalness: 0.6, roughness: 0.4 }), kx, 0.12, 0.115, denRadio, 12);
    kn.rotation.x = Math.PI / 2;
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
  garageMoon.target.position.set(denX, 0, denZ);
  garageMoon.castShadow = true;
  garageMoon.shadow.mapSize.set(2048, 2048);
  garageMoon.shadow.bias = -0.0006;
  garageMoon.shadow.normalBias = 0.02;
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
    spots: { torch, door: doorPivot, radio: radioG, wardrobe: louvres, bed },
    watch,
  };
}

export const BG = new Color(0x020203);
