"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import type { Attempt, Exam } from "@/types";
import { AppShell, Badge, Button, Card, EmptyState, Skeleton } from "@/components/ui";

export default function ExamHistoryPage() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [examsMap, setExamsMap] = useState<Record<string, Exam>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const [attRes, examRes] = await Promise.all([
          fetch("/api/exam/attempts").then((r) => r.json()),
          fetch("/api/exam").then((r) => r.json()),
        ]);
        if (attRes?.success && Array.isArray(attRes.data)) {
          setAttempts(
            (attRes.data as Attempt[]).sort(
              (a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt),
            ),
          );
        }
        if (examRes?.success && Array.isArray(examRes.data)) {
          const map: Record<string, Exam> = {};
          for (const e of examRes.data as Exam[]) map[e.id] = e;
          setExamsMap(map);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <AppShell
      title="Lịch sử Làm bài & Điểm số"
      subtitle="Xem lại toàn bộ các lần thi, điểm trắc nghiệm tự động và điểm tự chấm theo barem"
      backHref="/thi"
      backLabel="Ngân hàng đề"
    >
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : attempts.length === 0 ? (
        <EmptyState
          title="Chưa có lịch sử làm bài nào"
          description="Hãy chọn một đề trong Ngân hàng đề để bắt đầu làm bài hoặc luyện tập."
          action={
            <Link href="/thi">
              <Button variant="primary">Về Ngân hàng đề</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {attempts.map((a) => {
            const exam = examsMap[a.examId];
            return (
              <Card
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={a.mode === "exam" ? "blue" : "purple"}>
                      {a.mode === "exam" ? "Thi thật" : "Luyện tập"}
                    </Badge>
                    <Badge
                      tone={
                        a.status === "graded"
                          ? "emerald"
                          : a.status === "submitted"
                            ? "amber"
                            : "neutral"
                      }
                    >
                      {a.status === "graded"
                        ? "Đã chấm xong"
                        : a.status === "submitted"
                          ? "Chờ tự chấm tự luận"
                          : "Đang làm dở"}
                    </Badge>
                    <span className="text-xs text-slate-500">
                      Bắt đầu: {new Date(a.startedAt).toLocaleString("vi-VN")}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {exam ? exam.title : `Đề thi #${a.examId}`}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Điểm trắc nghiệm: <strong>{a.autoScore ?? 0} đ</strong> • Tổng điểm:{" "}
                    <strong>{a.totalScore ?? a.autoScore ?? 0} đ</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/thi/de/${a.examId}/lam-bai?mode=${a.mode}&attemptId=${a.id}`}
                  >
                    <Button variant="primary" size="sm">
                      {a.status === "in_progress" ? "▶ Làm tiếp" : "👁 Xem lại & Tự chấm"}
                    </Button>
                  </Link>
                  <Link
                    href={`/thi/de/${a.examId}/in?variant=attempt&attemptId=${a.id}`}
                  >
                    <Button variant="outline" size="sm">
                      🖨 Xuất PDF
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
