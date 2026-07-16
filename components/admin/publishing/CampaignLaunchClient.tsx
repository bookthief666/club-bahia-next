'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { EventAsset } from '@/lib/admin/assets/domain';
import { EVENT_ASSET_ROLE_LABELS } from '@/lib/admin/assets/domain';
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
  type CampaignChannel,
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
  type EventPublishingExecution,
  type PublishingExecutionItem,
  type PublishingExecutionStatus,
} from '@/lib/admin/publishing/execution-domain';
import { publishingExecutionRepository } from '@/lib/admin/publishing/execution-repository';
import {
  buildCampaignIntegrityReport,
  type CampaignIntegrityIssue,
  type CampaignIntegrityReport,
} from '@/lib/admin/publishing/integrity';
import { postAssemblyRepository } from '@/lib/admin/publishing/repository';

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

function safeFileName(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'club-bahia-campaign'
  );
}

function downloadText(filename: string, content: string, type: string) {
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

function statusStyle(status: PublishingExecutionStatus | 'blocked') {
  if (status === 'published') return 'border-emerald-200/25 bg-emerald-200/12 text-emerald-100';
  if (status === 'scheduled') return 'border-sky-200/25 bg-sky-200/12 text-sky-100';
  if (status === 'skipped') return 'border-white/12 bg-white/[.05] text-white/55';
  if (status === 'blocked') return 'border-red-200/25 bg-red-200/10 text-red-100';
  return 'border-amber-200/25 bg-amber-200/10 text-amber-100';
}

function issueStyle(severity: CampaignIntegrityIssue['severity']) {
  if (severity === 'blocker') return 'border-red-200/20 bg-red-200/[.07] text-red-50';
  if (severity === 'warning') return 'border-amber-200/20 bg-amber-200/[.07] text-amber-50';
  return 'border-sky-200/15 bg-sky-200/[.06] text-sky-50';
}

function MediaPreview({ asset }: { asset: EventAsset }) {
  if (asset.kind === 'video') {
    return (
      <video
        src={asset.url}
        controls
        preload="metadata"
        playsInline
        className="h-56 w-full rounded-2xl bg-black object-contain"
      />
    );
  }
  if (asset.kind === 'image') {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={asset.url}
        alt={asset.altText || asset.name}
        className="h-52 w-full rounded-2xl bg-black/45 object-contain"
      />
    );
  }
  return null;
}

function UnlockMediaPanel({ onUnlocked }: { onUnlocked: () => Promise<void> }) {
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
    <section className="rounded-[1.4rem] border border-violet-200/20 bg-[radial-gradient(circle_at_10%_0%,rgba(167,139,250,.2),transparent_22rem),rgba(20,15,23,.94)] p-5 shadow-[0_20px_65px_rgba(0,0,0,.3)]">
      <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-violet-200/70">Secure media access</p>
      <h2 className="mt-2 text-xl font-semibold text-white">Unlock once for this browser</h2>
      <p className="mt-2 text-sm leading-6 text-white/58">
        The secure session lasts eight hours and works across tabs. Your private code is not stored in campaign data.
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

function IntegrityPanel({ report, eventId }: { report: CampaignIntegrityReport; eventId: string }) {
  const [expanded, setExpanded] = useState(true);
  const headline = report.canPublish
    ? report.warnings
      ? 'Ready after a final review'
      : 'Campaign checks passed'
    : `${report.blockers} issue${report.blockers === 1 ? '' : 's'} must be fixed before publishing`;

  return (
    <section className={`overflow-hidden rounded-[1.5rem] border shadow-[0_20px_70px_rgba(0,0,0,.28)] ${report.canPublish ? 'border-emerald-200/18 bg-[linear-gradient(145deg,rgba(12,31,25,.92),rgba(17,15,13,.95))]' : 'border-red-200/18 bg-[linear-gradient(145deg,rgba(42,16,17,.88),rgba(18,14,13,.96))]'}`}>
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between gap-4 p-5 text-left"
      >
        <span>
          <span className={`text-[10px] font-semibold uppercase tracking-[.22em] ${report.canPublish ? 'text-emerald-200/70' : 'text-red-200/75'}`}>
            Campaign safety check
          </span>
          <span className="mt-2 block text-xl font-semibold text-white">{headline}</span>
          <span className="mt-2 block text-sm text-white/55">
            {report.blockers} blocking · {report.warnings} warnings · score {report.score}/100
          </span>
        </span>
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/12 bg-black/20 text-xl text-white/70">
          {expanded ? '−' : '+'}
        </span>
      </button>

      {expanded ? (
        <div className="border-t border-white/8 p-4 sm:p-5">
          <div className="grid gap-3 lg:grid-cols-2">
            {report.issues.map((item) => (
              <div key={item.id} className={`rounded-2xl border p-4 ${issueStyle(item.severity)}`}>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold">{item.title}</p>
                  <span className="rounded-full border border-current/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[.12em] opacity-75">
                    {item.severity === 'blocker' ? 'Fix first' : item.severity}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 opacity-70">{item.detail}</p>
                {item.actionHref ? (
                  <Link
                    href={item.actionHref}
                    className="mt-3 inline-flex min-h-9 items-center rounded-full border border-current/20 px-3 text-xs font-semibold"
                  >
                    {item.actionLabel ?? 'Review'}
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
          {!report.issues.length ? (
            <p className="text-sm text-emerald-50/70">No integrity problems were detected.</p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/admin/events/${eventId}/growth`}
              className="inline-flex min-h-10 items-center rounded-full border border-white/15 px-4 text-xs font-semibold text-white/70"
            >
              Edit campaign copy
            </Link>
            <Link
              href={`/admin/events/${eventId}/assets`}
              className="inline-flex min-h-10 items-center rounded-full border border-white/15 px-4 text-xs font-semibold text-white/70"
            >
              Review event media
            </Link>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function LaunchCard({
  item,
  executionItem,
  readiness,
  asset,
  reservationUrl,
  integrityIssues,
  campaignBlocked,
  pending,
  onUpdate,
  onStatus,
}: {
  item: CampaignContentItem;
  executionItem: PublishingExecutionItem;
  readiness: PostPackageReadiness;
  asset?: EventAsset;
  reservationUrl: string;
  integrityIssues: CampaignIntegrityIssue[];
  campaignBlocked: boolean;
  pending: boolean;
  onUpdate: (patch: Partial<Pick<PublishingExecutionItem, 'scheduledFor' | 'externalUrl' | 'notes'>>) => Promise<void>;
  onStatus: (status: PublishingExecutionStatus) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(executionItem.status === 'scheduled');
  const [copied, setCopied] = useState(false);
  const [scheduledFor, setScheduledFor] = useState(toLocalDateTimeInput(executionItem.scheduledFor));
  const [externalUrl, setExternalUrl] = useState(executionItem.externalUrl ?? '');
  const [notes, setNotes] = useState(executionItem.notes ?? '');

  useEffect(() => {
    setScheduledFor(toLocalDateTimeInput(executionItem.scheduledFor));
    setExternalUrl(executionItem.externalUrl ?? '');
    setNotes(executionItem.notes ?? '');
  }, [executionItem]);

  const itemBlockers = integrityIssues.filter((issue) => issue.severity === 'blocker');
  const canExecute = readiness.ready && !campaignBlocked && itemBlockers.length === 0;
  const displayStatus: PublishingExecutionStatus | 'blocked' = canExecute
    ? executionItem.status
    : 'blocked';

  async function copyPackage() {
    const pieces = [item.body];
    if (reservationUrl && !item.body.includes(reservationUrl)) pieces.push(reservationUrl);
    if (asset?.altText) pieces.push(`Alt text: ${asset.altText}`);
    try {
      await navigator.clipboard.writeText(pieces.join('\n\n'));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  async function save() {
    await onUpdate({
      scheduledFor: fromLocalDateTimeInput(scheduledFor),
      externalUrl: externalUrl.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  }

  return (
    <article className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[linear-gradient(145deg,rgba(19,17,15,.95),rgba(12,11,10,.96))] shadow-[0_22px_65px_rgba(0,0,0,.27)]">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between gap-4 p-4 text-left sm:p-5"
      >
        <span className="min-w-0">
          <span className="text-[10px] font-semibold uppercase tracking-[.18em] text-amber-100/65">
            {CAMPAIGN_CHANNEL_LABELS[item.channel]}
          </span>
          <span className="mt-1 block truncate text-lg font-semibold text-white">{item.title}</span>
          <span className="mt-1 block text-xs text-white/42">
            {executionItem.scheduledFor ? formatVenueDateTime(executionItem.scheduledFor) : 'No time selected'}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <span className={`rounded-full border px-3 py-1 text-xs font-bold capitalize ${statusStyle(displayStatus)}`}>
            {displayStatus}
          </span>
          <span className="text-lg text-white/40">{expanded ? '−' : '+'}</span>
        </span>
      </button>

      {expanded ? (
        <div className="border-t border-white/8 px-4 pb-5 pt-4 sm:px-5">
          {!readiness.ready ? (
            <div className="rounded-xl border border-red-200/20 bg-red-200/[.07] p-3">
              <p className="text-sm font-semibold text-red-100">Finish preparing this post</p>
              <ul className="mt-2 space-y-1 text-xs leading-5 text-red-50/70">
                {readiness.checks.filter((check) => !check.complete).map((check) => (
                  <li key={check.id}>• {check.detail}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {integrityIssues.filter((issue) => issue.severity !== 'tip').length ? (
            <div className="mt-3 space-y-2">
              {integrityIssues.filter((issue) => issue.severity !== 'tip').map((issue) => (
                <div key={issue.id} className={`rounded-xl border p-3 ${issueStyle(issue.severity)}`}>
                  <p className="text-xs font-semibold">{issue.title}</p>
                  <p className="mt-1 text-xs leading-5 opacity-70">{issue.detail}</p>
                </div>
              ))}
            </div>
          ) : null}

          <div className="mt-4 rounded-2xl border border-white/10 bg-black/22 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-white/38">Final caption or message</p>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-white/72">{item.body}</p>
            <button
              type="button"
              onClick={() => void copyPackage()}
              className="mt-4 min-h-10 rounded-full border border-amber-200/20 bg-amber-200/[.07] px-4 text-xs font-semibold text-amber-100"
            >
              {copied ? 'Copied' : 'Copy caption and link'}
            </button>
          </div>

          {asset ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/22 p-3">
              <MediaPreview asset={asset} />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{asset.name}</p>
                  <p className="mt-1 text-xs text-white/44">{EVENT_ASSET_ROLE_LABELS[asset.role]} · approved</p>
                </div>
                <a href={asset.url} target="_blank" rel="noreferrer" className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white/70">
                  Open media
                </a>
              </div>
            </div>
          ) : null}

          <details className="mt-4 rounded-2xl border border-white/10 bg-black/15 p-4">
            <summary className="cursor-pointer text-sm font-semibold text-white/72">Timing, live URL, and notes</summary>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="text-sm text-white/65">
                Planned publishing time
                <input
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={(event) => setScheduledFor(event.target.value)}
                  disabled={pending || !readiness.ready}
                  className="mt-1 min-h-12 w-full rounded-xl border border-white/12 bg-black/30 px-3 text-white outline-none focus:border-amber-200/45 disabled:opacity-40"
                />
              </label>
              <label className="text-sm text-white/65">
                Live post URL
                <input
                  type="url"
                  value={externalUrl}
                  onChange={(event) => setExternalUrl(event.target.value)}
                  placeholder="Paste after publishing"
                  disabled={pending || !readiness.ready}
                  className="mt-1 min-h-12 w-full rounded-xl border border-white/12 bg-black/30 px-3 text-white outline-none placeholder:text-white/25 focus:border-amber-200/45 disabled:opacity-40"
                />
              </label>
            </div>
            <label className="mt-3 block text-sm text-white/65">
              Notes for the person publishing
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
                placeholder="Music choice, collaborator tag, location, or follow-up…"
                disabled={pending || !readiness.ready}
                className="mt-1 w-full rounded-xl border border-white/12 bg-black/30 p-3 text-white outline-none placeholder:text-white/25 focus:border-amber-200/45 disabled:opacity-40"
              />
            </label>
            <button
              type="button"
              disabled={pending || !readiness.ready}
              onClick={() => void save()}
              className="mt-3 min-h-10 rounded-full border border-white/15 px-4 text-xs font-semibold text-white/72 disabled:opacity-40"
            >
              Save details
            </button>
          </details>

          <div className="mt-4 flex flex-wrap gap-2">
            {executionItem.status === 'ready' ? (
              <button
                type="button"
                disabled={pending || !canExecute}
                onClick={() => void onStatus('scheduled')}
                className="min-h-11 rounded-full bg-sky-200 px-5 text-xs font-bold text-black disabled:opacity-35"
              >
                Scheduled elsewhere
              </button>
            ) : null}
            {executionItem.status === 'ready' || executionItem.status === 'scheduled' ? (
              <button
                type="button"
                disabled={pending || !canExecute}
                onClick={() => {
                  const confirmed = window.confirm('Confirm this item is actually live on the real destination.');
                  if (confirmed) void onStatus('published');
                }}
                className="min-h-11 rounded-full bg-emerald-200 px-5 text-xs font-bold text-black disabled:opacity-35"
              >
                Published live
              </button>
            ) : null}
            {executionItem.status === 'published' || executionItem.status === 'skipped' ? (
              <button
                type="button"
                disabled={pending || !readiness.ready}
                onClick={() => void onStatus('ready')}
                className="min-h-11 rounded-full border border-white/15 px-5 text-xs font-semibold text-white/65 disabled:opacity-40"
              >
                Reopen
              </button>
            ) : null}
            {executionItem.status !== 'published' && executionItem.status !== 'skipped' ? (
              <button
                type="button"
                disabled={pending || !readiness.ready}
                onClick={() => void onStatus('skipped')}
                className="min-h-11 rounded-full border border-white/10 px-5 text-xs font-semibold text-white/45 disabled:opacity-40"
              >
                Skip channel
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </article>
  );
}

interface EffectiveSummary {
  blocked: number;
  ready: number;
  scheduled: number;
  published: number;
  skipped: number;
  total: number;
}

function buildEffectiveSummary(
  content: CampaignContentItem[],
  readiness: ReturnType<typeof buildEventPostReadiness>,
  execution: EventPublishingExecution,
  report: CampaignIntegrityReport,
): EffectiveSummary {
  const summary: EffectiveSummary = {
    blocked: 0,
    ready: 0,
    scheduled: 0,
    published: 0,
    skipped: 0,
    total: content.length,
  };
  const globalBlocker = report.issues.some(
    (issue) => issue.severity === 'blocker' && !issue.channel,
  );

  for (const item of content) {
    const packageReady = readiness.packages.find((entry) => entry.contentItemId === item.id)?.ready ?? false;
    const channelBlocked = report.issues.some(
      (issue) => issue.severity === 'blocker' && issue.channel === item.channel,
    );
    if (!packageReady || globalBlocker || channelBlocked) {
      summary.blocked += 1;
      continue;
    }
    const status = execution.items.find((entry) => entry.contentItemId === item.id)?.status ?? 'ready';
    summary[status] += 1;
  }
  return summary;
}

export function CampaignLaunchClient({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState<OperationsEvent | null | undefined>(undefined);
  const [workspace, setWorkspace] = useState<EventGrowthWorkspace>();
  const [assembly, setAssembly] = useState<EventPostAssembly>(emptyEventPostAssembly(eventId));
  const [execution, setExecution] = useState<EventPublishingExecution>(emptyPublishingExecution(eventId));
  const [assets, setAssets] = useState<EventAsset[]>([]);
  const [mediaLocked, setMediaLocked] = useState(false);
  const [pendingId, setPendingId] = useState<string>();
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
      const nextWorkspace = await growthWorkspaceRepository.getWorkspace(nextEvent);
      const [nextAssembly, nextExecution] = await Promise.all([
        postAssemblyRepository.get(eventId),
        publishingExecutionRepository.get(eventId, nextWorkspace.content),
      ]);
      if (!active) return;
      setWorkspace(nextWorkspace);
      setAssembly(nextAssembly);
      setExecution(nextExecution);
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

  const integrity = useMemo(() => {
    if (!event || !workspace) return null;
    return buildCampaignIntegrityReport({
      event,
      workspace,
      assembly,
      assets,
      execution,
    });
  }, [assembly, assets, event, execution, workspace]);

  const summary = useMemo(() => {
    if (!workspace || !readiness || !integrity) return null;
    return buildEffectiveSummary(workspace.content, readiness, execution, integrity);
  }, [execution, integrity, readiness, workspace]);

  async function updateItem(
    item: CampaignContentItem,
    patch: Partial<Pick<PublishingExecutionItem, 'scheduledFor' | 'externalUrl' | 'notes'>>,
  ) {
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
      setMessage('Publishing details saved.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save the details.');
    } finally {
      setPendingId(undefined);
    }
  }

  async function updateStatus(item: CampaignContentItem, status: PublishingExecutionStatus) {
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
      setMessage(status === 'published' ? 'Marked as published.' : `Status changed to ${status}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not change the status.');
    } finally {
      setPendingId(undefined);
    }
  }

  function exportCampaign(format: 'json' | 'csv') {
    if (!event || !workspace || !integrity) return;
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
        JSON.stringify({ ...manifest, integrity }, null, 2),
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

  if (event === undefined || !workspace || !readiness || !integrity || !summary) {
    return <div className="rounded-2xl border border-white/10 p-5 text-white/60">Loading the publishing workspace…</div>;
  }
  if (event === null) {
    return <div className="rounded-2xl border border-red-200/20 p-5 text-red-50">Event not found.</div>;
  }

  const globalBlocked = integrity.issues.some(
    (issue) => issue.severity === 'blocker' && !issue.channel,
  );

  return (
    <div className="space-y-5 pb-40 lg:pb-12">
      <header className="relative overflow-hidden rounded-[1.8rem] border border-white/10 bg-[radial-gradient(circle_at_78%_0%,rgba(18,120,106,.24),transparent_24rem),radial-gradient(circle_at_12%_100%,rgba(225,18,27,.17),transparent_26rem),linear-gradient(135deg,rgba(14,17,15,.98),rgba(25,13,13,.96))] p-5 shadow-[0_28px_95px_rgba(0,0,0,.42)] sm:p-7">
        <div className="relative flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-2xl">
            <p className="text-[10px] font-semibold uppercase tracking-[.24em] text-emerald-200/70">Step 5 · Publish campaign</p>
            <h1 className="mt-3 font-serif text-4xl text-white sm:text-5xl">{event.title}</h1>
            <p className="mt-3 text-sm leading-6 text-white/58 sm:text-base">
              Everything needed to publish is gathered here: final copy, approved media, timing, and a safety check. Nothing is posted automatically yet.
            </p>
          </div>
          <div className="min-w-36 rounded-2xl border border-emerald-200/22 bg-emerald-200/10 p-4 text-right">
            <p className="text-[10px] uppercase tracking-[.18em] text-emerald-100/62">Published</p>
            <p className="mt-1 text-4xl font-semibold text-emerald-100">{summary.published}/{summary.total}</p>
          </div>
        </div>

        <div className="relative mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {[
            ['Fix first', summary.blocked, 'text-red-100'],
            ['Ready', summary.ready, 'text-amber-100'],
            ['Scheduled', summary.scheduled, 'text-sky-100'],
            ['Published', summary.published, 'text-emerald-100'],
            ['Skipped', summary.skipped, 'text-white/65'],
          ].map(([label, value, color]) => (
            <div key={String(label)} className="rounded-2xl border border-white/9 bg-black/22 p-3">
              <p className="text-[10px] uppercase tracking-[.15em] text-white/38">{label}</p>
              <p className={`mt-1 text-2xl font-semibold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        <div className="relative mt-5 flex flex-wrap gap-2">
          <Link href={`/admin/events/${eventId}/publishing`} className="inline-flex min-h-11 items-center rounded-full border border-white/15 bg-black/18 px-5 text-sm font-semibold text-white/70">
            Review prepared posts
          </Link>
          <button type="button" onClick={() => exportCampaign('json')} className="min-h-11 rounded-full border border-violet-200/20 bg-violet-200/[.08] px-5 text-sm font-semibold text-violet-100">
            Export full campaign
          </button>
          <button type="button" onClick={() => exportCampaign('csv')} className="min-h-11 rounded-full border border-white/15 px-5 text-sm font-semibold text-white/68">
            Export copy sheet
          </button>
        </div>
      </header>

      {mediaLocked ? <UnlockMediaPanel onUnlocked={loadAssets} /> : null}
      <IntegrityPanel report={integrity} eventId={eventId} />

      {message ? (
        <p role="status" className="rounded-xl border border-amber-200/15 bg-amber-200/[.07] px-4 py-3 text-sm text-amber-50">{message}</p>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-2">
        {workspace.content.map((item) => {
          const executionItem = execution.items.find((entry) => entry.contentItemId === item.id) ?? ({
            contentItemId: item.id,
            channel: item.channel,
            status: 'ready',
            scheduledFor: item.publishAt,
            updatedAt: new Date().toISOString(),
          } satisfies PublishingExecutionItem);
          const packageReadiness = readiness.packages.find((entry) => entry.contentItemId === item.id);
          if (!packageReadiness) return null;
          const postPackage = assembly.packages.find((entry) => entry.contentItemId === item.id);
          const asset = assets.find((entry) => entry.id === postPackage?.primaryAssetId);
          const channelIssues = integrity.issues.filter(
            (issue) => issue.channel === item.channel,
          );
          return (
            <LaunchCard
              key={item.id}
              item={item}
              executionItem={executionItem}
              readiness={packageReadiness}
              asset={asset}
              reservationUrl={workspace.brief.reservationUrl}
              integrityIssues={channelIssues}
              campaignBlocked={globalBlocked}
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
