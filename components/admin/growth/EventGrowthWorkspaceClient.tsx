'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { StatusPill } from '@/components/admin/events/StatusPill';
import { formatVenueDateTime } from '@/lib/admin/date';
import type { OperationsEvent } from '@/lib/admin/domain';
import { eventRepository } from '@/lib/admin/event-repository';
import {
  CAMPAIGN_CHANNEL_LABELS,
  CAMPAIGN_LANGUAGE_LABELS,
  CAMPAIGN_OBJECTIVE_LABELS,
  type CampaignBrief,
  type CampaignContentItem,
  type CampaignItemStatus,
  type CampaignLanguage,
  type CampaignObjective,
  type EventGrowthWorkspace,
} from '@/lib/admin/growth/domain';
import { buildCampaignQualityReport } from '@/lib/admin/growth/quality';
import { growthWorkspaceRepository } from '@/lib/admin/growth/repository';

type WorkspaceTab = 'overview' | 'campaign' | 'timeline' | 'assets';
type CampaignFilter = 'all' | 'draft' | 'approved' | 'published';

const TABS: Array<{ id: WorkspaceTab; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'campaign', label: 'Campaign' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'assets', label: 'Assets' },
];

const FILTERS: Array<{ id: CampaignFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'draft', label: 'Needs review' },
  { id: 'approved', label: 'Approved' },
  { id: 'published', label: 'Published' },
];

const STATUS_CLASS: Record<CampaignItemStatus, string> = {
  draft: 'border-white/10 bg-white/5 text-white/65',
  approved: 'border-amber-200/25 bg-amber-200/10 text-amber-100',
  scheduled: 'border-sky-200/25 bg-sky-200/10 text-sky-100',
  published: 'border-emerald-200/25 bg-emerald-200/10 text-emerald-100',
};

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#141210]/75 p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-white/45">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-white/55">{detail}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  hint,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  error?: string;
}) {
  return (
    <label className="block text-sm text-white/70">
      {label}
      <input
        value={value}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        onChange={(inputEvent) => onChange(inputEvent.target.value)}
        className={`mt-1 min-h-11 w-full rounded-xl border bg-black/25 px-3 text-white outline-none placeholder:text-white/25 ${
          error
            ? 'border-red-300/45 focus:border-red-300/75'
            : 'border-white/10 focus:border-amber-200/45'
        }`}
      />
      {error ? <span className="mt-1 block text-xs leading-5 text-red-200">{error}</span> : null}
      {!error && hint ? <span className="mt-1 block text-xs leading-5 text-white/40">{hint}</span> : null}
    </label>
  );
}

function previewText(body: string): string {
  const compact = body.replace(/\s+/g, ' ').trim();
  return compact.length > 190 ? `${compact.slice(0, 190).trimEnd()}…` : compact;
}

function ContentCard({
  item,
  pending,
  blockingReason,
  onSave,
  onRegenerate,
  onAdvance,
}: {
  item: CampaignContentItem;
  pending: boolean;
  blockingReason?: string;
  onSave: (body: string) => Promise<boolean>;
  onRegenerate: () => Promise<void>;
  onAdvance: (status: CampaignItemStatus) => Promise<void>;
}) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [draftBody, setDraftBody] = useState(item.body);

  useEffect(() => {
    setDraftBody(item.body);
  }, [item.body]);

  async function copyBody() {
    try {
      await navigator.clipboard.writeText(item.body);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  async function saveEdit() {
    const saved = await onSave(draftBody);
    if (saved) {
      setEditing(false);
      setExpanded(true);
    }
  }

  const websiteUnconnected = item.channel === 'website';
  const connectionLabel = websiteUnconnected
    ? 'Website publishing not connected'
    : 'Manual publishing';

  const nextStatus: CampaignItemStatus | null =
    item.status === 'draft'
      ? 'approved'
      : item.status === 'approved' && !websiteUnconnected
        ? 'published'
        : item.status === 'scheduled'
          ? 'published'
          : null;

  const nextLabel =
    item.status === 'draft'
      ? 'Approve'
      : item.status === 'approved' && !websiteUnconnected
        ? 'Mark published manually'
        : item.status === 'scheduled'
          ? 'Mark published'
          : '';

  return (
    <article className="rounded-2xl border border-white/10 bg-[#141210]/75 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-100/75">
            {CAMPAIGN_CHANNEL_LABELS[item.channel]}
          </p>
          <h3 className="mt-1 text-base font-semibold text-white">{item.title}</h3>
          <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-white/50">
            {item.publishAt ? <span>Suggested: {formatVenueDateTime(item.publishAt)}</span> : null}
            <span>·</span>
            <span className={websiteUnconnected ? 'text-amber-100/70' : undefined}>
              {connectionLabel}
            </span>
          </div>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize ${STATUS_CLASS[item.status]}`}>
          {item.status}
        </span>
      </div>

      {editing ? (
        <textarea
          value={draftBody}
          onChange={(inputEvent) => setDraftBody(inputEvent.target.value)}
          rows={9}
          className="mt-4 w-full rounded-xl border border-amber-200/25 bg-black/25 p-3 text-sm leading-6 text-white outline-none focus:border-amber-200/60"
        />
      ) : expanded ? (
        <div className="mt-4 whitespace-pre-wrap rounded-xl border border-white/10 bg-black/20 p-3 text-sm leading-6 text-white/72">
          {item.body}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-4 block w-full rounded-xl border border-white/10 bg-black/20 p-3 text-left"
        >
          <span className="block text-sm leading-6 text-white/68">{previewText(item.body)}</span>
          <span className="mt-2 block text-xs font-semibold text-amber-100/75">Open full copy</span>
        </button>
      )}

      {expanded && !editing && item.assetPrompt ? (
        <details className="mt-3 rounded-xl border border-white/10 bg-black/15 p-3 text-sm">
          <summary className="cursor-pointer font-medium text-white/70">Visual prompt</summary>
          <p className="mt-2 text-white/55">{item.assetPrompt}</p>
        </details>
      ) : null}

      {blockingReason ? (
        <p className="mt-3 rounded-xl border border-red-300/20 bg-red-300/8 px-3 py-2 text-xs leading-5 text-red-100">
          Approval blocked: {blockingReason}
        </p>
      ) : null}

      {websiteUnconnected && item.status === 'approved' ? (
        <p className="mt-3 rounded-xl border border-amber-200/20 bg-amber-200/8 px-3 py-2 text-xs leading-5 text-amber-50">
          Approved copy is ready, but it cannot be scheduled until the Club Bahia website connector is installed.
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {editing ? (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={() => void saveEdit()}
              className="min-h-10 rounded-full bg-amber-300 px-4 text-xs font-bold text-black disabled:opacity-50"
            >
              Save changes
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setDraftBody(item.body);
                setEditing(false);
              }}
              className="min-h-10 rounded-full border border-white/15 px-4 text-xs font-semibold text-white/70 disabled:opacity-50"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => void copyBody()}
              className="min-h-10 rounded-full border border-white/15 px-3 text-xs font-semibold text-white/75"
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setExpanded(true);
                setEditing(true);
              }}
              className="min-h-10 rounded-full border border-white/15 px-3 text-xs font-semibold text-white/75 disabled:opacity-50"
            >
              Edit
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => void onRegenerate()}
              className="min-h-10 rounded-full border border-violet-200/25 px-3 text-xs font-semibold text-violet-100 disabled:opacity-50"
            >
              Improve item
            </button>
            {expanded ? (
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="min-h-10 rounded-full border border-white/10 px-3 text-xs font-semibold text-white/55"
              >
                Collapse
              </button>
            ) : null}
            {nextStatus ? (
              <button
                type="button"
                disabled={pending || Boolean(blockingReason)}
                onClick={() => void onAdvance(nextStatus)}
                className="min-h-10 rounded-full bg-amber-300 px-3 text-xs font-bold text-black disabled:cursor-not-allowed disabled:opacity-40"
              >
                {nextLabel}
              </button>
            ) : item.status === 'published' ? (
              <span className="inline-flex min-h-10 items-center rounded-full border border-emerald-200/20 px-3 text-xs font-semibold text-emerald-100">
                Complete
              </span>
            ) : null}
          </>
        )}
      </div>
    </article>
  );
}

export function EventGrowthWorkspaceClient({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState<OperationsEvent | null | undefined>(undefined);
  const [workspace, setWorkspace] = useState<EventGrowthWorkspace | undefined>(undefined);
  const [brief, setBrief] = useState<CampaignBrief | undefined>(undefined);
  const [tab, setTab] = useState<WorkspaceTab>('overview');
  const [briefOpen, setBriefOpen] = useState(false);
  const [campaignFilter, setCampaignFilter] = useState<CampaignFilter>('all');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;

    eventRepository.getEvent(eventId).then(async (nextEvent) => {
      if (!active) return;
      setEvent(nextEvent);
      if (!nextEvent) return;

      const nextWorkspace = await growthWorkspaceRepository.getWorkspace(nextEvent);
      if (!active) return;
      setWorkspace(nextWorkspace);
      setBrief(nextWorkspace.brief);
      setBriefOpen(nextWorkspace.content.length === 0);
    });

    return () => {
      active = false;
    };
  }, [eventId]);

  async function generateCampaign() {
    if (!event || !brief) return;
    setPending(true);
    setMessage('');

    try {
      const next = await growthWorkspaceRepository.generateCampaign(event, brief);
      setWorkspace(next);
      setBrief(next.brief);
      setBriefOpen(false);
      setCampaignFilter('draft');
      setTab('campaign');
      setMessage('Campaign improved. Review each draft before approving it.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Campaign generation failed.');
    } finally {
      setPending(false);
    }
  }

  async function updateStatus(
    contentItemId: string,
    status: CampaignItemStatus,
  ): Promise<void> {
    if (!event) return;
    setPending(true);
    setMessage('');

    try {
      const next = await growthWorkspaceRepository.updateContentStatus(
        event,
        contentItemId,
        status,
      );
      setWorkspace(next);
      setMessage(`Content marked ${status}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update content.');
    } finally {
      setPending(false);
    }
  }

  async function saveContent(contentItemId: string, body: string): Promise<boolean> {
    if (!event) return false;
    setPending(true);
    setMessage('');

    try {
      const next = await growthWorkspaceRepository.updateContentItem(
        event,
        contentItemId,
        body,
      );
      setWorkspace(next);
      setMessage('Content saved and returned to draft for approval.');
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save content.');
      return false;
    } finally {
      setPending(false);
    }
  }

  async function regenerateContent(contentItemId: string): Promise<void> {
    if (!event) return;
    setPending(true);
    setMessage('');

    try {
      const next = await growthWorkspaceRepository.regenerateContentItem(event, contentItemId);
      setWorkspace(next);
      setMessage('This item was improved and returned to draft.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not improve content.');
    } finally {
      setPending(false);
    }
  }

  if (event === undefined) {
    return <div className="rounded-2xl border border-white/10 p-5 text-white/65">Loading event…</div>;
  }

  if (event === null) {
    return (
      <div className="rounded-2xl border border-amber-200/20 p-5">
        <h1 className="text-xl font-semibold">Event not found</h1>
        <p className="mt-2 text-sm text-white/60">This browser fixture record is unavailable.</p>
      </div>
    );
  }

  if (!workspace || !brief) {
    return <div className="rounded-2xl border border-white/10 p-5 text-white/65">Loading growth workspace…</div>;
  }

  const scheduledCount = workspace.content.filter(
    (item) => item.status === 'scheduled' || item.status === 'published',
  ).length;
  const activeCount = workspace.content.filter((item) => item.status !== 'draft').length;
  const publishedCount = workspace.content.filter((item) => item.status === 'published').length;
  const draftCount = workspace.content.filter((item) => item.status === 'draft').length;
  const assetItems = workspace.content.filter((item) => item.assetPrompt);
  const qualityReport = workspace.content.length
    ? buildCampaignQualityReport(event, workspace)
    : null;
  const conversionUrlRequired = ['reservations', 'ticket-sales'].includes(brief.objective);
  const reservationUrlError =
    conversionUrlRequired && !brief.reservationUrl.trim()
      ? 'Add a final public reservation or ticket link before generating a conversion campaign.'
      : undefined;

  const filteredContent = workspace.content.filter((item) => {
    if (campaignFilter === 'all') return true;
    if (campaignFilter === 'draft') return item.status === 'draft';
    if (campaignFilter === 'approved') {
      return item.status === 'approved' || item.status === 'scheduled';
    }
    return item.status === 'published';
  });

  function blockingReasonFor(item: CampaignContentItem): string | undefined {
    if (!item.body.trim()) return 'The content is empty.';
    if (item.channel === 'sms' && item.body.length > 300) {
      return `The SMS is ${item.body.length} characters; the limit is 300.`;
    }
    return undefined;
  }

  return (
    <div className="space-y-5 pb-40 lg:pb-12">
      <header className="rounded-2xl border border-white/10 bg-[#141210]/80 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              href={`/admin/events/${event.id}`}
              className="text-xs font-semibold text-amber-100/75 hover:text-amber-100"
            >
              ← Event details
            </Link>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusPill status={event.status} />
              <span className="rounded-full border border-amber-200/20 bg-amber-200/10 px-2.5 py-1 text-[11px] font-semibold text-amber-100">
                Growth workspace
              </span>
            </div>
            <h1 className="mt-3 font-serif text-3xl text-white sm:text-4xl">{event.title}</h1>
            <p className="mt-2 text-sm text-white/60">
              {formatVenueDateTime(event.startsAt)} · {event.room}
            </p>
          </div>
          <div className="flex gap-2">
            {qualityReport ? (
              <div className="min-w-28 rounded-2xl border border-white/10 bg-white/5 p-3 text-right">
                <p className="text-xs uppercase tracking-[0.16em] text-white/45">Quality</p>
                <p className="mt-1 text-2xl font-semibold text-white">{qualityReport.score}%</p>
              </div>
            ) : null}
            <div className="min-w-28 rounded-2xl border border-amber-200/20 bg-amber-200/10 p-3 text-right">
              <p className="text-xs uppercase tracking-[0.16em] text-amber-100/60">Readiness</p>
              <p className="mt-1 text-2xl font-semibold text-amber-100">{workspace.readinessScore}%</p>
            </div>
          </div>
        </div>
      </header>

      <nav
        className="flex gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-black/20 p-1"
        aria-label="Growth workspace sections"
      >
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-current={tab === item.id ? 'page' : undefined}
            onClick={() => setTab(item.id)}
            className={`min-h-10 shrink-0 rounded-xl px-4 text-sm font-semibold transition ${
              tab === item.id
                ? 'bg-amber-300 text-black'
                : 'text-white/60 hover:bg-white/5 hover:text-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {message ? (
        <p
          role="status"
          className="rounded-xl border border-amber-200/15 bg-amber-200/10 px-3 py-2 text-sm text-amber-50"
        >
          {message}
        </p>
      ) : null}

      {tab === 'overview' ? (
        <section className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Campaign assets" value={String(workspace.content.length)} detail="Generated pieces" />
            <Metric label="Needs review" value={String(draftCount)} detail="Drafts awaiting a human" />
            <Metric label="Approved or later" value={String(activeCount)} detail={`${publishedCount} published`} />
            <Metric label="Promotion budget" value={`$${Math.round(brief.budgetCents / 100)}`} detail="Planning estimate" />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
            <div className="rounded-2xl border border-white/10 bg-[#141210]/75 p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-white/45">Campaign direction</p>
                  <h2 className="mt-2 text-xl font-semibold">{brief.theme}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTab('campaign');
                    setBriefOpen(true);
                  }}
                  className="min-h-9 rounded-full border border-white/15 px-3 text-xs font-semibold text-white/70"
                >
                  Edit brief
                </button>
              </div>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                <div><dt className="text-xs text-white/45">Audience</dt><dd className="mt-1 text-sm text-white/75">{brief.targetAudience}</dd></div>
                <div><dt className="text-xs text-white/45">Objective</dt><dd className="mt-1 text-sm text-white/75">{CAMPAIGN_OBJECTIVE_LABELS[brief.objective]}</dd></div>
                <div><dt className="text-xs text-white/45">Language</dt><dd className="mt-1 text-sm text-white/75">{CAMPAIGN_LANGUAGE_LABELS[brief.language]}</dd></div>
                <div><dt className="text-xs text-white/45">Conversion link</dt><dd className={`mt-1 text-sm ${brief.reservationUrl ? 'text-white/75' : 'text-amber-100'}`}>{brief.reservationUrl || 'Missing'}</dd></div>
                <div><dt className="text-xs text-white/45">Performers</dt><dd className="mt-1 text-sm text-white/75">{brief.performers || 'Not added'}</dd></div>
                <div><dt className="text-xs text-white/45">Music</dt><dd className="mt-1 text-sm text-white/75">{brief.genres || 'Not added'}</dd></div>
              </dl>
            </div>

            <div className="rounded-2xl border border-amber-200/20 bg-gradient-to-br from-amber-200/10 to-transparent p-4 sm:p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-amber-100/60">Next best action</p>
              <h2 className="mt-2 text-xl font-semibold text-white">
                {workspace.content.length
                  ? draftCount
                    ? `Review ${draftCount} remaining draft${draftCount === 1 ? '' : 's'}`
                    : 'Campaign review is complete'
                  : 'Generate the first campaign draft'}
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/60">
                Keep the approval queue focused. Publishing remains manual until each connector is actually installed.
              </p>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  if (workspace.content.length) {
                    setCampaignFilter('draft');
                    setTab('campaign');
                  } else {
                    void generateCampaign();
                  }
                }}
                className="mt-4 min-h-11 w-full rounded-full bg-amber-300 px-4 text-sm font-bold text-black disabled:opacity-50"
              >
                {workspace.content.length ? 'Open review queue' : pending ? 'Generating…' : 'Generate campaign'}
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {tab === 'campaign' ? (
        <section className="space-y-4">
          {workspace.content.length > 0 && !briefOpen ? (
            <div className="rounded-2xl border border-white/10 bg-[#141210]/75 p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-white/45">Campaign direction</p>
                  <h2 className="mt-1 text-xl font-semibold">{brief.theme}</h2>
                  <p className="mt-2 text-sm text-white/55">
                    {brief.genres || 'Music details pending'} · {CAMPAIGN_LANGUAGE_LABELS[brief.language]} · {CAMPAIGN_OBJECTIVE_LABELS[brief.objective]}
                  </p>
                  {qualityReport?.issues.length ? (
                    <p className="mt-2 text-xs text-amber-100/75">
                      {qualityReport.issues.length} quality item{qualityReport.issues.length === 1 ? '' : 's'} detected above.
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setBriefOpen(true)}
                    className="min-h-10 rounded-full border border-white/15 px-4 text-xs font-semibold text-white/75"
                  >
                    Edit brief
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      const confirmed = window.confirm(
                        'Improve the full campaign with AI? The current version will be saved in revision history.',
                      );
                      if (confirmed) void generateCampaign();
                    }}
                    className="min-h-10 rounded-full border border-violet-200/25 px-4 text-xs font-semibold text-violet-100 disabled:opacity-50"
                  >
                    Improve all with AI
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form
              className="rounded-2xl border border-white/10 bg-[#141210]/75 p-4 sm:p-5"
              onSubmit={(formEvent) => {
                formEvent.preventDefault();
                void generateCampaign();
              }}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-white/45">Campaign brief</p>
                  <h2 className="mt-1 text-xl font-semibold">Direct the campaign</h2>
                </div>
                <span className="rounded-full border border-violet-200/20 bg-violet-200/8 px-2 py-1 text-[11px] text-violet-100">
                  AI-assisted
                </span>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Field label="Internal campaign direction" value={brief.theme} onChange={(value) => setBrief({ ...brief, theme: value })} hint={`The public event name remains “${event.title}.”`} />
                <Field label="Main attraction" value={brief.mainAttraction} onChange={(value) => setBrief({ ...brief, mainAttraction: value })} placeholder="What makes this night worth attending?" />
                <Field label="Performers / DJs" value={brief.performers} onChange={(value) => setBrief({ ...brief, performers: value })} placeholder="DJ names, band, host" />
                <Field label="Music genres" value={brief.genres} onChange={(value) => setBrief({ ...brief, genres: value })} placeholder="Salsa, bachata, cumbia" />
                <label className="block text-sm text-white/70">
                  Campaign objective
                  <select
                    value={brief.objective}
                    onChange={(inputEvent) => setBrief({ ...brief, objective: inputEvent.target.value as CampaignObjective })}
                    className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-white outline-none focus:border-amber-200/45"
                  >
                    {Object.entries(CAMPAIGN_OBJECTIVE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm text-white/70">
                  Campaign language
                  <select
                    value={brief.language}
                    onChange={(inputEvent) => setBrief({ ...brief, language: inputEvent.target.value as CampaignLanguage })}
                    className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-white outline-none focus:border-amber-200/45"
                  >
                    {Object.entries(CAMPAIGN_LANGUAGE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </label>
                <Field label="Target audience (internal)" value={brief.targetAudience} onChange={(value) => setBrief({ ...brief, targetAudience: value })} />
                <Field label="Tone" value={brief.tone} onChange={(value) => setBrief({ ...brief, tone: value })} />
                <Field label="Doors / show time" value={brief.doorsTime} onChange={(value) => setBrief({ ...brief, doorsTime: value })} placeholder="Doors 8 PM · show 9 PM" />
                <Field label="Admission" value={brief.admission} onChange={(value) => setBrief({ ...brief, admission: value })} placeholder="$15 advance · $20 door" />
                <Field label="Age restriction" value={brief.ageRestriction} onChange={(value) => setBrief({ ...brief, ageRestriction: value })} />
                <Field label="Food / drink special" value={brief.foodDrinkSpecial} onChange={(value) => setBrief({ ...brief, foodDrinkSpecial: value })} placeholder="Kitchen late · drink special" />
                <Field label="Offer / CTA" value={brief.offer} onChange={(value) => setBrief({ ...brief, offer: value })} />
                <Field
                  label="Reservation or ticket URL"
                  value={brief.reservationUrl}
                  onChange={(value) => setBrief({ ...brief, reservationUrl: value })}
                  placeholder="https://…"
                  error={reservationUrlError}
                  hint="Use the final public destination—not a temporary preview URL."
                />
                <Field label="Venue address" value={brief.address} onChange={(value) => setBrief({ ...brief, address: value })} />
                <label className="block text-sm text-white/70">
                  Promotion budget ($)
                  <input
                    type="number"
                    min="0"
                    value={brief.budgetCents / 100}
                    onChange={(inputEvent) => setBrief({
                      ...brief,
                      budgetCents: Math.max(0, Math.round(Number(inputEvent.target.value || 0) * 100)),
                    })}
                    className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-white outline-none focus:border-amber-200/45"
                  />
                </label>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={pending || Boolean(reservationUrlError)}
                  className="min-h-11 flex-1 rounded-full bg-amber-300 px-4 text-sm font-bold text-black disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {pending ? 'Generating…' : workspace.content.length ? 'Save and improve campaign' : 'Generate campaign'}
                </button>
                {workspace.content.length ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      setBrief(workspace.brief);
                      setBriefOpen(false);
                    }}
                    className="min-h-11 rounded-full border border-white/15 px-4 text-sm font-semibold text-white/70 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
              <p className="mt-3 text-xs leading-5 text-white/45">
                The event name comes from the event record. Audience and campaign direction guide the writing but are never published as internal notes.
              </p>
            </form>
          )}

          {workspace.content.length ? (
            <div className="sticky top-2 z-10 rounded-2xl border border-white/10 bg-[#0e0c0b]/95 p-2 shadow-xl backdrop-blur">
              <div className="flex gap-1 overflow-x-auto" aria-label="Campaign content filters">
                {FILTERS.map((filter) => {
                  const count =
                    filter.id === 'all'
                      ? workspace.content.length
                      : filter.id === 'draft'
                        ? draftCount
                        : filter.id === 'approved'
                          ? workspace.content.filter((item) => item.status === 'approved' || item.status === 'scheduled').length
                          : publishedCount;
                  return (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setCampaignFilter(filter.id)}
                      className={`min-h-9 shrink-0 rounded-full px-3 text-xs font-semibold ${
                        campaignFilter === filter.id
                          ? 'bg-amber-300 text-black'
                          : 'border border-white/10 text-white/60'
                      }`}
                    >
                      {filter.label} · {count}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="grid gap-3 xl:grid-cols-2">
            {filteredContent.length ? (
              filteredContent.map((item) => (
                <ContentCard
                  key={item.id}
                  item={item}
                  pending={pending}
                  blockingReason={blockingReasonFor(item)}
                  onSave={(body) => saveContent(item.id, body)}
                  onRegenerate={() => regenerateContent(item.id)}
                  onAdvance={(status) => updateStatus(item.id, status)}
                />
              ))
            ) : workspace.content.length ? (
              <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center xl:col-span-2">
                <h2 className="text-xl font-semibold">Nothing in this queue</h2>
                <p className="mt-2 text-sm text-white/55">Choose another filter to continue reviewing the campaign.</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center xl:col-span-2">
                <h2 className="text-xl font-semibold">No campaign generated yet</h2>
                <p className="mt-2 text-sm text-white/55">
                  Complete the brief to create website, social, email, and SMS drafts.
                </p>
              </div>
            )}
          </div>
        </section>
      ) : null}

      {tab === 'timeline' ? (
        <section className="rounded-2xl border border-white/10 bg-[#141210]/75 p-4 sm:p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-white/45">Campaign calendar</p>
              <h2 className="mt-1 text-xl font-semibold">What happens next</h2>
            </div>
            <p className="text-xs text-white/45">Planning dates only; no publishing connector is active.</p>
          </div>
          <div className="mt-5 space-y-2">
            {workspace.milestones.length ? (
              [...workspace.milestones]
                .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
                .map((item) => (
                  <div key={item.id} className="grid gap-2 rounded-xl border border-white/10 bg-black/20 p-3 sm:grid-cols-[10rem_1fr_auto] sm:items-center">
                    <p className="text-xs font-semibold text-amber-100/70">{formatVenueDateTime(item.dueAt)}</p>
                    <p className="text-sm text-white/75">{item.title}</p>
                    <span className="w-fit rounded-full border border-white/10 px-2 py-1 text-[11px] capitalize text-white/55">{item.status}</span>
                  </div>
                ))
            ) : (
              <p className="rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-white/55">
                Generate a campaign to create the promotion timeline.
              </p>
            )}
          </div>
        </section>
      ) : null}

      {tab === 'assets' ? (
        <section className="grid gap-4 md:grid-cols-2">
          {assetItems.length ? (
            assetItems.map((item) => (
              <article key={item.id} className="rounded-2xl border border-white/10 bg-[#141210]/75 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-amber-100/70">
                  {CAMPAIGN_CHANNEL_LABELS[item.channel]}
                </p>
                <h2 className="mt-2 text-lg font-semibold">{item.title}</h2>
                <p className="mt-3 text-sm leading-6 text-white/60">{item.assetPrompt}</p>
                <div className="mt-4 rounded-xl border border-dashed border-white/15 bg-black/20 p-6 text-center text-xs text-white/45">
                  Image and video generation are not connected yet.
                </div>
              </article>
            ))
          ) : (
            <div className="md:col-span-2 rounded-2xl border border-dashed border-white/15 p-8 text-center">
              <h2 className="text-xl font-semibold">No asset prompts yet</h2>
              <p className="mt-2 text-sm text-white/55">
                Generate a campaign to prepare flyer and Reel creative directions.
              </p>
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
