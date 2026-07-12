import { AiProviderBanner } from '@/components/admin/growth/AiProviderBanner';
import { CampaignAuditPanelClient } from '@/components/admin/growth/CampaignAuditPanelClient';
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
      <CampaignAuditPanelClient eventId={eventId} />
      <EventGrowthWorkspaceClient eventId={eventId} />
    </>
  );
}
