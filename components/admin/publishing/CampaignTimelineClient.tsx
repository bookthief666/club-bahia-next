'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { EventAsset } from '@/lib/admin/assets/domain';
import {
  AssetSessionError,
  fetchEventAssets,
} from '@/lib/admin/assets/client-session';
import {
  buildPromotionTimeline,
  type PromotionTimelineEntry,
} from '@/lib/admin/autopilot/campaign-plan';
import type { PromotionAutopilotReadiness } from '@/lib/admin/autopilot/domain';
import type { PublishingQueueJob } from '@/lib/admin/autopilot/queue-domain';
import { buildShortVideoPublicationDrafts } from '@/lib/admin/autopilot/short-video';
import type { OperationsEvent } from '@/lib/admin/domain';
import { eventRepository } from '@/lib/admin/event-repository';
import type {
  CampaignContentItem,
  EventGrowthWorkspace,
} from '@/lib/admin/growth/domain';
import { growthWorkspaceRepository } from '@/lib/admin/growth/repository';
import {
  emptyEventPostAssembly,
  isAssetCompatibleWithChannel,
  selectBestAssetForChannel,
  type EventPostAssembly,
} from '@/lib/admin/publishing/domain';
import { postAssemblyRepository } from '@/lib/admin/publishing/repository';

interface QueueResponse {
  jobs?: PublishingQueueJob[];
  blocked?: Array<{ jobId: string; reason: string }>;
  error?: string;
}

interface PreparedTimelineEntry extends PromotionTimelineEntry {
  caption: string;
  contentItemId: string;
  media?: EventAsset;
  copyApproved: boolean;
  executionSupport:
    | 'automatic'
    | 'connection-required'
    | 'provider-proof-required';
}

function selectedAsset(
  item: CampaignContentItem | undefined,
  assembly: EventPostAssembly,
  assets: EventAsset[],
): EventAsset | undefined {
  if (!item) return undefined;
  const postPackage = assembly.packages.find(
    (entry) => entry.contentItemId === item.id,
  );
  const selected = (postPackage?.assetIds ?? [])
    .map((assetId) => assets.find((asset) => asset.id === assetId))
    .filter((asset): asset is EventAsset => Boolean(asset));
  const compatible = selected.filter((asset) =>
    isAssetCompatibleWithChannel(asset, item.channel),
  );
  return (
    compatible.find((asset) => asset.id === postPackage?.primaryAssetId) ??
    compatible[0] ??
    selectBestAssetForChannel(assets, item.channel)
  );
}

function joinCaption(parts: Array<string | undefined>, max = 2200): string {
  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join('\n\n')
    .slice(0, max);
}

function storyCaption(
  item: CampaignContentItem | undefined,
  phase: PromotionTimelineEntry['phase'],
  event: OperationsEvent,
): string {
  const frames = item?.structured?.storyFrames?.map((frame) => frame.text).filter(Boolean);
  const body = frames?.length ? frames.join(' · ') : item?.body;
  if (phase === 'performer-spotlight') {
    return joinCaption([
      event.performers ? `Featuring ${event.performers}` : 'Featured night at Club Bahia',
      body,
    ]);
  }
  if (phase === 'story-countdown') return joinCaption(['Save the date', body]);
  if (phase === 'tomorrow') return joinCaption(['Tomorrow at Club Bahia', body]);
  if (phase === 'tonight') return joinCaption(['Tonight at Club Bahia', body]);
  return joinCaption(['Final hours before tonight’s event', body]);
}

function feedCaption(
  item: CampaignContentItem | undefined,
  phase: PromotionTimelineEntry['phase'],
  event: OperationsEvent,
): string {
  if (phase === 'announcement') {
    return joinCaption([
      item?.structured?.longCaption,
      item?.structured?.standardCaption,
      item?.body,
    ]);
  }
  if (phase === 'reservation-reminder') {
    return joinCaption([
      item?.structured?.shortCaption,
      item?.structured?.standardCaption,
      item?.callToAction,
    ]);
  }
  return joinCaption([
    `Thank you to everyone who joined us for ${event.title}.`,
    'Follow Club Bahia for the next night, performance, and reservation announcement.',
  ]);
}

function preparedEntries(input: {
  event: OperationsEvent;
  workspace: EventGrowthWorkspace;
  assembly: EventPostAssembly;
  assets: EventAsset[];
  readiness?: PromotionAutopilotReadiness;
}): PreparedTimelineEntry[] {
  const timeline = buildPromotionTimeline({ event: input.event });
  const feed = input.workspace.content.find((item) => item.channel === 'instagram-feed');
  const story = input.workspace.content.find((item) => item.channel === 'instagram-story');
  const video = input.workspace.content.find((item) => item.channel === 'reel');
  const feedMedia = selectedAsset(feed, input.assembly, input.assets);
  const storyMedia = selectedAsset(story, input.assembly, input.assets);
  const videoMedia = selectedAsset(video, input.assembly, input.assets);
  const shortVideo = video
    ? buildShortVideoPublicationDrafts({ item: video, eventTitle: input.event.title })
    : [];
  const instagramVideo = shortVideo.find((draft) => draft.channel === 'instagram-reel');
  const tiktokVideo = shortVideo.find((draft) => draft.channel === 'tiktok-video');
  const meta = input.readiness?.accounts.find((account) => account.provider === 'meta');
  const tiktok = input.readiness?.accounts.find(
    (account) => account.provider === 'tiktok',
  );
  const imageAutomatic = Boolean(
    meta?.capabilities.find((capability) => capability.id === 'instagram-image')
      ?.available,
  );

  return timeline.entries.map((entry) => {
    if (entry.channel === 'instagram-feed') {
      return {
        ...entry,
        caption: feedCaption(feed, entry.phase, input.event),
        contentItemId: `${feed?.id ?? 'instagram-feed'}-${entry.phase}`,
        media: feedMedia,
        copyApproved: Boolean(
          feed && ['approved', 'scheduled', 'published'].includes(feed.status),
        ),
        executionSupport: imageAutomatic ? 'automatic' : 'connection-required',
      };
    }
    if (entry.channel === 'instagram-story') {
      return {
        ...entry,
        caption: storyCaption(story, entry.phase, input.event),
        contentItemId: `${story?.id ?? 'instagram-story'}-${entry.phase}`,
        media: storyMedia,
        copyApproved: Boolean(
          story && ['approved', 'scheduled', 'published'].includes(story.status),
        ),
        executionSupport:
          meta?.status === 'connected'
            ? 'provider-proof-required'
            : 'connection-required',
      };
    }
    if (entry.channel === 'instagram-reel') {
      return {
        ...entry,
        caption: instagramVideo
          ? joinCaption([instagramVideo.caption, instagramVideo.hashtags.join(' ')])
          : '',
        contentItemId: `${video?.id ?? 'reel'}-instagram-reel`,
        media: videoMedia,
        copyApproved: Boolean(
          video && ['approved', 'scheduled', 'published'].includes(video.status),
        ),
        executionSupport: 'provider-proof-required',
      };
    }
    return {
      ...entry,
      caption: tiktokVideo
        ? joinCaption([tiktokVideo.caption, tiktokVideo.hashtags.join(' ')])
        : '',
      contentItemId: `${video?.id ?? 'reel'}-tiktok-video`,
      media: videoMedia,
      copyApproved: Boolean(
        video && ['approved', 'scheduled', 'published'].includes(video.status),
      ),
      executionSupport:
        tiktok?.status === 'connected'
          ? 'provider-proof-required'
          : 'connection-required',
    };
  });
}

function statusText(entry: PreparedTimelineEntry): string {
  if (!entry.copyApproved) return 'Copy needs approval';
  if (!entry.media) return 'Approved media missing';
  if (!entry.caption) return 'Caption missing';
  if (entry.executionSupport === 'automatic') return 'Eligible for Autopilot';
  if (entry.executionSupport === 'connection-required') return 'Account connection required';
  return 'Prepared now; provider proof required';
}

export function CampaignTimelineClient({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState<OperationsEvent | null>();
  const [workspace, setWorkspace] = useState<EventGrowthWorkspace>();
  const [assembly, setAssembly] = useState<EventPostAssembly>(
    emptyEventPostAssembly(eventId),
  );
  const [assets, setAssets] = useState<EventAsset[]>([]);
  const [readiness, setReadiness] = useState<PromotionAutopilotReadiness>();
  const [jobs, setJobs] = useState<PublishingQueueJob[]>([]);
  const [mediaLocked, setMediaLocked] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    const nextEvent = await eventRepository.getEvent(eventId);
    setEvent(nextEvent);
    if (!nextEvent) return;
    const nextWorkspace = await growthWorkspaceRepository.getWorkspace(nextEvent);
    const [nextAssembly, queueResponse, readinessResponse] = await Promise.all([
      postAssemblyRepository.get(eventId),
      fetch(`/api/admin/autopilot/queue?eventId=${encodeURIComponent(eventId)}`, {
        cache: 'no-store',
      }),
      fetch('/api/admin/autopilot/readiness', { cache: 'no-store' }),
    ]);
    setWorkspace(nextWorkspace);
    setAssembly(nextAssembly);
    if (queueResponse.ok) {
      const payload = (await queueResponse.json()) as QueueResponse;
      setJobs(payload.jobs ?? []);
    }
    if (readinessResponse.ok) {
      setReadiness(
        (await readinessResponse.json()) as PromotionAutopilotReadiness,
      );
    }
    try {
      setAssets(await fetchEventAssets(eventId));
      setMediaLocked(false);
    } catch (error) {
      if (error instanceof AssetSessionError && error.status === 401) {
        setMediaLocked(true);
        setAssets([]);
      } else {
        throw error;
      }
    }
  }, [eventId]);

  useEffect(() => {
    void load().catch((error) =>
      setMessage(
        error instanceof Error
          ? error.message
          : 'Could not build the campaign timeline.',
      ),
    );
  }, [load]);

  const timeline = useMemo(
    () =>
      event && workspace
        ? preparedEntries({ event, workspace, assembly, assets, readiness })
        : [],
    [assembly, assets, event, readiness, workspace],
  );
  const plan = useMemo(
    () => (event ? buildPromotionTimeline({ event }) : undefined),
    [event],
  );
  const ready = timeline.filter(
    (entry) => entry.copyApproved && entry.media && entry.caption,
  );
  const existingIds = new Set(jobs.map((job) => job.id));
  const preparedCount = timeline.filter((entry) => existingIds.has(entry.id)).length;

  async function prepareCampaign() {
    if (!event || !workspace || !ready.length) return;
    const confirmed = window.confirm(
      `Prepare ${ready.length} campaign posts using the displayed captions, media, and Los Angeles times? Existing unpublished versions with the same identities will be updated.`,
    );
    if (!confirmed) return;
    setPending(true);
    setMessage('');
    try {
      const publishedIds = new Set(
        jobs.filter((job) => job.status === 'published').map((job) => job.id),
      );
      const candidates = ready.filter((entry) => !publishedIds.has(entry.id));
      if (!candidates.length) {
        setMessage('Every ready campaign post is already published.');
        return;
      }
      const response = await fetch('/api/admin/autopilot/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'upsert-campaign',
          eventId,
          jobs: candidates.map((entry) => ({
            id: entry.id,
            eventId,
            eventTitle: event.title,
            contentItemId: entry.contentItemId,
            label: entry.label,
            provider: entry.provider,
            channel: entry.channel,
            scheduledFor: entry.scheduledFor,
            approvalMode: 'approve-campaign',
            payload: {
              caption: entry.caption,
              mediaUrl: entry.media?.url,
              mediaKind: entry.media?.kind,
              reservationUrl: workspace.brief.reservationUrl || undefined,
              altText: entry.media?.altText || undefined,
              privacyLevel:
                entry.channel === 'tiktok-video'
                  ? 'PUBLIC_TO_EVERYONE'
                  : undefined,
            },
            executionSupport: entry.executionSupport,
          })),
        }),
      });
      const payload = (await response.json()) as QueueResponse;
      if (!response.ok || !payload.jobs) {
        throw new Error(payload.error || 'The campaign could not be prepared.');
      }
      setJobs((current) => [
        ...current.filter(
          (job) => !payload.jobs?.some((prepared) => prepared.id === job.id),
        ),
        ...payload.jobs,
      ]);
      setMessage(
        `${payload.jobs.length} posts were prepared in one shared campaign update. Review them, then approve the full campaign.`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The campaign could not be prepared.');
    } finally {
      setPending(false);
    }
  }

  async function approveCampaign() {
    const campaignJobs = jobs.filter(
      (job) => timeline.some((entry) => entry.id === job.id) && job.status !== 'published',
    );
    if (!event || !campaignJobs.length) return;
    const confirmed = window.confirm(
      `Approve ${campaignJobs.length} prepared posts as one campaign? Connected automatic formats will schedule. Review-gated formats will pause safely until their provider proof is complete.`,
    );
    if (!confirmed) return;
    setPending(true);
    setMessage('');
    try {
      const response = await fetch('/api/admin/autopilot/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve-campaign',
          eventId,
          jobIds: campaignJobs.map((job) => job.id),
        }),
      });
      const payload = (await response.json()) as QueueResponse;
      if (!response.ok || !payload.jobs) {
        throw new Error(payload.error || 'The campaign could not be approved.');
      }
      setJobs((current) => [
        ...current.filter(
          (job) => !payload.jobs?.some((approved) => approved.id === job.id),
        ),
        ...payload.jobs,
      ]);
      setMessage(
        payload.blocked?.length
          ? `${payload.jobs.length - payload.blocked.length} posts were approved or safely paused. ${payload.blocked.length} still require an account connection.`
          : `${payload.jobs.length} campaign posts were approved or safely paused according to provider readiness.`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The campaign could not be approved.');
    } finally {
      setPending(false);
    }
  }

  if (event === undefined || !workspace) {
    return (
      <section className="rounded-[1.5rem] border border-white/10 p-5 text-sm text-white/55">
        Building the recommended campaign timeline…
      </section>
    );
  }
  if (event === null) return null;

  return (
    <section className="overflow-hidden rounded-[1.7rem] border border-emerald-200/15 bg-[radial-gradient(circle_at_92%_0%,rgba(52,211,153,.14),transparent_26rem),linear-gradient(145deg,rgba(10,24,21,.97),rgba(17,12,12,.97))] shadow-[0_24px_75px_rgba(0,0,0,.3)]">
      <div className="p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-emerald-100/65">
              Automatic campaign timeline
            </p>
            <h2 className="mt-2 font-serif text-3xl text-white">
              Prepare the complete promotion schedule
            </h2>
            <p className="mt-2 text-sm leading-7 text-white/56">
              Autopilot starts from the event date, preserves the ideal campaign when there is enough time, and compresses missed high-value posts when the event is entered late.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending || mediaLocked || !ready.length}
              onClick={() => void prepareCampaign()}
              className="min-h-11 rounded-full border border-emerald-200/25 bg-emerald-200/[.09] px-5 text-xs font-bold text-emerald-50 disabled:opacity-35"
            >
              {pending ? 'Working…' : 'Prepare full campaign'}
            </button>
            <button
              type="button"
              disabled={pending || !preparedCount}
              onClick={() => void approveCampaign()}
              className="min-h-11 rounded-full bg-emerald-200 px-5 text-xs font-bold text-black disabled:opacity-35"
            >
              Approve full campaign
            </button>
          </div>
        </div>

        {plan?.compressed ? (
          <p className="mt-4 rounded-xl border border-amber-200/16 bg-amber-200/[.06] px-4 py-3 text-sm leading-6 text-amber-50/76">
            Compressed timeline: {plan.compressionReason}
          </p>
        ) : null}
        {mediaLocked ? (
          <p className="mt-4 rounded-xl border border-violet-200/16 bg-violet-200/[.06] px-4 py-3 text-sm text-violet-50/75">
            Approved media is locked in this browser. Open Media Studio and unlock the event assets before preparing the campaign.
          </p>
        ) : null}
        {message ? (
          <p role="status" className="mt-4 rounded-xl border border-white/10 bg-black/18 px-4 py-3 text-sm text-white/72">
            {message}
          </p>
        ) : null}

        <div className="mt-5 space-y-2">
          {timeline.map((entry) => {
            const job = jobs.find((candidate) => candidate.id === entry.id);
            return (
              <article
                key={entry.id}
                className="grid gap-3 rounded-2xl border border-white/8 bg-black/18 p-3 sm:grid-cols-[9rem_minmax(0,1fr)_auto] sm:items-center"
              >
                <div>
                  <p className="text-sm font-semibold text-white/82">
                    {entry.venueTime.replace('T', ' ')}
                  </p>
                  <p className="mt-1 text-[10px] uppercase tracking-[.12em] text-white/35">
                    Los Angeles {entry.compressed ? '· compressed' : ''}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white/78">{entry.label}</p>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/45">
                    {entry.caption || entry.purpose}
                  </p>
                  <p className="mt-1 text-[11px] text-white/34">
                    {entry.media?.name ?? 'No approved media'} · {statusText(entry)}
                  </p>
                </div>
                <span className="w-fit rounded-full border border-white/10 px-3 py-1 text-[9px] font-bold uppercase tracking-[.1em] text-white/50">
                  {job?.status?.replace('-', ' ') ?? 'planned'}
                </span>
              </article>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-white/38">
          <p>
            {ready.length} of {timeline.length} planned posts currently have approved copy and media.
          </p>
          <Link href={`/admin/events/${eventId}/publishing/assemble`} className="font-semibold text-emerald-100/70">
            Review media assignments →
          </Link>
        </div>
      </div>
    </section>
  );
}
