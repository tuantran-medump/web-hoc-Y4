import type { BoardCard, BoardColumn, DashboardBoardState } from "@/types";

export const DEFAULT_BOARD_STATE: DashboardBoardState = {
  columns: [
    { id: "col-active", title: "Đang dùng", order: 0 },
    { id: "col-review", title: "Ôn tập", order: 1 },
    { id: "col-archive", title: "Lưu trữ", order: 2 },
  ],
  cards: [
    {
      id: "app-thi",
      columnId: "col-active",
      order: 0,
      title: "Web con 1: Thi thử Lâm sàng & OSCE",
      description:
        "Ngân hàng đề Y4, nạp đề PDF tự động, luyện trắc nghiệm, tự luận tự chấm theo barem và chạy trạm OSCE có đồng hồ.",
      kind: "app",
      href: "/thi",
      icon: "🩺",
      accent: "blue",
      stats: [
        { label: "Đề thi mẫu", value: "2 đề sẵn sàng" },
        { label: "Chế độ", value: "Thường & Trạm OSCE" },
      ],
    },
    {
      id: "app-tai-lieu",
      columnId: "col-active",
      order: 1,
      title: "Web con 2: Thư viện Y khoa",
      description:
        "Đọc tài liệu Markdown đồng bộ thủ công từ Google Drive, tô màu đoạn văn theo nguồn dẫn và xuất PDF A4.",
      kind: "app",
      href: "/tai-lieu",
      icon: "📚",
      accent: "emerald",
      stats: [
        { label: "Tài liệu", value: "Suy tim mạn (Mẫu)" },
        { label: "Chú thích", value: "Tô màu đồ thị nguồn" },
      ],
    },
    {
      id: "note-1",
      columnId: "col-review",
      order: 0,
      title: "Ôn kỹ phác đồ Suy tim cấp & HFrEF (ESC 2021)",
      description: "Chú ý 4 trụ cột điều trị HFrEF (ARNI/ACEi, Beta-blocker, MRA, SGLT2i) và tiêu chuẩn đọc ECG nhồi máu thành dưới.",
      kind: "note",
      accent: "amber",
    },
  ],
  updatedAt: new Date(0).toISOString(),
};

/**
 * Di chuyển một thẻ sang cột đích tại vị trí targetIndex và chuẩn hoá lại thứ tự `order` (0, 1, 2...)
 */
export function moveCard(
  cards: BoardCard[],
  cardId: string,
  targetColumnId: string,
  targetIndex?: number,
): BoardCard[] {
  const moving = cards.find((c) => c.id === cardId);
  if (!moving) return cards;

  const sourceColumnId = moving.columnId;
  const result: BoardCard[] = [];

  const columnIds = Array.from(new Set([...cards.map((c) => c.columnId), targetColumnId]));

  for (const colId of columnIds) {
    if (colId !== sourceColumnId && colId !== targetColumnId) {
      const untouched = cards
        .filter((c) => c.columnId === colId)
        .sort((a, b) => a.order - b.order)
        .map((c, idx) => ({ ...c, order: idx }));
      result.push(...untouched);
      continue;
    }

    if (sourceColumnId === targetColumnId && colId === targetColumnId) {
      const list = cards
        .filter((c) => c.columnId === colId && c.id !== cardId)
        .sort((a, b) => a.order - b.order);
      const insertAt =
        targetIndex === undefined ? list.length : Math.max(0, Math.min(targetIndex, list.length));
      list.splice(insertAt, 0, { ...moving, columnId: targetColumnId });
      result.push(...list.map((c, idx) => ({ ...c, order: idx })));
      continue;
    }

    if (colId === sourceColumnId) {
      const remaining = cards
        .filter((c) => c.columnId === colId && c.id !== cardId)
        .sort((a, b) => a.order - b.order)
        .map((c, idx) => ({ ...c, order: idx }));
      result.push(...remaining);
    } else if (colId === targetColumnId) {
      const destList = cards
        .filter((c) => c.columnId === colId && c.id !== cardId)
        .sort((a, b) => a.order - b.order);
      const insertAt =
        targetIndex === undefined
          ? destList.length
          : Math.max(0, Math.min(targetIndex, destList.length));
      destList.splice(insertAt, 0, { ...moving, columnId: targetColumnId });
      result.push(...destList.map((c, idx) => ({ ...c, order: idx })));
    }
  }

  return result;
}

export function addBoardColumn(columns: BoardColumn[], title: string): BoardColumn[] {
  const cleaned = title.trim();
  if (!cleaned) return columns;
  const nextOrder = columns.length;
  return [
    ...columns,
    {
      id: `col-${Date.now().toString(36)}`,
      title: cleaned,
      order: nextOrder,
    },
  ];
}
