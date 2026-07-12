import { CampaignLaunchClient } from '@/components/admin/publishing/CampaignLaunchClient';
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
      <CampaignLaunchClient eventId={eventId} />
    </>
  );
}
