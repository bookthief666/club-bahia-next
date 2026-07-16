'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { EventAsset } from '@/lib/admin/assets/domain';
import {
  AssetSessionError,
  fetchEventAssets,
} from '@/lib/admin/assets/client-session';
import { buildPromotionTimeline } from '@/lib/admin/autopilot/campaign-plan';
import {
  buildPreparedPromotionTimeline,
  type PreparedPromotionTimelineEntry,
} from '@/lib/admin/autopilot/campaign-plan-content';
import type { PromotionAutopilotReadiness } from '@/lib/admin/autopilot/domain';
import type { PublishingQueueJob } from '@/lib/admin/autopilot/queue-domain';
import type { OperationsEvent } from '@/lib/admin/domain';
import { eventRepository } from '@/lib/admin/event-repository';
import type { EventGrowthWorkspace } from '@/lib/admin/growth/domain';
import { growthWorkspaceRepository } from '@/lib/admin/growth/repository';
import {
  emptyEventPostAssembly,
  type EventPostAssembly,
} from '@/lib/admin/publishing/domain';
import { postAssemblyRepository } from '@/lib/admin/publishing/repository';

interface QueueResponse {
  jobs?: PublishingQueueJob[];
  blocked?: Array<{ jobId: string; reason: string }>;
  error?: string;
}

function readinessText(entry: PreparedPromotionTimelineEntry): string {
  if (!entry.copyApproved) return 'Copy needs approval';
  if (!entry.media) return 'Approved media missing';
  if (!entry.caption) return 'Caption missing';
  if (entry.executionSupport === 'automatic') return 'Eligible for Autopilot';
  if (entry.executionSupport === 'connection-required') {
    return 'Account connection required';
  }
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
      const queuePayload = (await queueResponse.json()) as QueueResponse;
      setJobs(queuePayload.jobs ?? []);
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
        setAssets([]);
        setMediaLocked(true);
        return;
      }
      throw error;
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
        ? buildPreparedPromotionTimeline({
            event,
            workspace,
            assembly,
            assets,
            readiness,
          })
        : [],
    [assembly, assets, event, readiness, workspace],
  );
  const plan = useMemo(
    () => (event ? buildPromotionTimeline({ event }) : undefined),
    [event],
  );
  const readyEntries = timeline.filter(
    (entry) => entry.copyApproved && entry.media && entry.caption,
  );
  const planIds = new Set(timeline.map((entry) => entry.id));
  const preparedJobs = jobs.filter((job) => planIds.has(job.id));

  async function prepareCampaign() {
    if (!event || !workspace || !readyEntries.length) return;
    if (
      !window.confirm(
        `Prepare ${readyEntries.length} posts using the displayed captions, media, and Los Angeles times?`,
      )
    ) {
      return;
    }

    setPending(true);
    setMessage('');
    try {
      const publishedIds = new Set(
        jobs.filter((job) => job.status === 'published').map((job) => job.id),
      );
      const candidates = readyEntries.filter(
        (entry) => !publishedIds.has(entry.id),
      );
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
      const nextJobs = payload.jobs;
      setJobs((current) => [
        ...current.filter(
          (job) => !nextJobs.some((prepared) => prepared.id === job.id),
        ),
        ...nextJobs,
      ]);
      setMessage(
        `${nextJobs.length} posts were prepared in one shared update. Review the list, then approve the full campaign.`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'The campaign could not be prepared.',
      );
    } finally {
      setPending(false);
    }
  }

  async function approveCampaign() {
    const approvable = preparedJobs.filter((job) => job.status !== 'published');
    if (!event || !approvable.length) return;
    if (
      !window.confirm(
        `Approve ${approvable.length} prepared posts as one campaign? Automatic formats will schedule; review-gated formats will pause safely.`,
      )
    ) {
      return;
    }

    setPending(true);
    setMessage('');
    try {
      const response = await fetch('/api/admin/autopilot/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve-campaign',
          eventId,
          jobIds: approvable.map((job) => job.id),
        }),
      });
      const payload = (await response.json()) as QueueResponse;
      if (!response.ok || !payload.jobs) {
        throw new Error(payload.error || 'The campaign could not be approved.');
      }
      const nextJobs = payload.jobs;
      setJobs((current) => [
        ...current.filter(
          (job) => !nextJobs.some((approved) => approved.id === job.id),
        ),
        ...nextJobs,
      ]);
      const blocked = payload.blocked?.length ?? 0;
      setMessage(
        blocked
          ? `${nextJobs.length - blocked} posts were approved or safely paused. ${blocked} still require an account connection.`
          : `${nextJobs.length} posts were approved or safely paused according to provider readiness.`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'The campaign could not be approved.',
      );
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
              Autopilot preserves the ideal campaign when there is enough time and compresses missed high-value posts when an event is entered late.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending || mediaLocked || !readyEntries.length}
              onClick={() => void prepareCampaign()}
              className="min-h-11 rounded-full border border-emerald-200/25 bg-emerald-200/[.09] px-5 text-xs font-bold text-emerald-50 disabled:opacity-35"
            >
              {pending ? 'Working…' : 'Prepare full campaign'}
            </button>
            <button
              type="button"
              disabled={pending || !preparedJobs.length}
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
                    {entry.media?.name ?? 'No approved media'} · {readinessText(entry)}
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
            {readyEntries.length} of {timeline.length} planned posts currently have approved copy and media.
          </p>
          <Link
            href={`/admin/events/${eventId}/publishing/assemble`}
            className="font-semibold text-emerald-100/70"
          >
            Review media assignments →
          </Link>
        </div>
      </div>
    </section>
  );
}
