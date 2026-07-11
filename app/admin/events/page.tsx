import Link from 'next/link';
import { EventListClient } from '@/components/admin/events/EventUI';
import { createEventRepository } from '@/lib/admin/events/repository';
export default async function EventsPage(){const events=await createEventRepository().listEvents(); return <div className="space-y-5"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs uppercase tracking-[.32em] text-amber-200/70">Milestone 2</p><h1 className="font-serif text-4xl">Events</h1></div><Link className="rounded-2xl bg-red-600 px-5 py-3 font-bold" href="/admin/events/new">Create event</Link></div><EventListClient initialEvents={events}/></div>}
