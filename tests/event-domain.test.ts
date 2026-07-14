import { describe, expect, it, beforeEach, vi } from "vitest";
import { getVenueToday } from "../lib/admin/date";
import { BrowserFixtureEventRepository } from "../lib/admin/event-repository";
import { assertValidTransition } from "../lib/admin/event-status";
import { commandCenterFixture } from "../lib/admin/fixtures";
import {
  getEventsThisWeek,
  getNeedsStaffingEvents,
  getUpcomingEvents,
} from "../lib/admin/selectors";

describe("venue date and selectors", () => {
  it("calculates today in Los Angeles", () =>
    expect(getVenueToday(new Date("2026-01-01T07:30:00Z"))).toBe("2025-12-31"));
  it("uses injected deterministic dates in selectors", () =>
    expect(
      getUpcomingEvents(commandCenterFixture, new Date("2026-08-08T12:00:00Z"))
        .length,
    ).toBeGreaterThan(0));
  it("has no blocked hardcoded current dates in fixture", () => {
    expect(JSON.stringify(commandCenterFixture)).not.toContain(
      ["2026", "07", "11"].join("-"),
    );
    expect(JSON.stringify(commandCenterFixture)).not.toContain(
      ["2026", "07", "18"].join("-"),
    );
  });
  it("returns dashboard queues from domain selectors", () => {
    expect(
      getEventsThisWeek(commandCenterFixture, new Date("2026-08-08T12:00:00Z"))
        .length,
    ).toBeGreaterThan(0);
    expect(
      getNeedsStaffingEvents(commandCenterFixture).map((e) => e.id),
    ).toContain("evt-sabado-caliente");
  });
});

describe("status transitions", () => {
  const event = commandCenterFixture.events[0];
  it("rejects invalid transitions", () =>
    expect(() => assertValidTransition(event, "reviewed")).toThrow(
      /Cannot move/,
    ));
  it("requires cancellation reason", () =>
    expect(() => assertValidTransition(event, "cancelled")).toThrow(/reason/));
  it("restricts live to venue-local event date", () =>
    expect(() =>
      assertValidTransition(event, "live", {
        now: new Date("2026-08-09T12:00:00Z"),
      }),
    ).toThrow(/Los Angeles/));
});

describe("browser fixture repository", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => {
        store.clear();
      },
    });
  });
  it("supports create navigate read, update reread, duplicate, archive, restore, and delete", async () => {
    const repo = new BrowserFixtureEventRepository();
    const created = await repo.createEvent({
      title: "Dev Night",
      concept: "Test",
      date: "2026-09-01",
      room: "Main",
      owner: "QA",
    });
    expect(await repo.getEvent(created.id)).toMatchObject({
      title: "Dev Night",
    });
    await repo.updateEvent(created.id, { title: "Updated Night" });
    expect(await repo.getEvent(created.id)).toMatchObject({
      title: "Updated Night",
    });
    const copy = await repo.duplicateEvent(created.id, {
      title: "Copy Night",
      date: "2026-09-08",
    });
    expect(copy.id).not.toBe(created.id);
    expect(copy.startsAt).not.toBe(created.startsAt);
    expect(copy.status).toBe("idea");
    await repo.archiveEvent(created.id);
    expect((await repo.getEvent(created.id))?.status).toBe("archived");
    await repo.restoreEvent(created.id, "evaluating");
    expect((await repo.getEvent(created.id))?.status).toBe("evaluating");
    await repo.deleteEvent(created.id);
    expect(await repo.getEvent(created.id)).toBeNull();
  });
});

describe("venue-local date conversion", () => {
  function venueWallClock(date: Date) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Los_Angeles",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(date);
    const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value;
    return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}`;
  }

  it("uses standard-time offset for winter Los Angeles events", async () => {
    const { localDateToVenueDate } = await import("../lib/admin/date");
    expect(localDateToVenueDate("2026-01-15", 21).toISOString()).toBe("2026-01-16T05:00:00.000Z");
  });

  it("uses daylight-time offset for summer Los Angeles events", async () => {
    const { localDateToVenueDate } = await import("../lib/admin/date");
    expect(localDateToVenueDate("2026-07-15", 21).toISOString()).toBe("2026-07-16T04:00:00.000Z");
  });

  it("round-trips the requested venue-local date and wall-clock time", async () => {
    const { localDateToVenueDate, eventLocalDate } = await import("../lib/admin/date");
    const instant = localDateToVenueDate("2026-11-01", 1, 30);
    expect(eventLocalDate(instant.toISOString())).toBe("2026-11-01");
    expect(venueWallClock(instant)).toBe("2026-11-01 01:30");
  });
});

describe("repository status edge cases", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => {
        store.clear();
      },
    });
  });

  it("preserves a cancellation reason when restoring cancelled archived events", async () => {
    const repo = new BrowserFixtureEventRepository();
    const created = await repo.createEvent({
      title: "Cancelled Hold",
      concept: "Weather hold",
      date: "2026-09-01",
      room: "Main",
      owner: "QA",
    });
    await repo.updateEvent(created.id, { status: "cancelled", cancellationReason: "Artist travel cancelled" });
    await repo.archiveEvent(created.id);
    const restored = await repo.restoreEvent(created.id);
    expect(restored.status).toBe("cancelled");
    expect(restored.cancellationReason).toBe("Artist travel cancelled");
  });

  it("validates live status against the candidate edited date", async () => {
    const repo = new BrowserFixtureEventRepository();
    await expect(
      repo.updateEvent(
        "evt-sabado-caliente",
        { date: "2026-08-09", status: "live" },
        { now: new Date("2026-08-09T01:00:00.000Z") },
      ),
    ).rejects.toThrow(/Los Angeles/);
  });

  it("allows live when the submitted date and time match the current venue date", async () => {
    const repo = new BrowserFixtureEventRepository();
    const live = await repo.updateEvent(
      "evt-sabado-caliente",
      { date: "2026-08-08", startTime: "21:00", status: "live" },
      { now: new Date("2026-08-09T01:00:00.000Z") },
    );
    expect(live.status).toBe("live");
    expect(live.startsAt).toBe("2026-08-09T04:00:00.000Z");
  });
});
