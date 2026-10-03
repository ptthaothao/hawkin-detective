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
  type Mesh,
  type Object3D,
} from 'three';
import { Creature2D, creatureReady } from './creature2d';
import { BG, buildWorld } from './world';

/**
 * Bakes the 3D set into the pictures the PixiJS chapter shows. Not part of the game: it runs in
 * a browser page (tools/bake/ch11.html) driven by tools/bake/ch11.mjs, which saves the pictures
 * into public/ch11/ and the numbers into src/ch1_1/pano/views.json.
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
  /** Looking up (+) or down (-), radians. */
  pitch?: number;
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
  it?: { pos: [number, number, number]; look?: number; lean?: number };
  /** The version the flashlight reveals: a warm light from Theo's hand. */
  lit: boolean;
  /** 1920 has slid in over the room: the old wallpaper, the candle where the switch was. */
  slid?: boolean;
  /** The moonlit mist beyond the garage doors. */
  mist?: boolean;
  /** Theo's watch on the floor under the bed. */
  watch?: boolean;
  /** Brightness of the sky-and-ground light. */
  hemi?: number;
  /** Render only this one object, on a transparent ground: a layer that sits in front of it. */
  only?: 'bed' | 'louvreA' | 'louvreB';
  /** World points to find in the picture. */
  marks?: Record<string, [number, number, number]>;
}

export interface Mark {
  x: number;
  y: number;
  /** Pixels per metre at that spot. */
  s: number;
}

export interface Baked {
  image: string;
  width: number;
  height: number;
  /** Pixels per radian of head turn. */
  f: number;
  spots: Partial<Record<SpotId, { x: number; y: number; w: number; h: number }>>;
  marks: Record<string, Mark>;
  /** Where the wardrobe doors sit in the picture: left/right edge. */
  doors?: { a: [number, number]; b: [number, number] };
}

const renderer = new WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: true });
renderer.toneMapping = ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = PCFSoftShadowMap;
renderer.setPixelRatio(1);
document.body.appendChild(renderer.domElement);

const scene = new Scene();
scene.fog = new FogExp2(0x0b0f16, 0.055);
const world = buildWorld();
const it = new Creature2D();
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
  world.wallMat.map = set.slid ? world.paper1920 : world.paper1986;
  world.wallMat.needsUpdate = true;
  world.candle.light.intensity = set.slid ? 9 : 0;
  world.candle.flame.visible = !!set.slid;
  world.moon.intensity = set.slid ? 1.1 : 2.4;
  world.doorMist.visible = !!set.mist;
  world.watch.visible = !!set.watch;
  world.wardrobeDoors[0].rotation.y = 0;
  world.wardrobeDoors[1].rotation.y = 0;
  it.visible = !!set.it;
  if (set.it) {
    it.position.set(...set.it.pos);
    it.pose(0, set.it.look ?? 0, set.it.lean ?? 0);
    it.face(at);
  }
  hand.intensity = set.lit ? 6 : 0;
  // dark enough to need the torch, light enough to make out the shapes of the room
  hemi.intensity = set.hemi ?? (set.lit ? 0.55 : 0.9);
  hand.position.copy(at).add(new Vector3(0.1, -0.15, 0));
}

function project(view: ViewSpec, f: number, height: number, p: Vector3) {
  const [cx, cy, cz] = view.pos;
  const dx = p.x - cx;
  const dy = p.y - cy;
  const dz = p.z - cz;
  const yaw = Math.atan2(-dx, -dz);
  const flat = Math.hypot(dx, dz);
  const pitch = view.pitch ?? 0;
  // the picture is rendered with the camera pitched; a point's height on it follows the same tilt
  const rise = Math.atan2(dy, flat) - pitch;
  return { x: (view.yawFrom - yaw) * f, y: height / 2 - f * Math.tan(rise), flat };
}

function rectOf(view: ViewSpec, f: number, H: number, W: number, obj: Object3D) {
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
  const y0 = Math.max(0, Math.min(...ys));
  const y1 = Math.min(H, Math.max(...ys));
  return { x0, x1, y0, y1 };
}

/** Everything but `keep` is hidden for a layer pass; returns a function that puts it back. */
function isolate(keep: Object3D) {
  const inside = new Set<Object3D>();
  keep.traverse((o) => inside.add(o));
  const hidden: Mesh[] = [];
  const hide = (root: Object3D) =>
    root.traverse((o) => {
      const m = o as Mesh;
      if (m.isMesh && m.visible && !inside.has(o)) {
        m.visible = false;
        hidden.push(m);
      }
    });
  hide(world.root);
  hide(it);
  return () => hidden.forEach((m) => (m.visible = true));
}

export async function bake(view: ViewSpec, set: SetSpec): Promise<Baked> {
  await creatureReady;
  const H = view.height;
  const f = H / 2 / Math.tan(((view.vfov / 2) * Math.PI) / 180);
  const W = Math.round((view.yawFrom - view.yawTo) * f);
  const at = new Vector3(...view.pos);
  dress(set, at);
  const layer = set.only ? { bed: world.spots.bed, louvreA: world.wardrobeDoors[0], louvreB: world.wardrobeDoors[1] }[set.only] : null;
  const restore = layer ? isolate(layer) : null;
  renderer.setClearColor(layer ? 0x000000 : BG, layer ? 0 : 1);
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
    camera.rotation.set(view.pitch ?? 0, view.yawFrom - (x + w / 2) / f, 0);
    renderer.setViewport(x, 0, w, H);
    renderer.setScissor(x, 0, w, H);
    renderer.clear();
    renderer.render(scene, camera);
    // the lights and their shadow cameras do not move between slices
    renderer.shadowMap.autoUpdate = false;
  }
  renderer.setScissorTest(false);
  restore?.();

  const spots: Baked['spots'] = {};
  for (const [id, obj] of Object.entries(world.spots) as [SpotId, (typeof world.spots)[SpotId]][]) {
    if (!obj.visible) continue;
    const r = rectOf(view, f, H, W, obj);
    if (r.x1 <= r.x0) continue;
    spots[id] = { x: Math.round(r.x0), y: Math.round(r.y0), w: Math.round(r.x1 - r.x0), h: Math.round(r.y1 - r.y0) };
  }
  const marks: Baked['marks'] = {};
  for (const [id, p] of Object.entries(set.marks ?? {})) {
    const q = project(view, f, H, new Vector3(...p));
    marks[id] = { x: Math.round(q.x), y: Math.round(q.y), s: +(f / q.flat).toFixed(1) };
  }
  const doors = set.marks
    ? (() => {
        const a = rectOf(view, f, H, W, world.wardrobeDoors[0]);
        const b = rectOf(view, f, H, W, world.wardrobeDoors[1]);
        return { a: [Math.round(a.x0), Math.round(a.x1)] as [number, number], b: [Math.round(b.x0), Math.round(b.x1)] as [number, number] };
      })()
    : undefined;
  return { image: renderer.domElement.toDataURL('image/webp', 0.86), width: W, height: H, f, spots, marks, doors };
}

/** The little rectangle of a thing's footprint, for masks (the crack between the garage doors). */
export function rect(view: ViewSpec, min: [number, number, number], max: [number, number, number]) {
  const H = view.height;
  const f = H / 2 / Math.tan(((view.vfov / 2) * Math.PI) / 180);
  const W = Math.round((view.yawFrom - view.yawTo) * f);
  const xs: number[] = [];
  const ys: number[] = [];
  for (const px of [min[0], max[0]])
    for (const py of [min[1], max[1]])
      for (const pz of [min[2], max[2]]) {
        const q = project(view, f, H, new Vector3(px, py, pz));
        xs.push(q.x);
        ys.push(q.y);
      }
  return {
    x: Math.round(Math.max(0, Math.min(...xs))),
    y: Math.round(Math.max(0, Math.min(...ys))),
    w: Math.round(Math.min(W, Math.max(...xs)) - Math.max(0, Math.min(...xs))),
    h: Math.round(Math.min(H, Math.max(...ys)) - Math.max(0, Math.min(...ys))),
  };
}

declare global {
  interface Window {
    bake: typeof bake;
    bakeRect: typeof rect;
  }
}
window.bake = bake;
window.bakeRect = rect;
