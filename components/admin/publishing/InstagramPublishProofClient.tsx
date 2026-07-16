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
import { publishingExecutionRepository } from '@/lib/admin/publishing/execution-repository';
import { postAssemblyRepository } from '@/lib/admin/publishing/repository';

interface PublicationReceipt {
  status: 'claimed' | 'published' | 'failed' | 'needs-review';
  providerPublicationId?: string;
  externalUrl?: string;
  warning?: string;
  lastError?: string;
  attemptCount?: number;
}

interface PublicationResponse {
  published?: boolean;
  duplicatePrevented?: boolean;
  trackedUrl?: string;
  receipt?: PublicationReceipt;
  error?: string;
  manualReviewRequired?: boolean;
  safeToRetry?: boolean;
}

function selectedInstagramAsset(
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
  const primary = selected?.find(
    (asset) => asset.id === postPackage?.primaryAssetId,
  );
  if (
    primary?.kind === 'image' &&
    isAssetCompatibleWithChannel(primary, 'instagram-feed')
  ) {
    return primary;
  }
  return selected?.find(
    (asset) =>
      asset.kind === 'image' &&
      isAssetCompatibleWithChannel(asset, 'instagram-feed'),
  );
}

export function InstagramPublishProofClient({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState<OperationsEvent | null>();
  const [workspace, setWorkspace] = useState<EventGrowthWorkspace>();
  const [assembly, setAssembly] = useState<EventPostAssembly>(
    emptyEventPostAssembly(eventId),
  );
  const [assets, setAssets] = useState<EventAsset[]>([]);
  const [readiness, setReadiness] = useState<PromotionAutopilotReadiness>();
  const [mediaLocked, setMediaLocked] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [executionPublished, setExecutionPublished] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [receipt, setReceipt] = useState<PublicationReceipt>();

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

    const execution = await publishingExecutionRepository.get(
      eventId,
      nextWorkspace.content,
    );
    const instagramItem = nextWorkspace.content.find(
      (item) => item.channel === 'instagram-feed',
    );
    setExecutionPublished(
      execution.items.find(
        (item) => item.contentItemId === instagramItem?.id,
      )?.status === 'published',
    );

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
          : 'Could not prepare the Instagram publication panel.',
      ),
    );
  }, [load]);

  const instagramItem = useMemo(
    () =>
      workspace?.content.find((item) => item.channel === 'instagram-feed'),
    [workspace],
  );
  const asset = useMemo(
    () => selectedInstagramAsset(instagramItem, assembly, assets),
    [assembly, assets, instagramItem],
  );
  const metaAccount = readiness?.accounts.find(
    (account) => account.provider === 'meta',
  );
  const liveCapability = metaAccount?.capabilities.find(
    (capability) => capability.id === 'instagram-image',
  );
  const copyApproved = Boolean(
    instagramItem &&
      ['approved', 'scheduled', 'published'].includes(instagramItem.status),
  );
  const readyToPublish = Boolean(
    liveCapability?.available && copyApproved && asset && !executionPublished,
  );

  async function unlockMedia() {
    setPending(true);
    setMessage('');
    try {
      await unlockAssetSession(accessCode);
      setAccessCode('');
      await load();
      setMessage('Media unlocked. Review the exact post before publishing.');
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Could not unlock media.',
      );
    } finally {
      setPending(false);
    }
  }

  async function publishNow() {
    if (!instagramItem || !asset || !workspace) return;
    const confirmed = window.confirm(
      'This will publish the displayed image and caption to the real Club Bahia Instagram account now. Continue?',
    );
    if (!confirmed) return;

    setPending(true);
    setMessage('');
    try {
      const response = await fetch(
        '/api/admin/autopilot/meta/instagram/publish',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId,
            contentItemId: instagramItem.id,
            caption: instagramItem.body,
            imageUrl: asset.url,
            reservationUrl: workspace.brief.reservationUrl,
            confirmation: 'PUBLISH_NOW',
          }),
        },
      );
      const payload = (await response.json()) as PublicationResponse;
      if (!response.ok || !payload.published || !payload.receipt) {
        setReceipt(payload.receipt);
        throw new Error(
          payload.error ||
            (payload.manualReviewRequired
              ? 'Meta returned an uncertain result. Check Instagram before retrying.'
              : 'Instagram publication failed.'),
        );
      }

      setReceipt(payload.receipt);
      const notes = [
        payload.receipt.providerPublicationId
          ? `Meta publication ID: ${payload.receipt.providerPublicationId}`
          : '',
        payload.duplicatePrevented
          ? 'Duplicate submission prevented; existing publication receipt reused.'
          : 'Published directly by Club Bahia Promotion Autopilot.',
        payload.receipt.warning ?? '',
      ]
        .filter(Boolean)
        .join('\n');
      await publishingExecutionRepository.updateItem(
        eventId,
        workspace.content,
        instagramItem.id,
        {
          externalUrl: payload.receipt.externalUrl,
          notes,
        },
      );
      await publishingExecutionRepository.setStatus(
        eventId,
        workspace.content,
        instagramItem.id,
        'published',
      );
      setExecutionPublished(true);
      setMessage(
        payload.duplicatePrevented
          ? 'This exact post was already published. The saved receipt was reused without creating a duplicate.'
          : 'Instagram publication succeeded and the live receipt was saved.',
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Instagram publication failed.',
      );
    } finally {
      setPending(false);
    }
  }

  if (event === undefined || !workspace) {
    return (
      <section className="rounded-[1.5rem] border border-white/10 p-5 text-sm text-white/55">
        Loading controlled Instagram publishing…
      </section>
    );
  }
  if (event === null) return null;

  return (
    <section className="overflow-hidden rounded-[1.6rem] border border-fuchsia-200/16 bg-[radial-gradient(circle_at_90%_0%,rgba(236,72,153,.15),transparent_24rem),linear-gradient(145deg,rgba(24,15,22,.96),rgba(13,12,11,.97))] shadow-[0_24px_75px_rgba(0,0,0,.3)]">
      <div className="p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-fuchsia-200/70">
              Controlled live proof
            </p>
            <h2 className="mt-2 font-serif text-3xl text-white">
              Publish one Instagram image exactly once
            </h2>
            <p className="mt-2 text-sm leading-7 text-white/56">
              This panel uses the approved Instagram caption and assigned image. It records a durable claim before contacting Meta so a repeated tap cannot intentionally create the same post twice.
            </p>
          </div>
          <span
            className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[.12em] ${
              liveCapability?.available
                ? 'border-emerald-200/25 bg-emerald-200/10 text-emerald-100'
                : 'border-amber-200/20 bg-amber-200/[.07] text-amber-100'
            }`}
          >
            {liveCapability?.available ? 'Live connection ready' : 'Connection gated'}
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
            {asset ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={asset.url}
                  alt={asset.altText || asset.name}
                  className="aspect-square w-full rounded-xl bg-black object-contain"
                />
                <p className="mt-3 truncate text-sm font-semibold text-white">
                  {asset.name}
                </p>
                <p className="mt-1 text-xs text-white/42">
                  {EVENT_ASSET_ROLE_LABELS[asset.role]} · approved image
                </p>
              </>
            ) : (
              <div className="flex aspect-square items-center justify-center rounded-xl border border-dashed border-white/15 p-5 text-center text-sm leading-6 text-white/42">
                Assign an approved image to the Instagram feed post before publishing.
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/22 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[.17em] text-white/38">
              Exact caption
            </p>
            <p className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap text-sm leading-6 text-white/72">
              {instagramItem?.body || 'Generate and approve the Instagram caption first.'}
            </p>
            <div className="mt-4 grid gap-2 text-xs">
              <p className={copyApproved ? 'text-emerald-100/75' : 'text-amber-100/75'}>
                {copyApproved ? '✓ Caption approved' : '• Caption still needs approval'}
              </p>
              <p className={asset ? 'text-emerald-100/75' : 'text-amber-100/75'}>
                {asset ? '✓ Approved image assigned' : '• Approved image still needed'}
              </p>
              <p className={liveCapability?.available ? 'text-emerald-100/75' : 'text-amber-100/75'}>
                {liveCapability?.available
                  ? '✓ Meta live-publishing safeguards configured'
                  : `• ${liveCapability?.reason ?? 'Meta connection setup is incomplete'}`}
              </p>
            </div>
          </div>
        </div>

        {receipt ? (
          <div className="mt-4 rounded-2xl border border-emerald-200/15 bg-emerald-200/[.055] p-4 text-sm text-emerald-50/75">
            <p className="font-semibold text-emerald-100">Publication receipt</p>
            {receipt.providerPublicationId ? (
              <p className="mt-2 break-all text-xs">
                Meta ID: {receipt.providerPublicationId}
              </p>
            ) : null}
            {receipt.externalUrl ? (
              <a
                href={receipt.externalUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex min-h-10 items-center rounded-full border border-emerald-200/20 px-4 text-xs font-semibold"
              >
                Open live Instagram post
              </a>
            ) : null}
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
            disabled={!readyToPublish || pending}
            onClick={() => void publishNow()}
            className="min-h-12 rounded-full bg-fuchsia-200 px-6 text-sm font-bold text-black disabled:cursor-not-allowed disabled:opacity-35"
          >
            {pending
              ? 'Publishing and saving receipt…'
              : executionPublished
                ? 'Instagram post recorded as live'
                : 'Publish this image to Instagram now'}
          </button>
          <button
            type="button"
            onClick={() => void load()}
            disabled={pending}
            className="min-h-12 rounded-full border border-white/15 px-5 text-sm font-semibold text-white/65 disabled:opacity-40"
          >
            Refresh checks
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
