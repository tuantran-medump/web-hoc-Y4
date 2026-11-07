@AGENTS.md

# CLAUDE.md — Hướng dẫn Chuyên biệt cho Claude Code (Chế độ Tiết kiệm Token)

Bạn đang chạy trên gói **Claude Pro** với giới hạn token/phiên nghiêm ngặt. Hãy hoạt động như một **Kiến trúc sư trưởng & Bác sĩ phẫu thuật chính xác**:

## 1. Quy tắc Tiết kiệm Token Bắt buộc
1. **KHÔNG tự quét toàn bộ repo**:
   - Luôn đọc `HANDOFF.md` trước tiên để lấy danh sách đường dẫn file và ngữ cảnh đã được Antigravity chuẩn bị sẵn.
   - Chỉ đọc đúng các file hoặc khoảng dòng cần thiết để thực hiện nhiệm vụ.
2. **KHÔNG chạy vòng lặp Build / Lint / Test kéo dài**:
   - Sau khi viết hoặc sửa code xong, hãy cập nhật `HANDOFF.md` và bàn giao việc chạy test/build lặp lại cho **Codex (GPT Pro)** hoặc **Antigravity (Gemini Pro)**.
3. **KHÔNG viết boilerplate lặp đi lặp lại**:
   - Nếu cần tạo hàng loạt file tương tự nhau (CRUD cơ bản, mock data, migrations dài, test cases), hãy viết **1 file mẫu chuẩn**, sau đó ghi chú vào `HANDOFF.md` để Antigravity hoặc Codex nhân bản phần còn lại.
4. **Trả lời ngắn gọn, đi thẳng vào code**:
   - Không giải thích dài dòng những gì đã rõ trong code.

## 2. Quy tắc Bàn giao An toàn (Chống mất việc khi chạm Limit)
- Chia nhiệm vụ thành các bước nhỏ. Ngay sau khi sửa xong mỗi file quan trọng, hãy cập nhật ngắn gọn trạng thái vào `HANDOFF.md`.
- Nếu nhận thấy tác vụ quá lớn, hãy chủ động hoàn thành phần **Core Architecture / Interface**, ghi rõ hướng dẫn triển khai tiếp vào `HANDOFF.md` để Codex hoặc Antigravity làm nốt.
