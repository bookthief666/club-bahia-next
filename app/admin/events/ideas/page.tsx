import { redirect } from 'next/navigation';
import { EventIdeaStudioClient } from '@/components/admin/events/EventIdeaStudioClient';

export default function EventIdeaStudioPage() {
  if (process.env.EVENT_IDEA_STUDIO_ENABLED !== 'true') {
    redirect('/admin/events');
  }

  return <EventIdeaStudioClient />;
}
