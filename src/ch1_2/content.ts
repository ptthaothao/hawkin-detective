import type { Beat, HideSpot, TargetId } from './machine';

/** Kept to the minimum, as in 1.1: the picture, the sound and what the player does say the rest. */
export const TITLE = 'Vài phút trước';

export const NARRATION: Partial<Record<Beat, string[]>> = {
  carried: ['Không phải giường của em.', 'Có thứ gì đó đang vác em đi.'],
  tumble: ['Cả hai ngã xuống chân cầu thang.'],
  catch: ['Theo tựa lưng vào cánh cửa gara, thở dốc.'],
  sleep: ['Nó đi rồi.', 'Em mệt quá…'],
  wake: ['Không phải phòng em.', 'Bên ngoài, bước chân đi ngang qua. Theo một nhịp.'],
  run: ['Theo chạy qua sân.', 'Trên gác áp mái, cái radio vẫn đang rè rè.'],
  glass: ['Qua ô kính, nó đứng giữa sân.', 'Nó nhìn vào nhà. Và không bước vào.', 'Rồi nó quay đi, đều nhịp, về phía bóng tối.'],
};

/** What he finds out about it, depending on where he hid. Told once he is safe. */
export const REWARD: Record<HideSpot, string> = {
  tent: 'Dưới chiếc gối có một tờ giấy vẽ hai người que: một người lớn và một cậu bé. Ở góc giấy có ký tên: MAR.',
  buggy: 'Nó quỳ trước cái lều. Nó vuốt mấy chiếc áo, rất khẽ. “M…”',
};

export const OUTSIDE: string[][] = [
  ['Tiếng chó sủa lúc nãy đã không còn nữa.', 'Nhà bên cạnh chỉ còn bộ khung mục nát.'],
  ['Con đường không có đèn. Không một ô cửa sáng.', 'Không một tiếng động.'],
  ['Ánh đèn pin chỉ rọi được vài bước.', 'Xa hơn nữa chỉ còn bóng tối.'],
];
export const OUTSIDE_STEPS = 'Bước chân. Đều nhịp. Từ phía bóng tối.';

export const PROMPT = {
  struggle: 'Vùng ra!',
  enter: 'Chạy vào gara',
  crawl: 'Bò ra ngoài',
  onward: 'Đi tiếp',
  home: 'Chạy về gara!',
  hold: 'Giữ để nín thở',
  holdKey: 'giữ phím Space hoặc giữ nút',
  door: 'Giữ để khép cửa thật khẽ',
  doorKey: 'giữ phím Space hoặc giữ nút',
  throwCans: 'Ném mẩu bút sáp vào đống lon',
  throwWall: 'Ném vào tường gần chỗ trốn',
  run: 'Chạy ra cửa sau!',
} as const;

export const HIDE_LABEL: Record<HideSpot, string> = {
  tent: 'Chui vào lều, trùm áo lên người',
  buggy: 'Chui vào xe ngựa cũ',
};

export const TARGET_LABEL: Record<TargetId, string> = {
  cans: PROMPT.throwCans,
  wall: PROMPT.throwWall,
};

export const CAUGHT = ['Nó tìm thấy em.', 'Rồi nó đặt em xuống, nhẹ nhàng, như đặt một đứa trẻ vào giường.', 'Em bò về chỗ cũ, nín thở, và chờ nó đi tìm lại.'];
export const CAUGHT_LOST = 'Một cây bút sáp rơi mất.';

export const END = {
  title: 'HẾT CHƯƠNG 1.2',
  teaser: 'Trên gác, cái radio vẫn đang rè.',
  replay: 'Chơi lại',
} as const;

/** The note in the corner, as in Chapter 0 and 1.1: where Theo is, what he is wondering, what to do. */
export type Objective = { where: string; goal: string; action?: string };

export const OBJECTIVE: Partial<Record<Beat, Objective>> = {
  carried: { where: 'Cầu thang · ???', goal: 'Nó đang vác mình đi!', action: 'Vùng ra (bấm liên tục)' },
  tumble: { where: 'Cầu thang · ???', goal: 'Chạy!' },
  yard: { where: 'Sân sau', goal: 'Nó đang đứng dậy sau lưng. Phải trốn ở đâu đó!', action: 'Chạy vào gara cũ' },
  catch: { where: 'Gara cũ', goal: 'Mình đang ở đâu vậy? Nó vẫn đi theo mình.', action: 'Nhìn quanh (đưa chuột ra mép màn hình). Nghe cho kỹ.' },
  choose: { where: 'Gara cũ', goal: 'Bước chân đang tới gần!', action: 'Chọn chỗ trốn' },
  caught: { where: 'Gara cũ', goal: '' },
  wake: { where: 'Gara cũ', goal: 'Mình ngủ quên mất. Nó đi đâu rồi?' },
  outside: { where: 'Bên ngoài', goal: 'Phải tìm ai đó giúp mình.', action: 'Chạy sang nhà bên' },
  slam: { where: 'Gara cũ', goal: '' },
  run: { where: 'Sân sau', goal: 'Về nhà!' },
  door: { where: 'Cửa sau', goal: 'Đừng để nó nghe thấy.', action: 'Khép cửa thật khẽ' },
};

export const HIDE_OBJECTIVE = {
  round1: {
    where: 'Trong chỗ trốn',
    goal: 'Nó đang tìm em. Đừng để nó nghe em thở.',
    action: 'Nó lại gần thì giữ Space để nín thở, nó đi xa thì thả ra',
  },
  block: {
    where: 'Trong chỗ trốn',
    goal: 'Nó đứng chắn ngay cửa. Em không ra được.',
    action: 'Phải làm gì đó để nó đi chỗ khác',
  },
  blockHint: {
    where: 'Trong chỗ trốn',
    goal: 'Nó nghe tiếng động. Ở góc kia có mấy cái lon, và trong túi em còn mẩu bút sáp…',
    action: 'Ném thứ gì đó thật xa khỏi cửa',
  },
  lured: {
    where: 'Trong chỗ trốn',
    goal: 'Nó đang đi về phía tiếng động.',
    action: 'Chạy ra cửa sau!',
  },
} as const;

export const OUTSIDE_OBJECTIVE: Objective[] = [
  { where: 'Bên ngoài', goal: 'Phải tìm ai đó giúp mình.', action: 'Chạy sang nhà bên' },
  { where: 'Bên ngoài', goal: 'Không có ai cả…', action: 'Đi tiếp' },
  { where: 'Bên ngoài', goal: 'Không có ai để cầu cứu.' },
];
export const OUTSIDE_STEPS_OBJECTIVE: Objective = { where: 'Bên ngoài', goal: 'Có thứ gì đó đang quay lại.', action: 'Chạy về gara!' };
