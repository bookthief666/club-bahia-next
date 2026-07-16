'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { OperationsEvent } from '@/lib/admin/domain';
import { eventRepository } from '@/lib/admin/event-repository';
import { EventAssetStudioClient } from './EventAssetStudioClient';
import { EventMediaRecommendationsClient } from './EventMediaRecommendationsClient';
import { MediaSessionLockBridge } from './MediaSessionLockBridge';
import { VerticalVideoStudioClient } from './VerticalVideoStudioClient';

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
      <MediaSessionLockBridge />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Link
          href={`/admin/events/${event.id}`}
          className="inline-flex min-h-10 items-center rounded-full border border-white/15 px-4 text-xs font-semibold text-white/68"
        >
          ← Back to event
        </Link>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/media"
            className="inline-flex min-h-10 items-center rounded-full border border-white/12 px-4 text-xs font-semibold text-white/52"
          >
            Media library
          </Link>
          <Link
            href={`/admin/events/${event.id}/publishing`}
            className="inline-flex min-h-11 items-center rounded-full border border-emerald-200/25 bg-emerald-200/10 px-5 text-sm font-bold text-emerald-100"
          >
            Next: Prepare posts →
          </Link>
        </div>
      </div>

      <section className="mb-5 rounded-2xl border border-emerald-200/12 bg-emerald-200/[.045] p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-emerald-100/60">
          Fast media path
        </p>
        <p className="mt-2 text-sm leading-6 text-white/52">
          Use a recommended approved asset or upload one strong photo or finished vertical video. Custom crops, branded graphics, and multi-clip editing are optional production tools—not requirements for every event.
        </p>
      </section>

      <EventMediaRecommendationsClient event={event} />
      <EventAssetStudioClient eventId={event.id} eventTitle={event.title} />

      <details className="group mt-5 rounded-[1.45rem] border border-white/9 bg-white/[.025] p-4 sm:p-5">
        <summary className="cursor-pointer list-none">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-white/38">
                Advanced production tool
              </p>
              <h2 className="mt-1 font-serif text-2xl text-white/82">
                Build a custom 15-second video sequence
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
                Use this only when no approved finished vertical video is available. It creates and approves an edit recipe; it does not render or publish an MP4.
              </p>
            </div>
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-white/48 group-open:text-amber-100">
              <span className="group-open:hidden">Open editor</span>
              <span className="hidden group-open:inline">Close editor</span>
            </span>
          </div>
        </summary>
        <div className="mt-5 border-t border-white/8 pt-5">
          <VerticalVideoStudioClient event={event} />
        </div>
      </details>
    </>
  );
}
