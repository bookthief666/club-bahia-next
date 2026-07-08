import Image from 'next/image';
import Link from 'next/link';
import { bahiaAssets } from '@/lib/assets/bahia-assets';
import { ReservationForm } from './ReservationForm';
import { getEventTitleBySlug } from '@/lib/events/bahia-events';
import { BahiaSunsetLogo } from '@/components/experience/BahiaSunsetLogo';

const badges = ['21+', 'Dress Code', 'Sunset Blvd', 'Fri & Sat'];

export function ReservationShell({ eventSlug }: { eventSlug?: string }) {
  const eventTitle = eventSlug ? getEventTitleBySlug(eventSlug) ?? eventSlug.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : null;

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#050304] px-4 py-5 text-amber-50 sm:px-6 lg:px-8">
      <Image src={bahiaAssets.redLoungeNeonRoom.src} alt="" fill sizes="100vw" className="pointer-events-none absolute inset-0 object-cover object-center opacity-24 saturate-125" aria-hidden="true" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(5,3,4,0.96),rgba(5,3,4,0.76)_52%,rgba(5,3,4,0.98)),linear-gradient(180deg,rgba(5,3,4,0.82),rgba(5,3,4,0.94)),radial-gradient(circle_at_20%_10%,rgba(225,18,27,0.28),transparent_28%),radial-gradient(circle_at_80%_0%,rgba(245,158,11,0.18),transparent_30%),linear-gradient(135deg,rgba(255,247,237,0.05),transparent_45%)]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-red-950/35 to-transparent" />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-5 pb-10 pt-1 sm:gap-8 sm:pt-6 lg:grid lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-10 lg:pt-12">
        <section className="lg:sticky lg:top-10" aria-labelledby="reservation-title">
          <Link href="/" className="inline-flex min-h-10 items-center rounded-full border border-amber-100/20 px-3.5 text-[0.68rem] uppercase tracking-[0.18em] text-amber-100/75 transition hover:border-red-300/60 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-400 sm:min-h-11 sm:px-4 sm:text-xs sm:tracking-[0.2em]">
            Back to Club Bahia
          </Link>
          <BahiaSunsetLogo className="mt-6 h-16 w-32 sm:mt-10 sm:h-20 sm:w-36" tone="subtle" showFallbackText />
          <p className="mt-4 text-[0.68rem] uppercase tracking-[0.3em] text-red-200 sm:text-xs sm:tracking-[0.38em]">Club Bahia Los Angeles</p>
          <h1 id="reservation-title" className="mt-3 max-w-3xl font-serif text-[clamp(4rem,18vw,7rem)] font-semibold leading-[0.85] tracking-[-0.075em] text-amber-50 drop-shadow-[0_0_30px_rgba(225,18,27,0.35)] sm:mt-4 sm:text-[clamp(5.5rem,14vw,9.5rem)] sm:leading-[0.78] sm:tracking-[-0.085em]">
            Reserve Your Night
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-amber-50/75 sm:mt-5 sm:text-xl sm:leading-8">
            Friday and Saturday reservations at Club Bahia.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 sm:mt-6" aria-label="Reservation highlights">
            {badges.map((badge) => (
              <span key={badge} className="rounded-full border border-amber-200/20 bg-amber-100/[0.06] px-2.5 py-1.5 text-[0.62rem] uppercase tracking-[0.16em] text-amber-100 sm:px-3 sm:py-2 sm:text-[0.68rem] sm:tracking-[0.18em]">
                {badge}
              </span>
            ))}
          </div>
          <div className="mt-5 rounded-[1.5rem] border border-amber-100/15 bg-black/25 p-4 text-sm leading-6 text-amber-50/70 sm:mt-8 sm:rounded-[1.75rem] sm:p-5 sm:leading-7">
            <p className="font-semibold text-amber-50">Good to know</p>
            <p className="mt-2">Prepare your reservation details here, then call Club Bahia to confirm your night. Online reservation submission is coming next.</p>
            <a href="tel:2132504313" className="mt-4 inline-flex min-h-11 items-center rounded-full bg-amber-100 px-5 text-xs font-semibold uppercase tracking-[0.18em] text-[#120607] transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-red-400">
              Call (213) 250-4313
            </a>
          </div>
        </section>
        <ReservationForm eventTitle={eventTitle} />
      </div>
    </main>
  );
}
