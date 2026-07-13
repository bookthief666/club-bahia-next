'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { trackedReservationHref } from '@/lib/attribution/domain';
import type { PublicEventCard } from '@/lib/public-events/domain';

export function UpcomingDefaultScene({
  residentProgram,
}: {
  residentProgram?: PublicEventCard | null;
}) {
  const reduceMotion = useReducedMotion();
  const residentHref = residentProgram
    ? `/events/${residentProgram.slug}`
    : '/events';
  const reservationHref = trackedReservationHref({
    eventSlug: residentProgram?.slug,
    source: 'club-bahia-website',
    medium: 'owned',
    campaign: residentProgram?.slug || 'general-reservations',
    content: 'homepage-no-special-events',
  });

  return (
    <section
      className="relative isolate overflow-hidden border-y border-amber-100/10 bg-[#080505] px-4 py-14 sm:px-6 sm:py-20 lg:px-8"
      aria-labelledby="upcoming-default-title"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_14%_10%,rgba(225,18,27,.24),transparent_28%),radial-gradient(circle_at_82%_16%,rgba(246,183,60,.14),transparent_22%),linear-gradient(135deg,#090505,#0d0907_48%,#07100d)]"
      />
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 22 }}
        whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto grid w-full max-w-7xl gap-5 rounded-[1.8rem] border border-amber-100/12 bg-black/30 p-5 shadow-[0_28px_90px_rgba(0,0,0,.36)] backdrop-blur sm:p-8 lg:grid-cols-[1.15fr_.85fr] lg:items-center lg:p-10"
      >
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.32em] text-amber-200/70">
            Next special event
          </p>
          <h2
            id="upcoming-default-title"
            className="bahia-display-serif mt-3 text-[clamp(3rem,11vw,6.5rem)] font-semibold leading-[0.87] tracking-[-0.055em] text-amber-50"
          >
            Nothing announced yet. The weekend still lives.
          </h2>
          <p className="mt-5 max-w-3xl text-base leading-8 text-amber-50/70 sm:text-lg">
            New concerts, themed nights, and special events appear here as soon as the venue confirms them. Until then, Club Bahia continues with live Latin weekends, dancing, a full kitchen, and table requests.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href={residentHref}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-red-600 px-6 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-[0_0_28px_rgba(225,18,27,.28)] transition hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              See Live Latin Weekends
            </Link>
            <Link
              href={reservationHref}
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-amber-100/24 px-6 text-xs font-semibold uppercase tracking-[0.18em] text-amber-100 transition hover:border-amber-100/55 hover:bg-amber-100/[.06] focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              Request a Table
            </Link>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          {[
            ['Live music', 'Resident Latin performances most Friday and Saturday nights.'],
            ['Hot kitchen', 'Dinner, late-night food, cocktails, and group-friendly tables.'],
            ['Big dance floor', 'A historic Sunset Boulevard room built for celebration.'],
          ].map(([title, detail]) => (
            <div
              key={title}
              className="rounded-2xl border border-amber-100/10 bg-[linear-gradient(145deg,rgba(246,183,60,.07),rgba(16,185,129,.045))] p-4"
            >
              <p className="font-serif text-2xl text-amber-50">{title}</p>
              <p className="mt-2 text-sm leading-6 text-amber-50/58">{detail}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
