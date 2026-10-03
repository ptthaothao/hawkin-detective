import {
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  PointLight,
  RepeatWrapping,
  SphereGeometry,
  SpotLight,
  SRGBColorSpace,
  TorusGeometry,
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
  const tent = (() => {
    const NT = 360;
    const NH = 90;
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
        const open = t < 0.7 ? 0.62 * Math.sqrt(1 - (t / 0.7) ** 2) : 0;
        const th = open + (i / NT) * (Math.PI * 2 - 2 * open);
        const fold = 1 + 0.085 * Math.sin(th * 13 + 2.2 * t) * (1 - 0.4 * t) + 0.045 * Math.sin(th * 31 + 5 * t) + 0.035 * Math.sin(th * 5 + 1);
        const r = Math.sqrt(Math.max(0, 1 - t * t)) * fold * (1 + 0.14 * Math.pow(1 - t, 6));
        pos.push(Math.cos(th) * Rx * r, H * t + 0.018 * Math.sin(th * 9) * (1 - t), Math.sin(th) * Rz * r);
        const wCream = smooth(th, 0.45 * Math.PI, 0.6 * Math.PI) * (1 - smooth(th, 0.9 * Math.PI, 1.05 * Math.PI));
        const wGold = smooth(th, 1.1 * Math.PI, 1.25 * Math.PI) * (1 - smooth(th, 1.6 * Math.PI, 1.75 * Math.PI));
        tmp.copy(olive).lerp(grey, 0.5 + 0.5 * Math.sin(th * 3));
        tmp.lerp(cream, wCream);
        const stripe = Math.sin(t * 46 + th * 6) > 0.2 ? gold : brown;
        tmp.lerp(stripe, wGold);
        const shade = 0.5 + 0.5 * Math.min(1, t * 1.8);
        col.push(tmp.r * shade, tmp.g * shade, tmp.b * shade);
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
  // the pile of drawings, spilled over the rug and the floor outside: his family among them, as stick people
  const spill: [string, number, number, number][] = [
    ['family', 1.45, 0.45, 0.3], ['train', 1.3, -0.35, -0.5], ['horse', 1.75, -0.05, 0.9], ['tree', 1.1, 0.2, -0.2],
    ['house', 1.85, 0.6, 0.6], ['dog', 1.15, 0.7, 1.2], ['moon', 1.6, -0.65, -0.8], ['car', 1.55, 0.2, 0.1],
  ];
  spill.forEach(([kind, x, z, ry], i) => {
    const m = paper(kind, 0.3, 0.22);
    m.position.set(x, 0.048 + i * 0.004, z);
    m.rotation.set(-Math.PI / 2, 0, ry);
    fort.add(m);
  });
  // one small tin car, on the rug
  const car = new Group();
  car.position.set(0.95, 0.045, 0.12);
  car.rotation.y = 0.5;
  fort.add(car);
  const tin = std({ color: 0x7a2a22, roughness: 0.5, metalness: 0.35 });
  box(0.16, 0.045, 0.07, tin, 0, 0.04, 0, car, false);
  box(0.07, 0.04, 0.062, tin, -0.01, 0.083, 0, car, false);
  for (const wx of [-0.05, 0.05]) for (const wz of [-0.04, 0.04]) cyl(0.022, 0.012, std({ color: 0x15110e, roughness: 0.8 }), wx, 0.022, wz, car, 10).rotation.x = Math.PI / 2;
  // the oil lamp on two bricks: the light everything is arranged around
  const brick = std({ color: 0x6a3a2a, roughness: 1 });
  box(0.22, 0.07, 0.11, brick, 0.3, 0.065, -0.1, fort, false).rotation.y = 0.2;
  box(0.2, 0.07, 0.1, brick, 0.3, 0.135, -0.1, fort, false).rotation.y = -0.1;
  const lamp = new Group();
  lamp.position.set(0.3, 0.17, -0.1);
  fort.add(lamp);
  cyl(0.04, 0.05, std({ color: 0x7a5a2a, metalness: 0.6, roughness: 0.4 }), 0, 0.025, 0, lamp, 12);
  cyl(0.028, 0.1, new MeshBasicMaterial({ color: 0xffd08a, transparent: true, opacity: 0.85 }), 0, 0.1, 0, lamp, 12);
  const lampLight = new PointLight(0xffa850, 1.8, 3.4, 2);
  lampLight.position.set(0, 0.16, 0);
  lamp.add(lampLight);
  // tin cans with faded labels, wooden blocks, a ball of string, a key, a few coins, his closed notebook
  const cans: [number, number, number][] = [[1.2, -0.9, 0xa0743a], [1.35, -0.8, 0x7a5a3a], [1.1, -0.78, 0x8a6a40], [1.28, -0.65, 0xb08a4a]];
  for (const [x, z, c] of cans) {
    cyl(0.055, 0.11, std({ color: c, metalness: 0.5, roughness: 0.55 }), x, 0.055, z, fort, 14);
    cyl(0.056, 0.05, std({ color: 0x7a2a22, roughness: 0.8 }), x, 0.06, z, fort, 14);
  }
  for (const [x, z, r] of [[1.6, -0.6, 0.4], [1.8, -0.4, 1.0], [1.5, 0.75, 0.2]] as const) {
    const blk = box(0.08, 0.08, 0.08, std({ color: 0xa8864e, roughness: 0.8 }), x, 0.04, z, fort, false);
    blk.rotation.y = r;
  }
  const ball = new Mesh(new SphereGeometry(0.06, 14, 10), std({ color: 0xa8905a, roughness: 1 }));
  ball.position.set(0.9, 0.08, -0.45);
  fort.add(ball);
  const keyRing = new Mesh(new TorusGeometry(0.03, 0.007, 6, 14), std({ color: 0x9a8a5a, metalness: 0.7, roughness: 0.4 }));
  keyRing.position.set(1.6, 0.012, 0.45);
  keyRing.rotation.x = Math.PI / 2;
  fort.add(keyRing);
  box(0.09, 0.008, 0.012, std({ color: 0x9a8a5a, metalness: 0.7, roughness: 0.4 }), 1.67, 0.012, 0.45, fort, false);
  for (const [x, z] of [[1.95, 0.0], [2.0, 0.07], [1.9, 0.12]]) cyl(0.017, 0.004, std({ color: 0xb09a60, metalness: 0.8, roughness: 0.4 }), x, 0.004, z, fort, 12);
  box(0.2, 0.04, 0.28, std({ color: 0x4a2a1a, roughness: 0.7 }), 1.05, 0.065, 0.75, fort, false).rotation.y = 0.3;
  const pen = cyl(0.006, 0.12, std({ color: 0x15110e, roughness: 0.5 }), 1.05, 0.095, 0.75, fort, 6);
  pen.rotation.set(0, 0, Math.PI / 2);
  // more of his things, so it looks lived in: toys, odds and ends, inside and around the way in
  const toyWood = std({ color: 0x7a5c36, roughness: 0.85 });
  const paintRed = std({ color: 0x7a2a22, roughness: 0.6 });
  const paintBlue = std({ color: 0x3a4a6a, roughness: 0.6 });
  const tinGrey = std({ color: 0x6a6a64, roughness: 0.5, metalness: 0.5 });
  // a wooden horse on wheels, the kind pulled on a string
  const horse = new Group();
  horse.position.set(1.5, 0.0, -0.8);
  horse.rotation.y = -0.35;
  fort.add(horse);
  box(0.3, 0.1, 0.1, toyWood, 0, 0.17, 0, horse, false);
  box(0.07, 0.17, 0.07, toyWood, 0.15, 0.27, 0, horse, false).rotation.z = -0.3;
  box(0.1, 0.06, 0.06, toyWood, 0.22, 0.37, 0, horse, false);
  box(0.02, 0.1, 0.05, std({ color: 0x3a2a1a, roughness: 1 }), 0.12, 0.35, 0, horse, false);
  box(0.34, 0.025, 0.06, toyWood, 0, 0.07, 0, horse, false);
  for (const wx of [-0.12, 0.12]) for (const wz of [-0.05, 0.05]) cyl(0.035, 0.012, paintRed, wx, 0.035, wz, horse, 12).rotation.x = Math.PI / 2;
  // a spinning top, a hoop and its stick, a drum
  const top = new Mesh(new CylinderGeometry(0.05, 0.006, 0.09, 14), paintRed);
  top.position.set(1.85, 0.05, -0.2);
  top.rotation.z = 1.25;
  fort.add(top);
  const hoop = new Mesh(new TorusGeometry(0.22, 0.012, 6, 30), toyWood);
  hoop.position.set(0.9, 0.23, 1.3);
  hoop.rotation.y = 0.15;
  hoop.castShadow = true;
  fort.add(hoop);
  box(0.02, 0.02, 0.5, toyWood, 1.3, 0.012, 1.2, fort, false).rotation.y = 0.3;
  cyl(0.08, 0.1, std({ color: 0x9a8668, roughness: 0.9 }), 1.7, 0.05, 0.9, fort, 18);
  cyl(0.082, 0.02, paintRed, 1.7, 0.01, 0.9, fort, 18);
  cyl(0.082, 0.02, paintRed, 1.7, 0.09, 0.9, fort, 18);
  // tin soldiers in a rank, a tin boat, marbles
  for (let i = 0; i < 6; i++) {
    cyl(0.016, 0.07, i % 2 ? paintBlue : paintRed, 1.85, 0.035, -0.95 + i * 0.09, fort, 8);
    cyl(0.018, 0.02, tinGrey, 1.85, 0.08, -0.95 + i * 0.09, fort, 8);
  }
  box(0.2, 0.03, 0.07, paintBlue, 1.7, 0.03, -1.05, fort, false);
  box(0.02, 0.1, 0.02, toyWood, 1.7, 0.1, -1.05, fort, false);
  box(0.07, 0.07, 0.003, std({ color: 0xd8c8a0, roughness: 1 }), 1.7, 0.11, -1.04, fort, false);
  for (const [mx, mz, mc] of [[1.35, 0.95, 0x2a5a8a], [1.4, 0.99, 0x8a2a2a], [1.3, 1.0, 0x3a7a4a], [1.43, 0.9, 0xc8a24a], [1.36, 0.88, 0x6a3a8a], [1.28, 0.92, 0xd8d8d0]] as const) {
    const m = new Mesh(new SphereGeometry(0.014, 10, 8), std({ color: mc, roughness: 0.2, metalness: 0.1 }));
    m.position.set(mx, 0.014, mz);
    fort.add(m);
  }
  // blocks stacked, a picture book, a wooden sword lying on the floor
  for (const [bx, bz, bi] of [[1.9, 0.95, 0], [1.9, 0.95, 1], [1.97, 0.88, 0]] as const) box(0.08, 0.08, 0.08, toyWood, bx, 0.04 + bi * 0.08, bz, fort, false).rotation.y = bi * 0.3 + bx;
  box(0.2, 0.025, 0.15, std({ color: 0x3a5a4a, roughness: 0.8 }), 1.0, 0.04, -0.6, fort, false).rotation.y = 0.2;
  box(0.19, 0.012, 0.14, std({ color: 0xc8b890, roughness: 1 }), 1.0, 0.055, -0.6, fort, false).rotation.y = 0.2;
  box(0.5, 0.02, 0.05, toyWood, 1.1, 0.012, 1.0, fort, false).rotation.y = -0.3;
  box(0.02, 0.025, 0.14, toyWood, 1.2, 0.015, 0.96, fort, false).rotation.y = -0.3;
  // inside: a second pillow, a cap, a tin bucket, a glass jar, a rubber ball, a few crayon stubs
  box(0.34, 0.08, 0.26, linen, -0.35, 0.07, 0.4, fort, false).rotation.y = -0.4;
  cyl(0.09, 0.025, std({ color: 0x4a4a3a, roughness: 1 }), -0.1, 0.03, 0.45, fort, 14);
  cyl(0.06, 0.09, tinGrey, 0.6, 0.045, -0.5, fort, 14);
  const jar = new Mesh(new CylinderGeometry(0.045, 0.045, 0.11, 14), new MeshStandardMaterial({ color: 0x8aa890, transparent: true, opacity: 0.45, roughness: 0.1 }));
  jar.position.set(0.65, 0.065, 0.5);
  fort.add(jar);
  cyl(0.047, 0.015, tinGrey, 0.65, 0.125, 0.5, fort, 14);
  const rubber = new Mesh(new SphereGeometry(0.045, 14, 10), std({ color: 0x9a2a22, roughness: 0.6 }));
  rubber.position.set(0.5, 0.045, 0.3);
  fort.add(rubber);
  for (const [cx, cz, cc, cr] of [[1.55, 0.1, 0xb5342a, 0.4], [1.6, 0.14, 0x2f4f8a, 1.2], [1.52, 0.16, 0xd9a62a, 2.0], [1.65, 0.05, 0x3d7a3a, 0.2]] as const) {
    const st = cyl(0.007, 0.05, std({ color: cc, roughness: 0.7 }), cx, 0.008, cz, fort, 6);
    st.rotation.set(0, cr, Math.PI / 2);
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
