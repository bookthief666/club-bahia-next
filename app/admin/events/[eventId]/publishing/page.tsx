import Link from 'next/link';
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
      <div className="mb-4 flex justify-end">
        <Link
          href={`/admin/events/${eventId}/publishing/execute`}
          className="inline-flex min-h-11 items-center rounded-full border border-emerald-200/25 bg-emerald-200/10 px-5 text-sm font-bold text-emerald-100"
        >
          Open publishing execution queue
        </Link>
      </div>
      <ConversionLinkQuickFixClient eventId={eventId} />
      <CampaignPostAssemblyClient eventId={eventId} />
    </>
  );
}
