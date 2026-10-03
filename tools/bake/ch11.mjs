// Bakes the Chapter 1.1 pictures from the 3D set into public/ch11/ and the numbers into src/ch1_1/pano/views.json.
// Usage: start `npx vite --port 5199`, then `node tools/bake/ch11.mjs [only-this-id]`.
// Needs a Chromium with WebGL; set CHROMIUM to its path if it is not at /opt/pw-browsers/chromium.
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { chromium } from 'playwright-core';

const OUT = new URL('../../public/ch11/', import.meta.url);
const URL_ = process.env.BAKE_URL ?? 'http://localhost:5199/tools/bake/ch11.html';
const only = process.argv[2];

const HEIGHT = 1080;
const VFOV = 64;
const F = HEIGHT / 2 / Math.tan(((VFOV / 2) * Math.PI) / 180);

// Theo standing in his room, and Theo at the doorway looking down the hallway.
const ROOM = { pos: [0.3, 1.1, -0.3], yawFrom: 1.75, yawTo: -1.6, vfov: VFOV, height: HEIGHT };
const DOOR = { pos: [0.75, 1.12, -1.25], yawFrom: -Math.PI / 2 + 1.05, yawTo: -Math.PI / 2 - 1.05, vfov: VFOV, height: HEIGHT };
// head cocked over, leaning toward the door
const IT_IN_HALL = { pos: [5.4, 0, -1.3], look: 0.55, lean: 0.25 };

const base = { door: 1, radioOn: true, micOnFloor: false, torchOnBed: true };

// ---- hiding: from inside the wardrobe and from under the bed ----
// Where it stands, per stop of its search, and where it comes in.
const STAND = { wardrobe: [-0.72, 0, -0.8], bed: [-0.45, 0, -1.9] };
const ENTER = [2.4, 0, -1.3];
const DESK = [1.15, 0, -2.45];
const AT_DOOR = [1.75, 0, -1.3];
const HIDE = {
  wardrobe: { pos: [-1.58, 1.12, -0.9], yaw: -1.4, pitch: -0.05, span: 1.0, lock: 0.6 },
  bed: { pos: [-1.6, 0.14, -2.45], yaw: -2.1, pitch: 0.06, span: 1.0, lock: 0.5 },
};
function hideView(spot) {
  const h = HIDE[spot];
  return { pos: h.pos, yawFrom: h.yaw + h.span, yawTo: h.yaw - h.span, pitch: h.pitch, vfov: VFOV, height: HEIGHT };
}
function hideMarks(spot) {
  const other = spot === 'wardrobe' ? STAND.bed : STAND.wardrobe;
  const marks = { enter: ENTER, desk: DESK, other, spot: STAND[spot], door: AT_DOOR };
  if (spot === 'bed') {
    // its head laid on the floor, a little toward him
    const [cx, , cz] = HIDE.bed.pos;
    const [sx, , sz] = STAND.bed;
    const len = Math.hypot(cx - sx, cz - sz);
    marks.head = [sx + ((cx - sx) / len) * 0.25, 0, sz + ((cz - sz) / len) * 0.25];
    marks.watch = [-1.1, 0.01, -2.35];
  }
  return marks;
}
const hideSet = (door, only, spot) => ({ door, radioOn: false, micOnFloor: true, torchOnBed: false, slid: true, hemi: 0.55, only, marks: only ? undefined : hideMarks(spot) });

// ---- the garage: on the floor in the back corner, looking at the doors and the fort ----
const GARAGE = { x: 18.5, z: -1.3, w: 5 };
const GX0 = GARAGE.x - GARAGE.w / 2;
const GARAGE_VIEW = { pos: [20, 0.32, -3.4], yawFrom: 3.0, yawTo: 0.4, pitch: 0.1, vfov: VFOV, height: HEIGHT };
const PASS_X = GX0 - 0.9;
const passMarks = {};
for (let i = 0; i < 9; i++) passMarks[`pass${i}`] = [PASS_X, 0, GARAGE.z + 4 - (i / 8) * 8];
const garageSet = (lit) => ({ ...base, torchOnBed: false, door: 1.5, radioOn: false, micOnFloor: true, mist: true, hemi: 0.7, lit, marks: passMarks });

// ---- carried: over its shoulder, facing back; [camera position, look-at point, roll] ----
const CARRY = [
  [[0.6, 1.6, -1.2], [-1.4, 0.4, -2.2], 0.5],
  [[4.0, 1.7, -1.3], [1.5, 0.6, -1.2], 0.35],
  [[7.6, 1.7, -1.3], [5.0, 0.3, -1.3], 0.45],
  [[12.0, 1.7, -1.0], [8.5, 0.8, -1.3], 0.3],
  [[15.4, 1.7, -1.2], [12, 0.4, -1.0], 0.4],
];
function carryView([pos, look]) {
  const dx = look[0] - pos[0];
  const dy = look[1] - pos[1];
  const dz = look[2] - pos[2];
  const yaw = Math.atan2(-dx, -dz);
  const pitch = Math.atan2(dy, Math.hypot(dx, dz));
  return { pos, yawFrom: yaw + 0.9, yawTo: yaw - 0.9, pitch, vfov: VFOV, height: HEIGHT };
}

const SHOTS = [
  // before the flashlight: torch still on the bed, door ajar, radio on
  { id: 'room-start', view: ROOM, set: base },
  // torch in hand
  { id: 'room-torch', view: ROOM, set: { ...base, torchOnBed: false } },
  // door slammed, radio still on
  { id: 'room-shut', view: ROOM, set: { ...base, torchOnBed: false, door: 0 } },
  // door shut, radio off, the mic and the book on the floor
  { id: 'room-quiet', view: ROOM, set: { ...base, torchOnBed: false, door: 0, radioOn: false, micOnFloor: true } },
  // from the doorway: it, at the end of the hallway
  { id: 'door-it', view: DOOR, set: { ...base, torchOnBed: false, door: 1.5, it: IT_IN_HALL } },
  // hiding: the door shut, then open (it opens it slowly); the layers in front of the creature
  ...['wardrobe', 'bed'].flatMap((spot) => [
    { id: `hide-${spot}`, view: hideView(spot), set: hideSet(1.5, undefined, spot), lit: false, focusYaw: HIDE[spot].yaw, lockYaw: HIDE[spot].lock },
    { id: `hide-${spot}-shut`, view: hideView(spot), set: hideSet(0, undefined, spot), lit: false, partOf: `hide-${spot}` },
    ...(spot === 'wardrobe'
      ? [
          { id: 'hide-wardrobe-louvreA', view: hideView(spot), set: hideSet(1.5, 'louvreA', spot), lit: false, layerOf: 'hide-wardrobe' },
          { id: 'hide-wardrobe-louvreB', view: hideView(spot), set: hideSet(1.5, 'louvreB', spot), lit: false, layerOf: 'hide-wardrobe' },
        ]
      : [{ id: 'hide-bed-front', view: hideView(spot), set: hideSet(1.5, 'bed', spot), lit: false, layerOf: 'hide-bed' }]),
  ]),
  // the garage: dark, and lit by the flashlight
  { id: 'garage', view: GARAGE_VIEW, set: garageSet(false), focusYaw: 1.7, crack: true },
  // carried
  ...CARRY.map((c, i) => ({
    id: `carried-${i}`,
    view: carryView(c),
    set: { ...base, torchOnBed: false, door: 1.5, radioOn: false, micOnFloor: true, hemi: 0.6 },
    lit: false,
    roll: c[2],
    focusYaw: carryView(c).yawFrom - 0.9,
    lockYaw: 0.1,
  })),
];

const b = await chromium.launch({
  executablePath: process.env.CHROMIUM ?? '/opt/pw-browsers/chromium',
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const p = await b.newPage();
p.on('pageerror', (e) => console.error('page error', e.message));
await p.goto(URL_);
await p.waitForFunction(() => typeof window.bake === 'function', null, { timeout: 60_000 });

mkdirSync(OUT, { recursive: true });
const manifestFile = new URL('../../src/ch1_1/pano/views.json', import.meta.url);
const manifest = existsSync(manifestFile) ? JSON.parse(readFileSync(manifestFile, 'utf8')) : {};
for (const shot of SHOTS) {
  if (only && shot.id !== only && shot.partOf !== only && shot.layerOf !== only) continue;
  for (const lit of shot.lit === false ? [false] : [false, true]) {
    const t0 = Date.now();
    const r = await p.evaluate(([view, set]) => window.bake(view, set), [shot.view, { ...shot.set, lit }]);
    const file = `${shot.id}${lit ? '-lit' : ''}.webp`;
    writeFileSync(new URL(file, OUT), Buffer.from(r.image.split(',')[1], 'base64'));
    if (!lit) {
      const entry = { width: r.width, height: r.height, f: r.f, yawFrom: shot.view.yawFrom, spots: r.spots };
      if (shot.set.marks) entry.marks = r.marks;
      if (r.doors && shot.set.marks && !shot.set.only) entry.doors = r.doors;
      if (shot.lit === false) entry.lit = false;
      if (shot.focusYaw !== undefined) entry.focus = Math.round((shot.view.yawFrom - shot.focusYaw) * r.f);
      if (shot.lockYaw !== undefined) entry.lock = [Math.round((shot.view.yawFrom - shot.focusYaw - shot.lockYaw) * r.f), Math.round((shot.view.yawFrom - shot.focusYaw + shot.lockYaw) * r.f)];
      if (shot.roll !== undefined) entry.roll = shot.roll;
      if (shot.crack) entry.crack = await p.evaluate((v) => window.bakeRect(v, [16 - 0.06, 0, -1.3 - 0.04], [16 + 0.06, 2.4, -1.3 + 0.04]), shot.view);
      // layers and the shut-door twin are not views of their own: they are listed on the view they belong to
      if (shot.layerOf) {
        const host = manifest[shot.layerOf] ?? (manifest[shot.layerOf] = {});
        host.layers = [...new Set([...(host.layers ?? []), shot.id.slice(shot.layerOf.length + 1)])];
      } else if (!shot.partOf) {
        manifest[shot.id] = { ...(manifest[shot.id] ?? {}), ...entry };
      } else {
        (manifest[shot.partOf] ?? (manifest[shot.partOf] = {})).shut = true;
      }
    }
    console.log(file, `${r.width}x${r.height}`, `${((Date.now() - t0) / 1000).toFixed(1)}s`);
  }
}
writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + '\n');
await b.close();
