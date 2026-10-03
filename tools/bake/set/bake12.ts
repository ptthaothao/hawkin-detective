import {
  ACESFilmicToneMapping,
  Box3,
  DirectionalLight,
  FogExp2,
  DoubleSide,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  Scene,
  Vector3,
  WebGLRenderer,
  type Object3D,
} from 'three';
import { BG, GARAGE, buildWorld } from './world';
import { HOUSE_X, KITCHEN, cans, fence, garageFace, groundMist, houseBack, rainBarrel, sky, stoop, terrain, tufts, wheelbarrow, woods } from './exterior';
import { stationFrame, stationFork, stationRoad, type Station } from './streets';
import { surfaces } from './surfaces';

/**
 * Bakes the Chapter 1.2 pictures: the yard, the three stops outside, the glass of the kitchen window,
 * and the garage again with tin cans in its corner. Driven by tools/bake/ch12.mjs, which saves the
 * pictures into public/ch12/ and the numbers into src/ch1_2/pano/views.json.
 * It builds its own copy of the 3D set (world.ts is shared and untouched) and adds the outdoors on top.
 */

type P3 = [number, number, number];
type Scene12 = 'garage' | 'yard' | 'glass' | 'out0' | 'out1' | 'out2';

interface Shot {
  id: string;
  scene: Scene12;
  pos: P3;
  /** Panorama: head turn at the left and right edges. */
  yawFrom?: number;
  yawTo?: number;
  /** One flat perspective picture (the window): where it looks and how wide it is. */
  yaw?: number;
  aspect?: number;
  pitch?: number;
  vfov: number;
  height: number;
  /** Boxes to turn into pixel rectangles (click areas), in world metres (stations: relative to the set). */
  rects?: Record<string, [P3, P3]>;
  /** Floor points to find in the picture. */
  marks?: Record<string, P3>;
  focusYaw?: number;
}

const VFOV = 64;
const H = 1080;
const STATION_AT = [400, 800, 1200];

const renderer = new WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: false });
renderer.toneMapping = ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = PCFSoftShadowMap;
renderer.setPixelRatio(1);
document.body.appendChild(renderer.domElement);

const scene = new Scene();
const world = buildWorld();
const hemi = new HemisphereLight(0x22304a, 0x0c0a08, 0.55);
const hand = new PointLight(0xffe2b0, 0, 0, 1.6);
const moonFill = new DirectionalLight(0x6f8cb8, 0);
const moonOut = new DirectionalLight(0x8fa8d4, 0);
moonOut.castShadow = true;
// a faint cold fill from the camera's side, so the faces turned toward us are not black; and a pool of moonlight before the garage
const pool = new PointLight(0x8aa6d0, 0, 16, 1.3);
pool.position.set(13.4, 2.4, -1.3);
moonFill.position.set(30, 14, 22);
scene.add(world.root, hemi, hand, moonOut, moonOut.target, moonFill, pool);
const camera = new PerspectiveCamera(60, 1, 0.03, 220);
camera.rotation.order = 'YXZ';

// ---- the outdoors, built once ----
const S = surfaces();
void S;
const yard = new Group();
const pathMask = (x: number, z: number) => {
  const wob = Math.sin(x * 0.9) * 0.18;
  const along = x > HOUSE_X && x < GARAGE.x - GARAGE.w / 2 + 0.2 ? Math.max(0, 1 - Math.abs(z + 1.3 - wob) / 0.75) : 0;
  const stoopPatch = Math.max(0, 1 - Math.hypot(x - 10.4, (z + 1.3) * 1.2) / 1.6);
  const garagePatch = Math.max(0, 1 - Math.hypot(x - 15.2, (z + 1.3) * 0.9) / 2.2);
  return Math.min(1, Math.max(along, stoopPatch, garagePatch * 0.8));
};
const flatArea = (x: number, z: number) => {
  const nearHouse = x < HOUSE_X + 0.4 ? 1 : 0;
  const nearGarage = x > GARAGE.x - GARAGE.w / 2 - 0.3 && x < GARAGE.x + GARAGE.w / 2 + 0.3 && Math.abs(z - GARAGE.z) < GARAGE.d / 2 + 0.3 ? 1 : 0;
  return Math.max(nearHouse, nearGarage);
};
yard.add(terrain(18, -2, 70, 280, pathMask, flatArea));
yard.add(tufts(4200, 8.8, 40, -9, 9, (x, z) => pathMask(x, z) < 0.25 && !flatArea(x, z) && !(x > 7.8 && x < 8.7) && Math.hypot(x - 12.8, z + 2.6) > 1.3, 5, 0.55));
yard.add(houseBack());
yard.add(stoop());
yard.add(rainBarrel(9.15, 1.5));
const barrow = wheelbarrow();
barrow.position.set(12.8, 0.0, -2.6);
barrow.rotation.y = 2.2;
barrow.rotation.z = 0.02;
yard.add(barrow);
yard.add(garageFace());
yard.add(fence(9.5, -8.4, 36, -8.8, 6));
yard.add(fence(35, -8.8, 36.5, 12, 7));
yard.add(woods(-8, 46, -42, -10.5, 90, 3, () => false));
yard.add(woods(27, 46, -10, 20, 24, 4, (x, z) => Math.abs(z - GARAGE.z) < 4.2 && x < 29));
yard.add(woods(-6, 8, -12, -5, 5, 8, () => false));
yard.add(groundMist(18, -2, 70));
const skyYard = sky(new Vector3(-0.35, 0.5, -0.8).normalize());
scene.add(yard, skyYard);

const stations: Station[] = [stationFrame(), stationRoad(), stationFork()];
const skies = stations.map((st) => sky(st.moon));
stations.forEach((st, i) => {
  st.group.position.set(STATION_AT[i], 0, 0);
  scene.add(st.group, skies[i]);
});

// the kitchen window's glass: breath, running drops, a crack; and the dark behind it when seen from outside
const fogTex = S.fog(151);
const windowFog = new Mesh(
  new PlaneGeometry(KITCHEN.z1 - KITCHEN.z0 + 0.02, KITCHEN.y1 - KITCHEN.y0 + 0.02),
  new MeshBasicMaterial({ map: fogTex, transparent: true, depthWrite: false, opacity: 0.6, fog: false, side: DoubleSide }),
);
windowFog.rotation.y = Math.PI / 2;
windowFog.position.set(HOUSE_X - 0.14, (KITCHEN.y0 + KITCHEN.y1) / 2, (KITCHEN.z0 + KITCHEN.z1) / 2);
windowFog.renderOrder = 8;
const windowGlass = new Mesh(
  new PlaneGeometry(KITCHEN.z1 - KITCHEN.z0, KITCHEN.y1 - KITCHEN.y0),
  new MeshStandardMaterial({ color: 0x0b141e, roughness: 0.08, metalness: 0.6, transparent: true, opacity: 0.35, side: DoubleSide }),
);
windowGlass.rotation.y = Math.PI / 2;
windowGlass.position.set(HOUSE_X - 0.12, (KITCHEN.y0 + KITCHEN.y1) / 2, (KITCHEN.z0 + KITCHEN.z1) / 2);
const windowDark = new Mesh(new PlaneGeometry(KITCHEN.z1 - KITCHEN.z0 + 0.1, KITCHEN.y1 - KITCHEN.y0 + 0.1), new MeshBasicMaterial({ color: 0x03060a }));
windowDark.rotation.y = Math.PI / 2;
windowDark.position.set(HOUSE_X - 0.5, (KITCHEN.y0 + KITCHEN.y1) / 2, (KITCHEN.z0 + KITCHEN.z1) / 2);
// muntins: a cross of old bars across the opening, on the glass
const bars = new Group();
const barMat = new MeshStandardMaterial({ map: S.timber, bumpMap: S.timber, bumpScale: 1.6, color: 0x8a847a, roughness: 1, side: DoubleSide });
const mid = new Vector3(HOUSE_X - 0.1, (KITCHEN.y0 + KITCHEN.y1) / 2, (KITCHEN.z0 + KITCHEN.z1) / 2);
const vbar = new Mesh(new PlaneGeometry(0.05, KITCHEN.y1 - KITCHEN.y0).translate(0, 0, 0), barMat);
vbar.rotation.y = Math.PI / 2;
vbar.position.copy(mid);
const hbar = new Mesh(new PlaneGeometry(0.05, KITCHEN.z1 - KITCHEN.z0), barMat);
hbar.rotation.set(0, Math.PI / 2, Math.PI / 2);
hbar.position.copy(mid);
bars.add(vbar, hbar);
// real bars have depth: thin boxes on both faces
for (const d of [-0.012, 0.012]) {
  const v = new Mesh(new PlaneGeometry(0.03, KITCHEN.y1 - KITCHEN.y0), barMat);
  v.rotation.y = Math.PI / 2;
  v.position.copy(mid).add(new Vector3(d, 0, 0));
  const h2 = new Mesh(new PlaneGeometry(KITCHEN.z1 - KITCHEN.z0, 0.03), barMat);
  h2.rotation.y = Math.PI / 2;
  h2.position.copy(mid).add(new Vector3(d, 0, 0));
  bars.add(v, h2);
}
scene.add(windowFog, windowGlass, windowDark, bars);

// the tin cans in the garage corner
const pile = cans(new Vector3(19.12, 0.0, -4.12), 0.5);
// a thread of moonlight finding the corner through the planks, so the cans can be made out
const corner = new PointLight(0x9fb8e0, 1.6, 2.2, 1.4);
corner.position.set(19.5, 0.75, -3.75);
pile.add(corner);
corner.position.set(0.38, 0.75, 0.37);
scene.add(pile);

// meshes of world.ts that only the interior bake wants: the room's outer shell and the back door's blue pane
const shell: Mesh[] = [];
const oldRoof: Mesh[] = [];
const backPane: Mesh[] = [];
world.root.traverse((o) => {
  const m = o as Mesh;
  if (!m.isMesh) return;
  const mm = m.material as MeshStandardMaterial;
  if (mm.color && mm.color.getHex() === 0x3a3630) shell.push(m);
  if (mm.color && mm.color.getHex() === 0x2a2620) oldRoof.push(m);
  if (m.parent?.userData.backDoor && (m.geometry as PlaneGeometry).type === 'PlaneGeometry') backPane.push(m);
});

// remember the shared lights as world.ts made them, to hand them back for the garage
const worldMoon = { pos: world.moon.position.clone(), target: world.moon.target.position.clone(), intensity: 2.4 };

interface Look {
  fog: [number, number];
  fogDensity: number;
  hemi: [number, number];
  exposure: number;
  moon: number;
  moonColor: number;
  hand: number;
}
const LOOK: Record<Scene12, Look> = {
  garage: { fog: [0x0b0f16, 0], fogDensity: 0.055, hemi: [0.7, 0.7], exposure: 1.25, moon: 0, moonColor: 0x8fa8d4, hand: 6 },
  yard: { fog: [0x16202e, 0], fogDensity: 0.03, hemi: [1.2, 0.8], exposure: 1.3, moon: 2.0, moonColor: 0x93acd8, hand: 26 },
  glass: { fog: [0x16202e, 0], fogDensity: 0.028, hemi: [1.2, 0.8], exposure: 1.35, moon: 2.0, moonColor: 0x93acd8, hand: 22 },
  out0: { fog: [0x151e2b, 0], fogDensity: 0.034, hemi: [0.85, 0.5], exposure: 1.3, moon: 2.0, moonColor: 0x93acd8, hand: 26 },
  out1: { fog: [0x151e2b, 0], fogDensity: 0.036, hemi: [0.8, 0.5], exposure: 1.3, moon: 1.9, moonColor: 0x93acd8, hand: 26 },
  out2: { fog: [0x0f1621, 0], fogDensity: 0.062, hemi: [0.65, 0.4], exposure: 1.25, moon: 1.4, moonColor: 0x8aa2cc, hand: 26 },
};

function configure(shot: Shot, lit: boolean) {
  const look = LOOK[shot.scene];
  const isGarage = shot.scene === 'garage';
  const stIndex = shot.scene.startsWith('out') ? Number(shot.scene.slice(3)) : -1;
  const outdoors = !isGarage;
  // what is in the picture
  world.root.visible = isGarage || shot.scene === 'yard' || shot.scene === 'glass';
  yard.visible = shot.scene === 'yard' || shot.scene === 'glass';
  skyYard.visible = yard.visible;
  stations.forEach((st, i) => {
    st.group.visible = i === stIndex;
    skies[i].visible = i === stIndex;
  });
  shell.forEach((m) => (m.visible = isGarage));
  oldRoof.forEach((m) => (m.visible = isGarage));
  backPane.forEach((m) => {
    m.visible = isGarage;
  });
  pile.visible = isGarage;
  const glass = shot.scene === 'glass';
  windowFog.visible = windowGlass.visible = bars.visible = glass || shot.scene === 'yard';
  windowDark.visible = shot.scene === 'yard';
  windowFog.visible = glass || shot.scene === 'yard';
  // the garage keeps world.ts's own moon and mist; outdoors, the moon is ours
  world.moon.intensity = isGarage ? worldMoon.intensity : 0;
  world.doorPivot.rotation.y = -1.5;
  world.radio.setOn(false, 0);
  world.micOnDesk.visible = false;
  world.micOnFloor.visible = true;
  world.torch.visible = false;
  world.candle.light.intensity = 0;
  world.candle.flame.visible = false;
  world.doorMist.visible = isGarage;
  world.watch.visible = false;
  world.hallMoon.intensity = outdoors ? 0 : 3;
  moonOut.intensity = outdoors ? look.moon : 0;
  moonOut.color.setHex(look.moonColor);
  moonFill.intensity = outdoors && stIndex < 0 ? 0.7 : outdoors ? 1.0 : 0;
  pool.intensity = outdoors && stIndex < 0 ? 30 : 0;
  const cam = new Vector3(...shot.pos);
  if (outdoors) {
    const dir = (stIndex >= 0 ? stations[stIndex].moon : new Vector3(-0.35, 0.5, -0.8)).clone().normalize();
    const base = stIndex >= 0 ? new Vector3(STATION_AT[stIndex], 0, -6) : new Vector3(14, 0, -1);
    moonOut.target.position.copy(base);
    moonOut.position.copy(base).addScaledVector(dir, 60);
    const c = moonOut.shadow.camera;
    const reach = stIndex >= 0 ? 24 : 20;
    c.left = -reach;
    c.right = reach;
    c.top = reach;
    c.bottom = -reach;
    c.near = 10;
    c.far = 140;
    c.updateProjectionMatrix();
    moonOut.shadow.mapSize.set(4096, 4096);
    moonOut.shadow.bias = -0.0008;
    moonOut.shadow.normalBias = 0.03;
    const sk = stIndex >= 0 ? skies[stIndex] : skyYard;
    sk.position.copy(cam);
  }
  renderer.toneMappingExposure = look.exposure;
  scene.fog = new FogExp2(look.fog[0], look.fogDensity);
  hemi.intensity = lit ? look.hemi[1] : look.hemi[0];
  hand.intensity = lit ? look.hand : 0;
  hand.position.copy(cam).add(new Vector3(0.1, -0.15, 0));
  if (isGarage) hemi.intensity = 0.7;
  return cam;
}

function projector(shot: Shot, f: number, W: number) {
  const cam = new Vector3(...shot.pos);
  if (shot.yaw !== undefined) {
    return (p: Vector3) => {
      const v = p.clone().project(camera);
      return { x: (v.x * 0.5 + 0.5) * W, y: (1 - (v.y * 0.5 + 0.5)) * H, flat: Math.hypot(p.x - cam.x, p.z - cam.z) };
    };
  }
  return (p: Vector3) => {
    const dx = p.x - cam.x;
    const dy = p.y - cam.y;
    const dz = p.z - cam.z;
    const yaw = Math.atan2(-dx, -dz);
    const flat = Math.hypot(dx, dz);
    const rise = Math.atan2(dy, flat) - (shot.pitch ?? 0);
    return { x: (shot.yawFrom! - yaw) * f, y: H / 2 - f * Math.tan(rise), flat };
  };
}

function rectOf(project: (p: Vector3) => { x: number; y: number }, W: number, min: Vector3, max: Vector3) {
  const xs: number[] = [];
  const ys: number[] = [];
  for (const px of [min.x, max.x])
    for (const py of [min.y, max.y])
      for (const pz of [min.z, max.z]) {
        const q = project(new Vector3(px, py, pz));
        xs.push(q.x);
        ys.push(q.y);
      }
  const x0 = Math.max(0, Math.min(...xs));
  const x1 = Math.min(W, Math.max(...xs));
  const y0 = Math.max(0, Math.min(...ys));
  const y1 = Math.min(H, Math.max(...ys));
  return { x: Math.round(x0), y: Math.round(y0), w: Math.round(x1 - x0), h: Math.round(y1 - y0) };
}

// ---------------------------------------------------------------------------------------- the shots

const GARAGE_VIEW = { pos: [20, 0.32, -3.4] as P3, yawFrom: 3.0, yawTo: 0.4, pitch: 0.1 };
const pt = (x: number, y: number, z: number): P3 => [x, y, z];

export const SHOTS: Shot[] = [
  // the same view as 1.1's garage, with the cans in the corner
  {
    id: 'garage-cans',
    scene: 'garage',
    ...GARAGE_VIEW,
    vfov: VFOV,
    height: H,
    focusYaw: 1.7,
    rects: { cans: [pt(18.85, 0, -4.35), pt(19.5, 0.36, -3.8)] },
  },
  // the yard: from the grass in front of the back door, the garage across the way
  {
    id: 'yard',
    scene: 'yard',
    pos: [13.3, 1.1, 3.4],
    yawFrom: 1.15,
    yawTo: -1.45,
    pitch: 0.06,
    vfov: VFOV,
    height: H,
    focusYaw: -0.4,
    rects: { garage: [pt(15.9, 0, GARAGE.z - 1.25), pt(16.0, 2.4, GARAGE.z + 1.25)] },
  },
  // the glass of the kitchen window
  {
    id: 'glass',
    scene: 'glass',
    pos: [7.45, 1.35, -3.3],
    yaw: -Math.PI / 2,
    aspect: 16 / 9,
    vfov: 58,
    height: H,
    marks: { itFrom: pt(14.6, 0, -4.9), itTo: pt(15.3, 0, -2.2) },
  },
  // the three stops outside (the camera stands at the set's origin, eye at a seven-year-old's height)
  {
    id: 'out0',
    scene: 'out0',
    pos: [STATION_AT[0], 1.1, -3],
    yawFrom: 1.3,
    yawTo: -1.3,
    pitch: 0.05,
    vfov: VFOV,
    height: H,
    focusYaw: 0,
    rects: { onward: [pt(-3.9, 0, -17), pt(3.9, 5, -10.5)] },
  },
  {
    id: 'out1',
    scene: 'out1',
    pos: [STATION_AT[1], 1.1, 0],
    yawFrom: 1.3,
    yawTo: -1.3,
    pitch: 0.03,
    vfov: VFOV,
    height: H,
    focusYaw: 0,
    rects: { onward: [pt(-2.4, 0, -60), pt(2.4, 3, -9)] },
  },
  {
    id: 'out2',
    scene: 'out2',
    pos: [STATION_AT[2], 1.1, 0],
    yawFrom: 1.3,
    yawTo: -1.3,
    pitch: 0.03,
    vfov: VFOV,
    height: H,
    focusYaw: 0,
    rects: { home: [pt(-8, 0, 1), pt(-1.5, 3, 4)] },
  },
];

const offsetFor = (shot: Shot): Vector3 => (shot.scene.startsWith('out') ? new Vector3(STATION_AT[Number(shot.scene.slice(3))], 0, 0) : new Vector3());

function grade(src: HTMLCanvasElement, W: number, lit: boolean) {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  g.drawImage(src, 0, 0);
  // a cold cast, then a vignette: the edges fall away into the dark
  g.globalCompositeOperation = 'multiply';
  g.fillStyle = lit ? 'rgb(236,238,250)' : 'rgb(214,224,248)';
  g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'source-over';
  const v = g.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, Math.max(W * 0.5, H));
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,0.55)');
  g.fillStyle = v;
  g.fillRect(0, 0, W, H);
  return c;
}

export async function bake12(id: string, lit: boolean) {
  const shot = SHOTS.find((s) => s.id === id)!;
  const f = H / 2 / Math.tan(((shot.vfov / 2) * Math.PI) / 180);
  const W = shot.yaw !== undefined ? Math.round(H * (shot.aspect ?? 16 / 9)) : Math.round((shot.yawFrom! - shot.yawTo!) * f);
  const at = configure(shot, lit);
  renderer.setClearColor(BG, 1);
  renderer.setSize(W, H, false);
  camera.position.copy(at);
  camera.fov = shot.vfov;
  renderer.shadowMap.autoUpdate = true;
  if (shot.yaw !== undefined) {
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    camera.rotation.set(shot.pitch ?? 0, shot.yaw, 0);
    camera.updateMatrixWorld(true);
    renderer.render(scene, camera);
  } else {
    renderer.setScissorTest(true);
    const slice = 16;
    for (let x = 0; x < W; x += slice) {
      const w = Math.min(slice, W - x);
      camera.aspect = w / H;
      camera.updateProjectionMatrix();
      camera.rotation.set(shot.pitch ?? 0, shot.yawFrom! - (x + w / 2) / f, 0);
      renderer.setViewport(x, 0, w, H);
      renderer.setScissor(x, 0, w, H);
      renderer.clear();
      renderer.render(scene, camera);
      renderer.shadowMap.autoUpdate = false;
    }
    renderer.setScissorTest(false);
  }
  const graded = shot.scene === 'garage' ? renderer.domElement : grade(renderer.domElement, W, lit);
  const off = offsetFor(shot);
  const project = projector(shot, f, W);
  const rects: Record<string, { x: number; y: number; w: number; h: number }> = {};
  for (const [name, [a, b]] of Object.entries(shot.rects ?? {})) rects[name] = rectOf(project, W, new Vector3(...a).add(off), new Vector3(...b).add(off));
  const marks: Record<string, { x: number; y: number; s: number }> = {};
  for (const [name, p] of Object.entries(shot.marks ?? {})) {
    const q = project(new Vector3(...p).add(off));
    marks[name] = { x: Math.round(q.x), y: Math.round(q.y), s: +(f / q.flat).toFixed(1) };
  }
  return {
    image: graded.toDataURL('image/webp', 0.84),
    width: W,
    height: H,
    f,
    yawFrom: shot.yawFrom,
    focus: shot.focusYaw !== undefined && shot.yawFrom !== undefined ? Math.round((shot.yawFrom - shot.focusYaw) * f) : undefined,
    rects,
    marks,
  };
}

/** For debugging: a box of the scene in pixels. */
export function boxOf(obj: Object3D) {
  return new Box3().setFromObject(obj);
}

declare global {
  interface Window {
    bake12: typeof bake12;
    shots12: string[];
  }
}
window.bake12 = bake12;
window.shots12 = SHOTS.map((s) => s.id);
