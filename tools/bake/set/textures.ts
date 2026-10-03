import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type Texture } from 'three';

/** Procedural textures, drawn once on a canvas. Stand-ins until real photo textures exist. */
function canvasTex(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void, repeat: [number, number] = [1, 1]): Texture {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d')!);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.wrapS = t.wrapT = RepeatWrapping;
  t.repeat.set(...repeat);
  t.anisotropy = 4;
  return t;
}

/** A tiny deterministic random so textures are the same every load. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function grain(ctx: CanvasRenderingContext2D, w: number, h: number, base: [number, number, number], streaks: number, seed: number) {
  const r = rng(seed);
  ctx.fillStyle = `rgb(${base.join(',')})`;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < streaks; i++) {
    const y = r() * h;
    const d = (r() - 0.5) * 40;
    ctx.strokeStyle = `rgba(${base.map((c) => Math.max(0, Math.min(255, c + d))).join(',')},${0.25 + r() * 0.4})`;
    ctx.lineWidth = 0.5 + r() * 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= w; x += 32) ctx.lineTo(x, y + Math.sin(x / 60 + i) * 3 + (r() - 0.5) * 2);
    ctx.stroke();
  }
}

let cache: ReturnType<typeof build> | null = null;

function build() {
  return {
    floor: canvasTex(512, 512, (ctx) => {
      // planks running into the room
      const r = rng(7);
      for (let i = 0; i < 8; i++) {
        const shade = 70 + r() * 25;
        ctx.save();
        ctx.beginPath();
        ctx.rect(i * 64, 0, 64, 512);
        ctx.clip();
        ctx.translate(i * 64, 0);
        ctx.rotate(Math.PI / 2);
        grain(ctx, 512, 64, [shade, shade * 0.68, shade * 0.42], 40, 11 + i);
        ctx.restore();
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(i * 64, 0, 2, 512);
        ctx.fillRect(i * 64, r() * 512, 64, 2);
      }
    }, [3, 3]),
    wood: canvasTex(512, 256, (ctx) => grain(ctx, 512, 256, [96, 66, 42], 90, 3), [1, 1]),
    darkWood: canvasTex(512, 256, (ctx) => grain(ctx, 512, 256, [58, 40, 26], 90, 5), [1, 1]),
    // 1986: warm paper with a small diamond print
    wallpaper: canvasTex(256, 256, (ctx) => {
      ctx.fillStyle = '#8a7656';
      ctx.fillRect(0, 0, 256, 256);
      ctx.fillStyle = 'rgba(60,44,28,0.35)';
      for (let y = 0; y < 256; y += 32)
        for (let x = (y / 32) % 2 ? 16 : 0; x < 256; x += 32) {
          ctx.beginPath();
          ctx.moveTo(x, y - 5);
          ctx.lineTo(x + 4, y);
          ctx.lineTo(x, y + 5);
          ctx.lineTo(x - 4, y);
          ctx.fill();
        }
    }, [6, 4]),
    // 1920: dark stripes, stained
    oldpaper: canvasTex(256, 256, (ctx) => {
      ctx.fillStyle = '#4a3a26';
      ctx.fillRect(0, 0, 256, 256);
      ctx.fillStyle = 'rgba(28,20,12,0.5)';
      for (let x = 0; x < 256; x += 42) ctx.fillRect(x, 0, 14, 256);
      const r = rng(9);
      for (let i = 0; i < 12; i++) {
        const g = ctx.createRadialGradient(r() * 256, r() * 256, 0, r() * 256, r() * 256, 40 + r() * 60);
        g.addColorStop(0, 'rgba(20,14,8,0.35)');
        g.addColorStop(1, 'rgba(20,14,8,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 256, 256);
      }
    }, [6, 4]),
    plaid: canvasTex(256, 256, (ctx) => {
      ctx.fillStyle = '#5c2420';
      ctx.fillRect(0, 0, 256, 256);
      ctx.fillStyle = 'rgba(20,30,40,0.45)';
      for (let i = 0; i < 256; i += 64) {
        ctx.fillRect(i, 0, 22, 256);
        ctx.fillRect(0, i, 256, 22);
      }
      ctx.fillStyle = 'rgba(200,170,120,0.25)';
      for (let i = 30; i < 256; i += 64) {
        ctx.fillRect(i, 0, 3, 256);
        ctx.fillRect(0, i, 256, 3);
      }
    }, [2, 2]),
    planks: canvasTex(512, 512, (ctx) => {
      // garage boards, vertical, weathered
      const r = rng(21);
      for (let i = 0; i < 6; i++) {
        const shade = 52 + r() * 20;
        ctx.save();
        ctx.beginPath();
        ctx.rect(i * 86, 0, 86, 512);
        ctx.clip();
        ctx.translate(i * 86 + 86, 0);
        ctx.rotate(Math.PI / 2);
        grain(ctx, 512, 86, [shade, shade * 0.72, shade * 0.5], 50, 30 + i);
        ctx.restore();
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillRect(i * 86, 0, 3, 512);
      }
    }, [4, 1]),
    dirt: canvasTex(256, 256, (ctx) => {
      const r = rng(13);
      ctx.fillStyle = '#2a241c';
      ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 1600; i++) {
        ctx.fillStyle = `rgba(${r() > 0.5 ? '70,60,46' : '12,10,8'},${r() * 0.5})`;
        ctx.fillRect(r() * 256, r() * 256, 1 + r() * 3, 1 + r() * 3);
      }
    }, [8, 8]),
    grass: canvasTex(256, 256, (ctx) => {
      const r = rng(17);
      ctx.fillStyle = '#1e2620';
      ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 2400; i++) {
        ctx.fillStyle = `rgba(${r() > 0.5 ? '50,64,48' : '10,14,10'},${r() * 0.6})`;
        ctx.fillRect(r() * 256, r() * 256, 1, 2 + r() * 4);
      }
    }, [30, 30]),
  };
}

export function textures() {
  if (!cache) cache = build();
  return cache;
}

/** A canvas texture for text that changes (the radio readout). */
export function readout() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 48;
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  const draw = (text: string, on: boolean) => {
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#0a0806';
    ctx.fillRect(0, 0, 128, 48);
    if (on) {
      ctx.fillStyle = '#ffb44a';
      ctx.font = 'bold 34px "VT323", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 64, 26);
    }
    t.needsUpdate = true;
  };
  return { texture: t, draw };
}
