# GEMINI.md — Hướng dẫn Chuyên biệt cho Antigravity (Chế độ Bảo vệ Quota `Argon 4` Tuyệt đối)

Bạn đang vận hành trên **Antigravity**. Định mức tuần của model **`Argon 4`** rất quý và dễ bị tiêu hao nhanh nếu tích luỹ context qua nhiều bước. Vì vậy, bạn **BẮT BUỘC** tuân thủ kỷ luật tiết kiệm định mức dưới đây:

## 1. Quy tắc Sống còn để Không Bao Giờ Tốn Quá 5–8% Quota `Argon 4`
1. **BẮT BUỘC uỷ quyền cho Subagent `Model: "flash"` (`invoke_subagent`)**:
   - Khi cần đọc hơn 2 file, quét codebase, đọc tài liệu dài, tạo/sửa nhiều file UI hoặc chạy lệnh kiểm tra, bạn **PHẢI** gọi `invoke_subagent` với **`Model: "flash"`** (hoặc `"flash_lite"`).
   - Tuyệt đối **KHÔNG** tự đọc hàng nghìn dòng code hay tự viết 10–15 file trực tiếp trong phiên chat chính của `Argon 4`.
2. **Nhường phần viết Code nặng & Vòng lặp Build/Test cho `Codex (GPT Pro)`**:
   - Đừng tự ôm việc dựng toàn bộ các trang `src/app/**` hay `src/features/**`. Hãy định nghĩa hợp đồng dữ liệu gọn gàng trong `src/types/**`, ghi rõ yêu cầu vào `HANDOFF.md` rồi tạo câu lệnh để người dùng giao cho **Codex (`GPT Pro` — 60% tải)** và **Claude (`Claude Pro` — 25% tải)** thực thi.
3. **Nhắc người dùng dùng `/compact` hoặc chuyển sang model `Flash`**:
   - Khi cuộc hội thoại vượt quá 8–10 lượt hoặc khi chuyển sang các tác vụ thường ngày (chạy dev server, gộp nhánh, `git push`), hãy chủ động nhắc người dùng gõ `/compact` hoặc chuyển dropdown Model sang **`Flash`**.

## 2. Nhiệm vụ Cốt lõi của Antigravity (15% khối lượng dự án)
1. **Bước 0 (Orchestrator gọn nhẹ)**: Dùng subagent `flash` quét repo, chốt `src/types/**`, điền `HANDOFF.md` và in ra câu lệnh phân việc cho **Claude** và **Codex**.
2. **Kiểm thử Trình duyệt & Đa phương thức**: Xem ảnh chụp màn hình, kiểm tra giao diện trực quan và tinh chỉnh nhẹ.
3. **Bước Cuối (Release Manager)**: Gộp nhánh về `main` và `git push` lên GitHub.
