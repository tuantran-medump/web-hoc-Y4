# MẪU ĐỊNH DẠNG ĐỀ THI PDF + PROMPT CHO AI

> Mục đích: mọi đề nạp vào **Web con 1 (Thi thử)** phải theo đúng định dạng này để parser (`src/lib/exam-parser`) đọc chính xác câu hỏi, lựa chọn, ảnh, bảng, đáp án và ghi chú.
> Quy trình: đề gốc (PDF/Word/ảnh chụp) → đưa cho AI kèm **Prompt ở mục 4** → AI trả về đề đúng mẫu → xuất PDF → nạp vào web.

---

## 1. Quy tắc định dạng (bắt buộc)

### 1.1. Trang giấy
- Khổ A4, dọc, lề 2 cm. **Một cột** (không chia 2 cột, parser sẽ đọc lẫn dòng).
- Font có Unicode tiếng Việt (Times New Roman, Arial, Be Vietnam Pro), cỡ 12–13.
- PDF phải **có lớp chữ** (chọn và copy được chữ). PDF scan thì phải chạy OCR trước.
- Không dùng header/footer có chữ "Câu", "Đáp án" (dễ bị nhận nhầm là marker).

### 1.2. Marker: mỗi marker nằm ĐẦU DÒNG

| Marker | Ý nghĩa | Ví dụ |
|---|---|---|
| `ĐỀ:` | Tên đề (dòng đầu tiên) | `ĐỀ: Thi thử Nội khoa — Tim mạch 01` |
| `MÔN:` | Môn | `MÔN: Nội khoa` |
| `THỜI GIAN:` | Tổng thời gian (phút) | `THỜI GIAN: 45 phút` |
| `CHẾ ĐỘ:` | `Thường` hoặc `Trạm` | `CHẾ ĐỘ: Thường` |
| `TAG:` | Tag cách nhau bằng dấu phẩy (đặt ở đầu đề hoặc sau một câu) | `TAG: tim mạch, suy tim` |
| `PHẦN <số La Mã>.` | Phần của đề | `PHẦN I. TRẮC NGHIỆM` |
| `TRẠM <n> (<x> phút).` | Bắt đầu một trạm (chỉ dùng khi `CHẾ ĐỘ: Trạm`) | `TRẠM 2 (5 phút). Khám tim` |
| `Tình huống:` | Bệnh cảnh chung của trạm | |
| `Câu <n>.` hoặc `Câu <n> (<x> điểm).` | Bắt đầu câu hỏi. Đánh số liên tục trong toàn đề. | `Câu 3 (2 điểm).` |
| `A.` `B.` … `F.` | Lựa chọn trắc nghiệm, mỗi lựa chọn một dòng | `A. Furosemid` |
| `Đ/S:` | Đánh dấu câu đúng/sai (không có lựa chọn A–F) | |
| `Đáp án:` | Đáp án trắc nghiệm. Nhiều đáp án thì cách nhau bằng dấu phẩy. Câu Đ/S thì ghi `Đúng` hoặc `Sai`. | `Đáp án: B` · `Đáp án: A, C` |
| `Đáp án mẫu:` | Đáp án câu tự luận (nhiều dòng, kéo dài tới marker tiếp theo) | |
| `Barem:` | Bắt đầu barem tự chấm | |
| `- Ý <n> (<x> đ):` | Một ý chấm điểm trong barem | `- Ý 1 (0.5 đ): Nêu đúng 3 triệu chứng` |
| `Ghi chú:` | Giải thích, nguồn, mẹo nhớ | |
| `Hình <n>:` | Caption ảnh, đặt NGAY DƯỚI ảnh | `Hình 1: ECG 12 chuyển đạo` |
| `Bảng <n>:` | Caption bảng, đặt NGAY TRÊN bảng | `Bảng 1: Kết quả xét nghiệm` |
| `---` | Đường kẻ ngang ngăn cách các câu (không bắt buộc, giúp dễ đọc) | |

### 1.3. Ảnh và bảng
- Ảnh đặt **giữa dòng `Câu n.` và dòng `A.`** (thuộc phần thân câu), hoặc ngay sau một lựa chọn (thuộc lựa chọn đó). Chiều rộng không quá 16 cm, không cho chữ chạy vòng quanh ảnh.
- Bảng phải là **bảng thật** có đường kẻ ô (không dùng tab hoặc khoảng trắng để giả bảng). Hàng đầu là tiêu đề, không gộp ô.
- Mỗi ảnh hoặc bảng có caption `Hình n:` hoặc `Bảng n:` để parser định vị.

### 1.4. Thứ tự trong một câu
```
Câu n (x điểm).      ← bắt buộc
<thân câu, có thể kèm ảnh/bảng>
A. ... B. ... (trắc nghiệm)   |   (tự luận: không có lựa chọn)
Đáp án: ...          ← bắt buộc với trắc nghiệm
Đáp án mẫu: ...      ← bắt buộc với tự luận
Barem:               ← nên có với tự luận (tổng điểm các ý = điểm câu)
- Ý 1 (… đ): ...
Ghi chú: ...         ← không bắt buộc
TAG: ...             ← không bắt buộc
```

### 1.5. Câu hỏi được nhận diện thế nào
- Có `A.`–`F.` và `Đáp án:` chứa một chữ cái → `mcq_single`.
- `Đáp án:` chứa từ hai chữ cái trở lên → `mcq_multi`.
- Có `Đ/S:` → `true_false`.
- Không có lựa chọn nhưng có `Đáp án mẫu:` → `essay` (tự chấm theo barem).

---

## 2. Đề mẫu (copy vào Word/Google Docs rồi xuất PDF)

```
ĐỀ: Thi thử Nội khoa — Tim mạch 01
MÔN: Nội khoa
THỜI GIAN: 30 phút
CHẾ ĐỘ: Thường
TAG: tim mạch, Y4

PHẦN I. TRẮC NGHIỆM

Câu 1 (1 điểm).
Thuốc nào sau đây là lợi tiểu quai?
A. Hydrochlorothiazid
B. Furosemid
C. Spironolacton
D. Acetazolamid
Đáp án: B
Ghi chú: Furosemid ức chế đồng vận chuyển Na-K-2Cl ở nhánh lên quai Henle.
TAG: dược lý, lợi tiểu
---
Câu 2 (1 điểm).
Quan sát ECG dưới đây:
[ẢNH ECG]
Hình 1: ECG 12 chuyển đạo của bệnh nhân nam 58 tuổi đau ngực
Những chuyển đạo nào có ST chênh lên?
A. DII, DIII, aVF
B. V1–V4
C. DI, aVL
D. V5, V6
Đáp án: A, D
Ghi chú: Nhồi máu thành dưới lan sang thành bên.
---
Câu 3 (1 điểm).
Đ/S: BNP < 100 pg/mL giúp loại trừ suy tim cấp ở bệnh nhân khó thở cấp.
Đáp án: Đúng

PHẦN II. TỰ LUẬN

Câu 4 (3 điểm).
Bệnh nhân nữ 65 tuổi có kết quả xét nghiệm sau:
Bảng 1: Kết quả xét nghiệm
| Chỉ số     | Kết quả | Bình thường |
| Na+        | 128     | 135–145     |
| Creatinin  | 180     | 60–110      |
| NT-proBNP  | 4500    | < 125       |
Hãy nêu chẩn đoán sơ bộ và hướng xử trí ban đầu.
Đáp án mẫu:
Suy tim cấp mất bù kèm hạ natri máu và tổn thương thận cấp.
Xử trí: nằm đầu cao, thở oxy nếu SpO2 < 90%, lợi tiểu quai tĩnh mạch, hạn chế nước, theo dõi điện giải và creatinin.
Barem:
- Ý 1 (1 đ): Chẩn đoán suy tim cấp mất bù
- Ý 2 (0.5 đ): Nêu hạ natri máu
- Ý 3 (0.5 đ): Nêu tổn thương thận cấp
- Ý 4 (1 đ): Hướng xử trí đủ 3 ý trở lên
Ghi chú: Tham khảo ESC Heart Failure Guidelines 2021.
```

### Mẫu thi trạm

```
ĐỀ: OSCE Nội khoa 01
MÔN: Nội khoa
THỜI GIAN: 10 phút
CHẾ ĐỘ: Trạm

TRẠM 1 (5 phút). Hỏi bệnh đau ngực
Tình huống: Bệnh nhân nam 55 tuổi vào viện vì đau ngực trái 2 giờ.
Câu 1 (5 điểm).
Liệt kê các câu hỏi cần khai thác để phân biệt đau ngực do mạch vành.
Đáp án mẫu:
Vị trí, tính chất, hướng lan, thời gian, yếu tố khởi phát và giảm đau, triệu chứng kèm theo, yếu tố nguy cơ.
Barem:
- Ý 1 (1 đ): Vị trí và hướng lan
- Ý 2 (1 đ): Tính chất và thời gian
- Ý 3 (1 đ): Yếu tố khởi phát/giảm
- Ý 4 (1 đ): Triệu chứng kèm
- Ý 5 (1 đ): Yếu tố nguy cơ tim mạch

TRẠM 2 (5 phút). Đọc ECG
Tình huống: ECG của cùng bệnh nhân.
[ẢNH ECG]
Hình 1: ECG lúc nhập viện
Câu 2 (1 điểm).
Vùng nhồi máu là?
A. Thành trước
B. Thành dưới
C. Thành bên
D. Thành sau
Đáp án: B
```

> Antigravity (SA-PARSE): dựng file `docs/mau/de-mau.pdf` và `docs/mau/de-mau-tram.pdf` từ hai mẫu trên (có ảnh ECG giả và bảng thật) để làm fixture, đồng thời cho người dùng tải từ trang `/thi/nap-de`.

---

## 3. Lỗi thường gặp mà parser sẽ báo

| Lỗi | Ví dụ sai | Sửa |
|---|---|---|
| Lựa chọn nằm chung một dòng | `A. X   B. Y   C. Z` | Mỗi lựa chọn một dòng |
| Đáp án ghi kiểu khác | `ĐA: b`, `Đáp án đúng là B` | `Đáp án: B` |
| Đánh số câu lại từ đầu ở mỗi phần | Phần II bắt đầu từ `Câu 1.` | Đánh số liên tục |
| Bảng giả bằng tab | — | Dùng bảng thật |
| Barem không cộng đủ điểm | Câu 3 điểm, barem cộng ra 2.5 | Sửa điểm từng ý |
| Đề 2 cột | — | Chuyển về 1 cột |

---

## 4. PROMPT CHO AI ĐỊNH DẠNG LẠI ĐỀ

> Dùng với ChatGPT, Gemini hoặc Claude. Đính kèm file đề gốc (PDF, ảnh hoặc Word) rồi dán prompt dưới đây.

```text
Bạn là trợ lý biên tập đề thi y khoa. Nhiệm vụ: chuyển đề tôi đính kèm sang ĐÚNG định dạng dưới đây để một chương trình máy đọc tự động. Không được thêm, bớt hay sửa nội dung chuyên môn.

QUY TẮC BẮT BUỘC
1. Dòng đầu là thông tin đề, mỗi thông tin một dòng:
   ĐỀ: <tên đề>
   MÔN: <môn>
   THỜI GIAN: <số> phút
   CHẾ ĐỘ: Thường   (hoặc "Trạm" nếu là đề OSCE/thi trạm)
   TAG: <tag1>, <tag2>
2. Chia phần bằng "PHẦN I. ...", "PHẦN II. ...". Với đề trạm, mỗi trạm bắt đầu bằng "TRẠM <n> (<x> phút). <tên trạm>" rồi tới "Tình huống: ...".
3. Mỗi câu bắt đầu ở đầu dòng bằng "Câu <n> (<x> điểm)." và đánh số LIÊN TỤC trong cả đề. Nếu đề gốc không ghi điểm thì trắc nghiệm để 1 điểm, tự luận giữ nguyên điểm nếu có, không có thì để trống phần điểm và báo tôi.
4. Trắc nghiệm: mỗi lựa chọn một dòng, bắt đầu bằng "A. ", "B. ", ... (tối đa F). Sau các lựa chọn là "Đáp án: X". Nhiều đáp án đúng thì ghi "Đáp án: A, C".
5. Câu đúng/sai: thân câu bắt đầu bằng "Đ/S: ", sau đó là "Đáp án: Đúng" hoặc "Đáp án: Sai".
6. Tự luận: sau thân câu là "Đáp án mẫu:" rồi đến nội dung. Tiếp theo là "Barem:" với từng ý dạng "- Ý <n> (<x> đ): <nội dung>". Tổng điểm các ý phải bằng điểm câu. Nếu đề gốc không có barem, tự chia barem hợp lý theo đáp án mẫu và ghi "[AI đề xuất]" ở cuối dòng "Barem:".
7. Ghi chú hoặc giải thích (nếu có) đặt sau đáp án, bắt đầu bằng "Ghi chú: ".
8. Ảnh: giữ ảnh ở đúng vị trí. Ngay dưới ảnh ghi "Hình <n>: <mô tả ngắn>". Nếu bạn không chèn được ảnh, ghi "[ẢNH: mô tả ảnh, trang <x> đề gốc]" để tôi chèn tay.
9. Bảng: dùng bảng thật (Markdown table), hàng đầu là tiêu đề, không gộp ô. Ngay trên bảng ghi "Bảng <n>: <tên bảng>".
10. Giữa các câu có một dòng "---".
11. Không dùng định dạng 2 cột. Không thêm lời mở đầu hay lời kết.
12. Nếu đề gốc thiếu đáp án ở câu nào, ghi "Đáp án: ?" và liệt kê các câu đó ở CUỐI, sau dòng "=== CẦN KIỂM TRA ===". Nếu có câu nào bạn không chắc đã đọc đúng (chữ mờ, công thức), cũng liệt kê ở đó.

ĐẦU RA
- Trả về toàn bộ đề trong MỘT khối Markdown.
- Sau đó tôi sẽ dán vào Google Docs/Word, chỉnh font Times New Roman 13, lề 2 cm, một cột, rồi xuất PDF.

VÍ DỤ ĐÚNG ĐỊNH DẠNG
Câu 1 (1 điểm).
Thuốc nào sau đây là lợi tiểu quai?
A. Hydrochlorothiazid
B. Furosemid
C. Spironolacton
D. Acetazolamid
Đáp án: B
Ghi chú: Furosemid ức chế đồng vận chuyển Na-K-2Cl ở nhánh lên quai Henle.
---
Câu 2 (3 điểm).
Nêu chẩn đoán và xử trí ban đầu suy tim cấp.
Đáp án mẫu:
...
Barem:
- Ý 1 (1 đ): ...
- Ý 2 (2 đ): ...
```

### Prompt kiểm tra lại (chạy sau khi AI định dạng xong)

```text
Kiểm tra đề dưới đây theo đúng các quy tắc định dạng tôi đã đưa. Liệt kê từng lỗi theo dạng "Câu n: lỗi gì → sửa thế nào". Kiểm tra: đánh số liên tục, mỗi lựa chọn một dòng, mọi câu trắc nghiệm có "Đáp án:", mọi câu tự luận có "Đáp án mẫu:", tổng điểm barem bằng điểm câu, mỗi ảnh có "Hình n:", mỗi bảng có "Bảng n:". Không sửa nội dung chuyên môn.
```
