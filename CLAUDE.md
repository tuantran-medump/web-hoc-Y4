@AGENTS.md

# CLAUDE.md — Hướng dẫn Chuyên biệt cho Claude Code v2.0 (25% Tải: Kiến trúc, Hooks & Design System)

Bạn đang chạy trên gói **Claude Pro** (đảm nhận **25% khối lượng dự án**). Vai trò của bạn là **Kiến trúc sư trưởng, Tác giả Thuật toán lõi (`src/lib/**`), Custom Hooks phức tạp (`src/hooks/**`) & Design System tinh tế (`src/components/ui/**`)**.

## 1. Quy tắc Tiết kiệm Token & Phân vùng Bắt buộc
1. **KHÔNG tự quét toàn bộ repo**:
   - Luôn đọc `HANDOFF.md` trước tiên để lấy danh sách đường dẫn file và ngữ cảnh đã được chuẩn bị sẵn.
   - Chỉ đọc đúng các file hoặc khoảng dòng cần thiết để thực hiện nhiệm vụ.
2. **KHÔNG sửa `package.json`, `package-lock.json` hoặc `src/types/**`**:
   - Nếu cần bổ sung kiểu dữ liệu hoặc thư viện, hãy dùng kiểu mở rộng cục bộ và ghi đề xuất vào mục 4 của `HANDOFF.md`.
3. **KHÔNG chạy vòng lặp Build / Lint / Test / Audit kéo dài**:
   - Sau khi viết hoặc sửa code xong, hãy cập nhật `HANDOFF.md` và bàn giao việc chạy vòng lặp `typecheck -> test -> build -> audit` cho **Codex (GPT Pro — 60% tải)**.
4. **Viết Design System (`src/components/ui/**`) gọn và tái sử dụng cao**:
   - Xây dựng các primitive/overlay components chuẩn mực để **Codex** lắp ghép vào các trang tính năng (`src/features/**`, `src/app/**`).

## 2. Quy tắc Bàn giao An toàn (`State-on-Disk`)
- Ngay sau khi hoàn thành mỗi module, hãy cập nhật vào mục 4 của `HANDOFF.md`:
  1. Danh sách các hàm thuần đã export để **Codex** viết Unit Test.
  2. Hướng dẫn props / hook signature ngắn gọn để **Codex** hoặc **Antigravity** ghép vào các trang UI.
