# AGENTS.md — Quy chuẩn Điều phối & Tối ưu Định mức Đa Agent v2.0 (Orca Workspace)

Dự án Web App này được vận hành bởi 3 AI Agent trên **Orca** theo **Mô hình Tối ưu Định mức (Quota-Optimized Pyramid)**:
1. **Codex (`GPT Pro` — 60% khối lượng • Chủ lực Full-Stack & QA)**: *Backend, API, Parser, Feature Pages (`src/features/**`, `src/app/**`), Unit/E2E Tests & Vòng lặp `typecheck -> test -> build -> audit`.*
2. **Claude Code (`Claude Pro` — 25% khối lượng • Kiến trúc sư, Hooks & Design System)**: *Thuật toán lõi (`src/lib/**`), Custom Hooks phức tạp (`src/hooks/**`) & Design System tinh tế (`src/components/ui/**`).*
3. **Antigravity (`Gemini Flash` mặc định / `Argon 4` chỉ khi lập kế hoạch — 15% khối lượng)**: *Orchestrator gọn nhẹ, Chốt `src/types/**`, Kiểm thử Trình duyệt/Đa phương thức & Quản lý Gộp nhánh/Push GitHub (Bắt buộc uỷ quyền tác vụ nặng qua `invoke_subagent` với `Model: "flash"`).*

---

## 1. Ma trận Phân Quyền & Chống Tốn Quota `Argon 4`

Để bảo vệ tuyệt đối định mức tuần của **`Argon 4`** (không bao giờ vượt quá 5–8%/dự án) và tận dụng tối đa định mức cực lớn của **`Codex (GPT Pro)`**:

| Tài nguyên / Nhiệm vụ | Codex (`GPT Pro` — 60%) | Claude (`Claude Pro` — 25%) | Antigravity (`Flash` / `Argon 4` — 15%) |
| :--- | :---: | :---: | :---: |
| **Điều phối & Chuẩn bị `HANDOFF.md`, `src/types/**`** | ✅ Có thể làm thay khi cần tiết kiệm `Argon 4` | ❌ Không làm | ✅ **Phụ trách chính** *(Dùng subagent `flash` để quét repo)* |
| **`package.json`, `package-lock.json`, `npm allowScripts`** | ✅ Được phép cập nhật khi làm Bước 0 / Luồng C | ❌ Cấm sửa | ✅ Phối hợp cùng Codex (chỉ 1 bên sửa ở Bước 0) |
| **`src/components/ui/**` (Design System & UI mẫu)** | 🔄 Mở rộng / Sửa lỗi type | ✅ **Phụ trách chính** | 🔄 Tinh chỉnh trực quan trên trình duyệt |
| **`src/lib/**`, `src/hooks/**` (Thuật toán lõi, AST, Hooks khó)** | 🔄 Viết parser (`exam-parser`) & helpers | ✅ **Phụ trách chính** | 🔄 Backup |
| **`src/server/**`, `src/app/api/**` (DB, API Routes, Sync)** | ✅ **Phụ trách chính (100%)** | ❌ Không làm | ❌ Không làm |
| **`src/features/**`, `src/app/**` (Ghép nối Pages, CRUD, Print)** | ✅ **Phụ trách chính (Viết code nặng)** | ⚠️ Chỉ polish khi cần | 🔄 Kiểm tra UI & sửa nhanh bằng model `Flash` |
| **`tests/**` + Vòng lặp `typecheck -> test -> build -> audit`** | ✅ **ĐỘC QUYỀN (100%)** | ❌ **CẤM chạy loop** | ❌ **CẤM chạy loop trên `Argon 4`** |
| **Gộp nhánh (`git merge`), giải quyết conflict & `git push`** | ✅ Có thể thực hiện trực tiếp | ❌ Không tự merge | ✅ Thực hiện trên model `Flash` |

---

## 2. 3 Quy tắc Cắt Giảm 85% Quota cho Antigravity (`Argon 4`)

1. **CẤM `Argon 4` tự viết hàng loạt file hoặc tự quét repo trong luồng chat chính**:
   - Nếu người dùng đang chọn model `Argon 4`, Antigravity **BẮT BUỘC** gọi công cụ `invoke_subagent` với tham số **`Model: "flash"`** (hoặc `"flash_lite"`) để quét codebase, đọc tài liệu dài, viết boilerplate UI hoặc chạy lệnh kiểm tra. Luồng chính của `Argon 4` chỉ nhận bản tóm tắt ngắn để giữ context window luôn nhỏ gọn.
2. **Đẩy 80% khối lượng viết code (cả Backend lẫn Feature Pages) sang `Codex (GPT Pro)`**:
   - Gói `GPT Pro` có hạn mức rất lớn. Mọi tác vụ viết API, Repository, Parser, dựng trang `src/app/**`, `src/features/**` và chạy `build`/`test` đều giao cho **Codex** làm chủ lực.
3. **Chuyển Model sang `Flash` & Dùng `/compact` thường xuyên trên Antigravity**:
   - Chỉ bật `Argon 4` ở đúng **1 lượt đầu tiên** khi cần lập kế hoạch kiến trúc phức tạp (hoặc giao luôn việc lập kế hoạch cho Codex/Claude).
   - Trong suốt quá trình ghép nối, chạy `npm.cmd run dev`, sửa giao diện hoặc `git push`, hãy chọn model **`Flash`** và gõ `/compact` sau mỗi cột mốc lớn để xoá lịch sử hội thoại cũ.

---

## 3. Giao thức Chuyển giao & Backup khi Hết Token (`State-on-Disk`)

1. **Đọc `HANDOFF.md` đầu tiên** trước khi làm việc để nắm mục tiêu, danh sách file được phép sửa và trạng thái hiện tại.
2. **Cập nhật `HANDOFF.md` ngay sau mỗi mốc**: đánh dấu `[x]` vào việc đã xong, `[-]` vào việc đang làm dở.
3. **Khi nhận lệnh "Tiếp quản"**: đọc `HANDOFF.md` $\rightarrow$ chạy `git status --short` và `git diff` $\rightarrow$ làm tiếp phần còn dở mà không viết lại từ đầu.

---

## 4. Quy tắc Bảo mật PowerShell & TypeScript
- **BẮT BUỘC dùng `.cmd` trên Windows PowerShell (KHÔNG chạy `.ps1`)**:
  - Máy khoá `.ps1` (`Restricted`). **TUYỆT ĐỐI KHÔNG** chạy `Set-ExecutionPolicy`.
  - Mọi lệnh CLI phải gọi qua đuôi `.cmd`: `npm.cmd install`, `npm.cmd run dev`, `npm.cmd run build`, `npm.cmd run typecheck`, `npm.cmd test`, `npm.cmd audit`, `npx.cmd <pkg>`, `claude.cmd`, `codex.cmd`.
- **TypeScript**: Luôn bật `strict: true`, hạn chế tối đa `any`.
