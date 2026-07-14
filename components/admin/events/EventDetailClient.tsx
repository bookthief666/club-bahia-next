'use client';

import { useEffect, useState } from 'react';
import type { OperationsEvent } from '@/lib/admin/domain';
import { EVENT_IDEA_CONFIDENCE_LABELS } from '@/lib/admin/event-ideas/domain';
import { eventRepository } from '@/lib/admin/event-repository';
import { formatVenueDateTime, formatVenueTime } from '@/lib/admin/date';
import { StatusPill } from './StatusPill';
import { EventActions } from './EventActions';

function PlanList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-white/38">
        {title}
      </p>
      <ul className="mt-2 space-y-2 text-sm leading-6 text-white/58">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-200/60" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Fact({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-black/15 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-white/38">
        {label}
      </p>
      <p className={`mt-2 text-sm leading-6 ${value ? 'text-white/68' : 'text-amber-100/55'}`}>
        {value || 'Still needed before automatic publishing'}
      </p>
    </div>
  );
}

export function EventDetailClient({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState<OperationsEvent | null | undefined>();

  useEffect(() => {
    eventRepository.getEvent(eventId).then(setEvent);
  }, [eventId]);

  if (event === undefined) {
    return <p className="rounded-3xl border border-white/10 p-6">Loading event…</p>;
  }

  if (event === null) {
    return (
      <div className="rounded-3xl border border-amber-200/20 p-6">
        <h1 className="font-serif text-3xl">Event not found</h1>
        <p className="mt-2 text-white/65">
          This event may have been deleted or changed in another browser. Reload the event list and try again.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-white/10 bg-[#141210]/75 p-4">
        <StatusPill status={event.status} />
        <h1 className="mt-3 font-serif text-3xl">{event.title}</h1>
        <p className="mt-2 text-white/70">
          {formatVenueDateTime(event.startsAt)} – {formatVenueTime(event.endsAt)} · {event.room}
        </p>
        <p className="mt-4 max-w-3xl whitespace-pre-line text-white/75">
          {event.concept}
        </p>
      </div>

      <section className="rounded-[1.5rem] border border-white/10 bg-[#12110f]/82 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-emerald-100/60">
              Promotion source of truth
            </p>
            <h2 className="mt-1 font-serif text-2xl text-white">Confirmed event facts</h2>
          </div>
          <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[.12em] text-white/45">
            Used across every channel
          </span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Fact label="Performers" value={event.performers} />
          <Fact label="Music or style" value={event.genres} />
          <Fact label="Admission" value={event.admission} />
          <Fact label="Age policy" value={event.ageRestriction} />
          <Fact label="Reservation or ticket link" value={event.reservationUrl} />
          <Fact label="Primary flyer or media" value={event.flyerUrl} />
        </div>
      </section>

      {event.ideaPlan ? (
        <details className="rounded-[1.5rem] border border-white/8 bg-white/[.025] p-4 sm:p-5">
          <summary className="cursor-pointer text-sm font-semibold text-white/55">
            Earlier experimental event-development notes
          </summary>
          <div className="mt-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-white/38">
                  Labs archive
                </p>
                <h2 className="mt-1 font-serif text-2xl text-white/80">
                  Saved Idea Studio plan
                </h2>
              </div>
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[.12em] text-white/45">
                {EVENT_IDEA_CONFIDENCE_LABELS[event.ideaPlan.confidence]}
              </span>
            </div>

            <p className="mt-4 text-sm leading-7 text-white/52">
              {event.ideaPlan.fitRationale}
            </p>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <PlanList title="People needed" items={event.ideaPlan.talentRequirements} />
              <PlanList title="Venue setup" items={event.ideaPlan.operationalRequirements} />
              <PlanList title="Known risks" items={event.ideaPlan.risks} />
              <PlanList title="Questions to answer" items={event.ideaPlan.openQuestions} />
            </div>
          </div>
        </details>
      ) : null}

      <EventActions event={event} />
    </div>
  );
}
