/**
 * The places of Chapter 1.2 that have no baked picture yet: the yard, the dead town, the glass of the
 * back door, the cloth he wakes under. Drawn once onto a 2D canvas (the picture), a darker copy for the
 * dark and the same picture for the flashlight to show through, exactly like the baked views.
 *
 * Placeholders: each is meant to be replaced by a bake from the 3D set, under the same name.
 */
export const SCENE_W = 1920;
export const SCENE_H = 1080;

export type DrawnScene = 'yard' | 'out0' | 'out1' | 'out2' | 'glass' | 'cloth';

const canvas = () => {
  const c = document.createElement('canvas');
  c.width = SCENE_W;
  c.height = SCENE_H;
  return c;
};

/** A small seeded random, so the same scene looks the same every time. */
function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sky(g: CanvasRenderingContext2D, horizon: number, moon: [number, number] | null) {
  const s = g.createLinearGradient(0, 0, 0, horizon);
  s.addColorStop(0, '#04060a');
  s.addColorStop(0.7, '#0d131c');
  s.addColorStop(1, '#1c2634');
  g.fillStyle = s;
  g.fillRect(0, 0, SCENE_W, horizon + 2);
  if (moon) {
    const glow = g.createRadialGradient(moon[0], moon[1], 0, moon[0], moon[1], 520);
    glow.addColorStop(0, 'rgba(170,190,215,0.35)');
    glow.addColorStop(0.3, 'rgba(110,130,160,0.12)');
    glow.addColorStop(1, 'rgba(110,130,160,0)');
    g.fillStyle = glow;
    g.fillRect(0, 0, SCENE_W, SCENE_H);
    g.fillStyle = '#c8d4e2';
    g.beginPath();
    g.arc(moon[0], moon[1], 34, 0, Math.PI * 2);
    g.fill();
  }
}

function ground(g: CanvasRenderingContext2D, horizon: number) {
  const s = g.createLinearGradient(0, horizon, 0, SCENE_H);
  s.addColorStop(0, '#11161b');
  s.addColorStop(0.4, '#0a0d10');
  s.addColorStop(1, '#040506');
  g.fillStyle = s;
  g.fillRect(0, horizon, SCENE_W, SCENE_H - horizon);
}

function mist(g: CanvasRenderingContext2D, y: number, h: number, alpha: number) {
  const s = g.createLinearGradient(0, y - h, 0, y + h);
  s.addColorStop(0, 'rgba(120,140,160,0)');
  s.addColorStop(0.5, `rgba(120,140,160,${alpha})`);
  s.addColorStop(1, 'rgba(120,140,160,0)');
  g.fillStyle = s;
  g.fillRect(0, y - h, SCENE_W, h * 2);
}

const silhouette = '#05070a';
const rim = 'rgba(150,170,195,0.35)';

function house(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, windowLit: boolean) {
  g.fillStyle = silhouette;
  g.fillRect(x, y, w, h);
  g.beginPath();
  g.moveTo(x - 30, y);
  g.lineTo(x + w / 2, y - h * 0.55);
  g.lineTo(x + w + 30, y);
  g.closePath();
  g.fill();
  g.strokeStyle = rim;
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(x - 30, y);
  g.lineTo(x + w / 2, y - h * 0.55);
  g.lineTo(x + w + 30, y);
  g.stroke();
  // the attic window; in this world it still glows, faintly, with a radio's colour
  const wx = x + w / 2 - 28;
  const wy = y - h * 0.22;
  g.fillStyle = windowLit ? 'rgba(201,164,106,0.55)' : '#0a0d12';
  g.fillRect(wx, wy, 56, 76);
  g.strokeStyle = '#000';
  g.lineWidth = 4;
  g.strokeRect(wx, wy, 56, 76);
  g.beginPath();
  g.moveTo(wx + 28, wy);
  g.lineTo(wx + 28, wy + 76);
  g.stroke();
  if (windowLit) {
    const glow = g.createRadialGradient(wx + 28, wy + 38, 0, wx + 28, wy + 38, 160);
    glow.addColorStop(0, 'rgba(201,164,106,0.25)');
    glow.addColorStop(1, 'rgba(201,164,106,0)');
    g.fillStyle = glow;
    g.fillRect(wx - 160, wy - 130, 380, 330);
  }
  // dark windows below
  g.fillStyle = '#0a0d12';
  for (const fx of [0.16, 0.7]) g.fillRect(x + w * fx, y + h * 0.25, 70, 92);
}

function planks(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, seed: number) {
  const r = rng(seed);
  for (let px = x; px < x + w; px += 26) {
    const shade = 14 + Math.floor(r() * 14);
    g.fillStyle = `rgb(${shade},${shade - 3},${shade - 6})`;
    g.fillRect(px, y, 24, h);
  }
}

function deadTree(g: CanvasRenderingContext2D, x: number, y: number, size: number, seed: number) {
  const r = rng(seed);
  g.strokeStyle = silhouette;
  g.lineCap = 'round';
  const branch = (bx: number, by: number, angle: number, len: number, width: number, depth: number) => {
    if (depth === 0 || len < 8) return;
    const ex = bx + Math.cos(angle) * len;
    const ey = by + Math.sin(angle) * len;
    g.lineWidth = width;
    g.beginPath();
    g.moveTo(bx, by);
    g.lineTo(ex, ey);
    g.stroke();
    const n = 2 + (r() > 0.6 ? 1 : 0);
    for (let i = 0; i < n; i++) branch(ex, ey, angle + (r() - 0.5) * 1.3, len * (0.62 + r() * 0.15), width * 0.66, depth - 1);
  };
  branch(x, y, -Math.PI / 2 + (r() - 0.5) * 0.2, size, size * 0.09, 7);
}

function fence(g: CanvasRenderingContext2D, x0: number, x1: number, y: number, seed: number) {
  const r = rng(seed);
  g.fillStyle = silhouette;
  for (let x = x0; x < x1; x += 70 + r() * 20) {
    const h = 70 + r() * 40;
    const tilt = (r() - 0.5) * 0.3;
    g.save();
    g.translate(x, y);
    g.rotate(tilt);
    g.fillRect(-7, -h, 14, h);
    g.restore();
    if (r() > 0.35) g.fillRect(x, y - h * 0.7, 76, 8);
  }
}

function vignette(g: CanvasRenderingContext2D, strength: number) {
  const v = g.createRadialGradient(SCENE_W / 2, SCENE_H / 2, SCENE_H * 0.25, SCENE_W / 2, SCENE_H / 2, SCENE_H * 0.95);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, `rgba(0,0,0,${strength})`);
  g.fillStyle = v;
  g.fillRect(0, 0, SCENE_W, SCENE_H);
}

function drawYard(g: CanvasRenderingContext2D) {
  sky(g, 640, [1480, 150]);
  ground(g, 640);
  house(g, 90, 300, 720, 380, true);
  // the old garage, planks and shut double doors with the crack of moonlight between them
  planks(g, 1000, 430, 640, 290, 3);
  g.fillStyle = silhouette;
  g.beginPath();
  g.moveTo(980, 430);
  g.lineTo(1320, 360);
  g.lineTo(1660, 430);
  g.closePath();
  g.fill();
  g.fillStyle = '#0b0a08';
  g.fillRect(1230, 500, 180, 220);
  g.fillStyle = 'rgba(170,200,230,0.85)';
  g.fillRect(1318, 500, 4, 220);
  g.strokeStyle = rim;
  g.lineWidth = 2;
  g.strokeRect(1230, 500, 180, 220);
  fence(g, 0, SCENE_W, 760, 11);
  deadTree(g, 1780, 760, 300, 5);
  mist(g, 700, 90, 0.2);
  vignette(g, 0.55);
}

function drawOut0(g: CanvasRenderingContext2D) {
  sky(g, 600, [420, 170]);
  ground(g, 600);
  // the neighbour's house: only the frame is left, studs and rafters against the sky
  g.strokeStyle = silhouette;
  g.lineWidth = 10;
  const x0 = 760;
  const x1 = 1360;
  g.strokeRect(x0, 400, x1 - x0, 200);
  for (let x = x0; x <= x1; x += 60) {
    g.beginPath();
    g.moveTo(x, 400);
    g.lineTo(x, 600);
    g.stroke();
  }
  g.lineWidth = 12;
  g.beginPath();
  g.moveTo(x0 - 20, 400);
  g.lineTo((x0 + x1) / 2, 270);
  g.lineTo(x1 + 20, 400);
  g.stroke();
  for (let x = x0 + 60; x < x1; x += 120) {
    g.lineWidth = 8;
    g.beginPath();
    g.moveTo(x, 400);
    g.lineTo((x0 + x1) / 2, 270);
    g.stroke();
  }
  g.fillStyle = silhouette;
  g.fillRect(1230, 250, 46, 150);
  fence(g, 0, 700, 690, 21);
  fence(g, 1420, SCENE_W, 700, 22);
  deadTree(g, 300, 640, 220, 8);
  mist(g, 620, 110, 0.22);
  vignette(g, 0.6);
}

function drawOut1(g: CanvasRenderingContext2D) {
  sky(g, 560, [1500, 120]);
  ground(g, 560);
  // an empty road running away to the dark
  g.fillStyle = '#080a0d';
  g.beginPath();
  g.moveTo(880, 560);
  g.lineTo(1040, 560);
  g.lineTo(1700, SCENE_H);
  g.lineTo(220, SCENE_H);
  g.closePath();
  g.fill();
  g.strokeStyle = 'rgba(120,130,140,0.14)';
  g.lineWidth = 4;
  g.setLineDash([40, 60]);
  g.beginPath();
  g.moveTo(960, 560);
  g.lineTo(960, SCENE_H);
  g.stroke();
  g.setLineDash([]);
  // a lamp post, bent, never lit
  g.strokeStyle = silhouette;
  g.lineWidth = 14;
  g.beginPath();
  g.moveTo(520, 700);
  g.lineTo(520, 330);
  g.quadraticCurveTo(520, 270, 610, 280);
  g.stroke();
  g.fillStyle = silhouette;
  g.fillRect(596, 276, 40, 22);
  deadTree(g, 1420, 640, 260, 14);
  deadTree(g, 1650, 620, 180, 15);
  mist(g, 580, 140, 0.26);
  vignette(g, 0.65);
}

function drawOut2(g: CanvasRenderingContext2D) {
  const s = g.createLinearGradient(0, 0, 0, SCENE_H);
  s.addColorStop(0, '#020305');
  s.addColorStop(0.6, '#07090d');
  s.addColorStop(1, '#0c1014');
  g.fillStyle = s;
  g.fillRect(0, 0, SCENE_W, SCENE_H);
  // nothing: a wall of fog, and ground that gives out a few steps in front of him
  mist(g, 520, 260, 0.1);
  mist(g, 700, 200, 0.12);
  vignette(g, 0.85);
}

function drawGlass(g: CanvasRenderingContext2D) {
  sky(g, 640, [1500, 160]);
  ground(g, 640);
  planks(g, 1180, 470, 520, 200, 9);
  g.fillStyle = silhouette;
  g.beginPath();
  g.moveTo(1160, 470);
  g.lineTo(1440, 410);
  g.lineTo(1720, 470);
  g.closePath();
  g.fill();
  fence(g, 0, SCENE_W, 790, 31);
  mist(g, 760, 120, 0.3);
  // the window itself: heavy dark frame, a cross of bars, a crack, a little glare on the pane
  g.fillStyle = '#0a0806';
  g.fillRect(0, 0, SCENE_W, 90);
  g.fillRect(0, SCENE_H - 90, SCENE_W, 90);
  g.fillRect(0, 0, 150, SCENE_H);
  g.fillRect(SCENE_W - 150, 0, 150, SCENE_H);
  g.fillRect(SCENE_W / 2 - 14, 0, 28, SCENE_H);
  g.fillRect(0, SCENE_H / 2 - 12, SCENE_W, 24);
  g.strokeStyle = 'rgba(220,235,255,0.2)';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(1300, 90);
  g.lineTo(1340, 260);
  g.lineTo(1290, 380);
  g.lineTo(1330, 540);
  g.stroke();
  const glare = g.createLinearGradient(200, 100, 700, 900);
  glare.addColorStop(0, 'rgba(200,220,255,0.08)');
  glare.addColorStop(0.5, 'rgba(200,220,255,0)');
  g.fillStyle = glare;
  g.fillRect(150, 90, 800, 900);
  vignette(g, 0.7);
}

function drawCloth(g: CanvasRenderingContext2D) {
  const r = rng(77);
  g.fillStyle = '#17140e';
  g.fillRect(0, 0, SCENE_W, SCENE_H);
  // folds: wavy dark and light strokes down the whole cloth
  for (let i = 0; i < 90; i++) {
    const x = r() * SCENE_W;
    const w = 20 + r() * 90;
    g.strokeStyle = r() > 0.5 ? 'rgba(0,0,0,0.28)' : 'rgba(80,70,50,0.14)';
    g.lineWidth = w;
    g.beginPath();
    g.moveTo(x, -20);
    g.bezierCurveTo(x + (r() - 0.5) * 220, 360, x + (r() - 0.5) * 220, 720, x + (r() - 0.5) * 120, SCENE_H + 20);
    g.stroke();
  }
  // weave
  g.globalAlpha = 0.07;
  g.fillStyle = '#000';
  for (let y = 0; y < SCENE_H; y += 6) g.fillRect(0, y, SCENE_W, 2);
  g.globalAlpha = 1;
  // the slit where two folds do not meet: cold moonlight, thin, and a little the floor of the garage beyond
  const x = 1010;
  const glow = g.createRadialGradient(x, 540, 0, x, 540, 360);
  glow.addColorStop(0, 'rgba(150,180,215,0.22)');
  glow.addColorStop(1, 'rgba(150,180,215,0)');
  g.fillStyle = glow;
  g.fillRect(x - 380, 100, 760, 900);
  g.fillStyle = 'rgba(200,220,245,0.92)';
  g.beginPath();
  g.moveTo(x - 3, 190);
  g.lineTo(x + 5, 190);
  g.lineTo(x + 9, 540);
  g.lineTo(x + 3, 880);
  g.lineTo(x - 5, 880);
  g.lineTo(x - 8, 540);
  g.closePath();
  g.fill();
  vignette(g, 0.8);
}

const DRAW: Record<DrawnScene, (g: CanvasRenderingContext2D) => void> = {
  yard: drawYard,
  out0: drawOut0,
  out1: drawOut1,
  out2: drawOut2,
  glass: drawGlass,
  cloth: drawCloth,
};

export function drawScene(id: DrawnScene): { dark: HTMLCanvasElement; lit: HTMLCanvasElement } {
  const lit = canvas();
  DRAW[id](lit.getContext('2d')!);
  const dark = canvas();
  const g = dark.getContext('2d')!;
  g.drawImage(lit, 0, 0);
  g.fillStyle = id === 'cloth' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,6,0.55)';
  g.fillRect(0, 0, SCENE_W, SCENE_H);
  return { dark, lit };
}
