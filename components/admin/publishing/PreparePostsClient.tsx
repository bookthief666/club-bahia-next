'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { EventAsset } from '@/lib/admin/assets/domain';
import {
  EVENT_ASSET_PLATFORM_LABELS,
  EVENT_ASSET_ROLE_LABELS,
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

function shortCopy(value: string): string {
  const text = value.replace(/\s+/g, ' ').trim();
  return text.length > 190 ? `${text.slice(0, 190).trimEnd()}…` : text;
}

function MediaPreview({ asset }: { asset: EventAsset }) {
  if (asset.kind === 'video') {
    return (
      <video
        src={asset.url}
        controls
        preload="metadata"
        playsInline
        className="h-52 w-full rounded-2xl bg-black object-contain"
      />
    );
  }
  if (asset.kind === 'image') {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={asset.url}
        alt={asset.altText || asset.name}
        className="h-52 w-full rounded-2xl bg-black/40 object-contain"
      />
    );
  }
  return (
    <div className="flex h-28 items-center justify-center rounded-2xl border border-dashed border-white/12 bg-black/25 text-sm text-white/45">
      {asset.kind === 'audio' ? 'Audio file' : 'Document'}
    </div>
  );
}

function UnlockMedia({ onUnlocked }: { onUnlocked: () => Promise<void> }) {
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
    <section className="rounded-[1.4rem] border border-violet-200/20 bg-[radial-gradient(circle_at_8%_0%,rgba(167,139,250,.2),transparent_22rem),rgba(19,15,22,.94)] p-5 shadow-[0_20px_65px_rgba(0,0,0,.3)]">
      <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-violet-200/70">
        Secure media access
      </p>
      <h2 className="mt-2 text-xl font-semibold text-white">Unlock event media</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-white/56">
        Enter the private code once. The secure session lasts eight hours and works across browser tabs.
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
          {pending ? 'Unlocking…' : 'Unlock media'}
        </button>
      </form>
      {message ? <p className="mt-3 text-sm text-amber-100">{message}</p> : null}
    </section>
  );
}

function PreparedPostCard({
  eventId,
  item,
  postPackage,
  assets,
  isReady,
  pending,
  onAssign,
}: {
  eventId: string;
  item: CampaignContentItem;
  postPackage?: CampaignPostPackage;
  assets: EventAsset[];
  isReady: boolean;
  pending: boolean;
  onAssign: (assetId?: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(!isReady);
  const mediaRequired = CHANNEL_ASSET_REQUIRED[item.channel];
  const copyApproved = ['approved', 'scheduled', 'published'].includes(item.status);
  const compatible = assets.filter((asset) =>
    isAssetCompatibleWithChannel(asset, item.channel),
  );
  const selected = assets.find((asset) => asset.id === postPackage?.primaryAssetId);

  return (
    <article
      className={`overflow-hidden rounded-[1.45rem] border shadow-[0_20px_60px_rgba(0,0,0,.25)] ${
        isReady
          ? 'border-emerald-200/16 bg-[linear-gradient(145deg,rgba(11,27,22,.91),rgba(18,15,13,.96))]'
          : 'border-amber-200/20 bg-[linear-gradient(145deg,rgba(36,25,13,.9),rgba(18,14,12,.96))]'
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-4 p-4 text-left sm:p-5"
      >
        <span className="min-w-0">
          <span className="block text-[10px] font-semibold uppercase tracking-[.18em] text-amber-100/65">
            {CAMPAIGN_CHANNEL_LABELS[item.channel]}
          </span>
          <span className="mt-1 block truncate text-lg font-semibold text-white">
            {item.title}
          </span>
          <span className="mt-1 block text-xs text-white/42">
            {item.publishAt
              ? formatVenueDateTime(item.publishAt)
              : 'Publishing time not selected'}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <span
            className={`rounded-full border px-3 py-1 text-xs font-bold ${
              isReady
                ? 'border-emerald-200/22 bg-emerald-200/10 text-emerald-100'
                : 'border-amber-200/25 bg-amber-200/10 text-amber-100'
            }`}
          >
            {isReady ? 'Ready' : 'Needs attention'}
          </span>
          <span className="text-lg text-white/42">{open ? '−' : '+'}</span>
        </span>
      </button>

      {open ? (
        <div className="border-t border-white/8 p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div
              className={`rounded-2xl border p-3 ${
                copyApproved
                  ? 'border-emerald-200/15 bg-emerald-200/[.055]'
                  : 'border-red-200/18 bg-red-200/[.055]'
              }`}
            >
              <p
                className={`text-xs font-semibold ${
                  copyApproved ? 'text-emerald-100' : 'text-red-100'
                }`}
              >
                {copyApproved ? '✓ Copy approved' : '○ Copy needs approval'}
              </p>
              <p className="mt-2 text-xs leading-5 text-white/48">
                {shortCopy(item.body)}
              </p>
              {!copyApproved ? (
                <Link
                  href={`/admin/events/${eventId}/growth`}
                  className="mt-3 inline-flex min-h-9 items-center rounded-full border border-amber-200/20 px-3 text-xs font-semibold text-amber-100"
                >
                  Review this copy
                </Link>
              ) : null}
            </div>

            <div
              className={`rounded-2xl border p-3 ${
                !mediaRequired || selected
                  ? 'border-emerald-200/15 bg-emerald-200/[.055]'
                  : 'border-red-200/18 bg-red-200/[.055]'
              }`}
            >
              <p
                className={`text-xs font-semibold ${
                  !mediaRequired || selected ? 'text-emerald-100' : 'text-red-100'
                }`}
              >
                {!mediaRequired
                  ? '✓ Media is optional'
                  : selected
                    ? '✓ Approved media attached'
                    : '○ Choose approved media'}
              </p>
              <p className="mt-2 text-xs leading-5 text-white/48">
                {selected
                  ? `${selected.name} · ${EVENT_ASSET_ROLE_LABELS[selected.role]}`
                  : mediaRequired
                    ? 'This post needs a final approved image or video.'
                    : 'This channel can be prepared without a file.'}
              </p>
            </div>
          </div>

          <label className="mt-4 block text-sm font-medium text-white/70">
            {mediaRequired ? 'Media for this post' : 'Optional media'}
            <select
              value={postPackage?.primaryAssetId ?? ''}
              disabled={pending}
              onChange={(event) => void onAssign(event.target.value || undefined)}
              className="mt-2 min-h-12 w-full rounded-xl border border-white/12 bg-black/30 px-3 text-white outline-none focus:border-amber-200/45 disabled:opacity-40"
            >
              <option value="">
                {mediaRequired ? 'Choose approved media…' : 'No media'}
              </option>
              {compatible.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.name} — {EVENT_ASSET_ROLE_LABELS[asset.role]}
                </option>
              ))}
            </select>
          </label>

          {!compatible.length && mediaRequired ? (
            <div className="mt-3 rounded-xl border border-red-200/18 bg-red-200/[.06] p-3 text-sm leading-6 text-red-50/72">
              No approved file is assigned to {CAMPAIGN_CHANNEL_LABELS[item.channel]}. Open Event Media and update a file’s destinations.
            </div>
          ) : null}

          {selected ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/22 p-3">
              <MediaPreview asset={selected} />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {selected.name}
                  </p>
                  <p className="mt-1 text-xs text-white/44">
                    {selected.platforms
                      .map((platform) => EVENT_ASSET_PLATFORM_LABELS[platform])
                      .join(' · ')}
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

export function PreparePostsClient({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState<OperationsEvent | null | undefined>(undefined);
  const [workspace, setWorkspace] = useState<EventGrowthWorkspace>();
  const [assembly, setAssembly] = useState<EventPostAssembly>(
    emptyEventPostAssembly(eventId),
  );
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
    return buildEventPostReadiness(
      workspace.content,
      workspace.brief,
      assembly,
      assets,
    );
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
        const existing = assembly.packages.find(
          (entry) => entry.contentItemId === item.id,
        );
        const existingAsset = assets.find(
          (asset) => asset.id === existing?.primaryAssetId,
        );
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
    return (
      <div className="rounded-2xl border border-white/10 p-5 text-white/55">
        Loading your campaign…
      </div>
    );
  }
  if (event === null) {
    return (
      <div className="rounded-2xl border border-red-200/20 p-5 text-red-50">
        Event not found.
      </div>
    );
  }

  const readyCount = readiness.packages.filter((entry) => entry.ready).length;
  const allReady = readyCount === readiness.totalCount && readiness.totalCount > 0;

  return (
    <div className="space-y-5 pb-40 lg:pb-12">
      <header className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[radial-gradient(circle_at_82%_0%,rgba(246,183,60,.22),transparent_23rem),radial-gradient(circle_at_7%_100%,rgba(18,120,106,.2),transparent_24rem),linear-gradient(135deg,rgba(16,16,13,.98),rgba(25,14,12,.96))] p-5 shadow-[0_28px_90px_rgba(0,0,0,.4)] sm:p-7">
        <div className="relative flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-2xl">
            <p className="text-[10px] font-semibold uppercase tracking-[.24em] text-emerald-200/68">
              Step 4 · Prepare posts
            </p>
            <h1 className="mt-3 font-serif text-3xl text-white sm:text-5xl">
              Put the right media with every post
            </h1>
            <p className="mt-3 text-sm leading-6 text-white/58 sm:text-base">
              Review each caption beside the exact flyer or video that will accompany it. Ready posts collapse so attention stays on the ones that still need work.
            </p>
          </div>
          <div
            className={`min-w-36 rounded-2xl border p-4 text-right ${
              allReady
                ? 'border-emerald-200/25 bg-emerald-200/10'
                : 'border-amber-200/25 bg-amber-200/10'
            }`}
          >
            <p
              className={`text-[10px] uppercase tracking-[.18em] ${
                allReady ? 'text-emerald-100/65' : 'text-amber-100/65'
              }`}
            >
              Posts ready
            </p>
            <p
              className={`mt-1 text-4xl font-semibold ${
                allReady ? 'text-emerald-100' : 'text-amber-100'
              }`}
            >
              {readyCount}/{readiness.totalCount}
            </p>
          </div>
        </div>

        <div className="relative mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending || mediaLocked || !assets.length}
            onClick={() => void autoAssign()}
            className="min-h-12 rounded-full bg-amber-300 px-6 text-sm font-bold text-black shadow-[0_12px_32px_rgba(246,183,60,.16)] disabled:opacity-40"
          >
            Match the best media automatically
          </button>
          <Link
            href={`/admin/events/${eventId}/assets`}
            className="inline-flex min-h-12 items-center rounded-full border border-white/15 bg-black/18 px-5 text-sm font-semibold text-white/70"
          >
            Manage event media
          </Link>
          {allReady ? (
            <Link
              href={`/admin/events/${eventId}/publishing/execute`}
              className="inline-flex min-h-12 items-center rounded-full border border-emerald-200/25 bg-emerald-200/12 px-5 text-sm font-bold text-emerald-100"
            >
              Next: Publish campaign →
            </Link>
          ) : null}
        </div>
      </header>

      {mediaLocked ? <UnlockMedia onUnlocked={loadAssets} /> : null}

      {message ? (
        <p
          role="status"
          className="rounded-xl border border-amber-200/15 bg-amber-200/[.07] px-4 py-3 text-sm text-amber-50"
        >
          {message}
        </p>
      ) : null}

      {!workspace.content.length ? (
        <section className="rounded-[1.4rem] border border-dashed border-white/15 p-7 text-center">
          <h2 className="text-xl font-semibold text-white">Create the campaign copy first</h2>
          <p className="mt-2 text-sm text-white/50">There are no posts to prepare yet.</p>
          <Link
            href={`/admin/events/${eventId}/growth`}
            className="mt-4 inline-flex min-h-11 items-center rounded-full bg-amber-300 px-5 text-sm font-bold text-black"
          >
            Open campaign creator
          </Link>
        </section>
      ) : (
        <section className="grid gap-4 xl:grid-cols-2">
          {workspace.content.map((item) => {
            const postPackage = assembly.packages.find(
              (entry) => entry.contentItemId === item.id,
            );
            const packageReadiness = readiness.packages.find(
              (entry) => entry.contentItemId === item.id,
            );
            if (!packageReadiness) return null;
            return (
              <PreparedPostCard
                key={item.id}
                eventId={eventId}
                item={item}
                postPackage={postPackage}
                assets={assets}
                isReady={packageReadiness.ready}
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
