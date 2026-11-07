# MẪU ĐỊNH DẠNG TÀI LIỆU (MD → PDF) CÓ CHÚ THÍCH NGUỒN + PROMPT CHO AI

> Dùng cho **Web con 2 (Thư viện)**. Nguồn gốc là file **Markdown** trên Google Drive. Web dựng ra trình đọc dạng PDF và xuất PDF.
> Mỗi nội dung (đoạn chữ, ý trong danh sách, hình, bảng) đều phải có **chú thích nguồn có đánh số**, và mỗi chú thích là **một link Google Drive**.

---

## 1. Cấu trúc thư mục trên Google Drive

```
📁 Thu-vien-Y4/                 ← DRIVE_ROOT_FOLDER_ID
├─ _nguon.md                    ← (không bắt buộc) danh mục nguồn dùng chung cho mọi tài liệu
├─ 📁 Noi-khoa/
│  ├─ suy-tim.md
│  ├─ tang-huyet-ap.md
│  └─ 📁 hinh/
│     ├─ suy-tim-sinh-ly-benh.png
│     └─ ecg-phi-dai-that-trai.jpg
└─ 📁 Ngoai-khoa/
   └─ ...
```

- Mỗi tài liệu là một file `.md`. Ảnh để trong thư mục `hinh/` cạnh file và chèn bằng **đường dẫn tương đối**.
- Link nguồn trỏ tới **file khác trên Drive** (giáo trình, guideline, bài báo PDF), **không** trỏ tới file `.md` trong thư viện.

---

## 2. Quy tắc định dạng Markdown

### 2.1. Đầu file (front matter)
```yaml
---
title: Suy tim mạn — Chẩn đoán và điều trị
tags: [noi-khoa, tim-mach]
author: Tên bạn
updated: 2026-11-07
---
```

### 2.2. Chú thích nguồn (footnote)
- **Đặt marker ngay sau nội dung được dẫn nguồn**: `...câu văn.[^esc2021]`
- **Khoá** (`esc2021`) là chữ thường, không dấu, không khoảng trắng. Web tự **đánh số 1, 2, 3…** theo thứ tự xuất hiện, nên không cần đặt khoá là số.
- **Định nghĩa** nằm cuối file hoặc trong `_nguon.md`, đúng dạng:
  ```
  [^esc2021]: [ESC Heart Failure Guidelines 2021](https://drive.google.com/file/d/XXXX/view)
  ```
  Định nghĩa trong file được ưu tiên hơn định nghĩa trùng khoá trong `_nguon.md`.
- **Quy tắc chia đoạn (quan trọng cho tô màu)**: phần chữ từ sau marker trước tới marker hiện tại thuộc nguồn của marker hiện tại. Vì vậy:
  - Mỗi đoạn văn phải **kết thúc bằng một marker**.
  - Nếu một đoạn có nhiều nguồn, đặt marker ở cuối từng câu hoặc cụm câu tương ứng.
  - Hình: marker đặt trong caption. Bảng: marker đặt ở dòng caption ngay dưới bảng.
  - Heading (`#`, `##`) không cần marker.
- **Không** để link trần hoặc `[chữ](url)` trong thân bài với mục đích dẫn nguồn. Trình đọc **ẩn mọi link trong thân bài** (chỉ giữ chữ). Link chỉ hiện trong tooltip chú thích.

### 2.3. Hình
```markdown
![Sinh lý bệnh suy tim](./hinh/suy-tim-sinh-ly-benh.png)
*Hình 1. Vòng xoắn bệnh lý trong suy tim.*[^harrison21]
```

### 2.4. Bảng
```markdown
| Phân độ NYHA | Triệu chứng |
|---|---|
| I | Không giới hạn vận động |
| II | Giới hạn nhẹ |
| III | Giới hạn rõ |
| IV | Triệu chứng khi nghỉ |

*Bảng 1. Phân độ chức năng NYHA.*[^esc2021]
```

---

## 3. Tài liệu mẫu đầy đủ (`suy-tim.md`)

```markdown
---
title: Suy tim mạn — Chẩn đoán và điều trị
tags: [noi-khoa, tim-mach]
updated: 2026-11-07
---

# Suy tim mạn

## 1. Định nghĩa

Suy tim là một hội chứng lâm sàng gồm các triệu chứng cơ năng điển hình như khó thở, phù chân và mệt mỏi, có thể kèm dấu hiệu thực thể.[^esc2021] Nguyên nhân là bất thường cấu trúc hoặc chức năng tim, dẫn tới tăng áp lực trong buồng tim hoặc giảm cung lượng tim.[^harrison21]

## 2. Phân loại theo phân suất tống máu

- Suy tim EF giảm (HFrEF): EF ≤ 40%.[^esc2021]
- Suy tim EF giảm nhẹ (HFmrEF): EF 41–49%.[^esc2021]
- Suy tim EF bảo tồn (HFpEF): EF ≥ 50%, kèm bằng chứng bất thường cấu trúc hoặc tăng peptide lợi niệu.[^bnyhd]

## 3. Sinh lý bệnh

![Sinh lý bệnh suy tim](./hinh/suy-tim-sinh-ly-benh.png)
*Hình 1. Vòng xoắn hoạt hoá thần kinh thể dịch trong suy tim.*[^harrison21]

Hoạt hoá hệ renin–angiotensin–aldosteron và hệ giao cảm ban đầu giúp bù trừ.[^harrison21] Về lâu dài, chính các cơ chế này gây tái cấu trúc thất và làm suy tim nặng hơn.[^bnyhd]

## 4. Phân độ chức năng

| Phân độ NYHA | Triệu chứng |
|---|---|
| I | Không giới hạn vận động thể lực |
| II | Giới hạn nhẹ, triệu chứng khi gắng sức thông thường |
| III | Giới hạn rõ, triệu chứng khi gắng sức nhẹ |
| IV | Triệu chứng cả khi nghỉ |

*Bảng 1. Phân độ chức năng NYHA.*[^esc2021]

## 5. Điều trị HFrEF

Bốn nhóm thuốc nền tảng gồm ARNI hoặc ACEi, chẹn beta, MRA và SGLT2i.[^esc2021] Nên khởi trị sớm và tăng liều dần tới liều đích dung nạp được.[^bnyhd]

[^esc2021]: [ESC Heart Failure Guidelines 2021](https://drive.google.com/file/d/AAAA/view)
[^harrison21]: [Harrison's Principles of Internal Medicine, 21e — Chương 257](https://drive.google.com/file/d/BBBB/view)
[^bnyhd]: [Bệnh học Nội khoa, ĐH Y Hà Nội — Bài Suy tim](https://drive.google.com/file/d/CCCC/view)
```

### Kết quả mong đợi trong trình đọc

| Đoạn | Nguồn | Màu |
|---|---|---|
| Định nghĩa, câu 1 | [1] ESC | 🟦 xanh dương |
| Định nghĩa, câu 2 | [2] Harrison | 🟧 cam (khác màu vì liền kề) |
| Ý HFrEF, HFmrEF | [1] ESC | 🟦 |
| Ý HFpEF | [3] Bệnh học | 🟩 xanh lá |
| Hình 1 | [2] Harrison | 🟧 |
| Sinh lý bệnh, câu 1 | [2] Harrison | 🟧 (cùng nguồn với Hình 1 nên cùng màu, liền kề cùng nguồn vẫn hợp lệ) |
| Sinh lý bệnh, câu 2 | [3] Bệnh học | 🟩 |
| Bảng 1 | [1] ESC | 🟦 |
| Điều trị, câu 1 / câu 2 | [1] / [3] | 🟦 / 🟩 |

- Rê chuột (PC) hoặc chạm (iPad, điện thoại) vào số `[2]` hoặc vào đoạn màu cam → tooltip: **[2] Harrison's Principles… — Mở trên Google Drive ↗**.
- Trong thân bài không có link nào bấm được.

---

## 4. Bố cục PDF khi xuất từ web

```
┌────────────────────────── A4 ──────────────────────────┐
│ Suy tim mạn — Chẩn đoán và điều trị      noi-khoa · …  │ ← header
│────────────────────────────────────────────────────────│
│ # Suy tim mạn                                          │
│ ## 1. Định nghĩa                                       │
│ ░░░ Suy tim là một hội chứng … dấu hiệu thực thể.¹ ░░░ │ ← nền xanh nhạt
│ ▒▒▒ Nguyên nhân là bất thường … cung lượng tim.²  ▒▒▒ │ ← nền cam nhạt
│ …                                                      │
│ [Hình 1]                                               │
│ Hình 1. Vòng xoắn …²                                   │
│ …                                                      │
│────────────────────────────────────────────────────────│
│ NGUỒN                                                  │ ← trang cuối
│ [1] ESC Heart Failure Guidelines 2021 — drive.google…  │   (link bấm được)
│ [2] Harrison's … Chương 257 — drive.google…            │
│ [3] Bệnh học Nội khoa … — drive.google…                │
│                                         Trang 3 / 3    │ ← footer
└────────────────────────────────────────────────────────┘
```

- Số chú thích hiện dạng chỉ số trên, màu chữ trùng màu nguồn (đậm hơn màu nền).
- Có chú giải màu (legend) nhỏ ở đầu tài liệu: ô màu → [n] tên nguồn.
- Tuỳ chọn khi xuất: **Có màu** (mặc định) hoặc **Đen trắng** (bỏ nền màu, giữ số chú thích và trang Nguồn).

---

## 5. PROMPT CHO AI TẠO TÀI LIỆU ĐÚNG MẪU

> Đính kèm các file nguồn (PDF giáo trình, guideline…) và **danh sách link Drive** tương ứng của từng file. AI trả về file `.md`. Bạn lưu file đó lên Drive, rồi bấm "Cập nhật từ Drive" trên web. Web sẽ dựng trình đọc và xuất PDF đúng bố cục ở mục 4.

```text
Bạn là trợ lý biên soạn tài liệu học y khoa. Hãy viết một tài liệu Markdown về chủ đề: <CHỦ ĐỀ>.

NGUỒN ĐƯỢC PHÉP DÙNG (chỉ dùng thông tin từ các nguồn này, không bịa thêm):
- khoá: esc2021 | tên: ESC Heart Failure Guidelines 2021 | link: https://drive.google.com/file/d/AAAA/view
- khoá: harrison21 | tên: Harrison's 21e — Chương 257 | link: https://drive.google.com/file/d/BBBB/view
- khoá: bnyhd | tên: Bệnh học Nội khoa ĐH Y HN — Suy tim | link: https://drive.google.com/file/d/CCCC/view
(Tôi đính kèm nội dung các nguồn này.)

ĐỊNH DẠNG BẮT BUỘC
1. Mở đầu bằng front matter:
   ---
   title: <tiêu đề>
   tags: [<tag1>, <tag2>]
   updated: <YYYY-MM-DD>
   ---
2. Dùng "#" cho tiêu đề tài liệu, "##" và "###" cho các mục, có đánh số mục (1., 1.1.).
3. CHÚ THÍCH NGUỒN:
   - MỌI đoạn văn, MỌI ý trong danh sách, MỌI caption hình và bảng đều phải KẾT THÚC bằng marker chú thích dạng [^khoá].
   - Nếu một đoạn dùng nhiều nguồn, tách câu và đặt marker ngay sau câu hoặc cụm câu lấy từ nguồn đó. Phần chữ nằm giữa marker trước và marker sau được hiểu là thuộc nguồn của marker sau.
   - Chỉ dùng các khoá trong danh sách nguồn ở trên. Không tự tạo khoá mới.
   - Heading không có marker.
4. KHÔNG chèn link nào trong thân bài (không có [chữ](url), không có URL trần). Link chỉ xuất hiện trong phần định nghĩa chú thích ở cuối file.
5. HÌNH: dùng ![mô tả](./hinh/<ten-file>.png). Dòng ngay dưới là caption in nghiêng: *Hình n. <mô tả>.*[^khoá]. Nếu cần hình mà tôi chưa có, vẫn chèn cú pháp này với tên file gợi ý và ghi trong mục "CẦN BỔ SUNG" ở cuối.
6. BẢNG: Markdown table, hàng đầu là tiêu đề, không gộp ô. Dòng ngay dưới bảng là caption in nghiêng: *Bảng n. <tên>.*[^khoá]
7. Cuối file liệt kê định nghĩa chú thích, mỗi dòng một nguồn, đúng dạng:
   [^khoá]: [Tên nguồn](link Google Drive)
   Chỉ liệt kê các nguồn thực sự được dùng.
8. Văn phong: tiếng Việt chuẩn y khoa, câu ngắn, giữ thuật ngữ tiếng Anh trong ngoặc khi cần. Không viết lời mở đầu hay lời kết ngoài tài liệu.
9. Sau phần định nghĩa chú thích, thêm khối:
   <!-- CẦN BỔ SUNG
   - danh sách hình cần chèn, thông tin bạn không chắc hoặc nguồn còn thiếu
   -->
   (Đây là comment HTML, trình đọc sẽ không hiển thị.)

ĐẦU RA: Một khối Markdown duy nhất, có thể lưu thẳng thành file .md.
```

### Prompt kiểm tra tài liệu trước khi đưa lên Drive

```text
Kiểm tra file Markdown dưới đây theo các quy tắc: (1) mọi đoạn, ý danh sách, caption hình và bảng đều kết thúc bằng [^khoá]; (2) mọi khoá dùng trong bài đều có định nghĩa dạng [^khoá]: [Tên](https://drive.google.com/...); (3) thân bài không có link; (4) mỗi hình và bảng có caption đánh số. Liệt kê lỗi theo dạng "Dòng/đoạn: lỗi → cách sửa". Không sửa nội dung chuyên môn.
```

### (Tuỳ chọn) Dùng file `_nguon.md` chung

Nếu nhiều tài liệu dùng chung nguồn, khai báo một lần trong `_nguon.md` ở thư mục gốc:

```markdown
[^esc2021]: [ESC Heart Failure Guidelines 2021](https://drive.google.com/file/d/AAAA/view)
[^harrison21]: [Harrison's Principles of Internal Medicine, 21e](https://drive.google.com/file/d/BBBB/view)
```

Sau đó các tài liệu chỉ cần đặt marker `[^esc2021]` mà không cần định nghĩa lại ở cuối file. Khi dùng cách này, bỏ quy tắc 7 trong prompt và thay bằng: "Không cần viết định nghĩa chú thích, các khoá đã có trong `_nguon.md`."
