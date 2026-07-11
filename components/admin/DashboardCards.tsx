import Link from "next/link";
import type { OperationsEvent, OperationsTask, ReservationRequest } from "@/lib/admin/domain";
import { formatVenueDateTime } from "@/lib/admin/date";
import { StatusPill } from "./events/StatusPill";

function Panel({ title, eyebrow, children, empty, compact = false }: { title: string; eyebrow: string; children: React.ReactNode; empty?: boolean; compact?: boolean }) {
  return <section className="rounded-2xl border border-white/10 bg-[#141210]/75 p-4"><p className="text-[11px] uppercase tracking-[.2em] text-amber-200/60">{eyebrow}</p><h2 className="mt-1 font-serif text-xl">{title}</h2><div className={compact ? "mt-3" : "mt-4"}>{empty ? <p className="text-sm text-white/55">Nothing needs attention.</p> : children}</div></section>;
}
function EventList({ events }: { events: OperationsEvent[] }) {
  return <ul className="divide-y divide-white/10">{events.slice(0, 5).map((e) => <li key={e.id} className="py-2.5 first:pt-0 last:pb-0"><div className="flex items-center justify-between gap-3"><Link href={`/admin/events/${e.id}`} className="min-w-0 truncate text-sm font-medium underline-offset-4 hover:underline">{e.title}</Link><StatusPill status={e.status} /></div><p className="mt-1 text-xs text-white/55">{formatVenueDateTime(e.startsAt)} · {e.room} · {e.ticketsSold}/{e.capacityTarget}</p>{e.riskFlags.length ? <p className="mt-1 text-xs text-amber-100">⚠ {e.riskFlags[0]}</p> : null}</li>)}</ul>;
}
export function MetricTile({ label, value, href }: { label: string; value: string | number; href?: string }) {
  const body = <><p className="text-[11px] uppercase tracking-[.18em] text-white/50">{label}</p><p className="mt-1 text-2xl font-semibold text-white">{value}</p></>;
  return href ? <Link href={href} className="rounded-2xl border border-white/10 bg-[#141210]/80 p-3 hover:border-amber-200/25">{body}</Link> : <div className="rounded-2xl border border-white/10 bg-[#141210]/80 p-3">{body}</div>;
}
export function TodayCard({ tasks }: { tasks: OperationsTask[] }) { return <Panel eyebrow="Action Required" title="Today" empty={tasks.length === 0} compact><ul className="space-y-2">{tasks.map((t) => <li key={t.id} className="rounded-xl bg-black/20 p-2 text-sm"><span className={t.priority === "urgent" ? "text-red-200" : "text-white/85"}>{t.title}</span><p className="text-xs text-white/45">{t.owner}</p></li>)}</ul></Panel>; }
export function UpcomingEventsCard({ events }: { events: OperationsEvent[] }) { return <Panel eyebrow="Next 14 days" title="Upcoming Events" empty={events.length === 0}><EventList events={events} /></Panel>; }
export function AtRiskCard({ events }: { events: OperationsEvent[] }) { return <Panel eyebrow="Watchlist" title="At Risk" empty={events.length === 0}><EventList events={events} /></Panel>; }
export function EventQueueCard({ title, events, href }: { title: string; events: OperationsEvent[]; href: string }) { return <details className="rounded-2xl border border-white/10 bg-[#11100e]/70 p-3"><summary className="cursor-pointer list-none text-sm font-semibold text-white/80">{title} <span className="text-white/45">({events.length})</span></summary><div className="mt-3"><EventList events={events} /><Link href={href} className="mt-3 inline-block text-xs font-semibold text-amber-200 underline">Open filtered view</Link></div></details>; }
export function PendingReservationsCard({ reservations }: { reservations: ReservationRequest[] }) { return <Panel eyebrow="Guest follow-up" title="Pending Reservations" empty={reservations.length === 0}><ul className="space-y-2">{reservations.slice(0, 5).map((r) => <li key={r.id} className="flex items-center justify-between gap-3 rounded-xl bg-black/20 p-2 text-sm"><span>{r.guestName}</span><span className="text-xs text-white/55">{r.partySize} · {r.status}</span></li>)}</ul></Panel>; }
