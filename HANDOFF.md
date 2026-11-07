# HANDOFF.md — Bảng Trạng thái & Chuyển giao Công việc (State-on-Disk)

> **Hướng dẫn sử dụng nhanh khi 1 Agent hết token trên Orca:**
> Mở Agent dự phòng (Codex hoặc Antigravity) ngay trong cùng Worktree và nhập:
> `"Tiếp quản công việc đang dở: Đọc HANDOFF.md, chạy git status và git diff để nắm phần code đang sửa và làm tiếp."`

---

## 1. Nhiệm vụ Hiện tại (Active Task)
- **Tên tính năng / Task**: `Khởi tạo dự án web-hoc-Y4 với Multi-Agent Starter Kit`
- **Nhánh / Worktree**: `main`
- **Agent phụ trách chính**: `Antigravity (Gemini Pro)`
- **Agent dự phòng (Backup)**: `Codex (Backend/Test) | Antigravity (UI/Full-stack)`

---

## 2. Tóm tắt Ngữ cảnh (Context Brief — Do Antigravity chuẩn bị cho Claude/Codex)
- **Các file liên quan chính**:
  - `src/types/index.ts` (Hợp đồng dữ liệu chung)
  - `src/app/`, `src/components/ui/` (Giao diện & Routing — Antigravity)
  - `src/hooks/` (State & Hooks — Claude / Antigravity)
  - `src/server/` (Backend Services — Claude / Codex)
  - `tests/` (Unit & Integration Tests — Codex)
- **Ràng buộc / Thiết kế cần tuân thủ**:
  - Trên Windows PowerShell, luôn dùng `npm.cmd`, `npx.cmd`, `claude.cmd`, `codex.cmd` (không chạy `.ps1`).
  - TypeScript `strict: true`.

---

## 3. Tiến độ Chi tiết (Checklist)
- [x] Bước 0: Cài đặt bộ `multi-agent-starter-kit`, phân chia cấu trúc thư mục và tạo `src/types/index.ts`
- [ ] Bước 1: Antigravity quét repo, chốt `src/types/index.ts` & điền `Context Brief` cho tính năng đầu tiên
- [ ] Bước 2: Claude triển khai Core Architecture / Logic phức tạp
- [ ] Bước 3: Antigravity dựng Giao diện (UI Components) & Ghép nối
- [ ] Bước 4: Codex viết Backend/Tests, chạy `typecheck` + `test` & Review `git diff`

---

## 4. Trạng thái Đang làm dở (Current State / In-Progress)
- **File vừa hoàn thành**: `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `HANDOFF.md`, `src/types/index.ts`
- **File đang sửa dở**: `Không có`
- **Ghi chú bàn giao cho Agent kế tiếp**:
  - `Đã thiết lập xong Multi-Agent Starter Kit cho dự án web-hoc-Y4. Sẵn sàng nhận yêu cầu tính năng đầu tiên (xem PROMPTS_PLAYBOOK.md).`
