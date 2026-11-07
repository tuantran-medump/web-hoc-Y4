/**
 * Hợp đồng dữ liệu cho Dashboard Kanban ("/")
 * Chốt tại Wave 0 — Không tự ý sửa ở các nhánh con.
 */

export interface BoardColumn {
  id: string;
  title: string;
  order: number;
}

export interface BoardCardStat {
  label: string;
  value: string;
}

export interface BoardCard {
  id: string;
  columnId: string;
  order: number;
  title: string;
  description?: string;
  /** 'app' = dẫn vào web con; 'note' = thẻ ghi chú tự do */
  kind: "app" | "note";
  /** Đường dẫn điều hướng nếu kind === 'app' ('/thi' | '/tai-lieu' | ...) */
  href?: string;
  icon?: string;
  /** Token màu hiển thị trên thẻ */
  accent?: string;
  /** Số liệu nhanh, ví dụ: "32 đề", "Đồng bộ 2 ngày trước" */
  stats?: BoardCardStat[];
}

export interface DashboardBoardState {
  columns: BoardColumn[];
  cards: BoardCard[];
  updatedAt: string;
}
