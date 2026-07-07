import Link from 'next/link';
import { ReservationForm } from './ReservationForm';

const badges = ['21+', 'Dress Code', 'Sunset Blvd', 'Fri & Sat'];

export function ReservationShell() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#050304] px-4 py-5 text-amber-50 sm:px-6 lg:px-8">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(225,18,27,0.28),transparent_28%),radial-gradient(circle_at_80%_0%,rgba(245,158,11,0.18),transparent_30%),linear-gradient(135deg,rgba(255,247,237,0.05),transparent_45%)]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-red-950/35 to-transparent" />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 pb-12 pt-3 sm:pt-6 lg:grid lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-10 lg:pt-12">
        <section className="lg:sticky lg:top-10" aria-labelledby="reservation-title">
          <Link href="/" className="inline-flex min-h-11 items-center rounded-full border border-amber-100/20 px-4 text-xs uppercase tracking-[0.2em] text-amber-100/75 transition hover:border-red-300/60 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-400">
            Back to Club Bahia
          </Link>
          <p className="mt-10 text-xs uppercase tracking-[0.38em] text-red-200">Club Bahia Los Angeles</p>
          <h1 id="reservation-title" className="mt-4 max-w-3xl font-serif text-[clamp(4rem,18vw,9.5rem)] leading-[0.78] tracking-[-0.075em] text-amber-50 drop-shadow-[0_0_30px_rgba(225,18,27,0.35)]">
            Reserve Your Night
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-amber-50/75 sm:text-xl">
            Friday and Saturday reservations at Club Bahia.
          </p>
          <div className="mt-6 flex flex-wrap gap-2" aria-label="Reservation highlights">
            {badges.map((badge) => (
              <span key={badge} className="rounded-full border border-amber-200/20 bg-amber-100/[0.06] px-3 py-2 text-[0.68rem] uppercase tracking-[0.18em] text-amber-100">
                {badge}
              </span>
            ))}
          </div>
          <div className="mt-8 rounded-[1.75rem] border border-amber-100/15 bg-black/25 p-5 text-sm leading-7 text-amber-50/70">
            <p className="font-semibold text-amber-50">Good to know</p>
            <p className="mt-2">This front-end request flow prepares your reservation details for review. Online submission is not connected yet, so calling Club Bahia is still required to confirm.</p>
            <a href="tel:2132504313" className="mt-4 inline-flex min-h-11 items-center rounded-full bg-amber-100 px-5 text-xs font-semibold uppercase tracking-[0.18em] text-[#120607] transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-red-400">
              Call (213) 250-4313
            </a>
          </div>
        </section>
        <ReservationForm />
      </div>
    </main>
  );
}
