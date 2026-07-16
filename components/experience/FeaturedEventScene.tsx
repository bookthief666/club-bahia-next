'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { trackedReservationHref } from '@/lib/attribution/domain';
import type { PublicEventCard } from '@/lib/public-events/domain';

export function FeaturedEventScene({ event }: { event: PublicEventCard }) {
  const reduceMotion = useReducedMotion();
  const reservationHref = trackedReservationHref({
    eventSlug: event.slug,
    campaign: event.slug,
    content: 'homepage-featured-event',
  });

  return (
    <section
      id="next-event"
      className="relative isolate overflow-hidden border-y border-amber-100/10 bg-[#070504] px-4 py-16 sm:px-6 sm:py-24 lg:px-8"
      aria-labelledby="featured-event-title"
    >
      {event.imageUrl ? (
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-20 bg-cover bg-center opacity-24 saturate-125"
          style={{ backgroundImage: `url(${JSON.stringify(event.imageUrl)})` }}
        />
      ) : null}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(5,3,4,.98),rgba(5,3,4,.72)_52%,rgba(5,3,4,.96)),radial-gradient(circle_at_12%_20%,rgba(225,18,27,.28),transparent_30%),radial-gradient(circle_at_84%_12%,rgba(16,185,129,.18),transparent_25%),linear-gradient(180deg,rgba(5,3,4,.42),#070504_88%)]"
      />

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 28 }}
        whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[1.05fr_.95fr] lg:items-stretch"
      >
        <div className="relative min-h-[24rem] overflow-hidden rounded-[1.8rem] border border-amber-100/15 bg-black/40 shadow-[0_30px_100px_rgba(0,0,0,.5)] sm:min-h-[34rem]">
          {event.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={event.imageUrl}
              alt={event.imageAlt}
              className="absolute inset-0 h-full w-full object-cover saturate-125"
            />
          ) : null}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_40%,rgba(5,3,4,.9)),radial-gradient(circle_at_75%_15%,rgba(16,185,129,.18),transparent_28%)]" />
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
            <div className="flex flex-wrap gap-2 text-[0.62rem] uppercase tracking-[0.17em] text-amber-100/78 sm:text-xs">
              <span className="rounded-full border border-emerald-200/25 bg-emerald-300/10 px-3 py-1.5 text-emerald-100 backdrop-blur">
                {event.status}
              </span>
              <span className="rounded-full border border-amber-100/20 bg-black/25 px-3 py-1.5 backdrop-blur">
                {event.category}
              </span>
              {event.ageRestriction ? (
                <span className="rounded-full border border-red-200/22 bg-red-600/12 px-3 py-1.5 text-red-100 backdrop-blur">
                  {event.ageRestriction}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center rounded-[1.8rem] border border-amber-100/12 bg-[linear-gradient(145deg,rgba(18,7,7,.92),rgba(8,20,16,.86))] p-5 shadow-[0_28px_90px_rgba(0,0,0,.36)] backdrop-blur sm:p-8 lg:p-10">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-emerald-200 sm:text-xs sm:tracking-[0.4em]">
            Next at Club Bahia
          </p>
          <h2
            id="featured-event-title"
            className="bahia-display-serif mt-4 text-[clamp(3.4rem,13vw,7.5rem)] font-semibold leading-[0.84] tracking-[-0.055em] text-amber-50 drop-shadow-[0_0_32px_rgba(225,18,27,.32)]"
          >
            {event.title}
          </h2>

          <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-2xl border border-amber-100/10 bg-black/20 p-4">
              <dt className="text-[0.6rem] uppercase tracking-[0.2em] text-amber-200/55">
                Date
              </dt>
              <dd className="mt-2 text-amber-50">{event.dateLabel}</dd>
            </div>
            <div className="rounded-2xl border border-amber-100/10 bg-black/20 p-4">
              <dt className="text-[0.6rem] uppercase tracking-[0.2em] text-amber-200/55">
                Time
              </dt>
              <dd className="mt-2 text-amber-50">{event.timeLabel}</dd>
            </div>
            {event.admission ? (
              <div className="rounded-2xl border border-amber-100/10 bg-black/20 p-4">
                <dt className="text-[0.6rem] uppercase tracking-[0.2em] text-amber-200/55">
                  Admission
                </dt>
                <dd className="mt-2 text-amber-50">{event.admission}</dd>
              </div>
            ) : null}
            <div className="rounded-2xl border border-amber-100/10 bg-black/20 p-4">
              <dt className="text-[0.6rem] uppercase tracking-[0.2em] text-amber-200/55">
                Location
              </dt>
              <dd className="mt-2 text-amber-50">
                {event.room || 'Club Bahia'} · Sunset Blvd
              </dd>
            </div>
          </dl>

          <p className="mt-6 text-base leading-8 text-amber-50/70">
            {event.summary}
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <Link
              href={`/events/${event.slug}`}
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-amber-100/24 px-5 text-xs font-semibold uppercase tracking-[0.18em] text-amber-100 transition hover:border-amber-100/60 hover:bg-amber-100/8 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              See Event Details
            </Link>
            {event.ticketUrl ? (
              <a
                href={event.ticketUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-red-600 px-5 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-[0_0_28px_rgba(225,18,27,.3)] transition hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-400"
              >
                Buy Tickets
              </a>
            ) : (
              <Link
                href={reservationHref}
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-red-600 px-5 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-[0_0_28px_rgba(225,18,27,.3)] transition hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-400"
              >
                Request Reservation
              </Link>
            )}
          </div>
          <Link
            href="/events"
            className="mt-5 text-center text-[0.66rem] font-semibold uppercase tracking-[0.2em] text-amber-100/55 underline decoration-amber-100/20 underline-offset-4 transition hover:text-amber-100"
          >
            View all upcoming events
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
