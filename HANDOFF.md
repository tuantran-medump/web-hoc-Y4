# HANDOFF.md — Bảng Trạng thái & Chuyển giao Công việc (State-on-Disk)

> **Hướng dẫn sử dụng nhanh khi 1 Agent hết token trên Orca:**
> Mở Agent dự phòng (Codex hoặc Antigravity) ngay trong cùng Worktree và nhập:
> `"Tiếp quản công việc đang dở: Đọc HANDOFF.md, chạy git status --short và git diff để nắm phần code đang sửa và làm tiếp."`

---

## 1. Nhiệm vụ Hiện tại (Active Task)
- **Tên tính năng / Task**: `Triển khai & Tích hợp Toàn diện Web Học Y4 (Dashboard Kanban + Web Thi thử /thi + Web Thư viện /tai-lieu)`
- **Nhánh / Worktree**: `docs/ke-hoach-web` (Đã gộp toàn bộ code từ Claude + Codex + Antigravity)
- **Agent phụ trách chính**:
  - **Antigravity (`Gemini Pro` — 50%)**: Orchestrator (W0.1), Design System & Shell (W0.2), UI Kanban (W1.1), UI Web Thi (W2.1), UI Thư viện (W2.2), Print/PDF UI (W3.1), Tích hợp Full-Stack (W4).
  - **Claude Code (`Claude Pro` — 15%)**: Core Citation & Graph Coloring Engine (W1.4), Core Exam Hooks (`useCountdown`, `useExamAttempt`).
  - **Codex (`GPT Pro` — 35%)**: Exam Parser (W1.2), Repositories & Exam API (W1.3), Google Drive Sync API (W1.5), Unit Tests (W3.2).

---

## 2. Tóm tắt Ngữ cảnh & Kiến trúc Đã Tích hợp

### A. Hợp đồng dữ liệu chung (`src/types/`)
- `src/types/dashboard.ts`: `BoardColumn`, `BoardCard`, `BoardCardStat`, `DashboardBoardState`.
- `src/types/exam.ts`: `ContentBlock`, `QuestionType`, `Choice`, `RubricItem`, `Question`, `ExamSection`, `Station`, `Exam`, `AnswerEdit`, `AnswerValue`, `SelfGrade`, `Attempt`, `ParseIssue`, `ParseResult`, `ExamBackupPayload`.
- `src/types/library.ts`: `SourceRef`, `DocBlockKind`, `DocSegment`, `DocBlock` (đã bổ sung `listOrdered`, `listNumber`), `LibraryDoc`, `DocTocItem`, `RenderedDoc`, `SyncErrorItem`, `SyncReport`.
- `src/types/index.ts`: Re-export toàn bộ + `ApiResponse<T>`.

### B. Các phân hệ đã hoàn thiện & ghép nối
1. **Design System & Shell (`src/components/ui/**`, `src/app/dev/ui/page.tsx`)**:
   - Đầy đủ `Button`, `IconButton`, `Card`, `Badge`, `Tabs`, `Modal`, `Sheet`, `Tooltip` (hover trên PC `@media (hover: hover)`, chạm mở popover trên cảm ứng), `ToastProvider`, `Input`, `Select`, `TagInput`, `EmptyState`, `Skeleton`, `ThemeToggle`, `FontSizeControl`, `AppShell`.
   - Hỗ trợ Dark Mode, chỉnh cỡ chữ (`A-`, `A`, `A+`), PWA (`public/manifest.webmanifest`, `public/icon.svg`), và 8 bảng màu pastel tô nguồn tài liệu (`cite-color-0..7`) kèm xoay hue tự động khi vượt 8 màu.
2. **Dashboard Kanban (`src/app/(dashboard)/page.tsx`, `src/features/dashboard/**`)**:
   - 3 cột mặc định (`Đang dùng`, `Ôn tập`, `Lưu trữ`), kéo thả thẻ giữa các cột, menu chuyển cột/thứ tự trên cảm ứng, cuộn ngang `scroll-snap` trên màn hình điện thoại `<768px`, thêm ghi chú & thêm cột mới, hiển thị số liệu đề thi và tài liệu thời gian thực.
3. **Web con 1 — Thi thử Lâm sàng & OSCE (`src/app/thi/**`, `src/features/exam/**`, `src/hooks/**`, `src/server/exam/**`, `src/lib/exam-parser/**`)**:
   - `/thi`: Ngân hàng đề thi (có sẵn 2 đề mẫu Nội khoa & OSCE Trạm từ `docs/mau/`), tìm kiếm, lọc môn/tag, thùng rác 30 ngày + khôi phục, Sao lưu & Khôi phục JSON.
   - `/thi/nap-de`: Nạp đề từ file hoặc văn bản chuẩn, phân tích qua `/api/exam/parse`, hiển thị danh sách lỗi `ParseIssue[]` cạnh bản xem trước từng câu hỏi trước khi lưu.
   - `/thi/de/[id]`: Xem chi tiết câu hỏi, nút ✏️ sửa đáp án đúng / đáp án mẫu / ghi chú và tab **Lịch sử sửa đáp án** có nút **↩ Hoàn tác** (`POST /api/exam/:id/edits/:editId/undo`).
   - `/thi/de/[id]/lam-bai`: Phòng thi tích hợp `useExamAttempt` & `useCountdown` của Claude với API của Codex:
     - Đồng hồ sticky dựa trên `endsAt` tuyệt đối, cảnh báo mốc 5 phút / 1 phút (đổi màu + rung), giữ sáng màn hình (Wake Lock), tự nộp khi hết giờ.
     - Chế độ Luyện tập (`practice`) cho phép tạm dừng / tiếp tục và xem đáp án ngay.
     - Chế độ Thi trạm (`station` OSCE) có màn chuẩn bị chuyển trạm 10 giây, đồng hồ riêng từng trạm, khoá trạm cũ.
     - Sau khi nộp: tự động chấm điểm trắc nghiệm (`gradeChoices`), giao diện tự chấm câu tự luận theo từng ý `Barem` (`SelfGrade`) và tính tổng điểm.
   - `/thi/lich-su`: Lịch sử các lần thi, trạng thái chấm và nút làm tiếp / xem lại bài làm.
4. **Web con 2 — Thư viện Tài liệu Chú thích Nguồn (`src/app/tai-lieu/**`, `src/features/library/**`, `src/lib/citation/**`, `src/server/library/**`)**:
   - Đã nối trực tiếp `renderLibraryMarkdown` của Claude vào `createLibraryService` của Codex trong `src/server/library/index.ts`.
   - `/tai-lieu`: Danh sách tài liệu (có sẵn tài liệu mẫu *Suy tim mạn — Chẩn đoán và điều trị*), lọc thư mục/tag, nút **🔄 Cập nhật từ Drive** gọi `POST /api/library/sync` (có khoá 409 chống chạy trùng) và hiển thị `SyncReport`.
   - `/tai-lieu/[id]`: Trình đọc tài liệu khổ trang A4 hoặc chữ chảy liên tục, thanh công cụ Zoom, Bật/Tắt tô màu nguồn, Mục lục tự động (`toc`), tô màu đoạn văn theo đồ thị nguồn không xung đột, rê chuột hoặc chạm vào đoạn màu / số `[n]` hiện Popover chứa tiêu đề nguồn và nút **Mở trên Google Drive ↗** (mọi link trong thân bài đã bị ẩn hoàn toàn).
5. **Xuất PDF A4 (`src/lib/print/**`, `/thi/de/[id]/in`, `/tai-lieu/[id]/in`)**:
   - Đề thi hỗ trợ 3 chế độ in: `Đề trống`, `Đề + Đáp án & Barem`, `Bài làm đã chấm` (`break-inside: avoid` chống cắt câu giữa trang).
   - Tài liệu hỗ trợ in `Có màu nguồn` (`print-color-adjust: exact`) hoặc `Đen trắng`, kèm danh mục Nguồn tham khảo cuối bài.

---

## 3. Tiến độ Chi tiết (Checklist)

### Wave 0 — Khởi tạo Hợp đồng Dữ liệu & Design System
- [x] **W0.1 (Antigravity - ORCH)**: Chốt `src/types/{dashboard,exam,library,index}.ts`, tạo cây thư mục phân vùng và `.env.example`.
- [x] **W0.2 (Antigravity - SA-UI)**: Xây dựng Design System (`src/components/ui/**`), responsive shell, dark mode, cỡ chữ, PWA manifest và trang `/dev/ui`.

### Wave 1 — Core Logic, Parser & Backend Services
- [x] **W1.4 & Hooks (Claude Code)**:
  - [x] Viết `src/lib/citation/index.ts` (`renderLibraryMarkdown`, `assignSourceColors`).
  - [x] Viết `src/hooks/useCountdown.ts` & `src/hooks/useExamAttempt.ts`.
- [x] **W1.2, W1.3, W1.5 (Codex)**:
  - [x] Viết `src/lib/exam-parser/index.ts` (`parseExamText`, `parseExamPdf` + kiểm tra lỗi `ParseIssue[]`).
  - [x] Viết `src/server/db/index.ts` (Memory Repositories có sẵn dữ liệu mẫu Y4) & `src/server/exam/grading.ts` (`gradeChoices`).
  - [x] Viết API routes `src/app/api/exam/**` & `src/server/library/index.ts` + `src/app/api/library/**`.
- [x] **W1.1 (Antigravity - SA-DASH)**:
  - [x] Dựng Kanban Dashboard tại `src/app/(dashboard)/page.tsx` và `src/features/dashboard/**`.

### Wave 2 & Wave 3 — Giao diện Web Con, Xuất PDF & Kiểm thử
- [x] **W2.1 (Antigravity - SA-EXAM)**: Dựng UI Ngân hàng đề, Nạp đề + Preview, Sửa đáp án + Hoàn tác, Làm bài chuẩn/trạm OSCE, Tự chấm barem, Lịch sử (`/thi/**`).
- [x] **W2.2 (Antigravity - SA-LIB)**: Dựng UI Thư viện tài liệu, nút Đồng bộ Drive, Trình đọc A4 tô màu theo nguồn + Tooltip mở link Drive (`/tai-lieu/**`).
- [x] **W3.1 (Antigravity - SA-PRINT)**: Dựng trang xuất PDF A4 cho Đề thi (`/thi/de/[id]/in`) và Tài liệu (`/tai-lieu/[id]/in`).
- [x] **W3.2 (Codex + Antigravity - SA-QA)**: 10 bộ Unit Tests (`36 tests passed`), `npm.cmd run typecheck` PASS, `npm.cmd run build` PASS.

---

## 4. Việc cần bạn làm tay khi triển khai thực tế (🔒)
1. Nếu muốn đồng bộ Google Drive thật: điền `GOOGLE_SERVICE_ACCOUNT_JSON` và `DRIVE_ROOT_FOLDER_ID` vào `.env.local` (xem `.env.example`).
2. Nếu muốn lưu trữ cố định qua Supabase thay cho Memory/JSON Backup: tạo project Supabase và cấu hình biến môi trường trong `.env.local`.
