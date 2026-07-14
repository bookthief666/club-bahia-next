'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { EventAsset } from '@/lib/admin/assets/domain';
import {
  AssetSessionError,
  fetchEventAssets,
  unlockAssetSession,
} from '@/lib/admin/assets/client-session';
import type { PromotionAutopilotReadiness } from '@/lib/admin/autopilot/domain';
import type { PublishingQueueJob } from '@/lib/admin/autopilot/queue-domain';
import { buildShortVideoPublicationDrafts } from '@/lib/admin/autopilot/short-video';
import {
  CLUB_BAHIA_TIME_ZONE,
  formatUtcForVenueInput,
  venueInputToUtc,
} from '@/lib/admin/autopilot/venue-time';
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
  type EventPostAssembly,
} from '@/lib/admin/publishing/domain';
import { postAssemblyRepository } from '@/lib/admin/publishing/repository';

interface QueueResponse {
  jobs?: PublishingQueueJob[];
  error?: string;
}

type ScheduleLane = 'instagram-feed' | 'instagram-reel' | 'tiktok-video';

type ExecutionSupport =
  | 'automatic'
  | 'connection-required'
  | 'provider-proof-required';

interface LaneDraft {
  id: string;
  label: string;
  provider: 'meta' | 'tiktok';
  channel: ScheduleLane;
  contentItemId: string;
  caption: string;
  media?: EventAsset;
  approvedCopy: boolean;
  executionSupport: ExecutionSupport;
  schedule: string;
}

function selectedAsset(
  item: CampaignContentItem | undefined,
  channel: 'instagram-feed' | 'reel',
  assembly: EventPostAssembly,
  assets: EventAsset[],
): EventAsset | undefined {
  if (!item) return undefined;
  const postPackage = assembly.packages.find(
    (entry) => entry.contentItemId === item.id,
  );
  const compatible = (postPackage?.assetIds ?? [])
    .map((assetId) => assets.find((asset) => asset.id === assetId))
    .filter((asset): asset is EventAsset => Boolean(asset))
    .filter((asset) => isAssetCompatibleWithChannel(asset, channel));
  return (
    compatible.find((asset) => asset.id === postPackage?.primaryAssetId) ??
    compatible[0]
  );
}

function statusTone(status: PublishingQueueJob['status'] | undefined): string {
  if (status === 'published') {
    return 'border-emerald-200/20 bg-emerald-200/[.08] text-emerald-100';
  }
  if (status === 'scheduled' || status === 'approved') {
    return 'border-sky-200/20 bg-sky-200/[.08] text-sky-100';
  }
  if (status === 'retrying' || status === 'publishing') {
    return 'border-violet-200/20 bg-violet-200/[.08] text-violet-100';
  }
  if (status === 'failed' || status === 'paused') {
    return 'border-red-200/20 bg-red-200/[.08] text-red-100';
  }
  return 'border-amber-200/20 bg-amber-200/[.08] text-amber-100';
}

function supportText(support: ExecutionSupport): string {
  if (support === 'automatic') return '✓ Automatic provider execution available';
  if (support === 'connection-required') return '• Connect the provider account first';
  return '• Queued for review until this provider proof is completed';
}

function ScheduleCard({
  lane,
  job,
  pending,
  onSchedule,
  onSave,
  onApprove,
  onCancel,
}: {
  lane: LaneDraft;
  job?: PublishingQueueJob;
  pending: boolean;
  onSchedule: (value: string) => void;
  onSave: () => Promise<void>;
  onApprove: () => Promise<void>;
  onCancel: () => Promise<void>;
}) {
  const ready = Boolean(lane.approvedCopy && lane.media && lane.schedule);

  return (
    <article className="overflow-hidden rounded-[1.4rem] border border-white/10 bg-black/22">
      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-cyan-100/60">
              {lane.provider === 'meta' ? 'Instagram' : 'TikTok'}
            </p>
            <h3 className="mt-1 text-xl font-semibold text-white">
              {lane.label}
            </h3>
          </div>
          <span
            className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[.12em] ${statusTone(job?.status)}`}
          >
            {job?.status?.replace('-', ' ') ?? 'not queued'}
          </span>
        </div>

        <div className="mt-4 grid gap-3 text-xs text-white/56">
          <p
            className={
              lane.approvedCopy ? 'text-emerald-100/75' : 'text-amber-100/75'
            }
          >
            {lane.approvedCopy
              ? '✓ Copy approved'
              : '• Approve the campaign copy first'}
          </p>
          <p
            className={lane.media ? 'text-emerald-100/75' : 'text-amber-100/75'}
          >
            {lane.media ? `✓ ${lane.media.name}` : '• Assign approved media first'}
          </p>
          <p
            className={
              lane.executionSupport === 'automatic'
                ? 'text-emerald-100/75'
                : 'text-amber-100/75'
            }
          >
            {supportText(lane.executionSupport)}
          </p>
        </div>

        <div className="mt-4 rounded-xl border border-white/8 bg-black/20 p-3">
          <p className="line-clamp-5 whitespace-pre-wrap text-xs leading-5 text-white/62">
            {lane.caption}
          </p>
        </div>

        <label className="mt-4 block text-xs font-semibold text-white/62">
          Publishing time — Los Angeles
          <input
            type="datetime-local"
            value={lane.schedule}
            onChange={(event) => onSchedule(event.target.value)}
            disabled={pending || job?.status === 'published'}
            className="mt-2 min-h-12 w-full rounded-xl border border-white/12 bg-black/28 px-3 text-sm text-white outline-none focus:border-cyan-200/45 disabled:opacity-40"
          />
        </label>
        <p className="mt-2 text-[11px] leading-5 text-white/35">
          Always interpreted in {CLUB_BAHIA_TIME_ZONE}, even when this device is elsewhere.
        </p>

        {job?.lastError ? (
          <p className="mt-3 rounded-xl border border-red-200/16 bg-red-200/[.06] p-3 text-xs leading-5 text-red-50/75">
            {job.lastError}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending || !ready || job?.status === 'published'}
            onClick={() => void onSave()}
            className="min-h-11 rounded-full border border-cyan-200/20 bg-cyan-200/[.08] px-4 text-xs font-bold text-cyan-50 disabled:opacity-35"
          >
            {job ? 'Update queued post' : 'Add to queue'}
          </button>
          {job?.status === 'needs-approval' ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => void onApprove()}
              className="min-h-11 rounded-full bg-emerald-200 px-5 text-xs font-bold text-black disabled:opacity-40"
            >
              Approve scheduled post
            </button>
          ) : null}
          {job && !['published', 'cancelled'].includes(job.status) ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => void onCancel()}
              className="min-h-11 rounded-full border border-white/12 px-4 text-xs font-semibold text-white/50 disabled:opacity-40"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function AutopilotScheduleClient({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState<OperationsEvent | null>();
  const [workspace, setWorkspace] = useState<EventGrowthWorkspace>();
  const [assembly, setAssembly] = useState<EventPostAssembly>(
    emptyEventPostAssembly(eventId),
  );
  const [assets, setAssets] = useState<EventAsset[]>([]);
  const [readiness, setReadiness] = useState<PromotionAutopilotReadiness>();
  const [jobs, setJobs] = useState<PublishingQueueJob[]>([]);
  const [schedules, setSchedules] = useState<Record<ScheduleLane, string>>({
    'instagram-feed': '',
    'instagram-reel': '',
    'tiktok-video': '',
  });
  const [mediaLocked, setMediaLocked] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [pendingLane, setPendingLane] = useState<ScheduleLane>();
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
      setSchedules((current) => {
        const next = { ...current };
        for (const job of payload.jobs ?? []) {
          if (job.channel in next && job.scheduledFor) {
            next[job.channel as ScheduleLane] = formatUtcForVenueInput(
              job.scheduledFor,
            );
          }
        }
        return next;
      });
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
          : 'Could not load the publishing queue.',
      ),
    );
  }, [load]);

  const lanes = useMemo<LaneDraft[]>(() => {
    if (!event || !workspace) return [];

    const instagramItem = workspace.content.find(
      (item) => item.channel === 'instagram-feed',
    );
    const videoItem = workspace.content.find((item) => item.channel === 'reel');
    const image = selectedAsset(
      instagramItem,
      'instagram-feed',
      assembly,
      assets,
    );
    const video = selectedAsset(videoItem, 'reel', assembly, assets);
    const meta = readiness?.accounts.find(
      (account) => account.provider === 'meta',
    );
    const tiktok = readiness?.accounts.find(
      (account) => account.provider === 'tiktok',
    );
    const imageAutomatic = Boolean(
      meta?.capabilities.find((item) => item.id === 'instagram-image')
        ?.available,
    );
    const videoDrafts = videoItem
      ? buildShortVideoPublicationDrafts({
          item: videoItem,
          eventTitle: event.title,
        })
      : [];
    const instagramVideo = videoDrafts.find(
      (draft) => draft.channel === 'instagram-reel',
    );
    const tiktokVideo = videoDrafts.find(
      (draft) => draft.channel === 'tiktok-video',
    );

    return [
      {
        id: `${eventId}-instagram-feed`,
        label: 'Instagram feed image',
        provider: 'meta',
        channel: 'instagram-feed',
        contentItemId: instagramItem?.id ?? 'instagram-feed',
        caption: instagramItem?.body ?? '',
        media: image,
        approvedCopy: Boolean(
          instagramItem &&
            ['approved', 'scheduled', 'published'].includes(
              instagramItem.status,
            ),
        ),
        executionSupport: imageAutomatic ? 'automatic' : 'connection-required',
        schedule:
          schedules['instagram-feed'] ||
          formatUtcForVenueInput(instagramItem?.publishAt),
      },
      {
        id: `${eventId}-instagram-reel`,
        label: 'Instagram Reel',
        provider: 'meta',
        channel: 'instagram-reel',
        contentItemId: videoItem
          ? `${videoItem.id}-instagram-reel`
          : 'instagram-reel',
        caption: instagramVideo
          ? `${instagramVideo.caption}\n\n${instagramVideo.hashtags.join(' ')}`
          : '',
        media: video,
        approvedCopy: Boolean(
          videoItem &&
            ['approved', 'scheduled', 'published'].includes(videoItem.status),
        ),
        executionSupport: 'provider-proof-required',
        schedule:
          schedules['instagram-reel'] ||
          formatUtcForVenueInput(videoItem?.publishAt),
      },
      {
        id: `${eventId}-tiktok-video`,
        label: 'TikTok vertical video',
        provider: 'tiktok',
        channel: 'tiktok-video',
        contentItemId: videoItem
          ? `${videoItem.id}-tiktok-video`
          : 'tiktok-video',
        caption: tiktokVideo
          ? `${tiktokVideo.caption}\n\n${tiktokVideo.hashtags.join(' ')}`
          : '',
        media: video,
        approvedCopy: Boolean(
          videoItem &&
            ['approved', 'scheduled', 'published'].includes(videoItem.status),
        ),
        executionSupport:
          tiktok?.status === 'connected'
            ? 'provider-proof-required'
            : 'connection-required',
        schedule:
          schedules['tiktok-video'] ||
          formatUtcForVenueInput(videoItem?.publishAt),
      },
    ];
  }, [assembly, assets, event, eventId, readiness, schedules, workspace]);

  async function unlockMedia() {
    setMessage('');
    try {
      await unlockAssetSession(accessCode);
      setAccessCode('');
      await load();
      setMessage('Approved media unlocked for scheduling.');
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Could not unlock media.',
      );
    }
  }

  async function queueAction(
    lane: LaneDraft,
    action: 'upsert' | 'approve' | 'cancel',
  ) {
    if (!event || !workspace) return;
    setPendingLane(lane.channel);
    setMessage('');

    try {
      const scheduledFor =
        action === 'upsert' ? venueInputToUtc(lane.schedule) : undefined;
      if (action === 'upsert' && !scheduledFor) {
        throw new Error(
          'Choose a valid Los Angeles publishing time. Times skipped by daylight-saving changes cannot be scheduled.',
        );
      }

      const body =
        action === 'upsert'
          ? {
              action,
              job: {
                id: lane.id,
                eventId,
                eventTitle: event.title,
                contentItemId: lane.contentItemId,
                label: lane.label,
                provider: lane.provider,
                channel: lane.channel,
                scheduledFor,
                approvalMode: 'approve-each',
                payload: {
                  caption: lane.caption,
                  mediaUrl: lane.media?.url,
                  mediaKind: lane.media?.kind,
                  reservationUrl: workspace.brief.reservationUrl || undefined,
                  altText: lane.media?.altText || undefined,
                  privacyLevel:
                    lane.channel === 'tiktok-video'
                      ? 'PUBLIC_TO_EVERYONE'
                      : undefined,
                },
                executionSupport: lane.executionSupport,
              },
            }
          : { action, jobId: lane.id };

      const response = await fetch('/api/admin/autopilot/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as QueueResponse & {
        job?: PublishingQueueJob;
      };
      if (!response.ok || !payload.job) {
        throw new Error(
          payload.error || 'Publishing queue could not be updated.',
        );
      }
      setJobs((current) => [
        ...current.filter((job) => job.id !== payload.job?.id),
        payload.job as PublishingQueueJob,
      ]);
      setMessage(
        action === 'approve'
          ? `${lane.label} is approved for its scheduled time.`
          : action === 'cancel'
            ? `${lane.label} was cancelled.`
            : `${lane.label} was added to the shared publishing queue.`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Publishing queue could not be updated.',
      );
    } finally {
      setPendingLane(undefined);
    }
  }

  if (event === undefined || !workspace) {
    return (
      <section className="rounded-[1.5rem] border border-white/10 p-5 text-sm text-white/55">
        Loading Promotion Autopilot schedule…
      </section>
    );
  }
  if (event === null) return null;

  return (
    <section className="overflow-hidden rounded-[1.7rem] border border-cyan-200/15 bg-[radial-gradient(circle_at_90%_0%,rgba(34,211,238,.13),transparent_25rem),linear-gradient(145deg,rgba(11,23,25,.96),rgba(16,12,13,.97))] shadow-[0_24px_75px_rgba(0,0,0,.3)]">
      <div className="p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-cyan-100/65">
              Promotion Autopilot schedule
            </p>
            <h2 className="mt-2 font-serif text-3xl text-white">
              Approve what should publish and when
            </h2>
            <p className="mt-2 text-sm leading-7 text-white/56">
              Instagram and TikTok keep separate captions, Los Angeles times, provider receipts, and retry histories. Only formats that have passed their controlled provider proof can execute unattended.
            </p>
          </div>
          <Link
            href="/admin/settings"
            className="inline-flex min-h-11 items-center rounded-full border border-white/12 px-4 text-xs font-semibold text-white/65"
          >
            Publishing connections
          </Link>
        </div>

        {mediaLocked ? (
          <form
            className="mt-5 flex flex-col gap-2 rounded-2xl border border-violet-200/16 bg-violet-200/[.06] p-4 sm:flex-row"
            onSubmit={(submitEvent) => {
              submitEvent.preventDefault();
              void unlockMedia();
            }}
          >
            <input
              type="password"
              value={accessCode}
              onChange={(inputEvent) => setAccessCode(inputEvent.target.value)}
              placeholder="Media access code"
              className="min-h-11 min-w-0 flex-1 rounded-xl border border-white/12 bg-black/25 px-3 text-white"
            />
            <button
              disabled={!accessCode.trim()}
              className="min-h-11 rounded-full bg-violet-100 px-5 text-sm font-bold text-black disabled:opacity-40"
            >
              Unlock media
            </button>
          </form>
        ) : null}

        {message ? (
          <p
            role="status"
            className="mt-4 rounded-xl border border-amber-200/15 bg-amber-200/[.06] px-4 py-3 text-sm text-amber-50/80"
          >
            {message}
          </p>
        ) : null}

        <div className="mt-5 grid gap-4 xl:grid-cols-3">
          {lanes.map((lane) => (
            <ScheduleCard
              key={lane.channel}
              lane={lane}
              job={jobs.find((job) => job.id === lane.id)}
              pending={pendingLane === lane.channel}
              onSchedule={(value) =>
                setSchedules((current) => ({
                  ...current,
                  [lane.channel]: value,
                }))
              }
              onSave={() => queueAction(lane, 'upsert')}
              onApprove={() => queueAction(lane, 'approve')}
              onCancel={() => queueAction(lane, 'cancel')}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
