import { CampaignLaunchClient } from '@/components/admin/publishing/CampaignLaunchClient';
import { CampaignTrackingLinksClient } from '@/components/admin/publishing/CampaignTrackingLinksClient';
import { WebsitePublishClient } from '@/components/admin/publishing/WebsitePublishClient';
import { CampaignWorkflowNav } from '@/components/admin/workflow/CampaignWorkflowNav';

export default async function EventPublishingExecutionPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  return (
    <>
      <CampaignWorkflowNav eventId={eventId} />
      <div className="mb-5">
        <WebsitePublishClient eventId={eventId} />
      </div>
      <div className="mb-5">
        <CampaignTrackingLinksClient eventId={eventId} />
      </div>
      <CampaignLaunchClient eventId={eventId} />
    </>
  );
}
