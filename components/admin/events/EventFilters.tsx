'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const labels: Record<string, string> = {
  archive: 'Records',
  status: 'Status',
  sort: 'Sort',
  date: 'Date',
  risk: 'Attention',
  q: 'Search',
};

export function EventFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);

  function update(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    const query = next.toString();
    router.push(query ? `/admin/events?${query}` : '/admin/events');
  }

  const active = Array.from(params.entries()).filter(([, value]) => value);

  return (
    <section className="rounded-[1.35rem] border border-white/10 bg-[linear-gradient(145deg,rgba(15,17,15,.9),rgba(18,14,12,.92))] p-3 shadow-[0_16px_50px_rgba(0,0,0,.22)] sm:p-4">
      <div className="flex gap-2">
        <label className="min-w-0 flex-1">
          <span className="sr-only">Search events</span>
          <input
            aria-label="Search events"
            placeholder="Search by event name or concept…"
            className="min-h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-amber-200/40"
            defaultValue={params.get('q') ?? ''}
            onChange={(event) => update('q', event.target.value)}
          />
        </label>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="min-h-12 rounded-xl border border-white/15 bg-white/[.035] px-4 text-sm font-semibold text-white/72"
        >
          {open ? 'Hide filters' : 'Filters'}
        </button>
      </div>

      {active.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {active.map(([key, value]) => (
            <button
              key={key}
              type="button"
              onClick={() => update(key, '')}
              className="rounded-full border border-amber-200/15 bg-amber-200/[.07] px-3 py-1.5 text-xs text-amber-100"
            >
              {labels[key] ?? key}: {value} ×
            </button>
          ))}
          <button
            type="button"
            onClick={() => router.push('/admin/events')}
            className="rounded-full px-3 py-1.5 text-xs font-semibold text-white/48 underline decoration-white/20 underline-offset-4"
          >
            Clear all
          </button>
        </div>
      ) : null}

      <div className={`${open ? 'grid' : 'hidden sm:grid'} mt-3 gap-3 sm:grid-cols-3`}>
        <label className="text-xs font-medium text-white/45">
          Show
          <select
            aria-label="Archive filter"
            className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white"
            value={params.get('archive') ?? 'active'}
            onChange={(event) => update('archive', event.target.value)}
          >
            <option className="bg-black" value="active">Active events</option>
            <option className="bg-black" value="archived">Archived events</option>
            <option className="bg-black" value="all">All records</option>
          </select>
        </label>

        <label className="text-xs font-medium text-white/45">
          Status
          <select
            aria-label="Status"
            className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white"
            value={params.get('status') ?? ''}
            onChange={(event) => update('status', event.target.value)}
          >
            <option className="bg-black" value="">All active statuses</option>
            <option className="bg-black" value="final-prep">Final preparation</option>
            <option className="bg-black" value="live">Live now</option>
            <option className="bg-black" value="cancelled">Cancelled</option>
          </select>
        </label>

        <label className="text-xs font-medium text-white/45">
          Order by
          <select
            aria-label="Sort"
            className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white"
            value={params.get('sort') ?? 'date'}
            onChange={(event) => update('sort', event.target.value)}
          >
            <option className="bg-black" value="date">Event date</option>
            <option className="bg-black" value="title">Event name</option>
            <option className="bg-black" value="risk">Needs attention first</option>
          </select>
        </label>
      </div>
    </section>
  );
}
