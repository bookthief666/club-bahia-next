'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { trackedReservationHref } from '@/lib/attribution/domain';
import type { PublicEventCard } from '@/lib/public-events/domain';

export function UpcomingEventsEmptyState({
  residentProgram,
}: {
  residentProgram?: PublicEventCard | null;
}) {
  const reduceMotion = useReducedMotion();
  const reservationHref = trackedReservationHref({
    eventSlug: residentProgram?.slug,
    source: 'club-bahia-website',
    medium: 'owned',
    campaign: residentProgram?.slug || 'general-reservations',
    content: 'events-page-empty-upcoming',
  });
  const backgroundImage =
    residentProgram?.secondaryImageUrl || residentProgram?.imageUrl || '';

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative isolate overflow-hidden rounded-[1.75rem] border border-amber-100/15 bg-[#100606]/88 shadow-[0_28px_90px_rgba(0,0,0,.42)] sm:rounded-[2.25rem]"
      aria-labelledby="no-upcoming-events-title"
    >
      {backgroundImage ? (
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-20 bg-cover bg-center opacity-24 saturate-75"
          style={{ backgroundImage: `url(${JSON.stringify(backgroundImage)})` }}
        />
      ) : null}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(8,4,4,.98),rgba(8,4,4,.8)_58%,rgba(7,14,11,.92)),radial-gradient(circle_at_15%_15%,rgba(225,18,27,.18),transparent_30%),radial-gradient(circle_at_85%_10%,rgba(246,183,60,.08),transparent_24%)]"
      />

      <div className="p-5 sm:p-8 lg:p-10">
        <div className="max-w-3xl">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-amber-200/72">
            Upcoming events
          </p>
          <h2
            id="no-upcoming-events-title"
            className="bahia-display-serif mt-3 text-[clamp(2.4rem,8vw,4.75rem)] font-semibold leading-[0.92] tracking-[-0.045em] text-amber-50"
          >
            No upcoming events.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-8 text-amber-50/72 sm:text-lg">
            Confirmed nights will appear here. Please call Club Bahia to check the regular schedule or inquire about past or future events.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href={
                residentProgram
                  ? `/events/${residentProgram.slug}`
                  : '#resident-weekends'
              }
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-red-600 px-6 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-[0_0_26px_rgba(225,18,27,.3)] transition hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              View Live Weekends
            </Link>
            <Link
              href={reservationHref}
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-amber-100/24 px-6 text-xs font-semibold uppercase tracking-[0.18em] text-amber-100 transition hover:border-amber-100/55 hover:bg-amber-100/[.06] focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              Request a Table
            </Link>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
