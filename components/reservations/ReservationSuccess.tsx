import type { ReservationFormValues } from '@/lib/reservations/reservation-schema';
import { ReservationSummary } from './ReservationSummary';

export function ReservationSuccess({ values, onEdit }: { values: ReservationFormValues; onEdit: () => void }) {
  return (
    <section aria-labelledby="reservation-ready-title" className="rounded-[2rem] border border-red-400/30 bg-[#120607]/90 p-5 shadow-[0_0_70px_rgba(225,18,27,0.18)] sm:p-8">
      <p className="text-xs uppercase tracking-[0.32em] text-red-200">Review</p>
      <h2 id="reservation-ready-title" className="mt-3 font-serif text-4xl leading-none tracking-[-0.04em] text-amber-50 sm:text-6xl">
        Reservation Request Ready
      </h2>
      <p className="mt-4 max-w-2xl text-base leading-7 text-amber-50/75">
        Online submission is not connected yet. For now, please call Club Bahia to confirm your reservation.
      </p>
      <div className="mt-6">
        <ReservationSummary values={values} />
      </div>
      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <a href="tel:2132504313" className="rounded-full bg-red-600 px-6 py-4 text-center text-sm font-semibold uppercase tracking-[0.18em] text-white shadow-[0_0_34px_rgba(225,18,27,0.35)] transition hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-400">
          Call Club Bahia
        </a>
        <button type="button" onClick={onEdit} className="rounded-full border border-amber-100/25 px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-amber-50 transition hover:border-amber-100/60 hover:bg-amber-100/10 focus:outline-none focus:ring-2 focus:ring-red-400">
          Edit Request
        </button>
      </div>
    </section>
  );
}
