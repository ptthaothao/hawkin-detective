# STATIC — Chapter 0: "Tín hiệu"

> Vertical slice · 1 phòng · 2 thế giới · 15–20 phút
> Tài liệu thiết kế gameplay, là **source of truth** cho Chapter 0. Chưa bao gồm architecture.
> Cập nhật 25/09/2026 sau vòng stress-test và final validation. Thêm mục R (xương sống câu chuyện) sau lần tự chơi thử bản build đầu.
> **Cập nhật 29/09/2026: viết lại cốt truyện** (bối cảnh Mỹ 1986, nhà Hale, phía bên kia là quá khứ, một kết thúc duy nhất). Xem mục 0, phần "Sau khi viết lại backstory". Chỉ tài liệu truyện đổi, **code (`src/game`) chưa đổi** nên còn lệch tài liệu này.
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
11. **Lời Theo trên radio không dùng chữ "khắc", "vạch", "bút", "màu", "vẽ"**, để slot C phải suy luận.
12. **Lợi ích và cái giá của khoảnh khắc kết đều có bằng chứng trước lúc làm.** Thêm chi tiết núm âm lượng gãy, lời Theo dặn đừng nói vào micro, và bước chân đều đặn của thứ bên kia. (Bản 25/09 còn nói về lựa chọn vặn to / tắt; đã bỏ ở 29/09, xem bên dưới.)

### Sau khi viết lại backstory (29/09/2026)

13. **Chỉ còn một kết thúc, không còn lựa chọn.** Bỏ nhánh A (vặn to hết cỡ), bỏ nhánh B cũ (gửi đèn pin qua hốc sàn). Khoảnh khắc kết là **một nhịp canh thời điểm**: tắt radio đúng giữa hai bước chân của thứ bên kia. Sai chỉ phải thử lại, không có game over. Mục K viết lại hoàn toàn.
14. **Phía bên kia là quá khứ, phía của chị là hiện tại.** Bên kia có **hai lớp thấy được**: đồ cổ màu nâu là đêm của bà chủ nhà cũ (khoảng năm 1890, không có điện); đồ hiện đại màu sáng (radio, micro, bút sáp, đèn pin) là đêm Theo biến mất. Bên kia mục dần **chỉ ở rìa**; ngôi nhà và đồ liên quan tới đứa con của bà vẫn nguyên.
15. **Theo có sẵn đèn pin và vài mẩu bút sáp trong túi quần** (em thích vẽ). Phía này không còn nội dung gửi đèn pin, không còn "Đèn pin biến mất". Đèn pin của người chơi chỉ để soi phía bên kia.
16. **Vạch đếm của Theo vẽ bằng bút sáp (sáng, mới); tên MARTIN thì khắc dưới đáy radio (cũ).** Hai lớp thời gian nhìn khác nhau.
17. **Hạt giống mới (không lộ gì):** tên MARTIN **khắc dưới đáy radio** (chỉ hiện khi chà bút sáp của Theo lên đó, tùy chọn); hai nốt huýt sáo rất xa; tiếng bước chân đều đặn; vết cào ở cửa là do bà chạm vào cửa phòng của con mình. Không gieo nghĩa địa ở Chapter 0. Việc chiếc radio của bố lại mang một cái tên khắc cũ **không được giải thích** ở Chapter 0.
18. **Nền truyện** (con quái là bố chồng lên bà chủ nhà cũ; 1979; mẹ và chị mất trí nhớ; tuyến đi cố định; nó hại cả người lớn nhưng nhắm trẻ con trước) nằm ở `chapter-0-revision/ke-hoach-sua-cot-truyen-chapter-0-v2.md`. Chapter 0 không nói gì trong số đó ra.

---

## A. Revised Game Concept

**Working title: STATIC**

> Mỗi vị trí trong phòng tồn tại ở hai phía. Sự thật bị chia đôi: một nửa ở phía này, một nửa ở phía bên kia. Chỉ bạn mới ghép được hai nửa đó.

Bối cảnh: một thị trấn nhỏ ở nước Mỹ, năm 1986, gia đình Hale. Theo Hale, 12 tuổi, mất tích 3 đêm trước. Cảnh sát cho rằng em bỏ nhà đi. Bạn là chị gái của Theo và bước vào phòng em lúc gần nửa đêm. Khi tắt đèn, căn phòng trở thành *phía bên kia*.

Game không tìm cách hù dọa bằng jumpscare. Khoảnh khắc đáng sợ nhất nằm ở sự hiểu ra: *thứ bạn vừa dùng để liên lạc với Theo cũng chính là thứ dẫn con quái vật tới.*

---

## B. Core Gameplay Pillars

| Pillar | Ý nghĩa | Kiểm tra |
|---|---|---|
| **1. Sự thật bị chia đôi** | Không clue quan trọng nào tự đủ. Mọi kết luận cần thông tin từ cả hai phía. | Nếu một câu hỏi giải được mà chỉ cần ở một phía thì thiết kế sai. |
| **2. Game ghi lại, người chơi kết luận** | Clue card chỉ mô tả những gì đã thấy, không bao giờ diễn giải. | Không card nào được chứa chữ "có vẻ", "liên quan", "nghĩa là". |
| **3. Học luật của phía bên kia** | Phía bên kia vận hành theo luật nhất quán. Người chơi học các luật đó, rồi dùng chúng. | Mọi hiện tượng đều giải thích được bằng các luật ở mục I. |
| **4. Kiểm chứng bằng hành động** | Người chơi chứng minh mình hiểu bằng cách làm (dò radio, điền kết luận, canh nhịp bước chân để tắt radio). | Không có ô "nhập mã" nào trôi nổi, không gắn với vật thể nào. |
| **5. Khoảnh khắc kết dựa trên hiểu biết** | Cú tắt radio cuối chỉ có nghĩa với người đã hiểu deduction: vì sao tiếng radio là thứ nó tìm. | Người chưa làm deduction sẽ không hiểu mình đang tắt vì sao. |

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

| # | Vật thể | Phía này (hiện tại) | Phía bên kia (quá khứ, hai lớp) | Vai trò |
|---|---|---|---|---|
| 1 | **Công tắc đèn** | Đèn sáng | Cùng vị trí là một **giá nến gắn tường**, ngọn nến đang cháy. Ánh nến không soi được gì (luật 4), chỉ có vùng sáng của đèn pin | Cơ chế flip. Mỗi lần tắt đèn, tường bên kia có thêm 1 vạch bút sáp (mục I). Muốn về phía này thì thổi tắt nến (cùng chỗ, cùng cử chỉ với công tắc). Khi sang lần sau, nến lại đang cháy. |
| 2 | **Bàn radio** | Radio sóng ngắn có 3 bánh xe số `_._ _ MHz`, đang để ở **2.58**, **đang bật** khi người chơi bước vào (đèn LED sáng, loa rè khẽ). Lần đầu nghe sẽ phát tiếng vọng của đêm 3 (mục R). Micro cầm tay móc gọn trên giá. Có chồng tờ tìm người. Có đồng hồ đeo tay của Theo kèm giấy nhắn của mẹ. Có vài tờ giấy Theo vẽ chơi và một mẩu bút sáp mòn. **Mặt sau vỏ radio có tên MARTIN khắc mờ** (chỉ đọc được khi chà bút sáp lên, tùy chọn). | Bàn gỗ nâu cổ. Radio và micro của Theo nằm trên đó như một lớp **sáng màu, hiện đại** chồng lên đồ cũ, không đọc được số. **Không dây leo.** **Vết cào dày đặc quanh radio.** Một **đèn dầu cổ** ngay cạnh **vẫn nguyên vẹn**. **Micro rơi dưới sàn, nút bấm nói bị quấn băng keo, dây kéo căng về phía bức tường cạnh giường.** Trong góc có một **máy quay đĩa ống sáp có loa kèn**, im lặng (chỉ là bối cảnh ở Chapter 0). | P1, slot A, slot D |
| 3 | **Đồng hồ treo tường** | Chạy bình thường, 11:47 PM, có tiếng tích tắc | **Đồng hồ quả lắc, đứng yên. Con lắc dừng lệch một bên. Kim ngắn gãy, nằm dưới đáy mặt kính. Kim dài dừng qua số 3 hai vạch nhỏ.** | P1 (số phút) |
| 4 | **Thảm / sàn** | Tấm thảm; bên dưới có một tấm ván lỏng giấu nhật ký | Tấm thảm dệt cũ, sờn. **Tấm ván đã bị cạy lên**, hốc bên dưới trống, chỉ rộng bằng một cuốn sổ | Dẫn hướng tới nhật ký, bác bỏ đáp án "hốc sàn". (Hốc nối hai phía nhưng **không được dùng** trong Chapter 0.) |
| 5 | **Bức tường cạnh giường** | Poster, không có gì lạ | Giấy dán tường ố nâu. **Vạch bút sáp màu sáng. Lần đầu thấy 4 vạch, sau đó +1 mỗi lần người chơi tắt đèn.** | Slot C, cho thấy Theo còn sống |

- Cửa phòng ở phía bên kia không mở được ("Bạn không muốn mở cánh cửa đó"). Nó chỉ dùng cho âm thanh và bầu không khí.
- Micro ở phía này không bấm được ("Bạn không dám bấm."). Người chơi không bao giờ phát sóng trong Chapter 0.
- **Hai lớp thấy được ở phía bên kia:** đồ cổ nâu (giá nến, đồng hồ quả lắc, giấy dán tường, đèn dầu, máy quay đĩa) và đồ sáng màu của Theo (radio, micro, bút sáp, đèn pin). Người chơi không được giải thích; nhìn là hiểu "hai thời gian chồng lên nhau".
- **Mục nát chỉ ở rìa:** góc xa của phòng, mép trần và khe cửa mục dần vào sương. Bàn radio, giường, tường cạnh giường và cửa **không** mục (đồ liên quan tới đứa con của bà).
- Intro có dòng *"Mẹ đã ngủ ở tầng dưới, sau ba đêm thức trắng."* Đây là lý do giọng mẹ trên radio là điều không thể. Trong truyện, mẹ **chỉ nhớ mang máng** 3:17 có ý nghĩa gì đó (không nói ra ở Chapter 0).

---

## D. Clue List

Clue card chỉ ghi lại **những gì thấy được**. Những chữ **in đậm** là "chip" dùng để điền vào deduction.

| ID | Tìm ở | Nội dung card (trung tính) |
|---|---|---|
| **C1** Tờ tìm người | Phía này, bàn | "THEO HALE, 12 tuổi. Mất tích đêm 14 rạng sáng 15/11. Cảnh sát cho rằng em **bỏ nhà đi**." |
| **C2** Đồng hồ đeo tay | Phía này, bàn | Màn hình LCD nứt: `03:▯▯`. Hai số cuối không hiện. Giấy nhắn của mẹ: *"Mẹ tìm thấy dưới gầm giường. Nó dừng rồi."* |
| **C3** Nhật ký tín hiệu | Phía này, dưới ván sàn | Xem nội dung đầy đủ bên dưới. |
| **C4** Đồng hồ bên kia | Phía bên kia | "Đồng hồ quả lắc đứng yên. Con lắc dừng lệch một bên. Kim ngắn gãy, nằm dưới đáy mặt kính. Kim dài dừng qua số 3 hai vạch nhỏ." |
| **C5** Bức tường có vạch | Phía bên kia | "**Bức tường có vạch bút sáp.** Lần 1: 4 vạch." Card tự ghi thêm sau mỗi lần sang, ví dụ "Lần 2: 5 vạch". Card không ghi lý do số vạch tăng. |
| **C6** Bàn radio bên kia | Phía bên kia | "Vết cào sâu bao quanh **radio**. **Đèn dầu** ngay bên cạnh không có vết nào. **Micro** cầm tay rơi dưới sàn, dây kéo căng về phía bức tường cạnh giường. Nút bấm nói bị quấn băng keo cho kẹt xuống." Sau khi bắt được liên lạc, card ghi thêm: "Có thêm vết cào mới quanh radio." |

**Nội dung C3 — Nhật ký tín hiệu** (mỗi đêm một trang):

> *Đêm 1 — 01:52. Chỉ có rè. Rồi ba tiếng gõ. Chắc em tưởng tượng.*
> *Đêm 2 — 02:34. Có tiếng thở. Em vặn to lên để nghe rõ. Sáng ra có vết cào ở **mặt ngoài cửa phòng** em. Mẹ bảo là con chó nhà bên.*
> *Đêm 3 — 02:58. Nó gọi tên em. Bằng giọng của mẹ. Đồng hồ đeo tay em tắt ngấm lúc nó tới, sáng ra mới chạy lại.*
> *Radio của bố có **micro**. Em vẫn chưa dám bấm nút.*
> *Em để một mẩu **bút sáp** trong **hốc dưới sàn**. Sáng ra nó biến mất.*
>
> *(trang cuối)* *Hôm nay em ở nhà Danny tới tối, vẽ cả buổi. Về nhà em nằm lên giường và nghịch radio của bố.*
> *Đêm 4 — ▢▢:▢▢. Đêm nay nó sẽ đến muộn hơn. Nó tới lúc nào, em sẽ ghi vào đây.*
> *Lần này em sẽ không chỉ ngồi nghe.*

Trang cuối để **trống giờ** theo đúng mẫu của ba đêm trước. Ô trống đó chính là câu hỏi của puzzle: đêm Theo biến mất, nó tới lúc mấy giờ? Nhật ký không ghi con số nào.

**Hai chiếc đồng hồ là hai nửa của một giờ.** Đồng hồ đeo tay còn số giờ, mất số phút. Đồng hồ bên kia còn kim dài, mất kim ngắn. Mặt số của cả hai chiếc (bên này in sẵn, bên kia vẽ tay kiểu cổ) đều có vòng số phút nhỏ màu đỏ 5, 10, … 60 như đồng hồ trường học, và kim dài chạm tới vạch, nên kim còn lại đọc được là kim phút. Chiếc nào được tìm thấy sau thì người chơi nhận ra nó khớp với chiếc kia ("Nó cũng đã dừng, như…"). Đó là quan sát, không phải đáp án.

**Nguồn của các chip deduction:**

| Chip | Nguồn |
|---|---|
| bỏ nhà đi | C1 |
| nói vào micro | C3 + C6 ("micro") |
| tắt đèn | Công tắc đèn (hành động người chơi đã làm) |
| chui xuống hốc sàn · hốc dưới sàn | C3 |
| cửa phòng · cánh cửa phòng | C3 |
| bàn radio · tiếng radio | C6 |
| đèn dầu · ánh sáng | C6 ("đèn dầu") |
| bức tường có vạch bút sáp | C5 |

**Những gì card và nhật ký không bao giờ ghi:** "3:17", "17 phút", một cột tần số, "tần số trùng với giờ", "Theo đã nói vào micro", "Theo trốn ở bức tường", "Theo còn sống", "nó bị thu hút bởi âm thanh". Đó là những điều người chơi phải tự nghĩ ra.

---

## E. Player Knowledge

Có 4 tầng, và mỗi tầng có một chủ sở hữu khác nhau:

| Tầng | Ai sở hữu | Có hiển thị? | Ví dụ |
|---|---|---|---|
| **World Fact** | Tác giả | Không bao giờ | Theo nói vào micro lúc 3:17, bị kéo sang phía bên kia qua bức tường, đang trốn ở đó. Con quái đi theo giọng nói phát trên kênh sống 3.17; tuyến của nó chạy qua phòng Theo. |
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

Lời của Theo trong lần liên lạc đầu không được chứa các chữ "khắc", "vạch", "tường", "micro", "radio", "bút", "màu", "vẽ". Chỉ lời của Theo được ghi vào nhật ký radio.

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

Đáp án đúng: bức tường có vạch bút sáp
Đáp án sai nhưng hợp lý, và lý do bị bác bỏ:
- hốc dưới sàn: nhìn thấy được, trống, quá nhỏ.
- bàn radio: đó là chỗ con quái cào, không phải chỗ trốn.
- cửa phòng: không mở được, phía sau có tiếng thứ gì đó di chuyển.
```

### Slot D

```text
Bằng chứng cần có:
1. C3 đêm 2: vặn to radio thì sáng ra có vết cào. Chỉ đêm đó có vết cào.
2. C6: radio bị cào nát, đèn dầu ngay bên cạnh không bị động đến.
3. Hành động của người chơi (bắt buộc): bật radio ở 3.17 thì ngay sau đó có vết
   cào mới quanh radio, và một cái bóng đứng ở bàn.
4. Trải nghiệm của người chơi: đã soi đèn pin ở phía bên kia nhiều phút mà không có gì tìm đến.

Đáp án đúng: tiếng radio
Đáp án sai nhưng hợp lý, và lý do bị bác bỏ:
- ánh sáng: đèn dầu nguyên vẹn, đèn pin không thu hút gì.
  Chữ "tắt—" của Theo cũng có thể là "tắt radio".
- cánh cửa phòng: vết cào ở cửa chỉ xuất hiện sau đêm vặn to radio. Đó là đường nó
  đi ngang qua tới chỗ phát ra âm thanh, không phải thứ nó tìm. Vết cào mới cũng xuất hiện ở
  bàn, không phải ở cửa.
```

**Vết cào ở mặt ngoài cửa (World Fact, không hiển thị):** phòng Theo nằm trên tuyến đi của thứ bên kia. Nó chạm vào cửa phòng để nhớ đứa con của mình, nhưng móng vuốt làm xước cửa (vết ở cao ngang một đứa trẻ bảy tuổi). Vặn to radio chỉ làm nó dừng lại ở đó lâu hơn.

**Slot D là cái bẫy có chủ đích.** Thể loại kinh dị dạy người chơi rằng "quái vật đi theo ánh sáng". Bằng chứng trong game đi ngược lại quy ước đó, và người chơi tự xác nhận được bằng chính hành động của mình.

**Phản hồi khi nộp:**
- Đúng hết: màn hình tối lại, radio tự rè lên, dẫn sang màn kết (mục K).
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
- Người chơi đặt đồ vật vào hốc sàn ở phía này thì đồ vật xuất hiện ở phía bên kia. Phải suy ra Theo cần gì.
- Aha tốt ở chỗ phát hiện ra "hốc sàn là đường nối". Nhưng nếu làm thành puzzle chính thì cần nhiều item để chọn, nghĩa là inventory quay lại và dễ thành fetch quest.
- **Đánh giá:** không dùng làm puzzle chính. Không dùng trong Chapter 0 (đã bỏ nhánh gửi đồ); để dành cho Chapter 1.

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
2. **Đồ vật ở phía bên kia bị giữ nguyên ở khoảnh khắc đêm đó (cả đồ cổ lẫn đồ của Theo). Sinh vật thì không.** (Đồng hồ đứng yên, micro đang rơi, nhưng Theo vẫn vẽ thêm vạch.)
3. **Cùng một vị trí thì là cùng một chỗ.** Mọi điểm trong phòng đều có bản sao ở phía kia.
4. **Âm thanh đi qua được, ánh sáng thì không.** (Theo nghe được radio, con quái cũng nghe được. Đèn phía này không soi sáng được phía bên kia.)
5. **Hốc dưới sàn nối hai phía.** Đồ đặt vào đó sẽ sang phía bên kia. (Chapter 0 không dùng luật này; để dành cho Chapter 1.)
6. **Mỗi lần phía này tối đi, Theo vẽ thêm một vạch bút sáp.** Xem luật đếm vạch bên dưới.
7. **Chỉ tần số của đêm Theo biến mất (3.17) là tín hiệu đang sống.** Các tần số cũ chỉ là tiếng vọng. Chúng không gọi con quái tới và không tạo ra vết cào mới.

**Ghi chú 29/09 (World Fact, không hiển thị):**
- Phía bên kia là **quá khứ**: hai lớp chồng lên nhau (đêm của bà chủ nhà cũ, đêm Theo biến mất). Phía này là hiện tại, thời gian vẫn chạy.
- Bên kia mục dần chỉ ở rìa. Nhà và đồ liên quan tới đứa con của bà thì nguyên.
- Thứ săn Theo đi một **tuyến cố định** (nhà kho, phòng Theo, nghĩa địa), với **nhịp bước đều**. Nó chỉ sang được phía này khi có người **nói vào radio ở 3:17** (đêm 4, Theo). Nó nhắm trẻ con trước nhưng vẫn hại được người lớn. Không thứ nào trong số này được nói ra ở Chapter 0.
- Hốc dưới sàn (luật 5) vẫn đúng nhưng **không dùng** trong Chapter 0.

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
- Màn kết (nhịp tắt radio) chỉ mở sau khi nộp deduction đúng.
- Ending chỉ xảy ra sau khi tắt radio đúng nhịp.

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
  Tắt đèn → tối đen → vùng sáng đèn pin. Căn phòng của một ngôi nhà cũ: đồ gỗ nâu, giấy dán tường ố,
  đồng hồ quả lắc, giá nến cháy ở chỗ công tắc. Đồ sáng màu của Theo nằm chồng lên. Rìa phòng mục dần vào sương. Im lặng.

BEAT 4 — PHÍA BÊN KIA
  Tường  → C5 (4 vạch)
  Đồng hồ → C4 (kim dài qua số 3 hai vạch)
  Sàn    → ván bị cạy, hốc nhỏ và trống
  Bàn    → C6 (vết cào, đèn dầu nguyên vẹn, micro)
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

BEAT 8 — KẾT: NHỊP TẮT RADIO (mục K)
  Radio tự rè lên ở 3.17, lời Theo ("đừng nói gì vào micro nữa, nó nghe thấy").
  Núm âm lượng gãy trong tay. Radio rú lên theo từng bước chân đều đặn của thứ bên kia.
  Người chơi tắt radio đúng giữa hai bước. Sai thì nó quay lại, radio tự bật, thử lại.

BEAT 9 — PHÍA BÊN KIA, MỘT LẦN CUỐI
  Tắt đèn → tối đen → một vùng sáng bật lên ở bức tường (đèn pin của Theo):
  dòng bút sáp "EM ỔN. ĐÊM MAI. CÙNG GIỜ." Hai nốt huýt sáo rất xa ngoài cửa.

ENDING
  Đồng hồ treo tường phía này điểm... rồi đứng lại.
  "HẾT CHƯƠNG 0"  + tóm tắt

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
| 8 | Đèn trần chớp 3 lần, trong một khoảnh khắc thấy căn phòng cũ, đồ gỗ nâu | "Cái gì vừa hiện ra?!" | — | Tiếng "thịch". Công tắc hơi sáng lên. | 🟡 |
| 9 | Công tắc | "Nếu mình tự tắt đèn thì sao?" | Tắt đèn | Tối đen, rồi vùng sáng đèn pin. Căn phòng cũ, giá nến cháy ở chỗ công tắc, đồ sáng màu của Theo chồng lên đồ nâu, im lặng. | 🟡 |
| 10 | Bức tường cạnh giường | "Vạch đếm… 4 vạch. Ai đếm?" | Soi | C5 "Lần 1: 4 vạch" | 🟢 |
| 11 | Đồng hồ: kim ngắn gãy, kim dài qua số 3 | "Chỉ số 3… à không, kim dài là kim phút." | Xem | C4 | 🟡 |
| 12 | Sàn: ván bị cạy, hốc nhỏ và trống | "Bên kia bị cạy. Bên này thì sao?" | Xem | "Hốc chỉ rộng bằng một cuốn sổ." | 🟢 |
| 13 | Bàn: vết cào quanh radio, đèn dầu nguyên, micro rơi, dây kéo về phía tường | "Cái gì cào radio? Ai đánh rơi micro?" | Xem | C6 | 🟢 |
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
| 31 | Slot D | "Theo nói 'tắt—'… tắt đèn? Nhưng đèn dầu nguyên vẹn, đèn pin mình soi mãi không sao… radio bị cào, và cào thêm ngay sau khi mình bật." | Điền: tiếng radio | — | 🟡 |
| 32 | — | — | Nộp | Màn hình tối lại. Radio tự rè lên ở 3.17. | 🟢 |
| 33 | Lời Theo ("đừng nói gì vào micro nữa, nó nghe thấy") + núm âm lượng gãy trong tay | "Không vặn to được nữa. Nó đi đều quá… mỗi bước radio lại rú lên." | Nghe | Tiếng bước chân đều đặn qua radio | 🟡 |
| 34 | Bước chân, radio rú lên theo từng bước | "Tắt lúc nào?" | Bấm tắt radio đúng lúc nó đang bước | Bước chân dừng, quay về phía radio. Radio tự rè lên, ba tiếng cào. Nhịp bắt đầu lại. Không mất gì. | 🟡 |
| 35 | Nhịp lặp lại | "Nó dừng một nhịp giữa hai bước…" | Tắt radio đúng giữa hai bước | Im lặng. Bước chân dừng ở cửa, một tiếng cào nhẹ, rồi đi tiếp. | 🟢 |
| 36 | Tắt đèn: tối đen hoàn toàn, rồi một vùng sáng bật lên ở bức tường | "Em nhận được rồi. Đèn của em vẫn sáng." | Nhìn | Dòng bút sáp mới: "EM ỔN. ĐÊM MAI. CÙNG GIỜ." Hai nốt huýt sáo rất xa. | 🟢 |
| 37 | Đồng hồ treo tường điểm… rồi đứng lại | — | — | "HẾT CHƯƠNG 0" + tóm tắt | 🟢 |

---

## K. Kết chương: nhịp tắt radio (không có lựa chọn)

> **29/09/2026:** bỏ lựa chọn vặn to / tắt và bỏ nhánh gửi đèn pin. Chapter 0 chỉ còn **một hành động**: tắt radio. Nó không phải lựa chọn mà là một khoảnh khắc canh nhịp.

**Ý đồ:** người chơi vừa hiểu ra "thứ đó tìm tiếng radio". Câu hỏi cuối không còn là *nên làm gì*, mà là *làm được không*: nghe ra nhịp của nó và tắt đúng lúc. Áp lực nằm ở âm thanh, không có timer, không có chết, không có game over.

**Lời Theo trước khi tắt** (radio tự rè lên ở 3.17 sau khi nộp deduction đúng):

> *"Chị. Đừng nói gì vào micro nữa. Nó nghe thấy. Đêm em nói vào đó, nó tới. Pin đèn của em sắp hết rồi. Nó đang đi qua phòng em, đều như mọi lần. Chị nghe cho kỹ nhịp của nó."*

Lời này đặt lý do của luật micro vào truyện ("đêm em nói vào đó, nó tới") mà không nói ra đáp án nào chưa giải. Nó không nhắc mẹ và không đưa lựa chọn.

### Diễn biến

1. **Núm âm lượng gãy** trong tay người chơi ngay lúc kênh 3.17 sống (nó là cánh cửa đang bị đẩy). Không cần chặn bằng UI: người chơi thử vặn và thấy núm rời ra.
2. **Bước chân đều đặn** vang qua radio, mỗi bước radio rú lên. Nhịp cố định, khoảng cách giữa hai bước không đổi. Nghe được ít nhất 3 bước trước khi có thể tắt.
3. **Tắt radio giữa hai bước.**
   - Đúng: im lặng. Bước chân dừng ở cửa, một tiếng cào nhẹ (nó chạm vào cửa phòng của đứa con nó), rồi đi tiếp.
   - Sai (bấm giữa lúc nó đang bước): nó dừng, quay về phía radio, radio **tự rè lên lại** và có ba tiếng cào. Nhịp bắt đầu lại. Không mất gì, không có game over.
4. **Phía bên kia, một lần cuối.** Tắt đèn: tối đen hoàn toàn, rồi một vùng sáng bật lên ở bức tường (đèn pin của Theo). Dòng bút sáp mới: *"EM ỔN. ĐÊM MAI. CÙNG GIỜ."* Hai nốt huýt sáo rất xa, ngoài cửa.
5. **Ending:** đồng hồ treo tường phía này điểm… rồi đứng lại. "HẾT CHƯƠNG 0".

Không có hành động gửi đồ qua hốc sàn. Người chơi không mất đèn pin. Radio còn nguyên (trừ núm gãy).

### Bằng chứng người chơi đã có trước khi tắt

| Điều người chơi cần hiểu | Bằng chứng |
|---|---|
| Tắt là hướng đúng, không phải vặn to | Slot D (nó đi theo tiếng radio) + núm gãy + lời Theo |
| Nó nghe thấy, phải giữ yên lặng | Lời Theo "nó nghe thấy" + vết cào mới ở bàn sau khi dò 3.17 (C6) + vết xước mờ trên mép bàn thật |
| Có nhịp để canh | Bước chân đều, radio rú theo từng bước, Theo dặn "nghe cho kỹ nhịp của nó" |

### Hệ quả cho Chapter 1 (ghi chú, chưa viết)

- Theo vẫn kẹt ở phía bên kia, vẫn sống, vẫn liên lạc được đêm mai cùng giờ. Chapter 1 chuyển sang hai nửa cố định mỗi đêm (nửa của chị trước, rồi nửa của Theo).
- Ending A cũ ("nó biết đường sang đây rồi", đồng hồ dừng 3:17) **không còn ở Chapter 0**.

> **Playtest criterion:** người chơi có nghe ra nhịp không, thử tắt bao nhiêu lần, và có cảm thấy bị động vì không còn lựa chọn hay không.

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
| Deduction D | "So sánh bàn radio bên kia trước và sau khi mình dò 3.17." | "Đèn dầu và radio nằm cạnh nhau. Cái nào bị cào?" | "Theo từng vặn to radio, sáng hôm sau có vết cào. Còn mình vừa bật radio lên..." |
| Nhịp tắt radio (kết) | "Nó bước đều." | "Radio rú lên mỗi lần nó bước. Giữa hai bước thì sao?" | "Tắt radio ngay lúc nó nhấc chân, giữa hai bước." |

Không tầng hint nào nói ra con số **3.17** hay **17**, không nói "tần số bằng giờ", và không nói thẳng đáp án của slot A, C hoặc D. Số hint đã dùng hiện trong phần tóm tắt cuối game nhưng không bị trừ điểm.

---

## M. UI Flow

```text
Title → Intro → GAME SCREEN ⇄ [Inspect] [Case File] [Radio] [Nghĩ]
                     ⇅ (công tắc)
                PHÍA BÊN KIA (vùng sáng đèn pin)
                     ↓
                  Nhịp tắt radio → Ending
```

| UI | Loại | Ghi chú |
|---|---|---|
| **Hotspot trong scene** | **Gameplay** | Không có nhãn. Khi hover thì hơi sáng lên. Trên mobile, chạm lần đầu để làm nổi bật, chạm lần hai để xem. |
| **Công tắc đèn** | **Gameplay** | Là vật thể trong scene, không phải nút trên UI. Đây là cơ chế chính nên phải nằm *trong thế giới game*. |
| **Vùng sáng đèn pin** (phía bên kia) | **Gameplay** | Đi theo cursor, trên mobile thì kéo bằng ngón tay. Chỉ xem được thứ đang được soi sáng. |
| **Inspect** | **Gameplay** (chỉ với đồng hồ đeo tay, đồng hồ bên kia và nhật ký) | Phóng to ảnh. Không có pan hay rotate. Đồng hồ bên kia phải phóng to đủ để đếm được vạch phút. Các vật thể khác chỉ hiện một dòng mô tả. |
| **Radio (3 bánh xe + núm âm lượng)** | **Gameplay** | Là puzzle, cũng là nơi diễn ra khoảnh khắc kết (núm gãy, công tắc nguồn). Không có nút "Submit": dò trúng thì âm thanh tự thay đổi. |
| **Case File → Clues** | Nửa gameplay, nửa presentation | Mỗi card có ảnh chụp lại cảnh đã thấy và nhãn **Phía này / Phía bên kia**. Mở được ở cả hai phía. **Không** tự động ghép cặp các clue. |
| **Case File → Kết luận** | **Gameplay** | Câu có ô trống. Kéo hoặc chạm chip để điền. Có nút "Kết luận". |
| **Nhịp tắt radio** | **Gameplay** | Bấm công tắc nguồn trên radio, không có hộp thoại nhiều nút và không có lựa chọn. Sai thì radio tự bật lại. |
| **Nghĩ (hint)** | Hỗ trợ | Icon nhỏ ở góc, mờ đi khi chưa có hint. |
| Narration box | Presentation | Tối đa 2 dòng, tự ẩn đi. |
| Chuyển cảnh, đèn chớp, sương | Presentation | Khóa input trong lúc chạy. |
| Phụ đề giọng Theo | Presentation (cần cho accessibility) | |
| **HUD giờ** | **Bỏ** | Đồng hồ nằm trong scene. Đặt giờ trên HUD là làm lộ đáp án. |
| Ending screen | Presentation | Số clue 6/6, số lần thử tắt radio, số hint đã dùng, thời gian, và 1 dòng teaser. |

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
   | 8 | Radio ở 3.17 là cánh cửa nó đi qua, phải tắt lúc nó lặng | Genuine, dẫn vào khoảnh khắc kết |

2. **Người chơi có thể sai**: dò sai tần số (ví dụ 3.00), điền sai kết luận, tắt radio sai nhịp. Sai không bị phạt, nhưng người chơi sẽ biết là mình sai.
3. **Kiến thức của người chơi gate tiến trình, chứ không phải flag.** Không ô nào bị khóa vì "chưa đọc clue X". Người đoán nhanh có thể đi tắt.
4. **Mechanic chính được dùng để suy luận**, không chỉ để trang trí. Nếu bỏ cơ chế flip, P1 chỉ còn giải được bằng cách dò mò khoảng 60 giá trị, còn slot A, C, D và màn kết thì không giải được.
5. **Khoảnh khắc kết cần hiểu biết mới làm được có chủ đích** (vì sao phải tắt, không phải vặn to) và **nghe** để làm được (nhịp bước chân).
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
| Map, danger, stamina, noise, chase | Không phục vụ điều tra. Khoảnh khắc kết chỉ là một nhịp canh, không phải hệ thống. |
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
| **Nhịp tắt radio:** người chơi có nghe ra nhịp không? Thử mấy lần? | Số lần bấm tắt sai. Think-aloud có nhắc "đếm bước" không. | Nếu thử quá 5 lần thì kéo dài khoảng lặng giữa hai bước hoặc nhắc hint. |
| Bỏ lựa chọn có làm khoảnh khắc kết thành bị động không? | Phỏng vấn sau khi chơi | Nếu có, thêm một hành động phụ nhỏ, không phải lựa chọn hai hướng. |
| Có nhận ra hai lớp đồ (nâu cổ và sáng màu) ở phía bên kia không? | Nhắc đến trong lúc think-aloud | Tăng tương phản màu hai lớp. |
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
| **Nhật ký quá nặng chữ:** 6 dòng mang thông tin cho P1, slot A, slot D và màn kết | Có nguy cơ bị đọc lướt | Mỗi đêm một trang. |
| **Nhịp tắt radio** | Có nguy cơ khó nghe ra nhịp hoặc bấm sai nhiều lần | Bước chân cố định, radio rú theo từng bước, Theo dặn "nghe cho kỹ nhịp", hint tầng riêng ở mục L. Sai thì thử lại, không mất gì. |
| **Kết tuyến tính, không có lựa chọn** | Có nguy cơ thiếu cảm giác quyết định | Đo theo playtest criterion ở mục K. |
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
| Theo dặn đừng nói vào micro; núm gãy; bước chân đều | Làm sao không để nó nghe thấy Theo? | Giữ yên lặng | Nghe nhịp bước chân | **PHÁT HIỆN:** Nó đi theo một nhịp cố định |
| Nó đi ngang phòng Theo | Khi nào tắt được radio mà không bị nó nghe? | Tắt đúng lúc | Tắt radio giữa hai bước (sai thì thử lại) | Nó dừng ở cửa, cào nhẹ, rồi đi tiếp |
| Radio im, hai nốt huýt sáo xa | Theo có ổn không? | Kiểm tra | Sang phía bên kia | "EM ỔN. ĐÊM MAI. CÙNG GIỜ." bằng bút sáp, dưới vùng sáng đèn pin của Theo |

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
- **Hốc sàn**: quỳ xuống (camera hạ theo thảm), tấm ván lỏng trượt sang một bên, hơi lạnh bốc lên từ bên dưới. Chỉ chứa nhật ký; không gửi gì qua đó trong Chapter 0.
- **Công tắc / World Flip (2.5 s)**: tiếng tách → bóng đèn loé rồi tắt → radio xé tiếng → **một nhịp chớp thấy trọn căn phòng cũ** → tối lại → mắt quen dần, sương tràn vào từ cửa sổ và khe cửa, giấy dán tường ố hiện lên, đồ sáng màu của Theo chồng lên đồ nâu cổ, ngọn nến ở giá nến bật cháy → đèn pin chập chờn rồi sáng. HUD ẩn trong lúc chuyển. Trở về: thổi tắt nến.
- **Vạch đếm**: mỗi lần sang, vạch bút sáp mới được vẽ trước mắt. Nếu đã biết bức tường thì còn nghe tiếng bút sáp sột soạt, dù đèn pin không chiếu vào đó.

### Khoảnh khắc lớn

| Sự kiện | Timeline |
|---|---|
| Bước vào | Đen → khe sáng hành lang mở ra (cửa) → cửa đóng sau lưng → phòng im (radio bị giữ im) → **radio vọt lên**, camera kéo về phía nó → mới cho điều khiển |
| Liên lạc 3.17 | Số nhảy loạn → phòng lặng dần → giọng Theo → tiếng cào |
| Có thứ gì trong nhà (sau khi liên lạc) | 24–46 s một lần, không đều: radio to lên, đèn sụt, ván kêu, tiếng cào, một bóng đi ngang khe cửa. Không bao giờ cho thấy nó |

### Sống động nền

Mưa (tiếng và vệt trên kính), sét 30–70 s một lần kèm sấm trễ, rèm, cành cây, dây micro, kim giây, bụi trong ánh đèn, camera trôi nhẹ và lệch theo con trỏ. Mỗi thứ một nhịp lệch nhau để không thành vòng lặp. Phía bên kia không có mưa, không có đồng hồ chạy (con lắc đứng yên): chỉ drone, sương và bụi, ngọn nến chớp khẽ.

Thứ bậc: nền rất khẽ → tương tác rõ và vật lý → phát hiện mạnh hơn (tiếng rơi, lặng, ánh sáng) → sự kiện lớn là cả một chuỗi. Không phải tương tác nào cũng kịch tính như nhau.
