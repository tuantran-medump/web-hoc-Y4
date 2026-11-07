import { describe, expect, it } from "vitest";
import { addBoardColumn, DEFAULT_BOARD_STATE, moveCard } from "@/features/dashboard/board-utils";

describe("Dashboard Kanban utilities (moveCard & addBoardColumn)", () => {
  it("moves a card across columns and normalizes order", () => {
    const initial = DEFAULT_BOARD_STATE.cards;
    const moved = moveCard(initial, "app-thi", "col-review", 0);

    const movedCard = moved.find((c) => c.id === "app-thi");
    expect(movedCard?.columnId).toBe("col-review");
    expect(movedCard?.order).toBe(0);

    const activeCards = moved.filter((c) => c.columnId === "col-active");
    expect(activeCards).toHaveLength(1);
    expect(activeCards[0]?.order).toBe(0);
  });

  it("reorders cards within the same column", () => {
    const initial = DEFAULT_BOARD_STATE.cards;
    const reordered = moveCard(initial, "app-thi", "col-active", 1);
    const activeCards = reordered
      .filter((c) => c.columnId === "col-active")
      .sort((a, b) => a.order - b.order);

    expect(activeCards.map((c) => c.id)).toEqual(["app-tai-lieu", "app-thi"]);
  });

  it("adds a new column with incremented order", () => {
    const cols = addBoardColumn(DEFAULT_BOARD_STATE.columns, "Sắp thi");
    expect(cols).toHaveLength(4);
    expect(cols[3]?.title).toBe("Sắp thi");
    expect(cols[3]?.order).toBe(3);
  });
});
