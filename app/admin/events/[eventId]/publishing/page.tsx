import { PreparePostsClient } from '@/components/admin/publishing/PreparePostsClient';
import { ConversionLinkQuickFixClient } from '@/components/admin/publishing/ConversionLinkQuickFixClient';
import { VerticalVideoEditReadinessClient } from '@/components/admin/publishing/VerticalVideoEditReadinessClient';
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
      <VerticalVideoEditReadinessClient eventId={eventId} />
      <PreparePostsClient eventId={eventId} />
    </>
  );
}
