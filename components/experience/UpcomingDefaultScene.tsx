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
  const backgroundImage =
    residentProgram?.secondaryImageUrl || residentProgram?.imageUrl || '';

  return (
    <section
      className="relative isolate overflow-hidden border-y border-amber-100/10 bg-[#080505] px-4 py-14 sm:px-6 sm:py-20 lg:px-8"
      aria-labelledby="upcoming-default-title"
    >
      {backgroundImage ? (
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-30 bg-cover bg-center opacity-20 saturate-75"
          style={{ backgroundImage: `url(${JSON.stringify(backgroundImage)})` }}
        />
      ) : null}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(9,5,5,.97),rgba(9,5,5,.78)_56%,rgba(8,14,12,.9)),radial-gradient(circle_at_14%_10%,rgba(225,18,27,.16),transparent_28%),radial-gradient(circle_at_82%_16%,rgba(246,183,60,.08),transparent_22%)]"
      />
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 22 }}
        whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto w-full max-w-7xl rounded-[1.8rem] border border-amber-100/12 bg-black/28 p-5 shadow-[0_28px_90px_rgba(0,0,0,.36)] backdrop-blur sm:p-8 lg:p-10"
      >
        <div className="max-w-3xl">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.32em] text-amber-200/70">
            Upcoming events
          </p>
          <h2
            id="upcoming-default-title"
            className="bahia-display-serif mt-3 text-[clamp(2.4rem,8vw,4.75rem)] font-semibold leading-[0.92] tracking-[-0.045em] text-amber-50"
          >
            No upcoming events.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-8 text-amber-50/70 sm:text-lg">
            Confirmed nights will appear here. Please call Club Bahia to check the regular schedule or inquire about past or future events.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href={residentHref}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-red-600 px-6 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-[0_0_28px_rgba(225,18,27,.28)] transition hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-400"
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
      </motion.div>
    </section>
  );
}
