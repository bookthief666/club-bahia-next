import Link from 'next/link';
import { AutopilotScheduleClient } from '@/components/admin/publishing/AutopilotScheduleClient';
import { CampaignLaunchClient } from '@/components/admin/publishing/CampaignLaunchClient';
import { CampaignTimelineClient } from '@/components/admin/publishing/CampaignTimelineClient';
import { CampaignTrackingLinksClient } from '@/components/admin/publishing/CampaignTrackingLinksClient';
import { InstagramPublishProofClient } from '@/components/admin/publishing/InstagramPublishProofClient';
import { InstagramReelProofClient } from '@/components/admin/publishing/InstagramReelProofClient';
import { TikTokPrivatePublishClient } from '@/components/admin/publishing/TikTokPrivatePublishClient';
import { WebsitePublishClient } from '@/components/admin/publishing/WebsitePublishClient';
import { CampaignWorkflowNav } from '@/components/admin/workflow/CampaignWorkflowNav';

export default async function EventPublishingExecutionPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  return (
    <>
      <CampaignWorkflowNav eventId={eventId} />
      <div className="mb-5">
        <WebsitePublishClient eventId={eventId} />
      </div>
      <div className="mb-5">
        <CampaignTrackingLinksClient eventId={eventId} />
      </div>
      <div className="mb-5">
        <CampaignTimelineClient eventId={eventId} />
      </div>
      <div className="mb-5">
        <AutopilotScheduleClient eventId={eventId} />
      </div>

      <details className="group mb-5 rounded-[1.45rem] border border-white/9 bg-white/[.025] p-4 sm:p-5">
        <summary className="cursor-pointer list-none">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-white/38">
                Controlled provider testing
              </p>
              <h2 className="mt-1 font-serif text-2xl text-white/82">
                Instagram and TikTok proof tools
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
                These guarded utilities are for validating real provider connections. They are not required for preparing or manually launching every campaign.
              </p>
            </div>
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-white/48 group-open:text-amber-100">
              <span className="group-open:hidden">Open tests</span>
              <span className="hidden group-open:inline">Close tests</span>
            </span>
          </div>
        </summary>
        <div className="mt-5 space-y-5 border-t border-white/8 pt-5">
          <InstagramPublishProofClient eventId={eventId} />
          <InstagramReelProofClient eventId={eventId} />
          <TikTokPrivatePublishClient eventId={eventId} />
        </div>
      </details>

      <CampaignLaunchClient eventId={eventId} />

      <section className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-[1.4rem] border border-emerald-200/14 bg-emerald-200/[.045] p-4 sm:p-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-emerald-100/58">
            Final workflow step
          </p>
          <h2 className="mt-1 font-serif text-2xl text-white">
            See whether promotion produced guests
          </h2>
          <p className="mt-2 text-sm leading-6 text-white/48">
            Review publishing status, tracked reservation requests, confirmed guests, and campaign sources without estimating unavailable social metrics.
          </p>
        </div>
        <Link
          href={`/admin/events/${eventId}/results`}
          className="inline-flex min-h-11 items-center rounded-full bg-emerald-200 px-5 text-sm font-bold text-black"
        >
          Review results →
        </Link>
      </section>
    </>
  );
}
