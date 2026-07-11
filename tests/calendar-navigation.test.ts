import { describe, expect, it } from "vitest";
import { addDays } from "../lib/admin/date";
function move(anchor: string, view: "month" | "week" | "agenda", dir: number) {
  if (view === "month") {
    const d = new Date(`${anchor}T12:00:00Z`);
    d.setUTCMonth(d.getUTCMonth() + dir);
    return d.toISOString().slice(0, 10);
  }
  return addDays(anchor as any, dir * (view === "week" ? 7 : 14));
}
describe("calendar navigation", () => {
  it("moves by view and preserves boundaries", () => {
    expect(move("2026-01-31", "month", 1)).toMatch(/^2026-0[23]-/);
    expect(move("2026-12-29", "week", 1)).toBe("2027-01-05");
    expect(move("2026-12-20", "agenda", 1)).toBe("2027-01-03");
  });
});
