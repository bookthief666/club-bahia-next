'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { trackedReservationHref } from '@/lib/attribution/domain';
import type { PublicEventCard } from '@/lib/public-events/domain';

export function ResidentProgramFeature({
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
    content: 'events-page-resident-feature',
  });

  return (
    <motion.section
      id="resident-weekends"
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="mt-8 overflow-hidden rounded-[1.75rem] border border-emerald-200/14 bg-[linear-gradient(145deg,rgba(11,20,16,.95),rgba(21,9,8,.95))] shadow-[0_28px_90px_rgba(0,0,0,.4)] sm:rounded-[2.25rem]"
      aria-labelledby="resident-program-title"
    >
      <div className="grid lg:grid-cols-[.9fr_1.1fr]">
        <div className="relative min-h-[22rem] overflow-hidden sm:min-h-[28rem] lg:min-h-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={program.imageUrl}
            alt={program.imageAlt}
            className="absolute inset-0 h-full w-full object-cover saturate-110"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,3,4,.05),rgba(5,3,4,.82)),radial-gradient(circle_at_30%_12%,rgba(246,183,60,.16),transparent_30%)]" />
          <span className="absolute left-4 top-4 rounded-full border border-amber-200/30 bg-black/35 px-3 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-amber-100 backdrop-blur">
            Resident series
          </span>
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
            <p className="text-[0.62rem] uppercase tracking-[0.24em] text-amber-100/66">
              Live on the Bahia stage
            </p>
            <p className="mt-2 font-serif text-4xl leading-none text-white sm:text-6xl">
              Azucar LA
            </p>
          </div>
        </div>

        <div className="p-5 sm:p-8 lg:p-10">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-emerald-200/74">
            Resident live music
          </p>
          <h2
            id="resident-program-title"
            className="bahia-display-serif mt-3 text-[clamp(3rem,11vw,6.4rem)] font-semibold leading-[0.86] tracking-[-0.055em] text-amber-50"
          >
            Live Latin Weekends
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-8 text-amber-50/72 sm:text-lg">
            Club Bahia’s resident group Azucar LA performs live cumbia, merengue, salsa, bachata, and Latin dance music.
          </p>

          <dl className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-amber-100/10 bg-black/22 p-4">
              <dt className="text-[0.6rem] uppercase tracking-[0.2em] text-amber-200/55">
                Schedule
              </dt>
              <dd className="mt-2 text-sm leading-6 text-amber-50">
                {program.dateLabel}
              </dd>
            </div>
            <div className="rounded-2xl border border-amber-100/10 bg-black/22 p-4">
              <dt className="text-[0.6rem] uppercase tracking-[0.2em] text-amber-200/55">
                Music
              </dt>
              <dd className="mt-2 text-sm leading-6 text-amber-50">
                Cumbia · merengue · salsa · bachata
              </dd>
            </div>
            <div className="rounded-2xl border border-amber-100/10 bg-black/22 p-4 sm:col-span-2">
              <dt className="text-[0.6rem] uppercase tracking-[0.2em] text-amber-200/55">
                Note
              </dt>
              <dd className="mt-2 text-sm leading-6 text-amber-50">
                Some nights, hours, cover, and age policy may vary. Call ahead to confirm.
              </dd>
            </div>
          </dl>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <Link
              href={`/events/${program.slug}`}
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-amber-100/24 px-5 text-xs font-semibold uppercase tracking-[0.18em] text-amber-100 transition hover:border-amber-100/55 hover:bg-amber-100/[.06] focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              Weekend Details
            </Link>
            <Link
              href={reservationHref}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-red-600 px-5 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-[0_0_26px_rgba(225,18,27,.28)] transition hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              Request a Table
            </Link>
          </div>
        </div>
      </div>

      {program.secondaryImageUrl ? (
        <div className="grid border-t border-amber-100/10 lg:grid-cols-[.82fr_1.18fr]">
          <div className="relative min-h-52 overflow-hidden sm:min-h-64">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={program.secondaryImageUrl}
              alt={program.secondaryImageAlt || ''}
              className="absolute inset-0 h-full w-full object-cover saturate-75"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0b0f0d]/55" />
          </div>
          <div className="flex flex-col justify-center bg-black/16 p-5 sm:p-7">
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-amber-100/58">
              Sunset Boulevard
            </p>
            <p className="mt-3 font-serif text-3xl leading-tight text-amber-50 sm:text-5xl">
              Dinner, live music, dancing, and celebrations under the Bahia marquee.
            </p>
          </div>
        </div>
      ) : null}
    </motion.section>
  );
}
