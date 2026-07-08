"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { bahiaAssets } from "@/lib/assets/bahia-assets";
import { bahiaEvents } from "@/lib/events/bahia-events";
import { BahiaSunsetLogo } from "@/components/experience/BahiaSunsetLogo";
import { Footer } from "@/components/layout/Footer";

export function EventsExperience() {
  const reduceMotion = useReducedMotion();
  const hasEvents = bahiaEvents.length > 0;
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
          className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(5,3,4,0.96),rgba(5,3,4,0.70)_50%,rgba(5,3,4,0.96)),radial-gradient(circle_at_22%_8%,rgba(225,18,27,0.35),transparent_30%),radial-gradient(circle_at_82%_14%,rgba(246,183,60,0.18),transparent_26%),linear-gradient(180deg,rgba(5,3,4,0.54),#050304_82%)]"
          aria-hidden="true"
        />
        <section
          className="mx-auto flex w-full max-w-7xl flex-col px-4 pb-12 pt-5 sm:px-6 lg:px-8"
          aria-labelledby="events-title"
        >
          <nav className="flex items-center justify-between gap-3 text-[0.66rem] uppercase tracking-[0.18em] text-amber-100/75 sm:text-xs sm:tracking-[0.24em]">
            <Link
              href="/"
              className="rounded-full border border-amber-100/20 px-3 py-2 transition hover:border-red-300/60 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-400"
              aria-label="Back to Club Bahia homepage"
            >
              Back to Club Bahia
            </Link>
            <Link
              href="/reservations"
              className="rounded-full bg-red-600 px-4 py-2 text-white shadow-[0_0_24px_rgba(225,18,27,0.32)] transition hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-400"
              aria-label="Reserve for a Club Bahia event"
            >
              Reserve
            </Link>
          </nav>
          <div className="grid gap-10 py-14 sm:py-20 lg:grid-cols-[0.92fr_1.08fr] lg:items-end">
            <div>
              <BahiaSunsetLogo
                className="h-20 w-36"
                tone="subtle"
                showFallbackText
              />
              <p className="mt-6 text-[0.68rem] uppercase tracking-[0.34em] text-red-200 sm:text-xs sm:tracking-[0.42em]">
                Live music · hot kitchen · big dance floor
              </p>
              <h1
                id="events-title"
                className="bahia-display-serif mt-4 text-[clamp(4rem,17vw,10.5rem)] font-semibold leading-[0.86] tracking-[-0.045em] text-amber-50 drop-shadow-[0_0_30px_rgba(225,18,27,0.34)]"
              >
                Upcoming Events
              </h1>
            </div>
            <p className="max-w-2xl text-lg leading-8 text-amber-50/76 sm:text-2xl sm:leading-10 lg:justify-self-end">
              Explore upcoming programming at Club Bahia, from live Latin
              entertainment and dance nights to birthdays, table reservations,
              and private event inquiries.
            </p>
          </div>
          {hasEvents ? (
            <div className="grid gap-4 lg:grid-cols-[0.35fr_0.65fr] lg:gap-6">
              <aside className="rounded-[1.75rem] border border-amber-100/15 bg-black/28 p-5 backdrop-blur sm:p-6">
                <p className="text-[0.68rem] uppercase tracking-[0.3em] text-amber-200/80">
                  Programming
                </p>
                <div className="mt-5 grid gap-3">
                  {bahiaEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between rounded-2xl border border-amber-100/10 bg-amber-100/[0.04] px-4 py-3"
                    >
                      <span className="text-sm text-amber-50">
                        {event.dayLabel}
                      </span>
                      <span className="text-xs uppercase tracking-[0.18em] text-amber-100/58">
                        {event.dateLabel}
                      </span>
                    </div>
                  ))}
                </div>
              </aside>
              <div className="grid gap-4">
                {bahiaEvents.map((event, index) => (
                  <motion.article
                    key={event.id}
                    initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                    whileInView={
                      reduceMotion ? undefined : { opacity: 1, y: 0 }
                    }
                    viewport={{ once: true, amount: 0.35 }}
                    transition={{
                      duration: 0.55,
                      delay: index * 0.06,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="overflow-hidden rounded-[1.6rem] border border-amber-100/14 bg-[#100606]/88 shadow-[0_22px_70px_rgba(0,0,0,0.34)] backdrop-blur sm:rounded-[2rem]"
                  >
                    <div className="grid gap-0 sm:grid-cols-[8.5rem_1fr]">
                      <div className="flex flex-row items-center justify-between border-b border-amber-100/10 bg-red-950/28 p-5 sm:flex-col sm:items-start sm:border-b-0 sm:border-r">
                        <span className="text-[0.72rem] uppercase tracking-[0.24em] text-red-100/80">
                          {event.dayLabel}
                        </span>
                        <span className="bahia-display-serif text-4xl font-bold leading-none tracking-[-0.05em] text-amber-50 sm:text-5xl">
                          {event.dateLabel}
                        </span>
                      </div>
                      <div className="p-5 sm:p-6">
                        <div className="flex flex-wrap gap-2 text-[0.64rem] uppercase tracking-[0.16em] text-amber-100/68">
                          <span className="rounded-full border border-amber-100/14 px-2.5 py-1">
                            {event.category}
                          </span>
                          <span className="rounded-full border border-red-300/25 bg-red-600/10 px-2.5 py-1 text-red-100">
                            {event.status}
                          </span>
                        </div>
                        <h2 className="mt-4 font-serif text-3xl leading-none tracking-[-0.04em] text-amber-50 sm:text-5xl">
                          {event.title}
                        </h2>
                        <p className="mt-3 text-sm uppercase tracking-[0.18em] text-amber-200/75">
                          {event.timeLabel}
                        </p>
                        <p className="mt-4 max-w-2xl text-sm leading-6 text-amber-50/68 sm:text-base sm:leading-7">
                          {event.description}
                        </p>
                        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                          <Link
                            href={`/reservations?event=${event.slug}`}
                            className="inline-flex min-h-11 items-center justify-center rounded-full bg-red-600 px-5 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-400"
                            aria-label={`Start a reservation inquiry for ${event.title}`}
                          >
                            Start Reservation
                          </Link>
                          <a
                            href="tel:2132504313"
                            className="inline-flex min-h-11 items-center justify-center rounded-full border border-amber-100/24 px-5 text-xs font-semibold uppercase tracking-[0.18em] text-amber-100 transition hover:border-amber-100/60 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-400"
                            aria-label={`Call Club Bahia about ${event.title}`}
                          >
                            Call
                          </a>
                        </div>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-[2rem] border border-amber-100/15 bg-black/30 p-8 text-center">
              <h2 className="font-serif text-4xl text-amber-50">
                Events coming soon
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-amber-50/70">
                Check back for upcoming Club Bahia programming, or call us for
                weekend reservations and private event inquiries.
              </p>
            </div>
          )}
          <div className="mt-8 flex flex-col gap-3 rounded-[1.5rem] border border-amber-100/12 bg-amber-100/[0.05] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <p className="text-sm leading-6 text-amber-50/74">
              Planning a birthday, table reservation, group night, or private
              event?
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href="tel:2132504313"
                className="rounded-full bg-amber-100 px-5 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-[#120607]"
                aria-label="Call Club Bahia at 213 250 4313"
              >
                Call Club Bahia
              </a>
              <Link
                href="/reservations"
                className="rounded-full border border-amber-100/25 px-5 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-amber-100"
                aria-label="Start a Club Bahia reservation request"
              >
                Start Reservation
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
