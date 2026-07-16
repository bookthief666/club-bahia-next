'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { EventAsset } from '@/lib/admin/assets/domain';
import { EVENT_ASSET_ROLE_LABELS } from '@/lib/admin/assets/domain';
import {
  AssetSessionError,
  fetchEventAssets,
  unlockAssetSession,
} from '@/lib/admin/assets/client-session';
import type { PromotionAutopilotReadiness } from '@/lib/admin/autopilot/domain';
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
import { postAssemblyRepository } from '@/lib/admin/publishing/repository';

interface TikTokCreatorInfo {
  username?: string;
  nickname?: string;
  privacyLevelOptions: string[];
  commentDisabled: boolean;
  duetDisabled: boolean;
  stitchDisabled: boolean;
  maxVideoPostDurationSec: number;
}

interface PublicationReceipt {
  status: 'claimed' | 'processing' | 'published' | 'failed' | 'needs-review';
  providerPublicationId?: string;
  providerStatus?: string;
  privacyLevel?: string;
  warning?: string;
  lastError?: string;
  attemptCount?: number;
}

interface PublishResponse {
  accepted?: boolean;
  processing?: boolean;
  complete?: boolean;
  duplicatePrevented?: boolean;
  idempotencyKey?: string;
  receipt?: PublicationReceipt;
  creator?: Pick<
    TikTokCreatorInfo,
    'username' | 'nickname' | 'maxVideoPostDurationSec'
  >;
  error?: string;
  manualReviewRequired?: boolean;
  safeToRetry?: boolean;
}

function selectedTikTokVideo(
  item: CampaignContentItem | undefined,
  assembly: EventPostAssembly,
  assets: EventAsset[],
): EventAsset | undefined {
  if (!item) return undefined;
  const postPackage = assembly.packages.find(
    (entry) => entry.contentItemId === item.id,
  );
  const selected = postPackage?.assetIds
    .map((assetId) => assets.find((asset) => asset.id === assetId))
    .filter((asset): asset is EventAsset => Boolean(asset));
  const compatible = (asset: EventAsset | undefined): asset is EventAsset =>
    Boolean(
      asset &&
        asset.status === 'approved' &&
        asset.kind === 'video' &&
        asset.role === 'reel-video' &&
        (asset.platforms.includes('tiktok') || asset.platforms.includes('reel')),
    );
  const primary = selected?.find(
    (asset) => asset.id === postPackage?.primaryAssetId,
  );
  if (compatible(primary)) return primary;
  return selected?.find(compatible);
}

function buildCaption(
  item: CampaignContentItem | undefined,
  eventTitle: string,
): string {
  if (!item) return '';
  const draft = buildShortVideoPublicationDrafts({ item, eventTitle }).find(
    (entry) => entry.platform === 'tiktok',
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

export function TikTokPrivatePublishClient({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState<OperationsEvent | null>();
  const [workspace, setWorkspace] = useState<EventGrowthWorkspace>();
  const [assembly, setAssembly] = useState<EventPostAssembly>(
    emptyEventPostAssembly(eventId),
  );
  const [assets, setAssets] = useState<EventAsset[]>([]);
  const [readiness, setReadiness] = useState<PromotionAutopilotReadiness>();
  const [creator, setCreator] = useState<TikTokCreatorInfo>();
  const [mediaLocked, setMediaLocked] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [receipt, setReceipt] = useState<PublicationReceipt>();
  const [idempotencyKey, setIdempotencyKey] = useState('');

  const load = useCallback(async () => {
    setMessage('');
    const nextEvent = await eventRepository.getEvent(eventId);
    setEvent(nextEvent);
    if (!nextEvent) return;

    const nextWorkspace = await growthWorkspaceRepository.getWorkspace(nextEvent);
    const [nextAssembly, readinessResponse] = await Promise.all([
      postAssemblyRepository.get(eventId),
      fetch('/api/admin/autopilot/readiness', { cache: 'no-store' }),
    ]);
    setWorkspace(nextWorkspace);
    setAssembly(nextAssembly);
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
          : 'Could not prepare the TikTok private-test panel.',
      ),
    );
  }, [load]);

  const verticalVideoItem = useMemo(
    () => workspace?.content.find((item) => item.channel === 'reel'),
    [workspace],
  );
  const video = useMemo(
    () => selectedTikTokVideo(verticalVideoItem, assembly, assets),
    [assembly, assets, verticalVideoItem],
  );
  const caption = useMemo(
    () => buildCaption(verticalVideoItem, event?.title ?? ''),
    [event?.title, verticalVideoItem],
  );
  const copyApproved = Boolean(
    verticalVideoItem &&
      ['approved', 'scheduled', 'published'].includes(verticalVideoItem.status),
  );
  const tiktokAccount = readiness?.accounts.find(
    (account) => account.provider === 'tiktok',
  );
  const privateConnectionReady = [
    'tiktok-app',
    'tiktok-redirect',
    'tiktok-account',
    'tiktok-tokens',
    'tiktok-content-posting',
    'tiktok-media-host',
    'tiktok-receipts',
  ].every(
    (id) => tiktokAccount?.checks.find((check) => check.id === id)?.complete,
  );
  const privatePrivacyAvailable = Boolean(
    creator?.privacyLevelOptions.includes('SELF_ONLY'),
  );
  const alreadyActive = ['claimed', 'processing', 'published'].includes(
    receipt?.status ?? '',
  );
  const readyToPublish = Boolean(
    privateConnectionReady &&
      privatePrivacyAvailable &&
      copyApproved &&
      video &&
      caption &&
      !alreadyActive,
  );

  async function unlockMedia() {
    setPending(true);
    setMessage('');
    try {
      await unlockAssetSession(accessCode);
      setAccessCode('');
      await load();
      setMessage('Media unlocked. Review the private TikTok test carefully.');
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Could not unlock media.',
      );
    } finally {
      setPending(false);
    }
  }

  async function checkCreator() {
    setPending(true);
    setMessage('');
    try {
      const response = await fetch('/api/admin/autopilot/tiktok/creator', {
        cache: 'no-store',
      });
      const payload = (await response.json()) as {
        creator?: TikTokCreatorInfo;
        privateTestAvailable?: boolean;
        error?: string;
      };
      if (!response.ok || !payload.creator) {
        throw new Error(payload.error || 'Could not verify the TikTok account.');
      }
      setCreator(payload.creator);
      setMessage(
        payload.privateTestAvailable
          ? 'TikTok account verified. SELF_ONLY is available for the private test.'
          : 'TikTok account verified, but SELF_ONLY is unavailable, so publishing remains blocked.',
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Could not verify the TikTok account.',
      );
    } finally {
      setPending(false);
    }
  }

  async function publishPrivateTest() {
    if (!verticalVideoItem || !video || !caption) return;
    const confirmed = window.confirm(
      'This sends the displayed video to the real Club Bahia TikTok account as SELF_ONLY. Comments, duets, and stitches will be disabled. Continue?',
    );
    if (!confirmed) return;

    setPending(true);
    setMessage('');
    try {
      const response = await fetch(
        '/api/admin/autopilot/tiktok/video/publish',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId,
            contentItemId: `${verticalVideoItem.id}-tiktok-video`,
            caption,
            videoUrl: video.url,
            confirmation: 'PUBLISH_PRIVATE_TEST',
          }),
        },
      );
      const payload = (await response.json()) as PublishResponse;
      setReceipt(payload.receipt);
      if (payload.idempotencyKey) setIdempotencyKey(payload.idempotencyKey);
      if (!response.ok || !payload.accepted || !payload.receipt) {
        throw new Error(
          payload.error ||
            (payload.manualReviewRequired
              ? 'TikTok returned an uncertain result. Check the real account before another attempt.'
              : 'TikTok private test failed.'),
        );
      }
      setMessage(
        payload.duplicatePrevented
          ? 'The existing TikTok receipt was reused; no duplicate test was created.'
          : 'TikTok accepted the private test. Refresh its processing status until completion.',
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'TikTok private test failed.',
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
      const response = await fetch('/api/admin/autopilot/tiktok/video/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idempotencyKey,
          confirmation: 'CHECK_STATUS',
        }),
      });
      const payload = (await response.json()) as PublishResponse;
      if (payload.receipt) setReceipt(payload.receipt);
      if (!response.ok && !payload.receipt) {
        throw new Error(payload.error || 'Could not refresh TikTok status.');
      }
      setMessage(
        payload.complete
          ? 'TikTok reports that the SELF_ONLY test completed successfully.'
          : payload.processing
            ? `TikTok is still processing the video${payload.receipt?.providerStatus ? `: ${payload.receipt.providerStatus}` : '.'}`
            : payload.error || 'TikTok processing did not complete.',
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Could not refresh TikTok status.',
      );
    } finally {
      setPending(false);
    }
  }

  if (event === undefined || !workspace) {
    return (
      <section className="rounded-[1.5rem] border border-white/10 p-5 text-sm text-white/55">
        Loading controlled TikTok publishing…
      </section>
    );
  }
  if (event === null) return null;

  return (
    <section className="overflow-hidden rounded-[1.6rem] border border-cyan-200/16 bg-[radial-gradient(circle_at_90%_0%,rgba(34,211,238,.14),transparent_24rem),linear-gradient(145deg,rgba(12,22,24,.97),rgba(13,12,11,.97))] shadow-[0_24px_75px_rgba(0,0,0,.3)]">
      <div className="p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-cyan-100/70">
              Controlled private proof
            </p>
            <h2 className="mt-2 font-serif text-3xl text-white">
              Test one TikTok video as SELF_ONLY
            </h2>
            <p className="mt-2 text-sm leading-7 text-white/56">
              This verifies the real creator, approved video, private visibility, asynchronous processing, and durable duplicate protection before public TikTok automation is allowed.
            </p>
          </div>
          <span
            className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[.12em] ${
              privateConnectionReady
                ? 'border-emerald-200/25 bg-emerald-200/10 text-emerald-100'
                : 'border-amber-200/20 bg-amber-200/[.07] text-amber-100'
            }`}
          >
            {privateConnectionReady ? 'Private test configured' : 'Connection gated'}
          </span>
        </div>

        {mediaLocked ? (
          <form
            className="mt-5 rounded-2xl border border-violet-200/18 bg-violet-200/[.06] p-4"
            onSubmit={(formEvent) => {
              formEvent.preventDefault();
              void unlockMedia();
            }}
          >
            <p className="text-sm font-semibold text-white">Unlock approved event media</p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                type="password"
                value={accessCode}
                onChange={(inputEvent) => setAccessCode(inputEvent.target.value)}
                placeholder="Media access code"
                className="min-h-11 min-w-0 flex-1 rounded-xl border border-white/12 bg-black/25 px-3"
              />
              <button
                disabled={pending || !accessCode.trim()}
                className="min-h-11 rounded-full bg-violet-100 px-5 text-sm font-bold text-black disabled:opacity-40"
              >
                Unlock media
              </button>
            </div>
          </form>
        ) : null}

        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)]">
          <div className="rounded-2xl border border-white/10 bg-black/22 p-3">
            {video ? (
              <>
                <video
                  src={video.url}
                  controls
                  preload="metadata"
                  className="aspect-[9/16] max-h-[34rem] w-full rounded-xl bg-black object-contain"
                />
                <p className="mt-3 truncate text-sm font-semibold text-white">
                  {video.name}
                </p>
                <p className="mt-1 text-xs text-white/42">
                  {EVENT_ASSET_ROLE_LABELS[video.role]} · approved video
                </p>
              </>
            ) : (
              <div className="flex aspect-[9/16] items-center justify-center rounded-xl border border-dashed border-white/15 p-5 text-center text-sm leading-6 text-white/42">
                Assign an approved vertical video to the shared Reel/TikTok package before testing.
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/22 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[.17em] text-white/38">
              Exact TikTok caption
            </p>
            <p className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap text-sm leading-6 text-white/72">
              {caption || 'Generate and approve the vertical-video package first.'}
            </p>
            <div className="mt-4 grid gap-2 text-xs">
              <p className={copyApproved ? 'text-emerald-100/75' : 'text-amber-100/75'}>
                {copyApproved ? '✓ Vertical-video copy approved' : '• Copy still needs approval'}
              </p>
              <p className={video ? 'text-emerald-100/75' : 'text-amber-100/75'}>
                {video ? '✓ Approved vertical video assigned' : '• Approved vertical video still needed'}
              </p>
              <p className={privateConnectionReady ? 'text-emerald-100/75' : 'text-amber-100/75'}>
                {privateConnectionReady ? '✓ TikTok private-test safeguards configured' : '• TikTok app, account, media host, or receipts still need setup'}
              </p>
              <p className={privatePrivacyAvailable ? 'text-emerald-100/75' : 'text-amber-100/75'}>
                {privatePrivacyAvailable ? '✓ Creator confirmed SELF_ONLY privacy' : '• Verify the creator and available privacy settings'}
              </p>
            </div>

            {creator ? (
              <div className="mt-4 rounded-xl border border-cyan-200/15 bg-cyan-200/[.055] p-3 text-xs leading-5 text-cyan-50/75">
                <p className="font-semibold text-cyan-100">
                  {creator.nickname || creator.username || 'Authorized TikTok creator'}
                </p>
                {creator.username ? <p>@{creator.username}</p> : null}
                <p>Private visibility: SELF_ONLY</p>
                <p>Comments, duets, and stitches: disabled for this proof</p>
                <p>Creator maximum duration: {creator.maxVideoPostDurationSec}s</p>
              </div>
            ) : null}
          </div>
        </div>

        {receipt ? (
          <div className="mt-4 rounded-2xl border border-cyan-200/15 bg-cyan-200/[.055] p-4 text-sm text-cyan-50/75">
            <p className="font-semibold text-cyan-100">TikTok processing receipt</p>
            <p className="mt-2 text-xs">Status: {receipt.status}</p>
            {receipt.providerStatus ? (
              <p className="mt-1 text-xs">TikTok status: {receipt.providerStatus}</p>
            ) : null}
            {receipt.providerPublicationId ? (
              <p className="mt-1 break-all text-xs">
                Publish ID: {receipt.providerPublicationId}
              </p>
            ) : null}
            <p className="mt-1 text-xs">Privacy: {receipt.privacyLevel || 'SELF_ONLY'}</p>
            {receipt.warning || receipt.lastError ? (
              <p className="mt-2 text-xs leading-5 text-amber-100/75">
                {receipt.warning || receipt.lastError}
              </p>
            ) : null}
          </div>
        ) : null}

        {message ? (
          <p
            role="status"
            className="mt-4 rounded-xl border border-amber-200/15 bg-amber-200/[.06] px-4 py-3 text-sm text-amber-50/80"
          >
            {message}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void checkCreator()}
            disabled={pending || !privateConnectionReady}
            className="min-h-12 rounded-full border border-cyan-100/25 bg-cyan-100/[.08] px-5 text-sm font-semibold text-cyan-50 disabled:opacity-35"
          >
            Verify TikTok account
          </button>
          <button
            type="button"
            disabled={!readyToPublish || pending}
            onClick={() => void publishPrivateTest()}
            className="min-h-12 rounded-full bg-cyan-200 px-6 text-sm font-bold text-black disabled:cursor-not-allowed disabled:opacity-35"
          >
            {pending
              ? 'Working…'
              : receipt?.status === 'published'
                ? 'Private TikTok test completed'
                : 'Send SELF_ONLY TikTok test'}
          </button>
          <button
            type="button"
            onClick={() => void refreshStatus()}
            disabled={pending || !idempotencyKey || receipt?.status !== 'processing'}
            className="min-h-12 rounded-full border border-white/15 px-5 text-sm font-semibold text-white/65 disabled:opacity-35"
          >
            Refresh TikTok status
          </button>
          <Link
            href="/admin/settings"
            className="inline-flex min-h-12 items-center rounded-full border border-white/15 px-5 text-sm font-semibold text-white/65"
          >
            Publishing connections
          </Link>
        </div>
      </div>
    </section>
  );
}
