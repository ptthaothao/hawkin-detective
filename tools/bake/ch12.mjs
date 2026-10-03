// Bakes the Chapter 1.2 pictures from the 3D set into public/ch12/ and the numbers into src/ch1_2/pano/views.json.
// Usage: start `npx vite --port 5199`, then `node tools/bake/ch12.mjs [only-this-id]`.
// Needs a Chromium with WebGL; set CHROMIUM to its path if it is not at /opt/pw-browsers/chromium.
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { chromium } from 'playwright-core';

const OUT = new URL('../../public/ch12/', import.meta.url);
const URL_ = process.env.BAKE_URL ?? 'http://localhost:5199/tools/bake/ch12.html';
const only = process.argv[2];

const b = await chromium.launch({
  executablePath: process.env.CHROMIUM ?? '/opt/pw-browsers/chromium',
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const p = await b.newPage();
p.on('pageerror', (e) => console.error('page error', e.message));
p.on('console', (m) => (m.type() === 'error' ? console.error('console', m.text()) : null));
await p.goto(URL_);
await p.waitForFunction(() => typeof window.bake12 === 'function', null, { timeout: 120_000 });

mkdirSync(OUT, { recursive: true });
const manifestFile = new URL('../../src/ch1_2/pano/views.json', import.meta.url);
mkdirSync(new URL('./', manifestFile), { recursive: true });
const manifest = existsSync(manifestFile) ? JSON.parse(readFileSync(manifestFile, 'utf8')) : {};
const ids = await p.evaluate(() => window.shots12);
for (const id of ids) {
  if (only && id !== only) continue;
  for (const lit of process.env.DARK_ONLY ? [false] : [false, true]) {
    const t0 = Date.now();
    const r = await p.evaluate(([i, l]) => window.bake12(i, l), [id, lit]);
    const file = `${id}${lit ? '-lit' : ''}.webp`;
    writeFileSync(new URL(file, OUT), Buffer.from(r.image.split(',')[1], 'base64'));
    if (!lit) {
      const entry = { width: r.width, height: r.height, f: r.f, rects: r.rects, marks: r.marks };
      if (r.focus !== undefined) entry.focus = r.focus;
      if (r.yawFrom !== undefined) entry.yawFrom = r.yawFrom;
      manifest[id] = entry;
    }
    console.log(file, `${r.width}x${r.height}`, `${((Date.now() - t0) / 1000).toFixed(1)}s`);
  }
}
writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + '\n');
await b.close();
