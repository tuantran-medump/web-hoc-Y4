# 🎯 PROMPTS_PLAYBOOK.md — Bộ Câu Lệnh Copy-Paste Tối Ưu Quota v2.0
*(Codex GPT Pro 60% • Claude Pro 25% • Antigravity Gemini 15%)*

---

# PHẦN I — KHỞI ĐỘNG TÍNH NĂNG MỚI (CHỌN 1 TRONG 2 CÁCH Ở BƯỚC 1)

## BƯỚC 1 (Cách A): Giao cho Antigravity — Chế độ Dùng Subagent `Flash` (Chỉ tốn ~2% Quota)
> **Mẹo**: Sau khi chạy xong câu lệnh này, hãy chuyển dropdown Model của Antigravity sang **`Flash`** hoặc gõ **`/compact`**.
```text
Mình muốn làm tính năng mới: [Mô tả tính năng hoặc đường dẫn file kế hoạch].
Hãy thực hiện vai trò Orchestrator ở chế độ Bảo vệ Quota Argon 4:
1. BẮT BUỘC dùng `invoke_subagent` với `Model: "flash"` để quét repo và đọc tài liệu (không đọc nhiều file trực tiếp trong luồng chính).
2. Chốt kiểu dữ liệu vào `src/types/` và cập nhật `package.json` (nếu cần).
3. Điền Context Brief và chia Checklist vào `HANDOFF.md` theo tỷ lệ mới:
   - Claude (25%): Viết thuật toán lõi (`src/lib/`), Custom Hooks (`src/hooks/`) và Design System (`src/components/ui/`).
   - Codex (60%): Viết toàn bộ Backend (`src/server/`, `src/app/api/`), dựng các trang giao diện (`src/features/`, `src/app/`) và chạy vòng lặp `typecheck -> test -> build -> audit`.
   - Antigravity (15% - chạy trên model Flash): Kiểm thử trình duyệt, gộp nhánh và `git push`.
4. In ra câu lệnh cụ thể để mình copy-paste cho Claude và Codex.
```

## BƯỚC 1 (Cách B — Tiết kiệm 100% `Argon 4`): Giao luôn việc Điều phối Bước 0 cho Codex (`codex.cmd` — GPT Pro)
```text
Đọc `AGENTS.md` và `HANDOFF.md`.
Mình muốn làm tính năng mới: [Mô tả tính năng hoặc đường dẫn file kế hoạch].
Hãy đóng vai trò Co-Orchestrator:
1. Quét codebase hiện tại, cập nhật kiểu dữ liệu chung vào `src/types/` và cài đặt thư viện cần thiết vào `package.json`.
2. Điền đầy đủ Context Brief và chia Checklist vào `HANDOFF.md` cho Claude (làm `src/lib/`, `src/hooks/`, `src/components/ui/`) và Codex (làm `src/server/`, `src/app/api/`, `src/features/`, `src/app/`, `tests/`).
3. Commit `src/types/` + `HANDOFF.md` và in ra câu lệnh để mình giao cho Claude.
```

---

## BƯỚC 2: Giao cho Claude Code (`claude.cmd` — Claude Pro • 25% tải)
```text
Đọc `CLAUDE.md` và `HANDOFF.md`.
Thực hiện đúng phần việc được giao cho Claude trong `HANDOFF.md` (Thuật toán lõi `src/lib/`, Custom Hooks `src/hooks/` và Design System `src/components/ui/`):
- Chỉ đọc các file đã liệt kê trong mục Context Brief, KHÔNG tự quét toàn bộ repo.
- KHÔNG sửa `package.json` hay `src/types/**` (nếu cần bổ sung trường, hãy ghi đề xuất vào mục 4 của `HANDOFF.md`).
- KHÔNG chạy vòng lặp test/build tốn token. Cập nhật trạng thái và hướng dẫn ghép nối vào `HANDOFF.md` ngay khi code xong.
```

---

## BƯỚC 3: Giao cho OpenAI Codex (`codex.cmd` — GPT Pro • 60% tải: Chủ lực Full-Stack & QA)
```text
Đọc `AGENTS.md` và `HANDOFF.md`.
Hãy triển khai toàn bộ phần việc được giao cho Codex trong `HANDOFF.md`:
1. Viết Backend Services, Repositories & API Routes (`src/server/**`, `src/app/api/**`).
2. Dựng các trang tính năng và ghép nối UI (`src/features/**`, `src/app/**`) dựa trên `src/types/` và các Hooks/Components của Claude.
3. Viết đầy đủ Unit Tests trong `tests/unit/**`.
4. Chạy vòng lặp `npm.cmd run typecheck`, `npm.cmd test`, `npm.cmd run build` và `npm.cmd audit`, tự động sửa sạch mọi lỗi và cảnh báo phát sinh, sau đó cập nhật `HANDOFF.md`.
```

---

## BƯỚC 4: Giao cho Antigravity (Nhớ chọn Model `Flash`) hoặc Codex — Chốt hạ, Merge `main` & Push GitHub
```text
Đọc `HANDOFF.md`.
1. Gộp toàn bộ nhánh công việc về `main`.
2. Chạy kiểm tra cuối (`npm.cmd run typecheck && npm.cmd test`), đẩy code lên GitHub (`git push origin main`) và cập nhật `HANDOFF.md`.
```

---

# PHẦN II — QUY TRÌNH SỬA BUG & NÂNG CẤP MAJOR VERSION (`npm`) SIÊU TIẾT KIỆM QUOTA

## 🛠️ Cách nhanh nhất (Giao thẳng cho Codex `GPT Pro` + Claude `Claude Pro`, tốn 0% `Argon 4`):

### 1. Giao cho Codex (`codex.cmd` — Chẩn đoán, Nâng cấp Deps, Sửa Backend/Tests & Chạy Audit/Build)
```text
Đọc `AGENTS.md` và `HANDOFF.md`.
Mình gặp vấn đề / cần nâng cấp: [Mô tả lỗi hoặc cảnh báo npm/build].
1. Hãy chạy `npm.cmd outdated` / `npm.cmd audit` / `npm.cmd run typecheck` để chẩn đoán nguyên nhân.
2. Cập nhật `package.json`, cấu hình build/test (`tsconfig.json`, `vitest.config.mts`) và sửa toàn bộ lỗi tương thích trong codebase & `tests/`.
3. Nếu phát hiện file nào thuộc vùng thuật toán khó của Claude (`src/hooks/`, `src/lib/`) cần tinh chỉnh kiến trúc, hãy ghi rõ vào `HANDOFF.md`.
4. Chạy đủ 4 lệnh: `npm.cmd audit`, `npm.cmd run typecheck`, `npm.cmd test`, `npm.cmd run build` cho tới khi đạt 0 lỗi, 0 cảnh báo rồi cập nhật `HANDOFF.md`.
```

### 2. Giao cho Claude (`claude.cmd` — Chỉ gọi khi Codex ghi chú cần sửa kiến trúc Hooks/Lib)
```text
Đọc `CLAUDE.md` và `HANDOFF.md`.
Chỉ mở đúng các file được khoanh vùng trong `HANDOFF.md` để xử lý tương thích kiến trúc/hooks. Không tự quét repo, không chạy vòng lặp build/test. Cập nhật `HANDOFF.md` khi xong.
```

---

# 🚑 CỨU HỘ KHẨN CẤP: Khi 1 Agent hết Token giữa chừng
```text
Tiếp quản công việc đang dở: Hãy đọc `HANDOFF.md`, chạy `git status --short` và `git diff` để nắm chính xác những dòng code Agent trước đang viết dở, sau đó hoàn thiện nốt các mục còn lại trong Checklist.
```
