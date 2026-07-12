import Link from 'next/link';
import type { OperationsEvent } from '@/lib/admin/domain';
import { formatVenueDateTime } from '@/lib/admin/date';
import { StatusPill } from './StatusPill';

export function EventCard({ event }: { event: OperationsEvent }) {
  const fill = event.capacityTarget
    ? Math.round((event.ticketsSold / event.capacityTarget) * 100)
    : 0;

  return (
    <article className="rounded-2xl border border-white/10 bg-[#141210]/75 p-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
        <Link
          href={`/admin/events/${event.id}`}
          className="min-w-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-amber-200/60"
        >
          <h3 className="truncate text-base font-semibold text-white">{event.title}</h3>
          <p className="mt-1 text-xs text-white/60">
            {formatVenueDateTime(event.startsAt)} · {event.room} · {event.ticketsSold}/
            {event.capacityTarget} ({fill}%)
          </p>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/admin/events/${event.id}/growth`}
            className="min-h-9 rounded-full border border-amber-200/25 bg-amber-200/10 px-3 py-2 text-xs font-semibold text-amber-100"
          >
            Growth
          </Link>
          <Link
            href={`/admin/events/${event.id}/assets`}
            className="min-h-9 rounded-full border border-violet-200/20 bg-violet-200/8 px-3 py-2 text-xs font-semibold text-violet-100"
          >
            Media
          </Link>
          <StatusPill status={event.status} />
          {event.riskFlags.length ? (
            <span className="rounded-full bg-amber-200/10 px-2 py-1 text-xs text-amber-100">
              ⚠ Action
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
