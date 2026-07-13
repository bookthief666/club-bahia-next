import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BahiaSunsetLogo } from '@/components/experience/BahiaSunsetLogo';
import { Footer } from '@/components/layout/Footer';
import { trackedReservationHref } from '@/lib/attribution/domain';
import { getPublicEventCard } from '@/lib/public-events/server';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getPublicEventCard(slug, {
    includePreview: process.env.VERCEL_ENV === 'preview',
  });
  if (!event) return { title: 'Event Not Found | Club Bahia' };

  return {
    title: `${event.title} | Club Bahia`,
    description: event.summary,
    openGraph: {
      title: `${event.title} | Club Bahia`,
      description: event.summary,
      url: `/events/${event.slug}`,
      images: event.imageUrl ? [{ url: event.imageUrl, alt: event.imageAlt }] : undefined,
    },
  };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getPublicEventCard(slug, {
    includePreview: process.env.VERCEL_ENV === 'preview',
  });
  if (!event) notFound();

  const navReservationHref = trackedReservationHref({
    eventSlug: event.slug,
    campaign: event.slug,
    content: 'event-page-nav',
  });
  const primaryReservationHref = trackedReservationHref({
    eventSlug: event.slug,
    campaign: event.slug,
    content: 'event-page-primary-cta',
  });

  const details = [
    [event.programType === 'resident' ? 'Schedule' : 'Date', event.dateLabel],
    ['Time', event.timeLabel],
    ['Location', event.address || '1130 Sunset Blvd, Los Angeles, CA 90012'],
    ['Age', event.ageRestriction || '21+'],
    ['Details', event.admission || 'Call to confirm'],
  ];

  return (
    <>
      <main className="relative min-h-screen overflow-x-hidden bg-[#050304] text-amber-50">
        {event.imageUrl ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-20 bg-cover bg-center opacity-35 saturate-125"
            style={{ backgroundImage: `url(${JSON.stringify(event.imageUrl)})` }}
          />
        ) : null}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(5,3,4,.98),rgba(5,3,4,.75)_52%,rgba(5,3,4,.96)),linear-gradient(180deg,rgba(5,3,4,.35),#050304_82%),radial-gradient(circle_at_18%_15%,rgba(225,18,27,.28),transparent_30%),radial-gradient(circle_at_82%_12%,rgba(16,185,129,.18),transparent_24%)]"
        />

        <div className="mx-auto w-full max-w-7xl px-4 pb-14 pt-5 sm:px-6 lg:px-8">
          <nav className="sticky top-3 z-20 flex items-center justify-between rounded-full border border-amber-100/10 bg-black/55 p-1.5 text-[0.65rem] uppercase tracking-[0.16em] text-amber-100/75 backdrop-blur-xl sm:text-xs sm:tracking-[0.22em]">
            <Link
              href="/events"
              className="rounded-full border border-amber-100/15 px-3 py-2"
            >
              All Events
            </Link>
            <Link
              href={navReservationHref}
              className="rounded-full bg-red-600 px-4 py-2 text-white"
            >
              Request Reservation
            </Link>
          </nav>

          <section className="grid gap-8 py-12 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:py-20">
            <div>
              <BahiaSunsetLogo className="h-20 w-36" tone="subtle" showFallbackText />
              <p className="mt-6 text-[0.66rem] uppercase tracking-[0.3em] text-emerald-200 sm:text-xs sm:tracking-[0.4em]">
                {event.eyebrow}
              </p>
              <h1 className="bahia-display-serif mt-4 text-[clamp(3.6rem,15vw,9rem)] font-semibold leading-[0.84] tracking-[-0.055em] text-amber-50 drop-shadow-[0_0_36px_rgba(225,18,27,.34)]">
                {event.title}
              </h1>
              <div className="mt-5 flex flex-wrap gap-2 text-[0.64rem] uppercase tracking-[0.16em] text-amber-100/75 sm:text-xs">
                <span className="rounded-full border border-amber-100/16 px-3 py-1.5">
                  {event.category}
                </span>
                <span className="rounded-full border border-emerald-200/20 bg-emerald-400/10 px-3 py-1.5 text-emerald-100">
                  {event.status}
                </span>
                {event.genres ? (
                  <span className="rounded-full border border-red-300/20 bg-red-600/10 px-3 py-1.5 text-red-100">
                    {event.genres}
                  </span>
                ) : null}
              </div>
              <p className="mt-6 max-w-3xl text-base leading-8 text-amber-50/74 sm:text-xl sm:leading-9">
                {event.summary}
              </p>
            </div>

            <div className="overflow-hidden rounded-[1.8rem] border border-amber-100/16 bg-[#100606]/88 shadow-[0_30px_95px_rgba(0,0,0,.45)] backdrop-blur">
              {event.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={event.imageUrl}
                  alt={event.imageAlt}
                  className="h-64 w-full object-cover sm:h-80"
                />
              ) : null}
              <div className="p-5 sm:p-7">
                <dl className="grid gap-4 sm:grid-cols-2">
                  {details.map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-amber-100/10 bg-black/22 p-4">
                      <dt className="text-[0.6rem] uppercase tracking-[0.2em] text-amber-200/55">
                        {label}
                      </dt>
                      <dd className="mt-2 text-sm leading-6 text-amber-50">{value}</dd>
                    </div>
                  ))}
                </dl>
                {event.performers ? (
                  <div className="mt-4 rounded-2xl border border-emerald-200/14 bg-emerald-200/[.05] p-4">
                    <p className="text-[0.6rem] uppercase tracking-[0.2em] text-emerald-200/60">
                      Featuring
                    </p>
                    <p className="mt-2 text-base text-amber-50">{event.performers}</p>
                  </div>
                ) : null}
                {event.foodDrinkSpecial ? (
                  <div className="mt-4 rounded-2xl border border-amber-200/14 bg-amber-200/[.05] p-4">
                    <p className="text-[0.6rem] uppercase tracking-[0.2em] text-amber-200/60">
                      Food & drink
                    </p>
                    <p className="mt-2 text-sm leading-6 text-amber-50/76">
                      {event.foodDrinkSpecial}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <section className="grid gap-6 rounded-[1.8rem] border border-amber-100/12 bg-black/35 p-5 backdrop-blur sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-[0.65rem] uppercase tracking-[0.26em] text-red-200">
                Plan your night
              </p>
              <h2 className="mt-2 font-serif text-3xl text-amber-50 sm:text-5xl">
                Request a table for {event.title}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-amber-50/68 sm:text-base">
                The request form already knows the correct event. Availability is confirmed by the venue.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <Link
                href={primaryReservationHref}
                className="rounded-full bg-red-600 px-6 py-4 text-center text-xs font-semibold uppercase tracking-[0.18em] text-white"
              >
                Request Reservation
              </Link>
              <a
                href="tel:2132504313"
                className="rounded-full border border-amber-100/25 px-6 py-4 text-center text-xs font-semibold uppercase tracking-[0.18em] text-amber-100"
              >
                Call Club Bahia
              </a>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
