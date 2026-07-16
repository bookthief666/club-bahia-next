import Image from 'next/image';
import Link from 'next/link';
import { bahiaAssets } from '@/lib/assets/bahia-assets';
import type { PublicEventCard } from '@/lib/public-events/domain';
import { ReservationForm } from './ReservationForm';
import { BahiaSunsetLogo } from '@/components/experience/BahiaSunsetLogo';
import { Footer } from '@/components/layout/Footer';

function reservationBadges(event?: PublicEventCard | null): string[] {
  if (!event) return ['21+', 'Sunset Blvd', 'Fri & Sat', 'Request online'];
  return [
    event.ageRestriction || '21+',
    event.category,
    event.dateLabel,
    event.status,
  ].filter(Boolean);
}

export function ReservationShell({ event }: { event?: PublicEventCard | null }) {
  const badges = reservationBadges(event);

  return (
    <>
      <main className="relative min-h-screen overflow-x-hidden bg-[#050304] px-4 py-5 text-amber-50 sm:px-6 lg:px-8">
        <Image
          src={bahiaAssets.redLoungeNeonRoom.src}
          alt=""
          fill
          sizes="100vw"
          className="pointer-events-none absolute inset-0 object-cover object-center opacity-24 saturate-125"
          aria-hidden="true"
        />
        {event?.imageUrl ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-18 saturate-125"
            style={{ backgroundImage: `url(${JSON.stringify(event.imageUrl)})` }}
          />
        ) : null}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(5,3,4,0.97),rgba(5,3,4,0.78)_52%,rgba(5,3,4,0.98)),linear-gradient(180deg,rgba(5,3,4,0.76),rgba(5,3,4,0.95)),radial-gradient(circle_at_20%_10%,rgba(225,18,27,0.3),transparent_28%),radial-gradient(circle_at_80%_0%,rgba(245,158,11,0.2),transparent_30%),radial-gradient(circle_at_75%_52%,rgba(16,185,129,0.12),transparent_28%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-red-950/35 to-transparent"
        />

        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-5 pb-10 pt-1 sm:gap-8 sm:pt-6 lg:grid lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-10 lg:pt-12">
          <section className="lg:sticky lg:top-10" aria-labelledby="reservation-title">
            <div className="flex flex-wrap gap-2">
              <Link
                href={event ? `/events/${event.slug}` : '/events'}
                className="inline-flex min-h-10 items-center rounded-full border border-amber-100/20 px-3.5 text-[0.68rem] uppercase tracking-[0.18em] text-amber-100/75 transition hover:border-red-300/60 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-400 sm:min-h-11 sm:px-4 sm:text-xs sm:tracking-[0.2em]"
              >
                {event ? 'Back to event' : 'View events'}
              </Link>
              <Link
                href="/"
                className="inline-flex min-h-10 items-center rounded-full border border-amber-100/12 px-3.5 text-[0.68rem] uppercase tracking-[0.18em] text-amber-100/55 transition hover:border-amber-100/35 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-400 sm:min-h-11 sm:px-4 sm:text-xs sm:tracking-[0.2em]"
              >
                Club Bahia home
              </Link>
            </div>

            <BahiaSunsetLogo
              className="mt-6 h-16 w-32 sm:mt-10 sm:h-20 sm:w-36"
              tone="subtle"
              showFallbackText
            />
            <p className="mt-4 text-[0.68rem] uppercase tracking-[0.3em] text-red-200 sm:text-xs sm:tracking-[0.38em]">
              {event ? 'Event reservation request' : 'Club Bahia Los Angeles'}
            </p>
            <h1
              id="reservation-title"
              className="mt-3 max-w-3xl bahia-display-serif text-[clamp(3.55rem,15.5vw,7rem)] font-semibold leading-[0.88] tracking-[-0.045em] text-amber-50 drop-shadow-[0_0_30px_rgba(225,18,27,0.35)] sm:mt-4 sm:text-[clamp(5rem,13vw,9.25rem)] sm:leading-[0.82] sm:tracking-[-0.05em]"
            >
              Reserve Your Night
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-amber-50/75 sm:mt-5 sm:text-xl sm:leading-8">
              {event
                ? `Request a table or group reservation for ${event.title}.`
                : 'Request a Friday or Saturday night reservation at Club Bahia.'}
            </p>

            <div
              className="mt-4 flex flex-wrap gap-2 sm:mt-6"
              aria-label="Reservation highlights"
            >
              {badges.map((badge) => (
                <span
                  key={badge}
                  className="max-w-full rounded-full border border-amber-200/20 bg-amber-100/[0.06] px-2.5 py-1.5 text-[0.62rem] uppercase tracking-[0.13em] text-amber-100 sm:px-3 sm:py-2 sm:text-[0.68rem] sm:tracking-[0.16em]"
                >
                  {badge}
                </span>
              ))}
            </div>

            {event ? (
              <article className="mt-5 overflow-hidden rounded-[1.5rem] border border-emerald-200/16 bg-[linear-gradient(145deg,rgba(8,27,21,.78),rgba(8,5,5,.72))] shadow-[0_18px_65px_rgba(0,0,0,.3)] sm:mt-8 sm:rounded-[1.75rem]">
                {event.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={event.imageUrl}
                    alt={event.imageAlt}
                    className="h-48 w-full object-cover sm:h-56"
                  />
                ) : null}
                <div className="p-4 sm:p-5">
                  <p className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-emerald-200/70">
                    Selected event
                  </p>
                  <h2 className="mt-2 font-serif text-3xl text-amber-50 sm:text-4xl">
                    {event.title}
                  </h2>
                  <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-[0.6rem] uppercase tracking-[0.18em] text-amber-200/55">
                        Date
                      </dt>
                      <dd className="mt-1 text-amber-50/82">{event.dateLabel}</dd>
                    </div>
                    <div>
                      <dt className="text-[0.6rem] uppercase tracking-[0.18em] text-amber-200/55">
                        Time
                      </dt>
                      <dd className="mt-1 text-amber-50/82">{event.timeLabel}</dd>
                    </div>
                    {event.admission ? (
                      <div>
                        <dt className="text-[0.6rem] uppercase tracking-[0.18em] text-amber-200/55">
                          Admission
                        </dt>
                        <dd className="mt-1 text-amber-50/82">{event.admission}</dd>
                      </div>
                    ) : null}
                    <div>
                      <dt className="text-[0.6rem] uppercase tracking-[0.18em] text-amber-200/55">
                        Location
                      </dt>
                      <dd className="mt-1 text-amber-50/82">
                        {event.address || '1130 Sunset Blvd, Los Angeles'}
                      </dd>
                    </div>
                  </dl>
                  <p className="mt-4 text-sm leading-6 text-amber-50/62">
                    {event.summary}
                  </p>
                </div>
              </article>
            ) : null}

            <div className="mt-5 rounded-[1.5rem] border border-amber-100/15 bg-black/25 p-4 text-sm leading-6 text-amber-50/70 sm:mt-8 sm:rounded-[1.75rem] sm:p-5 sm:leading-7">
              <p className="font-semibold text-amber-50">How reservations work</p>
              <ol className="mt-2 space-y-2">
                <li>1. Send the request with your date and party details.</li>
                <li>2. The Club Bahia team reviews availability.</li>
                <li>3. The venue contacts you when confirmation or more information is needed.</li>
              </ol>
              <p className="mt-3 text-amber-100/55">
                Same-day requests and large parties should also call the venue.
              </p>
              <a
                href="tel:2132504313"
                className="mt-4 inline-flex min-h-11 items-center rounded-full bg-amber-100 px-5 text-xs font-semibold uppercase tracking-[0.18em] text-[#120607] transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-red-400"
              >
                Call (213) 250-4313
              </a>
            </div>
          </section>

          <ReservationForm event={event} />
        </div>
      </main>
      <Footer />
    </>
  );
}
