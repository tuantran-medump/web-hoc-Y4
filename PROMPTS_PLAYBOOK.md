# 🎯 PROMPTS_PLAYBOOK.md — Bộ Câu Lệnh Copy-Paste Phân Việc Cho Antigravity, Claude & Codex

Mỗi lần bắt đầu **Tính năng mới**, **Sửa Bug**, hoặc **Nâng cấp Thư viện / Vá Bảo mật npm** trên **Orca**, bạn chỉ cần mở file này và **Copy & Paste** đúng câu lệnh tương ứng cho từng Agent.

---

# PHẦN I — QUY TRÌNH PHÁT TRIỂN TÍNH NĂNG MỚI (NEW FEATURE)

## BƯỚC 1: Giao cho Antigravity (`Gemini Pro Argon 4`) — Chuẩn bị, Cài Deps & Chia việc
```text
Mình muốn làm tính năng mới: [Mô tả ngắn gọn tính năng].
Hãy thực hiện vai trò Orchestrator & Lockfile Owner:
1. Quét codebase, cập nhật kiểu dữ liệu chung vào `src/types/` và cài đặt thêm thư viện vào `package.json` (nếu cần).
2. Điền đầy đủ Context Brief và chia Checklist phân vùng độc lập cho 3 Agent (Antigravity làm UI/Pages, Claude làm Core Architecture/Hooks phức tạp, Codex làm Backend Service & Unit Test) vào `HANDOFF.md`.
3. Cho mình biết phần nào bạn làm ngay, và in ra câu lệnh cụ thể để mình giao cho Claude và Codex.
```

## BƯỚC 2: Giao cho Claude Code (`claude.cmd` — Claude Pro • 15% tải)
```text
Đọc `CLAUDE.md` và `HANDOFF.md`.
Thực hiện đúng phần việc được giao cho Claude trong Checklist của `HANDOFF.md`:
- Chỉ đọc các file đã liệt kê trong mục Context Brief, KHÔNG tự quét toàn bộ repo.
- KHÔNG sửa `package.json` hay `src/types/**` (nếu cần bổ sung trường, hãy ghi đề xuất vào mục 4 của `HANDOFF.md`).
- KHÔNG chạy vòng lặp test/build tốn token. Sau khi code xong từng file, hãy cập nhật trạng thái vào `HANDOFF.md`.
```

## BƯỚC 3: Giao cho OpenAI Codex (`codex.cmd` — GPT Pro • 35% tải)
```text
Đọc `AGENTS.md` và `HANDOFF.md`.
Hãy triển khai phần Backend Service / Parser / API và Unit Tests được giao cho Codex trong `HANDOFF.md`:
- Tuân thủ chặt chẽ kiểu dữ liệu trong `src/types/` và không sửa `package.json` hay vùng UI của Antigravity.
- Sau khi viết xong, hãy chạy `npm.cmd run typecheck`, `npm.cmd test` và `npm.cmd run build` để sửa sạch lỗi, rồi cập nhật báo cáo vào `HANDOFF.md`.
```

## BƯỚC 4: Giao cho Antigravity (`Gemini Pro Argon 4` — 50% tải) — Dựng UI, Ghép nối, Merge & Push
```text
Đọc `HANDOFF.md`.
1. Gộp code từ nhánh/worktree của Claude và Codex về nhánh tích hợp.
2. Xây dựng hoàn chỉnh giao diện UI trong `src/components/ui/` và `src/app/`, nối với Hooks của Claude và API của Codex.
3. Chạy kiểm tra cuối (`npm.cmd run typecheck`, `npm.cmd test`, `npm.cmd run build`), merge vào `main` và `git push` lên GitHub.
```

---

# PHẦN II — QUY TRÌNH SỬA BUG & NÂNG CẤP MAJOR VERSION (`npm` / BẢO MẬT)

## 🛠️ Prompt B1 — Giao Antigravity Chẩn đoán Bug / Nâng cấp `package.json` & Chia việc
```text
Mình cần xử lý lỗi / nâng cấp hệ thống: [Mô tả lỗi hoặc cảnh báo npm/build].
Hãy thực hiện vai trò Orchestrator & Lockfile Owner:
1. Kiểm tra nguyên nhân gốc rễ (nếu cần cập nhật `package.json`, `allowScripts` hoặc `package-lock.json` thì chỉ một mình bạn thực hiện và commit trước).
2. Khoanh vùng chính xác các file cần sửa vào `HANDOFF.md` và chia quyền xử lý cho Claude (nếu có thay đổi kiến trúc/hook phức tạp) và Codex (sửa lỗi kiểu dữ liệu, cập nhật Unit Test, chạy vòng lặp `typecheck -> test -> build -> audit`).
3. Đưa cho mình câu lệnh copy-paste để giao cho Claude và Codex.
```

## 🛠️ Prompt B2 — Giao Claude xử lý Breaking Changes / Bug Logic Khó (Tiết kiệm Token)
```text
Đọc `CLAUDE.md` và `HANDOFF.md`.
Chỉ mở đúng các file được khoanh vùng cho Claude trong `HANDOFF.md` để xử lý lỗi logic / tương thích Breaking Changes.
Không tự quét repo, không sửa `package.json`, không chạy vòng lặp build/test. Cập nhật kết quả vào `HANDOFF.md` ngay khi sửa xong.
```

## 🛠️ Prompt B3 — Giao Codex Chạy Vòng Lặp Sửa Lỗi, Audit & Regression Test
```text
Đọc `AGENTS.md` và `HANDOFF.md`.
1. Chạy `npm.cmd run typecheck`, `npm.cmd test`, `npm.cmd run build` và `npm.cmd audit`.
2. Sửa toàn bộ lỗi tương thích kiểu dữ liệu, lỗi runtime hoặc lỗi test trong vùng được giao (`src/server/`, `src/lib/`, `tests/`).
3. Viết bổ sung Unit Test chống tái phát lỗi, chạy `git diff` để review an toàn bảo mật rồi cập nhật `HANDOFF.md`.
```

## 🛠️ Prompt B4 — Giao Antigravity Chốt hạ, Merge `main` & Push lên GitHub
```text
Đọc `HANDOFF.md`, gộp toàn bộ phần sửa lỗi của Claude và Codex, kiểm tra lại `npm.cmd run typecheck && npm.cmd test && npm.cmd run build`, sau đó merge vào `main` và `git push` lên GitHub.
```

---

# 🚑 CỨU HỘ KHẨN CẤP: Khi Claude hoặc Codex hết Token giữa chừng

Mở ngay Agent dự phòng (**Codex** nếu đang làm Backend/Logic/Test; **Antigravity** nếu đang làm UI/Full-stack) trong **cùng Worktree** và paste:

```text
Tiếp quản công việc đang dở: Hãy đọc `HANDOFF.md`, chạy `git status --short` và `git diff` để nắm chính xác những dòng code Agent trước đang viết dở, sau đó hoàn thiện nốt các mục còn lại trong Checklist.
```
