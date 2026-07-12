'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { OperationsEvent } from '@/lib/admin/domain';
import { eventRepository } from '@/lib/admin/event-repository';
import { EventAssetStudioClient } from './EventAssetStudioClient';

export function EventAssetStudioPageClient({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState<OperationsEvent | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    eventRepository.getEvent(eventId).then((nextEvent) => {
      if (active) setEvent(nextEvent);
    });
    return () => {
      active = false;
    };
  }, [eventId]);

  if (event === undefined) {
    return (
      <div className="rounded-2xl border border-white/10 p-5 text-white/60">
        Loading event media…
      </div>
    );
  }

  if (event === null) {
    return (
      <div className="rounded-2xl border border-red-200/20 bg-red-200/[.06] p-5">
        <h1 className="text-xl font-semibold text-white">Event not found</h1>
        <p className="mt-2 text-sm text-white/55">
          This event is unavailable in the current workspace.
        </p>
        <Link
          href="/admin/events"
          className="mt-4 inline-flex min-h-11 items-center rounded-full bg-amber-300 px-5 text-sm font-bold text-black"
        >
          Return to events
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Link
          href={`/admin/events/${event.id}`}
          className="inline-flex min-h-10 items-center rounded-full border border-white/15 px-4 text-xs font-semibold text-white/68"
        >
          ← Back to event
        </Link>
        <Link
          href={`/admin/events/${event.id}/publishing`}
          className="inline-flex min-h-11 items-center rounded-full border border-emerald-200/25 bg-emerald-200/10 px-5 text-sm font-bold text-emerald-100"
        >
          Next: Prepare posts →
        </Link>
      </div>
      <EventAssetStudioClient eventId={event.id} eventTitle={event.title} />
    </>
  );
}
