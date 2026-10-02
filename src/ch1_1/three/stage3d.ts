import {
  ACESFilmicToneMapping,
  FogExp2,
  HemisphereLight,
  Object3D,
  PCFSoftShadowMap,
  PerspectiveCamera,
  Scene,
  SpotLight,
  Vector2,
  Vector3,
  WebGLRenderer,
  type Mesh,
} from 'three';
import { DOOR_OPENS_MS, NEAR_AT_MS, PASS_AT_MS, PASS_STEPS, STEP_MS, AUTO_MS, type Beat, type Ch11State, type HideSpot } from '../machine';
import { Creature3D, Hand3D } from './creature3d';
import { BG, DOOR, GARAGE, HALL, buildWorld, type World } from './world';

export interface Stage3DInput {
  state: () => Ch11State;
  now: () => number;
  low: () => boolean;
  onFrame: () => void;
}

interface Pose {
  pos: Vector3;
  yaw: number;
  pitch: number;
  /** How far the pointer can turn the head. */
  range: [number, number];
}

const v = (x: number, y: number, z: number) => new Vector3(x, y, z);
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const ease = (x: number) => {
  const k = clamp01(x);
  return k * k * (3 - 2 * k);
};
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

const ROOM_POSE: Pose = { pos: v(0.3, 1.1, -0.3), yaw: 0.1, pitch: -0.08, range: [1.35, 0.55] };
/** Once the torch is on he edges toward the door, so the hallway lines up with his eye. */
const DOOR_POS = v(0.75, 1.12, -1.25);
const HIDE_POSE: Record<HideSpot, Pose> = {
  wardrobe: { pos: v(-1.58, 1.12, -0.9), yaw: -Math.PI / 2, pitch: -0.05, range: [0.35, 0.22] },
  bed: { pos: v(-1.6, 0.14, -2.45), yaw: -Math.PI / 2 - 0.3, pitch: 0.06, range: [0.45, 0.12] },
};
/** On the floor in the back corner, facing the closed doors and the crack of moonlight between them. */
const AWAKE_POSE: Pose = { pos: v(GARAGE.x + 1.5, 0.32, GARAGE.z - 2.1), yaw: 2.06, pitch: 0.1, range: [1.2, 0.4] };
/** Its route outside the garage doors: cemetery to garage, passing the crack. */
const PASS_X = GARAGE.x - GARAGE.w / 2 - 0.9;
const PASS_FROM = GARAGE.z + 4;
const PASS_TO = GARAGE.z - 4;

/** Where it stands while it looks for him, facing the hiding place. */
const STAND: Record<HideSpot, Vector3> = { wardrobe: v(-0.72, 0, -0.8), bed: v(-0.45, 0, -1.9) };
const ENTER = v(2.4, 0, -1.3);
const HALL_END = v(HALL.x1 - 0.8, 0, -1.3);

/** The carried glimpses: [time 0..1, camera position, look-at point, roll]. Over its shoulder, facing back. */
const CARRY: [number, Vector3, Vector3, number][] = [
  [0, v(0.6, 1.6, -1.2), v(-1.4, 0.4, -2.2), 0.5],
  [0.28, v(4.0, 1.7, -1.3), v(1.5, 0.6, -1.2), 0.35],
  [0.5, v(7.6, 1.7, -1.3), v(5.0, 0.3, -1.3), 0.45],
  [0.75, v(12.0, 1.7, -1.0), v(8.5, 0.8, -1.3), 0.3],
  [1, v(15.4, 1.7, -1.2), v(12, 0.4, -1.0), 0.4],
];

function sceneKey(s: Ch11State) {
  const b: Beat = s.beat;
  if (b === 'hide' || b === 'mmm' || b === 'found') return s.hideSpot === 'bed' ? 'bed' : 'wardrobe';
  if (b === 'faint') return 'black';
  if (b === 'carried') return 'carried';
  if (b === 'awake' || b === 'end') return 'garage';
  return 'room';
}

/** Where it is during the visit: walks in from the door in steps, stops at the hiding place. */
function walk(t: number, to: Vector3) {
  const since = t - DOOR_OPENS_MS;
  const walkMs = NEAR_AT_MS - DOOR_OPENS_MS;
  const k = clamp01(since / walkMs);
  const steps = walkMs / STEP_MS;
  const stepK = (Math.floor(k * steps) + ease((k * steps) % 1)) / steps;
  return {
    visible: since >= 0,
    pos: ENTER.clone().lerp(to, Math.min(1, stepK)),
    stride: (((since / STEP_MS) % 1) + 1) % 1,
    arrived: k >= 1,
  };
}

export class Stage3D {
  private renderer: WebGLRenderer | null = null;
  private scene = new Scene();
  private camera = new PerspectiveCamera(62, 16 / 9, 0.03, 120);
  private world!: World;
  private it = new Creature3D();
  private hand = new Hand3D();
  private torch = new SpotLight(0xffe2b0, 0, 14, 0.42, 0.55, 1.6);
  private hemi = new HemisphereLight(0x22304a, 0x0c0a08, 0.55);
  private pointer = new Vector2(0, 0);
  private look = { yaw: 0, pitch: 0 };
  private camPos = new Vector3();
  private lastKey = '';
  private lastFrame = 0;
  private cutAt = -1e9;
  private lids: HTMLDivElement[] = [];
  private overlay!: HTMLDivElement;
  private raf = 0;
  private input!: Stage3DInput;
  private el!: HTMLElement;
  private slid: boolean | null = null;
  private shadows: boolean | null = null;

  mount(el: HTMLElement, input: Stage3DInput) {
    this.el = el;
    this.input = input;
    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    } catch {
      el.textContent = 'Trình duyệt này không chạy được WebGL.';
      return;
    }
    this.renderer = renderer;
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.shadowMap.type = PCFSoftShadowMap;
    renderer.setClearColor(BG);
    el.appendChild(renderer.domElement);

    this.world = buildWorld();
    this.scene.add(this.world.root, this.hemi, this.it, this.camera);
    this.scene.fog = new FogExp2(0x0b0f16, 0.055);
    this.camera.rotation.order = 'YXZ';
    // the flashlight in Theo's hand: a little below and right of the eyes, pointing where he looks
    this.torch.position.set(0.12, -0.12, 0);
    this.torch.target.position.set(0.02, -0.05, -1);
    this.torch.castShadow = true;
    this.torch.shadow.mapSize.set(1024, 1024);
    this.torch.shadow.bias = -0.0008;
    this.torch.shadow.camera.near = 0.1;
    this.camera.add(this.torch, this.torch.target);
    this.hand.visible = false;
    this.camera.add(this.hand);
    this.it.visible = false;
    this.it.traverse((o) => (o.castShadow = true));

    this.overlay = document.createElement('div');
    this.overlay.className = 'ch11-3d-overlay';
    for (let i = 0; i < 2; i++) {
      const lid = document.createElement('div');
      lid.className = `ch11-lid ${i ? 'bottom' : 'top'}`;
      this.overlay.appendChild(lid);
      this.lids.push(lid);
    }
    el.appendChild(this.overlay);

    // looking around follows the pointer anywhere on the page, buttons included
    window.addEventListener('pointermove', this.onMove);
    window.addEventListener('resize', this.resize);
    this.resize();
    const loop = () => {
      this.frame();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  private resize = () => {
    if (!this.renderer) return;
    const w = this.el.clientWidth || window.innerWidth;
    const h = this.el.clientHeight || window.innerHeight;
    this.renderer.setPixelRatio(this.input.low() ? 0.5 : Math.min(window.devicePixelRatio || 1, 1.25));
    this.renderer.setSize(w, h, false);
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.camera.aspect = w / h;
    // keep the horizontal view about the same on tall screens
    this.camera.fov = w / h < 1.3 ? 75 : 62;
    this.camera.updateProjectionMatrix();
  };

  private onMove = (e: PointerEvent) => {
    const r = this.el.getBoundingClientRect();
    this.pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
  };

  private setLids(open: number) {
    const gap = clamp01(open) * 50;
    this.lids[0].style.height = `${50 - gap + 0.5}%`;
    this.lids[1].style.height = `${50 - gap + 0.5}%`;
  }

  private frame() {
    const renderer = this.renderer;
    if (!renderer) return;
    this.input.onFrame();
    const s = this.input.state();
    const now = this.input.now();
    const t = now - s.beatAt;
    const low = this.input.low();
    const w = this.world;
    const dt = Math.min(0.1, Math.max(0, (now - (this.lastFrame || now)) / 1000));
    this.lastFrame = now;

    if (this.shadows !== !low) {
      this.shadows = !low;
      renderer.shadowMap.enabled = !low;
      this.resize();
    }

    const key = sceneKey(s);
    if (key !== this.lastKey) {
      this.lastKey = key;
      this.cutAt = now;
    }

    // ---- the room ----
    const roomBeat = key === 'room';
    w.clockHands.minute.rotation.z = -((roomBeat && (s.beat === 'back' || s.beat === 'bark') ? 16 : 17) / 60) * Math.PI * 2;
    w.clockHands.hour.rotation.z = -((3 + 17 / 60) / 12) * Math.PI * 2;
    const surge = s.beat === 'answer' ? Math.max(0, 1 - t / 2600) : 0;
    w.radio.setOn(!s.radioOff, surge);
    w.micOnDesk.visible = !s.radioOff;
    w.micOnFloor.visible = s.radioOff;
    w.torch.visible = ['back', 'bark', 'answer', 'torch'].includes(s.beat);

    // the bedroom door: ajar, slammed, then opened slowly by it
    let doorA = s.doorShut ? 0 : 1.0;
    if (key === 'wardrobe' || key === 'bed') {
      doorA = s.beat === 'hide' ? 1.5 * ease((t - DOOR_OPENS_MS + 1200) / 1700) : 1.5;
    }
    w.doorPivot.rotation.y = lerp(w.doorPivot.rotation.y, -doorA, 1 - Math.exp(-dt * (s.doorShut && s.beat === 'shut' ? 18 : 5)));

    // 1920 slides in while he hides: the candle where the switch was, the old wallpaper
    const slid = key === 'wardrobe' || key === 'bed';
    if (slid !== this.slid) {
      this.slid = slid;
      w.wallMat.map = slid ? w.paper1920 : w.paper1986;
      w.wallMat.needsUpdate = true;
    }
    const flick = 0.85 + 0.1 * Math.sin(now / 83) + 0.06 * Math.sin(now / 37);
    w.candle.light.intensity = slid ? 9 * flick : 0;
    w.candle.flame.visible = slid;
    w.moon.intensity = slid ? 1.1 : 2.4;

    // the wardrobe doors burst open when it finds him there
    const burst = key === 'wardrobe' && s.beat === 'found' ? ease(t / 300) : 0;
    w.wardrobeDoors[0].rotation.y = burst * 1.7;
    w.wardrobeDoors[1].rotation.y = -burst * 1.7;
    w.watch.visible = key === 'bed' && s.beat === 'found' && t > 2400;

    // ---- it ----
    this.it.visible = false;
    if ((s.beat === 'look' || s.beat === 'shut') && !s.doorShut) {
      this.it.visible = true;
      this.it.position.copy(HALL_END);
      this.it.rotation.y = -Math.PI / 2;
      this.it.pose(0, Math.sin(now / 1400) * 0.3);
    } else if ((key === 'wardrobe' || key === 'bed') && s.hideSpot) {
      const to = STAND[s.hideSpot];
      const wk = s.beat === 'hide' ? walk(t, to) : { visible: true, pos: to, stride: 0, arrived: true };
      this.it.visible = wk.visible;
      this.it.position.copy(wk.pos);
      const dir = wk.arrived ? -Math.PI / 2 : Math.atan2(to.x - ENTER.x, to.z - ENTER.z);
      this.it.rotation.y = lerp(this.it.rotation.y, dir, 0.08);
      const lean = s.beat === 'mmm' ? ease(t / 1500) * 0.6 : s.beat === 'found' && key === 'wardrobe' ? 1 : 0;
      const crouch = key === 'bed' && (s.beat === 'mmm' || s.beat === 'found') ? (s.beat === 'found' ? 1 : ease((t - 1800) / 1600) * 0.6) : 0;
      this.it.pose(wk.arrived ? 0 : wk.stride, wk.arrived ? Math.sin(now / 1600) * 0.5 : 0, lean, crouch);
    }
    w.doorMist.visible = key === 'garage';
    // in the garage: it walks past outside, seen only through the crack between the doors
    if (key === 'garage') {
      const k = (t - PASS_AT_MS) / (PASS_STEPS * STEP_MS);
      if (k > 0 && k < 1) {
        this.it.visible = true;
        this.it.position.set(PASS_X, 0, lerp(PASS_FROM, PASS_TO, k));
        this.it.rotation.y = Math.PI;
        this.it.pose((((t - PASS_AT_MS) / STEP_MS) % 1 + 1) % 1, 0.3);
      }
    }
    // its hand, coming for the camera
    this.hand.visible = s.beat === 'found';
    if (this.hand.visible) {
      const k = ease((t - (key === 'bed' ? 500 : 250)) / 900);
      this.hand.position.set(lerp(0.9, 0.12, k), lerp(0.35, -0.02, k), lerp(-0.9, -0.38, k));
      this.hand.rotation.set(0.2, key === 'bed' ? 0.4 : -0.3, lerp(0.6, 0.15, k));
    }

    // ---- camera ----
    const nx = this.pointer.x / 2;
    const ny = this.pointer.y / 2;
    const cutK = clamp01((now - this.cutAt) / 350);
    let lidOpen = 1;
    let roll = 0;
    if (key === 'carried') {
      const k = clamp01(t / AUTO_MS.carried!);
      let i = 0;
      while (i < CARRY.length - 2 && k > CARRY[i + 1][0]) i++;
      const [k0, p0, l0, r0] = CARRY[i];
      const [k1, p1, l1, r1] = CARRY[i + 1];
      const u = ease((k - k0) / (k1 - k0));
      const bob = Math.sin(now / 260) * 0.05;
      this.camera.position.copy(p0).lerp(p1, u);
      this.camera.position.y += bob;
      const target = l0.clone().lerp(l1, u);
      this.camera.lookAt(target);
      roll = lerp(r0, r1, u) + Math.sin(now / 520) * 0.08;
      this.camera.rotateZ(roll);
      // half-open eyes, closing between glimpses
      lidOpen = Math.sin(((k * (CARRY.length - 1)) % 1) * Math.PI) * 0.55;
    } else {
      const pose = key === 'garage' ? AWAKE_POSE : key === 'wardrobe' || key === 'bed' ? HIDE_POSE[s.hideSpot ?? 'wardrobe'] : ROOM_POSE;
      let baseYaw = pose.yaw;
      let basePitch = pose.pitch;
      let free = 1;
      // when he sees it: the head snaps to the hallway, then he can look away again
      if (s.beat === 'shut') {
        const pull = ease(t / 500) * (1 - ease((t - 1500) / 800));
        baseYaw = lerp(baseYaw, -1.42, pull);
        basePitch = lerp(basePitch, 0.02, pull);
        free = 1 - pull;
      }
      const holding = s.holdingSince !== null;
      const tyaw = baseYaw - nx * 2 * pose.range[0] * free;
      const tpitch = basePitch + ny * 2 * pose.range[1] * free;
      // frame-rate independent smoothing: slow, heavy head movement; slower still while holding his breath
      const follow = key !== this.lastKeyPose ? 1 : 1 - Math.exp(-dt * (holding ? 1.5 : 4));
      this.lastKeyPose = key;
      this.look.yaw = lerp(this.look.yaw, tyaw, follow);
      this.look.pitch = lerp(this.look.pitch, tpitch, follow);
      this.camPos.copy(pose.pos);
      const towardDoor = key === 'room' && ['look', 'shut', 'choose'].includes(s.beat) ? 1 : 0;
      this.doorK = lerp(this.doorK, towardDoor, 1 - Math.exp(-dt * 1.2));
      if (key === 'room') this.camPos.lerp(DOOR_POS, ease(this.doorK));
      // peeking: the eye moves a little, so the louvres slide across the view
      if (key === 'wardrobe') this.camPos.add(v(0, ny * 0.05, -nx * 0.08));
      const breathe = holding ? 0 : Math.sin(now / (s.beat === 'hide' || s.beat === 'shut' ? 420 : 900)) * (key === 'bed' ? 0.004 : 0.012);
      this.camera.position.set(this.camPos.x, this.camPos.y + breathe, this.camPos.z);
      const shake = surge * 0.02 + (s.beat === 'shut' && s.doorShut ? Math.max(0, 1 - t / 400) * 0.01 : 0) + (s.beat === 'found' ? Math.max(0, 1 - t / 900) * 0.02 : 0);
      this.camera.rotation.set(
        this.look.pitch + (Math.random() - 0.5) * shake,
        this.look.yaw + (Math.random() - 0.5) * shake,
        (Math.random() - 0.5) * shake,
      );
      if (key === 'garage') lidOpen = ease(t / 2600) - (t > 2600 && t < 2800 ? 0.4 : 0);
    }
    if (key === 'black') lidOpen = 0;
    if (s.beat === 'found' && t > AUTO_MS.found! - 700) lidOpen = Math.min(lidOpen, 1 - ease((t - AUTO_MS.found! + 700) / 700));
    // a cut between views is a blink
    if (key !== 'carried' && key !== 'garage' && key !== 'black') lidOpen = Math.min(lidOpen, cutK);
    this.setLids(lidOpen);

    // ---- the flashlight ----
    const torchOn = ['look', 'shut', 'choose'].includes(s.beat) || (key === 'garage' && t > 4200);
    const battery = 0.92 + 0.08 * Math.sin(now / 47) * Math.sin(now / 311);
    this.torch.intensity = torchOn ? 9 * battery : 0;
    this.torch.castShadow = !low;

    renderer.render(this.scene, this.camera);
  }

  private lastKeyPose = '';
  private doorK = 0;

  destroy() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.resize);
    window.removeEventListener('pointermove', this.onMove);
    this.renderer?.dispose();
    this.renderer?.domElement.remove();
    this.overlay?.remove();
    this.scene.traverse((o: Object3D) => {
      const m = o as Mesh;
      m.geometry?.dispose?.();
    });
  }
}

export { DOOR };
