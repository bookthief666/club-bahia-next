import { EventDetailClient } from '@/components/admin/events/EventDetailClient';
export default async function EventPage({ params }: { params: Promise<{ eventId: string }> }){const {eventId}=await params;return <EventDetailClient eventId={eventId}/>}
