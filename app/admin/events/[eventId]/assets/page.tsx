import { AssetStorageBanner } from '@/components/admin/assets/AssetStorageBanner';
import { EventAssetStudioPageClient } from '@/components/admin/assets/EventAssetStudioPageClient';
import { CampaignWorkflowNav } from '@/components/admin/workflow/CampaignWorkflowNav';

export default async function EventAssetsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  return (
    <>
      <CampaignWorkflowNav eventId={eventId} />
      <AssetStorageBanner />
      <EventAssetStudioPageClient eventId={eventId} />
    </>
  );
}
