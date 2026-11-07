# HANDOFF.md — Bảng Trạng thái & Chuyển giao Công việc v2.0 (State-on-Disk)

> **Hướng dẫn sử dụng nhanh khi 1 Agent hết token trên Orca:**
> Mở Agent dự phòng (**Codex** hoặc **Antigravity Flash**) ngay trong cùng Worktree và nhập:
> `"Tiếp quản công việc đang dở: Đọc HANDOFF.md, chạy git status --short và git diff để nắm phần code đang sửa và làm tiếp."`

---

## 1. Nhiệm vụ Hiện tại (Active Task)
- **Tên tính năng / Task**: `Hoàn tất Hệ thống Web Học Y4 & Chuẩn hoá Quy trình Đa Agent Tối ưu Quota v2.0`
- **Loại luồng**: `Luồng A (Tính năng mới) | Luồng B (Sửa Bug) | Luồng C (Nâng cấp Thư viện / Bảo mật)`
- **Nhánh / Worktree**: `main`
- **Phân bổ Tải chuẩn (Quota-Optimized v2.0)**:
  - **Codex (`GPT Pro` — 60% tải)**: Chủ lực Backend (`src/server/**`, `src/app/api/**`), Feature Pages (`src/features/**`, `src/app/**`), Unit Tests (`tests/**`) & Vòng lặp `typecheck -> test -> build -> audit`.
  - **Claude Code (`Claude Pro` — 25% tải)**: Thuật toán lõi (`src/lib/**`), Custom Hooks phức tạp (`src/hooks/**`) & Design System (`src/components/ui/**`).
  - **Antigravity (`Gemini Flash` / `Argon 4` — 15% tải)**: Orchestrator Bước 0 (`src/types/**`, dùng subagent `flash`), Kiểm thử trình duyệt & Release Manager (`git merge` / `git push` trên model `Flash`).

---

## 2. Tóm tắt Ngữ cảnh (Context Brief)
- **Các file được phép đọc/ghi theo từng Agent**:
  - **Claude (25%)**: `src/lib/**`, `src/hooks/**`, `src/components/ui/**` *(Chỉ mở các file được liệt kê, không chạy loop build/test)*.
  - **Codex (60%)**: `src/server/**`, `src/app/api/**`, `src/features/**`, `src/app/**`, `tests/**`, `vitest.config.mts`.
  - **Antigravity (15%)**: `src/types/**`, `HANDOFF.md` *(Luôn uỷ quyền việc đọc/viết nhiều file cho `invoke_subagent` với `Model: "flash"` nếu đang ở `Argon 4`)*.
- **Ràng buộc kỹ thuật bắt buộc**:
  - Trên Windows PowerShell, luôn dùng `npm.cmd`, `npx.cmd`, `claude.cmd`, `codex.cmd` (không chạy `.ps1`).
  - TypeScript `strict: true`, hạn chế tối đa `any`.

---

## 3. Tiến độ Chi tiết (Checklist)
- [x] **Wave 0 – Wave 4**: Hoàn thiện toàn bộ ứng dụng Web Học Y4 (`/`, `/thi/**`, `/tai-lieu/**`, `/dev/ui`, Print PDF A4).
- [x] **Luồng C (Nâng cấp Major Version & Bảo mật)**: Nâng cấp `next@16.4.5`, `vitest@5.1.0` (`vitest.config.mts`), `@types/node@24.12.0` (`0 vulnerabilities`, `36/36 unit tests PASS`).
- [x] **Quy chuẩn Tối ưu Quota v2.0**: Áp dụng tỷ lệ `60% Codex • 25% Claude • 15% Antigravity (Flash Delegation)` vào toàn bộ bộ file điều phối trong Git.

---

## 4. Trạng thái Đang làm dở (Current State / In-Progress)
- **File vừa hoàn thành**: `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `HANDOFF.md`, `MULTI_AGENT_CHECKLIST.md`, `PROMPTS_PLAYBOOK.md`, `FEATURE_SPEC_TEMPLATE.md`
- **File đang sửa dở**: `Không có`
- **Ghi chú bàn giao cho Agent kế tiếp**:
  - `Toàn bộ dự án và bộ quy chuẩn v2.0 đã được đồng bộ sạch sẽ trên nhánh main và GitHub. Sẵn sàng cho tính năng tiếp theo (mở PROMPTS_PLAYBOOK.md).`
