import Link from "next/link";
import type { OperationsEvent } from "@/lib/admin/domain";
import { StatusPill } from "./StatusPill";
export function EventCard({ event }: { event: OperationsEvent }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/[.04] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-2xl">
            <Link href={`/admin/events/${event.id}`}>{event.title}</Link>
          </h3>
          <p className="mt-1 text-sm text-white/65">
            {new Date(event.startsAt).toLocaleString()} · {event.room}
          </p>
        </div>
        <StatusPill status={event.status} />
      </div>
      <p className="mt-3 text-sm text-white/70">{event.concept}</p>
    </article>
  );
}
