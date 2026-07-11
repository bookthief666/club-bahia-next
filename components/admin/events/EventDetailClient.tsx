"use client";
import { useEffect, useState } from "react";
import type { OperationsEvent } from "@/lib/admin/domain";
import { eventRepository } from "@/lib/admin/event-repository";
import { formatVenueDateTime, formatVenueTime } from "@/lib/admin/date";
import { StatusPill } from "./StatusPill";
import { EventActions } from "./EventActions";
export function EventDetailClient({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState<OperationsEvent | null | undefined>();
  useEffect(() => {
    eventRepository.getEvent(eventId).then(setEvent);
  }, [eventId]);
  if (event === undefined)
    return (
      <p className="rounded-3xl border border-white/10 p-6">
        Loading event…
      </p>
    );
  if (event === null)
    return (
      <div className="rounded-3xl border border-amber-200/20 p-6">
        <h1 className="font-serif text-3xl">
          Event not found in browser fixture store
        </h1>
        <p className="mt-2 text-white/65">
          This development-only record may have been deleted or created in
          another browser profile.
        </p>
      </div>
    );
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-white/10 bg-[#141210]/75 p-4">
        <StatusPill status={event.status} />
        <h1 className="mt-3 font-serif text-3xl">{event.title}</h1>
        <p className="mt-2 text-white/70">
          {formatVenueDateTime(event.startsAt)} – {formatVenueTime(event.endsAt)} · {event.room}
        </p>
        <p className="mt-4 max-w-2xl text-white/75">{event.concept}</p>
      </div>
      <EventActions event={event} />
    </div>
  );
}
