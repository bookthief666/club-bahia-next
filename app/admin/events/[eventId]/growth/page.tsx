import Link from 'next/link';
import { AiProviderBanner } from '@/components/admin/growth/AiProviderBanner';
import { CampaignAuditPanelClient } from '@/components/admin/growth/CampaignAuditPanelClient';
import { EventGrowthWorkspaceClient } from '@/components/admin/growth/EventGrowthWorkspaceClient';

export default async function EventGrowthPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href={`/admin/events/${eventId}/assets`}
          className="inline-flex min-h-10 items-center rounded-full border border-violet-200/20 bg-violet-200/8 px-4 text-xs font-semibold text-violet-100"
        >
          Event media
        </Link>
        <Link
          href={`/admin/events/${eventId}/publishing`}
          className="inline-flex min-h-10 items-center rounded-full border border-emerald-200/20 bg-emerald-200/8 px-4 text-xs font-semibold text-emerald-100"
        >
          Assemble posts
        </Link>
      </div>
      <AiProviderBanner />
      <CampaignAuditPanelClient eventId={eventId} />
      <EventGrowthWorkspaceClient eventId={eventId} />
    </>
  );
}
