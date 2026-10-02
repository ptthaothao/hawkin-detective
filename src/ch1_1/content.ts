import type { Beat, HideSpot, Outcome } from './machine';

/**
 * Narration, kept to the minimum: the room, the sounds and the player's own actions tell the rest.
 * A line is here only when nothing on screen or in the sound can say it.
 */
export const NARRATION: Partial<Record<Beat, string[]>> = {
  back: ['3:16. Mẹ đi ca đêm, chị đi dã ngoại. Nhà chỉ còn mình Theo.'],
  answer: ['3:17.'],
  shut: ['Nó đang nhìn em.'],
  awake: ['Không phải phòng em.', 'Bên ngoài, bước chân đi ngang qua. Theo một nhịp.'],
};

export const PROMPT = {
  call: '“Mom?”',
  torch: 'Lấy đèn pin',
  look: 'Soi đèn ra cửa',
  slam: 'Đóng sập cửa',
  radio: 'Tắt radio',
  hold: 'Giữ để nín thở',
  holdKey: 'giữ phím Space hoặc giữ nút',
  finish: 'Hết chương 1.1',
} as const;

/**
 * The note in the corner, as in Chapter 0: where Theo is, what he is wondering, and what to do.
 */
export type Objective = { where: string; goal: string; action?: string };
const ROOM = 'Phòng Theo';
export const OBJECTIVE: Partial<Record<Beat, Objective>> = {
  back: { where: `${ROOM} · 3:16`, goal: 'Có tiếng gì ngoài kia?', action: 'Đưa chuột ra mép màn hình (hoặc phím ← →) để nhìn quanh' },
  bark: { where: `${ROOM} · 3:16`, goal: 'Chó nhà bên sủa. Mẹ về rồi à?', action: 'Gọi mẹ' },
  answer: { where: `${ROOM} · 3:17`, goal: 'Không ai trả lời.' },
  torch: { where: `${ROOM} · 3:17`, goal: 'Có ai đó ngoài hành lang. Tối quá.', action: 'Tìm đèn pin trên giường' },
  look: { where: `${ROOM} · 3:17`, goal: 'Ai đứng ngoài đó vậy?', action: 'Soi đèn ra cửa' },
  shut: { where: `${ROOM} · 3:17`, goal: 'Không phải mẹ. Không được để nó vào!', action: 'Đóng cửa và tắt radio' },
  choose: { where: `${ROOM} · 3:17`, goal: 'Nó sắp vào rồi. Phải trốn đi!', action: 'Chọn chỗ trốn' },
  hide: { where: '???', goal: 'Đừng để nó nghe thấy em thở.', action: 'Khi nó tới gần, giữ Space để nín thở' },
  awake: { where: 'Gara cũ', goal: 'Đây là đâu?' },
};

export const AFTER = {
  slam: 'Cửa đóng sập.',
  radio: 'Theo tắt radio. Quyển vở vẽ với cái micro văng xuống sàn.',
  pocket: 'Theo nhét đèn pin vào túi quần.',
} as const;

export const HIDE_LABEL: Record<HideSpot, string> = {
  wardrobe: 'Chui vào tủ quần áo',
  bed: 'Trốn dưới gầm giường',
};

export const HIDE_LINES: Record<HideSpot, string[]> = {
  wardrobe: [],
  bed: [],
};

export const MMM = 'Mmmm…';

/** How it found him is told by the sound (a held breath let go, a gasp); no words needed. */
export const FOUND: Record<Outcome, string | null> = {
  held: null,
  heard: null,
  gasped: null,
};

export const FOUND_AFTER: Record<HideSpot, string[]> = {
  wardrobe: ['Chiếc đồng hồ tuột khỏi tay em khi nó lôi em qua giường.'],
  bed: [],
};

export const FAINT = 'Theo hét lên. Nhưng không có tiếng nào thoát ra.';

export const END = {
  title: 'HẾT CHƯƠNG 1.1',
  teaser: 'Theo phải về được phòng mình.',
  replay: 'Chơi lại',
} as const;
