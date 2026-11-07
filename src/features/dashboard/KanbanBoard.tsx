"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import type { BoardCard, DashboardBoardState, Exam, LibraryDoc } from "@/types";
import { Badge, Button, Card, Input, Modal, Select, useToast } from "@/components/ui";
import { addBoardColumn, DEFAULT_BOARD_STATE, moveCard } from "./board-utils";

const BOARD_STORAGE_KEY = "y4-kanban-board-v1";

export function KanbanBoard() {
  const { pushToast } = useToast();
  const [board, setBoard] = useState<DashboardBoardState>(DEFAULT_BOARD_STATE);
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [colModalOpen, setColModalOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteDesc, setNoteDesc] = useState("");
  const [noteColId, setNoteColId] = useState("col-active");
  const [newColTitle, setNewColTitle] = useState("");
  const [examCount, setExamCount] = useState<number | null>(null);
  const [docCount, setDocCount] = useState<number | null>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(BOARD_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as DashboardBoardState;
        if (Array.isArray(parsed.columns) && Array.isArray(parsed.cards)) {
          setBoard(parsed);
        }
      }
    } catch {
      // Fallback to default board state
    }

    // Lấy thống kê nhanh từ API đề thi và thư viện
    void (async () => {
      try {
        const [examRes, docRes] = await Promise.all([
          fetch("/api/exam").then((r) => r.json()),
          fetch("/api/library/docs").then((r) => r.json()),
        ]);
        if (examRes?.success && Array.isArray(examRes.data)) {
          setExamCount((examRes.data as Exam[]).length);
        }
        if (docRes?.success && Array.isArray(docRes.data)) {
          setDocCount((docRes.data as LibraryDoc[]).length);
        }
      } catch {
        // Ignore network errors on initial load
      }
    })();
  }, []);

  const persistBoard = (next: DashboardBoardState) => {
    const updated = { ...next, updatedAt: new Date().toISOString() };
    setBoard(updated);
    try {
      window.localStorage.setItem(BOARD_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage quota errors
    }
  };

  const handleMoveCard = (cardId: string, targetColumnId: string, targetIndex?: number) => {
    const nextCards = moveCard(board.cards, cardId, targetColumnId, targetIndex);
    persistBoard({ ...board, cards: nextCards });
  };

  const handleCreateNote = () => {
    if (!noteTitle.trim()) return;
    const colCards = board.cards.filter((c) => c.columnId === noteColId);
    const nextCard: BoardCard = {
      id: `note-${Date.now().toString(36)}`,
      columnId: noteColId,
      order: colCards.length,
      title: noteTitle.trim(),
      description: noteDesc.trim() || undefined,
      kind: "note",
      accent: "amber",
    };
    persistBoard({ ...board, cards: [...board.cards, nextCard] });
    setNoteTitle("");
    setNoteDesc("");
    setNoteModalOpen(false);
    pushToast("Đã thêm thẻ ghi chú mới", "success");
  };

  const handleCreateColumn = () => {
    if (!newColTitle.trim()) return;
    const nextCols = addBoardColumn(board.columns, newColTitle);
    persistBoard({ ...board, columns: nextCols });
    setNewColTitle("");
    setColModalOpen(false);
    pushToast("Đã thêm cột mới", "success");
  };

  const handleDeleteCard = (id: string) => {
    persistBoard({ ...board, cards: board.cards.filter((c) => c.id !== id) });
    pushToast("Đã xoá thẻ ghi chú");
  };

  const sortedColumns = [...board.columns].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Bảng điều phối học tập Y4 (Kanban)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Kéo thả thẻ giữa các cột hoặc dùng menu chuyển cột trên cảm ứng • Vuốt ngang trên điện thoại
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setNoteColId(sortedColumns[0]?.id ?? "col-active");
              setNoteModalOpen(true);
            }}
          >
            + Thêm ghi chú
          </Button>
          <Button variant="outline" size="sm" onClick={() => setColModalOpen(true)}>
            + Thêm cột
          </Button>
          <Link href="/thi">
            <Button variant="primary" size="sm">
              Vào Thi thử →
            </Button>
          </Link>
          <Link href="/tai-lieu">
            <Button variant="secondary" size="sm">
              Vào Thư viện →
            </Button>
          </Link>
        </div>
      </div>

      {/* Bảng Kanban: cuộn ngang scroll-snap trên mobile <768px, lưới 3 cột trên iPad/PC */}
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 md:grid md:grid-cols-3 md:overflow-visible">
        {sortedColumns.map((col) => {
          const colCards = board.cards
            .filter((c) => c.columnId === col.id)
            .sort((a, b) => a.order - b.order);

          return (
            <section
              key={col.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (draggingCardId) {
                  handleMoveCard(draggingCardId, col.id);
                  setDraggingCardId(null);
                }
              }}
              className="flex min-w-[85vw] snap-center flex-col rounded-2xl border border-slate-200/90 bg-slate-100/70 p-3.5 sm:min-w-[320px] md:min-w-0 dark:border-slate-800 dark:bg-slate-900/50"
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {col.title}
                  </h3>
                  <Badge tone="neutral">{colCards.length}</Badge>
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-3">
                {colCards.map((card, idx) => {
                  const isExamApp = card.href === "/thi";
                  const isLibApp = card.href === "/tai-lieu";

                  return (
                    <Card
                      key={card.id}
                      draggable
                      onDragStart={() => setDraggingCardId(card.id)}
                      onDragEnd={() => setDraggingCardId(null)}
                      className="flex flex-col justify-between gap-3 transition-shadow hover:shadow-md"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <Badge tone={card.kind === "app" ? "blue" : "amber"}>
                            {card.kind === "app" ? `${card.icon ?? "🚀"} Web con` : "📝 Ghi chú"}
                          </Badge>
                          {card.kind === "note" ? (
                            <button
                              type="button"
                              onClick={() => handleDeleteCard(card.id)}
                              aria-label="Xoá ghi chú"
                              className="text-xs text-slate-400 hover:text-rose-600"
                            >
                              Xoá
                            </button>
                          ) : null}
                        </div>

                        <h4 className="text-base font-bold text-slate-900 dark:text-white">
                          {card.title}
                        </h4>
                        {card.description ? (
                          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                            {card.description}
                          </p>
                        ) : null}

                        {card.kind === "app" ? (
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/70">
                              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                Dữ liệu hiện có
                              </div>
                              <div className="text-xs font-semibold text-slate-900 dark:text-white">
                                {isExamApp
                                  ? examCount !== null
                                    ? `${examCount} đề thi`
                                    : "Đang tải..."
                                  : isLibApp
                                    ? docCount !== null
                                      ? `${docCount} tài liệu`
                                      : "Đang tải..."
                                    : "Sẵn sàng"}
                              </div>
                            </div>
                            <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/70">
                              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                Trạng thái
                              </div>
                              <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                                Độc lập • Hoạt động
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                        <div className="flex items-center gap-1">
                          <select
                            aria-label={`Chuyển cột cho thẻ ${card.title}`}
                            value={card.columnId}
                            onChange={(e) => handleMoveCard(card.id, e.target.value)}
                            className="min-h-9 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                          >
                            {sortedColumns.map((c) => (
                              <option key={c.id} value={c.id}>
                                Cột: {c.title}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveCard(card.id, col.id, idx - 1)}
                            aria-label="Chuyển lên"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-xs disabled:opacity-30 dark:border-slate-700"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            disabled={idx === colCards.length - 1}
                            onClick={() => handleMoveCard(card.id, col.id, idx + 1)}
                            aria-label="Chuyển xuống"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-xs disabled:opacity-30 dark:border-slate-700"
                          >
                            ↓
                          </button>
                        </div>

                        {card.href ? (
                          <Link href={card.href}>
                            <Button variant="primary" size="sm">
                              Mở ứng dụng →
                            </Button>
                          </Link>
                        ) : null}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <Modal
        open={noteModalOpen}
        onClose={() => setNoteModalOpen(false)}
        title="Thêm thẻ ghi chú học tập"
        footer={
          <>
            <Button variant="outline" onClick={() => setNoteModalOpen(false)}>
              Huỷ
            </Button>
            <Button onClick={handleCreateNote}>Lưu ghi chú</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Tiêu đề ghi chú"
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            placeholder="Ví dụ: Ôn tiêu chuẩn chẩn đoán Viêm tuỵ cấp..."
          />
          <Input
            label="Nội dung chi tiết"
            value={noteDesc}
            onChange={(e) => setNoteDesc(e.target.value)}
            placeholder="Ghi chú nhanh mục tiêu ôn tập..."
          />
          <Select
            label="Đặt vào cột"
            value={noteColId}
            onChange={(e) => setNoteColId(e.target.value)}
            options={sortedColumns.map((c) => ({ value: c.id, label: c.title }))}
          />
        </div>
      </Modal>

      <Modal
        open={colModalOpen}
        onClose={() => setColModalOpen(false)}
        title="Thêm cột Kanban mới"
        footer={
          <>
            <Button variant="outline" onClick={() => setColModalOpen(false)}>
              Huỷ
            </Button>
            <Button onClick={handleCreateColumn}>Tạo cột</Button>
          </>
        }
      >
        <Input
          label="Tên cột"
          value={newColTitle}
          onChange={(e) => setNewColTitle(e.target.value)}
          placeholder="Ví dụ: Sắp thi lâm sàng"
        />
      </Modal>
    </div>
  );
}
