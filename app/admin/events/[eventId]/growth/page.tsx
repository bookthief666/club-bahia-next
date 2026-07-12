import { AiProviderBanner } from '@/components/admin/growth/AiProviderBanner';
import { CampaignAuditPanelClient } from '@/components/admin/growth/CampaignAuditPanelClient';
import { CampaignOverviewGuideClient } from '@/components/admin/growth/CampaignOverviewGuideClient';
import { EventGrowthWorkspaceClient } from '@/components/admin/growth/EventGrowthWorkspaceClient';
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
      <CampaignOverviewGuideClient eventId={eventId} />
      <AiProviderBanner />
      <CampaignAuditPanelClient eventId={eventId} />
      <div id="campaign-workspace" className="scroll-mt-28">
        <EventGrowthWorkspaceClient eventId={eventId} />
      </div>
    </>
  );
}
