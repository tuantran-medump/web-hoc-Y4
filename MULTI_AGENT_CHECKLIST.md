# 📋 SỔ TAY GHI NHỚ: Quy trình Chạy Dự án Đa Agent trên Orca
*(Antigravity Gemini Pro Argon 4 + Codex GPT Pro + Claude Code Pro)*

File này là **Checklist bỏ túi** dành cho bạn khi bắt đầu dự án mới, thêm tính năng mới, sửa bug hoặc nâng cấp thư viện với 3 AI Agent.

---

## PHẦN 1: 5 Bước Bắt buộc Trước khi Bắt đầu Dự án Mới (Setup 5 Phút)

- [ ] **1. Phải có ít nhất 1 Git Commit trên nhánh `main`**
  - Orca dùng `git worktree` để tách mỗi agent ra một thư mục riêng. Nếu repo chưa có commit đầu tiên (`root commit`), Orca sẽ không tạo được worktree.
- [ ] **2. Đặt sẵn Bộ File Điều phối ở Gốc Dự án (`main`)**
  - `AGENTS.md`: Ma trận phân quyền độc quyền, cấu trúc thư mục, 3 luồng chuẩn (Feature / Bugfix / Upgrade).
  - `CLAUDE.md`: Nhúng `@AGENTS.md` + ép Claude tiết kiệm token (không tự quét repo, không sửa `package.json`, không chạy loop test).
  - `GEMINI.md`: Hướng dẫn Antigravity giữ độc quyền `package.json` & `src/types/**`, gom ngữ cảnh (`Context Brief`), làm UI và quản lý Merge/Push.
  - `HANDOFF.md`: Bảng trạng thái lưu trên ổ cứng (`State-on-Disk`) để chống mất mạch khi hết token.
- [ ] **3. Phân Quyền Độc Quyền theo Thư mục (Chống xung đột Merge 100%)**
  - `package.json`, `package-lock.json`, `src/types/**` $\rightarrow$ **Độc quyền của Antigravity (Orchestrator)**.
  - `src/components/ui/` & `src/app/` $\rightarrow$ Địa bàn của **Antigravity** (Giao diện, Pages, Print PDF).
  - `src/hooks/` & `src/lib/` $\rightarrow$ Địa bàn của **Claude** (Kiến trúc, Thuật toán lõi, Custom Hooks).
  - `src/server/`, `src/app/api/` & `tests/` $\rightarrow$ Địa bàn của **Codex** (Backend, API, Unit/Integration Tests).
- [ ] **4. Chốt "Hợp đồng Dữ liệu" (`src/types/`) & Dependencies Trước khi Tách Nhánh**
  - Antigravity luôn chốt `src/types/` và chạy `npm.cmd install` + commit vào `main` ở Bước 0 trước khi giao việc cho Claude và Codex.
- [ ] **5. Luôn dùng đuôi `.cmd` trên Windows PowerShell (Bảo mật cao — Không mở khóa `.ps1`)**
  - Giữ nguyên khóa `.ps1` của Windows để an toàn tuyệt đối.
  - Luôn thêm `.cmd`: `npm.cmd install`, `npm.cmd run dev`, `npm.cmd run build`, `npm.cmd run typecheck`, `npm.cmd test`, `npm.cmd audit`, `npx.cmd ...`, `claude.cmd`, `codex.cmd`.

---

## PHẦN 2: Quy tắc Vàng Phân bổ Việc Hàng ngày (Bảo vệ Quota Claude Pro)

| Khi bạn cần làm việc này... | Giao cho ai? | Lý do |
| :--- | :--- | :--- |
| **1. Quét repo, chốt `src/types/`, cài/nâng cấp `package.json` (`allowScripts`)** | **Antigravity** *(Gemini Pro Argon 4)* | Tránh xung đột `package-lock.json` và tiết kiệm 70% token đọc file cho Claude. |
| **2. Thiết kế thuật toán khó / Custom Hooks / Sửa lỗi logic nhiều ràng buộc** | **Claude** *(Claude Pro)* | Tận dụng tư duy kiến trúc sâu của Claude trên đúng 1–3 file đã khoanh vùng. |
| **3. Dựng giao diện UI, Responsive, Print PDF, Ghép API, Merge `main` & Push GitHub** | **Antigravity** *(Gemini Pro Argon 4)* | Context window lớn, mạnh về UI/Full-stack và quản lý nhánh Git. |
| **4. Viết Backend/API, chạy vòng lặp `typecheck -> test -> build -> audit`, Review `git diff`** | **Codex** *(GPT Pro)* | Quota lớn, chuyên trị vòng lặp chạy test/build nhiều lần và bắt lỗi bảo mật/edge cases. |

---

## PHẦN 3: Quy trình Sửa Bug / Nâng cấp Major Version (`npm`) Không Xung Đột

1. **Bước 1 (Antigravity)**: Kiểm tra `npm.cmd outdated` / `npm.cmd audit` / log lỗi $\rightarrow$ Cập nhật `package.json`, `allowScripts` và `tsconfig.json` $\rightarrow$ Commit lockfile trước $\rightarrow$ Ghi danh sách file cần sửa vào `HANDOFF.md`.
2. **Bước 2 (Claude — Nếu có thay đổi API/Hook phức tạp)**: Chỉ mở đúng file được liệt kê trong `HANDOFF.md` để cập nhật code theo chuẩn phiên bản mới.
3. **Bước 3 (Codex)**: Chạy `npm.cmd run typecheck`, `npm.cmd test`, `npm.cmd run build`, `npm.cmd audit`, sửa các test/service bị ảnh hưởng và bổ sung regression test.
4. **Bước 4 (Antigravity)**: Gộp nhánh về `main`, kiểm tra dev server và chạy `git push` lên GitHub.
