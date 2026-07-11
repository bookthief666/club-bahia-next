import { Suspense } from 'react';import { EventListClient } from '@/components/admin/events/EventListClient';
export default function EventsPage(){return <Suspense fallback={<p>Loading events…</p>}><EventListClient/></Suspense>}
