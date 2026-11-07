"use client";

/**
 * useExamAttempt — quản lý một lượt làm bài (Attempt).
 *
 * - Chọn đáp án, viết tự luận, gắn cờ, tạm dừng/tiếp tục (practice), thi trạm OSCE
 *   (chỉ đi tới, không quay lại trạm cũ), nộp bài, tự chấm theo barem.
 * - Tự lưu: debounce `autosaveDelayMs` (mặc định 500ms). Các lần lưu được xếp hàng tuần tự
 *   nên không bao giờ ghi đè bản mới bằng bản cũ. Lưu ngay khi nộp bài, khi tab bị ẩn/đóng và khi unmount.
 * - Tích hợp sẵn `useCountdown`:
 *   - standard: hết giờ tổng → tự nộp (nếu `autoSubmitOnExpire`).
 *   - station: hết giờ trạm → sang trạm tiếp (chờ UI gọi `beginStation()` sau màn chuẩn bị),
 *     hết trạm cuối → tự nộp. Đồng hồ tổng không dùng để nộp ở chế độ trạm.
 * - Điểm trắc nghiệm (`autoScore`) do server chấm (`gradeChoices` — Codex). Gọi API trong `onSubmit`
 *   rồi `setAutoScore(score)`. Hook không tự chấm trắc nghiệm để không lộ logic/đáp án ra 2 nơi.
 *
 * Các hàm thuần (applyChoice, computeSelfGradeScore, pauseAttempt...) được export để test không cần React.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AnswerValue, Attempt, Exam, Question, SelfGrade, Station } from "@/types";
import { computeRemainingSec, useCountdown, useLatestRef, type CountdownState } from "./useCountdown";

// ---------------------------------------------------------------------------
// Hàm thuần
// ---------------------------------------------------------------------------

export function roundScore(value: number): number {
  return Math.round(value * 100) / 100;
}

function toIso(ms: number): string {
  return new Date(ms).toISOString();
}

/** Thứ tự câu hỏi theo trạm (station) hoặc theo phần (standard); câu không thuộc nhóm nào xếp cuối. */
export function getOrderedQuestionIds(exam: Exam): string[] {
  const groups: { questionIds: string[] }[] =
    exam.mode === "station" ? (exam.stations ?? []) : exam.sections;
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const g of groups) {
    for (const id of g.questionIds) {
      if (!seen.has(id) && exam.questions[id]) {
        seen.add(id);
        ids.push(id);
      }
    }
  }
  for (const id of Object.keys(exam.questions)) {
    if (!seen.has(id)) ids.push(id);
  }
  return ids;
}

export function getStationIndexOfQuestion(exam: Exam, questionId: string): number {
  return (exam.stations ?? []).findIndex((s) => s.questionIds.includes(questionId));
}

export function isAnswered(value: AnswerValue | undefined): boolean {
  if (!value) return false;
  return value.kind === "choice" ? value.keys.length > 0 : value.text.trim() !== "";
}

/** mcq_multi: bật/tắt lựa chọn; mcq_single/true_false: thay bằng lựa chọn mới. */
export function applyChoice(question: Question, current: AnswerValue | undefined, key: string): AnswerValue {
  const prev = current?.kind === "choice" ? current.keys : [];
  if (question.type === "mcq_multi") {
    const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key].sort();
    return { kind: "choice", keys: next };
  }
  return { kind: "choice", keys: [key] };
}

/** Tổng điểm các ý barem được tick, không vượt quá điểm câu. Id không có trong barem bị bỏ qua. */
export function computeSelfGradeScore(question: Question, checkedRubricIds: string[]): number {
  const checked = new Set(checkedRubricIds);
  const sum = (question.rubric ?? []).reduce((acc, r) => (checked.has(r.id) ? acc + r.points : acc), 0);
  return roundScore(Math.min(Math.max(sum, 0), question.points));
}

export function computeTotalScore(attempt: Attempt): number {
  const self = Object.values(attempt.selfGrades).reduce((acc, g) => acc + g.score, 0);
  return roundScore((attempt.autoScore ?? 0) + self);
}

/** Câu tự luận cần tự chấm. */
export function getEssayQuestionIds(exam: Exam): string[] {
  return getOrderedQuestionIds(exam).filter((id) => exam.questions[id]?.type === "essay");
}

export function isQuestionLocked(exam: Exam, attempt: Attempt, questionId: string): boolean {
  if (attempt.status !== "in_progress") return true;
  if (attempt.mode === "practice" && attempt.pausedRemainingSec != null) return true;
  if (exam.mode === "station") {
    const idx = getStationIndexOfQuestion(exam, questionId);
    if (idx !== (attempt.currentStationIndex ?? 0)) return true;
    if (!attempt.stationEndsAt) return true; // trạm chưa bắt đầu (màn chuẩn bị)
  }
  return false;
}

export function pauseAttempt(attempt: Attempt, nowMs: number): Attempt {
  if (attempt.mode !== "practice" || attempt.status !== "in_progress" || attempt.pausedRemainingSec != null) {
    return attempt;
  }
  return { ...attempt, pausedRemainingSec: computeRemainingSec(attempt.endsAt, nowMs) };
}

/** Dời `endsAt` (và `stationEndsAt`) đúng bằng khoảng thời gian đã tạm dừng. */
export function resumeAttempt(attempt: Attempt, nowMs: number): Attempt {
  if (attempt.pausedRemainingSec == null) return attempt;
  const newEnds = nowMs + attempt.pausedRemainingSec * 1000;
  const oldEnds = Date.parse(attempt.endsAt);
  const delta = Number.isNaN(oldEnds) ? 0 : newEnds - oldEnds;
  const stationEnds = attempt.stationEndsAt ? Date.parse(attempt.stationEndsAt) : Number.NaN;
  return {
    ...attempt,
    endsAt: toIso(newEnds),
    stationEndsAt: Number.isNaN(stationEnds) ? attempt.stationEndsAt : toIso(stationEnds + delta),
    pausedRemainingSec: null,
  };
}

export function getCurrentStation(exam: Exam, attempt: Attempt): Station | null {
  if (exam.mode !== "station") return null;
  return exam.stations?.[attempt.currentStationIndex ?? 0] ?? null;
}

/** Bắt đầu đếm giờ trạm hiện tại (sau màn chuẩn bị). Không làm gì nếu trạm đã chạy. */
export function beginStationAttempt(exam: Exam, attempt: Attempt, nowMs: number): Attempt {
  const station = getCurrentStation(exam, attempt);
  if (!station || attempt.status !== "in_progress" || attempt.stationEndsAt) return attempt;
  return {
    ...attempt,
    currentStationIndex: attempt.currentStationIndex ?? 0,
    stationEndsAt: toIso(nowMs + station.durationSec * 1000),
  };
}

/** Sang trạm kế (chỉ đi tới). `finished = true` nếu vừa qua trạm cuối. */
export function advanceStationAttempt(exam: Exam, attempt: Attempt): { attempt: Attempt; finished: boolean } {
  const total = exam.stations?.length ?? 0;
  const next = (attempt.currentStationIndex ?? 0) + 1;
  if (next >= total) return { attempt, finished: true };
  return { attempt: { ...attempt, currentStationIndex: next, stationEndsAt: undefined }, finished: false };
}

export function submitAttemptState(attempt: Attempt, nowMs: number, autoScore?: number): Attempt {
  if (attempt.status !== "in_progress") return attempt;
  return {
    ...attempt,
    status: "submitted",
    submittedAt: toIso(nowMs),
    pausedRemainingSec: null,
    stationEndsAt: undefined,
    autoScore: autoScore ?? attempt.autoScore,
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export interface UseExamAttemptOptions {
  exam: Exam;
  initialAttempt: Attempt;
  /** Lưu attempt (API/IndexedDB). Ném lỗi → saveStatus = "error", lần thay đổi sau sẽ thử lại. */
  save?: (attempt: Attempt) => Promise<void> | void;
  autosaveDelayMs?: number;
  /** Mặc định true. */
  autoSubmitOnExpire?: boolean;
  /** Gọi sau khi nộp và đã lưu. Thường dùng để gọi API chấm trắc nghiệm rồi `setAutoScore`. */
  onSubmit?: (attempt: Attempt) => void;
  /** Gọi khi sang trạm mới (index mới) — UI hiện màn "Chuẩn bị trạm tiếp theo" rồi gọi `beginStation()`. */
  onStationChange?: (stationIndex: number) => void;
  now?: () => number;
}

export interface UseExamAttemptResult {
  attempt: Attempt;
  countdown: CountdownState;
  saveStatus: SaveStatus;

  orderedQuestionIds: string[];
  answeredCount: number;
  unansweredIds: string[];
  currentStation: Station | null;
  isLastStation: boolean;
  /** practice hoặc đã nộp → được xem đáp án */
  canRevealAnswers: boolean;
  essayQuestionIds: string[];
  /** Mọi câu tự luận đã có SelfGrade */
  isGradingComplete: boolean;

  isFlagged: (questionId: string) => boolean;
  isLocked: (questionId: string) => boolean;

  selectChoice: (questionId: string, key: string) => void;
  setChoiceKeys: (questionId: string, keys: string[]) => void;
  setEssayText: (questionId: string, text: string) => void;
  clearAnswer: (questionId: string) => void;
  toggleFlag: (questionId: string) => void;

  pause: () => void;
  resume: () => void;

  beginStation: () => void;
  /** Kết thúc trạm sớm, sang trạm kế (hoặc nộp nếu là trạm cuối). */
  nextStation: () => void;

  submit: (opts?: { autoScore?: number }) => Promise<Attempt>;
  setAutoScore: (score: number) => void;

  setSelfGrade: (questionId: string, checkedRubricIds: string[], comment?: string) => void;
  toggleRubricItem: (questionId: string, rubricId: string) => void;
  finishGrading: () => void;

  flushSave: () => Promise<void>;
}

export function useExamAttempt(options: UseExamAttemptOptions): UseExamAttemptResult {
  const {
    exam,
    initialAttempt,
    save,
    autosaveDelayMs = 500,
    autoSubmitOnExpire = true,
    onSubmit,
    onStationChange,
    now = Date.now,
  } = options;

  const [attempt, setAttempt] = useState<Attempt>(initialAttempt);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  const attemptRef = useRef(attempt);
  // Không ghi ref lúc render (React 19 / React Compiler): dùng useLatestRef.
  const examRef = useLatestRef(exam);
  const saveRef = useLatestRef(save);
  const nowRef = useLatestRef(now);
  const onSubmitRef = useLatestRef(onSubmit);
  const onStationChangeRef = useLatestRef(onStationChange);

  const dirtyRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chainRef = useRef<Promise<void>>(Promise.resolve());

  // Đổi sang attempt khác → nạp lại state.
  useEffect(() => {
    if (attemptRef.current.id !== initialAttempt.id) {
      attemptRef.current = initialAttempt;
      dirtyRef.current = false;
      setAttempt(initialAttempt);
      setSaveStatus("idle");
    }
  }, [initialAttempt]);

  // ----- Lưu tuần tự -----
  const flushSave = useCallback((): Promise<void> => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const run = async (): Promise<void> => {
      if (!dirtyRef.current) return;
      const fn = saveRef.current;
      dirtyRef.current = false;
      if (!fn) return;
      const snapshot = attemptRef.current;
      setSaveStatus("saving");
      try {
        await fn(snapshot);
        if (!dirtyRef.current) setSaveStatus("saved");
      } catch {
        dirtyRef.current = true;
        setSaveStatus("error");
      }
    };
    chainRef.current = chainRef.current.then(run, run);
    return chainRef.current;
  }, []);

  const scheduleSave = useCallback(() => {
    dirtyRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      void flushSave();
    }, autosaveDelayMs);
  }, [autosaveDelayMs, flushSave]);

  /** Mọi thay đổi đi qua đây: tính từ bản mới nhất (ref), tránh state cũ trong closure. */
  const update = useCallback(
    (fn: (prev: Attempt) => Attempt): Attempt => {
      const prev = attemptRef.current;
      const next = fn(prev);
      if (next !== prev) {
        attemptRef.current = next;
        setAttempt(next);
        scheduleSave();
      }
      return next;
    },
    [scheduleSave],
  );

  // Lưu ngay khi tab bị ẩn/đóng (Safari iOS hay kill tab nền) và khi unmount.
  useEffect(() => {
    const onHide = (): void => {
      if (document.visibilityState === "hidden") void flushSave();
    };
    const onPageHide = (): void => void flushSave();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onPageHide);
      void flushSave();
    };
  }, [flushSave]);

  // ----- Hành động làm bài -----
  const editAnswer = useCallback(
    (questionId: string, fn: (q: Question, current: AnswerValue | undefined) => AnswerValue | null) => {
      update((prev) => {
        const q = examRef.current.questions[questionId];
        if (!q || isQuestionLocked(examRef.current, prev, questionId)) return prev;
        const value = fn(q, prev.answers[questionId]);
        const answers = { ...prev.answers };
        if (value === null) delete answers[questionId];
        else answers[questionId] = value;
        return { ...prev, answers };
      });
    },
    [update],
  );

  const selectChoice = useCallback(
    (questionId: string, key: string) => editAnswer(questionId, (q, cur) => applyChoice(q, cur, key)),
    [editAnswer],
  );

  const setChoiceKeys = useCallback(
    (questionId: string, keys: string[]) =>
      editAnswer(questionId, (q) => ({
        kind: "choice",
        keys: q.type === "mcq_multi" ? [...new Set(keys)].sort() : keys.slice(0, 1),
      })),
    [editAnswer],
  );

  const setEssayText = useCallback(
    (questionId: string, text: string) => editAnswer(questionId, () => ({ kind: "essay", text })),
    [editAnswer],
  );

  const clearAnswer = useCallback((questionId: string) => editAnswer(questionId, () => null), [editAnswer]);

  const toggleFlag = useCallback(
    (questionId: string) =>
      update((prev) => {
        if (prev.status !== "in_progress") return prev;
        const flagged = prev.flagged.includes(questionId)
          ? prev.flagged.filter((id) => id !== questionId)
          : [...prev.flagged, questionId];
        return { ...prev, flagged };
      }),
    [update],
  );

  const pause = useCallback(() => update((prev) => pauseAttempt(prev, nowRef.current())), [update]);
  const resume = useCallback(() => update((prev) => resumeAttempt(prev, nowRef.current())), [update]);

  // ----- Nộp bài -----
  const submit = useCallback(
    async (opts?: { autoScore?: number }): Promise<Attempt> => {
      const before = attemptRef.current;
      const next = update((prev) => submitAttemptState(prev, nowRef.current(), opts?.autoScore));
      if (next !== before) {
        await flushSave();
        onSubmitRef.current?.(next);
      }
      return next;
    },
    [update, flushSave],
  );

  // ----- Thi trạm -----
  const beginStation = useCallback(
    () => update((prev) => beginStationAttempt(examRef.current, prev, nowRef.current())),
    [update],
  );

  const nextStation = useCallback(() => {
    const prev = attemptRef.current;
    if (examRef.current.mode !== "station" || prev.status !== "in_progress") return;
    const { attempt: next, finished } = advanceStationAttempt(examRef.current, prev);
    if (finished) {
      void submit();
      return;
    }
    update(() => next);
    onStationChangeRef.current?.(next.currentStationIndex ?? 0);
  }, [submit, update]);

  // ----- Đồng hồ -----
  const handleExpire = useCallback(() => {
    if (!autoSubmitOnExpire || examRef.current.mode === "station") return;
    if (attemptRef.current.status === "in_progress") void submit();
  }, [autoSubmitOnExpire, submit]);

  const handleStationExpire = useCallback(() => {
    if (!autoSubmitOnExpire) return;
    nextStation();
  }, [autoSubmitOnExpire, nextStation]);

  const countdown = useCountdown({
    endsAt: attempt.endsAt,
    mode: attempt.mode,
    pausedRemainingSec: attempt.pausedRemainingSec ?? null,
    stationEndsAt: exam.mode === "station" && attempt.status === "in_progress" ? (attempt.stationEndsAt ?? null) : null,
    onExpire: handleExpire,
    onStationExpire: handleStationExpire,
    now,
  });

  // ----- Chấm điểm -----
  const setAutoScore = useCallback(
    (score: number) =>
      update((prev) => {
        const next: Attempt = { ...prev, autoScore: roundScore(score) };
        return prev.status === "graded" ? { ...next, totalScore: computeTotalScore(next) } : next;
      }),
    [update],
  );

  const setSelfGrade = useCallback(
    (questionId: string, checkedRubricIds: string[], comment?: string) =>
      update((prev) => {
        const q = examRef.current.questions[questionId];
        if (!q || prev.status === "in_progress") return prev;
        const validIds = new Set((q.rubric ?? []).map((r) => r.id));
        const ids = [...new Set(checkedRubricIds)].filter((id) => validIds.has(id));
        const grade: SelfGrade = {
          checkedRubricIds: ids,
          score: computeSelfGradeScore(q, ids),
          comment: comment ?? prev.selfGrades[questionId]?.comment,
        };
        const next: Attempt = { ...prev, selfGrades: { ...prev.selfGrades, [questionId]: grade } };
        return prev.status === "graded" ? { ...next, totalScore: computeTotalScore(next) } : next;
      }),
    [update],
  );

  const toggleRubricItem = useCallback(
    (questionId: string, rubricId: string) => {
      const current = attemptRef.current.selfGrades[questionId]?.checkedRubricIds ?? [];
      const next = current.includes(rubricId) ? current.filter((id) => id !== rubricId) : [...current, rubricId];
      setSelfGrade(questionId, next);
    },
    [setSelfGrade],
  );

  const finishGrading = useCallback(
    () =>
      update((prev) => {
        if (prev.status === "in_progress") return prev;
        return { ...prev, status: "graded", totalScore: computeTotalScore(prev) };
      }),
    [update],
  );

  // ----- Giá trị dẫn xuất -----
  const orderedQuestionIds = useMemo(() => getOrderedQuestionIds(exam), [exam]);
  const essayQuestionIds = useMemo(() => getEssayQuestionIds(exam), [exam]);
  const unansweredIds = useMemo(
    () => orderedQuestionIds.filter((id) => !isAnswered(attempt.answers[id])),
    [orderedQuestionIds, attempt.answers],
  );
  const flaggedSet = useMemo(() => new Set(attempt.flagged), [attempt.flagged]);
  const currentStation = getCurrentStation(exam, attempt);
  const stationCount = exam.stations?.length ?? 0;

  const isFlagged = useCallback((id: string) => flaggedSet.has(id), [flaggedSet]);
  const isLocked = useCallback((id: string) => isQuestionLocked(exam, attempt, id), [exam, attempt]);

  return {
    attempt,
    countdown,
    saveStatus,
    orderedQuestionIds,
    answeredCount: orderedQuestionIds.length - unansweredIds.length,
    unansweredIds,
    currentStation,
    isLastStation: exam.mode === "station" && (attempt.currentStationIndex ?? 0) >= stationCount - 1,
    canRevealAnswers: attempt.mode === "practice" || attempt.status !== "in_progress",
    essayQuestionIds,
    isGradingComplete: essayQuestionIds.every((id) => attempt.selfGrades[id] !== undefined),
    isFlagged,
    isLocked,
    selectChoice,
    setChoiceKeys,
    setEssayText,
    clearAnswer,
    toggleFlag,
    pause,
    resume,
    beginStation,
    nextStation,
    submit,
    setAutoScore,
    setSelfGrade,
    toggleRubricItem,
    finishGrading,
    flushSave,
  };
}
