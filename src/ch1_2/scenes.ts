/**
 * The one place of Chapter 1.2 that has no baked picture yet: the cloth he wakes under. Drawn once onto
 * a 2D canvas (the picture), a darker copy for the dark and the same picture for the flashlight to show
 * through, exactly like the baked views. (The yard, the three stops outside, the kitchen glass and the
 * garage are baked: tools/bake/ch12.mjs, public/ch12/.)
 *
 * Placeholder: the cloth is owned by the Chapter 1 art thread and will be replaced by their bake.
 */
export const SCENE_W = 1920;
export const SCENE_H = 1080;

export type DrawnScene = 'cloth';

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

function vignette(g: CanvasRenderingContext2D, strength: number) {
  const v = g.createRadialGradient(SCENE_W / 2, SCENE_H / 2, SCENE_H * 0.25, SCENE_W / 2, SCENE_H / 2, SCENE_H * 0.95);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, `rgba(0,0,0,${strength})`);
  g.fillStyle = v;
  g.fillRect(0, 0, SCENE_W, SCENE_H);
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

const DRAW: Record<DrawnScene, (g: CanvasRenderingContext2D) => void> = { cloth: drawCloth };

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
