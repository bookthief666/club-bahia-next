import type { Metadata } from 'next';
import { EventsExperience } from '@/components/events/EventsExperience';
import { buildPublicProgramCatalog } from '@/lib/public-events/catalog';
import { listPublicEventCards } from '@/lib/public-events/server';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Live Music & Upcoming Events',
  description:
    'See confirmed Club Bahia events, Azucar LA live Latin weekends, dancing, birthdays, private events, and online reservation requests.',
  openGraph: {
    title: 'Live Music & Upcoming Events | Club Bahia',
    description:
      'Confirmed special events and Azucar LA resident live weekends at Club Bahia on Sunset Boulevard in Los Angeles.',
    url: '/events',
  },
};

export default async function EventsPage() {
  const cards = await listPublicEventCards({
    includePreview: process.env.VERCEL_ENV === 'preview',
  });
  const catalog = buildPublicProgramCatalog(cards);

  return (
    <EventsExperience
      scheduledEvents={catalog.scheduledEvents}
      residentPrograms={catalog.residentPrograms}
      evergreenPrograms={catalog.evergreenPrograms}
    />
  );
}
