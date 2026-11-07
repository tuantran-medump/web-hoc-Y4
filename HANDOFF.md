# HANDOFF.md — Bảng Trạng thái & Chuyển giao Công việc (State-on-Disk)

> **Hướng dẫn sử dụng nhanh khi 1 Agent hết token trên Orca:**
> Mở Agent dự phòng (Codex hoặc Antigravity) ngay trong cùng Worktree và nhập:
> `"Tiếp quản công việc đang dở: Đọc HANDOFF.md, chạy git status --short và git diff để nắm phần code đang sửa và làm tiếp."`

---

## 1. Nhiệm vụ Hiện tại (Active Task)
- **Tên tính năng / Task**: `[Luồng C — Nâng cấp Major Version & Vá Bảo mật]: Xử lý cảnh báo npm allowScripts (esbuild), nâng cấp next@16.4.5, vitest@5.1.0, @types/node@24 và đạt 0 vulnerabilities`
- **Nhánh / Worktree**: `main`
- **Agent phụ trách chính**:
  - **Antigravity (`Gemini Pro Argon 4` — 50% tải • Orchestrator & Lockfile Owner)**: Độc quyền sửa `package.json`, `package-lock.json`, `tsconfig.json`, cấu hình `allowScripts` cho `npm` major mới, kiểm tra UI/Pages dưới Next.js 16 và quản lý Merge/Push.
  - **Claude Code (`Claude Pro` — 15% tải • Breaking-Change & Hook Adapter)**: Rà soát & tinh chỉnh tương thích React 19 / Next 16 cho các Custom Hooks (`src/hooks/useCountdown.ts`, `src/hooks/useExamAttempt.ts`) và `src/lib/citation/index.ts` nếu phát sinh cảnh báo kiểu dữ liệu hoặc lifecycle.
  - **Codex (`GPT Pro` — 35% tải • Audit, Test & Backend Verifier)**: Cập nhật `vitest.config.ts` & bộ test `tests/unit/**` tương thích `vitest@5.1.0` + `@types/node@24`, chạy vòng lặp `npm.cmd audit` $\rightarrow$ `npm.cmd run typecheck` $\rightarrow$ `npm.cmd test` $\rightarrow$ `npm.cmd run build` và review `git diff`.
- **Agent dự phòng (Backup)**: `Codex (Backend/Test/Audit) | Antigravity (UI/Lockfile/Full-stack)`

---

## 2. Tóm tắt Ngữ cảnh (Context Brief — Do Antigravity chuẩn bị cho Claude & Codex)

### A. Chẩn đoán 4 Vấn đề Cần Xử lý Triệt để
1. **Cảnh báo `npm warn install-scripts` (`esbuild@0.28.2`)**:
   - Ở bản `npm` major kế tiếp, các gói chạy `postinstall` chưa được phê duyệt trong `allowScripts` của `package.json` sẽ bị chặn mặc định.
   - **Giải pháp (Antigravity)**: Chạy `npm.cmd install-scripts approve esbuild` / thêm cấu hình `allowScripts` vào `package.json`.
2. **Lỗ hổng Bảo mật `postcss <= 8.5.22` (High) trong `next@15.5.29`**:
   - **Giải pháp (Antigravity)**: Nâng `next` lên `^16.4.5` trong `package.json` và cập nhật `tsconfig.json` (`jsx: "react-jsx"` theo chuẩn Next 16).
3. **Lỗ hổng Bảo mật `tinypool <= 2.1.1` (Critical) & `@vitest/mocker <= 4.1.11` (Moderate) trong `vitest@3.2.7`**:
   - **Giải pháp (Antigravity + Codex)**: Antigravity nâng `vitest` lên `^5.1.0` và `@types/node` lên `^24.0.0` (khớp Node `v24.21.0`). Codex kiểm tra `vitest.config.ts` và toàn bộ 10 file test trong `tests/**` để đảm bảo 36/36 tests pass trên Vitest 5.
4. **Kiểm tra Tương thích Hooks & Server dưới Next.js 16 + Node 24**:
   - **Claude**: Kiểm tra `src/hooks/useCountdown.ts`, `src/hooks/useExamAttempt.ts` và `src/lib/citation/index.ts` đảm bảo không dùng API bị deprecated trong React 19 / Next 16 (ví dụ kiểu `useRef`, cleanup timer, SSR hydration guard).
   - **Codex**: Kiểm tra `src/server/**` và `src/app/api/**` dưới `@types/node@24` và Next 16 Route Handlers.

### B. Phân vùng File Độc quyền (Chống Xung Đột 100%)
- **Vùng Độc quyền của Antigravity (`Gemini Pro Argon 4`)**:
  - `package.json`, `package-lock.json`, `tsconfig.json`, `next.config.ts`, `src/types/**`, `src/components/ui/**`, `src/app/**` (trừ `src/app/api/**`).
- **Vùng của Claude (`Claude Pro`)**:
  - `src/hooks/useCountdown.ts`, `src/hooks/useExamAttempt.ts`, `src/lib/citation/index.ts`.
  - *(Lưu ý: Không sửa `package.json`, không tự chạy vòng lặp build/test tốn token).*
- **Vùng của Codex (`GPT Pro`)**:
  - `vitest.config.ts`, `src/server/**`, `src/app/api/**`, `src/lib/exam-parser/index.ts`, `tests/**`.

---

## 3. Tiến độ Chi tiết (Checklist)

### Bước 1 — Antigravity (`Gemini Pro Argon 4` — Lockfile & Next 16 Upgrade)
- [x] **U1.1**: Cập nhật `package.json` (`next@^16.4.5`, `vitest@^5.1.0`, `@types/node@^24.0.0`), chạy `npm.cmd install` (tự động loại bỏ `esbuild@0.28.2` postinstall thông qua `vitest@5` / `vite@8`, đạt **0 vulnerabilities** và không còn cảnh báo `install-scripts`) và cập nhật `tsconfig.json` (`jsx: "react-jsx"`).
- [x] **U1.2**: Commit `package.json` + `package-lock.json` + `tsconfig.json` để khoá nền tảng thư viện trước khi giao Claude/Codex.

### Bước 2 — Claude Code (`Claude Pro` — Rà soát Kiến trúc Hooks & Citation)
- [x] **U2.1**: Đọc `src/hooks/useCountdown.ts`, `src/hooks/useExamAttempt.ts`, `src/lib/citation/index.ts`, rà soát và tinh chỉnh nếu có điểm cần tối ưu dưới `jsx: "react-jsx"` / React 19 / Next 16 strict types.
  - Kết quả (Claude): `tsc --noEmit` 0 lỗi (chạy 1 lần). Sửa 1 điểm: hai hook ghi `ref.current` trong lúc render → thay bằng `useLatestRef` (export từ `useCountdown.ts`, cập nhật trong `useLayoutEffect`), đúng khuyến nghị React 19 / React Compiler. API công khai không đổi.
  - Đã kiểm tra, không cần sửa: mọi `useRef` đều có đối số (bắt buộc ở `@types/react@19`); timer dùng `ReturnType<typeof setTimeout>` nên hợp cả DOM lẫn `@types/node@24`; `document`/`window` chỉ dùng trong effect (an toàn SSR); hooks không chứa JSX nên `jsx: "react-jsx"` không ảnh hưởng; `src/lib/citation` thuần TS, không dùng React/DOM, chạy được cả server lẫn client.
  - Ghi chú: `useExamAttempt` gọi `setState` trong effect khi `initialAttempt.id` đổi (nạp attempt khác). Chạy đúng; nếu sau này bật lint `react-hooks` v6 mà rule này báo, cách gọn nhất là để trang cha truyền `key={attempt.id}`.

### Bước 3 — OpenAI Codex (`GPT Pro` — Vitest 5 Native Config, Audit & Regression Loop)
- [x] **U3.1**: Đổi/cập nhật cấu hình Vitest (`vitest.config.ts` $\rightarrow$ `vitest.config.mts` dùng `url.fileURLToPath`) để xử lý triệt để cảnh báo `configLoader: 'native'` của Vite/Vitest major version kế tiếp, và kiểm tra tương thích `@types/node@24` trong `src/server/**`, `src/app/api/**`, `tests/**`.
- [x] **U3.2**: Chạy đủ 4 lệnh: `npm.cmd audit` (0 vulnerabilities), `npm.cmd run typecheck` (0 errors), `npm.cmd test` (100% pass, 0 cảnh báo configLoader), `npm.cmd run build` (Next 16 Turbopack build pass) và cập nhật `HANDOFF.md`.

### Bước 4 — Antigravity (`Gemini Pro Argon 4` — Release Manager)
- [x] **U4.1**: Gộp code từ Claude & Codex trên `main`, kiểm tra lần cuối, commit và `git push` lên GitHub.

---

## 4. Trạng thái Đang làm dở (Current State / In-Progress)
- **File vừa hoàn thành (Bước 1 — Antigravity)**:
  - `package.json`, `package-lock.json` (`next@16.4.5`, `vitest@5.1.0`, `@types/node@24.12.0` — `npm.cmd audit` báo `found 0 vulnerabilities`, hết hoàn toàn cảnh báo `install-scripts`).
  - `tsconfig.json` (Next 16 tự động chuyển sang `jsx: "react-jsx"` và thêm `.next/dev/types/**/*.ts`).
- **File đang sửa dở (Codex U3)**: `Không còn; U3.1 và U3.2 đã kiểm tra xong.`
- **Ghi chú bàn giao cho Claude (Bước 2) và Codex (Bước 3)**:
  - `Claude: Mở src/hooks/useCountdown.ts, src/hooks/useExamAttempt.ts, src/lib/citation/index.ts kiểm tra nhanh dưới tsconfig mới.`
  - `Codex: Khi chạy vitest@5.1.0 đang có cảnh báo: "Your Vite config uses features that are unsupported by configLoader: 'native'... Use a .mjs/.mts extension (vitest.config.ts)". Hãy chuyển vitest.config.ts sang vitest.config.mts (dùng fileURLToPath(new URL('./src', import.meta.url))) để triệt tiêu cảnh báo này, chạy lại 4 lệnh kiểm tra và cập nhật HANDOFF.md.`

### Kết quả Codex U3.1 & U3.2 — 2026-11-07
- [x] Đã chuyển sang vitest.config.mts chuẩn ESM: import fileURLToPath từ node:url và alias @ dùng fileURLToPath(new URL('./src', import.meta.url)); đã xoá vitest.config.ts, không dùng __dirname hoặc ép configLoader để che cảnh báo.
- [x] Rà soát src/server/**, src/app/api/** và tests/** với @types/node@24: Buffer/crypto/fetch/AbortSignal, Uint8Array cho Response, timer/mocks và params dạng Promise của Route Handlers tương thích; không cần sửa mã backend hoặc test.
- [x] npm.cmd audit: found 0 vulnerabilities (exit 0).
- [x] npm.cmd run typecheck: 0 errors (exit 0).
- [x] npm.cmd test: Vitest 5.1.0, 10/10 files và 36/36 tests PASS; 0 warnings, không còn cảnh báo configLoader native (exit 0).
- [x] npm.cmd run build: Next.js 16.4.5 (Turbopack), compile/typecheck/generate routes thành công; 0 warnings (exit 0).
- Cả 4 lệnh không phát ra cảnh báo. Không sửa package.json, package-lock.json, tsconfig.json, src/types/** hoặc các file hooks đang được Claude sửa; không merge/push. Sẵn sàng bàn giao Antigravity thực hiện U4.1.
