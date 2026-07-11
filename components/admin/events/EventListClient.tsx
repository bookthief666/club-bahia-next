"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { OperationsEvent } from "@/lib/admin/domain";
import { eventRepository } from "@/lib/admin/event-repository";
import { filterEventsForList } from "@/lib/admin/event-list-filters";
import { EventCard } from "./EventCard";
import { EventFilters } from "./EventFilters";
export function EventListClient() {
  const [events, setEvents] = useState<OperationsEvent[]>([]);
  const params = useSearchParams();
  useEffect(() => {
    eventRepository.listEvents().then(setEvents);
  }, []);
  const filtered = useMemo(() => {
    return filterEventsForList(events, {
      q: params.get("q"),
      archive: params.get("archive"),
      status: params.get("status"),
      sort: params.get("sort"),
      date: params.get("date"),
      risk: params.get("risk"),
    });
  }, [events, params]);
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[.3em] text-amber-200/70">
            Development fixture mode
          </p>
          <h1 className="font-serif text-4xl">Events</h1>
        </div>
        <Link
          href="/admin/events/new"
          className="rounded-full bg-red-600 px-4 py-3 text-sm font-bold"
        >
          New event
        </Link>
      </div>
      <EventFilters />
      <div className="grid gap-4">
        {filtered.map((e) => (
          <EventCard key={e.id} event={e} />
        ))}
        {filtered.length === 0 && (
          <p className="rounded-3xl border border-white/10 p-6 text-white/65">
            No events match these filters.
          </p>
        )}
      </div>
    </div>
  );
}
