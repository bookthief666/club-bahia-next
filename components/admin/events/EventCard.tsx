import Link from 'next/link';
import type { OperationsEvent } from '@/lib/admin/domain';
import { formatVenueDateTime } from '@/lib/admin/date';
import { StatusPill } from './StatusPill';

export function EventCard({ event }: { event: OperationsEvent }) {
  const fill = event.capacityTarget
    ? Math.min(100, Math.round((event.ticketsSold / event.capacityTarget) * 100))
    : 0;
  const needsAttention = event.riskFlags.length > 0;

  return (
    <article className="overflow-hidden rounded-[1.45rem] border border-white/10 bg-[linear-gradient(145deg,rgba(18,20,17,.92),rgba(19,14,12,.95))] shadow-[0_20px_60px_rgba(0,0,0,.25)]">
      <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={event.status} />
            {needsAttention ? (
              <span className="rounded-full border border-amber-200/20 bg-amber-200/10 px-3 py-1 text-[11px] font-semibold text-amber-100">
                Needs attention
              </span>
            ) : (
              <span className="rounded-full border border-emerald-200/15 bg-emerald-200/[.06] px-3 py-1 text-[11px] font-semibold text-emerald-100/75">
                On track
              </span>
            )}
          </div>

          <Link
            href={`/admin/events/${event.id}`}
            className="mt-3 block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-amber-200/60"
          >
            <h3 className="truncate font-serif text-2xl text-white sm:text-3xl">
              {event.title}
            </h3>
            <p className="mt-2 text-sm text-white/55">
              {formatVenueDateTime(event.startsAt)} · {event.room}
            </p>
            {event.concept ? (
              <p className="mt-2 line-clamp-2 max-w-2xl text-sm leading-6 text-white/42">
                {event.concept}
              </p>
            ) : null}
          </Link>

          <div className="mt-4 max-w-2xl">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="text-white/48">Current attendance / sales progress</span>
              <span className="font-semibold text-white/72">
                {event.ticketsSold}/{event.capacityTarget} · {fill}%
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/8">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#34d399,#f6b73c,#e1121b)]"
                style={{ width: `${fill}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 lg:max-w-[20rem] lg:justify-end">
          <Link
            href={`/admin/events/${event.id}`}
            className="inline-flex min-h-11 items-center rounded-full bg-amber-300 px-5 text-sm font-bold text-black"
          >
            Open event
          </Link>
          <Link
            href={`/admin/events/${event.id}/growth`}
            className="inline-flex min-h-11 items-center rounded-full border border-amber-200/20 bg-amber-200/[.07] px-4 text-sm font-semibold text-amber-100"
          >
            Campaign
          </Link>
          <Link
            href={`/admin/events/${event.id}/assets`}
            className="inline-flex min-h-11 items-center rounded-full border border-violet-200/18 bg-violet-200/[.06] px-4 text-sm font-semibold text-violet-100"
          >
            Media
          </Link>
          <Link
            href={`/admin/events/${event.id}/publishing`}
            className="inline-flex min-h-11 items-center rounded-full border border-emerald-200/18 bg-emerald-200/[.06] px-4 text-sm font-semibold text-emerald-100"
          >
            Prepare posts
          </Link>
        </div>
      </div>
    </article>
  );
}
