import Link from 'next/link';
import type { ReservationReceipt } from '@/lib/reservations/domain';
import type { ReservationFormValues } from '@/lib/reservations/reservation-schema';
import { ReservationSummary } from './ReservationSummary';
import { BahiaSunsetLogo } from '@/components/experience/BahiaSunsetLogo';

export function ReservationSuccess({
  values,
  receipt,
  onNewRequest,
}: {
  values: ReservationFormValues;
  receipt: ReservationReceipt;
  onNewRequest: () => void;
}) {
  return (
    <section
      aria-labelledby="reservation-ready-title"
      className="rounded-[1.55rem] border border-emerald-300/25 bg-[#08110d]/94 p-4 shadow-[0_0_80px_rgba(16,185,129,0.14)] sm:rounded-[2rem] sm:p-8"
    >
      <div className="rounded-[1.2rem] border border-dashed border-emerald-200/20 bg-black/20 p-4 sm:rounded-[1.5rem] sm:p-6">
        <div className="flex flex-col gap-3 border-b border-dotted border-amber-100/20 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <BahiaSunsetLogo className="mb-3 h-14 w-28" showFallbackText />
            <p className="text-[0.66rem] uppercase tracking-[0.26em] text-emerald-200 sm:text-xs sm:tracking-[0.32em]">
              Request received
            </p>
            <h2
              id="reservation-ready-title"
              className="mt-2 font-serif text-[2.65rem] leading-none tracking-[-0.04em] text-amber-50 sm:text-6xl"
            >
              We Have Your Request
            </h2>
          </div>
          <div className="rounded-2xl border border-emerald-200/18 bg-emerald-200/[0.07] px-4 py-3 sm:text-right">
            <p className="text-[0.58rem] uppercase tracking-[0.2em] text-emerald-100/60">
              Request number
            </p>
            <p className="mt-1 font-mono text-sm font-semibold text-emerald-100">
              {receipt.id}
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-amber-200/15 bg-amber-100/[0.05] p-4 text-sm leading-6 text-amber-50/76">
          <p className="font-semibold text-amber-50">
            This is a reservation request, not a guaranteed table confirmation.
          </p>
          <p className="mt-2">
            The Club Bahia team can now review the date, party size, and event details. Keep your request number for reference. For urgent or same-day plans, call the venue directly.
          </p>
        </div>

        <div className="mt-6">
          <ReservationSummary values={values} />
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <a
            href="tel:2132504313"
            className="rounded-full bg-red-600 px-6 py-4 text-center text-sm font-semibold uppercase tracking-[0.18em] text-white shadow-[0_0_34px_rgba(225,18,27,0.35)] transition hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            Call Club Bahia
          </a>
          <button
            type="button"
            onClick={onNewRequest}
            className="rounded-full border border-amber-100/25 px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-amber-50 transition hover:border-amber-100/60 hover:bg-amber-100/10 focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            Make Another Request
          </button>
          <Link
            href="/events"
            className="rounded-full border border-amber-100/15 px-6 py-4 text-center text-sm font-semibold uppercase tracking-[0.18em] text-amber-50/80 transition hover:border-amber-100/50 hover:bg-amber-100/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            View Events
          </Link>
        </div>
      </div>
    </section>
  );
}
