/**
 * Hợp đồng dữ liệu cho Web con 2: Thư viện ("/tai-lieu")
 * Chốt tại Wave 0 — Không tự ý sửa ở các nhánh con.
 */

export interface SourceRef {
  /** Khoá chú thích trong Markdown, ví dụ: "esc2021" hoặc "harrison21" */
  key: string;
  /** Số hiển thị [1], [2]... đánh theo thứ tự xuất hiện lần đầu trong tài liệu */
  label: number;
  title: string;
  /** Link Google Drive bên ngoài */
  url: string;
  /** Chỉ số màu được gán bởi thuật toán tô màu đồ thị (assignSourceColors) */
  colorIndex: number;
}

export type DocBlockKind =
  | "heading"
  | "paragraph"
  | "list"
  | "table"
  | "figure"
  | "quote";

export interface DocSegment {
  /** Đoạn HTML đã sanitize (đã ẩn mọi thẻ <a> trong thân bài) */
  html: string;
  /** Khoá nguồn dẫn cho đoạn này, hoặc null nếu không có marker theo sau */
  sourceKey: string | null;
}

export interface DocBlock {
  id: string;
  kind: DocBlockKind;
  /**
   * paragraph/list: nhiều đoạn chia theo marker chú thích;
   * table/figure: một đoạn, nguồn lấy từ caption;
   * heading: không tô màu (sourceKey = null).
   */
  segments: DocSegment[];
  /** Cấp độ tiêu đề (1-6) nếu kind === 'heading', hoặc mức thụt lề nếu kind === 'list' */
  level?: number;
  /** Chỉ có ở block list: true nếu là danh sách có đánh số */
  listOrdered?: boolean;
  /** Chỉ có ở block list có số: số thứ tự gốc trong Markdown */
  listNumber?: number;
  /** Nội dung bảng hoặc hình phục vụ render chuyên biệt */
  figureSrc?: string;
  figureAlt?: string;
  captionHtml?: string;
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

export interface DocTocItem {
  id: string;
  text: string;
  level: number;
}

export interface RenderedDoc {
  doc: LibraryDoc;
  blocks: DocBlock[];
  sources: SourceRef[];
  toc: DocTocItem[];
  warnings?: string[];
}

export interface SyncErrorItem {
  driveFileId: string;
  name: string;
  message: string;
}

export interface SyncReport {
  startedAt: string;
  finishedAt: string;
  added: string[];
  updated: string[];
  removed: string[];
  unchanged: number;
  errors: SyncErrorItem[];
}
