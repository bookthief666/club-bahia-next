import { PrepareCampaignPostsClient } from '@/components/admin/publishing/PrepareCampaignPostsClient';
import { ConversionLinkQuickFixClient } from '@/components/admin/publishing/ConversionLinkQuickFixClient';
import { CampaignWorkflowNav } from '@/components/admin/workflow/CampaignWorkflowNav';

export default async function EventPublishingPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  return (
    <>
      <CampaignWorkflowNav eventId={eventId} />
      <ConversionLinkQuickFixClient eventId={eventId} />
      <PrepareCampaignPostsClient eventId={eventId} />
    </>
  );
}
