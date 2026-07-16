'use client';

import { useEffect, useMemo, useState } from 'react';
import { formatVenueDateTime } from '@/lib/admin/date';
import {
  campaignCopyVariants,
  campaignItemBlockingReason,
  campaignItemMetrics,
  flattenHashtagGroups,
  type CampaignCopyVariant,
} from '@/lib/admin/growth/composer';
import {
  CAMPAIGN_CHANNEL_LABELS,
  type CampaignContentItem,
  type CampaignItemStatus,
  type CampaignQualityIssue,
} from '@/lib/admin/growth/domain';

const STATUS_CLASS: Record<CampaignItemStatus, string> = {
  draft: 'border-amber-200/24 bg-amber-200/10 text-amber-100',
  approved: 'border-emerald-200/24 bg-emerald-200/10 text-emerald-100',
  scheduled: 'border-sky-200/24 bg-sky-200/10 text-sky-100',
  published: 'border-violet-200/24 bg-violet-200/10 text-violet-100',
};

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

export function PromotionComposerCard({
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
