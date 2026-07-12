'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { trackedReservationHref } from '@/lib/attribution/domain';
import { bahiaAssets } from '@/lib/assets/bahia-assets';
import type { PublicEventCard } from '@/lib/public-events/domain';
import { BahiaSunsetLogo } from '@/components/experience/BahiaSunsetLogo';
import { Footer } from '@/components/layout/Footer';

const weeklyProgramming = [
  {
    title: 'Live Latin Music',
    detail: 'Weekend performances, dancing, and stage-forward energy.',
  },
  {
    title: 'Dance Nights',
    detail: 'Red-room atmosphere, cocktails, and group-friendly seating.',
  },
  {
    title: 'Birthdays & Groups',
    detail: 'Reservation requests for celebrations and larger parties.',
  },
  {
    title: 'Private Events',
    detail: 'Owner-reviewed parties, filming, cultural events, and venue rentals.',
  },
];

function eventActionHref(event: PublicEventCard): string {
  return event.ticketUrl || `/events/${event.slug}`;
}

function eventReservationHref(event: PublicEventCard, content: string): string {
  return trackedReservationHref({
    eventSlug: event.slug,
    campaign: event.slug,
    content,
  });
}

function EventImage({ event, className }: { event: PublicEventCard; className: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={event.imageUrl || bahiaAssets.liveDanceCrowdStage.src}
      alt={event.imageAlt || `${event.title} at Club Bahia`}
      className={className}
    />
  );
}

export function EventsExperience({ events }: { events: PublicEventCard[] }) {
  const reduceMotion = useReducedMotion();
  const featuredEvent = events.find((event) => event.isFeatured) ?? events[0];
  const eventCards = events.filter((event) => event.slug !== featuredEvent?.slug);

  return (
    <>
      <main className="relative min-h-screen overflow-x-hidden bg-[#050304] text-amber-50">
        <Image
          src={bahiaAssets.liveDanceCrowdStage.src}
          alt=""
          fill
          priority
          sizes="100vw"
          className="pointer-events-none absolute inset-0 -z-20 object-cover object-center opacity-28 saturate-125"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(5,3,4,0.98),rgba(5,3,4,0.72)_52%,rgba(5,3,4,0.96)),radial-gradient(circle_at_20%_10%,rgba(225,18,27,0.34),transparent_30%),radial-gradient(circle_at_82%_12%,rgba(16,185,129,0.18),transparent_24%),radial-gradient(circle_at_72%_42%,rgba(246,183,60,0.14),transparent_28%),linear-gradient(180deg,rgba(5,3,4,0.48),#050304_84%)]"
          aria-hidden="true"
        />

        <section
          className="mx-auto flex w-full max-w-7xl flex-col px-3 pb-12 pt-5 min-[380px]:px-4 sm:px-6 lg:px-8"
          aria-labelledby="events-title"
        >
          <nav className="sticky top-3 z-30 flex items-center justify-between gap-2 rounded-full border border-amber-100/10 bg-black/55 p-1.5 text-[0.6rem] uppercase tracking-[0.14em] text-amber-100/75 shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:text-xs sm:tracking-[0.24em]">
            <Link
              href="/"
              className="rounded-full border border-amber-100/15 px-3 py-2 transition hover:border-red-300/60 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              Club Bahia
            </Link>
            <Link
              href={trackedReservationHref({
                source: 'club-bahia-website',
                medium: 'owned',
                campaign: 'general-reservations',
                content: 'events-page-nav',
              })}
              className="rounded-full bg-red-600 px-4 py-2 text-white shadow-[0_0_24px_rgba(225,18,27,0.32)] transition hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              Request a Table
            </Link>
          </nav>

          <div className="grid gap-8 py-12 sm:py-16 lg:grid-cols-[0.92fr_1.08fr] lg:items-end">
            <div>
              <BahiaSunsetLogo
                className="h-20 w-36"
                tone="subtle"
                showFallbackText
              />
              <p className="mt-6 text-[0.66rem] uppercase tracking-[0.28em] text-emerald-200 sm:text-xs sm:tracking-[0.42em]">
                Live music · dancing · tables · celebrations
              </p>
              <h1
                id="events-title"
                className="bahia-display-serif mt-4 text-[clamp(3.1rem,15vw,9.75rem)] font-semibold leading-[0.88] tracking-[-0.05em] text-amber-50 drop-shadow-[0_0_30px_rgba(225,18,27,0.34)]"
              >
                Upcoming at Bahia
              </h1>
            </div>
            <div className="max-w-2xl text-amber-50/78 lg:justify-self-end">
              <p className="text-base leading-7 sm:text-2xl sm:leading-10">
                Find the next Club Bahia night, see the real event details, and send a reservation request without leaving the site.
              </p>
              <p className="mt-4 text-sm leading-6 text-amber-100/68 sm:text-base">
                A submitted request is reviewed by the venue and does not guarantee admission or table placement until the team confirms it.
              </p>
            </div>
          </div>

          {featuredEvent ? (
            <motion.article
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden rounded-[1.65rem] border border-amber-100/16 bg-[#100606]/90 shadow-[0_28px_90px_rgba(0,0,0,0.42)] backdrop-blur sm:rounded-[2.25rem]"
            >
              <div className="grid lg:grid-cols-[1.04fr_0.96fr]">
                <div className="relative min-h-[17rem] overflow-hidden sm:min-h-[25rem] lg:min-h-full">
                  <EventImage
                    event={featuredEvent}
                    className="absolute inset-0 h-full w-full object-cover saturate-125"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(5,3,4,0.72)),radial-gradient(circle_at_18%_18%,rgba(16,185,129,0.20),transparent_28%)]" />
                  <span className="absolute left-4 top-4 rounded-full border border-emerald-200/35 bg-emerald-400/12 px-3 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-emerald-100 backdrop-blur">
                    Featured
                  </span>
                </div>

                <div className="p-5 sm:p-8 lg:p-10">
                  <p className="text-[0.65rem] uppercase tracking-[0.28em] text-red-200 sm:text-xs">
                    {featuredEvent.eyebrow}
                  </p>
                  <h2 className="bahia-display-serif mt-3 text-[clamp(2.5rem,13vw,6.25rem)] font-semibold leading-[0.86] tracking-[-0.05em] text-amber-50">
                    {featuredEvent.title}
                  </h2>

                  <div className="mt-5 flex flex-wrap gap-2 text-[0.62rem] uppercase tracking-[0.15em] text-amber-100/72 sm:text-xs">
                    <span className="rounded-full border border-amber-100/16 px-3 py-1.5">
                      {featuredEvent.category}
                    </span>
                    <span className="rounded-full border border-emerald-200/22 bg-emerald-400/10 px-3 py-1.5 text-emerald-100">
                      {featuredEvent.status}
                    </span>
                    {featuredEvent.ageRestriction ? (
                      <span className="rounded-full border border-red-300/22 bg-red-600/10 px-3 py-1.5 text-red-100">
                        {featuredEvent.ageRestriction}
                      </span>
                    ) : null}
                  </div>

                  <dl className="mt-6 grid gap-3 rounded-3xl border border-amber-100/10 bg-black/22 p-4 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="uppercase tracking-[0.2em] text-amber-200/55">Date</dt>
                      <dd className="mt-1 text-amber-50">{featuredEvent.dateLabel}</dd>
                    </div>
                    <div>
                      <dt className="uppercase tracking-[0.2em] text-amber-200/55">Time</dt>
                      <dd className="mt-1 text-amber-50">{featuredEvent.timeLabel}</dd>
                    </div>
                    {featuredEvent.admission ? (
                      <div>
                        <dt className="uppercase tracking-[0.2em] text-amber-200/55">Admission</dt>
                        <dd className="mt-1 text-amber-50">{featuredEvent.admission}</dd>
                      </div>
                    ) : null}
                    {featuredEvent.room ? (
                      <div>
                        <dt className="uppercase tracking-[0.2em] text-amber-200/55">Room</dt>
                        <dd className="mt-1 text-amber-50">{featuredEvent.room}</dd>
                      </div>
                    ) : null}
                  </dl>

                  <p className="mt-5 text-sm leading-7 text-amber-50/70 sm:text-base">
                    {featuredEvent.summary}
                  </p>

                  <div className="mt-7 flex flex-col gap-3 min-[520px]:flex-row">
                    <Link
                      href={eventActionHref(featuredEvent)}
                      className="inline-flex min-h-12 items-center justify-center rounded-full bg-red-600 px-5 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-400"
                    >
                      {featuredEvent.ticketUrl ? 'Buy Tickets' : 'View Event'}
                    </Link>
                    <Link
                      href={eventReservationHref(
                        featuredEvent,
                        'events-page-featured-cta',
                      )}
                      className="inline-flex min-h-12 items-center justify-center rounded-full border border-amber-100/24 px-5 text-xs font-semibold uppercase tracking-[0.18em] text-amber-100 transition hover:border-amber-100/60 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-400"
                    >
                      Request Reservation
                    </Link>
                  </div>
                </div>
              </div>
            </motion.article>
          ) : null}

          <section
            className="mt-8 rounded-[1.65rem] border border-amber-100/12 bg-black/30 p-4 backdrop-blur sm:p-6"
            aria-labelledby="weekly-programming-title"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[0.65rem] uppercase tracking-[0.28em] text-emerald-200/80">
                  The Bahia experience
                </p>
                <h2
                  id="weekly-programming-title"
                  className="mt-2 font-serif text-3xl tracking-[-0.04em] text-amber-50 sm:text-5xl"
                >
                  More Ways to Gather
                </h2>
              </div>
              <p className="max-w-lg text-sm leading-6 text-amber-50/62">
                Specific dated events appear here as the venue publishes them. General reservation and private-event inquiries remain available year-round.
              </p>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {weeklyProgramming.map((item) => (
                <div
                  key={item.title}
                  className="rounded-3xl border border-amber-100/10 bg-amber-100/[0.045] p-4"
                >
                  <h3 className="font-serif text-2xl tracking-[-0.03em] text-amber-50">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-amber-50/64">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {eventCards.length ? (
            <section className="mt-8" aria-labelledby="event-list-title">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[0.65rem] uppercase tracking-[0.28em] text-red-200/85">
                    Events & reservations
                  </p>
                  <h2
                    id="event-list-title"
                    className="mt-2 font-serif text-3xl tracking-[-0.04em] text-amber-50 sm:text-5xl"
                  >
                    Choose Your Night
                  </h2>
                </div>
                <p className="max-w-md text-sm leading-6 text-amber-50/62">
                  Open an event for complete details, then send a request tied to the correct date.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {eventCards.map((event, index) => (
                  <motion.article
                    key={event.slug}
                    initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                    whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.25 }}
                    transition={{
                      duration: 0.55,
                      delay: index * 0.05,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="overflow-hidden rounded-[1.5rem] border border-amber-100/14 bg-[#100606]/90 shadow-[0_22px_70px_rgba(0,0,0,0.34)] backdrop-blur"
                  >
                    <div className="relative min-h-48 overflow-hidden">
                      <EventImage
                        event={event}
                        className="absolute inset-0 h-full w-full object-cover saturate-125"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#100606] via-transparent to-black/18" />
                    </div>
                    <div className="p-5">
                      <div className="flex flex-wrap gap-2 text-[0.62rem] uppercase tracking-[0.15em] text-amber-100/70">
                        <span className="rounded-full border border-amber-100/14 px-2.5 py-1">
                          {event.category}
                        </span>
                        <span className="rounded-full border border-emerald-200/20 bg-emerald-400/10 px-2.5 py-1 text-emerald-100">
                          {event.status}
                        </span>
                      </div>
                      <h3 className="mt-4 font-serif text-3xl leading-none tracking-[-0.04em] text-amber-50 sm:text-4xl">
                        {event.title}
                      </h3>
                      <p className="mt-3 text-xs uppercase tracking-[0.18em] text-amber-200/75">
                        {event.dateLabel} · {event.timeLabel}
                      </p>
                      <p className="mt-4 line-clamp-4 text-sm leading-6 text-amber-50/68">
                        {event.summary}
                      </p>
                      <div className="mt-5 grid gap-2 sm:grid-cols-2">
                        <Link
                          href={`/events/${event.slug}`}
                          className="inline-flex min-h-11 items-center justify-center rounded-full border border-amber-100/22 px-4 text-xs font-semibold uppercase tracking-[0.15em] text-amber-100"
                        >
                          Details
                        </Link>
                        <Link
                          href={eventReservationHref(
                            event,
                            'events-page-event-card',
                          )}
                          className="inline-flex min-h-11 items-center justify-center rounded-full bg-red-600 px-4 text-xs font-semibold uppercase tracking-[0.15em] text-white"
                        >
                          Reserve
                        </Link>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </div>
            </section>
          ) : null}

          <div className="mt-8 overflow-hidden rounded-[1.65rem] border border-amber-100/12 bg-amber-100/[0.05] p-5 sm:p-7">
            <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-[0.65rem] uppercase tracking-[0.28em] text-emerald-200/80">
                  Birthdays · tables · private events
                </p>
                <h2 className="mt-2 font-serif text-3xl tracking-[-0.04em] text-amber-50 sm:text-5xl">
                  Planning a Bahia night?
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-amber-50/70 sm:text-base">
                  Send the details now so the venue can review timing, availability, group size, and table needs.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                <a
                  href="tel:2132504313"
                  className="rounded-full bg-amber-100 px-5 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-[#120607]"
                >
                  Call Club Bahia
                </a>
                <Link
                  href={trackedReservationHref({
                    source: 'club-bahia-website',
                    medium: 'owned',
                    campaign: 'general-reservations',
                    content: 'events-page-footer-cta',
                  })}
                  className="rounded-full border border-amber-100/25 px-5 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-amber-100"
                >
                  Start Reservation
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
