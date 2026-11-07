/**
 * Hợp đồng Dữ liệu Chung (Shared Data Contracts) — web-hoc-Y4
 *
 * Quy tắc Đa Agent (AGENTS.md):
 * - Luôn chốt các Interfaces / Types tại đây trước khi tách nhánh cho Antigravity, Claude và Codex.
 * - Tuân thủ TypeScript strict mode (hạn chế tối đa `any`).
 */

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
