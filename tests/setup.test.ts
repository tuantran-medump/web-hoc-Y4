import { describe, expect, it } from "vitest";
import type {
  ApiResponse,
  BoardCard,
  Exam,
  RenderedDoc,
} from "@/types";

describe("Shared Data Contracts (src/types/index.ts)", () => {
  it("constructs valid ApiResponse, BoardCard, Exam, and RenderedDoc objects", () => {
    const res: ApiResponse<{ status: string }> = {
      success: true,
      data: { status: "ok" },
    };
    const card: BoardCard = {
      id: "app-thi",
      columnId: "col-active",
      order: 0,
      title: "Thi thử",
      kind: "app",
      href: "/thi",
      stats: [{ label: "Đề thi", value: "0 đề" }],
    };
    const exam: Partial<Exam> = {
      id: "exam-1",
      mode: "standard",
      durationSec: 1800,
    };
    const doc: Partial<RenderedDoc> = {
      blocks: [],
      sources: [],
      toc: [],
    };

    expect(res.success).toBe(true);
    expect(card.kind).toBe("app");
    expect(exam.mode).toBe("standard");
    expect(doc.blocks).toEqual([]);
  });
});
