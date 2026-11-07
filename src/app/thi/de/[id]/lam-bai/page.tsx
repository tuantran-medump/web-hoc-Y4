"use client";

import React, { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import type { Attempt, Exam } from "@/types";
import {
  AppShell,
  Badge,
  Button,
  Card,
  EmptyState,
  Modal,
  Sheet,
  Skeleton,
  useToast,
} from "@/components/ui";
import { ContentBlockRenderer } from "@/features/exam/ContentBlockRenderer";
import { computeTotalScore, useExamAttempt } from "@/hooks/useExamAttempt";

function ExamRunnerInner({ exam, initialAttempt }: { exam: Exam; initialAttempt: Attempt }) {
  const { pushToast } = useToast();
  const [navSheetOpen, setNavSheetOpen] = useState(false);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const [prepCountdown, setPrepCountdown] = useState<number | null>(null);
  const warned5MinRef = useRef(false);
  const warned1MinRef = useRef(false);

  const saveAttemptToServer = useCallback(async (snapshot: Attempt) => {
    if (snapshot.status === "in_progress") {
      await fetch(`/api/exam/attempts/${snapshot.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: snapshot.answers,
          flagged: snapshot.flagged,
        }),
      });
    } else if (Object.keys(snapshot.selfGrades).length > 0) {
      await fetch(`/api/exam/attempts/${snapshot.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selfGrades: snapshot.selfGrades,
        }),
      });
    }
  }, []);

  const {
    attempt,
    countdown,
    saveStatus,
    orderedQuestionIds,
    answeredCount,
    unansweredIds,
    currentStation,
    isLastStation,
    canRevealAnswers,
    essayQuestionIds,
    isGradingComplete,
    isFlagged,
    isLocked,
    selectChoice,
    setEssayText,
    toggleFlag,
    pause,
    resume,
    beginStation,
    nextStation,
    submit,
    setAutoScore,
    toggleRubricItem,
    setSelfGrade,
    finishGrading,
  } = useExamAttempt({
    exam,
    initialAttempt,
    save: saveAttemptToServer,
    onSubmit: async (submitted) => {
      try {
        const res = await fetch(`/api/exam/attempts/${submitted.id}/submit`, {
          method: "POST",
        }).then((r) => r.json());
        if (res?.success && typeof res.data?.autoScore === "number") {
          setAutoScore(res.data.autoScore);
        }
        pushToast("Đã nộp bài và chấm điểm tự động phần trắc nghiệm!", "success");
      } catch {
        pushToast("Đã lưu trạng thái nộp bài cục bộ", "info");
      }
    },
    onStationChange: () => {
      setPrepCountdown(10);
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate?.([150, 80, 150]);
      }
      pushToast("Chuyển sang trạm OSCE tiếp theo!", "info");
    },
  });

  // Đếm ngược 10 giây chuẩn bị khi chuyển trạm OSCE
  useEffect(() => {
    if (prepCountdown === null) return;
    if (prepCountdown <= 0) {
      setPrepCountdown(null);
      beginStation();
      return;
    }
    const timer = setTimeout(() => setPrepCountdown((c) => (c !== null ? c - 1 : null)), 1000);
    return () => clearTimeout(timer);
  }, [prepCountdown, beginStation]);

  // Nếu đề trạm mới vào mà chưa có stationEndsAt, tự động bắt đầu trạm 1
  useEffect(() => {
    if (
      exam.mode === "station" &&
      attempt.status === "in_progress" &&
      !attempt.stationEndsAt &&
      prepCountdown === null
    ) {
      beginStation();
    }
  }, [exam.mode, attempt.status, attempt.stationEndsAt, prepCountdown, beginStation]);

  // Cảnh báo còn 5 phút & 1 phút
  useEffect(() => {
    if (countdown.isWarning5Min && !warned5MinRef.current && attempt.status === "in_progress") {
      warned5MinRef.current = true;
      pushToast("⏰ Còn 5 phút làm bài!", "info");
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate?.(200);
      }
    }
    if (countdown.isWarning1Min && !warned1MinRef.current && attempt.status === "in_progress") {
      warned1MinRef.current = true;
      pushToast("⚠️ Chỉ còn 1 phút! Hệ thống sẽ tự nộp khi hết giờ.", "error");
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate?.([250, 100, 250]);
      }
    }
  }, [countdown.isWarning5Min, countdown.isWarning1Min, attempt.status, pushToast]);

  // Screen Wake Lock giữ màn hình sáng khi đang thi + cảnh báo beforeunload
  useEffect(() => {
    if (attempt.status !== "in_progress") return;
    let wakeLock: { release: () => Promise<void> } | null = null;
    if (typeof navigator !== "undefined" && "wakeLock" in navigator) {
      void (
        navigator as Navigator & {
          wakeLock?: { request: (type: "screen") => Promise<{ release: () => Promise<void> }> };
        }
      ).wakeLock
        ?.request("screen")
        .then((lock) => {
          wakeLock = lock;
        })
        .catch(() => {});
    }
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      void wakeLock?.release();
    };
  }, [attempt.status]);

  const handleTogglePause = async () => {
    if (countdown.isPaused) {
      resume();
      await fetch(`/api/exam/attempts/${attempt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resume" }),
      }).catch(() => {});
    } else {
      pause();
      await fetch(`/api/exam/attempts/${attempt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pause" }),
      }).catch(() => {});
    }
  };

  const handleNextStation = async () => {
    nextStation();
    await fetch(`/api/exam/attempts/${attempt.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "next_station" }),
    }).catch(() => {});
  };

  const visibleQuestionIds =
    exam.mode === "station" && attempt.status === "in_progress" && currentStation
      ? currentStation.questionIds
      : orderedQuestionIds;

  const maxPoints = orderedQuestionIds.reduce(
    (sum, id) => sum + (exam.questions[id]?.points ?? 0),
    0,
  );
  const currentTotalScore = computeTotalScore(attempt);

  return (
    <div className="space-y-5">
      {/* Thanh đồng hồ & điều khiển Sticky trên đầu */}
      <div className="sticky top-16 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-md backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
        <div className="flex flex-wrap items-center gap-3">
          {attempt.status === "in_progress" ? (
            <div
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 font-mono text-base font-bold ${
                countdown.isWarning1Min
                  ? "animate-pulse bg-rose-600 text-white"
                  : countdown.isWarning5Min
                    ? "bg-amber-500 text-slate-950"
                    : "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
              }`}
            >
              <span>⏱</span>
              <span>
                {exam.mode === "station" && countdown.stationFormatted
                  ? `Trạm: ${countdown.stationFormatted}`
                  : countdown.formatted}
              </span>
            </div>
          ) : (
            <Badge tone="emerald" className="px-3 py-1.5 text-sm">
              ✓ Đã nộp bài • Điểm: {currentTotalScore} / {maxPoints} đ
            </Badge>
          )}

          <Badge tone={attempt.mode === "exam" ? "blue" : "purple"}>
            {attempt.mode === "exam" ? "Chế độ Thi thật" : "Chế độ Luyện tập"}
          </Badge>

          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Đã làm: <strong>{answeredCount}</strong>/{orderedQuestionIds.length} câu
          </span>

          <span className="text-xs text-slate-400">
            {saveStatus === "saving"
              ? "Đang tự lưu..."
              : saveStatus === "saved"
                ? "✓ Đã tự lưu"
                : saveStatus === "error"
                  ? "⚠ Lưu tạm offline"
                  : ""}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {attempt.status === "in_progress" && attempt.mode === "practice" ? (
            <Button variant="outline" size="sm" onClick={() => void handleTogglePause()}>
              {countdown.isPaused ? "▶ Tiếp tục" : "⏸ Tạm dừng"}
            </Button>
          ) : null}

          {exam.mode === "station" && attempt.status === "in_progress" ? (
            <Button variant="secondary" size="sm" onClick={() => void handleNextStation()}>
              {isLastStation ? "Hoàn thành trạm cuối →" : "Qua trạm tiếp theo →"}
            </Button>
          ) : null}

          <Button variant="outline" size="sm" onClick={() => setNavSheetOpen(true)}>
            🧭 Bảng câu hỏi ({attempt.flagged.length > 0 ? `🚩${attempt.flagged.length}` : answeredCount})
          </Button>

          {attempt.status === "in_progress" ? (
            <Button variant="primary" size="sm" onClick={() => setConfirmSubmitOpen(true)}>
              Nộp bài
            </Button>
          ) : (
            <Link href={`/thi/de/${exam.id}/in?variant=attempt&attemptId=${attempt.id}`}>
              <Button variant="outline" size="sm">
                🖨 Xuất PDF bài làm
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Màn chuẩn bị chuyển trạm OSCE 10 giây */}
      {prepCountdown !== null && currentStation ? (
        <Card className="border-2 border-purple-400 bg-purple-50/90 text-center dark:border-purple-700 dark:bg-purple-950/50">
          <Badge tone="purple">CHUẨN BỊ VÀO TRẠM OSCE TIẾP THEO</Badge>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {currentStation.title}
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Trạm sẽ tự động bắt đầu tính giờ sau <strong>{prepCountdown} giây</strong>...
          </p>
          <div className="mt-4">
            <Button
              variant="primary"
              onClick={() => {
                setPrepCountdown(null);
                beginStation();
              }}
            >
              Bắt đầu trạm ngay
            </Button>
          </div>
        </Card>
      ) : null}

      {/* Thông tin tình huống trạm hiện tại (nếu là đề OSCE) */}
      {exam.mode === "station" && currentStation && attempt.status === "in_progress" ? (
        <Card className="border-l-4 border-l-purple-600 bg-purple-50/40 dark:bg-purple-950/20">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-purple-950 dark:text-purple-200">
              {currentStation.title}
            </h3>
            <Badge tone="purple">
              Trạm {(attempt.currentStationIndex ?? 0) + 1}/{exam.stations?.length ?? 1}
            </Badge>
          </div>
          {currentStation.scenario.length > 0 ? (
            <div className="mt-2">
              <ContentBlockRenderer blocks={currentStation.scenario} />
            </div>
          ) : null}
        </Card>
      ) : null}

      {/* Bảng tổng kết sau khi nộp bài */}
      {attempt.status !== "in_progress" ? (
        <Card className="border-emerald-300 bg-emerald-50/60 dark:border-emerald-800 dark:bg-emerald-950/30">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Kết quả bài làm: {currentTotalScore} / {maxPoints} điểm
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Điểm trắc nghiệm tự động: <strong>{attempt.autoScore ?? 0} đ</strong> • Câu tự luận
                cần tự chấm theo barem: <strong>{essayQuestionIds.length} câu</strong>
              </p>
            </div>
            {essayQuestionIds.length > 0 && attempt.status !== "graded" ? (
              <Button
                variant="primary"
                size="sm"
                onClick={finishGrading}
                disabled={!isGradingComplete}
              >
                ✓ Hoàn tất tự chấm điểm
              </Button>
            ) : null}
          </div>
        </Card>
      ) : null}

      {/* Danh sách câu hỏi */}
      <div className="space-y-4">
        {visibleQuestionIds.map((qid) => {
          const q = exam.questions[qid];
          if (!q) return null;
          const answer = attempt.answers[qid];
          const locked = isLocked(qid);
          const flagged = isFlagged(qid);
          const selfGrade = attempt.selfGrades[qid];

          const choiceOptions =
            q.type === "true_false"
              ? [
                  { key: "Đúng", content: [{ type: "text" as const, md: "Đúng" }] },
                  { key: "Sai", content: [{ type: "text" as const, md: "Sai" }] },
                ]
              : (q.choices ?? []);

          return (
            <Card
              key={q.id}
              id={`question-${q.id}`}
              className="scroll-mt-32 space-y-4 transition-all"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-slate-900 dark:text-white">
                    Câu {q.number}
                  </span>
                  <Badge tone="neutral">{q.points} điểm</Badge>
                  <Badge tone="blue">
                    {q.type === "mcq_single"
                      ? "Chọn 1 đáp án"
                      : q.type === "mcq_multi"
                        ? "Chọn nhiều đáp án"
                        : q.type === "true_false"
                          ? "Đúng / Sai"
                          : "Tự luận"}
                  </Badge>
                </div>

                {attempt.status === "in_progress" ? (
                  <Button
                    variant={flagged ? "danger" : "outline"}
                    size="sm"
                    onClick={() => toggleFlag(q.id)}
                  >
                    {flagged ? "🚩 Đã gắn cờ" : "🏳 Gắn cờ xem lại"}
                  </Button>
                ) : null}
              </div>

              <ContentBlockRenderer blocks={q.stem} />

              {/* Lựa chọn trắc nghiệm */}
              {q.type !== "essay" ? (
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {choiceOptions.map((c) => {
                    const selected =
                      answer?.kind === "choice" && answer.keys.includes(c.key);
                    const isCorrect = q.correctKeys?.includes(c.key);

                    let borderClass =
                      "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900";
                    if (selected) {
                      borderClass =
                        "border-blue-600 bg-blue-50/90 text-blue-950 ring-2 ring-blue-500/30 dark:border-blue-400 dark:bg-blue-950/70 dark:text-blue-100";
                    }
                    if (attempt.status !== "in_progress") {
                      if (isCorrect) {
                        borderClass =
                          "border-emerald-500 bg-emerald-50 text-emerald-950 dark:border-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-100";
                      } else if (selected && !isCorrect) {
                        borderClass =
                          "border-rose-500 bg-rose-50 text-rose-950 dark:border-rose-600 dark:bg-rose-950/60 dark:text-rose-100";
                      }
                    }

                    return (
                      <button
                        key={c.key}
                        type="button"
                        disabled={locked}
                        onClick={() => selectChoice(q.id, c.key)}
                        className={`flex min-h-12 items-start gap-2.5 rounded-xl border p-3.5 text-left text-sm transition-colors disabled:opacity-75 ${borderClass}`}
                      >
                        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-current text-xs font-bold">
                          {c.key}
                        </span>
                        <div className="flex-1">
                          <ContentBlockRenderer blocks={c.content} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* Ô nhập bài làm tự luận */
                <div className="space-y-2">
                  <textarea
                    rows={5}
                    disabled={locked}
                    value={answer?.kind === "essay" ? answer.text : ""}
                    onChange={(e) => setEssayText(q.id, e.target.value)}
                    placeholder="Nhập câu trả lời tự luận của bạn tại đây..."
                    className="w-full rounded-xl border border-slate-300 bg-white p-3.5 text-base text-slate-900 focus:border-blue-500 focus:outline-none disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:disabled:bg-slate-900"
                  />
                </div>
              )}

              {/* Hiển thị đáp án đúng & Barem tự chấm khi ở chế độ Luyện tập hoặc Đã nộp */}
              {canRevealAnswers ? (
                <div className="space-y-3 border-t border-slate-200 pt-3 dark:border-slate-800">
                  {q.type !== "essay" && q.correctKeys ? (
                    <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      ✓ Đáp án chuẩn: {q.correctKeys.join(", ")}
                    </div>
                  ) : null}

                  {q.type === "essay" ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 dark:border-blue-900 dark:bg-blue-950/40">
                        <div className="mb-1.5 text-xs font-bold text-blue-900 dark:text-blue-200">
                          📘 Đáp án mẫu:
                        </div>
                        <ContentBlockRenderer blocks={q.modelAnswer} />
                      </div>

                      {q.rubric && q.rubric.length > 0 ? (
                        <div className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 dark:border-emerald-900 dark:bg-emerald-950/30">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                              ☑️ Tự chấm theo Barem:
                            </span>
                            <Badge tone="emerald">
                              {selfGrade?.score ?? 0} / {q.points} đ
                            </Badge>
                          </div>
                          <div className="space-y-1.5">
                            {q.rubric.map((r) => {
                              const checked =
                                selfGrade?.checkedRubricIds.includes(r.id) ?? false;
                              return (
                                <label
                                  key={r.id}
                                  className="flex cursor-pointer items-start gap-2 rounded-lg p-1.5 text-xs hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40"
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    disabled={attempt.status === "in_progress"}
                                    onChange={() => toggleRubricItem(q.id, r.id)}
                                    className="mt-0.5 h-4 w-4 rounded"
                                  />
                                  <span className="flex-1 text-slate-800 dark:text-slate-200">
                                    {r.label}{" "}
                                    <strong className="text-emerald-700 dark:text-emerald-300">
                                      (+{r.points} đ)
                                    </strong>
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                          {attempt.status !== "in_progress" ? (
                            <input
                              type="text"
                              value={selfGrade?.comment ?? ""}
                              onChange={(e) =>
                                setSelfGrade(
                                  q.id,
                                  selfGrade?.checkedRubricIds ?? [],
                                  e.target.value,
                                )
                              }
                              placeholder="Ghi chú tự rút kinh nghiệm cho câu này..."
                              className="mt-1 min-h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs dark:border-slate-700 dark:bg-slate-900"
                            />
                          ) : (
                            <p className="text-[11px] text-slate-500">
                              Nộp bài để tick chọn từng ý đúng trong barem tự chấm.
                            </p>
                          )}
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {q.note && q.note.length > 0 ? (
                    <div className="rounded-xl bg-amber-50/80 p-3 text-xs text-amber-950 dark:bg-amber-950/40 dark:text-amber-200">
                      <strong>💡 Giải thích: </strong>
                      <ContentBlockRenderer blocks={q.note} />
                    </div>
                  ) : null}
                </div>
              ) : null}
            </Card>
          );
        })}
      </div>

      {/* Bảng điều hướng câu hỏi (Drawer phải trên PC / Bottom Sheet trên Mobile) */}
      <Sheet
        open={navSheetOpen}
        onClose={() => setNavSheetOpen(false)}
        title="Bảng điều hướng câu hỏi"
      >
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge tone="blue">Đã trả lời: {answeredCount}</Badge>
            <Badge tone="neutral">Chưa làm: {unansweredIds.length}</Badge>
            <Badge tone="rose">Gắn cờ: {attempt.flagged.length}</Badge>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {orderedQuestionIds.map((qid) => {
              const q = exam.questions[qid];
              if (!q) return null;
              const isDone = !unansweredIds.includes(qid);
              const flagged = isFlagged(qid);
              return (
                <button
                  key={qid}
                  type="button"
                  onClick={() => {
                    setNavSheetOpen(false);
                    document
                      .getElementById(`question-${qid}`)
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={`flex min-h-11 items-center justify-center rounded-xl border text-xs font-bold transition-colors ${
                    flagged
                      ? "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-200"
                      : isDone
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  }`}
                >
                  {q.number}
                  {flagged ? "🚩" : ""}
                </button>
              );
            })}
          </div>
        </div>
      </Sheet>

      {/* Hộp thoại xác nhận nộp bài */}
      <Modal
        open={confirmSubmitOpen}
        onClose={() => setConfirmSubmitOpen(false)}
        title="Xác nhận nộp bài thi"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmSubmitOpen(false)}>
              Quay lại làm tiếp
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setConfirmSubmitOpen(false);
                void submit();
              }}
            >
              Chắc chắn nộp bài
            </Button>
          </>
        }
      >
        <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
          <p>
            Bạn đã trả lời <strong>{answeredCount}</strong> /{" "}
            <strong>{orderedQuestionIds.length}</strong> câu hỏi.
          </p>
          {unansweredIds.length > 0 ? (
            <p className="font-medium text-amber-700 dark:text-amber-300">
              ⚠️ Còn {unansweredIds.length} câu chưa làm. Bạn vẫn muốn nộp bài ngay?
            </p>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}

function ExamSessionLoader() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const examId = params.id;
  const modeParam = searchParams.get("mode") === "practice" ? "practice" : "exam";
  const attemptIdParam = searchParams.get("attemptId");

  const { pushToast } = useToast();
  const [exam, setExam] = useState<Exam | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const examRes = await fetch(`/api/exam/${examId}`).then((r) => r.json());
        if (!examRes?.success) throw new Error(examRes?.error ?? "Không tìm thấy đề thi");
        const loadedExam = examRes.data as Exam;

        let targetAttempt: Attempt | null = null;
        if (attemptIdParam) {
          const attRes = await fetch(`/api/exam/attempts/${attemptIdParam}`).then((r) =>
            r.json(),
          );
          if (attRes?.success) targetAttempt = attRes.data as Attempt;
        } else {
          // Kiểm tra xem có bài làm đang dở (in_progress) để tự động làm tiếp không
          const listRes = await fetch(`/api/exam/attempts?examId=${examId}`).then((r) =>
            r.json(),
          );
          if (listRes?.success && Array.isArray(listRes.data)) {
            const existing = (listRes.data as Attempt[]).find(
              (a) => a.status === "in_progress" && a.mode === modeParam,
            );
            if (existing) targetAttempt = existing;
          }
          if (!targetAttempt) {
            const createRes = await fetch("/api/exam/attempts", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ examId, mode: modeParam }),
            }).then((r) => r.json());
            if (!createRes?.success) throw new Error(createRes?.error ?? "Không tạo được bài thi");
            targetAttempt = createRes.data as Attempt;
          }
        }

        if (!cancelled) {
          setExam(loadedExam);
          setAttempt(targetAttempt);
        }
      } catch (err) {
        if (!cancelled) {
          pushToast(err instanceof Error ? err.message : "Lỗi khởi tạo phòng thi", "error");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [examId, modeParam, attemptIdParam, pushToast]);

  if (loading) {
    return (
      <AppShell title="Đang chuẩn bị phòng thi..." backHref="/thi" backLabel="Ngân hàng đề">
        <Skeleton className="h-72 w-full" />
      </AppShell>
    );
  }

  if (!exam || !attempt) {
    return (
      <AppShell title="Không thể mở bài thi" backHref="/thi" backLabel="Ngân hàng đề">
        <EmptyState title="Đề thi hoặc lượt làm bài không tồn tại" />
      </AppShell>
    );
  }

  return (
    <AppShell
      title={exam.title}
      subtitle={`${exam.subject} • ${exam.mode === "station" ? "Thi Trạm OSCE" : "Đề Thường"}`}
      backHref={`/thi/de/${exam.id}`}
      backLabel="Chi tiết đề"
    >
      <ExamRunnerInner exam={exam} initialAttempt={attempt} />
    </AppShell>
  );
}

export default function ExamSessionPage() {
  return (
    <Suspense
      fallback={
        <AppShell title="Đang tải phòng thi..." backHref="/thi">
          <Skeleton className="h-72 w-full" />
        </AppShell>
      }
    >
      <ExamSessionLoader />
    </Suspense>
  );
}
