"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { LibraryDoc, SyncReport } from "@/types";
import {
  AppShell,
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  Select,
  Skeleton,
  useToast,
} from "@/components/ui";

export default function LibraryListPage() {
  const { pushToast } = useToast();
  const [docs, setDocs] = useState<LibraryDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncReport, setSyncReport] = useState<SyncReport | null>(null);
  const [search, setSearch] = useState("");
  const [folderFilter, setFolderFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");

  const loadDocs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/library/docs").then((r) => r.json());
      if (res?.success && Array.isArray(res.data)) {
        setDocs(res.data as LibraryDoc[]);
      }
    } catch {
      pushToast("Không tải được danh sách tài liệu", "error");
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    void loadDocs();
  }, [loadDocs]);

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/library/sync", { method: "POST" }).then((r) => r.json());
      if (!res?.success) {
        pushToast(res?.error ?? "Chưa cấu hình Google Drive Service Account", "info");
        return;
      }
      setSyncReport(res.data as SyncReport);
      pushToast("Đã đồng bộ thư viện từ Google Drive thành công!", "success");
      await loadDocs();
    } catch {
      pushToast("Không thể kết nối API đồng bộ", "error");
    } finally {
      setSyncing(false);
    }
  };

  const folders = useMemo(
    () => Array.from(new Set(docs.map((d) => d.folderPath).filter(Boolean))),
    [docs],
  );
  const allTags = useMemo(
    () => Array.from(new Set(docs.flatMap((d) => d.tags))),
    [docs],
  );

  const filteredDocs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return docs.filter((d) => {
      if (folderFilter && d.folderPath !== folderFilter) return false;
      if (tagFilter && !d.tags.includes(tagFilter)) return false;
      if (q && !`${d.title} ${d.folderPath} ${d.tags.join(" ")}`.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [docs, search, folderFilter, tagFilter]);

  return (
    <AppShell
      title="Web con 2: Thư viện Tài liệu Y khoa"
      subtitle="Đọc tài liệu Markdown đồng bộ thủ công từ Google Drive, tô màu theo nguồn dẫn và xuất PDF A4"
      backHref="/"
      actions={
        <Button
          variant="primary"
          size="sm"
          onClick={() => void handleManualSync()}
          disabled={syncing}
        >
          {syncing ? "⏳ Đang đồng bộ Drive..." : "🔄 Cập nhật từ Drive"}
        </Button>
      }
    >
      <div className="space-y-5">
        <Card className="grid gap-3 sm:grid-cols-3">
          <Input
            placeholder="Tìm theo tên tài liệu, thư mục hoặc tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            value={folderFilter}
            onChange={(e) => setFolderFilter(e.target.value)}
            options={[
              { value: "", label: "Tất cả thư mục" },
              ...folders.map((f) => ({ value: f, label: `📁 ${f}` })),
            ]}
          />
          <Select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            options={[
              { value: "", label: "Tất cả tag" },
              ...allTags.map((t) => ({ value: t, label: `#${t}` })),
            ]}
          />
        </Card>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-44 w-full" />
            <Skeleton className="h-44 w-full" />
          </div>
        ) : filteredDocs.length === 0 ? (
          <EmptyState
            title="Không tìm thấy tài liệu nào"
            description="Bấm 'Cập nhật từ Drive' để đồng bộ tài liệu Markdown mới nhất từ Google Drive."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredDocs.map((doc) => (
              <Card key={doc.id} className="flex flex-col justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge tone="emerald">📁 {doc.folderPath || "Thư mục gốc"}</Badge>
                    <span className="text-xs text-slate-400">
                      Đồng bộ: {new Date(doc.syncedAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {doc.title}
                  </h3>

                  {doc.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {doc.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <Link href={`/tai-lieu/${doc.id}`}>
                    <Button variant="primary" size="sm">
                      📖 Mở trình đọc A4
                    </Button>
                  </Link>
                  <Link href={`/tai-lieu/${doc.id}/in`}>
                    <Button variant="outline" size="sm">
                      🖨 Xuất PDF
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={Boolean(syncReport)}
        onClose={() => setSyncReport(null)}
        title="Báo cáo đồng bộ Google Drive (SyncReport)"
        footer={<Button onClick={() => setSyncReport(null)}>Đóng</Button>}
      >
        {syncReport ? (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-950/50">
                <div className="text-xs text-slate-500">Thêm mới</div>
                <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                  {syncReport.added.length}
                </div>
              </div>
              <div className="rounded-xl bg-blue-50 p-3 dark:bg-blue-950/50">
                <div className="text-xs text-slate-500">Cập nhật</div>
                <div className="text-lg font-bold text-blue-700 dark:text-blue-300">
                  {syncReport.updated.length}
                </div>
              </div>
              <div className="rounded-xl bg-slate-100 p-3 dark:bg-slate-800">
                <div className="text-xs text-slate-500">Không thay đổi</div>
                <div className="text-lg font-bold">{syncReport.unchanged}</div>
              </div>
              <div className="rounded-xl bg-rose-50 p-3 dark:bg-rose-950/50">
                <div className="text-xs text-slate-500">Đã gỡ / Xoá mềm</div>
                <div className="text-lg font-bold text-rose-700 dark:text-rose-300">
                  {syncReport.removed.length}
                </div>
              </div>
            </div>
            {syncReport.errors.length > 0 ? (
              <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
                <div className="font-bold">Lỗi ({syncReport.errors.length}):</div>
                <ul className="mt-1 list-disc pl-4">
                  {syncReport.errors.map((e, i) => (
                    <li key={i}>
                      {e.name}: {e.message}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </AppShell>
  );
}
