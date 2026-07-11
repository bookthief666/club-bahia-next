import { describe, expect, it } from "vitest";
import { addDays, addMonthsClamped } from "../lib/admin/date";

function move(anchor: string, view: "month" | "week" | "agenda", dir: number) {
  if (view === "month") return addMonthsClamped(anchor as any, dir);
  return addDays(anchor as any, dir * (view === "week" ? 7 : 14));
}

describe("calendar navigation", () => {
  it("moves week and agenda views by their configured windows", () => {
    expect(move("2026-12-29", "week", 1)).toBe("2027-01-05");
    expect(move("2026-12-20", "agenda", 1)).toBe("2027-01-03");
  });

  it("clamps January 31 to February 28 in a non-leap year", () => {
    expect(move("2026-01-31", "month", 1)).toBe("2026-02-28");
  });

  it("clamps January 31 to February 29 in a leap year", () => {
    expect(move("2024-01-31", "month", 1)).toBe("2024-02-29");
  });

  it("clamps March 31 back to February", () => {
    expect(move("2026-03-31", "month", -1)).toBe("2026-02-28");
  });

  it("preserves day semantics across the December to January year boundary", () => {
    expect(move("2026-12-31", "month", 1)).toBe("2027-01-31");
  });
});
