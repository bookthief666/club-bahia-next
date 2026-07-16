'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { OperationsEvent } from '@/lib/admin/domain';
import { eventRepository } from '@/lib/admin/event-repository';
import { filterEventsForList } from '@/lib/admin/event-list-filters';
import { EventCard } from './EventCard';
import { EventFilters } from './EventFilters';

const IDEA_STUDIO_VISIBLE =
  process.env.NEXT_PUBLIC_EVENT_IDEA_STUDIO_ENABLED === 'true';

export function EventListClient() {
  const [events, setEvents] = useState<OperationsEvent[]>([]);
  const params = useSearchParams();

  useEffect(() => {
    eventRepository.listEvents().then(setEvents);
  }, []);

  const filtered = useMemo(
    () =>
      filterEventsForList(events, {
        q: params.get('q'),
        archive: params.get('archive'),
        status: params.get('status'),
        sort: params.get('sort'),
        date: params.get('date'),
        risk: params.get('risk'),
      }),
    [events, params],
  );

  const summary = useMemo(() => {
    const active = events.filter(
      (event) => !['completed', 'cancelled', 'archived'].includes(event.status),
    );
    const now = Date.now();
    return {
      active: active.length,
      upcoming: active.filter((event) => new Date(event.startsAt).getTime() >= now)
        .length,
      attention: active.filter((event) => event.riskFlags.length > 0).length,
    };
  }, [events]);

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[radial-gradient(circle_at_86%_8%,rgba(246,183,60,.23),transparent_23rem),radial-gradient(circle_at_5%_100%,rgba(18,120,106,.22),transparent_25rem),linear-gradient(135deg,rgba(15,18,16,.98),rgba(27,14,12,.96))] p-5 shadow-[0_28px_90px_rgba(0,0,0,.42)] sm:p-7">
        <div className="relative grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-2xl">
            <p className="text-[10px] font-semibold uppercase tracking-[.24em] text-emerald-200/70">
              Club Bahia Promotion Autopilot
            </p>
            <h1 className="mt-3 font-serif text-4xl text-white sm:text-5xl">
              What event are we promoting?
            </h1>
            <p className="mt-3 text-sm leading-6 text-white/58 sm:text-base">
              Enter the confirmed facts once. Then generate the captions, hashtags, flyer prompt, media package, tracked links, and publishing schedule from the same event record.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Link
                href="/admin/events/new"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-amber-300 px-6 text-sm font-bold text-black shadow-[0_12px_32px_rgba(246,183,60,.16)]"
              >
                Create event →
              </Link>
              <Link
                href="/admin/settings"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 bg-black/18 px-6 text-sm font-semibold text-white/72 transition hover:border-white/30 hover:text-white"
              >
                Publishing connections
              </Link>
              {IDEA_STUDIO_VISIBLE ? (
                <Link
                  href="/admin/events/ideas"
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/10 px-5 text-xs font-semibold text-white/45"
                >
                  Labs: Event Idea Studio
                </Link>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 lg:min-w-[22rem]">
            <div className="rounded-2xl border border-white/9 bg-black/22 p-3">
              <p className="text-[10px] uppercase tracking-[.14em] text-white/38">
                Active
              </p>
              <p className="mt-1 text-2xl font-semibold text-white">{summary.active}</p>
            </div>
            <div className="rounded-2xl border border-emerald-200/14 bg-emerald-200/[.06] p-3">
              <p className="text-[10px] uppercase tracking-[.14em] text-emerald-100/52">
                Upcoming
              </p>
              <p className="mt-1 text-2xl font-semibold text-emerald-100">
                {summary.upcoming}
              </p>
            </div>
            <div className="rounded-2xl border border-amber-200/14 bg-amber-200/[.06] p-3">
              <p className="text-[10px] uppercase tracking-[.14em] text-amber-100/52">
                Attention
              </p>
              <p className="mt-1 text-2xl font-semibold text-amber-100">
                {summary.attention}
              </p>
            </div>
          </div>
        </div>
      </section>

      <EventFilters />

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-white/38">
              Event promotion records
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-white">
              {filtered.length} event{filtered.length === 1 ? '' : 's'}
            </h2>
          </div>
          <p className="hidden text-xs text-white/38 sm:block">
            Open an event to prepare and publish its promotion.
          </p>
        </div>

        <div className="grid gap-4">
          {filtered.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
          {!filtered.length ? (
            <div className="rounded-[1.4rem] border border-dashed border-white/15 bg-black/15 p-8 text-center">
              <h3 className="text-xl font-semibold text-white">No matching events</h3>
              <p className="mt-2 text-sm text-white/50">
                Clear the filters or create the event you need to promote.
              </p>
              <Link
                href="/admin/events/new"
                className="mt-4 inline-flex min-h-11 items-center rounded-full bg-amber-300 px-5 text-sm font-bold text-black"
              >
                Create event
              </Link>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
