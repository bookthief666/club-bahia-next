import { AssetStorageBanner } from '@/components/admin/assets/AssetStorageBanner';
import { EventAssetStudioPageClient } from '@/components/admin/assets/EventAssetStudioPageClient';

export default async function EventAssetsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  return (
    <>
      <AssetStorageBanner />
      <EventAssetStudioPageClient eventId={eventId} />
    </>
  );
}
