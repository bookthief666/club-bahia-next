import { AsyncStatePanels } from "@/components/admin/AsyncStatePanels";
import {
  AtRiskCard,
  EventQueueCard,
  MetricTile,
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
    <div className="space-y-4">
      <section className="rounded-2xl border border-white/10 bg-[#141210]/80 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[.24em] text-amber-200/65">Operating console</p>
            <h1 className="mt-1 font-serif text-2xl sm:text-3xl">{hasOperationalAttention(data) ? "Action required" : "All clear"}</h1>
          </div>
          <p className="text-xs text-white/55">Updated {new Date(data.generatedAt).toUTCString().replace(/:\d{2} GMT$/, " GMT")}</p>
        </div>
      </section>
      <AsyncStatePanels />
      <div className="grid gap-3 min-[520px]:grid-cols-2 lg:grid-cols-4">
        <MetricTile label="Action Required" value={today.length} />
        <MetricTile label="Next Event" value={upcoming[0]?.title ?? "None"} href={upcoming[0] ? `/admin/events/${upcoming[0].id}` : undefined} />
        <MetricTile label="Pending Reservations" value={reservations.length} />
        <MetricTile label="At Risk" value={risk.length} href="/admin/events?risk=promotion" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr] xl:grid-cols-[1fr_1fr_1fr]">
        <TodayCard tasks={today} />
        <UpcomingEventsCard events={upcoming} />
        <AtRiskCard events={risk} />
        <PendingReservationsCard reservations={reservations} />
      </div>
      <section className="space-y-2 rounded-2xl border border-white/10 bg-black/20 p-3">
        <p className="text-[11px] uppercase tracking-[.22em] text-amber-200/60">Secondary operational queues</p>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          <EventQueueCard title="Events This Week" events={thisWeek} href="/admin/events?date=this-week" />
          <EventQueueCard title="Needs Promotion" events={promotion} href="/admin/events?risk=promotion" />
          <EventQueueCard title="Needs Staffing" events={staffing} href="/admin/events?risk=staffing" />
          <EventQueueCard title="Past Due Preparation" events={pastDue} href="/admin/events?risk=past-due" />
          <EventQueueCard title="Cancelled Events" events={cancelled} href="/admin/events?status=cancelled&archive=all" />
        </div>
      </section>
    </div>
  );
}
