import mother from '../assets/portraits/mother.jpg';
import sheriff from '../assets/portraits/sheriff.jpg';
import theo from '../assets/portraits/theo.jpg';
import you from '../assets/portraits/you.jpg';

/**
 * Who a line belongs to, as the UI shows it. A portrait identifies the speaker; it never means
 * they are in the room (Theo is only ever a voice on the radio).
 */
export interface Speaker {
  name: string;
  portrait: string;
  /** Where the face sits in the portrait, in % — the circle crops around it. */
  face: [x: number, y: number];
}

export const SPEAKERS: Record<string, Speaker> = {
  theo: { name: 'Theo', portrait: theo, face: [55, 33] },
  you: { name: 'Bạn', portrait: you, face: [58, 34] },
  mother: { name: 'Mẹ', portrait: mother, face: [58, 39] },
  sheriff: { name: 'Cảnh sát trưởng', portrait: sheriff, face: [47, 38] },
};

/** Unknown ids (radio static, stage directions) have no speaker: they read as narration. */
export const speakerOf = (who: string | undefined): (Speaker & { id: string }) | null =>
  who && who in SPEAKERS ? { id: who, ...SPEAKERS[who] } : null;
