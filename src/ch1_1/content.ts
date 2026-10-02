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
  torch: 'Mò đèn pin trên giường',
  look: 'Soi đèn ra cửa',
  slam: 'Đóng sập cửa',
  radio: 'Tắt radio',
  hold: 'Giữ để nín thở',
  holdKey: 'giữ phím Space hoặc giữ nút',
  finish: 'Hết chương 1.1',
} as const;

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
