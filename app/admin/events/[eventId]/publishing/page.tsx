import { CampaignPostAssemblyClient } from '@/components/admin/publishing/CampaignPostAssemblyClient';
import { ConversionLinkQuickFixClient } from '@/components/admin/publishing/ConversionLinkQuickFixClient';

export default async function EventPublishingPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  return (
    <>
      <ConversionLinkQuickFixClient eventId={eventId} />
      <CampaignPostAssemblyClient eventId={eventId} />
    </>
  );
}
