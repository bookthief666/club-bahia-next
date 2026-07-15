import { CampaignAuditPanelClient } from '@/components/admin/growth/CampaignAuditPanelClient';
import { PromotionStudioClient } from '@/components/admin/growth/PromotionStudioClient';
import { CampaignWorkflowNav } from '@/components/admin/workflow/CampaignWorkflowNav';

export default async function EventGrowthPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  return (
    <>
      <CampaignWorkflowNav eventId={eventId} />
      <PromotionStudioClient eventId={eventId} />
      <CampaignAuditPanelClient eventId={eventId} />
    </>
  );
}
