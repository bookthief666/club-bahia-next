'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { StatusPill } from '@/components/admin/events/StatusPill';
import { formatVenueDateTime } from '@/lib/admin/date';
import type { OperationsEvent } from '@/lib/admin/domain';
import { eventRepository } from '@/lib/admin/event-repository';
import {
  CAMPAIGN_CHANNEL_LABELS,
  type CampaignBrief,
  type CampaignContentItem,
  type CampaignItemStatus,
  type EventGrowthWorkspace,
} from '@/lib/admin/growth/domain';
import { growthWorkspaceRepository } from '@/lib/admin/growth/repository';

type WorkspaceTab = 'overview' | 'campaign' | 'timeline' | 'assets';

const TABS: Array<{ id: WorkspaceTab; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'campaign', label: 'Campaign' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'assets', label: 'Assets' },
];

const STATUS_CLASS: Record<CampaignItemStatus, string> = {
  draft: 'border-white/10 bg-white/5 text-white/65',
  approved: 'border-amber-200/25 bg-amber-200/10 text-amber-100',
  scheduled: 'border-sky-200/25 bg-sky-200/10 text-sky-100',
  published: 'border-emerald-200/25 bg-emerald-200/10 text-emerald-100',
  manual: 'border-violet-200/25 bg-violet-200/10 text-violet-100',
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

function ContentCard({
  item,
  pending,
  onStatus,
}: {
  item: CampaignContentItem;
  pending: boolean;
  onStatus: (status: CampaignItemStatus) => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copyBody() {
    try {
      await navigator.clipboard.writeText(item.body);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <article className="rounded-2xl border border-white/10 bg-[#141210]/75 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-100/75">
            {CAMPAIGN_CHANNEL_LABELS[item.channel]}
          </p>
          <h3 className="mt-1 text-base font-semibold text-white">{item.title}</h3>
          {item.publishAt ? (
            <p className="mt-1 text-xs text-white/50">
              Suggested: {formatVenueDateTime(item.publishAt)}
            </p>
          ) : null}
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize ${STATUS_CLASS[item.status]}`}>
          {item.status}
        </span>
      </div>

      <div className="mt-4 whitespace-pre-wrap rounded-xl border border-white/10 bg-black/20 p-3 text-sm leading-6 text-white/72">
        {item.body}
      </div>

      {item.assetPrompt ? (
        <details className="mt-3 rounded-xl border border-white/10 bg-black/15 p-3 text-sm">
          <summary className="cursor-pointer font-medium text-white/70">Visual prompt</summary>
          <p className="mt-2 text-white/55">{item.assetPrompt}</p>
        </details>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copyBody}
          className="min-h-10 rounded-full border border-white/15 px-3 text-xs font-semibold text-white/75"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => onStatus('approved')}
          className="min-h-10 rounded-full bg-amber-300 px-3 text-xs font-bold text-black disabled:opacity-50"
        >
          Approve
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => onStatus('scheduled')}
          className="min-h-10 rounded-full border border-sky-200/25 px-3 text-xs font-semibold text-sky-100 disabled:opacity-50"
        >
          Mark scheduled
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => onStatus('manual')}
          className="min-h-10 rounded-full border border-violet-200/25 px-3 text-xs font-semibold text-violet-100 disabled:opacity-50"
        >
          Manual post
        </button>
      </div>
    </article>
  );
}

export function EventGrowthWorkspaceClient({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState<OperationsEvent | null | undefined>(undefined);
  const [workspace, setWorkspace] = useState<EventGrowthWorkspace | undefined>(undefined);
  const [brief, setBrief] = useState<CampaignBrief | undefined>(undefined);
  const [tab, setTab] = useState<WorkspaceTab>('overview');
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
      setTab('campaign');
      setMessage('Campaign draft created. Review and approve each item before publishing.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Campaign generation failed.');
    } finally {
      setPending(false);
    }
  }

  async function updateStatus(contentItemId: string, status: CampaignItemStatus) {
    if (!event) return;
    setPending(true);
    setMessage('');

    try {
      const next = await growthWorkspaceRepository.updateContentStatus(event, contentItemId, status);
      setWorkspace(next);
      setMessage(`Content marked ${status}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update content.');
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
  const assetItems = workspace.content.filter((item) => item.assetPrompt);

  return (
    <div className="space-y-5 pb-24 lg:pb-8">
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
          <div className="min-w-32 rounded-2xl border border-amber-200/20 bg-amber-200/10 p-3 text-right">
            <p className="text-xs uppercase tracking-[0.16em] text-amber-100/60">Readiness</p>
            <p className="mt-1 text-3xl font-semibold text-amber-100">{workspace.readinessScore}%</p>
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
            <Metric label="Approved or scheduled" value={String(activeCount)} detail="Ready for execution" />
            <Metric label="Scheduled" value={String(scheduledCount)} detail="Publishing queue" />
            <Metric label="Promotion budget" value={`$${Math.round(brief.budgetCents / 100)}`} detail="Planning estimate" />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
            <div className="rounded-2xl border border-white/10 bg-[#141210]/75 p-4 sm:p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-white/45">Campaign brief</p>
              <h2 className="mt-2 text-xl font-semibold">{brief.theme}</h2>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                <div><dt className="text-xs text-white/45">Audience</dt><dd className="mt-1 text-sm text-white/75">{brief.targetAudience}</dd></div>
                <div><dt className="text-xs text-white/45">Primary goal</dt><dd className="mt-1 text-sm text-white/75">{brief.primaryGoal}</dd></div>
                <div><dt className="text-xs text-white/45">Tone</dt><dd className="mt-1 text-sm text-white/75">{brief.tone}</dd></div>
                <div><dt className="text-xs text-white/45">Offer / CTA</dt><dd className="mt-1 text-sm text-white/75">{brief.offer}</dd></div>
              </dl>
            </div>

            <div className="rounded-2xl border border-amber-200/20 bg-gradient-to-br from-amber-200/10 to-transparent p-4 sm:p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-amber-100/60">Next best action</p>
              <h2 className="mt-2 text-xl font-semibold text-white">
                {workspace.content.length
                  ? 'Approve the strongest launch post'
                  : 'Generate the first campaign draft'}
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/60">
                AI drafts the campaign. A human reviews every item before any connector can publish it.
              </p>
              <button
                type="button"
                disabled={pending}
                onClick={generateCampaign}
                className="mt-4 min-h-11 w-full rounded-full bg-amber-300 px-4 text-sm font-bold text-black disabled:opacity-50"
              >
                {pending
                  ? 'Generating…'
                  : workspace.content.length
                    ? 'Regenerate campaign'
                    : 'Generate campaign'}
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {tab === 'campaign' ? (
        <section className="grid gap-4 xl:grid-cols-[0.72fr_1.28fr]">
          <form
            className="h-fit rounded-2xl border border-white/10 bg-[#141210]/75 p-4"
            onSubmit={(formEvent) => {
              formEvent.preventDefault();
              void generateCampaign();
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-white/45">AI campaign brief</p>
                <h2 className="mt-1 text-xl font-semibold">Direct the campaign</h2>
              </div>
              <span className="rounded-full border border-white/10 px-2 py-1 text-[11px] text-white/50">Fixture AI</span>
            </div>

            <div className="mt-4 space-y-4">
              <label className="block text-sm text-white/70">
                Theme
                <input value={brief.theme} onChange={(inputEvent) => setBrief({ ...brief, theme: inputEvent.target.value })} className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-white outline-none focus:border-amber-200/45" />
              </label>
              <label className="block text-sm text-white/70">
                Target audience
                <textarea value={brief.targetAudience} onChange={(inputEvent) => setBrief({ ...brief, targetAudience: inputEvent.target.value })} rows={3} className="mt-1 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-white outline-none focus:border-amber-200/45" />
              </label>
              <label className="block text-sm text-white/70">
                Primary goal
                <input value={brief.primaryGoal} onChange={(inputEvent) => setBrief({ ...brief, primaryGoal: inputEvent.target.value })} className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-white outline-none focus:border-amber-200/45" />
              </label>
              <label className="block text-sm text-white/70">
                Tone
                <input value={brief.tone} onChange={(inputEvent) => setBrief({ ...brief, tone: inputEvent.target.value })} className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-white outline-none focus:border-amber-200/45" />
              </label>
              <label className="block text-sm text-white/70">
                Offer / CTA
                <input value={brief.offer} onChange={(inputEvent) => setBrief({ ...brief, offer: inputEvent.target.value })} className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-white outline-none focus:border-amber-200/45" />
              </label>
              <label className="block text-sm text-white/70">
                Promotion budget ($)
                <input type="number" min="0" value={brief.budgetCents / 100} onChange={(inputEvent) => setBrief({ ...brief, budgetCents: Math.max(0, Math.round(Number(inputEvent.target.value || 0) * 100)) })} className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-white outline-none focus:border-amber-200/45" />
              </label>
            </div>

            <button type="submit" disabled={pending} className="mt-5 min-h-11 w-full rounded-full bg-amber-300 px-4 text-sm font-bold text-black disabled:opacity-50">
              {pending ? 'Generating…' : workspace.content.length ? 'Regenerate draft' : 'Generate campaign'}
            </button>
            <p className="mt-3 text-xs leading-5 text-white/45">
              No social platform is connected yet. This creates reviewable drafts only.
            </p>
          </form>

          <div className="space-y-3">
            {workspace.content.length ? (
              workspace.content.map((item) => (
                <ContentCard
                  key={item.id}
                  item={item}
                  pending={pending}
                  onStatus={(status) => void updateStatus(item.id, status)}
                />
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center">
                <h2 className="text-xl font-semibold">No campaign generated yet</h2>
                <p className="mt-2 text-sm text-white/55">
                  Complete the brief and generate website, social, email, and SMS drafts.
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
            <p className="text-xs text-white/45">Local planning state until connectors are added.</p>
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
                  Image and video generation connectors arrive in a later milestone.
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
