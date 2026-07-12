import { ExperienceShell } from '@/components/experience/ExperienceShell';
import { listPublicEventCards } from '@/lib/public-events/server';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const events = await listPublicEventCards({
    includePreview: process.env.VERCEL_ENV === 'preview',
  });
  const featuredEvent = events.find((event) => event.isFeatured) ?? events[0] ?? null;

  return <ExperienceShell featuredEvent={featuredEvent} />;
}
