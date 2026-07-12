import type { Metadata } from 'next';
import { EventsExperience } from '@/components/events/EventsExperience';
import { listPublicEventCards } from '@/lib/public-events/server';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Upcoming Events',
  description:
    'Explore upcoming Club Bahia events, live music, dance nights, birthdays, private events, and online reservation requests.',
  openGraph: {
    title: 'Upcoming Events | Club Bahia',
    description:
      'Upcoming Club Bahia programming and reservation-ready events on Sunset Boulevard in Los Angeles.',
    url: '/events',
  },
};

export default async function EventsPage() {
  const events = await listPublicEventCards({
    includePreview: process.env.VERCEL_ENV === 'preview',
  });

  return <EventsExperience events={events} />;
}
