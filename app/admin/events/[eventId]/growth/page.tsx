import { AiProviderBanner } from '@/components/admin/growth/AiProviderBanner';
import { EventGrowthWorkspaceClient } from '@/components/admin/growth/EventGrowthWorkspaceClient';

export default async function EventGrowthPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  return (
    <>
      <AiProviderBanner />
      <EventGrowthWorkspaceClient eventId={eventId} />
    </>
  );
}
