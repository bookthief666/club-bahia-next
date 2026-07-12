import { CampaignPostAssemblyClient } from '@/components/admin/publishing/CampaignPostAssemblyClient';

export default async function EventPublishingPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  return <CampaignPostAssemblyClient eventId={eventId} />;
}
