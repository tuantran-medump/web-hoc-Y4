# 🎯 PROMPTS_PLAYBOOK.md — Bộ Câu Lệnh Copy-Paste Để Phân Việc Cho Antigravity, Claude & Codex

Mỗi lần bắt đầu code một tính năng mới trên **Orca**, bạn chỉ cần mở file này, **Copy & Paste** đúng câu lệnh tương ứng cho từng Agent (chỉ cần thay phần trong ngoặc vuông `[...]`).

---

## BƯỚC 1: Giao cho Antigravity (Gemini Pro) — Chuẩn bị & Chia việc
> **Mục đích**: Để Antigravity quét repo, chốt kiểu dữ liệu (`src/types/index.ts`) và viết sẵn kế hoạch chia việc vào `HANDOFF.md` giúp **Claude không tốn token** mò code.

### 📋 Prompt 1A — Khởi động tính năng mới & Chia việc tự động
```text
Mình muốn làm tính năng mới: [Mô tả ngắn gọn tính năng bạn muốn làm].
Hãy thực hiện vai trò Orchestrator:
1. Quét codebase hiện tại và cập nhật kiểu dữ liệu chung cần thiết vào `src/types/index.ts`.
2. Điền đầy đủ mục Context Brief và chia Checklist công việc cụ thể cho 3 Agent (Antigravity làm UI, Claude làm Core Architecture/Hooks phức tạp, Codex làm Backend Service & Unit Test) vào file `HANDOFF.md`.
3. Cho mình biết phần nào bạn làm ngay, và câu lệnh cụ thể để mình giao cho Claude và Codex.
```

---

## BƯỚC 2: Giao cho Claude Code (`claude.cmd` — Claude Pro)
> **Mục đích**: Chỉ giao việc khó (Kiến trúc, State/Hooks phức tạp, Logic nhiều ràng buộc) sau khi Antigravity đã chuẩn bị sẵn `HANDOFF.md`.

### 📋 Prompt 2A — Giao Claude viết Core Logic / Kiến trúc (Tiết kiệm Token)
```text
Đọc `CLAUDE.md` và `HANDOFF.md`.
Thực hiện đúng phần việc được giao cho Claude trong Checklist của `HANDOFF.md` (chỉ đọc các file đã liệt kê trong mục Context Brief, không tự quét toàn bộ repo và không chạy vòng lặp test/build).
Sau khi code xong từng file, hãy cập nhật trạng thái vào `HANDOFF.md`.
```

### 📋 Prompt 2B — Giao Claude tối ưu / Refactor đoạn code khó
```text
Đọc `HANDOFF.md` và chỉ mở file `[đường-dẫn-file]`.
Hãy thiết kế lại / tối ưu logic tại `[tên hàm hoặc component]` sao cho sạch, đúng chuẩn TypeScript strict và dễ mở rộng. Không chạy test/build, chỉ sửa code và ghi chú lại vào `HANDOFF.md`.
```

---

## BƯỚC 3: Giao cho OpenAI Codex (`codex.cmd` — GPT Pro)
> **Mục đích**: Tận dụng quota lớn của GPT Pro để viết Backend nặng, thuật toán, viết Unit/Integration Test, chạy vòng lặp `typecheck -> test -> fix` và Review code.

### 📋 Prompt 3A — Giao Codex viết Backend / API / Xử lý dữ liệu
```text
Đọc `AGENTS.md` và `HANDOFF.md`.
Hãy triển khai phần Backend Service / API được giao cho Codex trong `HANDOFF.md` (tuân thủ chặt chẽ kiểu dữ liệu trong `src/types/index.ts`).
Sau khi viết xong, hãy chạy `npm.cmd run typecheck` và `npm.cmd test` để đảm bảo không có lỗi, rồi cập nhật `HANDOFF.md`.
```

### 📋 Prompt 3B — Giao Codex chạy vòng lặp Test, Sửa lỗi Build & Review Code (Sau khi Claude/Antigravity code xong)
```text
Đọc `AGENTS.md` và `HANDOFF.md`.
1. Chạy `npm.cmd run typecheck` và `npm.cmd test`, tự động sửa toàn bộ lỗi TypeScript hoặc lỗi test nếu có.
2. Viết bổ sung Unit Test trong thư mục `tests/` cho các logic mới vừa thêm (bao gồm cả edge cases).
3. Chạy `git diff main...HEAD` để review toàn bộ code mới (kiểm tra lỗi logic, race condition, bảo mật) và hoàn thiện nốt, sau đó cập nhật `HANDOFF.md`.
```

---

## BƯỚC 4: Giao cho Antigravity (Gemini Pro) — Làm UI, Ghép nối & Chốt hạ
> **Mục đích**: Dựng giao diện, nối Frontend với Backend của Claude/Codex, chạy thử trên trình duyệt và push lên GitHub.

### 📋 Prompt 4A — Dựng Giao diện (UI) & Ghép nối Full-Stack
```text
Đọc `HANDOFF.md`. Hãy xây dựng giao diện UI trong `src/components/ui/` và `src/app/`, kết nối với Hooks/Backend mà Claude và Codex đã viết.
Sau đó kiểm tra lại `npm.cmd run typecheck`, `npm.cmd test` và cập nhật `HANDOFF.md`.
```

---

## 🚑 CỨU HỘ KHẨN CẤP: Khi Claude hoặc Codex hết Token giữa chừng

Khi một Agent đang chạy mà báo hết limit / dừng giữa chừng, mở ngay Agent dự phòng (**Codex** nếu đang làm Backend/Logic/Test; **Antigravity** nếu đang làm UI/Full-stack) trong **cùng Worktree** và paste:

```text
Tiếp quản công việc đang dở: Hãy đọc `HANDOFF.md`, chạy `git status --short` và `git diff` để nắm chính xác những dòng code Agent trước đang viết dở, sau đó hoàn thiện nốt các mục còn lại trong Checklist.
```
