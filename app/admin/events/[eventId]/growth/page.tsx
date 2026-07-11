import { EventGrowthWorkspaceClient } from '@/components/admin/growth/EventGrowthWorkspaceClient';

export default async function EventGrowthPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  return <EventGrowthWorkspaceClient eventId={eventId} />;
}
