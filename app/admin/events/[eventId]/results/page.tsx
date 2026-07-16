import { EventResultsClient } from '@/components/admin/results/EventResultsClient';
import { CampaignWorkflowNav } from '@/components/admin/workflow/CampaignWorkflowNav';

export default async function EventResultsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  return (
    <>
      <CampaignWorkflowNav eventId={eventId} />
      <EventResultsClient eventId={eventId} />
    </>
  );
}
