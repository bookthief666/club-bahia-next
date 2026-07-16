import Link from 'next/link';
import { AsyncStatePanels } from '@/components/admin/AsyncStatePanels';
import {
  AtRiskCard,
  EventQueueCard,
  MetricTile,
  TodayCard,
  UpcomingEventsCard,
} from '@/components/admin/DashboardCards';
import { AutopilotTodayClient } from '@/components/admin/publishing/AutopilotTodayClient';
import { PromotionReviewInboxClient } from '@/components/admin/review/PromotionReviewInboxClient';
import { ReservationGrowthSnapshot } from '@/components/admin/reservations/ReservationGrowthSnapshot';
import { createCommandCenterRepository } from '@/lib/admin/repository';
import {
  getAtRiskEvents,
  getCancelledEvents,
  getEventsThisWeek,
  getNeedsPromotionEvents,
  getNeedsStaffingEvents,
  getPastDuePreparationEvents,
  getTodayTasks,
  getUpcomingEvents,
  hasOperationalAttention,
} from '@/lib/admin/selectors';
import { buildReservationAnalytics } from '@/lib/reservations/analytics';
import {
  isReservationStorageConfigured,
  listStoredReservations,
} from '@/lib/reservations/server';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  if (view === 'review') {
    return <PromotionReviewInboxClient />;
  }

  const [data, websiteReservations] = await Promise.all([
    createCommandCenterRepository().getDashboardData(),
    listStoredReservations(),
  ]);
  const today = getTodayTasks(data);
  const upcoming = getUpcomingEvents(data);
  const risk = getAtRiskEvents(data);
  const thisWeek = getEventsThisWeek(data);
  const promotion = getNeedsPromotionEvents(data);
  const staffing = getNeedsStaffingEvents(data);
  const pastDue = getPastDuePreparationEvents(data);
  const cancelled = getCancelledEvents(data);
  const reservationAnalytics = buildReservationAnalytics(websiteReservations);
  const needsAttention =
    hasOperationalAttention(data) || reservationAnalytics.newRequests > 0;

  return (
    <div className="space-y-5">
      <section className="rounded-[1.45rem] border border-white/10 bg-[linear-gradient(145deg,rgba(17,20,17,.92),rgba(20,13,11,.94))] p-4 shadow-[0_20px_65px_rgba(0,0,0,.28)] sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[.24em] text-emerald-200/65">
              Growth and operations
            </p>
            <h1 className="mt-1 font-serif text-3xl text-white sm:text-4xl">
              {needsAttention ? 'What needs attention' : 'Club Bahia is on track'}
            </h1>
            <p className="mt-2 text-sm leading-6 text-white/48">
              Promotion, guest requests, and event preparation in one view.
            </p>
          </div>
          <p className="text-xs text-white/42">
            Updated{' '}
            {new Date(data.generatedAt)
              .toUTCString()
              .replace(/:\d{2} GMT$/, ' GMT')}
          </p>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-white/8 pt-4">
          <Link
            href="/admin/overview"
            className="inline-flex min-h-11 items-center rounded-full bg-amber-300 px-5 text-sm font-bold text-black"
          >
            Owner overview →
          </Link>
          <Link
            href="/admin?view=review"
            className="inline-flex min-h-11 items-center rounded-full border border-cyan-200/20 bg-cyan-200/[.07] px-5 text-sm font-bold text-cyan-100"
          >
            Promotion review inbox
          </Link>
          <p className="max-w-2xl text-xs leading-5 text-white/40">
            Use the owner overview for a concise business walkthrough, or open the review inbox for daily cross-event work.
          </p>
        </div>
      </section>

      <AsyncStatePanels />
      <AutopilotTodayClient />

      <div className="grid gap-3 min-[520px]:grid-cols-2 lg:grid-cols-4">
        <MetricTile label="Action Required" value={today.length} />
        <MetricTile
          label="Next Event"
          value={upcoming[0]?.title ?? 'None'}
          href={upcoming[0] ? `/admin/events/${upcoming[0].id}` : undefined}
        />
        <MetricTile
          label="New Reservation Requests"
          value={reservationAnalytics.newRequests}
          href="/admin/reservations"
        />
        <MetricTile
          label="Events At Risk"
          value={risk.length}
          href="/admin/events?risk=promotion"
        />
      </div>

      <ReservationGrowthSnapshot
        analytics={reservationAnalytics}
        configured={isReservationStorageConfigured()}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <TodayCard tasks={today} />
        <UpcomingEventsCard events={upcoming} />
        <AtRiskCard events={risk} />
      </div>

      <section className="space-y-3 rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
        <div>
          <p className="text-[11px] uppercase tracking-[.22em] text-amber-200/60">
            Supporting event work
          </p>
          <p className="mt-1 text-sm text-white/42">
            Secondary queues remain available without competing with the main growth and reservation actions.
          </p>
        </div>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          <EventQueueCard
            title="Events This Week"
            events={thisWeek}
            href="/admin/events?date=this-week"
          />
          <EventQueueCard
            title="Needs Promotion"
            events={promotion}
            href="/admin/events?risk=promotion"
          />
          <EventQueueCard
            title="Needs Staffing"
            events={staffing}
            href="/admin/events?risk=staffing"
          />
          <EventQueueCard
            title="Past Due Preparation"
            events={pastDue}
            href="/admin/events?risk=past-due"
          />
          <EventQueueCard
            title="Cancelled Events"
            events={cancelled}
            href="/admin/events?status=cancelled&archive=all"
          />
        </div>
      </section>
    </div>
  );
}
