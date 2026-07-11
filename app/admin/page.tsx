import { AsyncStatePanels } from "@/components/admin/AsyncStatePanels";
import {
  AtRiskCard,
  EventQueueCard,
  PendingReservationsCard,
  TodayCard,
  UpcomingEventsCard,
} from "@/components/admin/DashboardCards";
import { createCommandCenterRepository } from "@/lib/admin/repository";
import {
  getAtRiskEvents,
  getCancelledEvents,
  getEventsThisWeek,
  getNeedsPromotionEvents,
  getNeedsStaffingEvents,
  getPastDuePreparationEvents,
  getPendingReservations,
  getTodayTasks,
  getUpcomingEvents,
  hasOperationalAttention,
} from "@/lib/admin/selectors";

export default async function AdminDashboardPage() {
  const data = await createCommandCenterRepository().getDashboardData();
  const today = getTodayTasks(data);
  const upcoming = getUpcomingEvents(data);
  const risk = getAtRiskEvents(data);
  const reservations = getPendingReservations(data);
  const thisWeek = getEventsThisWeek(data);
  const promotion = getNeedsPromotionEvents(data);
  const staffing = getNeedsStaffingEvents(data);
  const pastDue = getPastDuePreparationEvents(data);
  const cancelled = getCancelledEvents(data);

  return (
    <div className="space-y-5">
      <section className="rounded-[2rem] border border-amber-200/15 bg-gradient-to-br from-red-950/55 via-black/55 to-emerald-950/25 p-5 shadow-2xl sm:p-6">
        <div className="grid gap-5 min-[700px]:grid-cols-[1.2fr_.8fr]">
          <div>
            <p className="text-xs uppercase tracking-[.34em] text-amber-100/70">
              Milestone 1 · fixture data only
            </p>
            <h1 className="mt-2 max-w-3xl font-serif text-4xl leading-tight sm:text-5xl">
              Dark tropical-noir operations without exposing production data.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/68 sm:text-base">
              This protected development slice uses synthetic records behind an
              isolated mock-auth boundary so Supabase auth can replace it
              without rewriting the dashboard.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-black/35 p-4">
            <p className="text-sm text-white/55">Operational status</p>
            <p className="mt-2 text-3xl font-semibold text-white">
              {hasOperationalAttention(data) ? "Attention needed" : "All clear"}
            </p>
            <p className="mt-2 text-sm text-amber-100/75">
              Generated {new Date(data.generatedAt).toUTCString()}
            </p>
          </div>
        </div>
      </section>
      <AsyncStatePanels />
      <div className="grid gap-5 min-[690px]:grid-cols-2 xl:grid-cols-4">
        <TodayCard tasks={today} />
        <UpcomingEventsCard events={upcoming} />
        <AtRiskCard events={risk} />
        <PendingReservationsCard reservations={reservations} />
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
    </div>
  );
}
