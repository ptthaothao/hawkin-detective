import { Application, Container, NoiseFilter, Sprite } from 'pixi.js';
import type { Beat, Ch11State } from '../machine';
import { H, W, type SceneNode } from './common';
import { UnderBedScene, WardrobeScene } from './hide';
import { CarriedScene, GarageScene } from './outside';
import { RoomScene } from './room';
import { lights } from './textures';

type SceneKey = 'room' | 'wardrobe' | 'bed' | 'black' | 'carried' | 'garage';

export function sceneFor(s: Ch11State): SceneKey {
  const b: Beat = s.beat;
  if (b === 'hide' || b === 'mmm' || b === 'found') return s.hideSpot === 'bed' ? 'bed' : 'wardrobe';
  if (b === 'faint') return 'black';
  if (b === 'carried') return 'carried';
  if (b === 'awake' || b === 'end') return 'garage';
  return 'room';
}

export interface StageInput {
  state: () => Ch11State;
  now: () => number;
  low: () => boolean;
  onFrame: (now: number) => void;
}

/**
 * The PixiJS (WebGL) stage for Chapter 1.1. Everything is drawn in a 1600×900 design space and
 * fitted to the window; the React layer on top handles text, buttons and hotspots.
 */
export class Stage {
  private app = new Application();
  private world = new Container();
  private scenes = new Map<SceneKey, SceneNode>();
  private current: SceneKey | null = null;
  private pointer = { x: W / 2, y: H / 2 };
  private grain = new NoiseFilter({ noise: 0.09 });
  private vignette = new Sprite(lights().vignette);
  private destroyed = false;
  private ready = false;

  async mount(el: HTMLElement, input: StageInput) {
    await this.app.init({
      resizeTo: el,
      background: 0x000000,
      antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
      preference: 'webgl',
    });
    if (this.destroyed) {
      this.app.destroy(true, { children: true });
      return;
    }
    this.ready = true;
    el.appendChild(this.app.canvas);
    this.vignette.anchor.set(0.5);
    this.vignette.position.set(W / 2, H / 2);
    this.vignette.width = W * 1.5;
    this.vignette.height = H * 1.6;
    this.app.stage.addChild(this.world);
    this.world.addChild(this.vignette);
    this.app.canvas.addEventListener('pointermove', this.onMove);
    window.addEventListener('pointermove', this.onMove);

    this.app.ticker.add(() => {
      const now = input.now();
      input.onFrame(now);
      const s = input.state();
      const key = sceneFor(s);
      this.show(key);
      this.fit();
      const node = this.current ? this.scenes.get(this.current) : undefined;
      const low = input.low();
      node?.update({ s, now, t: now - s.beatAt, px: this.pointer.x, py: this.pointer.y, low });
      this.grain.seed = Math.random();
      this.world.filters = low ? null : [this.grain];
    });
  }

  private make(key: SceneKey): SceneNode {
    switch (key) {
      case 'room':
        return new RoomScene();
      case 'wardrobe':
        return new WardrobeScene();
      case 'bed':
        return new UnderBedScene();
      case 'carried':
        return new CarriedScene();
      case 'garage':
        return new GarageScene();
      case 'black':
        return { root: new Container(), update: () => {} };
    }
  }

  private show(key: SceneKey) {
    if (key === this.current) return;
    if (this.current) this.scenes.get(this.current)!.root.visible = false;
    let node = this.scenes.get(key);
    if (!node) {
      node = this.make(key);
      this.scenes.set(key, node);
      this.world.addChildAt(node.root, 0);
    }
    node.root.visible = true;
    this.current = key;
  }

  /** Contain the design space in the window, centred. */
  private fit() {
    const { width, height } = this.app.screen;
    const k = Math.min(width / W, height / H);
    this.world.scale.set(k);
    this.world.position.set((width - W * k) / 2, (height - H * k) / 2);
  }

  private onMove = (e: PointerEvent) => {
    if (!this.ready) return;
    const r = this.app.canvas.getBoundingClientRect();
    const k = this.world.scale.x || 1;
    this.pointer.x = (e.clientX - r.left - this.world.x) / k;
    this.pointer.y = (e.clientY - r.top - this.world.y) / k;
  };

  destroy() {
    this.destroyed = true;
    window.removeEventListener('pointermove', this.onMove);
    if (this.ready) this.app.destroy(true, { children: true });
  }
}
