# 📝 FEATURE_SPEC_TEMPLATE.md — Mẫu Mô Tả Tính Năng & Chia Việc Đa Agent

> **Cách dùng**: Khi bạn chuẩn bị làm một tính năng lớn, bạn có thể điền nhanh vào khung dưới đây (hoặc copy đưa cho **Antigravity** điền giúp), sau đó lưu nội dung vào `HANDOFF.md`.

---

## 1. Tổng quan Tính năng (Feature Overview)
- **Tên tính năng**: `[Ví dụ: Quản lý Giỏ hàng & Thanh toán]`
- **Mục tiêu người dùng (User Story)**: `[Người dùng có thể thêm sản phẩm vào giỏ, tính tổng tiền tự động và bấm thanh toán]`
- **Nhánh Git / Worktree trên Orca**: `feat/[ten-tinh-nang]`

---

## 2. Hợp đồng Dữ liệu Chung (`src/types/index.ts`)
*(Luôn chốt phần này đầu tiên để Claude, Codex và Antigravity code khớp nhau 100%)*
- **Interfaces / Types cần thêm hoặc sửa**:
  ```ts
  // Ví dụ:
  // export interface CartItem { id: string; name: string; price: number; quantity: number; }
  ```

---

## 3. Phân bổ Công việc cho 3 Agent

### A. Phần của Antigravity (`Gemini Pro` — 50% tải)
- [ ] Cập nhật `src/types/index.ts` và điền `Context Brief` vào `HANDOFF.md`.
- [ ] Xây dựng UI Components tại `src/components/ui/[TenComponent].tsx`.
- [ ] Tạo/cập nhật trang tại `src/app/[duong-dan]/page.tsx`.
- [ ] Ghép nối UI với Hooks/API và kiểm tra trực tiếp trên trình duyệt.

### B. Phần của Claude Code (`Claude Pro` — 15% tải • Ưu tiên việc khó)
- [ ] Thiết kế kiến trúc / Custom Hook phức tạp tại `src/hooks/[useTenHook].ts` hoặc Core Business Logic.
- [ ] Tinh chỉnh các đoạn logic có nhiều điều kiện ràng buộc khó.
- *(Lưu ý: Không tự quét cả repo, không chạy vòng lặp build/test).*

### C. Phần của Codex (`GPT Pro` — 35% tải • Heavy Lifter & QA)
- [ ] Viết Backend Service tại `src/server/[tenService].ts` và API Route tại `src/app/api/[duong-dan]/route.ts`.
- [ ] Viết bộ Unit/Integration Tests tại `tests/[tenService].test.ts`.
- [ ] Chạy vòng lặp `npm.cmd run typecheck` $\rightarrow$ `npm.cmd test` $\rightarrow$ sửa sạch lỗi và Review `git diff`.
