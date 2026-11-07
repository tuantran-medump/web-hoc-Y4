# HANDOFF.md — Bảng Trạng thái & Chuyển giao Công việc (State-on-Disk)

> **Hướng dẫn sử dụng nhanh khi 1 Agent hết token trên Orca:**
> Mở Agent dự phòng (Codex hoặc Antigravity) ngay trong cùng Worktree và nhập:
> `"Tiếp quản công việc đang dở: Đọc HANDOFF.md, chạy git status --short và git diff để nắm phần code đang sửa và làm tiếp."`

---

## 1. Nhiệm vụ Hiện tại (Active Task)
- **Tên tính năng / Task**: `Triển khai Hệ thống Web Học Y4 (Dashboard Kanban + Web Thi thử /thi + Web Thư viện /tai-lieu) theo docs/KE_HOACH_ANTIGRAVITY.md`
- **Nhánh / Worktree**: `main` (Chuẩn bị tách nhánh cho Wave 0–Wave 3)
- **Agent phụ trách chính**:
  - **Antigravity (`Gemini Pro` — 50%)**: Orchestrator (W0.1), Design System & Shell (W0.2), UI Kanban (W1.1), UI Web Thi (W2.1), UI Thư viện (W2.2), Print/PDF UI (W3.1).
  - **Claude Code (`Claude Pro` — 15%)**: Core Citation & Graph Coloring Engine (W1.4), Core Exam Hooks (`useCountdown`, `useExamAttempt`).
  - **Codex (`GPT Pro` — 35%)**: PDF Exam Parser (W1.2), Repositories & Exam API (W1.3), Google Drive Sync API (W1.5), Unit/E2E Tests & Build/Test Loop (W3.2).
- **Agent dự phòng (Backup)**: `Codex (Backend/Parser/Test) | Antigravity (UI/Hooks/Full-stack)`

---

## 2. Tóm tắt Ngữ cảnh (Context Brief — Do Antigravity chuẩn bị cho Claude & Codex)

### A. Kiến trúc & Quy tắc Phân vùng File (Chống xung đột Merge)
- **Hợp đồng dữ liệu chung (ĐÃ CHỐT tại `src/types/`)**:
  - `src/types/dashboard.ts`: `BoardColumn`, `BoardCard`, `BoardCardStat`, `DashboardBoardState`.
  - `src/types/exam.ts`: `ContentBlock`, `QuestionType`, `Choice`, `RubricItem`, `Question`, `ExamSection`, `Station`, `Exam`, `AnswerEdit`, `AnswerValue`, `SelfGrade`, `Attempt`, `ParseIssue`, `ParseResult`, `ExamBackupPayload`.
  - `src/types/library.ts`: `SourceRef`, `DocBlockKind`, `DocSegment`, `DocBlock`, `LibraryDoc`, `DocTocItem`, `RenderedDoc`, `SyncErrorItem`, `SyncReport`.
  - `src/types/index.ts`: Re-export toàn bộ + `ApiResponse<T>`.
- **Tài liệu đặc tả gốc**:
  - `docs/KE_HOACH_ANTIGRAVITY.md` (Kiến trúc tổng thể & 11 gói công việc).
  - `docs/mau/MAU_DE_THI_VA_PROMPT.md` (Quy tắc marker đề thi PDF chuẩn & OSCE Trạm).
  - `docs/mau/MAU_TAI_LIEU_VA_PROMPT.md` (Quy tắc Markdown chú thích nguồn `[^key]`, chia đoạn và tô màu).

### B. Danh sách File dành riêng cho từng Agent (chỉ đọc/ghi đúng vùng của mình)
1. **Vùng của Claude Code (`Claude Pro` — Ưu tiên thuật toán & kiến trúc khó, không chạy loop test/build)**:
   - `src/lib/citation/index.ts`:
     - Hàm chính: `renderLibraryMarkdown(md: string, sharedSources?: string): Omit<RenderedDoc, "doc">` và `assignSourceColors(blocks: DocBlock[], sources: Omit<SourceRef, "colorIndex">[]): SourceRef[]`.
     - Quy tắc bắt buộc (mục W1.4 trong `docs/KE_HOACH_ANTIGRAVITY.md` & `docs/mau/MAU_TAI_LIEU_VA_PROMPT.md`):
       1. Đọc front-matter (`title`, `tags`, `updated`) và nội dung Markdown.
       2. Gộp định nghĩa nguồn `[^key]: [Tiêu đề](url)`: định nghĩa trong file ưu tiên hơn trong `sharedSources` (`_nguon.md`). Nếu nguồn thiếu link Google Drive hợp lệ thì ghi vào `warnings`.
       3. Đánh số `label` (1, 2, 3...) theo thứ tự xuất hiện lần đầu trong bài; dùng lại nguồn cũ thì giữ nguyên `label`.
       4. Chia đoạn (`DocSegment`): trong `paragraph` hoặc `list`, phần chữ từ sau marker trước tới marker hiện tại thuộc nguồn của marker hiện tại; phần dư sau marker cuối cùng có `sourceKey = null`. Với `table` và `figure`, lấy nguồn từ marker trong dòng caption (`*Hình n...*[^key]` hoặc `*Bảng n...*[^key]`). `heading` có `sourceKey = null` (không tô màu) và sinh `toc`.
       5. Ẩn liên kết: mọi `[text](url)` trong thân bài chỉ giữ `text`, xoá URL trần, loại bỏ thẻ `<script>`/XSS. Link chỉ còn tồn tại trong `SourceRef.url`.
       6. Tô màu đồ thị (`assignSourceColors`): Đỉnh là các nguồn (`key`). Hai nguồn có cạnh nối nếu tồn tại 2 `DocSegment` có `sourceKey != null` nằm liền kề nhau (kể cả qua ranh giới `DocBlock`) mang 2 nguồn khác nhau. Tô màu tham lam theo thứ tự `label` (bảng 8 màu `0..7`, nếu vượt quá thì cấp chỉ số tiếp theo). Đảm bảo: **cùng nguồn cùng `colorIndex`** và **2 đoạn liền kề khác nguồn có `colorIndex` khác nhau**.
   - `src/hooks/useCountdown.ts` & `src/hooks/useExamAttempt.ts`:
     - `useCountdown`: Nhận `endsAt` (ISO string), tính số giây còn lại dựa trên `Date.now()` (không bị lệch khi tab ẩn/reload), hỗ trợ `pausedRemainingSec` khi `mode === 'practice'`, trả về trạng thái cảnh báo `isWarning5Min` ($\le 300$s), `isWarning1Min` ($\le 60$s), `isExpired` và hỗ trợ chuyển trạm OSCE (`stationEndsAt`).
     - `useExamAttempt`: Quản lý chọn đáp án (`AnswerValue`), gắn cờ câu hỏi (`flagged`), tính điểm tự chấm theo barem (`SelfGrade`), đồng bộ/tự lưu debounce 500ms.

2. **Vùng của Codex (`GPT Pro` — Backend, Parser, Repositories & Unit Tests)**:
   - `src/lib/exam-parser/index.ts`:
     - Hàm chính: `parseExamText(rawText: string): ParseResult` và `parseExamPdf(file: ArrayBuffer): Promise<ParseResult>`.
     - Nhận diện các marker đầu dòng theo `docs/mau/MAU_DE_THI_VA_PROMPT.md`: `ĐỀ:`, `MÔN:`, `THỜI GIAN:`, `CHẾ ĐỘ:` (`Thường` -> `standard`, `Trạm` -> `station`), `TAG:`, `PHẦN <La Mã>.`, `TRẠM <n> (<x> phút).`, `Tình huống:`, `Câu <n> (<x> điểm).`, `A.`–`F.`, `Đ/S:`, `Đáp án:`, `Đáp án mẫu:`, `Barem:`, `- Ý <n> (<x> đ):`, `Ghi chú:`, `Hình <n>:`, `Bảng <n>:`.
     - Kiểm tra hợp lệ và sinh `ParseIssue[]`: thiếu đáp án, đánh số câu trùng/không liên tục, đáp án không nằm trong lựa chọn, tổng điểm các ý trong `Barem` khác điểm của câu, trạm thiếu thời gian.
   - `src/server/db/index.ts` & `src/server/exam/grading.ts`:
     - Implement `ExamRepository`, `AttemptRepository`, `BoardRepository`, `LibraryRepository` với Memory Adapter (kèm seed dữ liệu mẫu từ `docs/mau/` để mở web là có ngay đề mẫu & tài liệu mẫu để test!).
     - Hàm `gradeChoices(exam: Exam, answers: Record<string, AnswerValue>): { autoScore: number; perQuestion: Record<string, number> }` chấm `mcq_single`, `mcq_multi` (đúng toàn bộ mới có điểm), `true_false`.
   - `src/app/api/exam/**` & `src/server/library/**` & `src/app/api/library/**`:
     - API CRUD đề thi, xoá mềm (`deletedAt`), khôi phục từ thùng rác, PATCH sửa đáp án (ghi lịch sử `AnswerEdit` + hỗ trợ hoàn tác), tạo/lưu/nộp `Attempt`, backup/restore JSON (`ExamBackupPayload`).
     - API `POST /api/library/sync` (có khoá chống chạy đồng thời trả về 409 nếu đang chạy, đổi đường dẫn ảnh `./hinh/...` thành `/api/library/image/[fileId]`, trả về `SyncReport`), `GET /api/library/docs`, `GET /api/library/image/[fileId]`.
   - `tests/unit/**`:
     - Viết Unit Tests đầy đủ cho `exam-parser`, `citation`, `grading`, `timer`, `dashboard` và chạy `npm.cmd run typecheck` + `npm.cmd test`.

3. **Vùng của Antigravity (`Gemini Pro` — Design System, UI/Pages, Print PDF & Tích hợp)**:
   - `src/components/ui/**`, `src/app/layout.tsx`, `src/app/globals.css`, `public/manifest.webmanifest`, `src/app/dev/ui/page.tsx`.
   - `src/app/(dashboard)/page.tsx` & `src/features/dashboard/**`.
   - `src/app/thi/**` & `src/features/exam/**`.
   - `src/app/tai-lieu/**` & `src/features/library/**`.
   - `src/lib/print/**`, `src/app/thi/de/[id]/in/page.tsx`, `src/app/tai-lieu/[id]/in/page.tsx`.

### C. Ràng buộc Kỹ thuật Bắt buộc
- Trên Windows PowerShell, **BẮT BUỘC** gọi qua đuôi `.cmd`: `npm.cmd`, `npx.cmd`, `claude.cmd`, `codex.cmd` (không chạy `.ps1`).
- TypeScript `strict: true`, không dùng `any`.
- Không tự ý sửa `src/types/**` khi đang làm ở nhánh con.
- Không làm các mục 🔒 (không tạo secret thật, không tự deploy).

---

## 3. Tiến độ Chi tiết (Checklist)

### Wave 0 — Khởi tạo Hợp đồng Dữ liệu & Design System
- [x] **W0.1 (Antigravity - ORCH)**: Chốt `src/types/{dashboard,exam,library,index}.ts`, tạo cây thư mục phân vùng và `.env.example`.
- [ ] **W0.2 (Antigravity - SA-UI)**: Xây dựng Design System (`src/components/ui/**`), responsive shell, dark mode, cỡ chữ, PWA manifest và trang `/dev/ui`.

### Wave 1 — Core Logic, Parser & Backend Services (Chạy song song)
- [ ] **W1.4 & Hooks (Claude Code)**:
  - [ ] Viết `src/lib/citation/index.ts` (`renderLibraryMarkdown`, `assignSourceColors` — chia đoạn, ẩn link thân bài, tô màu đồ thị nguồn).
  - [ ] Viết `src/hooks/useCountdown.ts` & `src/hooks/useExamAttempt.ts` (đồng hồ tuyệt đối `endsAt`, chuyển trạm OSCE, tự chấm barem, auto-save).
- [ ] **W1.2, W1.3, W1.5 (Codex)**:
  - [ ] Viết `src/lib/exam-parser/index.ts` (`parseExamText`, `parseExamPdf` + kiểm tra lỗi `ParseIssue[]`).
  - [ ] Viết `src/server/db/index.ts` (Memory Repositories có sẵn dữ liệu mẫu Y4) & `src/server/exam/grading.ts` (`gradeChoices`).
  - [ ] Viết API routes `src/app/api/exam/**` & `src/server/library/index.ts` + `src/app/api/library/**` (Sync thủ công có lock 409, proxy ảnh).
- [ ] **W1.1 (Antigravity - SA-DASH)**:
  - [ ] Dựng Kanban Dashboard tại `src/app/(dashboard)/page.tsx` và `src/features/dashboard/**`.

### Wave 2 & Wave 3 — Giao diện Web Con, Xuất PDF & Kiểm thử Toàn diện
- [ ] **W2.1 (Antigravity - SA-EXAM)**: Dựng UI Ngân hàng đề, Nạp đề PDF + Preview, Sửa đáp án + Hoàn tác, Làm bài chuẩn/trạm OSCE, Tự chấm barem, Lịch sử (`/thi/**`).
- [ ] **W2.2 (Antigravity - SA-LIB)**: Dựng UI Thư viện tài liệu, nút Đồng bộ Drive, Trình đọc A4 tô màu theo nguồn + Tooltip mở link Drive (`/tai-lieu/**`).
- [ ] **W3.1 (Antigravity - SA-PRINT)**: Dựng trang xuất PDF A4 cho Đề thi (`/thi/de/[id]/in`) và Tài liệu (`/tai-lieu/[id]/in`).
- [ ] **W3.2 (Codex - SA-QA)**: Viết Unit Tests (`tests/unit/**`), chạy `npm.cmd run typecheck` + `npm.cmd test` + `npm.cmd run build` và Review `git diff`.

---

## 4. Trạng thái Đang làm dở (Current State / In-Progress)
- **File vừa hoàn thành**:
  - `src/types/dashboard.ts`, `src/types/exam.ts`, `src/types/library.ts`, `src/types/index.ts`
  - `.env.example`, `tests/setup.test.ts`, cùng toàn bộ khung thư mục phân vùng.
- **File đang sửa dở**: `Không có (Wave 0.1 đã hoàn tất sạch sẽ)`
- **Ghi chú bàn giao cho Agent kế tiếp**:
  - `Antigravity bắt đầu làm ngay W0.2 (Design System) & W1.1 (Dashboard Kanban).`
  - `Claude nhận việc W1.4 (Citation + Graph Coloring) & Hooks.`
  - `Codex nhận việc W1.2 (Exam Parser), W1.3 (DB + Exam API + Grading), W1.5 (Drive Sync API) & Unit Tests.`
