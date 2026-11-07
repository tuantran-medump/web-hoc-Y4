# AGENTS.md — Quy chuẩn Điều phối & Phân Quyền Đa Agent (Orca Workspace)

Dự án Web App này được vận hành song song bởi 3 AI Agent trên **Orca**:
1. **Antigravity (`Gemini Pro Argon 4`)** — *Orchestrator, Package/Lockfile Owner, Context Scout, UI/Frontend & Release Manager (50% khối lượng)*
2. **Codex (`GPT Pro`)** — *Heavy Backend Logic, Build/Test/Audit Loop, Debugging & Code Review (35% khối lượng)*
3. **Claude Code (`Claude Pro`)** — *System Architect, Breaking-Change Adapter & Complex Logic/Hooks (15% khối lượng — Ưu tiên tiết kiệm token)*

---

## 1. Ma trận Phân Quyền Độc Quyền (Chống Xung Đột File & Bảo Vệ Token)

Để không bao giờ xảy ra xung đột `package-lock.json`, `src/types/**` hay ghi đè file giữa các worktree, mọi Agent **BẮT BUỘC** tuân thủ bảng phân quyền đọc/ghi sau:

| Tài nguyên / Nhiệm vụ | Antigravity (`Gemini Pro Argon 4`) | Claude (`Claude Pro`) | Codex (`GPT Pro`) |
| :--- | :---: | :---: | :---: |
| **`package.json`, `package-lock.json`, `npm allowScripts`, cài/nâng cấp thư viện** | ✅ **ĐỘC QUYỀN** | ❌ Cấm sửa | ❌ Cấm sửa |
| **`src/types/**` (Hợp đồng dữ liệu chung)** | ✅ **ĐỘC QUYỀN (Chốt ở Bước 0)** | ❌ Cấm sửa (Đề xuất qua `HANDOFF.md`) | ❌ Cấm sửa (Đề xuất qua `HANDOFF.md`) |
| **`src/components/ui/**`, `src/app/**` (Pages, Layouts, CSS, Print PDF)** | ✅ **Phụ trách chính** | ⚠️ Chỉ sửa khi được giao polish | ❌ Cấm sửa |
| **`src/hooks/**`, `src/lib/**` (Thuật toán lõi, AST, State phức tạp)** | 🔄 Backup / Tích hợp | ✅ **Phụ trách chính** | 🔄 Viết/bảo trì parser & helpers |
| **`src/server/**`, `src/app/api/**` (DB, API Routes, Sync, Validation)** | 🔄 Ghép nối gọi API | ⚠️ Chỉ thiết kế kiến trúc lõi | ✅ **Phụ trách chính** |
| **`tests/**` + Vòng lặp `typecheck` $\rightarrow$ `test` $\rightarrow$ `build` $\rightarrow$ `audit`** | 🔄 Chạy kiểm tra cuối trước khi merge | ❌ **CẤM chạy vòng lặp tốn token** | ✅ **Phụ trách chính** |
| **Gộp nhánh (`git merge`), giải quyết conflict & `git push` lên GitHub** | ✅ **ĐỘC QUYỀN (Release Manager)** | ❌ Không tự merge vào `main` | ❌ Không tự merge vào `main` |

---

## 2. Giao thức Chuyển giao & Backup khi Hết Token (Failover Protocol)

Mọi Agent làm việc trên bất kỳ worktree nào trong Orca **BẮT BUỘC** tuân thủ quy tắc lưu trạng thái trên đĩa (`State-on-Disk`):

### A. Trước và Trong khi làm việc (Mọi Agent)
1. **Đọc `HANDOFF.md`** đầu tiên để nắm mục tiêu, danh sách file liên quan và trạng thái hiện tại.
2. **Cập nhật `HANDOFF.md` theo từng bước nhỏ**:
   - Đánh dấu `[x]` vào mục vừa hoàn thành, `[-]` vào mục đang làm.
   - Ghi rõ file đang sửa dở và các đề xuất thay đổi `types`/`deps` tại mục `Current State / In-Progress`.

### B. Khi nhận lệnh "Tiếp quản" (Takeover Mode)
Khi người dùng yêu cầu tiếp quản công việc từ Agent trước (do hết token hoặc chuyển vai):
1. Đọc ngay `HANDOFF.md`.
2. Chạy `git status --short` và `git diff` để kiểm tra chính xác những dòng code mà Agent trước đang viết dở.
3. Không viết lại từ đầu những phần đã đúng; tiếp tục hoàn thiện phần việc đang dở (`[ ]` hoặc `[-]`) và cập nhật lại `HANDOFF.md`.

---

## 3. Quy trình 3 Luồng Chuẩn (Tính năng mới • Sửa Bug • Nâng cấp Major Version)

### Luồng A — Phát triển Tính năng Mới (New Feature Flow)
1. **Bước 0 (Antigravity)**: Quét repo, chốt `src/types/**`, cài thêm thư viện vào `package.json` (nếu cần), điền `Context Brief` vào `HANDOFF.md` và commit lên nhánh gốc.
2. **Bước 1 (Song song)**:
   - **Claude**: Viết thuật toán lõi / Custom Hooks phức tạp (`src/hooks/**`, `src/lib/**`).
   - **Codex**: Viết Backend Services, API Routes & Unit Tests (`src/server/**`, `src/app/api/**`, `tests/**`).
   - **Antigravity**: Dựng UI Components & Pages (`src/components/ui/**`, `src/app/**`).
3. **Bước 2 (Codex)**: Chạy `npm.cmd run typecheck && npm.cmd test && npm.cmd run build`, sửa sạch lỗi phát sinh và review `git diff`.
4. **Bước 3 (Antigravity)**: Gộp nhánh, kiểm tra trên trình duyệt, merge vào `main` và `git push`.

### Luồng B — Sửa Bug & Xử lý Lỗi (Bugfix Triage Flow)
1. **Bước 1 (Antigravity — Khoanh vùng)**: Đọc log lỗi / tái hiện lỗi trên UI, xác định chính xác file và dòng gây lỗi, ghi vào `HANDOFF.md`.
2. **Bước 2 (Phân loại & Giao việc)**:
   - **Bug giao diện / CSS / Routing / Hydration** $\rightarrow$ **Antigravity** tự sửa ngay.
   - **Bug API / Database / Validation / Test fail / Edge cases** $\rightarrow$ Giao **Codex** sửa kèm viết thêm Unit Test chống tái phát.
   - **Bug kiến trúc / Race condition trong Hooks / Thuật toán phức tạp** $\rightarrow$ Giao **Claude** sửa chính xác tại file đã khoanh vùng (không quét cả repo).
3. **Bước 3 (Codex & Antigravity)**: Codex chạy lại bộ test; Antigravity gộp nhánh và `git push`.

### Luồng C — Nâng cấp Thư viện / Major Version & Vá Bảo mật (`npm audit` / Breaking Changes)
1. **Bước 1 (Antigravity — Lockfile Owner)**:
   - Chạy `npm.cmd outdated` & `npm.cmd audit`.
   - Độc quyền cập nhật `package.json`, cấu hình `allowScripts` (cho `npm` major mới), chạy `npm.cmd install` và commit `package.json` + `package-lock.json` trước tiên.
2. **Bước 2 (Claude — Breaking API Adapter, chỉ gọi khi có thay đổi kiến trúc/API phức tạp)**:
   - Tinh chỉnh các file cấu hình hoặc hàm lõi bị ảnh hưởng bởi Breaking Changes theo danh sách Antigravity đã lọc sẵn trong `HANDOFF.md`.
3. **Bước 3 (Codex — Regression & Audit Verifier)**:
   - Chạy `npm.cmd run typecheck`, `npm.cmd test`, `npm.cmd run build`, `npm.cmd audit`.
   - Sửa toàn bộ lỗi tương thích kiểu dữ liệu (`@types/*`, `vitest`, `next`) trong `src/server/**` và `tests/**`.
4. **Bước 4 (Antigravity)**: Kiểm tra giao diện dev server, merge vào `main` và `git push`.

---

## 4. Quy tắc Bảo mật PowerShell & Git
- **BẮT BUỘC dùng `.cmd` trên Windows PowerShell (KHÔNG chạy `.ps1`)**:
  - Máy giữ nguyên chế độ khóa `.ps1` (`Restricted`). **TUYỆT ĐỐI KHÔNG** chạy `Set-ExecutionPolicy`.
  - Mọi lệnh CLI phải gọi qua đuôi `.cmd`: `npm.cmd install`, `npm.cmd run dev`, `npm.cmd run build`, `npm.cmd run typecheck`, `npm.cmd test`, `npm.cmd audit`, `npx.cmd <pkg>`, `claude.cmd`, `codex.cmd`.
- **TypeScript**: Luôn bật `strict: true`, hạn chế tối đa `any`.
