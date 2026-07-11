"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { OperationsEvent } from "@/lib/admin/domain";
import {
  addDays,
  addMonthsClamped,
  eventLocalDate,
  getVenueToday,
  type LocalDate,
} from "@/lib/admin/date";
import { eventRepository } from "@/lib/admin/event-repository";
import { StatusPill } from "./StatusPill";
type View = "month" | "week" | "agenda";
export function EventCalendarClient() {
  const [events, setEvents] = useState<OperationsEvent[]>([]);
  const [view, setView] = useState<View>("month");
  const [anchor, setAnchor] = useState<LocalDate>(getVenueToday());
  useEffect(() => {
    eventRepository.listEvents().then(setEvents);
  }, []);
  function move(dir: number) {
    if (view === "month") setAnchor(addMonthsClamped(anchor, dir));
    else setAnchor(addDays(anchor, dir * (view === "week" ? 7 : 14)));
  }
  const visible = useMemo(
    () =>
      events.filter(
        (e) =>
          Math.abs(
            (new Date(eventLocalDate(e.startsAt)).getTime() -
              new Date(anchor).getTime()) /
              86400000,
          ) < (view === "month" ? 45 : view === "week" ? 8 : 30),
      ),
    [events, anchor, view],
  );
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-4xl">Calendar</h1>
        <div className="flex gap-2">
          <button
            onClick={() => move(-1)}
            className="rounded-full border px-3 py-2"
          >
            Previous
          </button>
          <button
            onClick={() => setAnchor(getVenueToday())}
            className="rounded-full bg-amber-300 px-3 py-2 text-black"
          >
            Today
          </button>
          <button
            onClick={() => move(1)}
            className="rounded-full border px-3 py-2"
          >
            Next
          </button>
          <select
            value={view}
            onChange={(e) => setView(e.target.value as View)}
            className="rounded-full bg-white/10 px-3"
          >
            <option className="bg-black" value="month">
              Month
            </option>
            <option className="bg-black" value="week">
              Week
            </option>
            <option className="bg-black" value="agenda">
              Agenda
            </option>
          </select>
        </div>
      </div>
      <p className="text-sm text-white/65">
        Anchor: {anchor}. Month navigation moves one month; week moves seven
        days; agenda moves two-week windows.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((e) => (
          <Link
            key={e.id}
            href={`/admin/events/${e.id}`}
            className={`rounded-3xl border p-4 ${eventLocalDate(e.startsAt).slice(0, 7) === anchor.slice(0, 7) ? "border-white/10 bg-white/[.05]" : "border-dashed border-white/10 bg-black/20 opacity-70"}`}
          >
            <StatusPill status={e.status} />
            <h2 className="mt-2 font-serif text-2xl">{e.title}</h2>
            <p className="text-sm text-white/65">
              {eventLocalDate(e.startsAt)}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
