import { EventForm } from '@/components/admin/events/EventForm';
export default async function EditEventPage({ params }: { params: Promise<{ eventId: string }> }){const {eventId}=await params;return <div className="space-y-4"><h1 className="font-serif text-4xl">Edit event</h1><EventForm eventId={eventId}/></div>}
