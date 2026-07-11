import { CalendarClient } from '@/components/admin/events/CalendarClient';
import { createEventRepository } from '@/lib/admin/events/repository';
export default async function CalendarPage(){const events=await createEventRepository().listEvents(); return <div className="space-y-5"><div><p className="text-xs uppercase tracking-[.32em] text-amber-200/70">America/Los_Angeles</p><h1 className="font-serif text-4xl">Calendar</h1></div><CalendarClient events={events}/></div>}
