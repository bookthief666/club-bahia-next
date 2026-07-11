import type { OperationsEvent, OperationsTask, ReservationRequest } from '@/lib/admin/domain';

const date = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'UTC' });

function Panel({ id, title, eyebrow, children, empty }: { id: string; title: string; eyebrow: string; children: React.ReactNode; empty: boolean }) {
  return <section id={id} className="rounded-[1.75rem] border border-white/10 bg-black/45 p-5 shadow-[0_24px_80px_rgba(0,0,0,.35)] backdrop-blur-xl">
    <div className="mb-4 flex items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-[.28em] text-amber-200/65">{eyebrow}</p><h3 className="mt-1 font-serif text-2xl text-white">{title}</h3></div><span className="rounded-full border border-red-300/30 bg-red-500/10 px-3 py-1 text-xs text-red-100">Live demo</span></div>
    {empty ? <p className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm text-emerald-50">Nothing needs attention in this section.</p> : children}
  </section>;
}

export function TodayCard({ tasks }: { tasks: OperationsTask[] }) { return <Panel id="today" eyebrow="One-handed priority list" title="Today" empty={tasks.length === 0}><ul className="space-y-3">{tasks.map(t => <li key={t.id} className="rounded-2xl bg-white/[.06] p-4"><div className="flex justify-between gap-3"><p className="font-medium">{t.title}</p><span className="text-xs uppercase text-amber-100">{t.priority}</span></div><p className="mt-2 text-sm text-white/55">Due {date.format(new Date(t.dueAt))} · {t.owner}</p></li>)}</ul></Panel>; }

export function UpcomingEventsCard({ events }: { events: OperationsEvent[] }) { return <Panel id="events" eyebrow="Next 14 days" title="Upcoming Events" empty={events.length === 0}><ul className="space-y-3">{events.map(e => <li key={e.id} className="rounded-2xl bg-white/[.06] p-4"><p className="font-medium">{e.title}</p><p className="mt-1 text-sm text-white/60">{date.format(new Date(e.startsAt))} · {e.room}</p><div className="mt-3 h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-gradient-to-r from-red-500 to-amber-300" style={{ width: `${Math.min(100, Math.round((e.ticketsSold / e.capacityTarget) * 100))}%` }} /></div></li>)}</ul></Panel>; }

export function AtRiskCard({ events }: { events: OperationsEvent[] }) { return <Panel id="risk" eyebrow="Management watchlist" title="At Risk" empty={events.length === 0}><ul className="space-y-3">{events.map(e => <li key={e.id} className="rounded-2xl border border-red-300/15 bg-red-500/[.08] p-4"><p className="font-medium">{e.title}</p><p className="mt-1 text-sm text-white/60">{e.ticketsSold}/{e.capacityTarget} advance · ${e.committedCosts.toLocaleString()} committed</p><div className="mt-3 flex flex-wrap gap-2">{e.riskFlags.map(flag => <span key={flag} className="rounded-full bg-black/40 px-3 py-1 text-xs text-red-50">{flag}</span>)}</div></li>)}</ul></Panel>; }

export function PendingReservationsCard({ reservations }: { reservations: ReservationRequest[] }) { return <Panel id="requests" eyebrow="Response queue" title="Pending Reservations" empty={reservations.length === 0}><ul className="space-y-3">{reservations.map(r => <li key={r.id} className="rounded-2xl bg-white/[.06] p-4"><div className="flex justify-between gap-3"><p className="font-medium">{r.guestName}</p><span className="text-xs uppercase text-amber-100">{r.status}</span></div><p className="mt-2 text-sm text-white/55">Party of {r.partySize} · {r.occasion} · {r.source}</p></li>)}</ul></Panel>; }
