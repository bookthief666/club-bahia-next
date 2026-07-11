import Link from "next/link";
import type { OperationsEvent } from "@/lib/admin/domain";
import { formatVenueDateTime } from "@/lib/admin/date";
import { StatusPill } from "./StatusPill";
export function EventCard({ event }: { event: OperationsEvent }) {
  const fill = event.capacityTarget ? Math.round((event.ticketsSold / event.capacityTarget) * 100) : 0;
  return (
    <article className="rounded-2xl border border-white/10 bg-[#141210]/75 p-3">
      <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold"><Link href={`/admin/events/${event.id}`}>{event.title}</Link></h3>
          <p className="mt-1 text-xs text-white/60">{formatVenueDateTime(event.startsAt)} · {event.room} · {event.ticketsSold}/{event.capacityTarget} ({fill}%)</p>
        </div>
        <div className="flex items-center gap-2"><StatusPill status={event.status} />{event.riskFlags.length ? <span className="rounded-full bg-amber-200/10 px-2 py-1 text-xs text-amber-100">⚠ Action</span> : null}</div>
      </div>
    </article>
  );
}
