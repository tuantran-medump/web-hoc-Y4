# 📋 SỔ TAY GHI NHỚ: Quy trình Chạy Dự án Đa Agent Tối Ưu Quota v2.0
*(Codex GPT Pro 60% • Claude Code Pro 25% • Antigravity Gemini 15%)*

File này là **Checklist bỏ túi** giúp bạn hoàn thành cả một dự án lớn mà chỉ tốn **< 8% định mức tuần trên cả 3 nền tảng**.

---

## PHẦN 1: 3 Nguyên tắc Vàng Bảo vệ Định mức (Áp dụng Cả 3 Giải pháp)

1. **Giải pháp 1 — Bắt buộc dùng Subagent `Flash` trên Antigravity**:
   - Nếu đang bật `Argon 4`, Antigravity chỉ làm **Chỉ huy (Orchestrator)**, mọi thao tác quét file/viết code đều phải gọi qua `invoke_subagent (Model: "flash")` để không làm phình context của `Argon 4`.
2. **Giải pháp 2 — Đổi Model Dropdown sang `Flash` & Gõ `/compact` đúng lúc**:
   - **Chỉ bật `Argon 4`** ở đúng **Bước 0** (khi cần phân tích kế hoạch lớn và chia việc vào `HANDOFF.md` — chỉ tốn 1–2 lượt chat).
   - **Chuyển ngay sang `Flash`** cho toàn bộ các việc còn lại: chạy `npm.cmd run dev`, sửa giao diện nhỏ, gộp nhánh (`git merge`), đẩy code (`git push`).
   - Gõ lệnh **`/compact`** sau mỗi cột mốc xong việc để dọn sạch lịch sử chat cũ.
3. **Giải pháp 3 — Đưa `Codex (GPT Pro)` lên làm Chủ lực Full-Stack (60% tải) & Điều phối thay thế**:
   - Vì gói `GPT Pro` có hạn mức cực lớn (chỉ tốn ~2% cho cả một phân hệ), hãy giao cho **Codex** gánh cả **Backend + API + Dựng trang UI (`src/features/**`, `src/app/**`) + Vòng lặp `typecheck -> test -> build -> audit`**.
   - Thậm chí khi bạn muốn **0% tiêu hao `Argon 4`**, bạn có thể giao luôn Bước 0 (Quét repo & lập `HANDOFF.md`) cho **Codex (`codex.cmd`)**!

---

## PHẦN 2: Phân bổ Việc Hàng ngày theo Tỷ lệ `60% Codex • 25% Claude • 15% Antigravity`

| Khi bạn cần làm việc này... | Giao cho ai? | Mức tốn Quota |
| :--- | :--- | :--- |
| **1. Chốt `src/types/**` & Chia việc vào `HANDOFF.md` (Bước 0)** | **Antigravity** *(dùng subagent `flash`)* **HOẶC Codex (`GPT Pro`)** | **~1–2%** |
| **2. Viết Thuật toán lõi (`src/lib/**`), Custom Hooks (`src/hooks/**`) & Design System (`src/components/ui/**`)** | **Claude** *(Claude Pro — 25% khối lượng)* | **~4–8%** |
| **3. Viết Backend (`src/server/**`), API, cộng với Dựng các trang `src/features/**`, `src/app/**` & Chạy Build/Test/Audit** | **Codex** *(GPT Pro — 60% khối lượng)* | **~3–6%** |
| **4. Chạy thử trên trình duyệt, kiểm tra hình ảnh/PDF, gộp nhánh về `main` & `git push`** | **Antigravity** *(Chuyển sang model **`Flash`** — 15% khối lượng)* | **Gần như 0% `Argon 4`** |

---

## PHẦN 3: 5 Bước Khởi tạo Dự án Mới (Setup 5 Phút)

- [ ] **1. Phải có ít nhất 1 Git Commit trên nhánh `main`** để Orca tạo được `git worktree`.
- [ ] **2. Copy bộ `multi-agent-starter-kit` vào gốc dự án** (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `HANDOFF.md`, `PROMPTS_PLAYBOOK.md`, `MULTI_AGENT_CHECKLIST.md`, `FEATURE_SPEC_TEMPLATE.md`).
- [ ] **3. Chốt `src/types/` và `package.json` ở Bước 0** rồi commit lên nhánh gốc trước khi mở worktree cho Claude và Codex.
- [ ] **4. Luôn dùng đuôi `.cmd` trên Windows PowerShell**: `npm.cmd`, `npx.cmd`, `claude.cmd`, `codex.cmd`.
- [ ] **5. Nhớ chuyển Antigravity về model `Flash` (hoặc gõ `/compact`)** ngay sau khi xong bước lập kế hoạch!
