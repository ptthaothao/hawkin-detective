import type { GameState, HotspotId } from '../game/types';

/** Rect in % of the 16:9 scene. */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface HotspotDef {
  id: HotspotId | 'switch';
  rect: Rect;
  visible?: (s: GameState) => boolean;
}

export const SWITCH_RECT: Rect = { x: 84, y: 34, w: 3, h: 7 };

export const NORMAL_HOTSPOTS: HotspotDef[] = [
  { id: 'switch', rect: SWITCH_RECT },
  { id: 'wall-clock', rect: { x: 12, y: 8, w: 9, h: 16 } },
  { id: 'poster', rect: { x: 8, y: 30, w: 16, h: 24 } },
  { id: 'rug', rect: { x: 36, y: 74, w: 24, h: 16 } },
  { id: 'radio', rect: { x: 62, y: 42, w: 12, h: 11 } },
  { id: 'flyer', rect: { x: 55.5, y: 49, w: 6, h: 4 } },
  { id: 'watch', rect: { x: 75.5, y: 50, w: 4, h: 3 } },
  { id: 'mic', rect: { x: 57, y: 38, w: 3.5, h: 10 } },
  { id: 'desk-edge', rect: { x: 55, y: 53.5, w: 8, h: 3 }, visible: (s) => s.contactMade },
  { id: 'door-normal', rect: { x: 89, y: 18, w: 9, h: 62 }, visible: (s) => s.hushed },
];

export const OTHER_HOTSPOTS: HotspotDef[] = [
  { id: 'switch', rect: SWITCH_RECT },
  { id: 'os-clock', rect: { x: 12, y: 8, w: 9, h: 16 } },
  { id: 'os-wall', rect: { x: 4, y: 28, w: 24, h: 30 } },
  { id: 'os-floor', rect: { x: 36, y: 74, w: 24, h: 16 } },
  { id: 'os-desk', rect: { x: 54, y: 34, w: 30, h: 22 } },
  { id: 'os-door', rect: { x: 89, y: 18, w: 9, h: 62 } },
];
