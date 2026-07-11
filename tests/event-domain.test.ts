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
