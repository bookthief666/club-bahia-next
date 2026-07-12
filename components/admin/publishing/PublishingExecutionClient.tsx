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
  emptyEventPostAssembly,
  type EventPostAssembly,
  type PostPackageReadiness,
} from '@/lib/admin/publishing/domain';
import {
  buildCampaignManifest,
  emptyPublishingExecution,
  manifestToCsv,
  summarizePublishingExecution,
  type EventPublishingExecution,
  type PublishingExecutionItem,
  type PublishingExecutionStatus,
} from '@/lib/admin/publishing/execution-domain';
import { publishingExecutionRepository } from '@/lib/admin/publishing/execution-repository';
import { postAssemblyRepository } from '@/lib/admin/publishing/repository';

const ACCESS_SESSION_KEY = 'club-bahia-event-assets-access';
const ASSET_API = '/api/admin/assets';

function compactCopy(value: string): string {
  const compact = value.replace(/\s+/g, ' ').trim();
  return compact.length > 260 ? `${compact.slice(0, 260).trimEnd()}…` : compact;
}

function safeFileName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'club-bahia-campaign';
}

function toLocalDateTimeInput(value?: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function fromLocalDateTimeInput(value: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function downloadText(filename: string, content: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function AssetPreview({ asset }: { asset: EventAsset }) {
  if (asset.kind === 'image') {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={asset.url}
        alt={asset.altText || asset.name}
        className="h-44 w-full rounded-xl bg-black/35 object-contain"
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
    <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-white/15 bg-black/25 text-xs text-white/50">
      {asset.kind === 'audio' ? 'Audio asset' : 'Document asset'}
    </div>
  );
}

function statusClass(status: PublishingExecutionStatus | 'blocked'): string {
  if (status === 'published') {
    return 'border-emerald-200/25 bg-emerald-200/10 text-emerald-100';
  }
  if (status === 'scheduled') {
    return 'border-sky-200/25 bg-sky-200/10 text-sky-100';
  }
  if (status === 'skipped') {
    return 'border-white/15 bg-white/5 text-white/55';
  }
  if (status === 'blocked') {
    return 'border-red-200/25 bg-red-200/10 text-red-100';
  }
  return 'border-amber-200/25 bg-amber-200/10 text-amber-100';
}

function ExecutionCard({
  item,
  executionItem,
  readiness,
  asset,
  reservationUrl,
  pending,
  onUpdate,
  onStatus,
}: {
  item: CampaignContentItem;
  executionItem: PublishingExecutionItem;
  readiness: PostPackageReadiness;
  asset?: EventAsset;
  reservationUrl: string;
  pending: boolean;
  onUpdate: (
    patch: Partial<
      Pick<
        PublishingExecutionItem,
        'scheduledFor' | 'externalUrl' | 'notes'
      >
    >,
  ) => Promise<void>;
  onStatus: (status: PublishingExecutionStatus) => Promise<void>;
}) {
  const [copied, setCopied] = useState(false);
  const [scheduledFor, setScheduledFor] = useState(
    toLocalDateTimeInput(executionItem.scheduledFor),
  );
  const [externalUrl, setExternalUrl] = useState(executionItem.externalUrl ?? '');
  const [notes, setNotes] = useState(executionItem.notes ?? '');

  useEffect(() => {
    setScheduledFor(toLocalDateTimeInput(executionItem.scheduledFor));
    setExternalUrl(executionItem.externalUrl ?? '');
    setNotes(executionItem.notes ?? '');
  }, [executionItem]);

  const displayStatus: PublishingExecutionStatus | 'blocked' = readiness.ready
    ? executionItem.status
    : 'blocked';

  async function copyPackage() {
    const pieces = [item.body];
    if (reservationUrl && !item.body.includes(reservationUrl)) {
      pieces.push(reservationUrl);
    }
    if (asset?.altText) pieces.push(`Alt text: ${asset.altText}`);

    try {
      await navigator.clipboard.writeText(pieces.join('\n\n'));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  async function saveDetails() {
    await onUpdate({
      scheduledFor: fromLocalDateTimeInput(scheduledFor),
      externalUrl: externalUrl.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  }

  return (
    <article className="rounded-2xl border border-white/10 bg-[#141210]/80 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-100/70">
            {CAMPAIGN_CHANNEL_LABELS[item.channel]}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-white">{item.title}</h2>
          <p className="mt-1 text-xs text-white/45">
            {executionItem.scheduledFor
              ? formatVenueDateTime(executionItem.scheduledFor)
              : 'No execution time'}
          </p>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-bold capitalize ${statusClass(displayStatus)}`}
        >
          {displayStatus}
        </span>
      </div>

      {!readiness.ready ? (
        <div className="mt-4 rounded-xl border border-red-200/20 bg-red-200/8 p-3">
          <p className="text-sm font-semibold text-red-100">Package is not ready</p>
          <ul className="mt-2 space-y-1 text-xs leading-5 text-red-50/70">
            {readiness.checks
              .filter((check) => !check.complete)
              .map((check) => (
                <li key={check.id}>• {check.detail}</li>
              ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
        <p className="text-xs uppercase tracking-[0.14em] text-white/40">Final copy</p>
        <p className="mt-2 text-sm leading-6 text-white/70">{compactCopy(item.body)}</p>
        <button
          type="button"
          onClick={() => void copyPackage()}
          className="mt-3 min-h-10 rounded-full border border-white/15 px-4 text-xs font-semibold text-white/75"
        >
          {copied ? 'Package copied' : 'Copy post package'}
        </button>
      </div>

      {asset ? (
        <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
          <AssetPreview asset={asset} />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{asset.name}</p>
              <p className="mt-1 text-xs text-white/45">
                {EVENT_ASSET_ROLE_LABELS[asset.role]} · approved
              </p>
            </div>
            <a
              href={asset.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-white/15 px-3 py-2 text-xs font-semibold text-white/65"
            >
              Open media
            </a>
          </div>
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="text-sm text-white/70">
          Planned publishing time
          <input
            type="datetime-local"
            value={scheduledFor}
            onChange={(event) => setScheduledFor(event.target.value)}
            disabled={pending || !readiness.ready}
            className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-white outline-none focus:border-amber-200/45 disabled:opacity-40"
          />
        </label>
        <label className="text-sm text-white/70">
          Published post URL (optional)
          <input
            type="url"
            value={externalUrl}
            onChange={(event) => setExternalUrl(event.target.value)}
            placeholder="https://instagram.com/p/…"
            disabled={pending || !readiness.ready}
            className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-white outline-none placeholder:text-white/25 focus:border-amber-200/45 disabled:opacity-40"
          />
        </label>
      </div>

      <label className="mt-3 block text-sm text-white/70">
        Execution notes
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={3}
          placeholder="Music selected, collaborator tag, location, result, or follow-up…"
          disabled={pending || !readiness.ready}
          className="mt-1 w-full rounded-xl border border-white/10 bg-black/25 p-3 text-white outline-none placeholder:text-white/25 focus:border-amber-200/45 disabled:opacity-40"
        />
      </label>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending || !readiness.ready}
          onClick={() => void saveDetails()}
          className="min-h-10 rounded-full border border-white/15 px-4 text-xs font-semibold text-white/75 disabled:opacity-40"
        >
          Save execution details
        </button>

        {executionItem.status === 'ready' ? (
          <button
            type="button"
            disabled={pending || !readiness.ready}
            onClick={() => void onStatus('scheduled')}
            className="min-h-10 rounded-full bg-sky-200 px-4 text-xs font-bold text-black disabled:opacity-40"
          >
            Mark scheduled manually
          </button>
        ) : null}

        {executionItem.status === 'scheduled' || executionItem.status === 'ready' ? (
          <button
            type="button"
            disabled={pending || !readiness.ready}
            onClick={() => {
              const confirmed = window.confirm(
                'Confirm that this item was actually published outside the app?',
              );
              if (confirmed) void onStatus('published');
            }}
            className="min-h-10 rounded-full bg-emerald-200 px-4 text-xs font-bold text-black disabled:opacity-40"
          >
            Mark published manually
          </button>
        ) : null}

        {executionItem.status === 'published' || executionItem.status === 'skipped' ? (
          <button
            type="button"
            disabled={pending || !readiness.ready}
            onClick={() => void onStatus('ready')}
            className="min-h-10 rounded-full border border-white/15 px-4 text-xs font-semibold text-white/65 disabled:opacity-40"
          >
            Reopen
          </button>
        ) : null}

        {executionItem.status !== 'published' && executionItem.status !== 'skipped' ? (
          <button
            type="button"
            disabled={pending || !readiness.ready}
            onClick={() => void onStatus('skipped')}
            className="min-h-10 rounded-full border border-white/10 px-4 text-xs font-semibold text-white/45 disabled:opacity-40"
          >
            Skip this channel
          </button>
        ) : null}
      </div>
    </article>
  );
}

export function PublishingExecutionClient({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState<OperationsEvent | null | undefined>(undefined);
  const [workspace, setWorkspace] = useState<EventGrowthWorkspace | undefined>();
  const [assembly, setAssembly] = useState<EventPostAssembly>(
    emptyEventPostAssembly(eventId),
  );
  const [execution, setExecution] = useState<EventPublishingExecution>(
    emptyPublishingExecution(eventId),
  );
  const [assets, setAssets] = useState<EventAsset[]>([]);
  const [mediaLocked, setMediaLocked] = useState(false);
  const [pendingId, setPendingId] = useState<string>();
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      const nextEvent = await eventRepository.getEvent(eventId);
      if (!active) return;
      setEvent(nextEvent);
      if (!nextEvent) return;

      const nextWorkspace = await growthWorkspaceRepository.getWorkspace(nextEvent);
      const [nextAssembly, nextExecution] = await Promise.all([
        postAssemblyRepository.get(eventId),
        publishingExecutionRepository.get(eventId, nextWorkspace.content),
      ]);
      if (!active) return;
      setWorkspace(nextWorkspace);
      setAssembly(nextAssembly);
      setExecution(nextExecution);

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

  const summary = useMemo(() => {
    if (!workspace) return null;
    return summarizePublishingExecution(
      workspace.content,
      workspace.brief,
      assembly,
      assets,
      execution,
    );
  }, [assembly, assets, execution, workspace]);

  async function updateItem(
    item: CampaignContentItem,
    patch: Partial<
      Pick<
        PublishingExecutionItem,
        'scheduledFor' | 'externalUrl' | 'notes'
      >
    >,
  ): Promise<void> {
    if (!workspace) return;
    setPendingId(item.id);
    setMessage('');
    try {
      const next = await publishingExecutionRepository.updateItem(
        eventId,
        workspace.content,
        item.id,
        patch,
      );
      setExecution(next);
      setMessage('Execution details saved.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save execution details.');
    } finally {
      setPendingId(undefined);
    }
  }

  async function updateStatus(
    item: CampaignContentItem,
    status: PublishingExecutionStatus,
  ): Promise<void> {
    if (!workspace) return;
    setPendingId(item.id);
    setMessage('');
    try {
      const next = await publishingExecutionRepository.setStatus(
        eventId,
        workspace.content,
        item.id,
        status,
      );
      setExecution(next);
      setMessage(`Publishing item marked ${status}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update publishing status.');
    } finally {
      setPendingId(undefined);
    }
  }

  function exportManifest(format: 'json' | 'csv') {
    if (!event || !workspace) return;
    const manifest = buildCampaignManifest({
      eventId,
      eventTitle: event.title,
      content: workspace.content,
      brief: workspace.brief,
      assembly,
      assets,
      execution,
    });
    const name = safeFileName(event.title);

    if (format === 'json') {
      downloadText(
        `${name}-publishing-manifest.json`,
        JSON.stringify(manifest, null, 2),
        'application/json;charset=utf-8',
      );
      return;
    }

    downloadText(
      `${name}-publishing-copy.csv`,
      manifestToCsv(manifest),
      'text/csv;charset=utf-8',
    );
  }

  if (event === undefined || !workspace || !readiness || !summary) {
    return (
      <div className="rounded-2xl border border-white/10 p-5 text-white/60">
        Loading publishing queue…
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

  return (
    <div className="space-y-5 pb-40 lg:pb-12">
      <header className="rounded-2xl border border-white/10 bg-[#141210]/80 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-white/45">
              Publishing execution
            </p>
            <h1 className="mt-2 font-serif text-3xl text-white sm:text-4xl">
              {event.title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
              A truthful manual execution queue for copying final captions, opening approved media, recording delivery times, and logging published links. No external platform connector is active yet.
            </p>
          </div>
          <div className="min-w-32 rounded-2xl border border-emerald-200/20 bg-emerald-200/10 p-3 text-right">
            <p className="text-xs uppercase tracking-[0.16em] text-emerald-100/60">
              Published
            </p>
            <p className="mt-1 text-3xl font-semibold text-emerald-100">
              {summary.published}/{summary.total}
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-2 grid-cols-2 sm:grid-cols-5">
          {[
            ['Blocked', summary.blocked],
            ['Ready', summary.ready],
            ['Scheduled', summary.scheduled],
            ['Published', summary.published],
            ['Skipped', summary.skipped],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-white/40">{label}</p>
              <p className="mt-1 text-xl font-semibold text-white">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/admin/events/${eventId}/publishing`}
            className="inline-flex min-h-10 items-center rounded-full border border-white/15 px-4 text-xs font-semibold text-white/70"
          >
            Post assembly
          </Link>
          <Link
            href={`/admin/events/${eventId}/growth`}
            className="inline-flex min-h-10 items-center rounded-full border border-amber-200/20 bg-amber-200/8 px-4 text-xs font-semibold text-amber-100"
          >
            Growth campaign
          </Link>
          <button
            type="button"
            onClick={() => exportManifest('json')}
            className="min-h-10 rounded-full border border-violet-200/20 bg-violet-200/8 px-4 text-xs font-semibold text-violet-100"
          >
            Export manifest JSON
          </button>
          <button
            type="button"
            onClick={() => exportManifest('csv')}
            className="min-h-10 rounded-full border border-violet-200/20 px-4 text-xs font-semibold text-violet-100"
          >
            Export copy sheet CSV
          </button>
        </div>
      </header>

      {mediaLocked ? (
        <section className="rounded-2xl border border-violet-200/20 bg-violet-200/8 p-4">
          <h2 className="text-base font-semibold text-violet-50">
            Event media is locked in this browser session
          </h2>
          <p className="mt-2 text-sm leading-6 text-violet-50/65">
            Unlock Event Media first, then return here so the queue can verify and open the approved assets.
          </p>
          <Link
            href={`/admin/events/${eventId}/assets`}
            className="mt-3 inline-flex min-h-10 items-center rounded-full bg-violet-100 px-4 text-xs font-bold text-black"
          >
            Unlock event media
          </Link>
        </section>
      ) : null}

      {summary.blocked ? (
        <section className="rounded-2xl border border-red-200/20 bg-red-200/8 p-4">
          <h2 className="text-base font-semibold text-red-50">
            {summary.blocked} package{summary.blocked === 1 ? '' : 's'} blocked
          </h2>
          <p className="mt-2 text-sm leading-6 text-red-50/65">
            Return to Post Assembly to resolve missing copy, media, conversion links, or delivery times before recording execution.
          </p>
        </section>
      ) : (
        <section className="rounded-2xl border border-emerald-200/20 bg-emerald-200/8 p-4">
          <h2 className="text-base font-semibold text-emerald-50">
            All {summary.total} packages are ready for execution
          </h2>
          <p className="mt-2 text-sm leading-6 text-emerald-50/65">
            Use each card as the operator checklist while publishing manually. Mark an item published only after it is live on the real destination.
          </p>
        </section>
      )}

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
          const executionItem =
            execution.items.find((entry) => entry.contentItemId === item.id) ??
            ({
              contentItemId: item.id,
              channel: item.channel,
              status: 'ready',
              scheduledFor: item.publishAt,
              updatedAt: new Date().toISOString(),
            } satisfies PublishingExecutionItem);
          const packageReadiness = readiness.packages.find(
            (entry) => entry.contentItemId === item.id,
          );
          if (!packageReadiness) return null;
          const postPackage = assembly.packages.find(
            (entry) => entry.contentItemId === item.id,
          );
          const asset = assets.find(
            (entry) => entry.id === postPackage?.primaryAssetId,
          );

          return (
            <ExecutionCard
              key={item.id}
              item={item}
              executionItem={executionItem}
              readiness={packageReadiness}
              asset={asset}
              reservationUrl={workspace.brief.reservationUrl}
              pending={pendingId === item.id}
              onUpdate={(patch) => updateItem(item, patch)}
              onStatus={(status) => updateStatus(item, status)}
            />
          );
        })}
      </section>
    </div>
  );
}
