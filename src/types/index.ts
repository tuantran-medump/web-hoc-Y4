/**
 * Hợp đồng Dữ liệu Chung (Shared Data Contracts) — web-hoc-Y4
 *
 * Quy tắc Đa Agent (AGENTS.md & docs/KE_HOACH_ANTIGRAVITY.md):
 * - Chốt tại Wave 0 trước khi tách nhánh cho Antigravity, Claude và Codex.
 * - Mọi Agent import kiểu dữ liệu qua `@/types`.
 * - Không dùng `any`, tuân thủ TypeScript `strict: true`.
 */

export * from "./dashboard";
export * from "./exam";
export * from "./library";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
