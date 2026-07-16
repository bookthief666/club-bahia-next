import { describe, expect, it } from "vitest";
import { formatVenueDateTime, formatVenueTime } from "../lib/admin/date";

describe("venue-local display formatting", () => {
  it("formats dashboard/list/detail/calendar timestamps in America/Los_Angeles without seconds", () => {
    expect(formatVenueDateTime("2026-08-09T04:00:00.000Z")).toBe("Sat Aug 8, 9:00 PM");
    expect(formatVenueTime("2026-08-09T06:30:00.000Z")).toBe("11:30 PM");
  });
});
