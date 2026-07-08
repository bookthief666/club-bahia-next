import type { Metadata } from 'next';
import { EventsExperience } from '@/components/events/EventsExperience';

export const metadata: Metadata = {
  title: 'Upcoming Events',
  description: 'Explore editable Club Bahia event placeholders for live music, the kitchen, dance-floor nights, private events, and reservation inquiries.',
  openGraph: {
    title: 'Upcoming Events | Club Bahia',
    description: 'Live music, hot kitchen, and big dance-floor weekend nights at Club Bahia on Sunset Boulevard.',
    url: '/events',
  },
};

export default function EventsPage() {
  return <EventsExperience />;
}
