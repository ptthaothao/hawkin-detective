import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type Texture } from 'three';

/**
 * Surfaces for the Chapter 1.2 exterior set: weathered wood, siding, earth, road, rust, mist.
 * Drawn once per bake from seeded value noise, so every bake looks the same. Each comes with
 * its own bump map (the same picture read as height) so the low moon rakes across the grain.
 */

export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function hash(x: number, y: number, seed: number) {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(seed, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Smooth value noise, tiling every `period` cells. */
function vnoise(x: number, y: number, period: number, seed: number) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const p = (i: number, j: number) => hash(((i % period) + period) % period, ((j % period) + period) % period, seed);
  const a = p(x0, y0);
  const b = p(x0 + 1, y0);
  const c = p(x0, y0 + 1);
  const d = p(x0 + 1, y0 + 1);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

export function fbm(u: number, v: number, base: number, octaves: number, seed: number) {
  let sum = 0;
  let amp = 0.5;
  let total = 0;
  let per = base;
  for (let o = 0; o < octaves; o++) {
    sum += amp * vnoise(u * per, v * per, per, seed + o * 17);
    total += amp;
    amp *= 0.5;
    per *= 2;
  }
  return sum / total;
}

function make(w: number, h: number, paint: (ctx: CanvasRenderingContext2D) => void, repeat: [number, number] = [1, 1]): Texture {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  paint(c.getContext('2d')!);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.wrapS = t.wrapT = RepeatWrapping;
  t.repeat.set(...repeat);
  t.anisotropy = 8;
  return t;
}

type Rgb = [number, number, number];
const mix = (a: Rgb, b: Rgb, k: number): Rgb => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

/** Per-pixel painter: gets u,v in 0..1 and returns a colour. */
function pixels(w: number, h: number, color: (u: number, v: number, x: number, y: number) => Rgb, repeat: [number, number] = [1, 1]) {
  return make(w, h, (ctx) => {
    const img = ctx.createImageData(w, h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const [r, g, b] = color(x / w, y / h, x, y);
        const i = (y * w + x) * 4;
        img.data[i] = Math.max(0, Math.min(255, r));
        img.data[i + 1] = Math.max(0, Math.min(255, g));
        img.data[i + 2] = Math.max(0, Math.min(255, b));
        img.data[i + 3] = 255;
      }
    ctx.putImageData(img, 0, 0);
  }, repeat);
}

let cache: ReturnType<typeof build> | null = null;

function build() {
  /** Old board: long grain, knots, dark weather stains, a silver-grey sheen. */
  const wood = (base: Rgb, seed: number, grey = 0.5) =>
    pixels(512, 256, (u, v) => {
      const grain = fbm(u * 1, v * 9, 4, 4, seed);
      const fine = fbm(u * 4, v * 60, 8, 3, seed + 5);
      const stain = fbm(u, v, 3, 4, seed + 11);
      const knot = Math.max(0, 1 - Math.hypot((u - 0.62) * 9, (v - 0.4) * 2.4) * 1.4) * 0.5;
      let k = 0.45 + grain * 0.5 + (fine - 0.5) * 0.4 - knot;
      k *= 0.7 + stain * 0.6;
      const c = mix(base, [base[0] * 0.8 + 30, base[1] * 0.85 + 30, base[2] * 0.95 + 34], grey * (0.4 + stain * 0.6));
      return [c[0] * k * 1.5, c[1] * k * 1.5, c[2] * k * 1.5];
    });

  /** One clapboard: a shadow line along the lower lap, chipped grey paint over bare wood. */
  const siding = pixels(512, 128, (u, v) => {
    const edge = v < 0.1 ? 0.3 : v > 0.93 ? 0.6 : 1;
    const paint = fbm(u * 2, v * 3, 4, 5, 31);
    const grain = fbm(u * 2, v * 40, 4, 3, 33);
    const peel = paint > 0.54 ? 1 : 0;
    const dirt = fbm(u, v * 0.5, 3, 5, 37);
    const woodTone: Rgb = [92, 78, 62];
    const paintTone: Rgb = mix([132, 142, 138], [96, 106, 100], dirt);
    const c = mix(paintTone, woodTone, peel * (0.5 + grain * 0.5));
    const k = edge * (0.5 + dirt * 0.6) * (0.9 + (grain - 0.5) * 0.3);
    return [c[0] * k, c[1] * k, c[2] * k];
  });

  const earth = pixels(512, 512, (u, v) => {
    const a = fbm(u, v, 4, 6, 41);
    const b = fbm(u * 6, v * 6, 8, 3, 43);
    const wet = fbm(u, v, 2, 3, 47);
    const c = mix([46, 40, 30], [74, 70, 52], a);
    const m = 0.65 + b * 0.5 - wet * 0.15;
    return [c[0] * m, c[1] * m, c[2] * m];
  }, [10, 10]);

  /** Dead grass: pale straw and dark soil, short blade marks over a noisy ground. */
  const grass = pixels(512, 512, (u, v, x, y) => {
    const a = fbm(u, v, 4, 6, 51);
    const b = fbm(u * 3, v * 3, 8, 4, 53);
    const blade = hash(x >> 2, y >> 3, 57) > 0.9 ? 1 : 0;
    const straw: Rgb = [92, 92, 64];
    const green: Rgb = [40, 58, 44];
    const soil: Rgb = [30, 28, 22];
    let c = mix(soil, mix(green, straw, b), 0.4 + a * 0.7);
    if (blade) c = mix(c, [100, 100, 74], 0.25);
    const m = 0.7 + a * 0.6;
    return [c[0] * m, c[1] * m, c[2] * m];
  }, [28, 28]);

  const road = pixels(512, 512, (u, v, x, y) => {
    const a = fbm(u, v, 4, 6, 61);
    const stone = hash(x, y, 63) > 0.93 ? 1 : 0;
    // cracks: thin dark lines where a second noise crosses a threshold
    const cr = Math.abs(fbm(u, v, 3, 3, 67) - 0.5);
    const crack = cr < 0.008 ? 0.35 : 1;
    const c = mix([48, 50, 54], [78, 78, 76], a);
    const m = (0.7 + stone * 0.35) * crack * (0.85 + hash(x, y, 69) * 0.3);
    return [c[0] * m, c[1] * m, c[2] * m];
  }, [6, 6]);

  const rust = pixels(256, 256, (u, v) => {
    const a = fbm(u, v, 4, 5, 71);
    const b = fbm(u * 5, v * 5, 4, 3, 73);
    const c = mix([84, 60, 44], [150, 88, 46], Math.max(0, a * 1.4 - 0.4));
    const m = 0.55 + b * 0.7;
    return [c[0] * m, c[1] * m, c[2] * m];
  });

  const brick = pixels(512, 512, (u, v) => {
    const rows = 14;
    const row = Math.floor(v * rows);
    const bu = u * 7 + (row % 2) * 0.5;
    const iu = bu - Math.floor(bu);
    const iv = v * rows - row;
    const mortar = iu < 0.06 || iv < 0.1;
    const r = hash(Math.floor(bu), row, 81);
    if (mortar) return [58, 56, 52].map((c) => c * (0.7 + fbm(u, v, 8, 3, 83) * 0.5)) as Rgb;
    const c = mix([96, 52, 42], [124, 70, 52], r);
    const soot = fbm(u, v, 3, 4, 85);
    const m = (0.6 + soot * 0.6) * (0.85 + hash(Math.floor(u * 128), Math.floor(v * 128), 87) * 0.3);
    return [c[0] * m, c[1] * m, c[2] * m];
  }, [1, 1]);

  /** The dead-wood grey of old studs and rafters. */
  const timber = wood([110, 98, 82], 91, 0.8);
  const planks = wood([92, 74, 56], 93, 0.6);
  const darkPlanks = wood([70, 56, 42], 95, 0.5);
  const bark = pixels(256, 512, (u, v) => {
    const a = fbm(u * 5, v * 1.2, 8, 5, 101);
    const ridge = Math.abs(Math.sin((u + a * 0.4) * Math.PI * 14));
    const m = 0.35 + ridge * 0.55 + (fbm(u, v, 6, 3, 103) - 0.5) * 0.3;
    return [58 * m, 52 * m, 46 * m];
  });
  const plaster = pixels(256, 256, (u, v) => {
    const a = fbm(u, v, 4, 5, 111);
    const stain = fbm(u, v * 0.5, 3, 4, 113);
    const c = mix([108, 100, 82], [70, 62, 48], stain);
    const m = 0.7 + a * 0.5;
    return [c[0] * m, c[1] * m, c[2] * m];
  }, [3, 3]);

  /** A soft cloud for the ground mist, alpha only. */
  const cloud = make(256, 256, (ctx) => {
    const img = ctx.createImageData(256, 256);
    for (let y = 0; y < 256; y++)
      for (let x = 0; x < 256; x++) {
        const u = x / 256;
        const v = y / 256;
        const n = fbm(u, v, 3, 5, 121);
        const a = Math.max(0, Math.min(1, (n - 0.32) * 2.2));
        const i = (y * 256 + x) * 4;
        img.data[i] = 150;
        img.data[i + 1] = 170;
        img.data[i + 2] = 195;
        img.data[i + 3] = Math.round(a * 255);
      }
    ctx.putImageData(img, 0, 0);
  }, [5, 5]);

  /** Crossed grass cards: blades fanning from the bottom edge. */
  const tuft = make(128, 128, (ctx) => {
    const r = rng(131);
    for (let i = 0; i < 26; i++) {
      const x = 14 + r() * 100;
      const lean = (r() - 0.5) * 38;
      const h = 50 + r() * 74;
      const shade = 54 + Math.floor(r() * 60);
      ctx.strokeStyle = `rgb(${shade + 20},${shade + 22},${shade - 6})`;
      ctx.lineWidth = 1.2 + r() * 1.6;
      ctx.beginPath();
      ctx.moveTo(x, 128);
      ctx.quadraticCurveTo(x + lean * 0.3, 128 - h * 0.6, x + lean, 128 - h);
      ctx.stroke();
    }
  });

  /** Faint scribbled dust and the grain of old tin for the cans' labels. */
  const label = pixels(128, 64, (u, v, x, y) => {
    const a = fbm(u, v, 4, 4, 141);
    const band = v > 0.28 && v < 0.74 ? 1 : 0;
    const paper: Rgb = band ? mix([150, 126, 88], [96, 74, 54], a) : [88, 90, 92];
    const stripe = band && Math.abs(u - 0.5) < 0.2 && Math.abs(v - 0.5) < 0.05 ? 0.45 : 1;
    const dirt = 0.55 + hash(x, y, 143) * 0.2 + fbm(u, v, 6, 3, 145) * 0.35;
    return [paper[0] * stripe * dirt, paper[1] * stripe * dirt, paper[2] * stripe * dirt];
  });

  /** Breath on window glass: a haze, running drops, one long crack. */
  const fog = (seed: number) =>
    make(1024, 1024, (ctx) => {
      const img = ctx.createImageData(1024, 1024);
      for (let y = 0; y < 1024; y++)
        for (let x = 0; x < 1024; x++) {
          const u = x / 1024;
          const v = y / 1024;
          const n = fbm(u, v, 3, 5, seed);
          const edge = Math.min(1, Math.min(u, 1 - u, v, 1 - v) * 4);
          const haze = Math.max(0, Math.min(1, 0.35 + n * 0.9 - edge * 0.35));
          const i = (y * 1024 + x) * 4;
          img.data[i] = 168;
          img.data[i + 1] = 186;
          img.data[i + 2] = 204;
          img.data[i + 3] = Math.round(haze * 130);
        }
      ctx.putImageData(img, 0, 0);
      const r = rng(seed + 9);
      ctx.globalCompositeOperation = 'destination-out';
      // water running down: clear streaks with a bead at the foot
      for (let i = 0; i < 11; i++) {
        const x = r() * 1024;
        const y0 = r() * 500;
        const len = 120 + r() * 420;
        const w = 2 + r() * 3;
        ctx.strokeStyle = `rgba(0,0,0,${0.5 + r() * 0.3})`;
        ctx.lineWidth = w;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x, y0);
        let cx = x;
        for (let s = 1; s <= 8; s++) {
          cx += (r() - 0.5) * 9;
          ctx.lineTo(cx, y0 + (len * s) / 8);
        }
        ctx.stroke();
        ctx.fillStyle = 'rgba(0,0,0,0.9)';
        ctx.beginPath();
        ctx.arc(cx, y0 + len, w * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
      for (let i = 0; i < 70; i++) {
        ctx.fillStyle = `rgba(0,0,0,${0.25 + r() * 0.4})`;
        ctx.beginPath();
        ctx.arc(r() * 1024, r() * 1024, 1 + r() * 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
      // cleared glass must still carry the haze's colour, or it shades to black at the edges
      const px = ctx.getImageData(0, 0, 1024, 1024);
      for (let i = 0; i < px.data.length; i += 4)
        if (px.data[i + 3] < 40) {
          px.data[i] = 168;
          px.data[i + 1] = 186;
          px.data[i + 2] = 204;
        }
      ctx.putImageData(px, 0, 0);
      // one old crack
      ctx.strokeStyle = 'rgba(220,235,250,0.3)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      let x = 690;
      let y = 70;
      ctx.moveTo(x, y);
      for (let s = 0; s < 7; s++) {
        x += (r() - 0.45) * 70;
        y += 70 + r() * 70;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    });

  return { wood, siding, earth, grass, road, rust, brick, timber, planks, darkPlanks, bark, plaster, cloud, tuft, label, fog };
}

export function surfaces() {
  if (!cache) cache = build();
  return cache;
}
