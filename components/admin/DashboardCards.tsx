import Link from "next/link";
import type {
  OperationsEvent,
  OperationsTask,
  ReservationRequest,
} from "@/lib/admin/domain";
import { StatusPill } from "./events/StatusPill";
const date = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
});
function Panel({
  title,
  eyebrow,
  children,
  empty,
}: {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
  empty?: boolean;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[.045] p-4">
      <p className="text-xs uppercase tracking-[.24em] text-amber-200/65">
        {eyebrow}
      </p>
      <h2 className="mt-1 font-serif text-2xl">{title}</h2>
      <div className="mt-4">
        {empty ? (
          <p className="text-sm text-white/55">Nothing needs attention.</p>
        ) : (
          children
        )}
      </div>
    </section>
  );
}
function EventList({ events }: { events: OperationsEvent[] }) {
  return (
    <ul className="space-y-3">
      {events.map((e) => (
        <li key={e.id} className="rounded-2xl bg-black/25 p-3">
          <Link
            href={`/admin/events/${e.id}`}
            className="font-medium underline-offset-4 hover:underline"
          >
            {e.title}
          </Link>
          <p className="mt-1 text-xs text-white/60">
            {date.format(new Date(e.startsAt))} · {e.room}
          </p>
          <div className="mt-2">
            <StatusPill status={e.status} />
          </div>
        </li>
      ))}
    </ul>
  );
}
export function TodayCard({ tasks }: { tasks: OperationsTask[] }) {
  return (
    <Panel eyebrow="Due today" title="Today" empty={tasks.length === 0}>
      <ul className="space-y-2">
        {tasks.map((t) => (
          <li key={t.id} className="text-sm">
            {t.title}
          </li>
        ))}
      </ul>
    </Panel>
  );
}
export function UpcomingEventsCard({ events }: { events: OperationsEvent[] }) {
  return (
    <Panel
      eyebrow="Next 14 days"
      title="Upcoming Events"
      empty={events.length === 0}
    >
      <EventList events={events} />
    </Panel>
  );
}
export function AtRiskCard({ events }: { events: OperationsEvent[] }) {
  return (
    <Panel
      eyebrow="Management watchlist"
      title="At Risk"
      empty={events.length === 0}
    >
      <EventList events={events} />
    </Panel>
  );
}
export function EventQueueCard({
  title,
  events,
  href,
}: {
  title: string;
  events: OperationsEvent[];
  href: string;
}) {
  return (
    <Panel eyebrow="Event queue" title={title} empty={events.length === 0}>
      <EventList events={events} />
      <Link
        href={href}
        className="mt-3 inline-block text-sm text-amber-200 underline"
      >
        Open filtered view
      </Link>
    </Panel>
  );
}
export function PendingReservationsCard({
  reservations,
}: {
  reservations: ReservationRequest[];
}) {
  return (
    <Panel
      eyebrow="Guest follow-up"
      title="Pending Requests"
      empty={reservations.length === 0}
    >
      <ul>
        {reservations.map((r) => (
          <li key={r.id} className="text-sm">
            {r.guestName} · {r.status}
          </li>
        ))}
      </ul>
    </Panel>
  );
}
