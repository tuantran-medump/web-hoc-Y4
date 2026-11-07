# HANDOFF.md — Bảng Trạng thái & Chuyển giao Công việc (State-on-Disk)

> **Hướng dẫn sử dụng nhanh khi 1 Agent hết token trên Orca:**
> Mở Agent dự phòng (Codex hoặc Antigravity) ngay trong cùng Worktree và nhập:
> `"Tiếp quản công việc đang dở: Đọc HANDOFF.md, chạy git status và git diff để nắm phần code đang sửa và làm tiếp."`

---

## 1. Nhiệm vụ Hiện tại (Active Task)
- **Tên tính năng / Task**: `Khởi tạo khung dự án Next.js (App Router) + Tailwind CSS + TypeScript + Vitest`
- **Nhánh / Worktree**: `main`
- **Agent phụ trách chính**: `Antigravity (Gemini Pro)`
- **Agent dự phòng (Backup)**: `Codex (Backend/Test) | Antigravity (UI/Full-stack)`

---

## 2. Tóm tắt Ngữ cảnh (Context Brief — Do Antigravity chuẩn bị cho Claude/Codex)
- **Các file liên quan chính**:
  - `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`
  - `src/types/index.ts` (Hợp đồng dữ liệu chung)
  - `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css` (Giao diện & Routing — Antigravity)
  - `src/components/ui/` (UI Components — Antigravity)
  - `src/hooks/` (State & Hooks — Claude / Antigravity)
  - `src/server/` (Backend Services — Claude / Codex)
  - `tests/` (Unit & Integration Tests — Codex)
- **Ràng buộc / Thiết kế cần tuân thủ**:
  - Trên Windows PowerShell, luôn dùng `npm.cmd`, `npx.cmd`, `claude.cmd`, `codex.cmd` (không chạy `.ps1`).
  - TypeScript `strict: true`.
  - Hỗ trợ đầy đủ scripts: `dev`, `build`, `typecheck`, `test`.

---

## 3. Tiến độ Chi tiết (Checklist)
- [x] Bước 0: Cài đặt bộ `multi-agent-starter-kit`, phân chia cấu trúc thư mục và tạo `src/types/index.ts`
- [x] Bước 1: Khởi tạo Next.js + Tailwind CSS + TypeScript + Vitest (`package.json`, `tsconfig.json`, `src/app/*`)
- [x] Bước 2: Kiểm tra `npm.cmd run typecheck`, `npm.cmd test`, `npm.cmd run build` và commit lên `main`

---

## 4. Trạng thái Đang làm dở (Current State / In-Progress)
- **File vừa hoàn thành**: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `vitest.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `tests/setup.test.ts`
- **File đang sửa dở**: `Không có`
- **Ghi chú bàn giao cho Agent kế tiếp**:
  - `Đã khởi tạo hoàn chỉnh Next.js 15 + Tailwind CSS v4 + TypeScript (strict) + Vitest. Sẵn sàng nhận tính năng đầu tiên (xem PROMPTS_PLAYBOOK.md).`
