# STATIC — Chapter 0: "Tín hiệu"

> Vertical slice · 1 phòng · 2 thế giới · 15–20 phút
> Tài liệu thiết kế gameplay, là **source of truth** cho Chapter 0. Chưa bao gồm architecture.
> Cập nhật 25/09/2026 sau vòng stress-test và final validation. Thêm mục R (xương sống câu chuyện) sau lần tự chơi thử bản build đầu.
> Bản trước: [ideas.md](ideas.md)

---

## 0. Quyết định thiết kế so với ideas.md

1. **Đổi tên chapter.** Tên "03:17" để lộ đáp án của puzzle chính nên đổi thành "Tín hiệu".
2. **Deduction phải xây dựng lại chuyện đã xảy ra, không chỉ xác nhận một con số.** Việc tìm ra thời điểm được kiểm chứng bằng hành động (dò radio). Deduction hỏi một câu lớn hơn.
3. **Game không lưu và không hiển thị "Player Knowledge".** Game chỉ ghi lại những gì người chơi đã quan sát. Người chơi biết gì thì game chỉ kiểm tra được qua câu trả lời họ nhập.
4. **Choice phải có đánh đổi thật.** "Đi xuống ngay / lấy đèn pin trước" thực chất là chọn độ khó nên bị loại.
5. **Dùng 6 clue thay vì 3–5.** Puzzle cần 3 nguồn thông tin, deduction cần thêm 3, và có một clue tạo bối cảnh. Cắt thêm thì một trong hai phần sẽ còn một bước suy luận duy nhất.
6. **IP gốc.** Không dùng Hawkins, Upside Down hay tên nhân vật của Stranger Things.

### Sau stress-test (25/09/2026)

7. **Đổi phần thông tin mỗi phía giữ về thời điểm.** Đồng hồ đeo tay ở phía này chỉ còn số giờ (`03:▯▯`). Số phút chỉ có ở kim dài của đồng hồ bên kia. Bản trước để phía này tự suy ra được 3:17.
8. **Nhật ký không còn ghi tần số.** Người chơi phải tự phát hiện mối liên hệ tần số ↔ giờ qua tiếng vọng trên radio.
9. **Tờ tìm người bỏ khung "2–4 giờ"** vì nó làm lộ số giờ.
10. **Đáp án slot A đổi thành "nói vào micro".** Nhật ký không còn câu nào nói thẳng hành động đó.
11. **Lời Theo trên radio không dùng chữ "khắc" hay "vạch"**, để slot C phải suy luận.
12. **Lợi ích và cái giá của cả hai lựa chọn đều có bằng chứng trước lúc chọn.** Thêm chi tiết mẹ ngủ ở tầng dưới và vết cào ở mặt ngoài cửa.

---

## A. Revised Game Concept

**Working title: STATIC**

> Mỗi vị trí trong phòng tồn tại ở hai phía. Sự thật bị chia đôi: một nửa ở phía này, một nửa ở phía bên kia. Chỉ bạn mới ghép được hai nửa đó.

Theo, 12 tuổi, mất tích 3 đêm trước. Cảnh sát cho rằng em bỏ nhà đi. Bạn là chị gái của Theo và bước vào phòng em lúc gần nửa đêm. Khi tắt đèn, căn phòng trở thành *phía bên kia*.

Game không tìm cách hù dọa bằng jumpscare. Khoảnh khắc đáng sợ nhất nằm ở sự hiểu ra: *thứ bạn vừa dùng để liên lạc với Theo cũng chính là thứ dẫn con quái vật tới.*

---

## B. Core Gameplay Pillars

| Pillar | Ý nghĩa | Kiểm tra |
|---|---|---|
| **1. Sự thật bị chia đôi** | Không clue quan trọng nào tự đủ. Mọi kết luận cần thông tin từ cả hai phía. | Nếu một câu hỏi giải được mà chỉ cần ở một phía thì thiết kế sai. |
| **2. Game ghi lại, người chơi kết luận** | Clue card chỉ mô tả những gì đã thấy, không bao giờ diễn giải. | Không card nào được chứa chữ "có vẻ", "liên quan", "nghĩa là". |
| **3. Học luật của phía bên kia** | Phía bên kia vận hành theo luật nhất quán. Người chơi học các luật đó, rồi dùng chúng. | Mọi hiện tượng đều giải thích được bằng các luật ở mục I. |
| **4. Kiểm chứng bằng hành động** | Người chơi chứng minh mình hiểu bằng cách làm (dò radio, điền kết luận, nhét đồ vào hốc sàn). | Không có ô "nhập mã" nào trôi nổi, không gắn với vật thể nào. |
| **5. Lựa chọn dựa trên hiểu biết** | Choice chỉ có ý nghĩa với người đã hiểu được deduction. | Người chưa làm deduction sẽ không hiểu mình đang đánh đổi cái gì. |

---

## C. Chapter 0 Design

- **Địa điểm:** phòng ngủ áp mái của Theo. Chỉ một phòng.
- **Thời lượng:** 15–20 phút.
- **Người chơi đã có sẵn:** đèn pin. Không có inventory UI.

```text
┌──────────────────────────────────────────────┐
│  [ĐỒNG HỒ TREO TƯỜNG]          [CÔNG TẮC]    │
│                                   [CỬA]      │
│  [BỨC TƯỜNG CẠNH GIƯỜNG]                     │
│   ┌────────┐                                 │
│   │ GIƯỜNG │         [THẢM / SÀN]            │
│   └────────┘                                 │
│                  [BÀN: radio · tờ tìm người  │
│                   · đồng hồ đeo tay · đèn bàn]│
└──────────────────────────────────────────────┘
```

| # | Vật thể | Phía này (Normal) | Phía bên kia (Other Side) | Vai trò |
|---|---|---|---|---|
| 1 | **Công tắc đèn** | Đèn sáng | Tối, chỉ có vùng sáng của đèn pin | Cơ chế flip. Mỗi lần tắt đèn, tường bên kia có thêm 1 vạch (mục I). |
| 2 | **Bàn radio** | Radio sóng ngắn có 3 bánh xe số `_._ _ MHz`, đang để ở **2.58**, **đang bật** khi người chơi bước vào (đèn LED sáng, loa rè khẽ). Lần đầu nghe sẽ phát tiếng vọng của đêm 3 (mục R). Micro cầm tay móc gọn trên giá. Có chồng tờ tìm người. Có đồng hồ đeo tay của Theo kèm giấy nhắn của mẹ. | Radio bị dây leo phủ kín, không đọc được số. **Vết cào dày đặc quanh radio.** Đèn bàn ngay cạnh **vẫn nguyên vẹn**. **Micro rơi dưới sàn, nút bấm nói bị quấn băng keo, dây kéo căng về phía bức tường cạnh giường.** | P1, slot A, slot D |
| 3 | **Đồng hồ treo tường** | Chạy bình thường, 11:47 PM, có tiếng tích tắc | **Đứng yên. Kim ngắn gãy, nằm dưới đáy mặt kính. Kim dài dừng qua số 3 hai vạch nhỏ.** | P1 (số phút) |
| 4 | **Thảm / sàn** | Tấm thảm; bên dưới có một tấm ván lỏng giấu nhật ký | Thảm mục nát, **tấm ván đã bị cạy lên**, hốc bên dưới trống, chỉ rộng bằng một cuốn sổ | Dẫn hướng tới nhật ký, bác bỏ đáp án "hốc sàn", kênh chuyển đồ ở nhánh B |
| 5 | **Bức tường cạnh giường** | Poster, không có gì lạ | **Vạch khắc. Lần đầu thấy 4 vạch, sau đó +1 mỗi lần người chơi tắt đèn.** | Slot C, cho thấy Theo còn sống |

- Cửa phòng ở phía bên kia không mở được ("Bạn không muốn mở cánh cửa đó"). Nó chỉ dùng cho âm thanh và bầu không khí.
- Micro ở phía này không bấm được ("Bạn không dám bấm."). Người chơi không bao giờ phát sóng trong Chapter 0.
- Intro có dòng *"Mẹ đã ngủ ở tầng dưới, sau ba đêm thức trắng."* Đây là tiền đề cho cái giá của lựa chọn A (mục K), và cũng là lý do giọng mẹ trên radio là điều không thể.

---

## D. Clue List

Clue card chỉ ghi lại **những gì thấy được**. Những chữ **in đậm** là "chip" dùng để điền vào deduction.

| ID | Tìm ở | Nội dung card (trung tính) |
|---|---|---|
| **C1** Tờ tìm người | Phía này, bàn | "THEO NGUYỄN, 12 tuổi. Mất tích đêm 14 rạng sáng 15/11. Cảnh sát cho rằng em **bỏ nhà đi**." |
| **C2** Đồng hồ đeo tay | Phía này, bàn | Màn hình LCD nứt: `03:▯▯`. Hai số cuối không hiện. Giấy nhắn của mẹ: *"Mẹ tìm thấy dưới gầm giường. Nó dừng rồi."* |
| **C3** Nhật ký tín hiệu | Phía này, dưới ván sàn | Xem nội dung đầy đủ bên dưới. |
| **C4** Đồng hồ bên kia | Phía bên kia | "Đồng hồ đứng yên. Kim ngắn gãy, nằm dưới đáy mặt kính. Kim dài dừng qua số 3 hai vạch nhỏ." |
| **C5** Bức tường khắc vạch | Phía bên kia | "**Bức tường có vạch khắc.** Lần 1: 4 vạch." Card tự ghi thêm sau mỗi lần sang, ví dụ "Lần 2: 5 vạch". Card không ghi lý do số vạch tăng. |
| **C6** Bàn radio bên kia | Phía bên kia | "Vết cào sâu bao quanh **radio**. **Đèn bàn** ngay bên cạnh không có vết nào. **Micro** cầm tay rơi dưới sàn, dây kéo căng về phía bức tường cạnh giường. Nút bấm nói bị quấn băng keo cho kẹt xuống." Sau khi bắt được liên lạc, card ghi thêm: "Có thêm vết cào mới quanh radio." |

**Nội dung C3 — Nhật ký tín hiệu** (mỗi đêm một trang):

> *Đêm 1 — 01:52. Chỉ có rè. Rồi ba tiếng gõ. Chắc em tưởng tượng.*
> *Đêm 2 — 02:34. Có tiếng thở. Em vặn to lên để nghe rõ. Sáng ra có vết cào ở **mặt ngoài cửa phòng** em. Mẹ bảo là con chó nhà bên.*
> *Đêm 3 — 02:58. Nó gọi tên em. Bằng giọng của mẹ. Đồng hồ đeo tay em tắt ngấm lúc nó tới, sáng ra mới chạy lại.*
> *Radio của bố có **micro**. Em vẫn chưa dám bấm nút.*
> *Em để đèn pin trong **hốc dưới sàn**. Sáng ra nó biến mất.*
>
> *(trang cuối)* *Đêm 4 — ▢▢:▢▢. Đêm nay nó sẽ đến muộn hơn. Nó tới lúc nào, em sẽ ghi vào đây.*
> *Lần này em sẽ không chỉ ngồi nghe.*

Trang cuối để **trống giờ** theo đúng mẫu của ba đêm trước. Ô trống đó chính là câu hỏi của puzzle: đêm Theo biến mất, nó tới lúc mấy giờ? Nhật ký không ghi con số nào.

**Hai chiếc đồng hồ là hai nửa của một giờ.** Đồng hồ đeo tay còn số giờ, mất số phút. Đồng hồ bên kia còn kim dài, mất kim ngắn. Mặt đồng hồ (cả hai phía, cùng một mẫu) có vòng số phút nhỏ màu đỏ 5, 10, … 60 như đồng hồ trường học, và kim dài chạm tới vạch, nên kim còn lại đọc được là kim phút. Chiếc nào được tìm thấy sau thì người chơi nhận ra nó khớp với chiếc kia ("Nó cũng đã dừng, như…"). Đó là quan sát, không phải đáp án.

**Nguồn của các chip deduction:**

| Chip | Nguồn |
|---|---|
| bỏ nhà đi | C1 |
| nói vào micro | C3 + C6 ("micro") |
| tắt đèn | Công tắc đèn (hành động người chơi đã làm) |
| chui xuống hốc sàn · hốc dưới sàn | C3 |
| cửa phòng · cánh cửa phòng | C3 |
| bàn radio · tiếng radio | C6 |
| ánh sáng | C6 ("đèn bàn") |
| bức tường có vạch khắc | C5 |

**Những gì card và nhật ký không bao giờ ghi:** "3:17", "17 phút", một cột tần số, "tần số trùng với giờ", "Theo đã nói vào micro", "Theo trốn ở bức tường", "Theo còn sống", "nó bị thu hút bởi âm thanh". Đó là những điều người chơi phải tự nghĩ ra.

---

## E. Player Knowledge

Có 4 tầng, và mỗi tầng có một chủ sở hữu khác nhau:

| Tầng | Ai sở hữu | Có hiển thị? | Ví dụ |
|---|---|---|---|
| **World Fact** | Tác giả | Không bao giờ | Theo nói vào micro lúc 3:17, bị kéo sang phía bên kia qua bức tường, đang trốn ở đó. Con quái đi theo âm thanh radio. |
| **Observation** | Game (đánh dấu ẩn) | Không | Người chơi đã xem C4. Người chơi đã thử 2.34. Người chơi đã tắt đèn 3 lần. Dùng cho hint và thống kê. |
| **Clue** | Game (Case File) | Có, trung tính | "Kim dài dừng qua số 3 hai vạch nhỏ." |
| **Player Knowledge** | **Đầu người chơi** | Không, game không lưu | "Đồng hồ tắt đúng lúc nó tới, tức 3 giờ mấy phút." |
| **Deduction** | Người chơi nộp, game kiểm tra | Có, sau khi đúng | "Theo đã nói vào micro…" |

Điểm then chốt: **Player Knowledge chỉ đi vào game qua hai cửa là bánh xe radio và các ô deduction.** Game không bao giờ tự động sinh ra một dòng "Bạn nhận ra rằng…".

Luồng suy luận của puzzle chính:

```text
WORLD FACT        Tín hiệu đêm Theo biến mất đến lúc 3:17, ở tần số 3.17
                          │
OBSERVATION       Radio (đang ở 2.58) → giọng đàn bà gọi "Theo…"
CLUE              C3 đêm 3: 02:58, "gọi tên em bằng giọng của mẹ"
PLAYER            "2.58 ↔ 02:58? Radio phát lại đêm đó?"              (giả thuyết 1)
VERIFY            Thử tần số của một đêm khác (2.34 hoặc 1.52) → khớp với nhật ký
                          │
CLUE              C3 "đồng hồ đeo tay tắt ngấm lúc nó tới" + C2 03:▯▯
PLAYER            "Đêm đó nó tới lúc 3 giờ mấy"                        (giả thuyết 2)
VERIFY            Thử 3.00 → chỉ có rè → "thiếu số phút"
                          │
CLUE (bên kia)    C4 kim dài qua số 3 hai vạch
PLAYER            "Kim dài là kim phút → 17 → 3.17"                    (giả thuyết 3)
VERIFY            Radio 3.17 → giọng Theo
```

---

## F. Deduction

Mở trong Case File **sau khi đã liên lạc được bằng radio**:

> Đêm đó, Theo đã **[ A ]** và bị kéo sang phía bên kia.
> Giờ em đang trốn ở **[ C ]**.
> Thứ đang săn em tìm đến **[ D ]**.

**Liên lạc lần đầu ở 3.17** là một đoạn hội thoại ngắn (có phụ đề), cũng là bằng chứng cho slot C và D. Âm thanh đi qua được giữa hai phía (luật 4), nên Theo nghe được bạn nói:

> **Theo:** *…chị? …chị nghe được em hả?…*
> **Bạn:** Theo? Em đang ở đâu?
> **Theo:** *Em vẫn ở đây. Trong phòng.*
> *(Bạn nhìn quanh. Căn phòng trống không.)*
> **Theo:** *…nhưng không phải phòng của chị. Ở đây tối lắm. Mỗi lần bên chị tối đi, bên này sáng lên một chút… em đếm từng lần. Em vẫn ở chỗ em đếm.*
> **Bạn:** Chị phải làm sao để tìm em?
> **Theo:** *…nó đang tới… tắt—* (mất tín hiệu)
> *Bạn nghĩ: "Không phải phòng của chị"… Căn phòng mình thấy mỗi khi đèn tắt?*

Lời của Theo không được chứa các chữ "khắc", "vạch", "tường", "micro", "radio". Chỉ lời của Theo được ghi vào nhật ký radio.

**Nguyên tắc chung:** mỗi đáp án đúng cần ít nhất 2 bằng chứng. Không clue nào được tự nói ra đáp án.

### Slot A

```text
Bằng chứng cần có:
1. C3: "Radio của bố có micro. Em vẫn chưa dám bấm nút."
2. C3: "Lần này em sẽ không chỉ ngồi nghe."
3. C6 (khoảnh khắc bị giữ nguyên ở phía bên kia): micro rơi, nút bấm nói bị
   quấn băng keo, dây kéo căng về phía bức tường.
4. Trải nghiệm của chính người chơi: đã tắt đèn và nghe radio nhiều lần mà không bị kéo đi.

Đáp án đúng: nói vào micro
Đáp án sai nhưng hợp lý, và lý do bị bác bỏ:
- tắt đèn: người chơi đã tắt đèn nhiều lần mà vẫn ở đây.
- chui xuống hốc sàn: hốc bên kia "chỉ rộng bằng một cuốn sổ", đang trống.
- bỏ nhà đi: giọng Theo trên radio nói "em vẫn ở trong phòng".
```

### Slot C

```text
Bằng chứng cần có:
1. Lời Theo: "mỗi lần bên chị tối đi… em đếm từng lần… em vẫn ở chỗ em đếm"
2. C5: số vạch tăng dần, card ghi lại mỗi lần sang.
3. Kiểm chứng bằng hành động: tắt đèn N lần thì có thêm đúng N vạch (xem luật đếm vạch ở mục I).
4. C6: dây micro kéo căng về phía bức tường.

Khoảnh khắc cần đạt: "Mấy vạch đó đang đếm số lần MÌNH sang."

Đáp án đúng: bức tường có vạch khắc
Đáp án sai nhưng hợp lý, và lý do bị bác bỏ:
- hốc dưới sàn: nhìn thấy được, trống, quá nhỏ.
- bàn radio: đó là chỗ con quái cào, không phải chỗ trốn.
- cửa phòng: không mở được, phía sau có tiếng thứ gì đó di chuyển.
```

### Slot D

```text
Bằng chứng cần có:
1. C3 đêm 2: vặn to radio thì sáng ra có vết cào. Chỉ đêm đó có vết cào.
2. C6: radio bị cào nát, đèn bàn ngay bên cạnh không bị động đến.
3. Hành động của người chơi (bắt buộc): bật radio ở 3.17 thì ngay sau đó có vết
   cào mới quanh radio, và một cái bóng đứng ở bàn.
4. Trải nghiệm của người chơi: đã soi đèn pin ở phía bên kia nhiều phút mà không có gì tìm đến.

Đáp án đúng: tiếng radio
Đáp án sai nhưng hợp lý, và lý do bị bác bỏ:
- ánh sáng: đèn bàn nguyên vẹn, đèn pin không thu hút gì.
  Chữ "tắt—" của Theo cũng có thể là "tắt radio".
- cánh cửa phòng: vết cào ở cửa chỉ xuất hiện sau đêm vặn to radio. Đó là đường nó
  đi tới chỗ phát ra âm thanh, không phải thứ nó tìm. Vết cào mới cũng xuất hiện ở
  bàn, không phải ở cửa.
```

**Slot D là cái bẫy có chủ đích.** Thể loại kinh dị dạy người chơi rằng "quái vật đi theo ánh sáng". Bằng chứng trong game đi ngược lại quy ước đó, và người chơi tự xác nhận được bằng chính hành động của mình.

**Phản hồi khi nộp:**
- Đúng hết: màn hình tối lại, radio tự rè lên, dẫn sang choice.
- Sai: *"Câu chuyện này chưa khớp với bằng chứng."*
- Từ lần nộp sai thứ 2 trở đi, nếu chỉ sai 1 chỗ thì hiện: *"Gần đúng. Có một chi tiết chưa khớp."*
- Không có hình phạt. Có 4 × 4 × 3 = 48 tổ hợp. Mức độ brute-force cần đo khi playtest (mục P).

**Hint:** xem mục L.

---

## G. Puzzle Options

### P1 — "Tần số của đêm đó"
- **Player thấy:** radio có 3 bánh xe `_._ _ MHz`, đang để ở 2.58 và phát ra giọng mẹ. Một cuốn nhật ký ghi giờ và hiện tượng của từng đêm, nhưng không ghi tần số. Đồng hồ đeo tay `03:▯▯`. Đồng hồ bên kia chỉ còn kim dài.
- **Player biết:** Theo nghe thấy "thứ gì đó" trên radio vào nhiều đêm, và đêm cuối em định "không chỉ ngồi nghe".
- **Player chưa biết:** tần số tuân theo quy luật gì, và tín hiệu đêm đó đến lúc mấy giờ mấy phút.
- **Clue:** radio (đang ở 2.58 + tiếng vọng), C3 (giờ của từng đêm, câu "đồng hồ tắt ngấm lúc nó tới"), C2 (số giờ, ở phía này), C4 (số phút, ở phía bên kia).
- **Kết hợp:** tiếng vọng + nhật ký cho ra quy luật. "Đồng hồ tắt ngấm" + `03:▯▯` cho ra 3 giờ. Kim dài qua số 3 hai vạch cho ra 17 phút. Kết quả: **3.17**.
- **Vì sao tự suy ra được:** mỗi bước đều kiểm chứng được bằng radio. Tần số cũ trả về đúng hiện tượng ghi trong nhật ký. Thử 3.00 chỉ có rè, cho người chơi biết mình đang thiếu số phút.
- **Game có nói thẳng không:** không. Con số "3:17" không xuất hiện ở bất cứ đâu trước khi người chơi đọc được kim phút ở phía bên kia.
- **Hint:** 3 tầng, chọn theo mảnh thông tin người chơi còn thiếu (mục L).

### P2 — "Chỉnh lại đồng hồ"
- Người chơi chỉnh đồng hồ treo tường phía này cho khớp với khoảnh khắc đồng hồ phía bên kia dừng lại, và cánh cửa giữa hai phía mở ra.
- Vẫn cần C2 và C4 như P1, **nhưng không có quy luật nào để suy ra lý do phải chỉnh đồng hồ.** Người chơi sẽ làm vì thử mò ("thử cho khớp xem sao"), không phải vì hiểu. Aha yếu hơn.
- **Đánh giá:** loại.

### P3 — "Gửi gì cho Theo?"
- Người chơi đặt đồ vật vào hốc sàn ở phía này thì đồ vật xuất hiện ở phía bên kia. Phải suy ra Theo cần gì (bóng tối, chiếc đèn pin đã biến mất trong nhật ký).
- Aha tốt ở chỗ phát hiện ra "hốc sàn là đường nối". Nhưng nếu làm thành puzzle chính thì cần nhiều item để chọn, nghĩa là inventory quay lại và dễ thành fetch quest.
- **Đánh giá:** không dùng làm puzzle chính. Giữ lại làm hành động nhỏ trong nhánh B của choice.

---

## H. Recommended Puzzle: P1

Lý do chọn P1:
- Đây là puzzle duy nhất cần **cả hai thế giới cho cùng một con số.** Số giờ nằm ở phía này, số phút nằm ở phía bên kia. Không phía nào tự đủ.
- Nó có **hai aha riêng biệt**: phát hiện quy luật qua tiếng vọng, và ghép hai chiếc đồng hồ.
- Đáp án được kiểm chứng bằng hành động có kết quả kể chuyện: nghe thấy giọng Theo.

### Phát hiện quy luật tần số ↔ giờ (LEAP 1)

**Phương án đã chọn:** radio đang ở 2.58. Bật lên thì nghe giọng mẹ gọi "Theo…". Nhật ký đêm 3 ghi 02:58 cùng với *"nó gọi tên em, bằng giọng của mẹ"*. Hai mối liên hệ khớp nhau, một về **nội dung** (giọng mẹ), một về **con số** (2.58 ↔ 02:58). Từ đó người chơi tự đặt giả thuyết, rồi thử tần số của một đêm khác để kiểm chứng.

Lý do chọn:
- Không thêm clue nào.
- Bằng chứng đến *trước* giả thuyết: người chơi nghe giọng mẹ khi chưa hiểu gì, đến lúc đọc nhật ký mới nối lại.
- Việc kiểm chứng bằng âm thanh cũng là một nhịp kinh dị.

**Các phương án đã loại, giữ làm dự phòng cho playtest:**
- *Vạch bút chì trên mặt số radio* ghi "1", "2", "3" ở vị trí gần đúng. Phải thêm 1 clue, và người chơi có thể đọc vị trí gần đúng thành con số chính xác. **Đây là phương án dự phòng nếu LEAP 1 thất bại khi playtest.**
- *Giấy dán trên radio* ghi dãy tần số. Thực chất vẫn là "hai cột số" bị tách ra, người chơi chỉ đọc chứ không suy luận.

### Phản hồi của radio

Người chơi có thể thử các tần số **theo bất kỳ thứ tự nào**. Không có thứ tự bắt buộc giữa 2.58, 2.34 và 1.52.

| Tần số | Âm thanh | Khớp với |
|---|---|---|
| 1.52 | Rè, rồi ba tiếng gõ | Nhật ký đêm 1 |
| 2.34 | Tiếng thở | Nhật ký đêm 2 |
| 2.58 | Giọng đàn bà gọi "Theo…". Đây là tần số radio đang để khi bắt đầu game. | Nhật ký đêm 3 |
| 3.17 | Liên lạc với Theo (mục F). Sau lần liên lạc đầu, chỉ còn rè cho tới khi nộp deduction đúng. | — |
| Mọi tần số khác, **kể cả 3.00** | Chỉ có rè | — |

- Không có phản hồi kiểu "gần đúng rồi".
- Tiếng vọng ở các tần số cũ không gọi con quái tới (luật 7, mục I). Chỉ 3.17 mới gây ra vết cào mới.

### Mô phỏng P1 (một thứ tự hợp lệ, không bắt buộc)

```text
OBSERVATION   Bật radio (đang ở 2.58): rè, rồi giọng đàn bà gọi "Theo…". Xoay đi chỗ khác: chỉ còn rè.
OBSERVATION   Nhật ký đêm 3: "02:58. Nó gọi tên em. Bằng giọng của mẹ."
HYPOTHESIS 1  "2.58… 02:58. Radio đang phát lại đêm 3?"
ACTION        Dò 2.34 (hoặc 1.52)
RESULT        Tiếng thở (hoặc ba tiếng gõ), khớp với nhật ký
NEW INFO      "Tần số ứng với giờ của đêm đó."

HYPOTHESIS 2  "Đồng hồ tắt ngấm lúc nó tới. Đồng hồ đeo tay hiện 03:▯▯. Vậy đêm đó là 3 giờ mấy."
ACTION        Dò 3.00
RESULT        Chỉ có rè
NEW INFO      "Cần số phút. Phía này không có."

HYPOTHESIS 3  "Đồng hồ bên kia cũng đứng yên. Kim dài qua số 3 hai vạch. Kim dài là kim phút, vậy là 17."
ACTION        Dò 3.17
RESULT        Giọng Theo
```

### P1 có cần World Flip không?

**Có.** Nếu không bao giờ tắt đèn, người chơi vẫn có được quy luật (radio + nhật ký) và số giờ (đồng hồ đeo tay), nhưng **số phút chỉ có ở đồng hồ bên kia.** Muốn bỏ qua phía bên kia thì phải dò từng giá trị từ 3.00 đến 3.59, khoảng 60 lần.

Điều kiện: đoạn glimpse lúc đèn chớp **không đặt đồng hồ ở giữa khung hình, và không đủ rõ để đọc được kim**.

**Có thể đoán mò không?** Người chơi có cả `03:▯▯` lẫn số 17 có thể nhập 3.17 trước khi chắc chắn về quy luật. Chấp nhận điều này, vì cú đoán đó vẫn cần ghép thông tin từ cả hai thế giới.

---

## I. Normal ↔ Other Side Mechanic

### 7 luật của phía bên kia

Người chơi học dần các luật này và không có tutorial nào nói ra:

1. **Tắt đèn phòng thì sang phía bên kia, bật lại thì về.** Công tắc nằm ở cùng một chỗ ở cả hai phía.
2. **Đồ vật ở phía bên kia bị giữ nguyên ở khoảnh khắc đêm đó. Sinh vật thì không.** (Đồng hồ đứng yên, micro đang rơi, nhưng Theo vẫn khắc thêm vạch.)
3. **Cùng một vị trí thì là cùng một chỗ.** Mọi điểm trong phòng đều có bản sao ở phía kia.
4. **Âm thanh đi qua được, ánh sáng thì không.** (Theo nghe được radio, con quái cũng nghe được. Đèn phía này không soi sáng được phía bên kia.)
5. **Hốc dưới sàn nối hai phía.** Đồ đặt vào đó sẽ sang phía bên kia.
6. **Mỗi lần phía này tối đi, Theo khắc thêm một vạch.** Xem luật đếm vạch bên dưới.
7. **Chỉ tần số của đêm Theo biến mất (3.17) là tín hiệu đang sống.** Các tần số cũ chỉ là tiếng vọng. Chúng không gọi con quái tới và không tạo ra vết cào mới.

### Luật đếm vạch

- **Số vạch = 3 (ba lần đèn chớp) + số lần người chơi tắt đèn.** Bật đèn không được tính.
- **Lần đầu người chơi nhìn thấy bức tường luôn có 4 vạch.** Nếu người chơi tự tắt đèn trước khi đèn chớp được kích hoạt, chuỗi 3 lần chớp sẽ chạy ngay trước khi phòng tối hẳn. Vì vậy lần tắt đèn đầu tiên luôn cho ra 3 + 1 = 4.
- **Mỗi lần người chơi tắt đèn, số vạch tăng đúng 1.** Không có giới hạn, không có gì khác làm thay đổi số vạch.
- Glimpse trong lúc đèn chớp không cho đếm được số vạch.
- C5 ghi lại số vạch mỗi lần sang, không ghi lý do số vạch tăng.
- **Người chơi kiểm chứng được:** tắt, bật, rồi tắt đèn lại thì thấy thêm đúng 2 vạch.
- Ý nghĩa (World Fact, không hiển thị): Theo đang đếm những lần phía bên kia "sáng lên một chút", tức là **những lần người chơi sang**.
- Đây là một trong những aha mạnh nhất của chapter: *"Mấy vạch đó đang đếm MÌNH."*

### Các tương tác giữa hai thế giới

| Ví dụ | Phía này | Phía bên kia | Người chơi phải nghĩ |
|---|---|---|---|
| **Đồng hồ** | Đồng hồ treo tường chạy. Đồng hồ đeo tay `03:▯▯`. | Kim dài qua số 3 hai vạch | "Giờ ở bên này, phút ở bên kia." |
| **Sàn nhà** | Tấm thảm, trông bình thường | Ván sàn bị cạy | "Khoan, chỗ này bên kia có gì đó, bên này chắc cũng vậy." |
| **Micro** | Móc gọn trên giá | Rơi dưới sàn, nút bấm bị kẹt, dây kéo về phía tường | "Đêm đó Theo đã bấm nút nói." |
| **Bức tường** (nhân quả ngược chiều) | Bạn tắt đèn | Thêm một vạch | "Có ai đó ở đó, **ngay lúc này**, và họ đang đếm mình." |
| **Bàn radio** (nhân quả ngược chiều) | Bạn dò 3.17 | Xuất hiện vết cào mới | "Mình vừa gọi nó tới." |

**Thứ tự dự kiến, không bắt buộc:** Sàn → Đồng hồ → Bức tường → Micro → Bàn. Mỗi ví dụ dạy thêm một luật và độ khó tăng dần. Người chơi có thể gặp các ví dụ theo thứ tự khác mà vẫn giải được.

---

## J. Gameplay Flow (khoảng 15–20 phút)

### J.1 Beat outline

Đây là **thứ tự dự kiến, không bắt buộc**. Beat 1, 4 và 5 có thể xen kẽ nhau. Tần số có thể thử theo bất kỳ thứ tự nào. Chỉ có ba điểm bị khóa cứng:
- Deduction chỉ mở sau khi đã liên lạc được ở 3.17.
- Choice chỉ mở sau khi nộp deduction đúng.
- Ending chỉ xảy ra sau khi đã chọn.

```text
[0:00] TITLE
  "Nên đeo tai nghe."  →  nhấn để bắt đầu (mở khóa audio)

[0:30] OPENING CINEMATIC — nền đen (mục R)
  BA ĐÊM TRƯỚC / THEO BIẾN MẤT.         (tiếng thịch)
  "Em trai bạn. 12 tuổi."
  "Cảnh sát nghĩ em bỏ nhà đi. Bạn thì không."
  "Đêm qua, mẹ tìm thấy đồng hồ đeo tay của em dưới gầm giường.
   Nó dừng lúc 3 giờ. Hai số phút đã vỡ."
  "Mẹ đã ngủ ở tầng dưới, sau ba đêm thức trắng."
  "Đêm nay, bạn bước vào phòng của Theo để tìm hiểu chuyện gì đã xảy ra."
  → MỤC TIÊU: Kiểm tra radio.   (radio đang bật, sáng, rè khẽ)

BEAT 1 — PHÍA NÀY
  Tờ tìm người     → C1
  Đồng hồ đeo tay  → C2 (03:▯▯)
  Radio            → nghe: rè, im lặng, rồi giọng đàn bà gọi "Theo…" (tiếng vọng ở 2.58).
                     Xoay đi chỗ khác: chỉ còn rè.
  Micro            → móc gọn trên giá. "Bạn không dám bấm."
  Đồng hồ treo tường → "11:47. Vẫn chạy."   (để lát sau có cái so sánh)
  Poster, thảm     → thảm lật được bất cứ lúc nào, không bị chặn

BEAT 2 — ĐÈN CHỚP
  Kích hoạt sau 3 lần xem, hoặc ngay khi người chơi tự tắt đèn lần đầu (xem luật đếm vạch).
  Đèn chớp 3 lần. Trong khoảng 0.4 giây thấy tường có vạch (không đếm được),
  đồng hồ nằm ở rìa khung và bị mờ. Một tiếng "thịch". Công tắc hơi sáng lên.

BEAT 3 — FLIP LẦN ĐẦU                                   ★ AHA 1
  Tắt đèn → tối đen → vùng sáng đèn pin. Căn phòng mục nát, có dây leo, im lặng.

BEAT 4 — PHÍA BÊN KIA
  Tường  → C5 (4 vạch)
  Đồng hồ → C4 (kim dài qua số 3 hai vạch)
  Sàn    → ván bị cạy, hốc nhỏ và trống
  Bàn    → C6 (vết cào, đèn bàn nguyên vẹn, micro)
  Cửa    → không mở được, có tiếng thứ gì đó di chuyển

BEAT 5 — NHẬT KÝ (C3)                                   ★ AHA 2
  Lật thảm → ván lỏng → nhật ký.
  LEAP 1: giọng mẹ ↔ đêm 3 → thử tần số của một đêm khác → khớp.  ★ AHA 3

BEAT 6 — PUZZLE RADIO                                   ★ AHA 4
  03:▯▯ → thử 3.00 → rè → thiếu phút → đồng hồ bên kia → 3.17 → giọng Theo (mục F)
  Hệ quả: vết cào mới quanh radio (C6 ghi thêm), một cái bóng đứng ở bàn,
          và một vết xước mờ trên mép bàn thật ở phía này.
  Objective: "Theo còn sống."  → mở tab Kết luận

BEAT 7 — DEDUCTION                                      ★ AHA 5 (đếm vạch), AHA 6 (radio)
  Bật tắt đèn để kiểm chứng số vạch. Điền A / C / D.

BEAT 8 — CHOICE (mục K)
  Radio tự rè lên ở 3.17, lời Theo trước lúc chọn.
  Hai điều khiển trên radio:  [ VẶN TO HẾT CỠ ]   [ TẮT RADIO ]

BEAT 9 — HỆ QUẢ (có gameplay, mục K)

ENDING
  Đồng hồ treo tường phía này điểm... rồi đứng lại.
  "HẾT CHƯƠNG 0"  + tóm tắt
```

### J.2 Paper playthrough

> **Đây là một representative successful playthrough, không phải flow bắt buộc.** Người chơi có thể xem vật thể theo thứ tự khác, thử những tần số khác, sang lại phía bên kia nhiều lần, và nộp deduction bất cứ lúc nào sau khi nó đã mở. Miễn là game vẫn đi tới cùng một trạng thái hợp lệ.

Ký hiệu: 🟢 người chơi chắc chắn tự suy ra được · 🟡 có nguy cơ kẹt · 🔴 game nói hộ hoặc logic chưa đủ (hiện không còn bước 🔴 nào).

| # | Player thấy | Player nghĩ | Player làm | Game phản hồi | |
|---|---|---|---|---|---|
| 1 | Màn đen, 4 dòng intro | "Em ấy đi đâu?" | — | Căn phòng áp mái hiện ra, đèn vàng, tiếng tích tắc | 🟢 |
| 2 | Chồng tờ tìm người trên bàn | "Cảnh sát nghĩ em bỏ nhà đi…" | Xem | C1 | 🟢 |
| 3 | Radio, bánh xe ở 2.58 | "Radio của Theo." | Bật lên | Tiếng rè… rồi giọng đàn bà thì thầm "Theo…" | 🟢 |
| 4 | — | "Giọng… mẹ? Radio bắt được cái gì vậy?" | Xoay bánh xe | Chỉ còn rè. Xoay về 2.58 lại nghe giọng đó. | 🟢 |
| 5 | Đồng hồ đeo tay `03:▯▯` + giấy của mẹ | "Nó dừng lúc 3 giờ mấy." | Xem | C2 | 🟢 |
| 6 | Đồng hồ treo tường | "11:47, vẫn chạy." | Xem | "Vẫn chạy." | 🟢 |
| 7 | Poster, thảm, micro | — | Xem | Không có gì lạ. Micro: "Bạn không dám bấm." | 🟢 |
| 8 | Đèn trần chớp 3 lần, trong một khoảnh khắc thấy căn phòng mục nát | "Cái gì vừa hiện ra?!" | — | Tiếng "thịch". Công tắc hơi sáng lên. | 🟡 |
| 9 | Công tắc | "Nếu mình tự tắt đèn thì sao?" | Tắt đèn | Tối đen, rồi vùng sáng đèn pin. Căn phòng mục nát, có dây leo, im lặng. | 🟡 |
| 10 | Bức tường cạnh giường | "Vạch đếm… 4 vạch. Ai đếm?" | Soi | C5 "Lần 1: 4 vạch" | 🟢 |
| 11 | Đồng hồ: kim ngắn gãy, kim dài qua số 3 | "Chỉ số 3… à không, kim dài là kim phút." | Xem | C4 | 🟡 |
| 12 | Sàn: ván bị cạy, hốc nhỏ và trống | "Bên kia bị cạy. Bên này thì sao?" | Xem | "Hốc chỉ rộng bằng một cuốn sổ." | 🟢 |
| 13 | Bàn: vết cào quanh radio, đèn bàn nguyên, micro rơi, dây kéo về phía tường | "Cái gì cào radio? Ai đánh rơi micro?" | Xem | C6 | 🟢 |
| 14 | Cửa | — | Click | "Bạn không muốn mở cánh cửa đó." Tiếng thứ gì đó di chuyển. | 🟢 |
| 15 | — | "Về bên kia xem sàn." | Bật đèn | Trở về phòng sáng | 🟢 |
| 16 | Thảm | — | Lật thảm lên | Tấm ván lỏng, bên dưới là nhật ký. C3. | 🟢 |
| 17 | Nhật ký | "Đêm 3… 02:58… 'gọi tên em bằng giọng của mẹ'… giọng mình vừa nghe! Radio đang để ở 2.58…" | Đọc | — | 🟡 |
| 18 | — | "Nếu 2.58 là đêm 3… thì đêm 2 là 2.34?" | Dò 2.34 | Tiếng thở | 🟢 |
| 19 | — | "Đúng rồi. Còn đêm 1?" | Dò 1.52 | Tiếng rè, rồi ba tiếng gõ | 🟢 |
| 20 | — | "Đêm em biến mất… đồng hồ tắt ngấm lúc nó tới… 03:▯▯." | Dò 3.00 | Chỉ có rè | 🟢 |
| 21 | — | "Thiếu số phút. Đồng hồ bên kia cũng đứng yên…" | Tắt đèn | Sang phía bên kia. C5: "Lần 2: 5 vạch" | 🟡 |
| 22 | Kim dài qua số 3 hai vạch | "15 + 2… 17. Vậy là 3:17." | — | — | 🟡 |
| 23 | Để ý số vạch | "Lúc nãy là 4, giờ là 5?" | — | — | 🟢 |
| 24 | — | — | Bật đèn, dò 3.17 | Tiếng rè vỡ ra thành giọng Theo (mục F), rồi *"tắt—"* và mất tín hiệu | 🟢 |
| 25 | Objective "Theo còn sống.", tab Kết luận mở ra | "Em vẫn ở trong phòng này…" | — | — | 🟢 |
| 26 | — | "'Mỗi lần bên chị tối đi… em đếm'… mấy vạch đó đang đếm MÌNH? 4 = 3 lần chớp + 1 lần mình tắt?" | Tắt, bật, tắt | 5 → 7 vạch | 🟢 |
| 27 | Bàn phía bên kia: vết cào mới, một cái bóng đứng cạnh | "Mình vừa bật radio… và nó tới." | Soi | C6 ghi thêm | 🟢 |
| 28 | Bật đèn về: trên mép bàn thật có một vết xước mờ | "Nó… sang được bên này?" | Xem | — | 🟢 |
| 29 | Slot A | "Tắt đèn? Mình tắt mấy lần rồi có sao đâu. 'Chưa dám bấm nút'… 'không chỉ ngồi nghe'… nút bị quấn băng keo… Em đã nói vào micro." | Điền: nói vào micro | — | 🟢 |
| 30 | Slot C | "Chỗ em đếm là bức tường." | Điền | — | 🟢 |
| 31 | Slot D | "Theo nói 'tắt—'… tắt đèn? Nhưng đèn bàn nguyên vẹn, đèn pin mình soi mãi không sao… radio bị cào, và cào thêm ngay sau khi mình bật." | Điền: tiếng radio | — | 🟡 |
| 32 | — | — | Nộp | Màn hình tối lại. Radio tự rè lên ở 3.17. | 🟢 |
| 33 | Lời Theo trước lúc chọn (mục K) + hai điều khiển trên radio | "Vặn to thì nó bỏ Theo mà đi về radio… nhưng đêm 2 vặn to xong, nó cào mặt ngoài cửa. Mẹ đang ngủ dưới nhà. Còn tắt thì… Theo đã trụ được 3 đêm." | Chọn | — | 🟡 |
| 34A | Vặn to hết cỡ. Sang phía bên kia: cái bóng bò về phía bàn. | "Chờ nó tới bàn đã…" | Click vào tường khi nó đã ở cạnh bàn | Bàn tay Theo nắm lấy tay bạn. Đèn bật sáng. Theo ở đây. Mặt ngoài cửa có vết cào mới, radio hỏng, đồng hồ dừng. | 🟢 |
| 34B | Tắt radio. Im lặng. Cái bóng đi ra phía cửa. | "Em ở trong bóng tối… nhật ký: đèn pin để trong hốc thì biến mất." | Bật đèn, đặt đèn pin vào hốc sàn | Đèn pin biến mất | 🟡 |
| 35B | Tắt đèn: tối đen hoàn toàn, rồi một vùng sáng bật lên ở bức tường | "Em nhận được rồi." | Nhìn | Dòng khắc mới: "EM ỔN. ĐÊM MAI. CÙNG GIỜ." | 🟢 |
| 36 | Đồng hồ treo tường điểm… rồi đứng lại | — | — | "HẾT CHƯƠNG 0" + tóm tắt | 🟢 |

---

## K. Meaningful Choice

**Đánh đổi:** *đưa Theo về ngay nhưng để con quái đi theo sang phía này* **hoặc** *giữ phía này an toàn nhưng để Theo ở lại thêm một đêm.* Cả hai lựa chọn đều mất một thứ gì đó. Tài liệu này **không** xác định lựa chọn nào tốt hơn.

**Lời Theo trước lúc chọn** (radio tự rè lên ở 3.17 sau khi nộp deduction đúng):

> *"Em ở ngay chỗ lúc trước em bị kéo qua. Nó đứng giữa phòng, chắn đường. Nếu chị vặn radio thật to… nó sẽ bỏ em, đi về phía tiếng động. Em sẽ chạy được qua. Nhưng đêm em vặn to, sáng ra cửa phòng có vết cào. Ở phía bên ngoài. Mẹ đang ngủ dưới nhà đó chị. Còn nếu chị tắt đi… nó mất dấu. Em trốn thêm được một đêm nữa. Nhưng bên này tối lắm. Chị có thấy cái hốc dưới sàn không? Bên này nó cũng có. Hôm trước em để đèn pin vào đó, sáng ra nó biến mất. Đồ bỏ vào đó… sang được bên này. Chị định làm gì?"*

Câu về cái hốc là lý do cho hành động ở nhánh B: người chơi không "đặt đèn pin vào hốc" vì game bảo, mà vì Theo vừa nói hốc sàn nối hai phía và bên đó tối. Trước lúc chọn B, hốc sàn chỉ chứa nhật ký; hành động "gửi ánh sáng cho Theo" chỉ xuất hiện sau khi chọn B.

Deduction đã giải xong nên lời này không làm lộ đáp án nào; nó đặt lợi ích và cái giá của cả hai lựa chọn vào lời của Theo, để người chơi lần đầu vẫn hiểu mình đang đánh đổi gì. Sau câu hỏi là một khoảng im lặng, rồi mới dùng được hai điều khiển trên radio: **núm âm lượng (vặn to hết cỡ)** và **công tắc nguồn (tắt radio)**.

### Những gì người chơi đã biết trước lúc chọn

**A — Vặn to hết cỡ**

| | Nội dung | Bằng chứng (đều có trước lúc chọn) |
|---|---|---|
| Lợi ích | Tiếng radio kéo con quái về phía bàn radio, rời khỏi bức tường. Theo có cơ hội được kéo qua ở chỗ bức tường. | Slot D (nó đi theo tiếng radio) + slot C, dây micro, lời Theo "chỗ em bị kéo qua" (bức tường là lối đi) |
| Cái giá | Con quái có thể đi theo tiếng radio sang tận phía này, vào nhà. Mẹ đang ngủ ở tầng dưới. | C3 đêm 2: vặn to xong thì có vết cào ở **mặt ngoài** cửa phòng + intro: "Mẹ đã ngủ ở tầng dưới" + vết xước mờ trên mép bàn thật sau khi dò 3.17 |

**B — Tắt radio**

| | Nội dung | Bằng chứng (đều có trước lúc chọn) |
|---|---|---|
| Lợi ích | Con quái mất dấu, không đi theo tín hiệu sang phía này. Đêm mai vẫn liên lạc lại được. | Slot D (im lặng thì nó mất dấu) + C3 (tín hiệu đến ba đêm liên tiếp) |
| Cái giá | Theo bị kẹt ở phía bên kia thêm một đêm, trong bóng tối. | Lời Theo "tối lắm" + C5 (số vạch cho thấy em đã trụ được nhờ trốn) |
| Cách giảm bớt cái giá | Sau khi chọn, người chơi có thể gửi đèn pin cho Theo qua hốc sàn, đổi lại mất đèn pin. | C3: "Em để đèn pin trong hốc dưới sàn. Sáng ra nó biến mất." |

Một số hệ quả phụ chỉ lộ ra sau khi chọn: ở nhánh A, radio hỏng và đồng hồ dừng. Ở nhánh B, người chơi mất đèn pin nếu quyết định gửi nó đi. Đây là hệ quả phụ, hoặc là kết quả của một quyết định riêng sau đó. Cái giá chính của mỗi lựa chọn đều đã có bằng chứng từ trước.

> **Playtest criterion:** xác định xem những người chơi đã hiểu bằng chứng có cảm nhận được một đánh đổi thật hay không, thay vì mặc định chọn giải cứu.

### Hệ quả

| | **A — Vặn to hết cỡ (dùng làm mồi)** | **B — Tắt radio** |
|---|---|---|
| Gameplay ngay sau đó | Sang phía bên kia. Soi đèn pin và nghe tiếng để theo dõi cái bóng đang bò về phía bàn radio. Nhìn thấy tay Theo thò ra từ khe tường. **Chọn đúng lúc nó đã ở cạnh bàn để click vào tường** rồi kéo Theo qua. Click sớm thì nó quay đầu lại (tiếng tim đập) và bạn phải chờ thêm. Không có chết, không có game over. | Im lặng. Cái bóng mất dấu, đi ra phía cửa. Không còn giọng Theo. Người chơi **phải tự nghĩ ra cách giúp em**: nhớ lại nhật ký ("đèn pin để trong hốc sàn thì biến mất") và đặt đèn pin của mình vào hốc sàn ở phía này. |
| Hệ quả thấy được ngay | Theo trở về. Mặt ngoài cửa phòng có vết cào mới. Bàn radio ở phía này bị cào nát và radio hỏng. Đồng hồ treo tường phía này **dừng lại lúc 3:17**. Theo: *"Nó biết đường sang đây rồi."* | Bạn **mất đèn pin**. Khi sang phía bên kia thì tối đen hoàn toàn, cho đến khi một vùng sáng bật lên ở bức tường: Theo đã nhận được. Dưới ánh đèn hiện ra dòng khắc mới: *"EM ỔN. ĐÊM MAI. CÙNG GIỜ."* Radio vẫn còn nguyên. |
| Cho chapter sau | Theo đã về nhà, nhưng phía này bắt đầu "nhiễm" phía bên kia. Không còn radio. | Theo vẫn ở phía bên kia, nhưng vẫn liên lạc được. Bạn phải khám phá phía bên kia mà không có đèn pin. |

Đây vẫn là **một ending**: cùng một nhịp kết thúc với đồng hồ, màn "Hết Chương 0" và phần tóm tắt, nhưng trạng thái thế giới khác nhau. Chi phí thêm chỉ là 2 hành động ngắn và vài dòng text.

---

## L. Hint System

Nút **"Nghĩ"** là giọng nội tâm của nhân vật. Hint tầng 1 chỉ mở sau khi người chơi kẹt khoảng 2 phút, mỗi tầng tiếp theo mở sau thêm khoảng 60 giây. **Hint được chọn theo mảnh thông tin người chơi còn thiếu**, dựa vào Observation đánh dấu ẩn, chứ không theo một thứ tự cố định.

| Giai đoạn | H1 — Quan sát | H2 — Kết nối | H3 — Suy luận |
|---|---|---|---|
| Tìm ra cơ chế flip | "Đèn vừa chớp. Trong khoảnh khắc đó mình đã thấy gì?" | "Căn phòng chỉ khác đi khi trời tối." | "Nếu mình tự tắt đèn thì sao?" |
| Tìm nhật ký | "Bên kia, sàn nhà có gì đó khác." | "Ván sàn bên kia bị cạy. Cùng chỗ đó ở bên này thì sao?" | "Dưới tấm thảm có thể có gì đó." |
| Radio: chưa thấy quy luật (LEAP 1) | "Lúc nãy radio phát ra cái gì?" | "Nhật ký có nhắc đến giọng của mẹ." | "Radio đang để ở 2.58. Đêm đó là 02:58. Còn những đêm khác thì sao?" |
| Radio: chưa biết số giờ | "Có thứ gì trong phòng đã dừng lại vào đêm đó?" | "Nhật ký nói đồng hồ đeo tay tắt ngấm lúc nó tới." | "Đồng hồ đeo tay còn hiện số giờ." |
| Radio: thiếu số phút | "Đồng hồ đeo tay chỉ còn số giờ. Còn thứ gì khác đã dừng lại?" | "Đồng hồ ở phía bên kia không chạy." | "Soi đồng hồ bên kia. Kim còn lại là kim dài." |
| Radio: có cả hai đồng hồ, chưa ghép | "Hai chiếc đồng hồ đều dừng lúc nó tới. Mỗi chiếc chỉ còn lại một nửa." | "Đồng hồ đeo tay còn số giờ. Kim dài là kim phút." | "Đêm 3 là 02:58, và radio để ở 2.58. Đêm 4 thì sao?" |
| Deduction A | "Đọc lại những trang cuối của nhật ký." | "Ở phía bên kia, micro đang ở trong tình trạng nào?" | "Mình đã tắt đèn bao nhiêu lần rồi? Theo đã làm gì khác mình?" |
| Deduction C | "Nghe lại lời Theo trên radio." | "'Em đếm từng lần.' Ở phía bên kia, chỗ nào có dấu đếm?" | "Số vạch tăng lên mỗi lần mình tắt đèn. Có người đang đếm, ngay lúc này." |
| Deduction D | "So sánh bàn radio bên kia trước và sau khi mình dò 3.17." | "Đèn bàn và radio nằm cạnh nhau. Cái nào bị cào?" | "Theo từng vặn to radio, sáng hôm sau có vết cào. Còn mình vừa bật radio lên..." |
| Nhánh B | "Theo đang ở trong bóng tối." | "Nhật ký: đồ để trong hốc sàn thì biến mất." | "Mình đang cầm thứ gì mà Theo cần?" |

Không tầng hint nào nói ra con số **3.17** hay **17**, không nói "tần số bằng giờ", và không nói thẳng đáp án của slot A, C hoặc D. Số hint đã dùng hiện trong phần tóm tắt cuối game nhưng không bị trừ điểm.

---

## M. UI Flow

```text
Title → Intro → GAME SCREEN ⇄ [Inspect] [Case File] [Radio] [Nghĩ]
                     ⇅ (công tắc)
                PHÍA BÊN KIA (vùng sáng đèn pin)
                     ↓
                  Choice → Hệ quả → Ending
```

| UI | Loại | Ghi chú |
|---|---|---|
| **Hotspot trong scene** | **Gameplay** | Không có nhãn. Khi hover thì hơi sáng lên. Trên mobile, chạm lần đầu để làm nổi bật, chạm lần hai để xem. |
| **Công tắc đèn** | **Gameplay** | Là vật thể trong scene, không phải nút trên UI. Đây là cơ chế chính nên phải nằm *trong thế giới game*. |
| **Vùng sáng đèn pin** (phía bên kia) | **Gameplay** | Đi theo cursor, trên mobile thì kéo bằng ngón tay. Chỉ xem được thứ đang được soi sáng. |
| **Inspect** | **Gameplay** (chỉ với đồng hồ đeo tay, đồng hồ bên kia và nhật ký) | Phóng to ảnh. Không có pan hay rotate. Đồng hồ bên kia phải phóng to đủ để đếm được vạch phút. Các vật thể khác chỉ hiện một dòng mô tả. |
| **Radio (3 bánh xe + nút âm lượng)** | **Gameplay** | Là puzzle, cũng là nơi đưa ra choice. Không có nút "Submit": dò trúng thì âm thanh tự thay đổi. |
| **Case File → Clues** | Nửa gameplay, nửa presentation | Mỗi card có ảnh chụp lại cảnh đã thấy và nhãn **Phía này / Phía bên kia**. Mở được ở cả hai phía. **Không** tự động ghép cặp các clue. |
| **Case File → Kết luận** | **Gameplay** | Câu có ô trống. Kéo hoặc chạm chip để điền. Có nút "Kết luận". |
| **Choice** | **Gameplay** | Chọn bằng hành động trên radio, không có hộp thoại nhiều nút. |
| **Nghĩ (hint)** | Hỗ trợ | Icon nhỏ ở góc, mờ đi khi chưa có hint. |
| Narration box | Presentation | Tối đa 2 dòng, tự ẩn đi. |
| Chuyển cảnh, đèn chớp, dây leo | Presentation | Khóa input trong lúc chạy. |
| Phụ đề giọng Theo | Presentation (cần cho accessibility) | |
| **HUD giờ** | **Bỏ** | Đồng hồ nằm trong scene. Đặt giờ trên HUD là làm lộ đáp án. |
| Ending screen | Presentation | Số clue 6/6, lựa chọn đã đưa ra, số hint đã dùng, thời gian, và 1 dòng teaser khác nhau theo nhánh. |

---

## N. What Makes This Actually a Game?

1. **Có những khoảnh khắc aha mà game không nói ra:**

   | # | Aha | Loại dự kiến |
   |---|---|---|
   | 1 | Tắt đèn là sang phía bên kia | Weak: đây là khám phá, không phải suy luận. Chấp nhận được. |
   | 2 | Cùng vị trí = cùng một chỗ (ván sàn dẫn tới nhật ký) | Weak: nó dạy luật cho các aha sau. |
   | 3 | Giọng mẹ ở 2.58 là đêm 3, tức tần số ↔ giờ | Genuine |
   | 4 | Giờ ở phía này, phút ở phía bên kia | Genuine |
   | 5 | Số vạch đang đếm số lần mình sang | Genuine, một trong những aha mạnh nhất |
   | 6 | Theo đã nói vào micro | Genuine |
   | 7 | Thứ đó tìm đến radio, không phải ánh sáng | Genuine |
   | 8 | Vặn to radio thì nó sẽ vào nhà | Genuine, dẫn vào choice |

2. **Người chơi có thể sai**: dò sai tần số (ví dụ 3.00), điền sai kết luận, click tường sai thời điểm. Sai không bị phạt, nhưng người chơi sẽ biết là mình sai.
3. **Kiến thức của người chơi gate tiến trình, chứ không phải flag.** Không ô nào bị khóa vì "chưa đọc clue X". Người đoán nhanh có thể đi tắt.
4. **Mechanic chính được dùng để suy luận**, không chỉ để trang trí. Nếu bỏ cơ chế flip, P1 chỉ còn giải được bằng cách dò mò khoảng 60 giá trị, còn slot A, C, D và choice thì không giải được.
5. **Choice cần hiểu biết mới chọn được có chủ đích**, và hệ quả của nó hiện ra ngay bằng gameplay.
6. **Hệ quả của hành động quay ngược lại tác động vào điều tra**: bật radio tạo ra bằng chứng mới cho slot D.

---

## O. What Should Be Cut

So với ideas.md:

| Cắt | Lý do |
|---|---|
| Basement, living room | Một phòng ở hai phía là đủ, và tốt hơn. |
| **Cassette** | Nó *nói luôn* đáp án. Thay bằng nhật ký, là thứ người chơi phải tự suy ra quy luật từ đó. |
| Evidence board kiểu nối dây | Có thể brute-force. Thay bằng câu có ô trống. |
| Inventory UI | Chỉ có đèn pin, dùng qua hành động trong thế giới game. |
| Map, danger, stamina, noise, chase | Không phục vụ điều tra. Nhánh A chỉ có một khoảnh khắc canh thời điểm, không phải hệ thống. |
| Timer ở phía bên kia | Người chơi cần đọc clue thong thả. Áp lực đến từ âm thanh. |
| HUD giờ, chữ glitch trên UI | Làm lộ đáp án, hoặc chỉ là trang trí. |
| Tên chapter "03:17" | Làm lộ đáp án. |
| Zoom/pan/rotate cho mọi vật thể | Chỉ 3 vật thể cần phóng to. |
| Dialogue tree, nhiều nhân vật | Theo chỉ nói qua radio, không có lựa chọn hội thoại. |
| Puzzle P2 (chỉnh đồng hồ) | Người chơi làm vì thử mò, không vì hiểu. |
| Save, achievements, nhiều ending | Chỉ 15–20 phút, chơi một lần là xong. |
| Lồng tiếng đầy đủ | Dùng phụ đề cộng vài từ thì thầm đã qua xử lý méo, tự thu được. |

---

## P. What Should Be Tested With Real Players

Mời 5 người, cho chơi kiểu think-aloud (vừa chơi vừa nói ra suy nghĩ), không giúp gì, ghi hình lại.

| Câu hỏi | Đo gì | Nếu thất bại thì |
|---|---|---|
| Người chơi có tự tắt đèn không? | Thời gian đến lần flip đầu tiên | Làm glimpse lâu hơn hoặc lặp lại, cho công tắc tự chớp. |
| Có quay về kiểm tra sàn sau khi thấy ván bị cạy không? | Có hay không, bao lâu | Tăng độ tương phản của chi tiết ván sàn. |
| **LEAP 1:** có nối giọng mẹ ở 2.58 với nhật ký đêm 3 không? | Thời gian từ lúc đọc nhật ký đến lần đầu thử một tần số cũ | Chuyển sang phương án dự phòng (vạch bút chì trên mặt số radio, mục H). |
| Có ghép số giờ phía này với số phút phía bên kia không? | Có thử 3.00 không. Có đọc kim dài thành kim giờ không. | Vẽ kim dài dài hơn. |
| Có đoán 3.17 trước khi chắc chắn về quy luật không? | Thứ tự các hành động | Chấp nhận được, chỉ cần ghi nhận. |
| Có dò mò 3.00–3.59 thay vì sang phía bên kia không? | Số lần thử trên radio | Chấp nhận được nếu hiếm. |
| Có nhận ra số vạch đếm số lần mình tắt đèn không? Có tự bật tắt đèn để thử không? | Nhắc đến trong lúc think-aloud | Cho vạch mới "tươi" hơn, có bụi rơi xuống. |
| Slot A: có chọn "tắt đèn" không, và có tự bác bỏ được không? | Tỉ lệ chọn | Làm cho chi tiết micro ở C6 dễ thấy hơn. |
| Slot D: có chọn "ánh sáng" trước không, và có hiểu vì sao sai không? | Tỉ lệ chọn, thời gian | Nếu không ai hiểu ra thì bằng chứng ở C6 chưa đủ rõ. |
| Có brute-force deduction không? | Số lần nộp (48 tổ hợp) | Nếu vượt 5 lần thì bỏ hẳn phản hồi "gần đúng". |
| Có đọc lướt nhật ký và bỏ sót "mặt ngoài cửa", "chưa dám bấm nút" không? | Nhắc đến trong lúc think-aloud | Tách mỗi đêm ra một trang rõ ràng hơn. |
| **Choice:** người đã hiểu bằng chứng có cảm nhận được một đánh đổi thật không, hay mặc định chọn giải cứu? | Think-aloud trước lúc chọn có nhắc đến mẹ hoặc vết cào ở mặt ngoài cửa không. Tỉ lệ A/B. Phỏng vấn sau khi chơi. | Nếu 5/5 người chọn A mà không cân nhắc, làm cho dòng intro về mẹ nặng ký hơn. |
| Nhánh B: có nghĩ ra việc dùng hốc sàn không? | Lượng hint đã dùng | Cho Theo gõ vào sàn một lần. |
| Sợ ở đâu, chán ở đâu? | Ghi chú theo mốc thời gian | |
| Tổng thời gian, chỗ bỏ ngang | | Mục tiêu là 15–20 phút. |

**Test rẻ nhất, nên làm trước khi có art:** chơi thử trên giấy. Một người đóng vai "game", mô tả phòng bằng lời, đưa clue card bằng giấy. Người điều khiển phải:
- **Vẽ đồng hồ bên kia**, không mô tả bằng lời. Nếu nói "kim chỉ phút 17" thì puzzle đã hỏng.
- **Giữ một bảng đếm vạch** (3 + số lần tắt đèn). Chỉ cần sai một lần là aha của slot C hỏng.
- **Đưa nhật ký từng trang một.**
- **Phát tiếng vọng** bằng giọng đọc hoặc file âm thanh khi người chơi "dò" đúng tần số cũ.

---

## Q. Remaining Risks

Những điểm dưới đây là giả thuyết thiết kế, **chưa phải design fact**. Chúng cần playtest xác nhận.

| Rủi ro | Trạng thái | Cách giảm (không thêm hệ thống) |
|---|---|---|
| **LEAP 1** (giọng mẹ ↔ đêm 3): người chơi không nhớ âm thanh đã nghe, hoặc đã xoay bánh xe đi mà quên mất | Được thiết kế để giải được bằng quan sát + thử nghiệm, nhưng cần playtest xác nhận. | Hint mục L. Phương án dự phòng là vạch bút chì trên mặt số radio (mục H). |
| **Đọc kim dài thành kim giờ** | Đã giảm (sau playtest nội bộ: "manh mối tần số hơi mơ hồ") | Kim dài chạm vạch, vòng số phút 5…60, kim ngắn gãy nằm rõ dưới đáy. Thử 3.00 thất bại đã tự sửa hướng nghĩ này. Hint stage `combine` khi đã có cả hai đồng hồ mà chưa ghép. |
| **Không biết đêm nào là đêm cần dò** | Đã giảm | Trang cuối nhật ký "Đêm 4 — ▢▢:▢▢". Câu hỏi đổi thành "Đêm Theo biến mất, radio đã bắt được gì?" ngay khi phát hiện radio phát lại các đêm. |
| **Nhật ký quá nặng chữ:** 6 dòng mang thông tin cho P1, slot A, slot D và choice | Có nguy cơ bị đọc lướt | Mỗi đêm một trang. |
| **Choice** | Choice hiện đã có lợi ích và cái giá được ghi rõ trước lúc chọn; việc nó có công bằng hay không vẫn là câu hỏi cho playtest. | Đo theo playtest criterion ở mục K. |
| **Nhánh B:** không nghĩ ra việc dùng hốc sàn | Có nguy cơ kẹt | Hint: "Theo đang ở trong bóng tối" → "đồ để trong hốc sàn thì biến mất" → "Mình đang cầm thứ gì mà Theo cần?" |
| **Lần flip đầu tiên** | Có nguy cơ kẹt | Công tắc sáng lên sau khi đèn chớp. Đo thời gian đến lần flip đầu. |
| **Dò mò 3.00–3.59** | Rủi ro thấp | Khoảng 60 lần thử, chấp nhận được. |
| **Brute-force deduction** (48 tổ hợp) | Rủi ro thấp | Chỉ hiện "gần đúng" từ lần nộp sai thứ 2. |
| **Glimpse làm lộ đồng hồ hoặc số vạch** | Rủi ro thấp | Trong glimpse, đồng hồ nằm ở rìa khung và bị mờ; số vạch không đếm được. |

---

## R. Story → Question → Action

Sau ba vòng tự chơi thử, nguyên tắc cho mọi tương tác trong Chapter 0:

```text
STORY → QUESTION → PLAYER INTENT → ACTION → DISCOVERY → NEW QUESTION
```

Nếu người chơi không trả lời được *"Tại sao tôi lại làm việc này?"* thì tương tác đó chưa đủ tốt: phải sửa flow, không thêm nút hay hint.

### Ba kênh, không trộn lẫn

| Kênh | Là gì | Ví dụ | Hiển thị |
|---|---|---|---|
| **Câu hỏi** | Câu hỏi của câu chuyện mà người chơi đang theo đuổi | Theo đang ở đâu? | Góc trái (luôn có), thẻ "CÂU HỎI MỚI" khi đổi |
| **Việc tiếp theo** | Hành động tiếp theo để trả lời câu hỏi, không bao giờ là lời giải | → Tìm Theo ở căn phòng bên kia. | Dưới câu hỏi; thẻ "TIẾP THEO" khi chỉ việc thay đổi |
| **Phát hiện** | Điều người chơi vừa biết chắc. Không phải objective; nó mở ra câu hỏi tiếp theo | Theo còn sống. | Thẻ "PHÁT HIỆN" hiện trước câu hỏi mới |

Các thẻ hiện lần lượt, và chờ khi hồ sơ đang mở hoặc khi có giọng nói trên radio. Vật thể liên quan tới việc tiếp theo khẽ sáng và hiện động từ khi rê chuột qua. Đứng yên 12 giây thì có một dòng nudge củng cố việc hiện tại. `currentStep(state)` và `discoveries(state)` suy ra tất cả từ GameState, không có quest engine.

### Chuỗi của Chapter 0

| Câu chuyện | Câu hỏi | Người chơi muốn | Hành động | Phát hiện |
|---|---|---|---|---|
| Theo mất tích, bạn không tin cảnh sát | Chuyện gì đã xảy ra với Theo? | Xem thứ duy nhất còn "sống" trong phòng | Kiểm tra radio đang bật | Giọng mẹ gọi "Theo…", nhưng mẹ đang ngủ dưới nhà |
| Radio phát thứ không thể có | Vì sao radio của Theo vẫn còn phát? | "Em có ghi lại những gì đã nghe không?" | Tìm nhật ký (thảm lệch) | Mỗi đêm một giờ, một tiếng lạ |
| Nhật ký ghi 02:58 = giọng mẹ; radio ở 2.58 | Ai đang nói qua radio? | Kiểm tra xem radio có phát lại các đêm khác không | Thử tần số khác | **PHÁT HIỆN:** Radio đang phát lại những đêm trước |
| Trang cuối nhật ký: "Đêm 4 — ▢▢:▢▢", "nó sẽ đến muộn hơn" | Đêm Theo biến mất, radio đã bắt được gì? | Điền vào ô trống: đêm đó nó tới lúc mấy giờ | Tìm xem đêm đó nó tới lúc mấy giờ → đồng hồ đeo tay | 03:▯▯, thiếu số phút |
| Đèn chớp, căn phòng khác hiện ra | Căn phòng vừa biến thành cái gì? | Xem lại cái vừa thấy | Tắt đèn | **PHÁT HIỆN:** Căn phòng có một phía khác |
| Phía bên kia đứng yên ở một đêm | Nơi này là đâu? (+ tìm số phút còn thiếu) | Tìm thứ đã dừng lại đêm đó | Soi đồng hồ bên kia | "Nó cũng dừng, như đồng hồ đeo tay." Chỉ còn kim dài |
| Có đủ giờ và phút | Đêm Theo biến mất, radio đã bắt được gì? | Nghe đêm Theo biến mất | Dò tần số đêm đó | Hội thoại với Theo → **PHÁT HIỆN:** Theo còn sống |
| "Em vẫn ở trong phòng… nhưng không phải phòng của chị" | Theo đang ở đâu? | "Căn phòng mình thấy khi tắt đèn?" | Tìm Theo ở căn phòng bên kia | "Có thứ gì đó đang đứng ở bàn radio." |
| Có thứ gì đó ở bàn | Thứ gì đang ở bàn radio? | Xem nó là gì | Soi bàn radio | **PHÁT HIỆN:** Nó tới ngay sau khi mình bật radio |
| "Em vẫn ở chỗ em đếm" | Theo đang ở đâu? | Tìm chỗ có dấu đếm | Soi bức tường | Số vạch vừa tăng → "Mình đã có đủ bằng chứng." |
| Có đủ bằng chứng | Chuyện gì đã thực sự xảy ra với Theo? | Ghép lại | Hồ sơ → kết luận | Sự thật viết trên trang; radio tự rè lên |
| Theo nói cái giá của từng lựa chọn, và cái hốc | Có nên đưa Theo về không? | Quyết định | Vặn to / tắt radio | **PHÁT HIỆN:** Hai căn phòng thông nhau qua cái hốc |
| (B) Radio im lặng, Theo ở trong bóng tối | Theo phải ở trong bóng tối cả đêm sao? | Gửi ánh sáng qua cái hốc Theo nói | Gửi ánh sáng cho Theo (hốc sàn) | Đèn pin biến mất |
| (B) | Theo có nhận được không? | Kiểm tra | Sang phía bên kia | "EM ỔN. ĐÊM MAI. CÙNG GIỜ." |
| (A) Nó đi về phía tiếng radio | Làm sao kéo Theo qua khi nó còn ở đó? | Canh lúc nó rời bức tường | Kéo Theo qua bức tường | Theo về, cửa bị cào, đồng hồ dừng |

Các bước trước khi liên lạc được coi là xong ngay khi đã liên lạc (người đoán trước 3.17 không bị đưa ngược lại), trừ nhật ký, vì deduction vẫn cần nó.

### Opening không được làm lộ puzzle

Đồng hồ đeo tay chỉ còn số giờ (mục D). Opening nói "Nó dừng lúc 3 giờ. Hai số phút đã vỡ." Nếu opening nói "3:17" thì puzzle P1 và aha "giờ ở phía này, phút ở phía bên kia" biến mất.

### Acceptance test

Cho một người chưa đọc tài liệu chơi, không giải thích gì. Ở mỗi phát hiện, hỏi: Mình vừa biết được gì? Vậy câu hỏi tiếp theo là gì? Mình sẽ làm gì để trả lời nó, và tại sao? Nếu có lúc họ nghĩ "Rồi sao nữa?" thì đó là lỗi của flow, không phải của UI.

## S. Tương tác vật lý và chuyển động

Mọi hành động quan trọng đi qua cùng một vòng: **tiến lại → chạm → vật phản ứng → âm thanh → thế giới trả lời → phát hiện → câu hỏi mới**. Không có click nào nhảy thẳng từ state sang panel.

### Vòng đời một vật thể

| Nhịp | Người chơi thấy | Ở đâu trong code |
|---|---|---|
| Idle | Radio rè, đèn RX nhấp nháy, loa rung; rèm đung đưa, mưa, kim giây | `Room` (`live`), `scene.css` |
| Nearby | Vật của bước hiện tại ấm dần khi tay lại gần; tiếng rè radio to dần | `--near`, `audio.radioNear` |
| Hover / focus | Tên hành động cạnh con trỏ (`[E] Nghe`, `Xem hốc sàn`), vật của bước hiện tại đậm hơn | `.verb-prompt`, `VERBS` |
| Tiến lại | Camera nghiêng vào đúng vật (close-up 0.44 s, với tay 0.2 s); thảm kêu cót két | `Scene.lean`, `.stage.approaching` |
| Tương tác | Close-up mở ra từ chỗ camera đang nhìn; vật nhấc lên | `.radio-set`, `.diary-book`, `.floorboards` |
| Thế giới trả lời | Mỗi sự kiện là một timeline ngắn trong `PRESENTATION` (`beats`) | `presentation/cues.ts` |

Trên màn hình cảm ứng: chạm là đủ. Tên hành động hiện lúc tay đang với tới. Kéo thay cho cuộn (bánh số radio, trang nhật ký, đèn pin).

### Từng vật

- **Bánh số radio**: kéo lên/xuống, mỗi nấc một tiếng tách; tiếng rè đổi cao độ theo con số. Vuốt nhanh thì bánh quay thêm vài nấc rồi dừng. Chỉ chỗ bánh **dừng** mới được "nghe" (`RADIO_WHEEL` mang cả số nấc), nên quay lướt qua 3.17 không vô tình bắt được Theo.
- **Giọng trên radio**: rè xé → im lặng (02:58: có tiếng thở) → giọng (tiếng thì thầm theo từng dòng, đèn RX đứng yên, loa bơm) → radio tắt phụt (02:58) / tiếng cào ba lần (3.17: có thứ gì trả lời tín hiệu).
- **Nhật ký**: bìa mở ra; trang treo trên gáy lò xo, kéo sang trái để lật (sang phải để lật lại), trang cũ lật qua gáy.
- **Hốc sàn**: quỳ xuống (camera hạ theo thảm), tấm ván lỏng trượt sang một bên, hơi lạnh bốc lên từ bên dưới (mạnh hơn sau khi biết sự thật). Nhánh B: đèn pin nằm trên ván, đang bật; kéo nó vào hốc (hoặc chạm) → đèn nghiêng rơi vào, ánh sáng lấp đầy hốc rồi chìm dần, tiếng rơi nhỏ dần, im lặng, xong.
- **Công tắc / World Flip (2.5 s)**: tiếng tách → bóng đèn loé rồi tắt → radio xé tiếng → **một nhịp chớp thấy trọn căn phòng lạnh** → tối lại → mắt quen dần, sương tràn vào, dây leo mọc lên → click… đèn pin chập chờn rồi sáng. HUD ẩn trong lúc chuyển.
- **Vạch đếm**: mỗi lần sang, vạch mới được khắc trước mắt. Nếu đã biết bức tường thì còn nghe tiếng khắc, dù đèn pin không chiếu vào đó.

### Khoảnh khắc lớn

| Sự kiện | Timeline |
|---|---|
| Bước vào | Đen → khe sáng hành lang mở ra (cửa) → cửa đóng sau lưng → phòng im (radio bị giữ im) → **radio vọt lên**, camera kéo về phía nó → mới cho điều khiển |
| Liên lạc 3.17 | Số nhảy loạn → phòng lặng dần → giọng Theo → tiếng cào |
| Có thứ gì trong nhà (sau khi liên lạc) | 24–46 s một lần, không đều: radio to lên, đèn sụt, ván kêu, tiếng cào, một bóng đi ngang khe cửa. Không bao giờ cho thấy nó |

### Sống động nền

Mưa (tiếng và vệt trên kính), sét 30–70 s một lần kèm sấm trễ, rèm, cành cây, dây micro, kim giây, bụi trong ánh đèn, camera trôi nhẹ và lệch theo con trỏ. Mỗi thứ một nhịp lệch nhau để không thành vòng lặp. Phía bên kia không có mưa, không có đồng hồ chạy: chỉ drone, sương và bào tử.

Thứ bậc: nền rất khẽ → tương tác rõ và vật lý → phát hiện mạnh hơn (tiếng rơi, lặng, ánh sáng) → sự kiện lớn là cả một chuỗi. Không phải tương tác nào cũng kịch tính như nhau.
