'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { EventAsset } from '@/lib/admin/assets/domain';
import { EVENT_ASSET_ROLE_LABELS } from '@/lib/admin/assets/domain';
import { formatVenueDateTime } from '@/lib/admin/date';
import type { OperationsEvent } from '@/lib/admin/domain';
import { eventRepository } from '@/lib/admin/event-repository';
import {
  CAMPAIGN_CHANNEL_LABELS,
  type CampaignContentItem,
  type EventGrowthWorkspace,
} from '@/lib/admin/growth/domain';
import { growthWorkspaceRepository } from '@/lib/admin/growth/repository';
import {
  buildEventPostReadiness,
  CHANNEL_ASSET_REQUIRED,
  CHANNEL_DELIVERY_LABELS,
  emptyEventPostAssembly,
  isAssetCompatibleWithChannel,
  selectBestAssetForChannel,
  type CampaignPostPackage,
  type EventPostAssembly,
  type PostPackageReadiness,
} from '@/lib/admin/publishing/domain';
import { postAssemblyRepository } from '@/lib/admin/publishing/repository';

const ACCESS_SESSION_KEY = 'club-bahia-event-assets-access';
const ASSET_API = '/api/admin/assets';

function previewText(value: string): string {
  const compact = value.replace(/\s+/g, ' ').trim();
  return compact.length > 240 ? `${compact.slice(0, 240).trimEnd()}…` : compact;
}

function AssetPreview({ asset }: { asset: EventAsset }) {
  if (asset.kind === 'image') {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={asset.url}
        alt={asset.altText || asset.name}
        className="h-44 w-full rounded-xl bg-black/30 object-contain"
      />
    );
  }

  if (asset.kind === 'video') {
    return (
      <video
        src={asset.url}
        controls
        preload="metadata"
        playsInline
        className="h-52 w-full rounded-xl bg-black object-contain"
      />
    );
  }

  return (
    <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-white/15 bg-black/25 text-sm text-white/55">
      {asset.kind === 'audio' ? 'Audio asset' : 'Document asset'}
    </div>
  );
}

function CheckList({ readiness }: { readiness: PostPackageReadiness }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {readiness.checks.map((check) => (
        <div
          key={check.id}
          className={`rounded-xl border px-3 py-2 ${
            check.complete
              ? 'border-emerald-200/15 bg-emerald-200/7'
              : check.severity === 'blocked'
                ? 'border-red-200/20 bg-red-200/7'
                : 'border-amber-200/20 bg-amber-200/7'
          }`}
        >
          <p
            className={`text-xs font-semibold ${
              check.complete
                ? 'text-emerald-100'
                : check.severity === 'blocked'
                  ? 'text-red-100'
                  : 'text-amber-100'
            }`}
          >
            {check.complete ? '✓' : '○'} {check.label}
          </p>
          <p className="mt-1 text-[11px] leading-4 text-white/45">{check.detail}</p>
        </div>
      ))}
    </div>
  );
}

function PostPackageCard({
  item,
  postPackage,
  readiness,
  assets,
  pending,
  onAssign,
}: {
  item: CampaignContentItem;
  postPackage?: CampaignPostPackage;
  readiness: PostPackageReadiness;
  assets: EventAsset[];
  pending: boolean;
  onAssign: (assetId?: string) => Promise<void>;
}) {
  const compatibleAssets = assets.filter((asset) =>
    isAssetCompatibleWithChannel(asset, item.channel),
  );
  const selected = assets.find(
    (asset) => asset.id === postPackage?.primaryAssetId,
  );
  const requiresAsset = CHANNEL_ASSET_REQUIRED[item.channel];

  return (
    <article className="rounded-2xl border border-white/10 bg-[#141210]/80 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-100/70">
            {CAMPAIGN_CHANNEL_LABELS[item.channel]}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-white">{item.title}</h2>
          <p className="mt-1 text-xs text-white/45">
            {item.publishAt ? formatVenueDateTime(item.publishAt) : 'No delivery time'} · {CHANNEL_DELIVERY_LABELS[item.channel]}
          </p>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-bold ${
            readiness.ready
              ? 'border-emerald-200/20 bg-emerald-200/10 text-emerald-100'
              : 'border-amber-200/20 bg-amber-200/10 text-amber-100'
          }`}
        >
          {readiness.ready ? 'Package ready' : 'Needs setup'}
        </span>
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
        <p className="text-xs uppercase tracking-[0.14em] text-white/40">Approved copy</p>
        <p className="mt-2 text-sm leading-6 text-white/65">{previewText(item.body)}</p>
        <p className="mt-2 text-xs capitalize text-white/40">Copy status: {item.status}</p>
      </div>

      <div className="mt-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <label className="min-w-0 flex-1 text-sm text-white/70">
            {requiresAsset ? 'Primary media asset' : 'Optional media asset'}
            <select
              value={postPackage?.primaryAssetId ?? ''}
              disabled={pending}
              onChange={(event) => void onAssign(event.target.value || undefined)}
              className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-white outline-none focus:border-amber-200/45 disabled:opacity-40"
            >
              <option value="">{requiresAsset ? 'Choose approved media…' : 'No media'}</option>
              {compatibleAssets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.name} — {EVENT_ASSET_ROLE_LABELS[asset.role]}
                </option>
              ))}
            </select>
          </label>
          <Link
            href={`/admin/events/${item.id.split('-')[0] || ''}/assets`}
            className="hidden"
            aria-hidden="true"
            tabIndex={-1}
          >
            Media
          </Link>
        </div>

        {!compatibleAssets.length && requiresAsset ? (
          <p className="mt-2 rounded-xl border border-amber-200/20 bg-amber-200/8 px-3 py-2 text-xs leading-5 text-amber-50">
            No approved asset is assigned to this destination. Open the Event Asset Studio, update an asset’s platform assignment, and approve it.
          </p>
        ) : null}

        {selected ? (
          <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
            <AssetPreview asset={selected} />
            <div className="mt-3 flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{selected.name}</p>
                <p className="mt-1 text-xs text-white/45">
                  {EVENT_ASSET_ROLE_LABELS[selected.role]} · {selected.status}
                </p>
              </div>
              <a
                href={selected.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-white/15 px-3 py-2 text-xs font-semibold text-white/65"
              >
                Open original
              </a>
            </div>
            {!selected.altText.trim() && selected.kind === 'image' ? (
              <p className="mt-2 text-xs text-amber-100/70">
                Add alt text in the Asset Studio before publication.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mt-4">
        <CheckList readiness={readiness} />
      </div>
    </article>
  );
}

export function CampaignPostAssemblyClient({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState<OperationsEvent | null | undefined>(undefined);
  const [workspace, setWorkspace] = useState<EventGrowthWorkspace | undefined>();
  const [assembly, setAssembly] = useState<EventPostAssembly>(
    emptyEventPostAssembly(eventId),
  );
  const [assets, setAssets] = useState<EventAsset[]>([]);
  const [mediaLocked, setMediaLocked] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      const nextEvent = await eventRepository.getEvent(eventId);
      if (!active) return;
      setEvent(nextEvent);
      if (!nextEvent) return;

      const [nextWorkspace, nextAssembly] = await Promise.all([
        growthWorkspaceRepository.getWorkspace(nextEvent),
        postAssemblyRepository.get(eventId),
      ]);
      if (!active) return;
      setWorkspace(nextWorkspace);
      setAssembly(nextAssembly);

      const accessCode = sessionStorage.getItem(ACCESS_SESSION_KEY);
      if (!accessCode) {
        setMediaLocked(true);
        return;
      }

      try {
        const response = await fetch(
          `${ASSET_API}?eventId=${encodeURIComponent(eventId)}`,
          {
            cache: 'no-store',
            headers: { 'x-admin-asset-key': accessCode },
          },
        );
        const result = (await response.json()) as {
          assets?: EventAsset[];
          error?: string;
        };
        if (!response.ok || !result.assets) {
          throw new Error(result.error || 'Could not load approved event media.');
        }
        if (!active) return;
        setAssets(result.assets);
        setMediaLocked(false);
      } catch (error) {
        if (!active) return;
        setMediaLocked(true);
        setMessage(
          error instanceof Error ? error.message : 'Could not load event media.',
        );
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [eventId]);

  const readiness = useMemo(() => {
    if (!workspace) return null;
    return buildEventPostReadiness(
      workspace.content,
      workspace.brief,
      assembly,
      assets,
    );
  }, [assembly, assets, workspace]);

  async function assignAsset(
    item: CampaignContentItem,
    assetId?: string,
  ): Promise<void> {
    setPending(true);
    setMessage('');
    try {
      const next = await postAssemblyRepository.assignPrimaryAsset(
        eventId,
        item.id,
        item.channel,
        assetId,
      );
      setAssembly(next);
      setMessage(assetId ? 'Media attached to this post package.' : 'Media removed.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not assign media.');
    } finally {
      setPending(false);
    }
  }

  async function autoAssign(): Promise<void> {
    if (!workspace) return;
    setPending(true);
    setMessage('');

    try {
      const packages: CampaignPostPackage[] = workspace.content.map((item) => {
        const existing = assembly.packages.find(
          (entry) => entry.contentItemId === item.id,
        );
        const best = selectBestAssetForChannel(assets, item.channel);
        const chosen = existing?.primaryAssetId
          ? assets.find((asset) => asset.id === existing.primaryAssetId)
          : undefined;
        const primary =
          chosen && isAssetCompatibleWithChannel(chosen, item.channel)
            ? chosen
            : best;

        return {
          contentItemId: item.id,
          channel: item.channel,
          assetIds: primary ? [primary.id] : [],
          primaryAssetId: primary?.id,
          updatedAt: new Date().toISOString(),
        };
      });

      const next = await postAssemblyRepository.replace(eventId, {
        eventId,
        packages,
        updatedAt: new Date().toISOString(),
      });
      setAssembly(next);
      setMessage('Best approved media matches were assigned where available.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not assign media.');
    } finally {
      setPending(false);
    }
  }

  if (event === undefined || !workspace) {
    return (
      <div className="rounded-2xl border border-white/10 p-5 text-white/60">
        Loading post packages…
      </div>
    );
  }

  if (event === null) {
    return (
      <div className="rounded-2xl border border-amber-200/20 p-5 text-white/70">
        Event not found.
      </div>
    );
  }

  if (!workspace.content.length) {
    return (
      <section className="rounded-2xl border border-white/10 bg-[#141210]/80 p-5">
        <h1 className="text-2xl font-semibold text-white">Generate the campaign first</h1>
        <p className="mt-2 text-sm leading-6 text-white/55">
          Post packages combine generated copy with approved event media. This event does not have campaign content yet.
        </p>
        <Link
          href={`/admin/events/${eventId}/growth`}
          className="mt-4 inline-flex min-h-11 items-center rounded-full bg-amber-300 px-5 text-sm font-bold text-black"
        >
          Open Growth Workspace
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-5 pb-40 lg:pb-12">
      <header className="rounded-2xl border border-white/10 bg-[#141210]/80 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-white/45">Post Assembly</p>
            <h1 className="mt-2 font-serif text-3xl text-white sm:text-4xl">{event.title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
              Match approved campaign copy with the exact flyer, Story creative, or Reel that will accompany it. Nothing is posted from this screen.
            </p>
          </div>
          <div className="min-w-32 rounded-2xl border border-amber-200/20 bg-amber-200/10 p-3 text-right">
            <p className="text-xs uppercase tracking-[0.16em] text-amber-100/60">Packages ready</p>
            <p className="mt-1 text-3xl font-semibold text-amber-100">
              {readiness?.readyCount ?? 0}/{readiness?.totalCount ?? workspace.content.length}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/admin/events/${eventId}/growth`}
            className="inline-flex min-h-10 items-center rounded-full border border-white/15 px-4 text-xs font-semibold text-white/70"
          >
            Growth campaign
          </Link>
          <Link
            href={`/admin/events/${eventId}/assets`}
            className="inline-flex min-h-10 items-center rounded-full border border-violet-200/20 bg-violet-200/8 px-4 text-xs font-semibold text-violet-100"
          >
            Event media
          </Link>
          <button
            type="button"
            disabled={pending || mediaLocked || !assets.length}
            onClick={() => void autoAssign()}
            className="min-h-10 rounded-full bg-amber-300 px-4 text-xs font-bold text-black disabled:opacity-40"
          >
            Auto-assign best media
          </button>
        </div>
      </header>

      {mediaLocked ? (
        <section className="rounded-2xl border border-violet-200/20 bg-violet-200/8 p-4">
          <h2 className="text-base font-semibold text-violet-50">Event media is locked in this browser session</h2>
          <p className="mt-2 text-sm leading-6 text-violet-50/65">
            Open and unlock the Event Asset Studio first. Return here afterward and the approved assets will be available for assignment.
          </p>
          <Link
            href={`/admin/events/${eventId}/assets`}
            className="mt-3 inline-flex min-h-10 items-center rounded-full bg-violet-100 px-4 text-xs font-bold text-black"
          >
            Unlock event media
          </Link>
        </section>
      ) : null}

      {message ? (
        <p
          role="status"
          className="rounded-xl border border-amber-200/15 bg-amber-200/8 px-3 py-2 text-sm text-amber-50"
        >
          {message}
        </p>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-2">
        {workspace.content.map((item) => {
          const postPackage = assembly.packages.find(
            (entry) => entry.contentItemId === item.id,
          );
          const packageReadiness = readiness?.packages.find(
            (entry) => entry.contentItemId === item.id,
          );
          if (!packageReadiness) return null;

          return (
            <PostPackageCard
              key={item.id}
              item={item}
              postPackage={postPackage}
              readiness={packageReadiness}
              assets={assets}
              pending={pending}
              onAssign={(assetId) => assignAsset(item, assetId)}
            />
          );
        })}
      </section>
    </div>
  );
}
