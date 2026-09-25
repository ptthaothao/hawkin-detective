// All player-facing text for Chapter 0. Source of truth: docs/chapter-0.md.
// Rule (doc §D): cards describe what was seen, never what it means.

import type { ChipId, ClueId, HintStage, SlotId } from './types';

export const INTRO_LINES = [
  'Theo biến mất ba đêm trước.',
  'Cảnh sát nói em bỏ nhà đi.',
  'Mẹ đã ngủ ở tầng dưới, sau ba đêm thức trắng.',
  'Đêm nay bạn mở cửa phòng em lần đầu tiên.',
];

export const OBJECTIVE_START = 'Theo đã đi đâu?';
export const OBJECTIVE_ALIVE = 'Theo còn sống.';

export interface ClueDef {
  title: string;
  world: 'normal' | 'other';
  text: string;
}

export const CLUES: Record<ClueId, ClueDef> = {
  C1: {
    title: 'Tờ tìm người',
    world: 'normal',
    text: 'THEO NGUYỄN, 12 tuổi. Mất tích đêm 14 rạng sáng 15/11. Cảnh sát cho rằng em bỏ nhà đi.',
  },
  C2: {
    title: 'Đồng hồ đeo tay',
    world: 'normal',
    text: 'Màn hình LCD nứt: 03:▯▯. Hai số cuối không hiện.\nGiấy nhắn của mẹ: “Mẹ tìm thấy dưới gầm giường. Nó dừng rồi.”',
  },
  C3: {
    title: 'Nhật ký tín hiệu',
    world: 'normal',
    text: 'Cuốn sổ của Theo, giấu dưới ván sàn.',
  },
  C4: {
    title: 'Đồng hồ bên kia',
    world: 'other',
    text: 'Đồng hồ đứng yên. Kim ngắn gãy, nằm dưới đáy mặt kính. Kim dài dừng qua số 3 hai vạch nhỏ.',
  },
  C5: {
    title: 'Bức tường khắc vạch',
    world: 'other',
    text: 'Bức tường có vạch khắc.',
  },
  C6: {
    title: 'Bàn radio bên kia',
    world: 'other',
    text: 'Vết cào sâu bao quanh radio. Đèn bàn ngay bên cạnh không có vết nào. Micro cầm tay rơi dưới sàn, dây kéo căng về phía bức tường cạnh giường. Nút bấm nói bị quấn băng keo cho kẹt xuống.',
  },
};

export const C6_UPDATE = 'Có thêm vết cào mới quanh radio.';

/** One night per page (doc §D, §P). */
export const DIARY_PAGES = [
  'Đêm 1 — 01:52. Chỉ có rè. Rồi ba tiếng gõ. Chắc em tưởng tượng.',
  'Đêm 2 — 02:34. Có tiếng thở. Em vặn to lên để nghe rõ. Sáng ra có vết cào ở mặt ngoài cửa phòng em. Mẹ bảo là con chó nhà bên.',
  'Đêm 3 — 02:58. Nó gọi tên em. Bằng giọng của mẹ. Đồng hồ đeo tay em tắt ngấm lúc nó tới, sáng ra mới chạy lại.',
  'Radio của bố có micro. Em vẫn chưa dám bấm nút.\n\nEm để đèn pin trong hốc dưới sàn. Sáng ra nó biến mất.\n\nĐêm nay nó sẽ đến muộn hơn. Lần này em sẽ không chỉ ngồi nghe.',
];

export const HOTSPOT_TEXT = {
  mic: 'Micro cầm tay móc gọn trên giá. Bạn không dám bấm.',
  wallClock: '11:47. Vẫn chạy.',
  wallClockStopped: 'Đồng hồ đứng yên.',
  poster: 'Poster. Không có gì lạ.',
  rugFirst: 'Bạn lật tấm thảm lên. Một tấm ván lỏng. Bên dưới là một cuốn sổ.',
  deskEdge: 'Một vết xước mờ trên mép bàn.',
  doorNormal: 'Mặt ngoài cửa phòng có vết cào mới.',
  osFloor: 'Tấm ván bị cạy. Hốc bên dưới trống, chỉ rộng bằng một cuốn sổ.',
  osDoor: 'Bạn không muốn mở cánh cửa đó.',
  flashlightRefused: 'Bạn còn cần nó.',
  flashlightGiven: 'Bạn đặt đèn pin vào hốc sàn. Đèn pin biến mất.',
  turnBack: 'Nó quay đầu lại. Tiếng tim đập.',
  rescue: 'Bàn tay Theo nắm lấy tay bạn. Đèn bật sáng. Theo ở đây.\nTheo: “Nó biết đường sang đây rồi.”',
  theoLight: 'Một vùng sáng bật lên ở bức tường. Dòng khắc mới: “EM ỔN. ĐÊM MAI. CÙNG GIỜ.”',
};

/** Radio responses (doc §H). Any frequency not listed here, including 3.00, is static only. */
export const ECHOES: Record<string, { signal: 'echo1' | 'echo2' | 'echo3'; line: string }> = {
  '1.52': { signal: 'echo1', line: '[1.52] Rè… rồi ba tiếng gõ.' },
  '2.34': { signal: 'echo2', line: '[2.34] Tiếng thở.' },
  '2.58': { signal: 'echo3', line: '[2.58] Giọng đàn bà thì thầm: “Theo…”' },
};

export const LIVE_FREQ = '3.17';
export const INITIAL_WHEELS: [number, number, number] = [2, 5, 8];

/** Must not contain "khắc", "vạch", "tường", "micro", "radio" (doc §F). */
export const THEO_CONTACT = [
  '…chị?',
  '…chị nghe được em hả?…',
  '…em vẫn ở trong phòng, nhưng không phải phòng mình…',
  '…mỗi lần bên chị tối đi, bên này sáng lên một chút…',
  '…em đếm từng lần…',
  '…em vẫn ở chỗ em đếm…',
  '…nó đang tới…',
  '…tắt—',
  '[mất tín hiệu]',
];

export const THEO_PRECALL = [
  'Em ở ngay chỗ lúc trước em bị kéo qua.',
  'Nó đứng giữa phòng, chắn đường.',
  'Em vẫn trốn được… nhưng tối lắm.',
  'Chị định làm gì?',
];

export const DEDUCTION_SENTENCE: Record<SlotId, [string, string]> = {
  A: ['Đêm đó, Theo đã', 'và bị kéo sang phía bên kia.'],
  C: ['Giờ em đang trốn ở', '.'],
  D: ['Thứ đang săn em tìm đến', '.'],
};

export interface ChipDef {
  label: string;
  slot: SlotId;
  /** Clues any one of which reveals the chip. Empty = revealed by the player's own action. */
  sources: ClueId[];
}

export const CHIPS: Record<ChipId, ChipDef> = {
  'tat-den': { label: 'tắt đèn', slot: 'A', sources: [] },
  'noi-vao-micro': { label: 'nói vào micro', slot: 'A', sources: ['C3', 'C6'] },
  'chui-hoc-san': { label: 'chui xuống hốc sàn', slot: 'A', sources: ['C3'] },
  'bo-nha-di': { label: 'bỏ nhà đi', slot: 'A', sources: ['C1'] },
  'hoc-duoi-san': { label: 'hốc dưới sàn', slot: 'C', sources: ['C3'] },
  'ban-radio': { label: 'bàn radio', slot: 'C', sources: ['C6'] },
  'cua-phong': { label: 'cửa phòng', slot: 'C', sources: ['C3'] },
  'buc-tuong': { label: 'bức tường có vạch khắc', slot: 'C', sources: ['C5'] },
  'anh-sang': { label: 'ánh sáng', slot: 'D', sources: ['C6'] },
  'tieng-radio': { label: 'tiếng radio', slot: 'D', sources: ['C6'] },
  'canh-cua-phong': { label: 'cánh cửa phòng', slot: 'D', sources: ['C3'] },
};

export const CORRECT: Record<SlotId, ChipId> = {
  A: 'noi-vao-micro',
  C: 'buc-tuong',
  D: 'tieng-radio',
};

export const FEEDBACK_WRONG = 'Câu chuyện này chưa khớp với bằng chứng.';
export const FEEDBACK_NEAR = 'Gần đúng. Có một chi tiết chưa khớp.';

/** Doc §L. Stages are picked by what the player is still missing, not by a fixed order. */
export const HINTS: Record<HintStage, [string, string, string]> = {
  flip: [
    'Đèn vừa chớp. Trong khoảnh khắc đó mình đã thấy gì?',
    'Căn phòng chỉ khác đi khi trời tối.',
    'Nếu mình tự tắt đèn thì sao?',
  ],
  diary: [
    'Bên kia, sàn nhà có gì đó khác.',
    'Ván sàn bên kia bị cạy. Cùng chỗ đó ở bên này thì sao?',
    'Dưới tấm thảm có thể có gì đó.',
  ],
  leap1: [
    'Lúc nãy radio phát ra cái gì?',
    'Nhật ký có nhắc đến giọng của mẹ.',
    'Radio đang để ở 2.58. Đêm đó là 02:58. Còn những đêm khác thì sao?',
  ],
  hour: [
    'Có thứ gì trong phòng đã dừng lại vào đêm đó?',
    'Nhật ký nói đồng hồ đeo tay tắt ngấm lúc nó tới.',
    'Đồng hồ đeo tay còn hiện số giờ.',
  ],
  minute: [
    'Đồng hồ đeo tay chỉ còn số giờ. Còn thứ gì khác đã dừng lại?',
    'Đồng hồ ở phía bên kia không chạy.',
    'Kim còn lại là kim dài.',
  ],
  dedA: [
    'Đọc lại những trang cuối của nhật ký.',
    'Ở phía bên kia, micro đang ở trong tình trạng nào?',
    'Mình đã tắt đèn bao nhiêu lần rồi? Theo đã làm gì khác mình?',
  ],
  dedC: [
    'Nghe lại lời Theo trên radio.',
    '‘Em đếm từng lần.’ Ở phía bên kia, chỗ nào có dấu đếm?',
    'Số vạch tăng lên mỗi lần mình tắt đèn. Có người đang đếm, ngay lúc này.',
  ],
  dedD: [
    'So sánh bàn radio bên kia trước và sau khi mình dò 3.17.',
    'Đèn bàn và radio nằm cạnh nhau. Cái nào bị cào?',
    'Theo từng vặn to radio, sáng hôm sau có vết cào. Còn mình vừa bật radio lên…',
  ],
  branchB: [
    'Theo đang ở trong bóng tối.',
    'Nhật ký: đồ để trong hốc sàn thì biến mất.',
    'Mình đang cầm thứ gì mà Theo cần?',
  ],
};

export const ENDING = {
  beatA: 'Đồng hồ treo tường vẫn đứng yên.',
  beatB: 'Đồng hồ treo tường điểm… rồi đứng lại.',
  title: 'HẾT CHƯƠNG 0',
  teaserA: 'Theo đã về nhà. Nhưng nó biết đường sang đây rồi.',
  teaserB: 'Theo vẫn ở phía bên kia. Đêm mai, cùng giờ.',
};
