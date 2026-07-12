'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { OperationsEvent } from '@/lib/admin/domain';
import { eventRepository } from '@/lib/admin/event-repository';
import { filterEventsForList } from '@/lib/admin/event-list-filters';
import { EventCard } from './EventCard';
import { EventFilters } from './EventFilters';

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
              Club Bahia Growth OS
            </p>
            <h1 className="mt-3 font-serif text-4xl text-white sm:text-5xl">
              Plan the night. Build the crowd.
            </h1>
            <p className="mt-3 text-sm leading-6 text-white/58 sm:text-base">
              Choose an event to create its campaign, add the final flyer and Reel, prepare every post, and track what gets published.
            </p>
            <Link
              href="/admin/events/new"
              className="mt-5 inline-flex min-h-12 items-center rounded-full bg-amber-300 px-6 text-sm font-bold text-black shadow-[0_12px_32px_rgba(246,183,60,.16)]"
            >
              Create a new event →
            </Link>
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
              Event workspace
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-white">
              {filtered.length} event{filtered.length === 1 ? '' : 's'}
            </h2>
          </div>
          <p className="hidden text-xs text-white/38 sm:block">
            Open an event to follow its five campaign steps.
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
                Clear the filters or create a new event.
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
