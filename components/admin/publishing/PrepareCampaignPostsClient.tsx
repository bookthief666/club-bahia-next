'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { EventAsset } from '@/lib/admin/assets/domain';
import {
  EVENT_ASSET_ROLE_LABELS,
  EVENT_ASSET_PLATFORM_LABELS,
} from '@/lib/admin/assets/domain';
import {
  AssetSessionError,
  fetchEventAssets,
  unlockAssetSession,
} from '@/lib/admin/assets/client-session';
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
  emptyEventPostAssembly,
  isAssetCompatibleWithChannel,
  selectBestAssetForChannel,
  type CampaignPostPackage,
  type EventPostAssembly,
} from '@/lib/admin/publishing/domain';
import { postAssemblyRepository } from '@/lib/admin/publishing/repository';

function copyPreview(value: string): string {
  const text = value.replace(/\s+/g, ' ').trim();
  return text.length > 180 ? `${text.slice(0, 180).trimEnd()}…` : text;
}

function MediaPreview({ asset }: { asset: EventAsset }) {
  if (asset.kind === 'video') {
    return (
      <video
        src={asset.url}
        controls
        preload="metadata"
        playsInline
        className="h-48 w-full rounded-2xl bg-black object-contain"
      />
    );
  }
  if (asset.kind === 'image') {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={asset.url}
        alt={asset.altText || asset.name}
        className="h-48 w-full rounded-2xl bg-black/45 object-contain"
      />
    );
  }
  return (
    <div className="flex h-28 items-center justify-center rounded-2xl border border-dashed border-white/12 bg-black/25 text-sm text-white/45">
      {asset.kind === 'audio' ? 'Audio file' : 'Document'}
    </div>
  );
}

function InlineMediaUnlock({
  onUnlocked,
}: {
  onUnlocked: () => Promise<void>;
}) {
  const [code, setCode] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');

  async function submit() {
    setPending(true);
    setMessage('');
    try {
      await unlockAssetSession(code);
      setCode('');
      await onUnlocked();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not unlock media.');
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-[1.4rem] border border-violet-200/20 bg-[radial-gradient(circle_at_12%_10%,rgba(167,139,250,.18),transparent_20rem),rgba(18,14,22,.92)] p-5 shadow-[0_18px_60px_rgba(0,0,0,.28)]">
      <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-violet-200/70">
        One-time unlock
      </p>
      <h2 className="mt-2 text-xl font-semibold text-white">Open the event media library</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-white/58">
        Enter the private media code once. A secure eight-hour browser session will work across tabs, so you will not need to keep unlocking each screen.
      </p>
      <form
        className="mt-4 flex flex-col gap-3 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <input
          type="password"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="Media access code"
          autoComplete="off"
          className="min-h-12 min-w-0 flex-1 rounded-xl border border-white/12 bg-black/30 px-4 text-white outline-none placeholder:text-white/30 focus:border-violet-200/50"
        />
        <button
          type="submit"
          disabled={pending || !code.trim()}
          className="min-h-12 rounded-full bg-violet-100 px-6 text-sm font-bold text-black disabled:opacity-40"
        >
          {pending ? 'Opening…' : 'Unlock media'}
        </button>
      </form>
      {message ? <p className="mt-3 text-sm text-amber-100">{message}</p> : null}
    </section>
  );
}

function PostCard({
  item,
  postPackage,
  assets,
  ready,
  pending,
  onAssign,
}: {
  item: CampaignContentItem;
  postPackage?: CampaignPostPackage;
  assets: EventAsset[];
  ready: boolean;
  pending: boolean;
  onAssign: (assetId?: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(!ready);
  const compatibleAssets = assets.filter((asset) =>
    isAssetCompatibleWithChannel(asset, item.channel),
  );
  const selected = assets.find((asset) => asset.id === postPackage?.primaryAssetId);
  const requiresMedia = CHANNEL_ASSET_REQUIRED[item.channel];
  const copyApproved = ['approved', 'scheduled', 'published'].includes(item.status);

  return (
    <article
      className={`overflow-hidden rounded-[1.4rem] border shadow-[0_18px_55px_rgba(0,0,0,.22)] ${
        ready
          ? 'border-emerald-200/15 bg-[linear-gradient(145deg,rgba(11,25,21,.9),rgba(18,15,13,.94))]'
          : 'border-amber-200/18 bg-[linear-gradient(145deg,rgba(34,24,13,.88),rgba(18,14,12,.94))]'
      }`}
    >
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left sm:px-5"
      >
        <span className="min-w-0">
          <span className="block text-[10px] font-semibold uppercase tracking-[.18em] text-amber-100/65">
            {CAMPAIGN_CHANNEL_LABELS[item.channel]}
          </span>
          <span className="mt-1 block truncate text-lg font-semibold text-white">{item.title}</span>
          <span className="mt-1 block text-xs text-white/42">
            {item.publishAt ? formatVenueDateTime(item.publishAt) : 'No publishing time selected'}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <span
            className={`rounded-full border px-3 py-1 text-xs font-bold ${
              ready
                ? 'border-emerald-200/20 bg-emerald-200/10 text-emerald-100'
                : 'border-amber-200/25 bg-amber-200/10 text-amber-100'
            }`}
          >
            {ready ? 'Ready' : 'Needs attention'}
          </span>
          <span className="text-lg text-white/45">{expanded ? '−' : '+'}</span>
        </span>
      </button>

      {expanded ? (
        <div className="border-t border-white/8 px-4 pb-5 pt-4 sm:px-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className={`rounded-xl border p-3 ${copyApproved ? 'border-emerald-200/15 bg-emerald-200/[.06]' : 'border-red-200/18 bg-red-200/[.06]'}`}>
              <p className={`text-xs font-semibold ${copyApproved ? 'text-emerald-100' : 'text-red-100'}`}>
                {copyApproved ? '✓ Copy approved' : '○ Copy still needs approval'}
              </p>
              <p className="mt-2 text-xs leading-5 text-white/48">{copyPreview(item.body)}</p>
              {!copyApproved ? (
                <Link
                  href={`/admin/events/${item.id.split('-')[0] || ''}/growth`}
                  className="mt-3 inline-flex text-xs font-semibold text-amber-100 underline decoration-amber-100/30 underline-offset-4"
                >
                  Review campaign copy
                </Link>
              ) : null}
            </div>

            <div className={`rounded-xl border p-3 ${!requiresMedia || selected ? 'border-emerald-200/15 bg-emerald-200/[.06]' : 'border-red-200/18 bg-red-200/[.06]'}`}>
              <p className={`text-xs font-semibold ${!requiresMedia || selected ? 'text-emerald-100' : 'text-red-100'}`}>
                {!requiresMedia ? '✓ Media is optional' : selected ? '✓ Approved media attached' : '○ Choose approved media'}
              </p>
              <p className="mt-2 text-xs leading-5 text-white/48">
                {selected
                  ? `${selected.name} · ${EVENT_ASSET_ROLE_LABELS[selected.role]}`
                  : requiresMedia
                    ? 'This channel needs a final image or video.'
                    : 'Email and SMS can be prepared without media.'}
              </p>
            </div>
          </div>

          <label className="mt-4 block text-sm font-medium text-white/72">
            {requiresMedia ? 'Media for this post' : 'Optional media'}
            <select
              value={postPackage?.primaryAssetId ?? ''}
              disabled={pending}
              onChange={(event) => void onAssign(event.target.value || undefined)}
              className="mt-2 min-h-12 w-full rounded-xl border border-white/12 bg-black/30 px-3 text-white outline-none focus:border-amber-200/45 disabled:opacity-40"
            >
              <option value="">{requiresMedia ? 'Choose approved media…' : 'No media'}</option>
              {compatibleAssets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.name} — {EVENT_ASSET_ROLE_LABELS[asset.role]}
                </option>
              ))}
            </select>
          </label>

          {!compatibleAssets.length && requiresMedia ? (
            <div className="mt-3 rounded-xl border border-red-200/18 bg-red-200/[.06] p-3 text-sm leading-6 text-red-50/75">
              No approved media is assigned to {CAMPAIGN_CHANNEL_LABELS[item.channel]}. Update the file’s destination in Event Media.
            </div>
          ) : null}

          {selected ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
              <MediaPreview asset={selected} />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{selected.name}</p>
                  <p className="mt-1 text-xs text-white/45">
                    {selected.platforms.map((platform) => EVENT_ASSET_PLATFORM_LABELS[platform]).join(' · ')}
                  </p>
                </div>
                <a
                  href={selected.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white/70"
                >
                  Open file
                </a>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

export function PrepareCampaignPostsClient({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState<OperationsEvent | null | undefined>(undefined);
  const [workspace, setWorkspace] = useState<EventGrowthWorkspace>();
  const [assembly, setAssembly] = useState<EventPostAssembly>(emptyEventPostAssembly(eventId));
  const [assets, setAssets] = useState<EventAsset[]>([]);
  const [mediaLocked, setMediaLocked] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');

  async function loadAssets() {
    try {
      const nextAssets = await fetchEventAssets(eventId);
      setAssets(nextAssets);
      setMediaLocked(false);
    } catch (error) {
      if (error instanceof AssetSessionError && error.status === 401) {
        setMediaLocked(true);
        return;
      }
      setMessage(error instanceof Error ? error.message : 'Could not load event media.');
    }
  }

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
      await loadAssets();
    }
    void load();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const readiness = useMemo(() => {
    if (!workspace) return null;
    return buildEventPostReadiness(workspace.content, workspace.brief, assembly, assets);
  }, [assembly, assets, workspace]);

  async function assign(item: CampaignContentItem, assetId?: string) {
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
      setMessage(assetId ? 'Media choice saved.' : 'Media removed from this post.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save the media choice.');
    } finally {
      setPending(false);
    }
  }

  async function autoAssign() {
    if (!workspace) return;
    setPending(true);
    setMessage('');
    try {
      const packages: CampaignPostPackage[] = workspace.content.map((item) => {
        const existing = assembly.packages.find((entry) => entry.contentItemId === item.id);
        const existingAsset = assets.find((asset) => asset.id === existing?.primaryAssetId);
        const best =
          existingAsset && isAssetCompatibleWithChannel(existingAsset, item.channel)
            ? existingAsset
            : selectBestAssetForChannel(assets, item.channel);
        return {
          contentItemId: item.id,
          channel: item.channel,
          assetIds: best ? [best.id] : [],
          primaryAssetId: best?.id,
          updatedAt: new Date().toISOString(),
        };
      });
      const next = await postAssemblyRepository.replace(eventId, {
        eventId,
        packages,
        updatedAt: new Date().toISOString(),
      });
      setAssembly(next);
      setMessage('The best approved media was matched to each channel. Review the choices below.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not match the media.');
    } finally {
      setPending(false);
    }
  }

  if (event === undefined || !workspace || !readiness) {
    return <div className="rounded-2xl border border-white/10 p-5 text-white/60">Loading your campaign…</div>;
  }

  if (event === null) {
    return <div className="rounded-2xl border border-red-200/20 p-5 text-red-50">Event not found.</div>;
  }

  const readyCount = readiness.packages.filter((item) => item.ready).length;
  const allReady = readyCount === readiness.totalCount && readiness.totalCount > 0;

  return (
    <div className="space-y-5 pb-40 lg:pb-12">
      <header className="relative overflow-hidden rounded-[1.7rem] border border-white/10 bg-[radial-gradient(circle_at_80%_0%,rgba(246,183,60,.2),transparent_22rem),radial-gradient(circle_at_8%_100%,rgba(18,120,106,.18),transparent_24rem),linear-gradient(135deg,rgba(16,15,13,.97),rgba(25,14,12,.95))] p-5 shadow-[0_26px_90px_rgba(0,0,0,.38)] sm:p-7">
        <div className="relative flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-2xl">
            <p className="text-[10px] font-semibold uppercase tracking-[.24em] text-emerald-200/65">Step 4 · Prepare posts</p>
            <h1 className="mt-3 font-serif text-3xl text-white sm:text-5xl">Match the right media to every post</h1>
            <p className="mt-3 text-sm leading-6 text-white/58 sm:text-base">
              Review each caption with the flyer or video that will accompany it. The system checks approval, media, link, and timing before anything reaches the publishing queue.
            </p>
          </div>
          <div className={`min-w-36 rounded-2xl border p-4 text-right ${allReady ? 'border-emerald-200/25 bg-emerald-200/10' : 'border-amber-200/25 bg-amber-200/10'}`}>
            <p className={`text-[10px] uppercase tracking-[.18em] ${allReady ? 'text-emerald-100/65' : 'text-amber-100/65'}`}>Posts ready</p>
            <p className={`mt-1 text-4xl font-semibold ${allReady ? 'text-emerald-100' : 'text-amber-100'}`}>{readyCount}/{readiness.totalCount}</p>
          </div>
        </div>

        <div className="relative mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending || mediaLocked || !assets.length}
            onClick={() => void autoAssign()}
            className="min-h-12 rounded-full bg-amber-300 px-6 text-sm font-bold text-black shadow-[0_10px_30px_rgba(246,183,60,.18)] disabled:opacity-40"
          >
            Match the best media automatically
          </button>
          <Link
            href={`/admin/events/${eventId}/assets`}
            className="inline-flex min-h-12 items-center rounded-full border border-white/15 bg-black/20 px-5 text-sm font-semibold text-white/72"
          >
            Manage event media
          </Link>
          {allReady ? (
            <Link
              href={`/admin/events/${eventId}/publishing/execute`}
              className="inline-flex min-h-12 items-center rounded-full border border-emerald-200/25 bg-emerald-200/12 px-5 text-sm font-bold text-emerald-100"
            >
              Continue to publishing →
            </Link>
          ) : null}
        </div>
      </header>

      {mediaLocked ? <InlineMediaUnlock onUnlocked={loadAssets} /> : null}

      {message ? (
        <p role="status" className="rounded-xl border border-amber-200/15 bg-amber-200/[.07] px-4 py-3 text-sm text-amber-50">
          {message}
        </p>
      ) : null}

      {!workspace.content.length ? (
        <section className="rounded-[1.4rem] border border-dashed border-white/15 p-7 text-center">
          <h2 className="text-xl font-semibold text-white">Create the campaign copy first</h2>
          <p className="mt-2 text-sm text-white/50">There are no posts to prepare yet.</p>
          <Link href={`/admin/events/${eventId}/growth`} className="mt-4 inline-flex min-h-11 items-center rounded-full bg-amber-300 px-5 text-sm font-bold text-black">
            Open campaign creator
          </Link>
        </section>
      ) : (
        <section className="grid gap-4 xl:grid-cols-2">
          {workspace.content.map((item) => {
            const postPackage = assembly.packages.find((entry) => entry.contentItemId === item.id);
            const packageReadiness = readiness.packages.find((entry) => entry.contentItemId === item.id);
            if (!packageReadiness) return null;
            return (
              <PostCard
                key={item.id}
                item={item}
                postPackage={postPackage}
                assets={assets}
                ready={packageReadiness.ready}
                pending={pending}
                onAssign={(assetId) => assign(item, assetId)}
              />
            );
          })}
        </section>
      )}
    </div>
  );
}
