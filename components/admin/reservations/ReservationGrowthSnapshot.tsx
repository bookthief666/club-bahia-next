import Link from 'next/link';
import type {
  ReservationAnalytics,
  ReservationBreakdownItem,
} from '@/lib/reservations/analytics';

function BreakdownRows({
  items,
  emptyLabel,
}: {
  items: ReservationBreakdownItem[];
  emptyLabel: string;
}) {
  if (!items.length) {
    return <p className="mt-4 text-sm text-white/42">{emptyLabel}</p>;
  }

  const max = Math.max(...items.map((item) => item.requests), 1);

  return (
    <div className="mt-4 space-y-3">
      {items.map((item) => (
        <div key={item.label}>
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="min-w-0 truncate font-semibold text-white/72">
              {item.label}
            </span>
            <span className="shrink-0 text-white/42">
              {item.requests} request{item.requests === 1 ? '' : 's'} · {item.guests}{' '}
              guests
            </span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/7">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#34d399,#f6b73c,#e1121b)]"
              style={{ width: `${Math.max(8, (item.requests / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ReservationGrowthSnapshot({
  analytics,
  configured,
}: {
  analytics: ReservationAnalytics;
  configured: boolean;
}) {
  return (
    <section className="relative overflow-hidden rounded-[1.65rem] border border-emerald-200/14 bg-[radial-gradient(circle_at_88%_0%,rgba(16,185,129,.18),transparent_24rem),radial-gradient(circle_at_5%_100%,rgba(225,18,27,.1),transparent_24rem),linear-gradient(145deg,rgba(12,24,20,.94),rgba(18,13,11,.96))] p-5 shadow-[0_24px_80px_rgba(0,0,0,.35)] sm:p-6">
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-emerald-200/68">
            Reservation growth
          </p>
          <h2 className="mt-2 font-serif text-3xl text-white sm:text-4xl">
            From promotion to confirmed guests
          </h2>
          <p className="mt-2 text-sm leading-6 text-white/54">
            See which events and campaign links are producing real reservation requests—not just likes or views.
          </p>
        </div>
        <Link
          href="/admin/reservations"
          className="inline-flex min-h-11 items-center rounded-full border border-emerald-200/22 bg-emerald-200/[.08] px-5 text-sm font-bold text-emerald-100"
        >
          Open reservation inbox →
        </Link>
      </div>

      {!configured ? (
        <div className="relative mt-5 rounded-2xl border border-amber-200/18 bg-amber-200/[.06] p-4 text-sm leading-6 text-amber-50/72">
          Reservation storage is not configured in this environment yet. The dashboard will populate automatically after the encrypted RSVP intake is enabled.
        </div>
      ) : null}

      <div className="relative mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {[
          ['New', analytics.newRequests, 'text-violet-100'],
          ['Today', analytics.requestsToday, 'text-sky-100'],
          ['This week', analytics.requestsThisWeek, 'text-amber-100'],
          ['Confirmed', analytics.confirmedRequests, 'text-emerald-100'],
          ['Confirmed guests', analytics.confirmedGuests, 'text-emerald-100'],
          ['Confirmation rate', `${analytics.confirmationRate}%`, 'text-white'],
        ].map(([label, value, color]) => (
          <div key={String(label)} className="rounded-2xl border border-white/9 bg-black/22 p-3">
            <p className="text-[10px] uppercase tracking-[.14em] text-white/36">
              {label}
            </p>
            <p className={`mt-1 text-2xl font-semibold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="relative mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/9 bg-black/20 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-amber-100/55">
                Where requests came from
              </p>
              <h3 className="mt-1 text-lg font-semibold text-white">Campaign sources</h3>
            </div>
            <span className="text-xs text-white/38">
              {analytics.totalRequests} total
            </span>
          </div>
          <BreakdownRows
            items={analytics.topSources}
            emptyLabel="Source data will appear after tracked RSVP links receive submissions."
          />
        </div>

        <div className="rounded-2xl border border-white/9 bg-black/20 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-emerald-100/55">
                What people requested
              </p>
              <h3 className="mt-1 text-lg font-semibold text-white">Events driving interest</h3>
            </div>
            <span className="text-xs text-white/38">
              {analytics.requestedGuests} guests requested
            </span>
          </div>
          <BreakdownRows
            items={analytics.topEvents}
            emptyLabel="Event demand will appear after the first reservation request."
          />
        </div>
      </div>
    </section>
  );
}
