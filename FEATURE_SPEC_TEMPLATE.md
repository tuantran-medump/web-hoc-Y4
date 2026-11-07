# 📝 FEATURE_SPEC_TEMPLATE.md — Mẫu Mô Tả Tính Năng & Chia Việc Đa Agent v2.0
*(Tỷ lệ Tối ưu Quota: Codex GPT Pro 60% • Claude Pro 25% • Antigravity Gemini 15%)*

> **Cách dùng**: Khi chuẩn bị làm một tính năng lớn, bạn điền nhanh vào khung dưới đây (hoặc nhờ **Codex** / **Antigravity Flash** điền giúp), sau đó lưu nội dung vào `HANDOFF.md`.

---

## 1. Tổng quan Tính năng (Feature Overview)
- **Tên tính năng**: `[Ví dụ: Quản lý Ngân hàng Đề & Phòng Thi OSCE]`
- **Mục tiêu người dùng (User Story)**: `[Người dùng nạp đề PDF, làm bài có đồng hồ đếm ngược và tự chấm tự luận theo barem]`
- **Nhánh Git / Worktree trên Orca**: `feat/[ten-tinh-nang]`

---

## 2. Hợp đồng Dữ liệu Chung (`src/types/index.ts`)
*(Luôn chốt phần này ở Bước 0 để cả 3 Agent code khớp nhau 100%)*
- **Interfaces / Types cần thêm hoặc sửa**:
  ```ts
  // Định nghĩa tại src/types/ trước khi tách việc
  ```

---

## 3. Phân bổ Công việc theo Mô hình Kim Tự Tháp Ngược (Bảo vệ Quota `Argon 4`)

### A. Phần của Antigravity (`Gemini` — 15% tải • Dùng `Flash` hoặc Subagent `flash`)
- [ ] **Bước 0**: Dùng subagent `flash` quét repo, chốt `src/types/**` và điền `Context Brief` vào `HANDOFF.md`.
- [ ] **Bước Cuối**: Kiểm tra giao diện trực quan trên trình duyệt, gộp nhánh về `main` và `git push` lên GitHub (chạy trên model `Flash`).

### B. Phần của Claude Code (`Claude Pro` — 25% tải • Kiến trúc, Hooks & Design System)
- [ ] Thiết kế thuật toán lõi tại `src/lib/[tenModule]/index.ts` và Custom Hooks phức tạp tại `src/hooks/[useTenHook].ts`.
- [ ] Xây dựng bộ UI Components nền tảng tại `src/components/ui/**`.
- *(Lưu ý: Không tự quét cả repo, không sửa `package.json`, không chạy vòng lặp build/test).*

### C. Phần của Codex (`GPT Pro` — 60% tải • Chủ lực Full-Stack, Pages & QA)
- [ ] Viết Backend Service tại `src/server/**` và API Route tại `src/app/api/**`.
- [ ] Dựng các trang tính năng và ghép nối Full-stack tại `src/features/**` và `src/app/**`.
- [ ] Viết bộ Unit/Integration Tests tại `tests/unit/**`.
- [ ] Chạy vòng lặp `npm.cmd run typecheck` $\rightarrow$ `npm.cmd test` $\rightarrow$ `npm.cmd run build` $\rightarrow$ `npm.cmd audit` và sửa sạch mọi lỗi phát sinh.
