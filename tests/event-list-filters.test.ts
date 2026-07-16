import { describe, expect, it } from "vitest";
import { filterEventsForList } from "../lib/admin/event-list-filters";
import { commandCenterFixture } from "../lib/admin/fixtures";

const now = new Date(commandCenterFixture.generatedAt);
const ids = (query: Parameters<typeof filterEventsForList>[1]) =>
  filterEventsForList(commandCenterFixture.events, query, now).map((event) => event.id);

describe("event list dashboard drill-down filters", () => {
  it("applies the this-week dashboard query", () => {
    expect(ids({ date: "this-week" })).toEqual(["evt-sabado-caliente", "evt-domingo-live", "evt-cumbia-friday"]);
  });

  it("applies the needs-promotion dashboard query", () => {
    expect(ids({ risk: "promotion" })).toEqual(["evt-domingo-live", "evt-cumbia-friday"]);
  });

  it("applies the needs-staffing dashboard query", () => {
    expect(ids({ risk: "staffing" })).toEqual(["evt-sabado-caliente", "evt-private-quince"]);
  });

  it("applies the past-due dashboard query", () => {
    expect(ids({ risk: "past-due" })).toEqual([]);
  });

  it("preserves archive, status, search, and sorting filters", () => {
    expect(ids({ q: "cumbia", archive: "all", sort: "title" })).toEqual(["evt-cumbia-friday"]);
    expect(ids({ status: "on-sale" })).toEqual(["evt-cumbia-friday"]);
  });
});
