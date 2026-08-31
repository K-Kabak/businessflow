import { describe, expect, it } from "vitest";
import {
  calculateProjectProgress,
  isOverdue,
  startOfTodayUtc,
} from "@/lib/utils";
import { calculateBoardPosition } from "@/lib/board";

describe("project and task calculations", () => {
  it("calculates project progress", () => {
    expect(calculateProjectProgress([])).toBe(0);
    expect(
      calculateProjectProgress([
        { status: "DONE" },
        { status: "TODO" },
        { status: "DONE" },
      ]),
    ).toBe(67);
  });

  it("uses UTC calendar-day semantics for overdue tasks", () => {
    const now = new Date("2026-08-30T18:30:00.000Z");
    expect(startOfTodayUtc(now).toISOString()).toBe("2026-08-30T00:00:00.000Z");
    expect(isOverdue(new Date("2026-08-29T00:00:00.000Z"), "TODO", now)).toBe(
      true,
    );
    expect(isOverdue(new Date("2026-08-30T00:00:00.000Z"), "TODO", now)).toBe(
      false,
    );
    expect(isOverdue(new Date("2026-08-29T00:00:00.000Z"), "DONE", now)).toBe(
      false,
    );
  });

  it("calculates gapped board ranks", () => {
    expect(calculateBoardPosition(undefined, undefined)).toBe(1000);
    expect(calculateBoardPosition(1000, 3000)).toBe(2000);
    expect(calculateBoardPosition(1000, undefined)).toBe(2000);
    expect(calculateBoardPosition(undefined, 3000)).toBe(2000);
    expect(calculateBoardPosition(1000, 1001)).toBeNull();
  });
});
