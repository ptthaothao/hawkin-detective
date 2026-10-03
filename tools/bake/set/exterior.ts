import {
  AdditiveBlending,
  BoxGeometry,
  CanvasTexture,
  CircleGeometry,
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  LatheGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  Points,
  PointsMaterial,
  BufferGeometry,
  RepeatWrapping,
  Shape,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  Vector2,
  Vector3,
  Path,
} from 'three';
import { Batch, V, addLimb, board, deadTree, mat, xf } from './kit';
import { fbm, rng, surfaces } from './surfaces';
import { GARAGE } from './world';

/**
 * The outdoors of Chapter 1.2 around the existing 3D set (world.ts is not touched): the back of the
 * house, the yard, the old garage's face, the fence and the woods, the sky and the ground mist, the tin
 * cans, and the kitchen window the glass picture is taken through. Metres, same axes as world.ts.
 */

export const HOUSE_X = 8.3;
export const DOOR_Z = [-1.7, -0.9] as const;
export const KITCHEN = { z0: -3.9, z1: -2.7, y0: 0.95, y1: 1.95 };

// ---------------------------------------------------------------------------------------- ground

export function terrain(cx: number, cz: number, size: number, seg: number, pathMask: (x: number, z: number) => number, flat: (x: number, z: number) => number = () => 0, tint: [number, number, number] = [1, 1, 1]) {
  const S = surfaces();
  const g = new PlaneGeometry(size, size, seg, seg);
  g.rotateX(-Math.PI / 2);
  const p = g.getAttribute('position');
  const colors: number[] = [];
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) + cx;
    const z = p.getZ(i) + cz;
    const edge = Math.min(1, (size / 2 - Math.max(Math.abs(x - cx), Math.abs(z - cz))) / 4);
    const path = pathMask(x, z);
    const lumps = fbm(x * 0.07 + 3, z * 0.07 + 5, 4, 4, 7) - 0.45;
    const small = fbm(x * 0.6, z * 0.6, 8, 3, 9) - 0.5;
    const h = Math.max(-0.02, lumps * 0.55 + small * 0.08) * edge * (1 - path * 0.8) * (1 - flat(x, z));
    p.setY(i, h);
    const dry = 0.72 + fbm(x * 0.12, z * 0.12, 4, 3, 13) * 0.55;
    const bare = path;
    colors.push(
      tint[0] * (dry * (1 - bare * 0.35) + bare * 0.1),
      tint[1] * (dry * (1 - bare * 0.4) + bare * 0.05),
      tint[2] * (dry * (1 - bare * 0.5)),
    );
  }
  g.setAttribute('color', new Float32BufferAttribute(colors, 3));
  g.computeVertexNormals();
  const m = new Mesh(g, new MeshStandardMaterial({ map: S.grass, bumpMap: S.grass, bumpScale: 0.4, vertexColors: true, roughness: 1 }));
  m.position.set(cx, 0, cz);
  m.receiveShadow = true;
  m.castShadow = false;
  return m;
}

/** Dead-grass cards scattered where `ok` allows, as one instanced mesh. */
export function tufts(count: number, x0: number, x1: number, z0: number, z1: number, ok: (x: number, z: number) => boolean, seed: number, scale = 1) {
  const S = surfaces();
  const r = rng(seed);
  const card = new PlaneGeometry(0.55, 0.45);
  card.translate(0, 0.2, 0);
  const crossed = new PlaneGeometry(0.55, 0.45);
  crossed.translate(0, 0.2, 0);
  crossed.rotateY(Math.PI / 2);
  const geo = mergeTwo(card, crossed);
  const m = new MeshStandardMaterial({ map: S.tuft, alphaTest: 0.35, side: DoubleSide, roughness: 1, color: 0xb8bcae });
  const mesh = new InstancedMesh(geo, m, count);
  let n = 0;
  for (let tries = 0; tries < count * 4 && n < count; tries++) {
    const x = x0 + r() * (x1 - x0);
    const z = z0 + r() * (z1 - z0);
    if (!ok(x, z)) continue;
    const s = (0.6 + r() * 1.1) * scale;
    mesh.setMatrixAt(n++, xf(x, 0, z, r() * 6.28, 0, 0, s));
  }
  mesh.count = n;
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  return mesh;
}

function mergeTwo(a: PlaneGeometry, b: PlaneGeometry) {
  const g = new BufferGeometry();
  const pos: number[] = [];
  const nor: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  let base = 0;
  for (const src of [a, b]) {
    const p = src.getAttribute('position');
    const n = src.getAttribute('normal');
    const t = src.getAttribute('uv');
    for (let i = 0; i < p.count; i++) {
      pos.push(p.getX(i), p.getY(i), p.getZ(i));
      nor.push(n.getX(i), n.getY(i), n.getZ(i));
      uv.push(t.getX(i), t.getY(i));
    }
    for (const i of src.index!.array) idx.push(i + base);
    base += p.count;
  }
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

/** Slabs of cold ground mist at knee and waist height; look down into them from a child's eye. */
export function groundMist(cx: number, cz: number, size: number, layers: [number, number][] = [[0.1, 0.34], [0.32, 0.26], [0.6, 0.2], [0.95, 0.12]], color = 0x7d92ad) {
  const S = surfaces();
  const out = new Group();
  layers.forEach(([y, a], i) => {
    const tex = S.cloud.clone();
    tex.needsUpdate = true;
    tex.wrapS = tex.wrapT = RepeatWrapping;
    tex.repeat.set(size / 14, size / 14);
    tex.offset.set(i * 0.37, i * 0.21);
    const m = new Mesh(new PlaneGeometry(size, size), new MeshBasicMaterial({ map: tex, color, transparent: true, opacity: a, depthWrite: false, fog: false }));
    m.rotation.x = -Math.PI / 2;
    m.position.set(cx, y, cz);
    m.renderOrder = 5 + i;
    out.add(m);
  });
  return out;
}

// ---------------------------------------------------------------------------------------- sky

export function sky(moonDir: Vector3, moonSize = 0.1) {
  const g = new Group();
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 512;
  const x = c.getContext('2d')!;
  const grad = x.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#03060c');
  grad.addColorStop(0.35, '#07101d');
  grad.addColorStop(0.46, '#12202f');
  grad.addColorStop(0.5, '#243548');
  grad.addColorStop(0.55, '#101a26');
  grad.addColorStop(1, '#05080d');
  x.fillStyle = grad;
  x.fillRect(0, 0, 4, 512);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  const dome = new Mesh(new SphereGeometry(100, 32, 24), new MeshBasicMaterial({ map: t, side: DoubleSide, fog: false, depthWrite: false }));
  dome.renderOrder = -10;
  g.add(dome);
  // stars
  const r = rng(5);
  const pts: number[] = [];
  for (let i = 0; i < 220; i++) {
    const az = r() * Math.PI * 2;
    const el = 0.12 + r() * 1.2;
    pts.push(Math.cos(az) * Math.cos(el) * 95, Math.sin(el) * 95, Math.sin(az) * Math.cos(el) * 95);
  }
  const sg = new BufferGeometry();
  sg.setAttribute('position', new Float32BufferAttribute(pts, 3));
  g.add(new Points(sg, new PointsMaterial({ color: 0xb8c8e0, size: 1.6, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.55, depthWrite: false })));
  // the moon: a pale disc with faint seas, a halo around it, a thin veil of cloud across its face
  const mc = document.createElement('canvas');
  mc.width = mc.height = 512;
  const mg = mc.getContext('2d')!;
  const halo = mg.createRadialGradient(256, 256, 20, 256, 256, 256);
  halo.addColorStop(0, 'rgba(190,210,235,0.5)');
  halo.addColorStop(0.18, 'rgba(120,150,190,0.22)');
  halo.addColorStop(0.5, 'rgba(70,95,135,0.07)');
  halo.addColorStop(1, 'rgba(70,95,135,0)');
  mg.fillStyle = halo;
  mg.fillRect(0, 0, 512, 512);
  const disc = mg.createImageData(512, 512);
  for (let py = 0; py < 512; py++)
    for (let px = 0; px < 512; px++) {
      const d = Math.hypot(px - 256, py - 256);
      if (d > 38) continue;
      const sea = fbm(px / 90, py / 90, 3, 4, 19);
      const k = 0.78 + (sea - 0.5) * 0.45 - (d / 38) ** 4 * 0.12;
      const i = (py * 512 + px) * 4;
      const a = Math.min(1, (38 - d) / 1.5);
      disc.data[i] = 214 * k;
      disc.data[i + 1] = 226 * k;
      disc.data[i + 2] = 240 * k;
      disc.data[i + 3] = 255 * a;
    }
  const tmp = document.createElement('canvas');
  tmp.width = tmp.height = 512;
  tmp.getContext('2d')!.putImageData(disc, 0, 0);
  mg.drawImage(tmp, 0, 0);
  const mt = new CanvasTexture(mc);
  mt.colorSpace = SRGBColorSpace;
  const moon = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ map: mt, transparent: true, fog: false, depthWrite: false, blending: AdditiveBlending }));
  const d = moonDir.clone().normalize();
  moon.position.copy(d.clone().multiplyScalar(90));
  moon.scale.setScalar(90 * moonSize * 8);
  moon.lookAt(0, 0, 0);
  g.add(moon);
  return g;
}

// ---------------------------------------------------------------------------------------- the house

function slab(shape: Shape, depth: number, material: MeshStandardMaterial) {
  const g = new ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  const m = new Mesh(g, material);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/** The back of the house: carcass with the back door and the kitchen window cut in, clapboard over it. */
export function houseBack() {
  const S = surfaces();
  const out = new Group();
  const zA = -4.7;
  const zB = 5.0;
  const H = 3.5;
  // carcass: shape x = -z so that extruding along +x after a quarter turn faces the yard
  const shape = new Shape();
  shape.moveTo(-zB, 0);
  shape.lineTo(-zA, 0);
  shape.lineTo(-zA, H);
  shape.lineTo(-zB, H);
  shape.closePath();
  const hole = (z0: number, z1: number, y0: number, y1: number) => {
    const p = new Path();
    p.moveTo(-z1, y0);
    p.lineTo(-z0, y0);
    p.lineTo(-z0, y1);
    p.lineTo(-z1, y1);
    p.closePath();
    shape.holes.push(p);
  };
  hole(DOOR_Z[0], DOOR_Z[1], 0, 2.05);
  hole(KITCHEN.z0, KITCHEN.z1, KITCHEN.y0, KITCHEN.y1);
  hole(2.5, 3.7, 1.0, 2.0);
  const carcass = slab(shape, 0.22, mat(S.plaster, { color: 0x6a6e70 }));
  carcass.rotation.y = Math.PI / 2;
  carcass.position.set(HOUSE_X - 0.22, 0, 0);
  out.add(carcass);

  // clapboard, course by course; boards skip the holes, a few are missing or bare
  const siding = new MeshStandardMaterial({ map: S.siding, bumpMap: S.siding, bumpScale: 1.6, roughness: 0.95, color: 0xdfe6e8 });
  const bare = mat(S.timber, { color: 0xb0aaa0, bump: 1.2, roughness: 1 });
  const rotted = mat(S.darkPlanks, { color: 0x9a948a, bump: 1.4, roughness: 1 });
  const holes = [
    { z0: DOOR_Z[0] - 0.14, z1: DOOR_Z[1] + 0.14, y1: 2.2 },
    { z0: KITCHEN.z0 - 0.14, z1: KITCHEN.z1 + 0.14, y0: KITCHEN.y0 - 0.14, y1: KITCHEN.y1 + 0.14 },
    { z0: 2.36, z1: 3.84, y0: 0.86, y1: 2.14 },
  ];
  const batch = new Batch();
  const r = rng(77);
  const course = 0.165;
  for (let row = 0, y = 0.09; y < H - 0.05; row++, y += course) {
    let z = zA;
    while (z < zB - 0.05) {
      const len = Math.min(zB - z, 1.1 + r() * 1.5);
      const zc = z + len / 2;
      z += len;
      // cut the board where a hole is
      let pieces: [number, number][] = [[zc - len / 2, zc + len / 2]];
      for (const h of holes) {
        if (y + course / 2 < (h.y0 ?? 0) || y - course / 2 > h.y1) continue;
        pieces = pieces.flatMap(([a, b]) => {
          if (b <= h.z0 || a >= h.z1) return [[a, b] as [number, number]];
          const res: [number, number][] = [];
          if (h.z0 - a > 0.12) res.push([a, h.z0]);
          if (b - h.z1 > 0.12) res.push([h.z1, b]);
          return res;
        });
      }
      for (const [a, b] of pieces) {
        const roll = r();
        if (roll < 0.035 && y > 0.4) continue; // a board gone: the carcass shows through
        const m = y < 0.55 && roll < 0.55 ? rotted : roll > 0.9 ? bare : siding;
        const wear = y < 0.55 ? 1.6 : 1;
        const sag = (r() - 0.5) * 0.05;
        batch.add(board(b - a, course * 1.05, 0.032, Math.floor(r() * 1e6), wear), m, xf(HOUSE_X + 0.015 + (row % 2) * 0.012, y, (a + b) / 2, Math.PI / 2, sag, 0));
      }
    }
  }
  out.add(batch.group());

  // door: casing boards round the opening, a worn threshold, the step it opens onto
  const trim = mat(S.timber, { color: 0xc9c4b8, bump: 1.4, roughness: 0.95 });
  const tb = new Batch();
  const zc = (DOOR_Z[0] + DOOR_Z[1]) / 2;
  const w = DOOR_Z[1] - DOOR_Z[0];
  tb.add(board(2.2, 0.13, 0.05, 301, 0.6), trim, xf(HOUSE_X + 0.07, 1.1, DOOR_Z[0] - 0.065, Math.PI / 2, 0, Math.PI / 2));
  tb.add(board(2.2, 0.13, 0.05, 302, 0.6), trim, xf(HOUSE_X + 0.07, 1.1, DOOR_Z[1] + 0.065, Math.PI / 2, 0, Math.PI / 2));
  tb.add(board(w + 0.4, 0.15, 0.06, 303, 0.8), trim, xf(HOUSE_X + 0.075, 2.12, zc, Math.PI / 2));
  tb.add(board(w + 0.3, 0.1, 0.12, 304, 1), rotted, xf(HOUSE_X + 0.08, 0.04, zc, Math.PI / 2));
  // kitchen window casing and sill
  const kz = (KITCHEN.z0 + KITCHEN.z1) / 2;
  const kw = KITCHEN.z1 - KITCHEN.z0;
  const kh = KITCHEN.y1 - KITCHEN.y0;
  const ky = (KITCHEN.y0 + KITCHEN.y1) / 2;
  tb.add(board(kh + 0.28, 0.13, 0.05, 311, 0.7), trim, xf(HOUSE_X + 0.07, ky, KITCHEN.z0 - 0.065, Math.PI / 2, 0, Math.PI / 2));
  tb.add(board(kh + 0.28, 0.13, 0.05, 312, 0.7), trim, xf(HOUSE_X + 0.07, ky, KITCHEN.z1 + 0.065, Math.PI / 2, 0, Math.PI / 2));
  tb.add(board(kw + 0.4, 0.13, 0.06, 313, 0.9), trim, xf(HOUSE_X + 0.075, KITCHEN.y1 + 0.065, kz, Math.PI / 2));
  tb.add(board(kw + 0.45, 0.07, 0.2, 314, 1), trim, xf(HOUSE_X + 0.12, KITCHEN.y0 - 0.04, kz, Math.PI / 2, 0.04));
  // the small side window, shuttered
  out.add(tb.group());

  // inside the kitchen window: plaster casing and sill so the glass picture has a frame (interior side, x < HOUSE_X)
  const inner = new Batch();
  const innerTrim = mat(S.timber, { color: 0x8a8478, bump: 1.4, roughness: 0.95 });
  inner.add(board(kh + 0.24, 0.12, 0.04, 331, 0.5), innerTrim, xf(HOUSE_X - 0.245, ky, KITCHEN.z0 - 0.06, Math.PI / 2, 0, Math.PI / 2));
  inner.add(board(kh + 0.24, 0.12, 0.04, 332, 0.5), innerTrim, xf(HOUSE_X - 0.245, ky, KITCHEN.z1 + 0.06, Math.PI / 2, 0, Math.PI / 2));
  inner.add(board(kw + 0.36, 0.12, 0.04, 333, 0.5), innerTrim, xf(HOUSE_X - 0.245, KITCHEN.y1 + 0.06, kz, Math.PI / 2));
  inner.add(board(kw + 0.4, 0.05, 0.3, 334, 0.8), innerTrim, xf(HOUSE_X - 0.38, KITCHEN.y0 - 0.025, kz, Math.PI / 2));
  out.add(inner.group());
  out.userData.inner = inner;

  // the old door's boarding and the 'dark behind the glass' for the side windows
  const dark = new Mesh(new PlaneGeometry(1.5, 1.4), new MeshBasicMaterial({ color: 0x03060a }));
  dark.rotation.y = Math.PI / 2;
  dark.position.set(HOUSE_X - 0.1, 1.5, 3.1);
  out.add(dark);

  // roof: dark shingle sheet leaning back from the eave, with the fascia and a gutter coming away
  const roofMat = mat(S.darkPlanks, { color: 0x4a4e52, bump: 2, roughness: 1 });
  const roof = new Mesh(new BoxGeometry(4.2, 0.1, 10.8, 1, 1, 1), roofMat);
  roof.position.set(HOUSE_X - 1.6, H + 0.8, 0.15);
  roof.rotation.z = -0.4;
  roof.castShadow = true;
  roof.receiveShadow = true;
  out.add(roof);
  const eave = new Batch();
  eave.add(board(10.4, 0.2, 0.05, 341, 1), trim, xf(HOUSE_X + 0.42, H + 0.1, 0.15, Math.PI / 2));
  const gutter = new Mesh(new CylinderGeometry(0.06, 0.06, 7.2, 8, 1, true, 0, Math.PI), mat(S.rust, { bump: 1.5, roughness: 0.6, metalness: 0.5 }));
  gutter.material.side = DoubleSide;
  gutter.rotation.x = Math.PI / 2;
  gutter.rotation.z = Math.PI * 0.5;
  gutter.rotation.y = 0;
  gutter.position.set(HOUSE_X + 0.46, H - 0.06, -1.3);
  gutter.rotation.set(Math.PI / 2, 0, 0.04);
  out.add(gutter);
  out.add(eave.group());
  // the gutter's downspout, bent
  const spout = new Batch();
  const rust = mat(S.rust, { bump: 1.4, roughness: 0.7, metalness: 0.5 });
  addLimb(spout, rust, V(HOUSE_X + 0.2, H - 0.1, 1.6), V(HOUSE_X + 0.2, 0.25, 1.6), 0.045, 0.045, 8);
  addLimb(spout, rust, V(HOUSE_X + 0.2, 0.25, 1.6), V(HOUSE_X + 0.6, 0.06, 1.45), 0.045, 0.045, 8);
  out.add(spout.group());

  // stone footing under the clapboard
  const foot = new Mesh(new BoxGeometry(0.3, 0.2, zB - zA), mat(S.brick, { color: 0x7a7a74, bump: 1.5 }));
  foot.position.set(HOUSE_X, 0.1, (zA + zB) / 2);
  out.add(foot);
  return out;
}

/** A low stoop at the back door, a rotted screen door hanging off one hinge. */
export function stoop() {
  const S = surfaces();
  const out = new Group();
  const wood = mat(S.planks, { color: 0xb4b0a6, bump: 1.6, roughness: 1 });
  const dark = mat(S.darkPlanks, { color: 0x8e8a82, bump: 1.6, roughness: 1 });
  const b = new Batch();
  const r = rng(401);
  const zc = (DOOR_Z[0] + DOOR_Z[1]) / 2;
  // deck boards laid out from the wall, a couple warped up, one missing
  for (let i = 0; i < 12; i++) {
    if (i === 8) continue;
    const z = zc - 0.9 + i * 0.165;
    b.add(board(1.5, 0.14, 0.035, 410 + i, 1.4), i % 3 ? wood : dark, xf(HOUSE_X + 0.92, 0.13 + r() * 0.01, z, 0, (r() - 0.5) * 0.08, 0));
  }
  // joists below, step block
  for (const dz of [-0.85, 0, 0.85]) b.add(new BoxGeometry(1.6, 0.1, 0.07), dark, xf(HOUSE_X + 0.9, 0.06, zc + dz));
  b.add(board(1.1, 0.2, 0.3, 430, 1), dark, xf(HOUSE_X + 2.1, 0.08, zc, Math.PI / 2));
  b.add(board(1.0, 0.2, 0.3, 431, 1), wood, xf(HOUSE_X + 2.1, 0.0, zc + 0.02, Math.PI / 2));
  out.add(b.group());
  // the screen door: a frame hanging open, torn mesh gone
  const sd = new Group();
  const frame = new Batch();
  const sw = 0.85;
  frame.add(board(2.0, 0.08, 0.04, 440, 0.8), wood, xf(0, 1.0, 0, 0, 0, Math.PI / 2));
  frame.add(board(2.0, 0.08, 0.04, 441, 0.8), wood, xf(sw, 1.0, 0, 0, 0, Math.PI / 2));
  frame.add(board(sw, 0.1, 0.04, 442, 0.8), wood, xf(sw / 2, 2.0, 0));
  frame.add(board(sw, 0.12, 0.04, 443, 0.8), wood, xf(sw / 2, 0.06, 0));
  frame.add(board(sw, 0.1, 0.04, 444, 0.8), wood, xf(sw / 2, 1.0, 0));
  frame.add(board(2.1, 0.06, 0.035, 445, 0.8), wood, xf(sw / 2, 1.0, 0.0, 0, 0, 0.9));
  sd.add(frame.group());
  // the sagging screen: a few strands left across the lower panel
  const strands = new Batch();
  const wire = mat(null, { color: 0x6a6e70, roughness: 0.6, metalness: 0.6 });
  for (let i = 0; i < 6; i++) addLimb(strands, wire, V(0.04, 0.2 + i * 0.07, 0), V(sw - 0.04, 0.17 + i * 0.07 + (r() - 0.5) * 0.06, 0.01), 0.004, 0.004, 4);
  sd.add(strands.group());
  // hinged on its left edge: swung 55 degrees out
  sd.position.set(HOUSE_X + 0.16, 0, DOOR_Z[1] - 0.02);
  sd.rotation.y = -Math.PI / 2 + 0.95;
  sd.rotation.z = 0.025;
  out.add(sd);
  return out;
}

export function rainBarrel(x: number, z: number) {
  const S = surfaces();
  const out = new Group();
  const prof = [new Vector2(0.0, 0), new Vector2(0.27, 0), new Vector2(0.31, 0.05), new Vector2(0.35, 0.45), new Vector2(0.31, 0.9), new Vector2(0.29, 0.92), new Vector2(0.26, 0.9), new Vector2(0.26, 0.85)];
  const barrel = new Mesh(new LatheGeometry(prof, 24), mat(S.planks, { color: 0xa09a8e, bump: 2, roughness: 1 }));
  barrel.material.side = DoubleSide;
  barrel.castShadow = true;
  barrel.receiveShadow = true;
  out.add(barrel);
  const hoop = mat(S.rust, { bump: 1.4, roughness: 0.6, metalness: 0.6 });
  for (const y of [0.08, 0.3, 0.6, 0.84]) {
    const rad = y < 0.5 ? 0.31 + (y - 0.05) * 0.1 : 0.34 - (y - 0.45) * 0.1;
    const t = new Mesh(new TorusGeometry(rad, 0.012, 6, 28), hoop);
    t.rotation.x = Math.PI / 2;
    t.position.y = y;
    out.add(t);
  }
  // water, black, half-way down
  const water = new Mesh(new CircleGeometry(0.25, 20), new MeshStandardMaterial({ color: 0x0b1118, roughness: 0.1, metalness: 0.4 }));
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.74;
  out.add(water);
  out.position.set(x, 0, z);
  return out;
}

// ---------------------------------------------------------------------------------------- yard props

/** A wheelbarrow left standing: rusted tray, wooden handles, one flat rubber wheel. Local +x is forward. */
export function wheelbarrow() {
  const S = surfaces();
  const out = new Group();
  const tin = new MeshStandardMaterial({ map: S.rust, bumpMap: S.rust, bumpScale: 2, roughness: 0.55, metalness: 0.55, side: DoubleSide, color: 0xb8aaa0 });
  const wood = mat(S.timber, { color: 0x9a9084, bump: 1.4, roughness: 1 });
  const rubber = mat(null, { color: 0x15171a, roughness: 0.9 });
  const r = rng(450);
  // tray: a shallow tapered pan, hammered a little out of true
  const pan = new CylinderGeometry(0.46, 0.27, 0.3, 4, 3, true);
  pan.rotateY(Math.PI / 4);
  pan.scale(1.0, 1, 0.78);
  const p = pan.getAttribute('position');
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    p.setXYZ(i, x + (r() - 0.5) * 0.015 + y * 0.12, y, z + (r() - 0.5) * 0.015);
  }
  pan.computeVertexNormals();
  const tray = new Mesh(pan, tin);
  tray.position.set(0, 0.5, 0);
  tray.rotation.z = 0.12;
  tray.castShadow = true;
  tray.receiveShadow = true;
  out.add(tray);
  const floor = new Mesh(new PlaneGeometry(0.58, 0.42), tin);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0.0, 0.36, 0);
  floor.rotation.z = 0.12;
  out.add(floor);
  // a rolled rim
  const rim = new Batch();
  const rimMat = mat(S.rust, { bump: 1.5, roughness: 0.5, metalness: 0.6 });
  const corners = [V(0.4, 0.65, 0.3), V(0.4, 0.65, -0.3), V(-0.46, 0.65, -0.3), V(-0.46, 0.65, 0.3)];
  corners.forEach((a, i) => addLimb(rim, rimMat, a, corners[(i + 1) % 4], 0.012, 0.012, 6));
  out.add(rim.group());
  // frame and handles: two long timbers from the front fork back past the tray
  const frame = new Batch();
  for (const sz of [-0.27, 0.27]) {
    const a = V(0.62, 0.36, sz * 0.5);
    const mid = V(0.0, 0.34, sz);
    const end = V(-1.05, 0.62, sz * 1.08);
    addLimb(frame, wood, a, mid, 0.022, 0.026, 8);
    addLimb(frame, wood, mid, end, 0.026, 0.021, 8);
    // legs
    addLimb(frame, wood, V(-0.4, 0.38, sz), V(-0.43, 0.0, sz * 1.1), 0.022, 0.02, 7);
  }
  addLimb(frame, wood, V(-0.43, 0.04, -0.3), V(-0.43, 0.04, 0.3), 0.017, 0.017, 6);
  addLimb(frame, rimMat, V(0.62, 0.36, -0.14), V(0.62, 0.36, 0.14), 0.014, 0.014, 6);
  // wheel fork
  addLimb(frame, rimMat, V(0.62, 0.36, 0.13), V(0.6, 0.2, 0.1), 0.012, 0.012, 6);
  addLimb(frame, rimMat, V(0.62, 0.36, -0.13), V(0.6, 0.2, -0.1), 0.012, 0.012, 6);
  out.add(frame.group());
  const tire = new Mesh(new TorusGeometry(0.19, 0.055, 12, 28), rubber);
  tire.position.set(0.6, 0.22, 0);
  tire.scale.set(1, 1, 1.1);
  tire.castShadow = true;
  out.add(tire);
  const hub = new Mesh(new CylinderGeometry(0.075, 0.075, 0.14, 12), rimMat);
  hub.rotation.x = Math.PI / 2;
  hub.position.set(0.6, 0.22, 0);
  out.add(hub);
  for (let i = 0; i < 6; i++) {
    const sp = new Mesh(new CylinderGeometry(0.005, 0.005, 0.28, 4), rimMat);
    sp.position.set(0.6, 0.22, 0);
    sp.rotation.z = (i / 6) * Math.PI;
    out.add(sp);
  }
  // a little old leaf litter and dirt in the pan
  const dirt = new Mesh(new PlaneGeometry(0.5, 0.3), mat(S.earth, { color: 0x6d6a60 }));
  dirt.rotation.x = -Math.PI / 2;
  dirt.rotation.z = 0.12;
  dirt.position.set(0.02, 0.385, 0);
  out.add(dirt);
  return out;
}

/** A leaning plank fence: posts, rails, pickets of unequal height, some gone, some off at angles. */
export function fence(x0: number, z0: number, x1: number, z1: number, seed: number) {
  const S = surfaces();
  const b = new Batch();
  const r = rng(seed);
  const wood = mat(S.planks, { color: 0xa8a396, bump: 1.8, roughness: 1 });
  const grey = mat(S.timber, { color: 0xa09a8c, bump: 1.8, roughness: 1 });
  const len = Math.hypot(x1 - x0, z1 - z0);
  const yaw = Math.atan2(-(z1 - z0), x1 - x0);
  const dirx = (x1 - x0) / len;
  const dirz = (z1 - z0) / len;
  const place = (u: number, _v: number, w = 0) => [x0 + dirx * u - dirz * w, 0, z0 + dirz * u + dirx * w] as const;
  for (let u = 0; u <= len + 0.01; u += 2.4) {
    const [px, , pz] = place(u, 0);
    const lean = (r() - 0.5) * 0.18;
    b.add(board(1.5 + r() * 0.2, 0.12, 0.12, Math.floor(r() * 1e6), 1.6), grey, xf(px, 0.65, pz, yaw, 0, Math.PI / 2 + lean));
  }
  for (const y of [0.35, 0.95]) {
    for (let u = 0; u < len; u += 2.4) {
      const [px, , pz] = place(u + 1.2, 0, -0.08);
      b.add(board(2.45, 0.09, 0.04, Math.floor(r() * 1e6), 1.4), grey, xf(px, y + (r() - 0.5) * 0.08, pz, yaw, 0, (r() - 0.5) * 0.06));
    }
  }
  for (let u = 0.1; u < len; u += 0.17) {
    if (r() < 0.14) continue;
    const [px, , pz] = place(u, 0, 0);
    const h = 0.8 + r() * 0.35;
    const tilt = r() < 0.2 ? (r() - 0.5) * 0.5 : (r() - 0.5) * 0.06;
    b.add(board(h, 0.13, 0.025, Math.floor(r() * 1e6), 1.8), r() < 0.4 ? wood : grey, xf(px, h / 2 + 0.03, pz, yaw, 0, Math.PI / 2 + tilt));
  }
  return b.group();
}

export function woods(cx0: number, cx1: number, cz0: number, cz1: number, count: number, seed: number, keepOut: (x: number, z: number) => boolean = () => false, centre: [number, number] = [14, 0]) {
  const S = surfaces();
  const bark = new MeshStandardMaterial({ map: S.bark, bumpMap: S.bark, bumpScale: 2.4, roughness: 1, color: 0x9a948c });
  const near = new Batch();
  const far = new Batch();
  const r = rng(seed);
  for (let i = 0; i < count; i++) {
    const x = cx0 + r() * (cx1 - cx0);
    const z = cz0 + r() * (cz1 - cz0);
    if (keepOut(x, z)) continue;
    const h = 7 + r() * 8;
    deadTree(Math.hypot(x - centre[0], z - centre[1]) < 18 ? near : far, bark, x, z, h, Math.floor(r() * 1e6));
  }
  const g = new Group();
  g.add(near.group(true), far.group(false));
  return g;
}

// ---------------------------------------------------------------------------------------- the garage

/** The garage's face from outside: strap hinges, a hasp and padlock, bracing, rotted lower boards. */
export function garageFace() {
  const S = surfaces();
  const out = new Group();
  const gx0 = GARAGE.x - GARAGE.w / 2;
  const gz0 = GARAGE.z - GARAGE.d / 2;
  const gz1 = GARAGE.z + GARAGE.d / 2;
  const x = gx0 - 0.05;
  const iron = mat(S.rust, { bump: 1.6, roughness: 0.6, metalness: 0.6, color: 0x8a8076 });
  const wood = mat(S.planks, { color: 0xb2ac9e, bump: 2, roughness: 1 });
  const grey = mat(S.timber, { color: 0xa8a294, bump: 2, roughness: 1 });
  const b = new Batch();
  const w = new Batch();
  const r = rng(601);
  // the face is clad in vertical boards over the wall boxes of world.ts
  const faces: [number, number][] = [
    [gz0, GARAGE.z - 1.2],
    [GARAGE.z + 1.2, gz1],
  ];
  for (const [a, c] of faces)
    for (let z = a + 0.1; z < c - 0.05; z += 0.2) {
      if (r() < 0.04) continue;
      const h = 3.0 + (r() - 0.5) * 0.04;
      w.add(board(h, 0.19, 0.03, Math.floor(r() * 1e6), 1.2), r() < 0.5 ? wood : grey, xf(x - 0.01, h / 2, z, Math.PI / 2, 0, Math.PI / 2 + (r() - 0.5) * 0.015));
    }
  // door leaves: each of boards, braced Z-wise with timbers
  for (const side of [-1, 1]) {
    const zc = GARAGE.z + side * 0.62;
    for (let i = 0; i < 6; i++) {
      const z = zc - 0.5 + i * 0.2;
      const h = 2.38 - (i % 3 === 0 ? r() * 0.05 : 0);
      w.add(board(h, 0.195, 0.03, Math.floor(r() * 1e6), 1.4), i % 2 ? wood : grey, xf(x - 0.03, h / 2 + 0.01, z, Math.PI / 2, 0, Math.PI / 2));
    }
    // cross braces and a diagonal
    for (const y of [0.45, 1.95]) w.add(board(1.14, 0.16, 0.04, Math.floor(r() * 1e6), 0.8), grey, xf(x - 0.065, y, zc, Math.PI / 2));
    b.add(board(2.1, 0.13, 0.035, Math.floor(r() * 1e6), 0.6), grey, xf(x - 0.09, 1.2, zc, Math.PI / 2, 0, side * 0.9));
    // strap hinges: long iron bars with a pin end
    for (const y of [0.55, 1.85]) {
      const zOuter = GARAGE.z + side * 1.18;
      addLimb(b, iron, V(x - 0.1, y, zOuter), V(x - 0.1, y, zc - side * 0.02), 0.028, 0.02, 6);
      const pin = new Mesh(new CylinderGeometry(0.03, 0.03, 0.12, 8), iron);
      pin.position.set(x - 0.1, y, zOuter);
      out.add(pin);
    }
  }
  // the hasp and a heavy padlock at the meeting edge
  addLimb(b, iron, V(x - 0.1, 1.15, GARAGE.z - 0.18), V(x - 0.1, 1.15, GARAGE.z + 0.18), 0.03, 0.03, 6);
  const lock = new Mesh(new BoxGeometry(0.06, 0.1, 0.075), iron);
  lock.position.set(x - 0.13, 1.03, GARAGE.z);
  lock.castShadow = true;
  out.add(lock);
  const shackle = new Mesh(new TorusGeometry(0.028, 0.008, 6, 12, Math.PI), iron);
  shackle.rotation.y = Math.PI / 2;
  shackle.position.set(x - 0.13, 1.08, GARAGE.z);
  out.add(shackle);
  // the sill: rotted ground boards, a leaning post
  w.add(board(5.2, 0.28, 0.08, 633, 2), grey, xf(x - 0.02, 0.14, GARAGE.z, Math.PI / 2));
  out.add(b.group(), w.group());
  // the gable end over the doors, and the roof: world.ts leaves its roof slabs tipped the wrong way for a
  // view from outside (a butterfly), so the yard shots hide those and use this one
  const gb = new Batch();
  for (let z = gz0 + 0.1; z < gz1 - 0.05; z += 0.19) {
    const hh = 0.55 + (GARAGE.d / 2 - Math.abs(z - GARAGE.z)) * 0.37 + r() * 0.04;
    gb.add(board(hh, 0.19, 0.03, Math.floor(r() * 1e6), 1.6), r() < 0.5 ? wood : grey, xf(x - 0.01, GARAGE.h - 0.05 + hh / 2, z, Math.PI / 2, 0, Math.PI / 2));
  }
  out.add(gb.group());
  const roofMat = mat(S.darkPlanks, { color: 0x555a5e, bump: 2, roughness: 1 });
  for (const side of [-1, 1]) {
    const slabRoof = new Mesh(new BoxGeometry(GARAGE.w + 0.9, 0.08, 3.5), roofMat);
    slabRoof.position.set(GARAGE.x - 0.1, GARAGE.h + 0.62, GARAGE.z + side * 1.62);
    slabRoof.rotation.x = side * 0.37;
    slabRoof.castShadow = true;
    slabRoof.receiveShadow = true;
    out.add(slabRoof);
  }
  // a few flat stones before the door, half sunk
  const stone = mat(S.brick, { color: 0x6a6c68, bump: 1.4, roughness: 1 });
  for (let i = 0; i < 4; i++) {
    const s = new Mesh(new CylinderGeometry(0.34 + r() * 0.2, 0.4 + r() * 0.2, 0.08, 9), stone);
    s.position.set(gx0 - 0.7 - i * 0.8, 0.0, GARAGE.z + (r() - 0.5) * 0.6);
    s.rotation.y = r() * 3;
    s.receiveShadow = true;
    out.add(s);
  }
  return out;
}

// ---------------------------------------------------------------------------------------- the cans

/** A tin can, open at the top, with a rolled rim, two ribs and (sometimes) the ghost of a label. */
function canGeometry(radius: number, height: number, seed: number) {
  const r = rng(seed);
  const pts: Vector2[] = [];
  const t = 0.003;
  pts.push(new Vector2(0, 0.002));
  pts.push(new Vector2(radius - 0.006, 0));
  pts.push(new Vector2(radius, 0.006));
  const ribs = [0.2, 0.78];
  for (let i = 0; i <= 30; i++) {
    const k = i / 30;
    const y = 0.006 + k * (height - 0.012);
    let rad = radius;
    for (const rb of ribs) rad -= 0.004 * Math.exp(-(((k - rb) / 0.035) ** 2));
    pts.push(new Vector2(rad, y));
  }
  pts.push(new Vector2(radius + 0.003, height - 0.004));
  pts.push(new Vector2(radius + 0.002, height + 0.002));
  pts.push(new Vector2(radius - t, height + 0.002));
  pts.push(new Vector2(radius - t - 0.002, height - 0.01));
  pts.push(new Vector2(radius - t - 0.002, height - 0.045 - r() * 0.03));
  pts.push(new Vector2(0, height - 0.06 - r() * 0.02));
  const g = new LatheGeometry(pts, 24);
  const p = g.getAttribute('position');
  for (let i = 0; i < p.count; i++) {
    const dent = fbm(p.getX(i) * 40 + seed, p.getY(i) * 40 + seed, 4, 2, seed);
    const f = 1 + (dent - 0.5) * 0.06;
    p.setX(i, p.getX(i) * f);
    p.setZ(i, p.getZ(i) * f);
  }
  g.computeVertexNormals();
  return g;
}

/** Five or six tin cans in a loose pile against a wall: three, then two, then a last on top. */
export function cans(at: Vector3, towardWall: number) {
  const S = surfaces();
  const out = new Group();
  const R = 0.04;
  const Hh = 0.105;
  const tin = new MeshStandardMaterial({ color: 0xa9b0b8, metalness: 0.8, roughness: 0.38, side: DoubleSide });
  const rusty = new MeshStandardMaterial({ color: 0x9a8a82, map: S.rust, bumpMap: S.rust, bumpScale: 1.2, metalness: 0.6, roughness: 0.5, side: DoubleSide });
  const label = new MeshStandardMaterial({ map: S.label, roughness: 1 });
  const place: [number, number, number, number, number][] = [
    // x, y, z, tilt about x, yaw
    [-0.1, 0, 0.02, 0, 0.3],
    [0.0, 0, -0.01, 0, 1.1],
    [0.1, 0, 0.03, 0, 2.2],
    [-0.05, Hh, 0.01, 0.02, 0.7],
    [0.06, Hh, 0.015, -0.03, 1.9],
    [0.01, Hh * 2, 0.012, 0.03, 0.4],
  ];
  place.forEach(([x, y, z, tilt, yaw], i) => {
    const can = new Group();
    const body = new Mesh(canGeometry(R, Hh, 700 + i), i % 3 === 1 ? rusty : tin);
    body.castShadow = true;
    body.receiveShadow = true;
    can.add(body);
    if (i % 2 === 0) {
      // a faded paper label, torn at one side
      const lab = new Mesh(new CylinderGeometry(R + 0.0012, R + 0.0012, Hh * 0.52, 20, 1, true, 0.4 * i, Math.PI * 1.6), label);
      lab.position.y = Hh * 0.5;
      can.add(lab);
    }
    can.position.set(x, y, z);
    can.rotation.set(tilt, yaw, 0);
    out.add(can);
  });
  // one more, knocked over and rolled away, and a bent lid
  const spare = new Group();
  const sb = new Mesh(canGeometry(R, Hh, 791), tin);
  sb.castShadow = true;
  sb.receiveShadow = true;
  spare.add(sb);
  spare.position.set(0.22, R, 0.17);
  spare.rotation.set(Math.PI / 2, 0, 0.8);
  out.add(spare);
  const lid = new Mesh(new CylinderGeometry(R - 0.004, R - 0.004, 0.002, 18), tin);
  lid.position.set(-0.19, 0.002, 0.15);
  lid.rotation.set(0.1, 0, 0.12);
  out.add(lid);
  out.position.copy(at);
  out.rotation.y = towardWall;
  return out;
}

