import {
  BufferGeometry,
  BoxGeometry,
  CylinderGeometry,
  Group,
  Euler,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Quaternion,
  Vector3,
  type Material,
  type Texture,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { rng } from './surfaces';

/** Small building tools for the Chapter 1.2 exterior set: tapered limbs, warped boards, batches. */

export const V = (x: number, y: number, z: number) => new Vector3(x, y, z);

export function mat(map: Texture | null, o: { color?: number; roughness?: number; metalness?: number; bump?: number; repeat?: [number, number] } = {}) {
  const m = new MeshStandardMaterial({
    map: map ?? undefined,
    color: o.color ?? 0xffffff,
    roughness: o.roughness ?? 0.9,
    metalness: o.metalness ?? 0,
    bumpMap: o.bump && map ? map : undefined,
    bumpScale: o.bump ?? 0,
  });
  return m;
}

/** Collects geometry by material, then merges each pile into one mesh: hundreds of boards, one draw call. */
export class Batch {
  private parts = new Map<Material, BufferGeometry[]>();

  add(geo: BufferGeometry, material: Material, at?: Matrix4) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    if (at) g.applyMatrix4(at);
    for (const name of Object.keys(g.attributes)) if (name !== 'position' && name !== 'normal' && name !== 'uv') g.deleteAttribute(name);
    const list = this.parts.get(material) ?? [];
    list.push(g);
    this.parts.set(material, list);
  }

  group(shadow = true): Group {
    const out = new Group();
    for (const [material, list] of this.parts) {
      const merged = mergeGeometries(list, false);
      if (!merged) continue;
      const m = new Mesh(merged, material);
      m.castShadow = shadow;
      m.receiveShadow = true;
      out.add(m);
    }
    return out;
  }
}

const UP = new Vector3(0, 1, 0);

/** A tapered limb from a to b, in world coordinates. */
export function limb(a: Vector3, b: Vector3, r0: number, r1: number, seg = 7): { geo: BufferGeometry; at: Matrix4 } {
  const dir = b.clone().sub(a);
  const len = dir.length();
  const geo = new CylinderGeometry(r1, r0, len, seg, 1);
  const q = new Quaternion().setFromUnitVectors(UP, dir.normalize());
  const at = new Matrix4().compose(a.clone().add(b).multiplyScalar(0.5), q, V(1, 1, 1));
  return { geo, at };
}

export function addLimb(batch: Batch, material: Material, a: Vector3, b: Vector3, r0: number, r1: number, seg = 7) {
  const { geo, at } = limb(a, b, r0, r1, seg);
  batch.add(geo, material, at);
}

/** An old board: bowed along its length, uneven in thickness, one end split off at an angle. */
export function board(len: number, h: number, t: number, seed: number, wear = 1): BufferGeometry {
  const r = rng(seed);
  const g = new BoxGeometry(len, h, t, Math.max(4, Math.round(len * 5)), 1, 1);
  const p = g.getAttribute('position');
  const bow = (r() - 0.5) * 0.6 * wear;
  const twist = (r() - 0.5) * 0.5 * wear;
  const brokenL = r() < 0.3 * wear ? r() * 0.4 * h : 0;
  const brokenR = r() < 0.3 * wear ? r() * 0.4 * h : 0;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    const k = x / len;
    p.setZ(i, z + bow * t * (1 - 4 * k * k) + twist * t * k * Math.sign(y) * 2);
    if (k > 0.499 && y > 0) p.setY(i, y - brokenR);
    if (k < -0.499 && y > 0) p.setY(i, y - brokenL);
    if (k > 0.499) p.setX(i, x + (r() - 0.5) * 0.02);
  }
  const uv = g.getAttribute('uv');
  const du = r();
  for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * 0.9 + du);
  g.computeVertexNormals();
  return g;
}

/** A placement matrix: position, then yaw / pitch / roll (YXZ), then uniform scale. */
export function xf(x: number, y: number, z: number, ry = 0, rx = 0, rz = 0, s = 1) {
  return new Matrix4().compose(V(x, y, z), new Quaternion().setFromEuler(new Euler(rx, ry, rz, 'YXZ')), V(s, s, s));
}

export function place<T extends Group | Mesh>(o: T, x: number, y: number, z: number, ry = 0): T {
  o.position.set(x, y, z);
  o.rotation.y = ry;
  return o;
}

/** Branching dead tree into a batch: a leaning trunk, forked limbs, a few snapped stubs. No leaves. */
export function deadTree(batch: Batch, bark: Material, x: number, z: number, height: number, seed: number, y0 = 0) {
  const r = rng(seed);
  const base = V(x, y0, z);
  const lean = V((r() - 0.5) * 0.18, 1, (r() - 0.5) * 0.18).normalize();
  const trunkR = height * (0.028 + r() * 0.012);
  // root flare
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + r();
    addLimb(batch, bark, base.clone().add(V(Math.cos(a) * trunkR * 2.4, 0.02, Math.sin(a) * trunkR * 2.4)), base.clone().add(V(0, trunkR * 3, 0)), trunkR * 0.45, trunkR * 0.9, 5);
  }
  const grow = (from: Vector3, dir: Vector3, len: number, rad: number, depth: number) => {
    const bend = V(r() - 0.5, (r() - 0.5) * 0.3, r() - 0.5).multiplyScalar(0.55);
    const d = dir.clone().add(bend).normalize();
    const to = from.clone().add(d.clone().multiplyScalar(len));
    const rEnd = rad * (0.62 + r() * 0.12);
    addLimb(batch, bark, from, to, rad, rEnd, depth > 3 ? 9 : 6);
    if (depth <= 0 || len < 0.25) return;
    const count = depth > 3 ? 3 + Math.floor(r() * 2) : 2 + Math.floor(r() * 2);
    for (let i = 0; i < count; i++) {
      const spin = r() * Math.PI * 2;
      const out = V(Math.cos(spin), 0.35 + r() * 0.9, Math.sin(spin)).normalize();
      const nd = d.clone().multiplyScalar(0.45).add(out.multiplyScalar(0.8)).normalize();
      // some limbs snap off short
      const l = len * (0.55 + r() * 0.25) * (r() < 0.15 ? 0.3 : 1);
      grow(i === 0 ? to : from.clone().lerp(to, 0.45 + r() * 0.5), nd, l, rEnd * 0.85, depth - 1);
    }
  };
  const trunkLen = height * 0.5;
  const mid = base.clone().add(lean.clone().multiplyScalar(trunkLen));
  addLimb(batch, bark, base, mid, trunkR, trunkR * 0.82, 10);
  grow(mid, lean, height * 0.32, trunkR * 0.8, 5);
  grow(mid.clone().lerp(base, 0.2), V(lean.x + 0.9, 0.9, lean.z - 0.3).normalize(), height * 0.26, trunkR * 0.5, 3);
  grow(mid.clone().lerp(base, 0.1), V(lean.x - 0.9, 0.8, lean.z + 0.4).normalize(), height * 0.24, trunkR * 0.48, 3);
}
