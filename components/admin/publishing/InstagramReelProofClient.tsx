'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { EventAsset } from '@/lib/admin/assets/domain';
import {
  AssetSessionError,
  fetchEventAssets,
  unlockAssetSession,
} from '@/lib/admin/assets/client-session';
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
  type EventPostAssembly,
} from '@/lib/admin/publishing/domain';
import { publishingExecutionRepository } from '@/lib/admin/publishing/execution-repository';
import { postAssemblyRepository } from '@/lib/admin/publishing/repository';

interface ReelProofReceipt {
  status:
    | 'claimed'
    | 'processing'
    | 'ready'
    | 'published'
    | 'failed'
    | 'needs-review';
  containerId?: string;
  providerStatus?: string;
  providerPublicationId?: string;
  externalUrl?: string;
  warning?: string;
  lastError?: string;
  attemptCount?: number;
}

interface ReelProofResponse {
  accepted?: boolean;
  processing?: boolean;
  readyToPublish?: boolean;
  complete?: boolean;
  published?: boolean;
  duplicatePrevented?: boolean;
  idempotencyKey?: string;
  receipt?: ReelProofReceipt;
  error?: string;
  manualReviewRequired?: boolean;
  safeToRetry?: boolean;
}

interface ReelReadiness {
  ready: boolean;
  summary: string;
  checks: Array<{
    id: string;
    label: string;
    complete: boolean;
  }>;
  error?: string;
}

function selectedInstagramReelVideo(
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
  const compatible = (asset: EventAsset | undefined): asset is EventAsset =>
    Boolean(
      asset &&
        asset.status === 'approved' &&
        asset.kind === 'video' &&
        asset.role === 'reel-video' &&
        asset.platforms.includes('reel'),
    );
  const primary = selected.find(
    (asset) => asset.id === postPackage?.primaryAssetId,
  );
  if (compatible(primary)) return primary;
  return selected.find(compatible);
}

function buildInstagramReelCaption(
  item: CampaignContentItem | undefined,
  eventTitle: string,
): string {
  if (!item) return '';
  const draft = buildShortVideoPublicationDrafts({ item, eventTitle }).find(
    (entry) => entry.platform === 'instagram-reel',
  );
  if (!draft) return '';
  let caption = draft.caption.trim();
  for (const hashtag of draft.hashtags) {
    if (caption.toLowerCase().includes(hashtag.toLowerCase())) continue;
    const next = `${caption}${caption ? '\n\n' : ''}${hashtag}`;
    if (next.length > 2200) break;
    caption = next;
  }
  return caption.slice(0, 2200);
}

function receiptTone(status: ReelProofReceipt['status'] | undefined): string {
  if (status === 'published') {
    return 'border-emerald-200/20 bg-emerald-200/[.08] text-emerald-100';
  }
  if (status === 'ready') {
    return 'border-cyan-200/20 bg-cyan-200/[.08] text-cyan-100';
  }
  if (status === 'processing' || status === 'claimed') {
    return 'border-violet-200/20 bg-violet-200/[.08] text-violet-100';
  }
  if (status === 'failed' || status === 'needs-review') {
    return 'border-red-200/20 bg-red-200/[.08] text-red-100';
  }
  return 'border-white/12 bg-white/[.04] text-white/55';
}

export function InstagramReelProofClient({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState<OperationsEvent | null>();
  const [workspace, setWorkspace] = useState<EventGrowthWorkspace>();
  const [assembly, setAssembly] = useState<EventPostAssembly>(
    emptyEventPostAssembly(eventId),
  );
  const [assets, setAssets] = useState<EventAsset[]>([]);
  const [readiness, setReadiness] = useState<ReelReadiness>();
  const [mediaLocked, setMediaLocked] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [receipt, setReceipt] = useState<ReelProofReceipt>();
  const [idempotencyKey, setIdempotencyKey] = useState('');

  const load = useCallback(async () => {
    const nextEvent = await eventRepository.getEvent(eventId);
    setEvent(nextEvent);
    if (!nextEvent) return;
    const nextWorkspace = await growthWorkspaceRepository.getWorkspace(nextEvent);
    const [nextAssembly, readinessResponse] = await Promise.all([
      postAssemblyRepository.get(eventId),
      fetch('/api/admin/autopilot/meta/instagram/reel/readiness', {
        cache: 'no-store',
      }),
    ]);
    setWorkspace(nextWorkspace);
    setAssembly(nextAssembly);
    const readinessPayload = (await readinessResponse.json()) as ReelReadiness;
    if (readinessResponse.ok) setReadiness(readinessPayload);
    else setMessage(readinessPayload.error || 'Could not check Reel readiness.');

    try {
      setAssets(await fetchEventAssets(eventId));
      setMediaLocked(false);
    } catch (error) {
      if (error instanceof AssetSessionError && error.status === 401) {
        setMediaLocked(true);
        setAssets([]);
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
          : 'Could not prepare the Instagram Reel proof.',
      ),
    );
  }, [load]);

  const verticalVideoItem = useMemo(
    () => workspace?.content.find((item) => item.channel === 'reel'),
    [workspace],
  );
  const video = useMemo(
    () => selectedInstagramReelVideo(verticalVideoItem, assembly, assets),
    [assembly, assets, verticalVideoItem],
  );
  const caption = useMemo(
    () => buildInstagramReelCaption(verticalVideoItem, event?.title ?? ''),
    [event?.title, verticalVideoItem],
  );
  const copyApproved = Boolean(
    verticalVideoItem &&
      ['approved', 'scheduled', 'published'].includes(verticalVideoItem.status),
  );
  const active = Boolean(
    receipt && ['claimed', 'processing', 'ready', 'published'].includes(receipt.status),
  );
  const canInitialize = Boolean(
    readiness?.ready && copyApproved && video && caption && !active,
  );

  async function unlockMedia() {
    setPending(true);
    setMessage('');
    try {
      await unlockAssetSession(accessCode);
      setAccessCode('');
      await load();
      setMessage('Approved Reel media unlocked for this browser.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not unlock media.');
    } finally {
      setPending(false);
    }
  }

  async function initializeProof() {
    if (!verticalVideoItem || !video || !caption) return;
    const confirmed = window.confirm(
      'Create a real Meta Reel upload container using the displayed video and caption? This uploads and processes the video, but does not publish it live yet.',
    );
    if (!confirmed) return;
    setPending(true);
    setMessage('');
    try {
      const response = await fetch(
        '/api/admin/autopilot/meta/instagram/reel/initialize',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId,
            contentItemId: `${verticalVideoItem.id}-instagram-reel`,
            caption,
            videoUrl: video.url,
            shareToFeed: true,
            confirmation: 'CREATE_REEL_CONTAINER',
          }),
        },
      );
      const payload = (await response.json()) as ReelProofResponse;
      if (payload.receipt) setReceipt(payload.receipt);
      if (payload.idempotencyKey) setIdempotencyKey(payload.idempotencyKey);
      if (!response.ok && !payload.receipt) {
        throw new Error(payload.error || 'Could not create the Reel container.');
      }
      setMessage(
        payload.duplicatePrevented
          ? 'The existing Reel proof receipt was restored. No duplicate container was intentionally created.'
          : 'Meta accepted the Reel container. Refresh processing status before the final live publish.',
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Could not create the Reel container.',
      );
    } finally {
      setPending(false);
    }
  }

  async function refreshStatus() {
    if (!idempotencyKey) return;
    setPending(true);
    setMessage('');
    try {
      const response = await fetch(
        '/api/admin/autopilot/meta/instagram/reel/status',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idempotencyKey,
            confirmation: 'CHECK_REEL_STATUS',
          }),
        },
      );
      const payload = (await response.json()) as ReelProofResponse;
      if (payload.receipt) setReceipt(payload.receipt);
      if (!response.ok && !payload.receipt) {
        throw new Error(payload.error || 'Could not refresh Reel processing.');
      }
      setMessage(
        payload.readyToPublish
          ? 'Meta finished processing. The Reel is ready for the separate final publish confirmation.'
          : payload.processing
            ? `Meta is still processing the Reel${payload.receipt?.providerStatus ? `: ${payload.receipt.providerStatus}` : '.'}`
            : payload.error || 'The Reel container needs attention.',
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Could not refresh Reel processing.',
      );
    } finally {
      setPending(false);
    }
  }

  async function publishReadyReel() {
    if (!idempotencyKey || receipt?.status !== 'ready' || !workspace || !verticalVideoItem) {
      return;
    }
    const confirmed = window.confirm(
      'FINAL LIVE STEP: Publish this processed Reel to the real Club Bahia Instagram account now and share it to the feed?',
    );
    if (!confirmed) return;
    setPending(true);
    setMessage('');
    try {
      const response = await fetch(
        '/api/admin/autopilot/meta/instagram/reel/commit',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idempotencyKey,
            confirmation: 'PUBLISH_READY_REEL',
          }),
        },
      );
      const payload = (await response.json()) as ReelProofResponse;
      if (payload.receipt) setReceipt(payload.receipt);
      if (!response.ok || !payload.published || !payload.receipt) {
        throw new Error(
          payload.error ||
            (payload.manualReviewRequired
              ? 'Meta returned an uncertain publish result. Check Instagram before another action.'
              : 'Instagram Reel publication failed.'),
        );
      }
      await publishingExecutionRepository.updateItem(
        eventId,
        workspace.content,
        verticalVideoItem.id,
        {
          externalUrl: payload.receipt.externalUrl,
          notes: [
            payload.receipt.providerPublicationId
              ? `Instagram Reel ID: ${payload.receipt.providerPublicationId}`
              : '',
            payload.duplicatePrevented
              ? 'Existing Reel receipt reused.'
              : 'Published by the controlled Instagram Reel proof.',
            payload.receipt.warning ?? '',
          ]
            .filter(Boolean)
            .join('\n'),
        },
      );
      await publishingExecutionRepository.setStatus(
        eventId,
        workspace.content,
        verticalVideoItem.id,
        'published',
      );
      setMessage(
        payload.duplicatePrevented
          ? 'The saved live Reel receipt was reused without publishing a duplicate.'
          : 'The Instagram Reel is live and its provider receipt was saved.',
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Instagram Reel publication failed.',
      );
    } finally {
      setPending(false);
    }
  }

  if (event === undefined || !workspace) {
    return (
      <section className="rounded-[1.5rem] border border-white/10 p-5 text-sm text-white/55">
        Loading controlled Instagram Reel proof…
      </section>
    );
  }
  if (event === null) return null;

  return (
    <section className="overflow-hidden rounded-[1.65rem] border border-pink-200/16 bg-[radial-gradient(circle_at_90%_0%,rgba(244,114,182,.15),transparent_25rem),linear-gradient(145deg,rgba(28,14,23,.97),rgba(13,12,11,.97))] shadow-[0_24px_75px_rgba(0,0,0,.3)]">
      <div className="p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-pink-100/70">
              Controlled Reel proof
            </p>
            <h2 className="mt-2 font-serif text-3xl text-white">
              Process first. Publish only after a second confirmation.
            </h2>
            <p className="mt-2 text-sm leading-7 text-white/56">
              Meta video processing can outlive a browser request. This proof keeps container creation, status verification, and the final live publication as separate durable steps.
            </p>
          </div>
          <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[.12em] ${receiptTone(receipt?.status)}`}>
            {receipt?.status?.replace('-', ' ') ?? (readiness?.ready ? 'proof ready' : 'setup gated')}
          </span>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-3">
          {(readiness?.checks ?? []).map((check) => (
            <div key={check.id} className="rounded-xl border border-white/8 bg-black/18 p-3 text-xs">
              <p className={check.complete ? 'text-emerald-100/75' : 'text-amber-100/75'}>
                {check.complete ? '✓' : '•'} {check.label}
              </p>
            </div>
          ))}
        </div>

        {mediaLocked ? (
          <form
            className="mt-4 flex flex-col gap-2 rounded-2xl border border-violet-200/16 bg-violet-200/[.06] p-4 sm:flex-row"
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
              disabled={pending || !accessCode.trim()}
              className="min-h-11 rounded-full bg-violet-100 px-5 text-sm font-bold text-black disabled:opacity-40"
            >
              Unlock media
            </button>
          </form>
        ) : null}

        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)]">
          <div className="rounded-2xl border border-white/10 bg-black/22 p-3">
            {video ? (
              <video
                src={video.url}
                controls
                preload="metadata"
                playsInline
                className="aspect-[9/16] max-h-[34rem] w-full rounded-xl bg-black object-contain"
              />
            ) : (
              <div className="flex aspect-[9/16] max-h-[34rem] items-center justify-center rounded-xl border border-dashed border-white/15 p-5 text-center text-sm leading-6 text-white/42">
                Assign an approved vertical video marked for Instagram Reel.
              </div>
            )}
            <p className="mt-3 text-xs text-white/48">
              {video ? `${video.name} · ${(video.size / 1024 / 1024).toFixed(1)} MB` : 'No compatible approved video selected'}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/22 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[.17em] text-white/38">
              Exact Reel caption
            </p>
            <p className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap text-sm leading-6 text-white/72">
              {caption || 'Generate and approve the Instagram Reel copy first.'}
            </p>
            <div className="mt-4 space-y-2 text-xs">
              <p className={copyApproved ? 'text-emerald-100/75' : 'text-amber-100/75'}>
                {copyApproved ? '✓ Vertical-video copy approved' : '• Approve the vertical-video copy first'}
              </p>
              <p className={video ? 'text-emerald-100/75' : 'text-amber-100/75'}>
                {video ? '✓ Approved public video selected' : '• Assign approved Reel video'}
              </p>
              <p className={readiness?.ready ? 'text-emerald-100/75' : 'text-amber-100/75'}>
                {readiness?.ready ? '✓ Controlled provider proof enabled' : `• ${readiness?.summary ?? 'Provider proof setup incomplete'}`}
              </p>
            </div>

            {receipt ? (
              <div className="mt-4 rounded-xl border border-white/9 bg-black/22 p-3 text-xs leading-5 text-white/58">
                <p>Status: {receipt.status}</p>
                {receipt.providerStatus ? <p>Meta container: {receipt.providerStatus}</p> : null}
                {receipt.attemptCount ? <p>Attempt: {receipt.attemptCount}</p> : null}
                {receipt.lastError ? <p className="text-red-100/75">{receipt.lastError}</p> : null}
                {receipt.warning ? <p className="text-amber-100/75">{receipt.warning}</p> : null}
                {receipt.externalUrl ? (
                  <a href={receipt.externalUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-emerald-100 underline underline-offset-4">
                    Open live Reel
                  </a>
                ) : null}
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={pending || !canInitialize}
                onClick={() => void initializeProof()}
                className="min-h-11 rounded-full border border-pink-200/20 bg-pink-200/[.09] px-5 text-xs font-bold text-pink-50 disabled:opacity-35"
              >
                {pending ? 'Working…' : '1 · Create Reel container'}
              </button>
              {receipt?.status === 'processing' || receipt?.status === 'claimed' ? (
                <button
                  type="button"
                  disabled={pending || !idempotencyKey}
                  onClick={() => void refreshStatus()}
                  className="min-h-11 rounded-full border border-cyan-200/20 bg-cyan-200/[.08] px-5 text-xs font-bold text-cyan-50 disabled:opacity-35"
                >
                  2 · Refresh processing
                </button>
              ) : null}
              {receipt?.status === 'ready' ? (
                <button
                  type="button"
                  disabled={pending || !idempotencyKey}
                  onClick={() => void publishReadyReel()}
                  className="min-h-11 rounded-full bg-emerald-200 px-5 text-xs font-bold text-black disabled:opacity-35"
                >
                  3 · Publish Reel live
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {message ? (
          <p role="status" className="mt-4 rounded-xl border border-amber-200/15 bg-amber-200/[.06] px-4 py-3 text-sm text-amber-50/80">
            {message}
          </p>
        ) : null}
      </div>
    </section>
  );
}
