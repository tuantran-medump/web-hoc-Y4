"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import type { Attempt, Exam } from "@/types";
import { Badge, Button, EmptyState, Skeleton } from "@/components/ui";
import { ContentBlockRenderer } from "@/features/exam/ContentBlockRenderer";
import { isIosDevice, triggerPrintPdf } from "@/lib/print";

type PrintVariant = "blank" | "answers" | "attempt";

function ExamPrintInner() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const examId = params.id;
  const initialVariant = (searchParams.get("variant") as PrintVariant) || "blank";
  const attemptId = searchParams.get("attemptId");

  const [exam, setExam] = useState<Exam | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [variant, setVariant] = useState<PrintVariant>(initialVariant);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const examRes = await fetch(`/api/exam/${examId}`).then((r) => r.json());
        if (examRes?.success) setExam(examRes.data as Exam);

        if (attemptId) {
          const attRes = await fetch(`/api/exam/attempts/${attemptId}`).then((r) =>
            r.json(),
          );
          if (attRes?.success) setAttempt(attRes.data as Attempt);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [examId, attemptId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl p-8">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="mx-auto max-w-4xl p-8">
        <EmptyState title="Không tìm thấy đề thi để xuất PDF" />
      </div>
    );
  }

  const questions = Object.values(exam.questions).sort((a, b) => a.number - b.number);

  return (
    <div className="min-h-dvh bg-slate-100 py-6 print:bg-white print:py-0 dark:bg-slate-950">
      {/* Thanh điều khiển không in (no-print) */}
      <div className="no-print mx-auto mb-6 flex max-w-[210mm] flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/thi/de/${exam.id}`}>
            <Button variant="outline" size="sm">
              ← Quay lại đề thi
            </Button>
          </Link>
          <Button
            variant={variant === "blank" ? "primary" : "outline"}
            size="sm"
            onClick={() => setVariant("blank")}
          >
            Đề trống
          </Button>
          <Button
            variant={variant === "answers" ? "primary" : "outline"}
            size="sm"
            onClick={() => setVariant("answers")}
          >
            Đề + Đáp án & Barem
          </Button>
          {attempt ? (
            <Button
              variant={variant === "attempt" ? "primary" : "outline"}
              size="sm"
              onClick={() => setVariant("attempt")}
            >
              Bài làm đã chấm
            </Button>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {isIosDevice() ? (
            <span className="text-xs text-slate-500">
              iOS: Bấm Xuất PDF → Chia sẻ → Lưu vào Tệp
            </span>
          ) : null}
          <Button variant="primary" size="sm" onClick={triggerPrintPdf}>
            🖨 Xuất PDF / In ngay (A4)
          </Button>
        </div>
      </div>

      {/* Trang giấy A4 */}
      <div className="mx-auto max-w-[210mm] rounded-xl border border-slate-300 bg-white p-8 text-slate-900 shadow-lg print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none">
        {/* Header Đề thi */}
        <header className="mb-6 border-b-2 border-slate-900 pb-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                WEB HỌC Y4 • MÔN: {exam.subject.toUpperCase()}
              </p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900">{exam.title}</h1>
            </div>
            <div className="text-right text-xs text-slate-700">
              <div>
                Thời gian: <strong>{Math.round(exam.durationSec / 60)} phút</strong>
              </div>
              <div>
                Số câu: <strong>{questions.length} câu</strong>
              </div>
              <div>
                Bản in:{" "}
                <strong>
                  {variant === "blank"
                    ? "Đề trống"
                    : variant === "answers"
                      ? "Đáp án & Barem"
                      : "Kết quả bài làm"}
                </strong>
              </div>
            </div>
          </div>
        </header>

        {/* Nội dung các câu hỏi */}
        <div className="space-y-5">
          {questions.map((q) => {
            const userAns = attempt?.answers[q.id];
            const selfGrade = attempt?.selfGrades[q.id];

            return (
              <section
                key={q.id}
                className="print-break-inside-avoid border-b border-slate-200 pb-4 last:border-b-0"
              >
                <div className="mb-1.5 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-900">
                    Câu {q.number} ({q.points} điểm)
                  </h2>
                  <Badge tone="neutral">{q.type}</Badge>
                </div>

                <ContentBlockRenderer blocks={q.stem} />

                {q.choices && q.choices.length > 0 ? (
                  <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
                    {q.choices.map((c) => {
                      const isCorrect = q.correctKeys?.includes(c.key);
                      const isSelected =
                        userAns?.kind === "choice" && userAns.keys.includes(c.key);

                      return (
                        <li
                          key={c.key}
                          className={`rounded-lg border px-3 py-1.5 text-xs ${
                            variant !== "blank" && isCorrect
                              ? "border-emerald-600 bg-emerald-50 font-bold text-emerald-950"
                              : variant === "attempt" && isSelected && !isCorrect
                                ? "border-rose-600 bg-rose-50 font-semibold text-rose-900"
                                : "border-slate-200 text-slate-800"
                          }`}
                        >
                          <span className="mr-1.5 font-bold">{c.key}.</span>
                          {c.content.map((b) => (b.type === "text" ? b.md : "")).join(" ")}
                        </li>
                      );
                    })}
                  </ul>
                ) : q.type === "essay" && variant === "blank" ? (
                  <div className="mt-3 h-24 rounded-lg border border-dashed border-slate-300" />
                ) : null}

                {variant === "attempt" && userAns ? (
                  <div className="mt-2 rounded-lg bg-slate-100 p-2.5 text-xs">
                    <strong>Bài làm của bạn: </strong>
                    {userAns.kind === "choice"
                      ? userAns.keys.join(", ") || "(Chưa chọn)"
                      : userAns.text || "(Bỏ trống)"}
                    {selfGrade ? ` — Điểm tự chấm: ${selfGrade.score}/${q.points} đ` : ""}
                  </div>
                ) : null}

                {variant !== "blank" ? (
                  <div className="mt-2 space-y-1.5 text-xs">
                    {q.correctKeys && q.correctKeys.length > 0 ? (
                      <div className="font-bold text-emerald-800">
                        ✓ Đáp án đúng: {q.correctKeys.join(", ")}
                      </div>
                    ) : null}
                    {q.modelAnswer && q.modelAnswer.length > 0 ? (
                      <div className="rounded-lg border border-blue-200 bg-blue-50/70 p-2.5">
                        <div className="font-bold text-blue-900">Đáp án mẫu:</div>
                        <ContentBlockRenderer blocks={q.modelAnswer} />
                      </div>
                    ) : null}
                    {q.rubric && q.rubric.length > 0 ? (
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                        <div className="font-bold">Barem chấm điểm:</div>
                        {q.rubric.map((r) => (
                          <div key={r.id}>
                            • {r.label} ({r.points} đ)
                          </div>
                        ))}
                      </div>
                    ) : null}
                    {q.note && q.note.length > 0 ? (
                      <div className="italic text-slate-600">
                        Ghi chú: {q.note.map((b) => (b.type === "text" ? b.md : "")).join(" ")}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function ExamPrintPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <ExamPrintInner />
    </Suspense>
  );
}
