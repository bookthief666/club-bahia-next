import { ExperienceShell } from '@/components/experience/ExperienceShell';
import { buildPublicProgramCatalog } from '@/lib/public-events/catalog';
import { listPublicEventCards } from '@/lib/public-events/server';

export const dynamic = 'force-dynamic';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ empty?: string }>;
}) {
  const query = await searchParams;
  const cards = await listPublicEventCards({
    includePreview: process.env.VERCEL_ENV === 'preview',
  });
  const catalog = buildPublicProgramCatalog(cards);
  const forceEmpty =
    process.env.VERCEL_ENV === 'preview' && query.empty === '1';
  const featuredEvent = forceEmpty ? null : catalog.scheduledEvents[0] ?? null;
  const residentProgram =
    catalog.residentPrograms.find(
      (program) => program.slug === 'azucar-la-live-weekends',
    ) ??
    catalog.residentPrograms[0] ??
    null;

  return (
    <ExperienceShell
      featuredEvent={featuredEvent}
      residentProgram={residentProgram}
    />
  );
}
