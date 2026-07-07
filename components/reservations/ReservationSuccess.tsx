import Link from 'next/link';
import type { ReservationFormValues } from '@/lib/reservations/reservation-schema';
import { ReservationSummary } from './ReservationSummary';
import { BahiaSunsetLogo } from '@/components/experience/BahiaSunsetLogo';

export function ReservationSuccess({ values, onEdit }: { values: ReservationFormValues; onEdit: () => void }) {
  return (
    <section aria-labelledby="reservation-ready-title" className="rounded-[1.55rem] border border-red-400/30 bg-[#120607]/90 p-4 shadow-[0_0_70px_rgba(225,18,27,0.18)] sm:rounded-[2rem] sm:p-8">
      <div className="rounded-[1.2rem] border border-dashed border-amber-200/20 bg-black/20 p-4 sm:rounded-[1.5rem] sm:p-6">
        <div className="flex flex-col gap-2 border-b border-dotted border-amber-100/20 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <BahiaSunsetLogo className="mb-3 h-14 w-28" showFallbackText />
            <p className="text-[0.66rem] uppercase tracking-[0.26em] text-red-200 sm:text-xs sm:tracking-[0.32em]">Review</p>
            <h2 id="reservation-ready-title" className="mt-2 font-serif text-[2.65rem] leading-none tracking-[-0.04em] text-amber-50 sm:text-6xl">
              Reservation Request Ready
            </h2>
          </div>
          <p className="text-[0.64rem] uppercase tracking-[0.16em] text-amber-100/65 sm:text-sm sm:tracking-[0.18em]">Ticket No. 1974</p>
        </div>
        <p className="mt-4 max-w-2xl text-base leading-7 text-amber-50/75">
          Online confirmation is coming next. Please call Club Bahia to confirm this reservation.
        </p>
        <div className="mt-6">
          <ReservationSummary values={values} />
        </div>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <a href="tel:2132504313" className="rounded-full bg-red-600 px-6 py-4 text-center text-sm font-semibold uppercase tracking-[0.18em] text-white shadow-[0_0_34px_rgba(225,18,27,0.35)] transition hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-400">
            Call Club Bahia
          </a>
          <button type="button" onClick={onEdit} className="rounded-full border border-amber-100/25 px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-amber-50 transition hover:border-amber-100/60 hover:bg-amber-100/10 focus:outline-none focus:ring-2 focus:ring-red-400">
            Edit Request
          </button>
          <Link href="/" className="rounded-full border border-amber-100/15 px-6 py-4 text-center text-sm font-semibold uppercase tracking-[0.18em] text-amber-50/80 transition hover:border-amber-100/50 hover:bg-amber-100/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-400">
            Back to Club Bahia
          </Link>
        </div>
      </div>
    </section>
  );
}
