import { PublishingExecutionClient } from '@/components/admin/publishing/PublishingExecutionClient';

export default async function EventPublishingExecutionPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  return <PublishingExecutionClient eventId={eventId} />;
}
