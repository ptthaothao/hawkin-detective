import {
  ACESFilmicToneMapping,
  Box3,
  FogExp2,
  HemisphereLight,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PointLight,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three';
import { Creature3D } from '../three/creature3d';
import { BG, buildWorld } from '../three/world';

/**
 * Bakes the 3D set into the panoramas the PixiJS chapter shows. Not part of the game: it runs in
 * a browser page (tools/bake/ch11.html) driven by tools/bake/ch11.mjs, which saves the pictures
 * into public/ch11/.
 *
 * A panorama is a cylinder: many narrow perspective slices side by side, one column of pixels per
 * 1/f radians of turn. Turning the head in the game is then just sliding the picture sideways.
 */

export type SpotId = 'torch' | 'door' | 'radio' | 'wardrobe' | 'bed';

export interface ViewSpec {
  pos: [number, number, number];
  /** Head turn at the picture's left and right edges (radians, left is larger). */
  yawFrom: number;
  yawTo: number;
  /** Vertical field of view in degrees. */
  vfov: number;
  height: number;
}

export interface SetSpec {
  /** 0 shut, 1 ajar, 1.5 wide open */
  door: number;
  radioOn: boolean;
  micOnFloor: boolean;
  torchOnBed: boolean;
  /** Where it stands, if it is in the picture. */
  it?: { pos: [number, number, number]; rotY: number; look?: number; lean?: number };
  /** The version the flashlight reveals: a warm light from Theo's hand. */
  lit: boolean;
}

export interface Baked {
  image: string;
  width: number;
  height: number;
  /** Pixels per radian of head turn. */
  f: number;
  spots: Partial<Record<SpotId, { x: number; y: number; w: number; h: number }>>;
}

const renderer = new WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.toneMapping = ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = PCFSoftShadowMap;
renderer.setClearColor(BG);
renderer.setPixelRatio(1);
document.body.appendChild(renderer.domElement);

const scene = new Scene();
scene.fog = new FogExp2(0x0b0f16, 0.055);
const world = buildWorld();
const it = new Creature3D();
it.traverse((o) => (o.castShadow = true));
const hemi = new HemisphereLight(0x22304a, 0x0c0a08, 0.55);
const hand = new PointLight(0xffe2b0, 0, 0, 1.6);
scene.add(world.root, it, hemi, hand);
const camera = new PerspectiveCamera(60, 1, 0.03, 120);
camera.rotation.order = 'YXZ';

function dress(set: SetSpec, at: Vector3) {
  world.doorPivot.rotation.y = -set.door;
  world.radio.setOn(set.radioOn, 0);
  world.micOnDesk.visible = !set.micOnFloor;
  world.micOnFloor.visible = set.micOnFloor;
  world.torch.visible = set.torchOnBed;
  world.clockHands.minute.rotation.z = -(17 / 60) * Math.PI * 2;
  world.clockHands.hour.rotation.z = -((3 + 17 / 60) / 12) * Math.PI * 2;
  world.candle.light.intensity = 0;
  world.candle.flame.visible = false;
  world.moon.intensity = 2.4;
  world.doorMist.visible = false;
  world.watch.visible = false;
  it.visible = !!set.it;
  if (set.it) {
    it.position.set(...set.it.pos);
    it.rotation.y = set.it.rotY;
    it.pose(0, set.it.look ?? 0, set.it.lean ?? 0);
  }
  hand.intensity = set.lit ? 6 : 0;
  // dark enough to need the torch, light enough to make out the shapes of the room
  hemi.intensity = set.lit ? 0.55 : 0.9;
  hand.position.copy(at).add(new Vector3(0.1, -0.15, 0));
}

function project(view: ViewSpec, f: number, height: number, p: Vector3) {
  const [cx, cy, cz] = view.pos;
  const dx = p.x - cx;
  const dy = p.y - cy;
  const dz = p.z - cz;
  const yaw = Math.atan2(-dx, -dz);
  const flat = Math.hypot(dx, dz);
  return { x: (view.yawFrom - yaw) * f, y: height / 2 - (f * dy) / flat };
}

export function bake(view: ViewSpec, set: SetSpec): Baked {
  const H = view.height;
  const f = H / 2 / Math.tan(((view.vfov / 2) * Math.PI) / 180);
  const W = Math.round((view.yawFrom - view.yawTo) * f);
  const at = new Vector3(...view.pos);
  dress(set, at);
  renderer.setSize(W, H, false);
  renderer.setScissorTest(true);
  camera.position.copy(at);
  camera.fov = view.vfov;
  const slice = 16;
  renderer.shadowMap.autoUpdate = true;
  for (let x = 0; x < W; x += slice) {
    const w = Math.min(slice, W - x);
    camera.aspect = w / H;
    camera.updateProjectionMatrix();
    camera.rotation.set(0, view.yawFrom - (x + w / 2) / f, 0);
    renderer.setViewport(x, 0, w, H);
    renderer.setScissor(x, 0, w, H);
    renderer.render(scene, camera);
    // the lights and their shadow cameras do not move between slices
    renderer.shadowMap.autoUpdate = false;
  }
  renderer.setScissorTest(false);

  const spots: Baked['spots'] = {};
  for (const [id, obj] of Object.entries(world.spots) as [SpotId, (typeof world.spots)[SpotId]][]) {
    if (!obj.visible) continue;
    const box = new Box3().setFromObject(obj);
    const xs: number[] = [];
    const ys: number[] = [];
    for (const px of [box.min.x, box.max.x])
      for (const py of [box.min.y, box.max.y])
        for (const pz of [box.min.z, box.max.z]) {
          const q = project(view, f, H, new Vector3(px, py, pz));
          xs.push(q.x);
          ys.push(q.y);
        }
    const x0 = Math.max(0, Math.min(...xs));
    const x1 = Math.min(W, Math.max(...xs));
    if (x1 <= x0) continue;
    const y0 = Math.max(0, Math.min(...ys));
    const y1 = Math.min(H, Math.max(...ys));
    spots[id] = { x: Math.round(x0), y: Math.round(y0), w: Math.round(x1 - x0), h: Math.round(y1 - y0) };
  }
  return { image: renderer.domElement.toDataURL('image/webp', 0.86), width: W, height: H, f, spots };
}

declare global {
  interface Window {
    bake: typeof bake;
  }
}
window.bake = bake;
