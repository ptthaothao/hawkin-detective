import type { Beat, HideSpot, Outcome } from './machine';

/** Narration shown at the start of each beat, one line after another. */
export const NARRATION: Partial<Record<Beat, string[]>> = {
  back: [
    'Đêm 4. 3 giờ 16 phút.',
    'Theo đi vệ sinh về, mắt nhắm mắt mở.',
    'Mẹ đi làm ca đêm. Chị đi dã ngoại với lớp. Cả nhà chỉ còn mình em.',
  ],
  bark: ['Ngoài sân, con chó nhà bên sủa ầm lên.', 'Mẹ về rồi hả?'],
  answer: ['3 giờ 17.', 'Radio của bố rè lên một tiếng thật to.'],
  torch: ['Tối om. Đèn pin để đâu rồi…'],
  look: ['Có tiếng gì ở ngoài hành lang.'],
  shut: ['Cuối hành lang có một cái bóng. Cao lắm. Gầy lắm.', 'Nó đang nhìn em.'],
  choose: ['Trốn đi đâu bây giờ?'],
  carried: ['…đung đưa…', '…hành lang dài ra…', '…sương lạnh…', '…sau lưng, radio tự bật lại…'],
  awake: [
    'Theo tỉnh dậy trên nền đất lạnh. Mùi dầu máy và gỗ mục.',
    'Không phải phòng em. Là một cái gara cũ.',
    'Bên ngoài, bước chân đi ngang qua. Đều đều. Theo một nhịp.',
  ],
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
  wardrobe: ['Cánh cửa phòng mở ra. Thật chậm.', 'Qua khe tủ, ánh đèn ngủ chuyển thành ánh nến.'],
  bed: ['Cánh cửa phòng mở ra. Thật chậm.', 'Dưới gầm giường, sàn nhà sáng lên ánh nến.'],
};

export const MMM = 'Mmmm…';

export const FOUND: Record<Outcome, string> = {
  held: 'Nó đứng yên rất lâu. Rồi nó cúi xuống, như thể ngửi thấy em.',
  heard: 'Theo lỡ thở ra. Nó quay phắt lại.',
  gasped: 'Hết hơi rồi. Theo há miệng hớp không khí.',
};

export const FOUND_AFTER: Record<HideSpot, string[]> = {
  wardrobe: ['Cánh tủ bật tung. Một bàn tay dài thò vào. Có cái gì lóe lên trên tay nó.', 'Chiếc đồng hồ tuột khỏi tay em khi nó lôi em qua giường.'],
  bed: ['Một bàn tay dài thò xuống gầm giường. Có cái gì lóe lên trên tay nó.', 'Chiếc đồng hồ tuột khỏi tay em, nằm lại dưới gầm giường.'],
};

export const FAINT = 'Theo hét lên. Nhưng không có tiếng nào thoát ra.';

export const END = {
  title: 'HẾT CHƯƠNG 1.1',
  teaser: 'Theo phải về được phòng mình.',
  replay: 'Chơi lại',
} as const;
