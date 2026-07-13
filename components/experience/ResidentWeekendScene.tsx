'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { trackedReservationHref } from '@/lib/attribution/domain';
import type { PublicEventCard } from '@/lib/public-events/domain';

export function ResidentWeekendScene({
  program,
}: {
  program: PublicEventCard;
}) {
  const reduceMotion = useReducedMotion();
  const reservationHref = trackedReservationHref({
    eventSlug: program.slug,
    source: 'club-bahia-website',
    medium: 'owned',
    campaign: program.slug,
    content: 'homepage-resident-weekends',
  });

  return (
    <section
      id="resident-weekends"
      className="relative isolate overflow-hidden border-y border-amber-100/10 bg-[#070504] px-4 py-16 sm:px-6 sm:py-24 lg:px-8"
      aria-labelledby="resident-weekend-title"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_12%_12%,rgba(246,183,60,.18),transparent_28%),radial-gradient(circle_at_84%_8%,rgba(16,185,129,.16),transparent_24%),linear-gradient(180deg,#070504,#0c0806_55%,#070504)]"
      />

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 28 }}
        whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto grid w-full max-w-7xl gap-5 lg:grid-cols-[.9fr_1.1fr] lg:items-stretch"
      >
        <div className="relative min-h-[27rem] overflow-hidden rounded-[1.8rem] border border-amber-100/16 bg-black/45 shadow-[0_30px_100px_rgba(0,0,0,.48)] sm:min-h-[34rem]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={program.imageUrl}
            alt={program.imageAlt}
            className="absolute inset-0 h-full w-full object-cover saturate-110"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,3,3,.03),rgba(5,3,4,.82)),radial-gradient(circle_at_60%_18%,rgba(246,183,60,.16),transparent_34%)]" />
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-amber-100/70">
              Club Bahia resident group
            </p>
            <p className="mt-2 font-serif text-4xl leading-none text-white sm:text-6xl">
              Azucar LA
            </p>
            <p className="mt-3 text-sm leading-6 text-amber-50/68">
              Live weekends on Sunset Boulevard.
            </p>
          </div>
        </div>

        <div className="flex flex-col justify-center rounded-[1.8rem] border border-amber-100/12 bg-[linear-gradient(145deg,rgba(19,9,7,.95),rgba(8,22,17,.9))] p-5 shadow-[0_28px_90px_rgba(0,0,0,.38)] sm:p-8 lg:p-10">
          <div className="flex flex-wrap items-center gap-2 text-[0.62rem] uppercase tracking-[0.17em] text-amber-100/74 sm:text-xs">
            <span className="rounded-full border border-emerald-200/24 bg-emerald-300/10 px-3 py-1.5 text-emerald-100">
              Resident live music
            </span>
            <span className="rounded-full border border-amber-100/18 px-3 py-1.5">
              Reservations available
            </span>
          </div>

          <p className="mt-6 text-[0.65rem] font-semibold uppercase tracking-[0.32em] text-red-200">
            Resident series
          </p>
          <h2
            id="resident-weekend-title"
            className="bahia-display-serif mt-3 text-[clamp(3.4rem,12vw,7rem)] font-semibold leading-[0.84] tracking-[-0.055em] text-amber-50"
          >
            Live Latin Weekends
          </h2>

          <div className="mt-6 border-t border-amber-100/12 pt-5 text-sm leading-7 text-amber-50/72 sm:text-base">
            <p>{program.dateLabel}</p>
            <p className="mt-2 text-amber-50/58">
              Some nights, hours, cover, and age policy may vary. Call ahead to confirm.
            </p>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <Link
              href={`/events/${program.slug}`}
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-amber-100/24 px-5 text-xs font-semibold uppercase tracking-[0.18em] text-amber-100 transition hover:border-amber-100/60 hover:bg-amber-100/[.06] hover:text-white focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              Weekend Details
            </Link>
            <Link
              href={reservationHref}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-red-600 px-5 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-[0_0_28px_rgba(225,18,27,.3)] transition hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              Request a Table
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
