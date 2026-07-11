import { notFound } from 'next/navigation';
import { EventForm } from '@/components/admin/events/EventUI';
import { createEventRepository } from '@/lib/admin/events/repository';
export default async function EditEvent({params}:{params:Promise<{eventId:string}>}){const {eventId}=await params; const event=await createEventRepository().getEventById(eventId); if(!event) notFound(); return <div className="space-y-5"><h1 className="font-serif text-4xl">Edit {event.title}</h1><EventForm event={event}/></div>}
