// Bakes the Chapter 1.1 panoramas from the 3D set into public/ch11/.
// Usage: start `npx vite --port 5199`, then `node tools/bake/ch11.mjs [only-this-id]`.
// Needs a Chromium with WebGL; set CHROMIUM to its path if it is not at /opt/pw-browsers/chromium.
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { chromium } from 'playwright-core';

const OUT = new URL('../../public/ch11/', import.meta.url);
const URL_ = process.env.BAKE_URL ?? 'http://localhost:5199/tools/bake/ch11.html';
const only = process.argv[2];

// Theo standing in his room, and Theo at the doorway looking down the hallway.
const ROOM = { pos: [0.3, 1.1, -0.3], yawFrom: 1.75, yawTo: -1.6, vfov: 64, height: 1080 };
const DOOR = { pos: [0.75, 1.12, -1.25], yawFrom: -Math.PI / 2 + 1.05, yawTo: -Math.PI / 2 - 1.05, vfov: 64, height: 1080 };
// head cocked over, leaning toward the door
const IT_IN_HALL = { pos: [5.4, 0, -1.3], rotY: -Math.PI / 2, look: 0.55, lean: 0.25 };

const base = { door: 1, radioOn: true, micOnFloor: false, torchOnBed: true };
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
  if (only && shot.id !== only) continue;
  for (const lit of [false, true]) {
    const t0 = Date.now();
    const r = await p.evaluate(([view, set]) => window.bake(view, set), [shot.view, { ...shot.set, lit }]);
    const file = `${shot.id}${lit ? '-lit' : ''}.webp`;
    writeFileSync(new URL(file, OUT), Buffer.from(r.image.split(',')[1], 'base64'));
    if (!lit) manifest[shot.id] = { width: r.width, height: r.height, f: r.f, yawFrom: shot.view.yawFrom, spots: r.spots };
    console.log(file, `${r.width}x${r.height}`, `${((Date.now() - t0) / 1000).toFixed(1)}s`);
  }
}
writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + '\n');
await b.close();
