import { CapsuleGeometry, Group, Mesh, MeshStandardMaterial, SphereGeometry, type Object3D } from 'three';

/**
 * The thing, in 3D: about 2.3 m, hunched so it fits under a door. Long thin legs, a narrow bowed
 * body, arms that hang past its knees, a long skull carried lower than the shoulders.
 * Always seen dark: backlit by the moon or the candle, never lit full on.
 */
// a little wet sheen, so the candle draws a rim along it even when the body is pure shadow
const SKIN = new MeshStandardMaterial({ color: 0x0d0b0a, roughness: 0.32, metalness: 0.1 });

function limb(len: number, r: number, parent: Object3D, y = 0): Mesh {
  // a capsule hanging down from its joint
  const m = new Mesh(new CapsuleGeometry(r, len, 4, 10), SKIN);
  m.position.y = y - len / 2;
  m.castShadow = true;
  parent.add(m);
  return m;
}

function joint(parent: Object3D, x: number, y: number, z: number): Group {
  const g = new Group();
  g.position.set(x, y, z);
  parent.add(g);
  return g;
}

export class Creature3D extends Group {
  private hipL: Group;
  private hipR: Group;
  private kneeL: Group;
  private kneeR: Group;
  private shoulderL: Group;
  private shoulderR: Group;
  private elbowL: Group;
  private elbowR: Group;
  private spine: Group;
  private neck: Group;
  /** The right forearm's hand: it reaches when it finds him. */
  readonly reach: Group;

  constructor() {
    super();
    const pelvis = joint(this, 0, 1.05, 0);
    this.spine = joint(pelvis, 0, 0.05, 0);
    // torso: a long capsule bowed forward, with a hump of shoulder blades
    const torso = new Mesh(new CapsuleGeometry(0.13, 0.62, 4, 12), SKIN);
    torso.scale.set(1, 1, 0.75);
    torso.position.set(0, 0.38, 0);
    torso.castShadow = true;
    this.spine.add(torso);
    this.spine.rotation.x = 0.45;
    const hump = new Mesh(new SphereGeometry(0.16, 12, 10), SKIN);
    hump.scale.set(1.3, 0.8, 0.8);
    hump.position.set(0, 0.68, -0.06);
    this.spine.add(hump);
    // neck and head reaching forward and down
    this.neck = joint(this.spine, 0, 0.78, 0.04);
    this.neck.rotation.x = 0.9;
    limb(0.16, 0.04, this.neck, 0.2).position.y = 0.1;
    const skull = new Mesh(new SphereGeometry(0.11, 14, 12), SKIN);
    skull.scale.set(0.8, 1.35, 1);
    skull.position.set(0, 0.28, 0.02);
    skull.castShadow = true;
    this.neck.add(skull);
    // legs
    const leg = (x: number) => {
      const hip = joint(pelvis, x, 0, 0);
      limb(0.42, 0.045, hip);
      const knee = joint(hip, 0, -0.5, 0);
      const kneeCap = new Mesh(new SphereGeometry(0.06, 10, 8), SKIN);
      knee.add(kneeCap);
      limb(0.42, 0.042, knee);
      // a long narrow foot that walks on the balls, toes too long, curling into the floor
      const ankle = joint(knee, 0, -0.5, 0);
      ankle.rotation.x = 0.5;
      ankle.add(new Mesh(new SphereGeometry(0.045, 10, 8), SKIN));
      const foot = limb(0.14, 0.032, ankle);
      foot.castShadow = true;
      for (let i = 0; i < 4; i++) {
        const toe = joint(ankle, (i - 1.5) * 0.02, -0.17, 0.02);
        toe.rotation.set(-1.25 + Math.abs(i - 1.5) * 0.08, (i - 1.5) * 0.12, 0);
        limb(0.09 - Math.abs(i - 1.5) * 0.015, 0.01, toe);
      }
      return { hip, knee };
    };
    const l = leg(-0.1);
    const r = leg(0.1);
    this.hipL = l.hip;
    this.kneeL = l.knee;
    this.hipR = r.hip;
    this.kneeR = r.knee;
    // arms, too long
    const arm = (x: number) => {
      const shoulder = joint(this.spine, x, 0.7, 0.02);
      limb(0.42, 0.035, shoulder);
      const elbow = joint(shoulder, 0, -0.5, 0);
      limb(0.42, 0.028, elbow);
      const hand = joint(elbow, 0, -0.5, 0);
      for (let i = 0; i < 4; i++) {
        const f = joint(hand, (i - 1.5) * 0.018, 0, 0);
        f.rotation.x = 0.1 * i;
        limb(0.16, 0.008, f);
      }
      return { shoulder, elbow, hand };
    };
    const al = arm(-0.2);
    const ar = arm(0.2);
    this.shoulderL = al.shoulder;
    this.elbowL = al.elbow;
    this.shoulderR = ar.shoulder;
    this.elbowR = ar.elbow;
    this.reach = ar.hand;
    this.pose(0);
  }

  /**
   * `stride` 0..1 through a step; `look` turns the head (-1..1); `lean` bends it down toward
   * a hiding place (0..1); `crouch` folds it down to look under a bed (0..1).
   */
  pose(stride: number, look = 0, lean = 0, crouch = 0) {
    const s = Math.sin(stride * Math.PI * 2);
    this.hipL.rotation.x = s * 0.35 - crouch * 1.2;
    this.hipR.rotation.x = -s * 0.35 - crouch * 1.2;
    this.kneeL.rotation.x = Math.max(0, -s) * 0.5 + crouch * 2.2;
    this.kneeR.rotation.x = Math.max(0, s) * 0.5 + crouch * 2.2;
    this.spine.rotation.x = 0.45 + lean * 0.5 + crouch * 0.6;
    this.neck.rotation.x = 0.9 - lean * 0.3;
    this.neck.rotation.y = look * 0.7;
    this.shoulderL.rotation.x = -s * 0.25 - lean * 0.3;
    this.shoulderR.rotation.x = s * 0.25 - lean * 0.3;
    this.elbowL.rotation.x = -0.2;
    this.elbowR.rotation.x = -0.2;
    // folding at the knees lowers the body
    this.position.y = -crouch * 0.55;
  }
}

/** Its hand coming at the camera: jointed fingers, much too long. Lives in camera space. */
export class Hand3D extends Group {
  constructor() {
    super();
    const forearm = new Mesh(new CapsuleGeometry(0.045, 0.7, 4, 10), SKIN);
    forearm.rotation.z = Math.PI / 2;
    forearm.position.set(0.45, 0, 0);
    this.add(forearm);
    const palm = new Mesh(new SphereGeometry(0.07, 12, 10), SKIN);
    palm.scale.set(1.2, 0.5, 1);
    this.add(palm);
    for (let i = 0; i < 4; i++) {
      let parent: Object3D = joint(this, -0.04, 0, (i - 1.5) * 0.035);
      parent.rotation.z = Math.PI / 2 + 0.15;
      parent.rotation.x = (i - 1.5) * 0.12;
      for (let seg = 0; seg < 3; seg++) {
        limb(0.07 - seg * 0.01, 0.012 - seg * 0.002, parent);
        const next = joint(parent, 0, -0.085 + seg * 0.01, 0);
        next.rotation.z = 0.25;
        parent = next;
      }
    }
    const thumb = joint(this, 0, 0, 0.07);
    thumb.rotation.set(-0.8, 0, Math.PI / 2);
    limb(0.08, 0.014, thumb);
  }
}
