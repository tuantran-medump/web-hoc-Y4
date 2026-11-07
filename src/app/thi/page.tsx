"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Exam, ExamBackupPayload } from "@/types";
import {
  AppShell,
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Select,
  Skeleton,
  Tabs,
  useToast,
} from "@/components/ui";

export default function ExamBankPage() {
  const { pushToast } = useToast();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"active" | "trash">("active");
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadExams = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (tab === "trash") params.set("deleted", "true");
      const res = await fetch(`/api/exam?${params.toString()}`).then((r) => r.json());
      if (res?.success && Array.isArray(res.data)) {
        setExams(res.data as Exam[]);
      }
    } catch {
      pushToast("Không tải được danh sách đề thi", "error");
    } finally {
      setLoading(false);
    }
  }, [tab, pushToast]);

  useEffect(() => {
    void loadExams();
  }, [loadExams]);

  const subjects = useMemo(
    () => Array.from(new Set(exams.map((e) => e.subject).filter(Boolean))),
    [exams],
  );
  const allTags = useMemo(
    () => Array.from(new Set(exams.flatMap((e) => e.tags))),
    [exams],
  );

  const filteredExams = useMemo(() => {
    const q = search.trim().toLowerCase();
    return exams.filter((e) => {
      if (subjectFilter && e.subject !== subjectFilter) return false;
      if (tagFilter && !e.tags.includes(tagFilter)) return false;
      if (q && !`${e.title} ${e.subject} ${e.tags.join(" ")}`.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [exams, search, subjectFilter, tagFilter]);

  const handleSoftDelete = async (id: string) => {
    const res = await fetch(`/api/exam/${id}`, { method: "DELETE" }).then((r) => r.json());
    if (res?.success) {
      pushToast("Đã chuyển đề vào thùng rác (lưu 30 ngày)", "info");
      void loadExams();
    } else {
      pushToast(res?.error ?? "Không xoá được đề", "error");
    }
  };

  const handleRestore = async (id: string) => {
    const res = await fetch(`/api/exam/${id}/restore`, { method: "POST" }).then((r) => r.json());
    if (res?.success) {
      pushToast("Đã khôi phục đề thi", "success");
      void loadExams();
    } else {
      pushToast(res?.error ?? "Không khôi phục được đề", "error");
    }
  };

  const handleExportBackup = async () => {
    try {
      const res = await fetch("/api/exam/backup").then((r) => r.json());
      if (!res?.success) throw new Error(res?.error ?? "Lỗi sao lưu");
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `y4-exam-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      pushToast("Đã xuất file sao lưu JSON", "success");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Không thể xuất sao lưu", "error");
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const payload = JSON.parse(text) as ExamBackupPayload;
      const res = await fetch("/api/exam/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).then((r) => r.json());
      if (!res?.success) throw new Error(res?.error ?? "Lỗi khôi phục");
      pushToast("Đã khôi phục dữ liệu từ file JSON!", "success");
      void loadExams();
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "File JSON không hợp lệ", "error");
    } finally {
      e.target.value = "";
    }
  };

  return (
    <AppShell
      title="Web con 1: Ngân hàng Đề thi & Luyện Lâm sàng"
      subtitle="Làm bài trắc nghiệm, tự luận tự chấm theo barem và chạy trạm OSCE có đồng hồ"
      backHref="/"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/thi/lich-su">
            <Button variant="outline" size="sm">
              📊 Lịch sử thi
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={handleExportBackup}>
            ⬇ Sao lưu JSON
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            ⬆ Khôi phục JSON
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={handleImportBackup}
            className="hidden"
          />
          <Link href="/thi/nap-de">
            <Button variant="primary" size="sm">
              + Nạp đề mới
            </Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs
            items={[
              { id: "active", label: "Ngân hàng đề đang dùng" },
              { id: "trash", label: "Thùng rác (30 ngày)" },
            ]}
            activeId={tab}
            onChange={(id) => setTab(id as "active" | "trash")}
          />
        </div>

        <Card className="grid gap-3 sm:grid-cols-3">
          <Input
            placeholder="Tìm theo tên đề, môn hoặc tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            options={[
              { value: "", label: "Tất cả môn học" },
              ...subjects.map((s) => ({ value: s, label: s })),
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
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : filteredExams.length === 0 ? (
          <EmptyState
            title={
              tab === "trash"
                ? "Thùng rác đang trống"
                : "Không tìm thấy đề thi nào phù hợp"
            }
            description="Bạn có thể nạp đề mới từ file PDF/văn bản theo mẫu chuẩn Y4."
            action={
              tab === "active" ? (
                <Link href="/thi/nap-de">
                  <Button variant="primary">+ Nạp đề thi ngay</Button>
                </Link>
              ) : null
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredExams.map((exam) => {
              const qCount = Object.keys(exam.questions).length;
              const mins = Math.round(exam.durationSec / 60);

              return (
                <Card key={exam.id} className="flex flex-col justify-between gap-4">
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge tone={exam.mode === "station" ? "purple" : "blue"}>
                          {exam.mode === "station" ? "⏱ Thi Trạm (OSCE)" : "📝 Đề Thường"}
                        </Badge>
                        <Badge tone="emerald">{exam.subject}</Badge>
                        <Badge tone="neutral">{mins} phút</Badge>
                        <Badge tone="neutral">{qCount} câu</Badge>
                      </div>
                      <span className="text-xs text-slate-400">v{exam.version}</span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {exam.title}
                    </h3>

                    {exam.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {exam.tags.map((t) => (
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
                    {tab === "active" ? (
                      <>
                        <div className="flex flex-wrap gap-2">
                          <Link href={`/thi/de/${exam.id}/lam-bai?mode=exam`}>
                            <Button variant="primary" size="sm">
                              ▶ Làm bài thi
                            </Button>
                          </Link>
                          <Link href={`/thi/de/${exam.id}/lam-bai?mode=practice`}>
                            <Button variant="secondary" size="sm">
                              💡 Luyện tập
                            </Button>
                          </Link>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          <Link href={`/thi/de/${exam.id}`}>
                            <Button variant="outline" size="sm">
                              ✏️ Sửa đáp án
                            </Button>
                          </Link>
                          <Link href={`/thi/de/${exam.id}/in?variant=blank`}>
                            <Button variant="outline" size="sm">
                              🖨 Xuất PDF
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => void handleSoftDelete(exam.id)}
                          >
                            🗑
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="flex w-full items-center justify-between">
                        <span className="text-xs text-slate-500">
                          Đã xoá: {exam.deletedAt ? new Date(exam.deletedAt).toLocaleDateString("vi-VN") : ""}
                        </span>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => void handleRestore(exam.id)}
                        >
                          ♻ Khôi phục đề
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
