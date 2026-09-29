// All player-facing text for Chapter 0. Source of truth: docs/chapter-0.md.
// Rule (doc §D): cards describe what was seen, never what it means.

import type { ChipId, ClueId, HintStage, SlotId } from './types';

/** Opening cinematic (doc §R): who Theo is, what happened, why you are here, where to start. */
export interface IntroLine {
  text: string;
  kind: 'kicker' | 'headline' | 'line';
}

export const INTRO_LINES: IntroLine[] = [
  { kind: 'kicker', text: 'Ba đêm trước' },
  { kind: 'headline', text: 'THEO BIẾN MẤT.' },
  { kind: 'line', text: 'Em trai bạn. 12 tuổi.' },
  { kind: 'line', text: 'Cảnh sát nghĩ em bỏ nhà đi. Bạn thì không.' },
  // Doc §D: the watch only shows the hour. The minutes live on the other side.
  { kind: 'line', text: 'Đêm qua, mẹ tìm thấy đồng hồ đeo tay của em dưới gầm giường.\nNó dừng lúc 3 giờ. Hai số phút đã vỡ.' },
  { kind: 'line', text: 'Mẹ đã ngủ ở tầng dưới, sau ba đêm thức trắng.' },
  { kind: 'line', text: 'Đêm nay, bạn bước vào phòng của Theo\nđể tìm hiểu chuyện gì đã xảy ra.' },
];

/**
 * Chapter 0 guidance steps (doc §R). Each step pairs the story question the player is chasing
 * with the next thing to *do*. The current step is derived from GameState in `currentStep`.
 */
export type StepId =
  | 'check-radio'
  | 'radio-why'
  | 'find-diary'
  | 'test-frequencies'
  | 'investigate-0258'
  | 'glimpse'
  | 'find-minutes'
  | 'tune-night'
  | 'find-theo'
  | 'investigate-creature'
  | 'find-count'
  | 'reconstruct'
  | 'hush'
  | 'cross-over'
  | 'resolved';

export interface StepText {
  /** The story question this step serves. */
  question: string;
  /** The next thing to do. Never how to solve it. */
  action: string;
  /** Shown after the player has stood still for a while. Reinforces, never solves. */
  nudge: string;
}

const WHO_SPEAKS = 'Ai đang nói qua radio?';
/** Once the radio is known to replay past nights, the night that matters is the last one. */
const THEO_NIGHT = 'Đêm Theo biến mất, radio đã bắt được gì?';

export const STEPS: Record<StepId, StepText> = {
  'check-radio': {
    question: 'Chuyện gì đã xảy ra với Theo?',
    action: 'Kiểm tra radio đang bật trên bàn.',
    nudge: 'Radio trên bàn vẫn còn bật…',
  },
  'radio-why': {
    question: 'Vì sao radio của Theo vẫn còn phát?',
    action: 'Nghe radio.',
    nudge: 'Giọng đó phát ra từ radio.',
  },
  'find-diary': {
    question: 'Vì sao radio của Theo vẫn còn phát?',
    action: 'Tìm nhật ký của Theo.',
    nudge: 'Tấm thảm hơi lệch, như vừa có ai lật lên rồi đặt lại.',
  },
  'test-frequencies': {
    question: WHO_SPEAKS,
    action: 'Thử những tần số khác.',
    nudge: 'Mỗi đêm trong nhật ký, Theo nghe thấy một thứ khác nhau.',
  },
  'investigate-0258': {
    question: THEO_NIGHT,
    action: 'Tìm xem đêm đó nó tới lúc mấy giờ.',
    nudge: 'Nhật ký: đồng hồ đeo tay của Theo tắt ngấm lúc nó tới.',
  },
  glimpse: {
    question: 'Căn phòng vừa biến thành cái gì?',
    action: 'Xem chuyện gì xảy ra khi đèn tắt.',
    nudge: 'Nó chỉ hiện ra đúng lúc đèn tắt.',
  },
  'find-minutes': {
    question: THEO_NIGHT,
    action: 'Tìm số phút còn thiếu.',
    nudge: 'Đồng hồ đeo tay chỉ còn số giờ. Còn thứ gì khác đã dừng lại đêm đó?',
  },
  'tune-night': {
    question: THEO_NIGHT,
    action: 'Dò tần số của đêm Theo biến mất.',
    nudge: 'Hai chiếc đồng hồ, mỗi chiếc chỉ còn lại một nửa.',
  },
  'find-theo': {
    question: 'Theo đang ở đâu?',
    action: 'Tìm Theo ở căn phòng bên kia.',
    nudge: '“Không phải phòng của chị.” Căn phòng mình thấy mỗi khi đèn tắt…',
  },
  'investigate-creature': {
    question: 'Thứ gì đang ở bàn radio?',
    action: 'Soi bàn radio.',
    nudge: 'Mình vừa bật radio lên. Có thứ gì nghe thấy không?',
  },
  'find-count': {
    question: 'Theo đang ở đâu?',
    action: 'Tìm chỗ Theo nói em đang đếm.',
    nudge: 'Theo nói: em vẫn ở chỗ em đếm.',
  },
  reconstruct: {
    question: 'Chuyện gì đã thực sự xảy ra với Theo?',
    action: 'Ghép lại bằng chứng trong hồ sơ.',
    nudge: 'Mình đã có đủ bằng chứng. Hồ sơ đang ở góc.',
  },
  hush: {
    question: 'Làm sao để nó không nghe thấy Theo?',
    action: 'Tắt radio, đúng lúc.',
    nudge: 'Nó bước rất đều. Nghe cho kỹ nhịp của nó.',
  },
  'cross-over': {
    question: 'Theo có ổn không?',
    action: 'Sang phía bên kia.',
    nudge: 'Tắt đèn.',
  },
  resolved: { question: '', action: '', nudge: '' },
};

/** Things the player now knows for certain. Each one opens the next question; none is an objective. */
export type DiscoveryId = 'echoes' | 'other-side' | 'alive' | 'followed' | 'connected';

export const DISCOVERIES: Record<DiscoveryId, string> = {
  echoes: 'Radio đang phát lại những đêm trước khi Theo biến mất.',
  'other-side': 'Căn phòng có một phía khác. Nó chỉ hiện ra khi đèn tắt.',
  alive: 'Theo còn sống.',
  followed: 'Nó tới bàn radio ngay sau khi mình bật radio lên.',
  connected: 'Theo đã nói vào micro. Và thứ đó tìm đến tiếng ấy.',
};

/** The deduction page asks the chapter's real question. */
export const TRUTH_QUESTION = 'Chuyện gì đã thực sự xảy ra với Theo?';

/** Where the player is standing. The other side has no name until Theo gives it one. */
export const LOCATION = {
  normal: 'Phòng áp mái của Theo',
  otherUnknown: 'Phòng của Theo…?',
  other: 'Phía bên kia',
};

/** The next thing to do is back on this side: say so before saying what. */
export const RETURN_FIRST = 'Bật đèn quay về, rồi';

/** Verb shown next to the pointer on whatever it rests on: what the hand would do to it. */
export const VERBS: Record<string, string> = {
  radio: 'Nghe',
  rug: 'Lật thảm',
  watch: 'Xem kỹ',
  'wall-clock': 'Xem',
  flyer: 'Đọc',
  mic: 'Xem',
  poster: 'Xem',
  'desk-edge': 'Sờ',
  crayon: 'Nhặt',
  'door-normal': 'Xem',
  switch: 'Công tắc',
  'os-clock': 'Soi',
  'os-wall': 'Soi',
  'os-floor': 'Soi',
  'os-desk': 'Soi',
  'os-door': 'Mở cửa',
};

/** One-off inner lines at story beats. The player's reaction, never the answer. */
export const NARRATION = {
  arrive: 'Phòng của Theo. Mọi thứ vẫn như đêm em biến mất.\nChỉ có radio trên bàn là vẫn còn bật.',
  motherVoiceAfter: 'Giọng mẹ. Nhưng mẹ đang ngủ ở tầng dưới.',
  noticeDial: 'Radio vẫn để ở 2.58, như lúc Theo để lại. Mấy đêm cuối em thức nghe nó.\nEm có ghi lại những gì đã nghe không?',
  glimpse: 'Trong một khoảnh khắc, căn phòng không phải thế này.',
  firstOtherSide: 'Vẫn là phòng của Theo.\nNhưng như thể bị bỏ lại ở một đêm nào đó.',
  somethingAtDesk: 'Có thứ gì đó đang đứng ở bàn radio.',
  evidenceReady: 'Mình đã có đủ bằng chứng. Mở hồ sơ.',
  truth: 'Theo không bỏ nhà đi. Em vẫn ở đây.\nVà thứ đang săn em nghe được mọi âm thanh.',
  contactAfter: '“Không phải phòng của chị”… Căn phòng mình thấy mỗi khi đèn tắt?',
};

/** A line in a radio scene: a voice on the radio, you speaking to it, or what you do. */
export interface DialogueLine {
  who: 'theo' | 'radio' | 'you' | 'stage';
  text: string;
}

/** The voice on 2.58 the first time the player listens. */
export const MOTHER_VOICE: DialogueLine[] = [{ who: 'radio', text: '“Theo…”' }];

/** Reaction when a clue is first found; the card itself goes into the Case File. */
export const CLUE_FOUND: Record<ClueId, string> = {
  C1: 'Cả chồng tờ tìm người chưa kịp dán. Cảnh sát viết: “bỏ nhà đi”.',
  C2: 'Đồng hồ đeo tay của Theo, kèm giấy nhắn của mẹ. Mặt số nứt, chỉ còn đọc được 03.',
  C3: 'Nhật ký của Theo.',
  C4: 'Đồng hồ quả lắc ở đây đã dừng, con lắc treo lệch. Kim ngắn gãy rơi dưới mặt kính. Chỉ còn kim dài.',
  C5: 'Ai đó đã vẽ lên tường, bằng bút sáp.',
  C6: 'Radio bị cào nát. Micro rơi dưới sàn, dây kéo căng về phía bức tường.',
};

/** When the second stopped clock is found, the player notices it matches the first. Observation, not answer. */
export const CLUE_FOUND_PAIRED: Partial<Record<ClueId, string>> = {
  C2: 'Đồng hồ đeo tay của Theo. Nó cũng đã dừng, như cái đồng hồ bên kia. Mặt số nứt: còn số giờ, mất số phút.',
  C4: 'Đồng hồ quả lắc ở đây cũng dừng, như đồng hồ đeo tay của Theo. Kim ngắn gãy rơi dưới mặt kính. Chỉ còn kim dài.',
};

export interface ClueDef {
  title: string;
  world: 'normal' | 'other';
  text: string;
}

export const CLUES: Record<ClueId, ClueDef> = {
  C1: {
    title: 'Tờ tìm người',
    world: 'normal',
    text: 'THEO HALE, 12 tuổi. Mất tích đêm 14 rạng sáng 15/11. Cảnh sát cho rằng em bỏ nhà đi.',
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
    text: 'Đồng hồ quả lắc đứng yên. Con lắc dừng lệch một bên. Kim ngắn gãy, nằm dưới đáy mặt kính. Kim dài dừng qua số 3 hai vạch nhỏ.',
  },
  C5: {
    title: 'Bức tường có vạch',
    world: 'other',
    text: 'Bức tường có vạch bút sáp.',
  },
  C6: {
    title: 'Bàn radio bên kia',
    world: 'other',
    text: 'Vết cào sâu bao quanh radio. Đèn dầu ngay bên cạnh không có vết nào. Micro cầm tay rơi dưới sàn, dây kéo căng về phía bức tường cạnh giường. Nút bấm nói bị quấn băng keo cho kẹt xuống.',
  },
};

export const C6_UPDATE = 'Có thêm vết cào mới quanh radio.';

/** One night per page (doc §D, §P). */
export const DIARY_PAGES = [
  'Đêm 1 — 01:52. Chỉ có rè. Rồi ba tiếng gõ. Chắc em tưởng tượng.',
  'Đêm 2 — 02:34. Có tiếng thở. Em vặn to lên để nghe rõ. Sáng ra có vết cào ở mặt ngoài cửa phòng em. Mẹ bảo là con chó nhà bên.',
  'Đêm 3 — 02:58. Nó gọi tên em. Bằng giọng của mẹ. Đồng hồ đeo tay em tắt ngấm lúc nó tới, sáng ra mới chạy lại.',
  'Radio của bố có micro. Em vẫn chưa dám bấm nút.\n\nEm để một mẩu bút sáp trong hốc dưới sàn. Sáng ra nó biến mất.',
  // The last night's time is left blank: that blank is the question the player has to fill in.
  'Hôm nay em ở nhà Danny tới tối, vẽ cả buổi. Về nhà em nằm lên giường và nghịch radio của bố.\n\nĐêm 4 — __:__. Đêm nay nó sẽ đến muộn hơn. Nó tới lúc nào, em sẽ ghi vào đây.\n\nLần này em sẽ không chỉ ngồi nghe.',
];

export const HOTSPOT_TEXT = {
  mic: 'Micro cầm tay móc gọn trên giá. Bạn không dám bấm.',
  wallClock: '11:47. Vẫn chạy.',
  wallClockStopped: 'Đồng hồ đứng yên.',
  poster: 'Phim Theo thích nhất. Em xem bốn lần, rồi nói sau này sẽ làm phi hành gia.',
  rugFirst: 'Bạn lật tấm thảm lên. Một tấm ván lỏng. Bên dưới là một cuốn sổ.',
  deskEdge: 'Một vết xước mờ trên mép bàn. Lúc bạn vào phòng, nó chưa có ở đây.',
  doorNormal: 'Mặt ngoài cửa phòng có vết cào mới.',
  osFloor: 'Tấm ván bị cạy. Hốc bên dưới trống, chỉ rộng bằng một cuốn sổ.',
  osDoor: 'Bạn không muốn mở cánh cửa đó.',
  osDeskAfter: 'Vết cào mới quanh radio. Có thứ gì vừa ở đây.\nBạn nín thở, giữ yên ánh đèn.',
  crayon: 'Một mẩu bút sáp của Theo, mòn còn nửa. Em lúc nào cũng có vài mẩu trong túi.',
  crayonAgain: 'Mẩu bút sáp của Theo.',
  radioFaint: 'Dưới đáy radio có những nét lõm mờ. Như có ai từng khắc chữ lên vỏ máy.',
  rubbed: 'Dưới nét bút sáp hiện ra một hàng chữ khắc từ lâu dưới đáy radio: M-A-R-T-I-N.',
  glint: 'Có thứ gì loé lên trên bàn tay nó. Rồi nó quay đi.',
  breathOut: 'Bạn thở ra. Nó khựng lại. Bạn phải chờ.',
  knobSnapped: 'Bạn vặn núm âm lượng. Nó gãy rời trong tay bạn.',
  turnBack: 'Nó dừng bước và quay về phía radio. Tiếng tim đập. Radio rè lên lại.',
  hushed: 'Im lặng. Bước chân dừng ở cửa phòng. Một tiếng cào nhẹ. Rồi nó đi tiếp.',
  theoLight: 'Một vùng sáng bật lên ở bức tường. Dòng bút sáp mới: “EM ỔN. ĐÊM MAI. CÙNG GIỜ.”',
};

/** Radio responses (doc §H). Any frequency not listed here, including 3.00, is static only. */
export const ECHOES: Record<string, { signal: 'echo1' | 'echo2' | 'echo3'; line: string }> = {
  '1.52': { signal: 'echo1', line: '[1.52] Rè… rồi ba tiếng gõ.' },
  '2.34': { signal: 'echo2', line: '[2.34] Tiếng thở.' },
  '2.58': { signal: 'echo3', line: '[2.58] Giọng đàn bà thì thầm: “Theo…”' },
};

export const LIVE_FREQ = '3.17';
export const INITIAL_WHEELS: [number, number, number] = [2, 5, 8];

/**
 * First contact at 3.17 (doc §F). Sound crosses between the sides (rule 4), so Theo hears you speak.
 * Theo's lines must not contain "khắc", "vạch", "tường", "micro", "radio", "bút", "màu", "vẽ".
 */
export const THEO_CONTACT: DialogueLine[] = [
  { who: 'theo', text: '…chị?' },
  { who: 'theo', text: '…chị nghe được em hả?…' },
  { who: 'you', text: 'Theo? Em đang ở đâu?' },
  { who: 'theo', text: 'Em vẫn ở đây. Trong phòng.' },
  { who: 'stage', text: 'Bạn nhìn quanh. Căn phòng trống không.' },
  { who: 'theo', text: '…nhưng không phải phòng của chị.' },
  { who: 'theo', text: 'Ở đây tối lắm. Mỗi lần bên chị tối đi, bên này sáng lên một chút…' },
  { who: 'theo', text: '…em đếm từng lần. Em vẫn ở chỗ em đếm.' },
  { who: 'you', text: 'Chị phải làm sao để tìm em?' },
  { who: 'theo', text: '…nó đang tới…' },
  { who: 'theo', text: '…tắt—' },
  { who: 'radio', text: '[mất tín hiệu]' },
];

/**
 * Doc §K: the last thing Theo says before the footsteps. It gives the reason for the microphone rule,
 * and tells the player to listen for the rhythm. No choice is offered.
 */
export const THEO_PRECALL: DialogueLine[] = [
  { who: 'theo', text: 'Chị. Đừng nói gì vào micro nữa. Nó nghe thấy.' },
  { who: 'theo', text: 'Đêm em nói vào đó, nó tới.' },
  { who: 'theo', text: 'Pin đèn của em sắp hết rồi.' },
  { who: 'theo', text: 'Nó đang đi qua phòng em. Đều như mọi lần.' },
  { who: 'theo', text: 'Chị nghe cho kỹ nhịp của nó.' },
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
  'buc-tuong': { label: 'bức tường có vạch bút sáp', slot: 'C', sources: ['C5'] },
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
    'Soi đồng hồ bên kia. Kim còn lại là kim dài.',
  ],
  combine: [
    'Hai chiếc đồng hồ đều dừng lúc nó tới. Mỗi chiếc chỉ còn lại một nửa.',
    'Đồng hồ đeo tay còn số giờ. Kim dài là kim phút.',
    'Đêm 3 là 02:58, và radio để ở 2.58. Đêm 4 thì sao?',
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
    'Đèn dầu và radio nằm cạnh nhau. Cái nào bị cào?',
    'Theo từng vặn to radio, sáng hôm sau có vết cào. Còn mình vừa bật radio lên…',
  ],
  hush: [
    'Nó bước rất đều.',
    'Radio rú lên mỗi lần nó bước. Giữa hai bước thì sao?',
    'Tắt radio đúng lúc nó nhấc chân, giữa hai bước.',
  ],
};

export const ENDING = {
  beat: 'Đồng hồ treo tường điểm… rồi đứng lại.',
  title: 'HẾT CHƯƠNG 0',
  teaser: 'Theo vẫn ở phía bên kia. Đêm mai, cùng giờ.',
};
