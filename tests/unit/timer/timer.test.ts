import { describe, expect, it } from "vitest";
import { computeRemainingSec, formatClock } from "@/hooks/useCountdown";
import {
  applyChoice,
  computeSelfGradeScore,
  pauseAttempt,
  resumeAttempt,
} from "@/hooks/useExamAttempt";
import type { Attempt, Question } from "@/types";

describe("Countdown & Exam Attempt Pure Helpers", () => {
  it("computes remaining seconds from absolute endsAt without drift", () => {
    const now = Date.parse("2026-11-07T12:00:00Z");
    const endsAt = "2026-11-07T12:05:30Z";
    expect(computeRemainingSec(endsAt, now)).toBe(330);
    expect(formatClock(330)).toBe("05:30");
  });

  it("pauses and resumes a practice attempt preserving remaining time", () => {
    const start = Date.parse("2026-11-07T12:00:00Z");
    const attempt: Attempt = {
      id: "att-1",
      examId: "ex-1",
      examVersion: 1,
      mode: "practice",
      startedAt: new Date(start).toISOString(),
      endsAt: new Date(start + 600_000).toISOString(),
      answers: {},
      flagged: [],
      selfGrades: {},
      status: "in_progress",
    };

    const paused = pauseAttempt(attempt, start + 100_000);
    expect(paused.pausedRemainingSec).toBe(500);

    const resumed = resumeAttempt(paused, start + 400_000);
    expect(resumed.pausedRemainingSec).toBeNull();
    expect(computeRemainingSec(resumed.endsAt, start + 400_000)).toBe(500);
  });

  it("applies single/multi choices and computes self-grade rubric score", () => {
    const qMulti: Question = {
      id: "q1",
      number: 1,
      type: "mcq_multi",
      points: 2,
      stem: [{ type: "text", md: "Question" }],
      tags: [],
      rubric: [
        { id: "r1", label: "Ý 1", points: 1 },
        { id: "r2", label: "Ý 2", points: 1 },
      ],
    };

    const first = applyChoice(qMulti, undefined, "B");
    const second = applyChoice(qMulti, first, "A");
    expect(second).toEqual({ kind: "choice", keys: ["A", "B"] });
    expect(computeSelfGradeScore(qMulti, ["r1"])).toBe(1);
    expect(computeSelfGradeScore(qMulti, ["r1", "r2"])).toBe(2);
  });
});
