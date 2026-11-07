# KẾ HOẠCH TRIỂN KHAI WEB HỌC Y4 — Bản giao cho Antigravity

> Người đọc chính: **Antigravity (Orchestrator)** và các subagent do Antigravity điều phối.
> Đọc kèm: `AGENTS.md`, `GEMINI.md`, `HANDOFF.md`.
> File mẫu đi kèm:
> - `docs/mau/MAU_DE_THI_VA_PROMPT.md`: định dạng đề thi PDF và prompt nhờ AI định dạng lại đề.
> - `docs/mau/MAU_TAI_LIEU_VA_PROMPT.md`: định dạng tài liệu Markdown/PDF có chú thích nguồn và prompt nhờ AI viết theo mẫu.

---

## 0. Tóm tắt sản phẩm

| Phần | Đường dẫn | Mô tả ngắn |
|---|---|---|
| **Dashboard** | `/` | Bảng kanban. Mỗi thẻ dẫn vào một web con. Kéo thả được trên chuột và cảm ứng. |
| **Web con 1: Thi thử** | `/thi` | Ngân hàng đề, nạp đề PDF, sửa đáp án, làm bài trắc nghiệm, tự luận và thi trạm có đồng hồ. Phần tự luận do người học tự chấm theo barem. Xuất PDF. |
| **Web con 2: Thư viện** | `/tai-lieu` | Kho tài liệu Markdown đồng bộ thủ công từ Google Drive. Trình đọc dạng trang PDF có chú thích nguồn hiện khi rê chuột hoặc chạm, tô màu theo nguồn, ẩn liên kết, xuất PDF. |

**Thiết kế giống nhưng độc lập**: ba phần dùng chung design system (`src/components/ui/`) nhưng mỗi web con có `layout.tsx`, dữ liệu, API và state riêng. Web con không import code của web con khác. Tắt một web con thì phần còn lại vẫn chạy.

**Thiết bị mục tiêu**: PC (Chrome, Edge, Safari), iPad (Safari, dọc và ngang), iPhone (Safari), Android (Chrome).

---

## 1. Quyết định kỹ thuật (đề xuất, bạn chốt trước khi làm)

| # | Vấn đề | Đề xuất mặc định | Lý do |
|---|---|---|---|
| D1 | Khung | **Next.js 15 App Router + Tailwind v4 + TS strict** (đã có trong repo) | Giữ nguyên khung đã dựng. |
| D2 | Lưu dữ liệu đề thi và bài làm | **Supabase** (Postgres + Storage cho PDF/ảnh), Dexie (IndexedDB) làm cache offline | Dùng chung giữa PC, iPad và điện thoại. Lựa chọn thay thế: chỉ IndexedDB kèm nút sao lưu JSON (không đồng bộ giữa máy). |
| D3 | Google Drive | **Service account** chỉ có quyền đọc một thư mục Drive. Gọi qua API route phía server. | Không lộ token ra trình duyệt. Không cần đăng nhập Google mỗi lần. |
| D4 | Xuất PDF | **Print CSS (A4) + `window.print()`**, có Paged.js để chia trang | Chữ dạng vector, giữ liên kết bấm được, chạy được trên iOS (mở share sheet → Lưu PDF). Không cần server dựng PDF. |
| D5 | Đọc PDF khi nạp đề | **pdfjs-dist** chạy trên trình duyệt | Lấy chữ kèm toạ độ, ảnh và cắt vùng bảng thành ảnh. |
| D6 | Kéo thả kanban | **@dnd-kit** | Hỗ trợ cảm ứng tốt trên iPad và điện thoại. |
| D7 | Render Markdown | **unified / remark-gfm / remark-footnotes / rehype** + plugin tự viết | Cần can thiệp AST để ẩn liên kết, gom chú thích và tô màu. |
| D8 | Tooltip | **@floating-ui/react** | Tự lật vị trí khi sát mép màn hình nhỏ. |
| D9 | Kiểm tra dữ liệu | **zod** | Kiểm tra đề sau khi parse và dữ liệu Drive. |
| D10 | Test | **Vitest** (unit) + **Playwright** (E2E với các profile Desktop Chrome, iPad Pro 11, iPhone 14, Pixel 7) | Bao phủ đủ bốn loại thiết bị. |
| D11 | Người dùng | **Không có đăng nhập**. Web dùng cá nhân, mở là dùng. | Bạn đã chốt bỏ đăng nhập. |
| D12 | Kiểu PDF xuất ở web con 2 | Câu yêu cầu bị cắt ở "xuất pdf dạng ...". Mặc định: **giống trình đọc** (giữ màu theo nguồn, số chú thích, danh mục nguồn có link ở cuối) | Bạn cần xác nhận hoặc sửa. |

> ⚠️ Theo quy tắc của bạn, **không giao tự động cho agent** các phần: tạo và lưu secret (Supabase key, service account JSON), deploy, xoá dữ liệu. Những mục này được đánh dấu 🔒 bên dưới. Bạn hoặc Claude làm tay.

---

## 2. Chức năng bạn chưa nhắc nhưng nên có

**Mức bắt buộc (làm trong bản đầu)**
1. **Tự lưu bài đang làm và làm tiếp**: lưu sau mỗi lần chọn đáp án. Tải lại trang, hết pin hay đổi máy vẫn làm tiếp. Đồng hồ lưu **thời điểm kết thúc**, không lưu số giây còn lại, nên không bị lệch.
2. **Xem trước khi nạp đề**: sau khi parse PDF, hiện bản xem trước và danh sách lỗi (ví dụ "Câu 12 thiếu đáp án") rồi mới lưu.
3. **Lịch sử làm bài và điểm**: danh sách các lần thi, điểm, thời gian, xem lại từng câu.
4. **Bảng điều hướng câu và cờ đánh dấu**: nhảy tới câu bất kỳ, đánh dấu câu cần xem lại, xem câu nào chưa làm.
5. **Tìm kiếm và lọc theo tag/môn** ở cả ngân hàng đề và thư viện.
6. **Responsive và PWA**: cài lên màn hình chính iPhone/Android/iPad, có icon và splash.
7. **Chế độ sáng/tối và chỉnh cỡ chữ** (cần cho đọc tài liệu dài trên điện thoại).
8. **Thùng rác (xoá mềm)**: xoá đề hoặc tài liệu thì vào thùng rác 30 ngày, tránh mất dữ liệu do bấm nhầm.
9. **Sao lưu và khôi phục JSON** toàn bộ ngân hàng đề và lịch sử.
10. **Giữ màn hình sáng khi thi** (Screen Wake Lock API), báo rung hoặc âm thanh khi còn 5 phút, còn 1 phút và khi chuyển trạm.

**Mức nên có (bản sau)**
11. **Sổ câu sai**: tự gom câu làm sai để ôn lại, có lặp lại ngắt quãng đơn giản (sai thì 1 ngày sau hỏi lại, đúng thì giãn ra 3, 7, 14 ngày).
12. **Tạo đề ngẫu nhiên** từ ngân hàng theo tag/môn và số câu; **trộn thứ tự câu và đáp án**.
13. **Thống kê**: tỉ lệ đúng theo môn/tag, câu hay sai nhất.
14. **Trình đọc**: mục lục bên cạnh, thanh tiến độ đọc, nhớ vị trí đọc, đánh dấu trang, tìm trong tài liệu, highlight và ghi chú cá nhân.
15. **Phóng to ảnh** (chụm hai ngón trên cảm ứng, bấm để xem toàn màn hình) ở cả đề thi và tài liệu.
16. **Đọc offline** các tài liệu đã đồng bộ (cache trong IndexedDB và service worker).
17. **Lịch sử sửa đáp án**: mỗi lần sửa đáp án đều ghi lại giá trị cũ, giá trị mới và thời gian, có nút hoàn tác.

---

## 3. Kiến trúc thư mục và quyền sở hữu (tránh hai agent sửa trùng file)

```
src/
├─ types/                      # HỢP ĐỒNG DỮ LIỆU — chốt ở Wave 0, sau đó KHOÁ
│  ├─ index.ts                 # re-export
│  ├─ dashboard.ts
│  ├─ exam.ts
│  └─ library.ts
├─ components/ui/              # Design system dùng chung (Button, Card, Modal, Tooltip, Timer, Tabs, Sheet...)
├─ app/
│  ├─ layout.tsx               # Root: theme, font, PWA meta, safe-area
│  ├─ (dashboard)/page.tsx     # "/" Kanban
│  ├─ thi/                     # Web con 1 — layout riêng
│  │  ├─ layout.tsx
│  │  ├─ page.tsx              # Ngân hàng đề
│  │  ├─ nap-de/page.tsx       # Nạp PDF + preview
│  │  ├─ de/[id]/page.tsx      # Chi tiết + sửa đáp án
│  │  ├─ de/[id]/lam-bai/page.tsx
│  │  ├─ de/[id]/in/page.tsx   # Trang in PDF
│  │  └─ lich-su/...
│  ├─ tai-lieu/                # Web con 2 — layout riêng
│  │  ├─ layout.tsx
│  │  ├─ page.tsx              # Danh sách tài liệu + nút "Cập nhật từ Drive"
│  │  ├─ [id]/page.tsx         # Trình đọc
│  │  └─ [id]/in/page.tsx      # Trang in PDF
│  └─ api/
│     ├─ exam/...              # CRUD đề, bài làm
│     └─ library/
│        ├─ sync/route.ts      # POST: đồng bộ thủ công
│        ├─ docs/route.ts
│        └─ image/[fileId]/route.ts   # proxy ảnh Drive
├─ features/
│  ├─ dashboard/               # component + hook riêng của kanban
│  ├─ exam/                    # component + hook riêng của web thi
│  └─ library/                 # component + hook riêng của thư viện
├─ server/
│  ├─ db/                      # Repository interface + Supabase adapter
│  ├─ exam/                    # Lưu đề, chấm trắc nghiệm
│  └─ library/                 # Drive client, sync, cache
└─ lib/
   ├─ exam-parser/             # PDF → Exam (thuần, test được)
   ├─ citation/                # Markdown → blocks + nguồn + tô màu (thuần, test được)
   └─ print/                   # CSS in và helper xuất PDF
tests/
├─ unit/{exam-parser,citation,grading,timer}/
├─ fixtures/                   # PDF và MD mẫu
└─ e2e/                        # Playwright
```

**Quy tắc**:
- Mỗi subagent chỉ được ghi trong thư mục của mình (xem bảng mục 5).
- `src/types/**` chỉ sửa ở Wave 0. Cần thêm trường thì ghi đề xuất vào `HANDOFF.md`, Orchestrator gộp và commit lên `main`, rồi các nhánh rebase.
- `src/components/ui/**` chỉ do SA-UI sở hữu. Subagent khác cần thêm component thì để trong `features/<web>/` của mình.
- `package.json`: chỉ Orchestrator thêm dependency, làm một lần ở Wave 0 để tránh conflict lockfile.

---

## 4. Hợp đồng dữ liệu (bản nháp cho Wave 0)

```ts
// ===== src/types/dashboard.ts =====
export interface BoardColumn { id: string; title: string; order: number; }
export interface BoardCard {
  id: string;
  columnId: string;
  order: number;
  title: string;
  description?: string;
  kind: 'app' | 'note';          // app = dẫn vào web con; note = thẻ ghi chú tự do
  href?: string;                 // '/thi' | '/tai-lieu' | ...
  icon?: string;
  accent?: string;               // token màu
  stats?: { label: string; value: string }[]; // ví dụ "32 đề", "Đồng bộ 2 ngày trước"
}

// ===== src/types/exam.ts =====
export type ContentBlock =
  | { type: 'text'; md: string }
  | { type: 'image'; src: string; alt?: string; width?: number; height?: number }
  | { type: 'table'; rows: string[][]; hasHeader: boolean; fallbackImage?: string };

export type QuestionType = 'mcq_single' | 'mcq_multi' | 'true_false' | 'essay';

export interface Choice { key: string; content: ContentBlock[]; }       // key: 'A' | 'B' | ...
export interface RubricItem { id: string; label: string; points: number; }

export interface Question {
  id: string;
  number: number;
  type: QuestionType;
  points: number;
  stem: ContentBlock[];
  choices?: Choice[];
  correctKeys?: string[];          // trắc nghiệm
  modelAnswer?: ContentBlock[];    // tự luận: đáp án mẫu
  rubric?: RubricItem[];           // tự luận: barem tự chấm
  note?: ContentBlock[];           // ghi chú/giải thích
  tags: string[];
  sourcePage?: number;             // trang trong PDF gốc
}

export interface ExamSection { id: string; title: string; questionIds: string[]; }
export interface Station {
  id: string;
  title: string;
  durationSec: number;
  scenario: ContentBlock[];
  questionIds: string[];
}

export interface Exam {
  id: string;
  title: string;
  subject: string;
  tags: string[];
  mode: 'standard' | 'station';
  durationSec: number;             // standard: tổng giờ; station: tổng các trạm
  sections: ExamSection[];
  stations?: Station[];
  questions: Record<string, Question>;
  sourcePdfPath?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;       // xoá mềm
  version: number;
}

export interface AnswerEdit {
  id: string; examId: string; questionId: string;
  field: 'correctKeys' | 'modelAnswer' | 'rubric' | 'note' | 'stem' | 'choices';
  before: unknown; after: unknown; editedAt: string;
}

export type AnswerValue =
  | { kind: 'choice'; keys: string[] }
  | { kind: 'essay'; text: string };

export interface SelfGrade { checkedRubricIds: string[]; score: number; comment?: string; }

export interface Attempt {
  id: string;
  examId: string;
  examVersion: number;
  mode: 'exam' | 'practice';       // practice: được tạm dừng, xem đáp án ngay
  startedAt: string;
  endsAt: string;                  // mốc kết thúc tuyệt đối → chống lệch đồng hồ
  currentStationIndex?: number;
  stationEndsAt?: string;
  answers: Record<string, AnswerValue>;
  flagged: string[];
  submittedAt?: string;
  autoScore?: number;              // phần trắc nghiệm
  selfGrades: Record<string, SelfGrade>;
  totalScore?: number;
  status: 'in_progress' | 'submitted' | 'graded';
}

export interface ParseIssue { level: 'error' | 'warning'; questionNumber?: number; page?: number; message: string; }
export interface ParseResult { exam: Exam; issues: ParseIssue[]; }

// ===== src/types/library.ts =====
export interface SourceRef {
  key: string;                     // khoá chú thích trong md, ví dụ "1" hoặc "harrison-21"
  label: number;                   // số hiển thị, đánh theo thứ tự xuất hiện trong tài liệu
  title: string;
  url: string;                     // link Google Drive bên ngoài (không phải tài liệu trong DB)
  colorIndex: number;              // gán bởi thuật toán tô màu
}

export type DocBlockKind = 'heading' | 'paragraph' | 'list' | 'table' | 'figure' | 'quote';

export interface DocSegment { html: string; sourceKey: string | null; }  // đoạn chữ từ chú thích trước tới chú thích này

export interface DocBlock {
  id: string;
  kind: DocBlockKind;
  segments: DocSegment[];          // paragraph/list: nhiều đoạn; table/figure: một đoạn, nguồn lấy từ caption
  level?: number;                  // heading
}

export interface LibraryDoc {
  id: string;
  driveFileId: string;
  title: string;
  folderPath: string;
  tags: string[];
  driveModifiedTime: string;
  syncedAt: string;
  contentHash: string;
  deletedAt?: string | null;
}

export interface RenderedDoc { doc: LibraryDoc; blocks: DocBlock[]; sources: SourceRef[]; toc: { id: string; text: string; level: number }[]; }

export interface SyncReport {
  startedAt: string; finishedAt: string;
  added: string[]; updated: string[]; removed: string[]; unchanged: number;
  errors: { driveFileId: string; name: string; message: string }[];
}
```

---

## 5. Phân việc subagent

### 5.1. Danh sách subagent và vùng được ghi

| Mã | Vai trò | Được ghi | Không được ghi |
|---|---|---|---|
| **ORCH** | Antigravity chính: chốt types, cài deps, gộp nhánh vào nhánh tích hợp, cập nhật HANDOFF | `src/types/**`, `package.json`, `HANDOFF.md`, `docs/**` | code tính năng của subagent |
| **SA-UI** | Design system, shell, responsive, PWA, theme | `src/components/ui/**`, `src/app/layout.tsx`, `src/app/globals.css`, `public/**` (icon, manifest) | `features/**`, `server/**`, `lib/**` |
| **SA-DASH** | Kanban dashboard | `src/app/(dashboard)/**`, `src/features/dashboard/**`, `tests/unit/dashboard/**` | các phần khác |
| **SA-PARSE** | Parser PDF đề thi (logic thuần) | `src/lib/exam-parser/**`, `tests/unit/exam-parser/**`, `tests/fixtures/exam/**` | UI, server |
| **SA-EXAM** | UI web thi: ngân hàng, nạp đề, sửa đáp án, làm bài, đồng hồ, tự chấm, lịch sử | `src/app/thi/**`, `src/features/exam/**`, `tests/unit/{grading,timer}/**` | `lib/exam-parser/**`, `server/**` |
| **SA-API** | Repository, API đề thi và bài làm | `src/server/db/**`, `src/server/exam/**`, `src/app/api/exam/**`, `supabase/migrations/**` | UI |
| **SA-CITE** | Markdown → blocks, chú thích, tô màu, ẩn link (logic thuần) | `src/lib/citation/**`, `tests/unit/citation/**`, `tests/fixtures/library/**` | UI, server |
| **SA-DRIVE** | Đồng bộ Drive thủ công, cache, proxy ảnh | `src/server/library/**`, `src/app/api/library/**` | UI, secret thật |
| **SA-LIB** | UI thư viện và trình đọc | `src/app/tai-lieu/**`, `src/features/library/**` | `lib/citation/**`, `server/**` |
| **SA-PRINT** | Xuất PDF cho cả hai web con (CSS in, trang `/in`) | `src/lib/print/**`, `src/app/thi/de/[id]/in/**`, `src/app/tai-lieu/[id]/in/**` | phần còn lại |
| **SA-QA** | E2E đa thiết bị, a11y, review | `tests/e2e/**`, `playwright.config.ts` | code sản phẩm (chỉ báo lỗi vào HANDOFF) |

> Trang `/in` thuộc SA-PRINT. SA-EXAM và SA-LIB chỉ đặt nút "Xuất PDF" dẫn tới trang đó, nhờ vậy không ai sửa trùng file.

### 5.2. Thứ tự các wave

```
Wave 0 (tuần tự)   ORCH: types + deps + repo skeleton   →   SA-UI: design system + shell
                                    │
Wave 1 (song song) ├─ SA-DASH   ├─ SA-PARSE   ├─ SA-API   ├─ SA-CITE   ├─ SA-DRIVE
                                    │
Wave 2 (song song) ├─ SA-EXAM (cần PARSE + API)        ├─ SA-LIB (cần CITE + DRIVE)
                                    │
Wave 3 (song song) ├─ SA-PRINT                          ├─ SA-QA (E2E đa thiết bị)
                                    │
Wave 4             ORCH: tích hợp, sửa lỗi chéo, HANDOFF, báo cáo  →  bạn review và merge
```

Mỗi subagent làm trong **worktree và nhánh riêng `agy/<ma-task>`**, ví dụ `agy/w1-parse`. Khi xong thì commit trên nhánh đó. **Không tự merge vào `main`.**

---

## 6. Brief chi tiết từng task

> Lệnh kiểm tra chung (Windows, luôn dùng `.cmd`):
> `npm.cmd run typecheck` · `npm.cmd test` · `npm.cmd run build` · `npx.cmd playwright test` (từ Wave 3)

### W0.1 — ORCH: Hợp đồng dữ liệu và khung repo
- **Mục tiêu**: tạo `src/types/{dashboard,exam,library}.ts` theo mục 4 và re-export trong `index.ts`. Cài các dependency trong D1–D10. Tạo các thư mục rỗng ở mục 3 (dùng `.gitkeep`). Thêm `.env.example` liệt kê tên biến (không có giá trị thật).
- **Được sửa**: `src/types/**`, `package.json`, `package-lock.json`, `.env.example`, `HANDOFF.md`.
- **Không sửa**: `src/app/**` (trừ khi tạo thư mục rỗng).
- **Kiểm tra**: `typecheck`, `test`, `build` đều pass.
- **Xong khi**: commit lên `main` (hoặc nhánh tích hợp `dev`) để các nhánh Wave 1 tách ra từ đây.

### W0.2 — SA-UI: Design system và responsive shell
- **Mục tiêu**:
  - Token màu (sáng/tối), font hỗ trợ tiếng Việt (Be Vietnam Pro hoặc Inter), thang khoảng cách, bo góc.
  - Component: `Button`, `IconButton`, `Card`, `Badge`, `Tabs`, `Modal`, `Sheet` (bottom sheet trên mobile), `Tooltip` (hover trên PC, chạm trên cảm ứng), `Toast`, `Input`, `Select`, `TagInput`, `EmptyState`, `Skeleton`, `ThemeToggle`, `FontSizeControl`, `AppShell` (header + nút quay về Dashboard).
  - Breakpoint: `sm 390` (iPhone), `md 768` (iPad dọc), `lg 1024` (iPad ngang), `xl 1280` (PC).
  - Vùng chạm tối thiểu 44×44px. Dùng `env(safe-area-inset-*)` cho tai thỏ iPhone. Dùng `100dvh` thay `100vh`. Ô nhập có `font-size ≥ 16px` để iOS không tự zoom.
  - PWA: `manifest.webmanifest`, icon 192/512, `apple-touch-icon`, `theme-color`.
  - Trang `/dev/ui` hiển thị tất cả component để kiểm tra bằng mắt.
- **Được sửa / Không sửa**: theo bảng 5.1.
- **Kiểm tra**: `typecheck`, `build`. Mở `/dev/ui` ở 360px, 768px, 1024px và 1440px: không có thanh cuộn ngang.

### W1.1 — SA-DASH: Kanban
- **Mục tiêu**:
  - Cột mặc định: "Đang dùng", "Ôn tập", "Lưu trữ" (đổi tên, thêm, xoá được).
  - Thẻ `app` cho "Thi thử" (`/thi`) và "Thư viện" (`/tai-lieu`) hiện số liệu nhanh (số đề, lần đồng bộ cuối). Thẻ `note` để ghi chú tự do.
  - Kéo thả thẻ giữa các cột và đổi thứ tự bằng @dnd-kit, có sensor chuột, cảm ứng (nhấn giữ 200ms) và bàn phím.
  - Mobile dưới 768px: các cột thành tab vuốt ngang (scroll-snap). Kéo thả vẫn chạy, hoặc dùng menu "Chuyển sang cột…".
  - Lưu bố cục qua repository (W1.3). Trong lúc chờ có thể dùng localStorage adapter.
- **Kiểm tra**: unit test cho hàm đổi thứ tự (`moveCard`) và `typecheck`.

### W1.2 — SA-PARSE: Parser PDF đề thi
- **Đầu vào**: PDF làm theo `docs/mau/MAU_DE_THI_VA_PROMPT.md`.
- **Mục tiêu**: `parseExamPdf(file: ArrayBuffer): Promise<ParseResult>`
  1. Dùng pdfjs lấy text items kèm toạ độ, ghép thành dòng theo trục y. Bỏ header/footer lặp lại.
  2. Nhận diện marker bằng regex (danh sách đầy đủ trong file mẫu): `ĐỀ:`, `MÔN:`, `THỜI GIAN:`, `CHẾ ĐỘ:`, `PHẦN`, `TRẠM n (x phút)`, `Câu n.` / `Câu n (x điểm).`, `A.`…`F.`, `Đáp án:`, `Đáp án mẫu:`, `Barem:`, `- Ý ... (x đ):`, `Ghi chú:`, `Tag:`.
  3. **Ảnh**: lấy ảnh từ operator list (`paintImageXObject`), gán vào câu hoặc lựa chọn gần nhất theo toạ độ y, xuất ra blob để upload.
  4. **Bảng**: nhận diện qua dòng caption `Bảng n:`. Cắt vùng bảng thành ảnh (render trang lên canvas rồi crop) làm `fallbackImage`, đồng thời thử tách ô theo cột x. Tách ô thất bại thì chỉ dùng ảnh và báo `warning`.
  5. Định dạng chữ: giữ **đậm**/*nghiêng* nếu font name có Bold/Italic. Chỉ số trên và dưới để dạng text.
  6. Kiểm tra bằng zod và trả về `issues`: thiếu đáp án, trùng số câu, đáp án không thuộc A–F, barem không cộng đủ số điểm, trạm thiếu thời gian.
- **Fixture**: tạo 3 PDF mẫu trong `tests/fixtures/exam/` (chỉ trắc nghiệm, chỉ tự luận, thi trạm có ảnh và bảng). Có thể dựng từ HTML bằng Playwright `page.pdf()`.
- **Kiểm tra**: `npm.cmd test -- exam-parser`. Ba fixture parse đúng số câu, đáp án, ảnh và bảng.

### W1.3 — SA-API: Repository và API đề thi
- **Mục tiêu**:
  - Interface `ExamRepository`, `AttemptRepository`, `BoardRepository`, `LibraryRepository` trong `src/server/db/`. Có 2 adapter: `memory` (cho test và dev chưa có secret) và `supabase`.
  - Migration SQL: bảng `exams` (jsonb), `answer_edits`, `attempts`, `board`, `library_docs`. Bucket `exam-assets`.
  - API: CRUD đề (có xoá mềm và khôi phục), PATCH đáp án (ghi `answer_edits`), tạo, lưu tạm và nộp bài, chấm trắc nghiệm trên server (`gradeChoices`), lưu điểm tự chấm, export/import JSON.
  - Chấm `mcq_multi`: đúng toàn bộ mới có điểm (mặc định). Để sẵn tuỳ chọn chấm từng phần.
- 🔒 **Không làm**: tạo project Supabase, key thật. Chỉ đọc biến môi trường. Thiếu biến thì tự chuyển sang adapter `memory`.
- **Kiểm tra**: unit test `gradeChoices` và các repository với adapter memory, `typecheck`.

### W1.4 — SA-CITE: Chú thích, tô màu, ẩn liên kết
- **Đầu vào**: Markdown theo `docs/mau/MAU_TAI_LIEU_VA_PROMPT.md` cùng file nguồn chung `_nguon.md` (nếu có).
- **Mục tiêu**: `renderLibraryMarkdown(md: string, sharedSources?: string): Omit<RenderedDoc,'doc'>`
  1. Parse bằng remark (gfm + footnote).
  2. **Gộp định nghĩa nguồn**: định nghĩa ngay trong file được ưu tiên hơn định nghĩa trong `_nguon.md`. Mỗi định nghĩa có dạng `[^key]: [Tiêu đề](https://drive.google.com/...)`. Định nghĩa không có link Drive thì báo warning.
  3. **Đánh số** `label` theo thứ tự xuất hiện lần đầu trong tài liệu (1, 2, 3…). Cùng một nguồn dùng lại thì giữ số cũ.
  4. **Chia đoạn theo nguồn**: trong paragraph hoặc list item, phần chữ từ sau marker trước tới marker hiện tại thuộc nguồn của marker hiện tại. Phần chữ sau marker cuối cùng mà không có marker nào theo sau được gán `sourceKey = null`. Bảng và hình lấy nguồn từ marker trong caption. Heading không tô màu.
  5. **Ẩn liên kết**: mọi `[text](url)` trong thân bài chỉ còn `text`. URL trần bị xoá. Ảnh vẫn giữ. Link chỉ còn tồn tại trong `SourceRef.url`.
  6. **Tô màu** (`assignSourceColors`), bài toán tô màu đồ thị:
     - Đỉnh là các nguồn. Hai nguồn có cạnh nối nếu có hai đoạn **liền kề** (kể cả qua ranh giới block) mang hai nguồn đó.
     - Tô tham lam theo thứ tự `label` với bảng 8 màu pastel (đủ tương phản cho chữ, có biến thể cho dark mode). Nếu hết màu thì sinh thêm màu bằng cách xoay hue.
     - Bảo đảm: **cùng nguồn thì cùng màu trong cả tài liệu**, và **hai đoạn liền kề khác nguồn thì khác màu**.
  7. Sinh `toc` từ heading.
  8. Sanitize HTML (rehype-sanitize) để chặn script trong md.
- **Kiểm tra**: unit test cho các trường hợp: 2 nguồn xen kẽ A-B-A-B (chỉ cần 2 màu), một nguồn lặp không liền kề, đoạn có 3 marker, bảng có caption, link bị ẩn, nguồn lấy từ `_nguon.md`, marker không có định nghĩa (báo lỗi, không crash).

### W1.5 — SA-DRIVE: Đồng bộ Drive thủ công
- **Mục tiêu**:
  - `POST /api/library/sync`: liệt kê đệ quy thư mục gốc (`DRIVE_ROOT_FOLDER_ID`), lấy file `.md`, `_nguon.md` và ảnh. So `modifiedTime` và `md5Checksum` với cache để chỉ tải file thay đổi. Lưu nội dung md và metadata. File bị xoá trên Drive thì đánh dấu `deletedAt`, không xoá cứng. Trả về `SyncReport`.
  - **Không có cron, không webhook, không tự đồng bộ khi mở trang.** Chỉ chạy khi bấm nút.
  - Ảnh trong md dùng đường dẫn tương đối (`./hinh/abc.png`). Khi sync, đổi đường dẫn này thành `/api/library/image/<driveFileId>`. Route này proxy ảnh và đặt cache header dài.
  - Khoá chống chạy đồng thời: đang sync thì request thứ hai nhận 409.
  - Đọc file service account từ biến môi trường `GOOGLE_SERVICE_ACCOUNT_JSON`, phạm vi `drive.readonly`.
- 🔒 **Không làm**: tạo service account, chia sẻ thư mục, điền secret.
- **Kiểm tra**: unit test với Drive client giả lập: thêm, sửa, xoá file, lỗi mạng một file thì các file khác vẫn sync và lỗi nằm trong `errors`.

### W2.1 — SA-EXAM: Giao diện web thi
- **Ngân hàng đề** (`/thi`): lưới thẻ đề có lọc môn/tag, tìm kiếm, sắp xếp, mục thùng rác. Mỗi thẻ có nút: Làm bài, Luyện tập, Sửa, Xuất PDF, Xoá (vào thùng rác).
- **Nạp đề** (`/thi/nap-de`): kéo thả hoặc chọn PDF (trên iOS mở được Tệp/iCloud). Chạy `parseExamPdf` trong Web Worker. Màn preview hiện từng câu bên cạnh danh sách `issues`. Sửa nhanh ngay trên preview rồi bấm Lưu. Có link tải file mẫu và prompt AI.
- **Chi tiết và sửa** (`/thi/de/[id]`): mỗi câu có nút ✏️. Sửa được đáp án đúng (chọn A–F, nhiều đáp án), đáp án mẫu, barem, ghi chú, nội dung câu và thêm/xoá ảnh. Có tab "Lịch sử sửa" với nút hoàn tác.
- **Làm bài** (`/thi/de/[id]/lam-bai?mode=exam|practice`):
  - **Đồng hồ**: luôn hiện (sticky trên đầu ở mobile). Đếm ngược theo `endsAt`. Đổi màu và rung (`navigator.vibrate` trên Android) khi còn 5 phút và 1 phút. Hết giờ thì tự nộp. Chế độ practice có nút tạm dừng.
  - **Thi trạm**: mỗi trạm có đồng hồ riêng. Hết giờ trạm thì báo và tự chuyển trạm, không quay lại trạm cũ được (giống OSCE). Có màn "Chuẩn bị trạm tiếp theo" đếm 10 giây.
  - Bảng điều hướng câu (drawer bên phải trên PC, bottom sheet trên mobile), cờ đánh dấu, tự lưu sau mỗi thay đổi (debounce 500ms, kèm cache offline).
  - Wake Lock khi đang thi. Cảnh báo `beforeunload`.
- **Sau khi nộp**:
  - Trắc nghiệm chấm tự động, hiện đúng/sai và ghi chú.
  - **Tự luận và trạm tự chấm**: hiện bài làm cạnh đáp án mẫu. Barem là các checkbox, tick ý nào cộng điểm ý đó. Có ô nhận xét. Bấm "Hoàn tất chấm" thì có tổng điểm.
- **Lịch sử** (`/thi/lich-su`): danh sách các lần làm, điểm, thời gian. Mở lại được để xem bài.
- **Kiểm tra**: unit test `useCountdown` (giả lập thời gian, tải lại trang không lệch), test tính điểm tự chấm, `typecheck`, `build`.

### W2.2 — SA-LIB: Thư viện và trình đọc
- **Danh sách** (`/tai-lieu`): cây thư mục theo Drive và lưới hoặc danh sách tài liệu, tìm kiếm, lọc tag. Nút **"Cập nhật từ Drive"** gọi API sync, trong lúc chạy hiện tiến trình, xong thì hiện `SyncReport` (thêm, sửa, xoá, lỗi). Hiện "Đồng bộ lần cuối: …".
- **Trình đọc** (`/tai-lieu/[id]`):
  - Giao diện **giống trình đọc PDF**: các trang khổ A4 có bóng đổ trên nền xám. Dùng Paged.js để chia trang ngay trên màn hình. Toolbar có zoom (vừa chiều rộng, 100%, 125%), số trang hiện tại/tổng, nhảy trang, mục lục, tìm trong tài liệu, cỡ chữ, sáng/tối.
  - Trên điện thoại: mặc định chế độ "vừa chiều rộng", có thể chuyển sang chế độ chữ chảy liên tục cho dễ đọc.
  - **Tô màu**: mỗi `DocSegment` có nền nhạt theo `colorIndex` của nguồn. Có nút bật/tắt tô màu.
  - **Chú thích**: số chú thích dạng chỉ số trên `[1]`. Trên PC, rê chuột vào số hoặc vào đoạn được tô màu thì hiện tooltip gồm số, tiêu đề nguồn và nút "Mở trên Google Drive ↗" (mở tab mới). Trên cảm ứng, chạm để hiện popover, chạm ra ngoài để đóng. Dùng `@media (hover: hover)` để chọn hành vi.
  - Link trong thân bài **đã bị ẩn** từ SA-CITE. Chỉ tooltip mới chứa link.
  - Ảnh bấm vào thì phóng to (lightbox, chụm để zoom). Bảng rộng cuộn ngang trong khung riêng, không làm trang bị cuộn ngang.
  - Nhớ vị trí đọc theo tài liệu.
- **Kiểm tra**: `typecheck`, `build`, kiểm tra bằng mắt ở 390px và 1024px.

### W3.1 — SA-PRINT: Xuất PDF
- **Đề thi** (`/thi/de/[id]/in?variant=blank|answers|attempt&attemptId=`):
  - `blank`: đề trống để in ra làm.
  - `answers`: đề kèm đáp án đúng, đáp án mẫu, barem và ghi chú.
  - `attempt`: bài đã làm, đúng/sai, điểm tự chấm.
  - Header có tên đề, môn và thời gian. Footer có số trang "Trang x/y". Không ngắt trang giữa một câu (`break-inside: avoid`).
- **Tài liệu** (`/tai-lieu/[id]/in`): A4, giữ màu nền theo nguồn (`print-color-adjust: exact`), số chú thích, cuối tài liệu có mục **"Nguồn"** liệt kê `[n] Tiêu đề — link Drive` bấm được. Có tuỳ chọn in không màu.
- Nút "Xuất PDF" gọi `window.print()` sau khi Paged.js dựng xong. Trên iOS, hiện hướng dẫn ngắn: "Chọn Chia sẻ → Lưu vào Tệp".
- **Kiểm tra**: Playwright `page.pdf()` cho 1 đề và 1 tài liệu fixture, kiểm tra file tạo được và có số trang hợp lý.

### W3.2 — SA-QA: Kiểm thử đa thiết bị
- `playwright.config.ts` với các project: `Desktop Chrome`, `Desktop Safari`, `iPad Pro 11` (dọc và ngang), `iPhone 14`, `Pixel 7`.
- Kịch bản E2E:
  1. Dashboard: mở trang, kéo một thẻ sang cột khác, tải lại trang vẫn giữ.
  2. Nạp PDF fixture, xem preview, lưu, sửa đáp án câu 1, kiểm tra lịch sử sửa.
  3. Làm bài trắc nghiệm với đồng hồ giả lập, hết giờ thì tự nộp, điểm đúng.
  4. Thi trạm: tự chuyển trạm, tự chấm barem, tổng điểm đúng.
  5. Thư viện: bấm sync (Drive giả lập), mở tài liệu, rê chuột hoặc chạm chú thích thì thấy link Drive, trong thân bài không có thẻ `<a>`, hai đoạn liền kề khác nguồn có màu khác nhau.
  6. Không có thanh cuộn ngang ở mọi viewport.
- Chạy axe-core để kiểm tra a11y cơ bản (tương phản màu tô, focus, aria cho tooltip).
- **Không sửa code sản phẩm.** Lỗi thì ghi vào `HANDOFF.md` theo dạng: file, bước tái hiện, kỳ vọng và thực tế.

### W4 — ORCH: Tích hợp
- Gộp các nhánh `agy/*` vào **nhánh tích hợp `dev`** (không phải `main`), giải quyết conflict, chạy đủ `typecheck`, `test`, `build` và `playwright test`.
- Cập nhật `HANDOFF.md`: đã xong, còn dở, lỗi đã biết, danh sách 🔒 việc bạn cần làm tay.
- **Dừng lại báo bạn review. Không merge vào `main`.**

---

## 7. Việc bạn hoặc Claude làm tay (🔒)

1. Tạo project Supabase, điền `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` vào `.env.local`.
2. Google Cloud: bật Drive API, tạo service account, tải JSON vào `GOOGLE_SERVICE_ACCOUNT_JSON`, chia sẻ thư mục tài liệu cho email của service account (quyền Viewer), điền `DRIVE_ROOT_FOLDER_ID`.
3. Deploy (gợi ý Vercel) và đặt biến môi trường trên đó.
4. Review `git diff`, chạy test và build, rồi merge.

---

## 8. Ma trận kiểm tra thiết bị (checklist thủ công trước khi merge)

| Kiểm tra | PC | iPad dọc | iPad ngang | iPhone | Android |
|---|---|---|---|---|---|
| Kéo thả kanban | ☐ | ☐ | ☐ | ☐ | ☐ |
| Chọn file PDF để nạp đề | ☐ | ☐ | ☐ | ☐ | ☐ |
| Đồng hồ sticky, không bị bàn phím che | ☐ | ☐ | ☐ | ☐ | ☐ |
| Tooltip nguồn (hover hoặc chạm) | ☐ | ☐ | ☐ | ☐ | ☐ |
| Xuất PDF | ☐ | ☐ | ☐ | ☐ | ☐ |
| Cài PWA lên màn hình chính | — | ☐ | ☐ | ☐ | ☐ |
| Dark mode | ☐ | ☐ | ☐ | ☐ | ☐ |

---

## 9. Mẫu brief để Orchestrator giao cho từng subagent

```text
[TASK <mã>] <tên task>
Bối cảnh: Đọc AGENTS.md, HANDOFF.md và docs/KE_HOACH_ANTIGRAVITY.md mục <số>.
Nhánh/worktree: agy/<mã-task>, tách từ <main|dev> tại commit <sha>.
Mục tiêu: <copy từ mục 6>
Được sửa: <danh sách>
KHÔNG được sửa: src/types/**, package.json, file của subagent khác, mọi file .env*
Không tự thêm dependency. Cần thêm thì ghi đề xuất vào HANDOFF.md.
Không làm việc 🔒 (secret, deploy, xoá dữ liệu thật).
Kiểm tra bắt buộc: npm.cmd run typecheck && npm.cmd test && npm.cmd run build
Xong khi: tất cả lệnh kiểm tra pass, đã commit trên nhánh, HANDOFF.md có báo cáo gồm: file đã sửa, test đã thêm, việc còn dở, rủi ro.
```

---

## 10. Rủi ro đã biết

| Rủi ro | Cách giảm |
|---|---|
| Parse PDF sai khi đề không theo mẫu | Bắt buộc dùng file mẫu và prompt AI để định dạng lại. Màn preview cho sửa tay trước khi lưu. |
| Bảng trong PDF mất cấu trúc | Luôn giữ ảnh cắt vùng bảng (`fallbackImage`). Có trình sửa để chuyển sang bảng thật. |
| iOS Safari không có hover | Dùng `@media (hover: hover)` và luôn có hành vi chạm thay thế. |
| iOS không hỗ trợ `navigator.vibrate` | Dùng âm thanh và đổi màu đồng hồ thay cho rung. |
| Paged.js chậm với tài liệu rất dài | Có chế độ chữ chảy liên tục. Chỉ dựng trang khi mở chế độ trang hoặc khi in. |
| Hết màu khi có quá nhiều nguồn liền kề | Sinh thêm màu bằng cách xoay hue, giữ độ sáng cố định để chữ vẫn đọc được. |
| Quota Drive API | Chỉ sync thủ công và chỉ tải file có `md5Checksum` thay đổi. |
