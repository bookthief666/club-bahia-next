'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { StatusPill } from '@/components/admin/events/StatusPill';
import { formatVenueDateTime } from '@/lib/admin/date';
import type { OperationsEvent } from '@/lib/admin/domain';
import { eventRepository } from '@/lib/admin/event-repository';
import {
  campaignCopyVariants,
  campaignItemBlockingReason,
  campaignItemMatchesGroup,
  campaignItemMetrics,
  flattenHashtagGroups,
  type CampaignChannelGroup,
  type CampaignCopyVariant,
} from '@/lib/admin/growth/composer';
import {
  CAMPAIGN_CHANNEL_LABELS,
  CAMPAIGN_LANGUAGE_LABELS,
  CAMPAIGN_OBJECTIVE_LABELS,
  type CampaignBrief,
  type CampaignContentItem,
  type CampaignItemStatus,
  type CampaignLanguage,
  type CampaignObjective,
  type CampaignQualityIssue,
  type EventGrowthWorkspace,
} from '@/lib/admin/growth/domain';
import { buildCampaignQualityReport } from '@/lib/admin/growth/quality';
import { growthWorkspaceRepository } from '@/lib/admin/growth/repository';

const FILTERS: Array<{ id: CampaignChannelGroup; label: string }> = [
  { id: 'needs-review', label: 'Needs review' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'video', label: 'Reels + TikTok' },
  { id: 'direct', label: 'Website + direct' },
  { id: 'all', label: 'All' },
];

const TONE_PRESETS = [
  'Energetic and welcoming',
  'Elegant and premium',
  'Dark and alternative',
  'Traditional Latin nightlife',
  'Warm and community-focused',
  'Urgent but factual',
  'Minimal and direct',
] as const;

const STATUS_CLASS: Record<CampaignItemStatus, string> = {
  draft: 'border-amber-200/24 bg-amber-200/10 text-amber-100',
  approved: 'border-emerald-200/24 bg-emerald-200/10 text-emerald-100',
  scheduled: 'border-sky-200/24 bg-sky-200/10 text-sky-100',
  published: 'border-violet-200/24 bg-violet-200/10 text-violet-100',
};

function Field({
  label,
  value,
  onChange,
  placeholder,
  hint,
  error,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  error?: string;
  multiline?: boolean;
}) {
  const className = `mt-1 w-full rounded-xl border bg-black/24 px-3 py-3 text-sm text-white outline-none placeholder:text-white/25 ${
    error
      ? 'border-red-300/45 focus:border-red-300/75'
      : 'border-white/10 focus:border-amber-200/45'
  }`;

  return (
    <label className="block text-sm text-white/68">
      {label}
      {multiline ? (
        <textarea
          rows={4}
          value={value}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          onChange={(event) => onChange(event.target.value)}
          className={className}
        />
      ) : (
        <input
          value={value}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          onChange={(event) => onChange(event.target.value)}
          className={`min-h-11 ${className}`}
        />
      )}
      {error ? (
        <span className="mt-1 block text-xs leading-5 text-red-200">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs leading-5 text-white/38">{hint}</span>
      ) : null}
    </label>
  );
}

function ChoiceRow<T extends string>({
  label,
  value,
  choices,
  onChange,
}: {
  label: string;
  value: T;
  choices: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[.14em] text-white/38">
        {label}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {choices.map((choice) => (
          <button
            key={choice.value}
            type="button"
            onClick={() => onChange(choice.value)}
            className={`min-h-10 rounded-full border px-4 text-xs font-semibold transition ${
              value === choice.value
                ? 'border-amber-200/55 bg-amber-300 text-black'
                : 'border-white/12 bg-black/18 text-white/62 hover:border-white/24'
            }`}
          >
            {choice.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function HashtagGroups({ item }: { item: CampaignContentItem }) {
  const groups = item.structured?.hashtags;
  if (!groups || !flattenHashtagGroups(groups).length) return null;

  return (
    <details className="rounded-2xl border border-white/8 bg-black/16 p-3">
      <summary className="cursor-pointer text-xs font-semibold text-white/66">
        Hashtag groups · {flattenHashtagGroups(groups).length}
      </summary>
      <div className="mt-3 space-y-3">
        {[
          ['Brand', groups.branded],
          ['Local discovery', groups.localDiscovery],
          ['Music community', groups.musicCommunity],
        ].map(([label, values]) => (
          <div key={String(label)}>
            <p className="text-[10px] uppercase tracking-[.14em] text-white/32">
              {String(label)}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(values as string[]).map((value) => (
                <span
                  key={value}
                  className="rounded-full border border-white/10 bg-white/[.04] px-2.5 py-1 text-[11px] text-white/58"
                >
                  {value}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}

function StructuredDetails({ item }: { item: CampaignContentItem }) {
  const structured = item.structured;
  if (!structured) return null;

  const hasDetails =
    Boolean(structured.storyFrames?.length) ||
    Boolean(structured.reelShots?.length) ||
    Boolean(structured.emailPreheader) ||
    Boolean(structured.altText) ||
    Boolean(item.assetPrompt);
  if (!hasDetails) return null;

  return (
    <details className="rounded-2xl border border-white/8 bg-black/16 p-3">
      <summary className="cursor-pointer text-xs font-semibold text-white/66">
        Creative details
      </summary>
      <div className="mt-3 space-y-4 text-xs leading-5 text-white/54">
        {structured.storyFrames?.length ? (
          <div>
            <p className="font-semibold text-white/70">Story frames</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {structured.storyFrames.map((frame) => (
                <div key={frame.frame} className="rounded-xl border border-white/8 p-3">
                  <p className="text-[10px] uppercase tracking-[.14em] text-amber-100/55">
                    Frame {frame.frame}
                  </p>
                  <p className="mt-1 text-sm text-white/72">{frame.text}</p>
                  {frame.interaction ? (
                    <p className="mt-2 text-white/40">{frame.interaction}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {structured.reelShots?.length ? (
          <div>
            <p className="font-semibold text-white/70">15-second edit plan</p>
            <div className="mt-2 space-y-2">
              {structured.reelShots.map((shot) => (
                <div
                  key={`${shot.startSecond}-${shot.endSecond}`}
                  className="grid gap-1 rounded-xl border border-white/8 p-3 sm:grid-cols-[4.5rem_1fr]"
                >
                  <p className="font-semibold text-amber-100/60">
                    {shot.startSecond}–{shot.endSecond}s
                  </p>
                  <div>
                    <p className="text-white/68">{shot.shot}</p>
                    {shot.onScreenText ? (
                      <p className="mt-1 text-white/38">Text: {shot.onScreenText}</p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {structured.emailPreheader ? (
          <p>
            <span className="font-semibold text-white/70">Email preheader:</span>{' '}
            {structured.emailPreheader}
          </p>
        ) : null}
        {structured.altText ? (
          <p>
            <span className="font-semibold text-white/70">Alt text:</span>{' '}
            {structured.altText}
          </p>
        ) : null}
        {item.assetPrompt ? (
          <p>
            <span className="font-semibold text-white/70">Visual prompt:</span>{' '}
            {item.assetPrompt}
          </p>
        ) : null}
      </div>
    </details>
  );
}

function PlatformPreview({
  item,
  variant,
}: {
  item: CampaignContentItem;
  variant: CampaignCopyVariant;
}) {
  const platform =
    variant.platform ??
    (item.channel.startsWith('instagram')
      ? 'instagram'
      : item.channel === 'facebook'
        ? 'facebook'
        : item.channel === 'website'
          ? 'website'
          : item.channel === 'email'
            ? 'email'
            : item.channel === 'sms'
              ? 'sms'
              : undefined);

  const label =
    platform === 'instagram'
      ? 'Instagram preview'
      : platform === 'tiktok'
        ? 'TikTok preview'
        : platform === 'email'
          ? 'Email preview'
          : platform === 'sms'
            ? 'SMS preview'
            : platform === 'website'
              ? 'Website preview'
              : platform === 'facebook'
                ? 'Facebook preview'
                : 'Copy preview';

  return (
    <div className="overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#090807]">
      <div className="flex items-center justify-between border-b border-white/8 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-amber-200 to-rose-300 text-[10px] font-black text-black">
            CB
          </span>
          <div>
            <p className="text-xs font-semibold text-white/78">Club Bahia</p>
            <p className="text-[10px] text-white/32">{label}</p>
          </div>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-[.12em] text-white/30">
          {variant.label}
        </span>
      </div>
      <div className="max-h-[25rem] overflow-y-auto whitespace-pre-wrap px-4 py-4 text-sm leading-6 text-white/72">
        {variant.body}
      </div>
      {variant.note ? (
        <p className="border-t border-white/8 px-4 py-3 text-xs leading-5 text-amber-100/55">
          {variant.note}
        </p>
      ) : null}
    </div>
  );
}

function ComposerCard({
  item,
  pending,
  issues,
  onSave,
  onRegenerate,
  onApprove,
}: {
  item: CampaignContentItem;
  pending: boolean;
  issues: CampaignQualityIssue[];
  onSave: (body: string) => Promise<boolean>;
  onRegenerate: () => Promise<void>;
  onApprove: () => Promise<void>;
}) {
  const variants = useMemo(() => campaignCopyVariants(item), [item]);
  const preferredVariant =
    variants.find((variant) => variant.id === 'standard') ??
    variants.find((variant) => variant.id === 'recommended') ??
    variants[0];
  const [selectedId, setSelectedId] = useState(preferredVariant?.id ?? '');
  const [editing, setEditing] = useState(false);
  const [draftBody, setDraftBody] = useState(item.body);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setDraftBody(item.body);
    if (!variants.some((variant) => variant.id === selectedId)) {
      setSelectedId(preferredVariant?.id ?? variants[0]?.id ?? '');
    }
  }, [item.body, preferredVariant?.id, selectedId, variants]);

  const selected =
    variants.find((variant) => variant.id === selectedId) ?? preferredVariant;
  const metrics = campaignItemMetrics(item);
  const blockingReason = campaignItemBlockingReason(item);
  const canUseVariant =
    selected &&
    selected.body.trim() !== item.body.trim() &&
    item.channel !== 'reel' &&
    selected.note !== 'Subject line only';

  async function copySelected() {
    if (!selected) return;
    try {
      await navigator.clipboard.writeText(selected.body);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  async function saveEdit() {
    if (await onSave(draftBody)) setEditing(false);
  }

  return (
    <article className="overflow-hidden rounded-[1.65rem] border border-white/10 bg-[linear-gradient(145deg,rgba(21,18,16,.96),rgba(12,11,10,.98))] shadow-[0_22px_65px_rgba(0,0,0,.24)]">
      <div className="border-b border-white/8 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-amber-100/60">
              {CAMPAIGN_CHANNEL_LABELS[item.channel]}
            </p>
            <h3 className="mt-1 text-lg font-semibold text-white">{item.title}</h3>
            <p className="mt-1 text-xs text-white/38">
              {item.publishAt ? `Suggested ${formatVenueDateTime(item.publishAt)} · ` : ''}
              {metrics.characters} characters · {metrics.hashtags} hashtags · {metrics.variants} choices
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.1em] ${STATUS_CLASS[item.status]}`}
          >
            {item.status}
          </span>
        </div>

        {variants.length > 1 ? (
          <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {variants.map((variant) => (
              <button
                key={variant.id}
                type="button"
                onClick={() => setSelectedId(variant.id)}
                className={`min-h-9 shrink-0 rounded-full border px-3 text-xs font-semibold ${
                  selected?.id === variant.id
                    ? 'border-amber-200/50 bg-amber-200/12 text-amber-50'
                    : 'border-white/10 text-white/48'
                }`}
              >
                {variant.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="space-y-3 p-4 sm:p-5">
        {editing ? (
          <textarea
            rows={12}
            value={draftBody}
            onChange={(event) => setDraftBody(event.target.value)}
            className="w-full rounded-2xl border border-amber-200/28 bg-black/30 p-4 text-sm leading-6 text-white outline-none focus:border-amber-200/65"
          />
        ) : selected ? (
          <PlatformPreview item={item} variant={selected} />
        ) : null}

        <HashtagGroups item={item} />
        <StructuredDetails item={item} />

        {issues.length ? (
          <details className="rounded-2xl border border-amber-200/16 bg-amber-200/[.05] p-3">
            <summary className="cursor-pointer text-xs font-semibold text-amber-50/75">
              Quality notes · {issues.length}
            </summary>
            <div className="mt-3 space-y-2">
              {issues.map((entry) => (
                <div key={entry.id} className="rounded-xl border border-white/8 p-3">
                  <p className="text-xs font-semibold text-white/72">{entry.title}</p>
                  <p className="mt-1 text-xs leading-5 text-white/42">{entry.detail}</p>
                </div>
              ))}
            </div>
          </details>
        ) : null}

        {blockingReason ? (
          <p className="rounded-xl border border-red-300/18 bg-red-300/[.06] px-3 py-2 text-xs leading-5 text-red-100/78">
            Approval blocked: {blockingReason}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2 pt-1">
          {editing ? (
            <>
              <button
                type="button"
                disabled={pending}
                onClick={() => void saveEdit()}
                className="min-h-10 rounded-full bg-amber-300 px-4 text-xs font-bold text-black disabled:opacity-40"
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
                className="min-h-10 rounded-full border border-white/12 px-4 text-xs font-semibold text-white/58"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => void copySelected()}
                className="min-h-10 rounded-full border border-white/12 px-4 text-xs font-semibold text-white/68"
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
              {canUseVariant ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => void onSave(selected.body)}
                  className="min-h-10 rounded-full border border-amber-200/24 bg-amber-200/[.07] px-4 text-xs font-semibold text-amber-50 disabled:opacity-40"
                >
                  Use this version
                </button>
              ) : null}
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  setDraftBody(item.body);
                  setEditing(true);
                }}
                className="min-h-10 rounded-full border border-white/12 px-4 text-xs font-semibold text-white/60 disabled:opacity-40"
              >
                Edit recommended
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => void onRegenerate()}
                className="min-h-10 rounded-full border border-violet-200/22 px-4 text-xs font-semibold text-violet-100/78 disabled:opacity-40"
              >
                Improve this channel
              </button>
              {item.status === 'draft' ? (
                <button
                  type="button"
                  disabled={pending || Boolean(blockingReason)}
                  onClick={() => void onApprove()}
                  className="min-h-10 rounded-full bg-emerald-200 px-4 text-xs font-bold text-black disabled:cursor-not-allowed disabled:opacity-35"
                >
                  Approve
                </button>
              ) : (
                <span className="inline-flex min-h-10 items-center rounded-full border border-emerald-200/16 px-4 text-xs font-semibold text-emerald-100/70">
                  Ready for the next step
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </article>
  );
}

export function PromotionStudioClient({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState<OperationsEvent | null>();
  const [workspace, setWorkspace] = useState<EventGrowthWorkspace>();
  const [brief, setBrief] = useState<CampaignBrief>();
  const [directionOpen, setDirectionOpen] = useState(false);
  const [filter, setFilter] = useState<CampaignChannelGroup>('needs-review');
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
      setDirectionOpen(nextWorkspace.content.length === 0);
    });
    return () => {
      active = false;
    };
  }, [eventId]);

  if (event === undefined || !workspace || !brief) {
    return (
      <div className="rounded-2xl border border-white/10 p-6 text-sm text-white/52">
        Opening Promotion Studio…
      </div>
    );
  }
  if (event === null) {
    return (
      <div className="rounded-2xl border border-amber-200/20 p-6">
        <h1 className="font-serif text-2xl">Event not found</h1>
        <p className="mt-2 text-sm text-white/52">
          Return to Events and reload the shared catalog.
        </p>
      </div>
    );
  }

  const report = workspace.content.length
    ? buildCampaignQualityReport(event, workspace)
    : null;
  const draftCount = workspace.content.filter((item) => item.status === 'draft').length;
  const approvedCount = workspace.content.length - draftCount;
  const conversionUrlRequired = ['reservations', 'ticket-sales'].includes(brief.objective);
  const reservationUrlError =
    conversionUrlRequired && !brief.reservationUrl.trim()
      ? 'Add the final public reservation or ticket link before generating this conversion campaign.'
      : undefined;
  const filtered = workspace.content.filter((item) =>
    campaignItemMatchesGroup(item, filter),
  );

  const filterCount = (group: CampaignChannelGroup): number =>
    workspace.content.filter((item) => campaignItemMatchesGroup(item, group)).length;

  async function generatePackage() {
    if (workspace.content.length) {
      const confirmed = window.confirm(
        'Improve the full promotion package? The current version will remain available in revision history.',
      );
      if (!confirmed) return;
    }
    setPending(true);
    setMessage('');
    try {
      const next = await growthWorkspaceRepository.generateCampaign(event, brief);
      setWorkspace(next);
      setBrief(next.brief);
      setDirectionOpen(false);
      setFilter('needs-review');
      setMessage(
        'Promotion package created. Compare the useful choices and approve each channel.',
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Promotion generation failed.',
      );
    } finally {
      setPending(false);
    }
  }

  async function saveDirection() {
    setPending(true);
    setMessage('');
    try {
      const next = await growthWorkspaceRepository.updateBrief(event, brief);
      setWorkspace(next);
      setBrief(next.brief);
      setDirectionOpen(false);
      setMessage('Campaign direction saved. Existing copy was not regenerated.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save direction.');
    } finally {
      setPending(false);
    }
  }

  async function saveContent(contentItemId: string, body: string): Promise<boolean> {
    setPending(true);
    setMessage('');
    try {
      const next = await growthWorkspaceRepository.updateContentItem(
        event,
        contentItemId,
        body,
      );
      setWorkspace(next);
      setMessage('Recommended copy updated and returned to review.');
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save copy.');
      return false;
    } finally {
      setPending(false);
    }
  }

  async function regenerateContent(contentItemId: string) {
    setPending(true);
    setMessage('');
    try {
      const next = await growthWorkspaceRepository.regenerateContentItem(
        event,
        contentItemId,
      );
      setWorkspace(next);
      setMessage('This channel was rebuilt and returned to review.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not improve this channel.');
    } finally {
      setPending(false);
    }
  }

  async function approveContent(contentItemId: string) {
    setPending(true);
    setMessage('');
    try {
      const next = await growthWorkspaceRepository.updateContentStatus(
        event,
        contentItemId,
        'approved',
      );
      setWorkspace(next);
      setMessage('Channel approved.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not approve this channel.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4 pb-36 lg:pb-12">
      <header className="relative overflow-hidden rounded-[1.8rem] border border-white/10 bg-[radial-gradient(circle_at_90%_0%,rgba(246,183,60,.2),transparent_24rem),radial-gradient(circle_at_0%_100%,rgba(22,128,112,.17),transparent_25rem),linear-gradient(145deg,rgba(18,16,14,.98),rgba(22,12,11,.96))] p-5 shadow-[0_30px_90px_rgba(0,0,0,.34)] sm:p-7">
        <div className="relative flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-3xl">
            <Link
              href={`/admin/events/${event.id}`}
              className="text-xs font-semibold text-amber-100/68"
            >
              ← Event details
            </Link>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <StatusPill status={event.status} />
              {event.promotionTemplate ? (
                <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[.12em] text-white/48">
                  {event.promotionTemplate.name}
                </span>
              ) : null}
              <span className="rounded-full border border-emerald-200/16 bg-emerald-200/[.07] px-3 py-1 text-[10px] font-semibold uppercase tracking-[.12em] text-emerald-100/62">
                Promotion Studio
              </span>
            </div>
            <h1 className="mt-3 font-serif text-3xl text-white sm:text-5xl">
              {event.title}
            </h1>
            <p className="mt-2 text-sm text-white/52">
              {formatVenueDateTime(event.startsAt)} · {event.room}
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/58">
              Generate the complete package once, compare the useful platform versions, approve the copy, then move directly to media.
            </p>
          </div>

          <div className="grid min-w-[16rem] grid-cols-3 gap-2">
            <div className="rounded-2xl border border-white/9 bg-black/24 p-3 text-center">
              <p className="text-[9px] uppercase tracking-[.13em] text-white/32">Ready</p>
              <p className="mt-1 text-2xl font-semibold text-white">{approvedCount}</p>
            </div>
            <div className="rounded-2xl border border-amber-200/14 bg-amber-200/[.06] p-3 text-center">
              <p className="text-[9px] uppercase tracking-[.13em] text-amber-100/45">Review</p>
              <p className="mt-1 text-2xl font-semibold text-amber-100">{draftCount}</p>
            </div>
            <div className="rounded-2xl border border-emerald-200/14 bg-emerald-200/[.06] p-3 text-center">
              <p className="text-[9px] uppercase tracking-[.13em] text-emerald-100/45">Quality</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-100">
                {report?.score ?? '—'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="rounded-[1.65rem] border border-white/10 bg-[#13110f]/88 p-4 sm:p-5">
        <button
          type="button"
          onClick={() => setDirectionOpen((current) => !current)}
          className="flex w-full items-center justify-between gap-4 text-left"
        >
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-white/38">
              Campaign direction
            </p>
            <h2 className="mt-1 text-xl font-semibold text-white">
              {brief.theme || event.title}
            </h2>
            <p className="mt-1 text-xs text-white/42">
              {CAMPAIGN_LANGUAGE_LABELS[brief.language]} · {CAMPAIGN_OBJECTIVE_LABELS[brief.objective]} · {brief.tone}
            </p>
          </div>
          <span className="rounded-full border border-white/12 px-4 py-2 text-xs font-semibold text-white/58">
            {directionOpen ? 'Close setup' : 'Edit setup'}
          </span>
        </button>

        {directionOpen ? (
          <form
            className="mt-5 space-y-5 border-t border-white/8 pt-5"
            onSubmit={(formEvent) => {
              formEvent.preventDefault();
              void generatePackage();
            }}
          >
            <div className="grid gap-5 lg:grid-cols-2">
              <ChoiceRow
                label="Primary goal"
                value={brief.objective}
                choices={Object.entries(CAMPAIGN_OBJECTIVE_LABELS).map(
                  ([value, label]) => ({
                    value: value as CampaignObjective,
                    label,
                  }),
                )}
                onChange={(objective) => setBrief({ ...brief, objective })}
              />
              <ChoiceRow
                label="Language"
                value={brief.language}
                choices={Object.entries(CAMPAIGN_LANGUAGE_LABELS).map(
                  ([value, label]) => ({
                    value: value as CampaignLanguage,
                    label,
                  }),
                )}
                onChange={(language) => setBrief({ ...brief, language })}
              />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[.14em] text-white/38">
                Voice
              </p>
              <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {TONE_PRESETS.map((tone) => (
                  <button
                    key={tone}
                    type="button"
                    onClick={() => setBrief({ ...brief, tone })}
                    className={`min-h-10 shrink-0 rounded-full border px-4 text-xs font-semibold ${
                      brief.tone === tone
                        ? 'border-amber-200/50 bg-amber-300 text-black'
                        : 'border-white/12 text-white/58'
                    }`}
                  >
                    {tone}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="What makes this event worth attending?"
                value={brief.mainAttraction}
                onChange={(mainAttraction) => setBrief({ ...brief, mainAttraction })}
                placeholder="The strongest specific reason to attend"
                multiline
              />
              <div className="grid gap-4">
                <Field
                  label="Call to action"
                  value={brief.offer}
                  onChange={(offer) => setBrief({ ...brief, offer })}
                  placeholder="Reserve your night"
                />
                <Field
                  label="Reservation or ticket link"
                  value={brief.reservationUrl}
                  onChange={(reservationUrl) =>
                    setBrief({ ...brief, reservationUrl })
                  }
                  placeholder="https://…"
                  error={reservationUrlError}
                  hint="Use the final public destination. Tracking is added later by Autopilot."
                />
              </div>
            </div>

            <details className="rounded-2xl border border-white/8 bg-black/15 p-4">
              <summary className="cursor-pointer text-sm font-semibold text-white/65">
                Advanced campaign details
              </summary>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Field
                  label="Internal creative direction"
                  value={brief.theme}
                  onChange={(theme) => setBrief({ ...brief, theme })}
                  hint={`The only public event name remains “${event.title}.”`}
                />
                <Field
                  label="Target audience — internal"
                  value={brief.targetAudience}
                  onChange={(targetAudience) =>
                    setBrief({ ...brief, targetAudience })
                  }
                />
                <Field
                  label="Performers / DJs"
                  value={brief.performers}
                  onChange={(performers) => setBrief({ ...brief, performers })}
                />
                <Field
                  label="Music genres"
                  value={brief.genres}
                  onChange={(genres) => setBrief({ ...brief, genres })}
                />
                <Field
                  label="Doors / show time"
                  value={brief.doorsTime}
                  onChange={(doorsTime) => setBrief({ ...brief, doorsTime })}
                  placeholder="Doors 8 PM · show 9 PM"
                />
                <Field
                  label="Admission"
                  value={brief.admission}
                  onChange={(admission) => setBrief({ ...brief, admission })}
                />
                <Field
                  label="Age policy"
                  value={brief.ageRestriction}
                  onChange={(ageRestriction) =>
                    setBrief({ ...brief, ageRestriction })
                  }
                />
                <Field
                  label="Food / drink special"
                  value={brief.foodDrinkSpecial}
                  onChange={(foodDrinkSpecial) =>
                    setBrief({ ...brief, foodDrinkSpecial })
                  }
                  placeholder="Only include confirmed public offers"
                />
                <Field
                  label="Venue address"
                  value={brief.address}
                  onChange={(address) => setBrief({ ...brief, address })}
                />
                <label className="block text-sm text-white/68">
                  Promotion budget ($)
                  <input
                    type="number"
                    min="0"
                    value={brief.budgetCents / 100}
                    onChange={(inputEvent) =>
                      setBrief({
                        ...brief,
                        budgetCents: Math.max(
                          0,
                          Math.round(Number(inputEvent.target.value || 0) * 100),
                        ),
                      })
                    }
                    className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-black/24 px-3 text-sm text-white outline-none focus:border-amber-200/45"
                  />
                </label>
              </div>
            </details>

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={pending || Boolean(reservationUrlError)}
                className="min-h-12 flex-1 rounded-full bg-amber-300 px-5 text-sm font-bold text-black shadow-[0_12px_35px_rgba(246,183,60,.14)] disabled:cursor-not-allowed disabled:opacity-35"
              >
                {pending
                  ? 'Building package…'
                  : workspace.content.length
                    ? 'Improve complete package'
                    : 'Generate complete package'}
              </button>
              {workspace.content.length ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => void saveDirection()}
                  className="min-h-12 rounded-full border border-white/14 px-5 text-sm font-semibold text-white/62 disabled:opacity-40"
                >
                  Save without regenerating
                </button>
              ) : null}
            </div>
          </form>
        ) : null}
      </section>

      {message ? (
        <p
          role="status"
          className="rounded-2xl border border-amber-200/14 bg-amber-200/[.06] px-4 py-3 text-sm text-amber-50/76"
        >
          {message}
        </p>
      ) : null}

      {workspace.content.length ? (
        <>
          <div className="sticky top-2 z-20 rounded-2xl border border-white/10 bg-[#0d0b0a]/94 p-2 shadow-2xl backdrop-blur-xl">
            <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {FILTERS.map((entry) => {
                const count = filterCount(entry.id);
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => setFilter(entry.id)}
                    className={`min-h-10 shrink-0 rounded-full px-4 text-xs font-semibold ${
                      filter === entry.id
                        ? 'bg-amber-300 text-black'
                        : 'border border-white/10 text-white/56'
                    }`}
                  >
                    {entry.label} · {count}
                  </button>
                );
              })}
            </div>
          </div>

          {filtered.length ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {filtered.map((item) => (
                <ComposerCard
                  key={item.id}
                  item={item}
                  pending={pending}
                  issues={(report?.issues ?? []).filter(
                    (entry) => !entry.channel || entry.channel === item.channel,
                  )}
                  onSave={(body) => saveContent(item.id, body)}
                  onRegenerate={() => regenerateContent(item.id)}
                  onApprove={() => approveContent(item.id)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-white/14 p-8 text-center">
              <h2 className="text-xl font-semibold text-white">This queue is clear</h2>
              <p className="mt-2 text-sm text-white/45">
                Choose another channel group or continue to media.
              </p>
            </div>
          )}
        </>
      ) : (
        <section className="rounded-[1.65rem] border border-dashed border-white/14 bg-black/12 p-8 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-emerald-100/55">
            One generation, complete package
          </p>
          <h2 className="mt-2 font-serif text-3xl text-white">
            Captions, hashtags, Stories, video, email, and SMS
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-white/48">
            The package will create useful choices for every channel while keeping the event facts, recurring-night identity, bilingual voice, and provider requirements aligned.
          </p>
          <button
            type="button"
            disabled={pending || Boolean(reservationUrlError)}
            onClick={() => void generatePackage()}
            className="mt-5 min-h-12 rounded-full bg-amber-300 px-7 text-sm font-bold text-black disabled:opacity-35"
          >
            {pending ? 'Building package…' : 'Generate complete package'}
          </button>
        </section>
      )}

      <div className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 rounded-2xl border border-white/12 bg-[#0d0b0a]/96 p-2 shadow-[0_22px_70px_rgba(0,0,0,.55)] backdrop-blur-xl md:static md:mx-0 md:flex md:items-center md:justify-between md:bg-[#12100e]/88 md:p-4">
        <div className="hidden md:block">
          <p className="text-xs font-semibold text-white/68">
            {workspace.content.length
              ? draftCount
                ? `${draftCount} channel${draftCount === 1 ? '' : 's'} still need approval`
                : 'Campaign copy is ready for media'
              : 'Campaign package has not been generated'}
          </p>
          <p className="mt-1 text-xs text-white/36">
            Nothing publishes from this screen. Approval carries the selected copy into the media and scheduling steps.
          </p>
        </div>
        {workspace.content.length && draftCount === 0 ? (
          <Link
            href={`/admin/events/${event.id}/assets`}
            className="flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-200 px-5 text-sm font-bold text-black md:w-auto md:rounded-full"
          >
            Next: Choose media →
          </Link>
        ) : workspace.content.length ? (
          <button
            type="button"
            onClick={() => setFilter('needs-review')}
            className="min-h-12 w-full rounded-xl bg-amber-300 px-5 text-sm font-bold text-black md:w-auto md:rounded-full"
          >
            Review {draftCount} remaining
          </button>
        ) : (
          <button
            type="button"
            disabled={pending || Boolean(reservationUrlError)}
            onClick={() => {
              setDirectionOpen(true);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="min-h-12 w-full rounded-xl bg-amber-300 px-5 text-sm font-bold text-black disabled:opacity-35 md:w-auto md:rounded-full"
          >
            Set campaign direction
          </button>
        )}
      </div>
    </div>
  );
}
