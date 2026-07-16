'use client';

import Link from 'next/link';
import {
  PROMOTION_REVIEW_LANE_LABELS,
  type PromotionReviewItem,
} from '@/lib/admin/review/domain';

function venueDateTime(value?: string): string {
  if (!value) return 'No time planned';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Invalid time';
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(parsed);
}

function laneTone(lane: PromotionReviewItem['lane']): string {
  if (lane === 'ready') {
    return 'border-emerald-200/25 bg-emerald-200/10 text-emerald-100';
  }
  if (lane === 'problems') {
    return 'border-red-200/25 bg-red-200/10 text-red-100';
  }
  if (lane === 'missing-media') {
    return 'border-fuchsia-200/20 bg-fuchsia-200/[.07] text-fuchsia-100';
  }
  if (lane === 'approved') {
    return 'border-cyan-200/20 bg-cyan-200/[.07] text-cyan-100';
  }
  return 'border-amber-200/20 bg-amber-200/[.07] text-amber-100';
}

function AssetPreview({ item }: { item: PromotionReviewItem }) {
  const asset = item.primaryAsset;
  if (!asset) {
    return (
      <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-white/10 bg-black/20 px-4 text-center text-xs leading-5 text-white/32">
        No verified primary media assigned.
      </div>
    );
  }
  if (asset.kind === 'image') {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={asset.url}
        alt={asset.altText || asset.name}
        className="h-32 w-full rounded-xl bg-black/30 object-cover"
      />
    );
  }
  if (asset.kind === 'video') {
    return (
      <video
        src={asset.url}
        muted
        playsInline
        preload="metadata"
        className="h-32 w-full rounded-xl bg-black object-cover"
      />
    );
  }
  return (
    <div className="flex h-32 items-center justify-center rounded-xl border border-white/8 bg-black/20 px-4 text-center text-xs text-white/42">
      {asset.name}
    </div>
  );
}

export function PromotionReviewCard({
  item,
  selected,
  pending,
  onToggle,
  onApprove,
  onImprove,
}: {
  item: PromotionReviewItem;
  selected: boolean;
  pending: boolean;
  onToggle: () => void;
  onApprove: () => void;
  onImprove: () => void;
}) {
  const selectable = item.bulkApprovable || Boolean(item.autoAssignableAssetId);
  const queueProblem = item.queue.find((job) =>
    ['failed', 'paused', 'needs-media'].includes(job.status),
  );
  const copyPreview =
    item.body.length > 420 ? `${item.body.slice(0, 420).trim()}…` : item.body;

  return (
    <article className="rounded-[1.45rem] border border-white/10 bg-[linear-gradient(145deg,rgba(17,19,17,.94),rgba(20,13,12,.94))] p-4 shadow-[0_18px_55px_rgba(0,0,0,.25)] sm:p-5">
      <div className="flex items-start gap-3">
        <label
          className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
            selectable
              ? 'border-white/15 bg-black/25'
              : 'border-white/6 bg-white/[.02] opacity-35'
          }`}
        >
          <input
            type="checkbox"
            checked={selected}
            disabled={!selectable || pending}
            onChange={onToggle}
            aria-label={`Select ${item.channelLabel} for ${item.eventTitle}`}
            className="h-4 w-4 accent-amber-300"
          />
        </label>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[10px] font-semibold uppercase tracking-[.18em] text-emerald-100/58">
                {item.eventTitle} · {venueDateTime(item.eventStartsAt)}
              </p>
              <h2 className="mt-1 font-serif text-2xl text-white">
                {item.channelLabel}
              </h2>
              <p className="mt-1 text-xs text-white/38">
                Planned delivery: {venueDateTime(item.publishAt)}
              </p>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <span
                className={`rounded-full border px-3 py-1 text-[9px] font-bold uppercase tracking-[.12em] ${laneTone(item.lane)}`}
              >
                {PROMOTION_REVIEW_LANE_LABELS[item.lane]}
              </span>
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[9px] font-bold uppercase tracking-[.12em] text-white/48">
                {item.copyStatus}
              </span>
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_12rem]">
            <div>
              <p className="text-sm font-semibold text-white/76">{item.title}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/53">
                {copyPreview}
              </p>
            </div>
            <AssetPreview item={item} />
          </div>

          {item.blockingReasons.length ? (
            <div className="mt-4 rounded-xl border border-amber-200/14 bg-amber-200/[.055] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-amber-100/65">
                What blocks the next action
              </p>
              <ul className="mt-2 space-y-1 text-xs leading-5 text-amber-50/70">
                {item.blockingReasons.slice(0, 4).map((reason) => (
                  <li key={reason}>• {reason}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {queueProblem ? (
            <div className="mt-4 rounded-xl border border-red-200/18 bg-red-200/[.065] p-3 text-xs leading-5 text-red-50/75">
              <strong className="font-semibold">{queueProblem.label}:</strong>{' '}
              {queueProblem.lastError || `Publishing job is ${queueProblem.status}.`}
            </div>
          ) : null}

          {item.queue.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {item.queue.map((job) => (
                <span
                  key={job.id}
                  className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[10px] text-white/45"
                >
                  {job.provider} · {job.status}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-2">
            {item.bulkApprovable ? (
              <button
                type="button"
                disabled={pending}
                onClick={onApprove}
                className="min-h-10 rounded-full bg-emerald-200 px-4 text-xs font-bold text-black disabled:opacity-40"
              >
                Approve safe item
              </button>
            ) : null}
            <button
              type="button"
              disabled={pending || item.copyStatus === 'published'}
              onClick={onImprove}
              className="min-h-10 rounded-full border border-amber-200/20 bg-amber-200/[.06] px-4 text-xs font-semibold text-amber-100 disabled:opacity-35"
            >
              Improve with AI
            </button>
            <Link
              href={`/admin/events/${item.eventId}/growth`}
              className="inline-flex min-h-10 items-center rounded-full border border-white/12 px-4 text-xs font-semibold text-white/58"
            >
              Edit copy
            </Link>
            <Link
              href={`/admin/events/${item.eventId}/assets`}
              className="inline-flex min-h-10 items-center rounded-full border border-white/12 px-4 text-xs font-semibold text-white/58"
            >
              Choose media
            </Link>
            <Link
              href={`/admin/events/${item.eventId}/publishing`}
              className="inline-flex min-h-10 items-center rounded-full border border-white/12 px-4 text-xs font-semibold text-white/58"
            >
              Review package
            </Link>
            {item.readyForScheduling ? (
              <Link
                href={`/admin/events/${item.eventId}/publishing/execute`}
                className="inline-flex min-h-10 items-center rounded-full border border-cyan-200/20 bg-cyan-200/[.06] px-4 text-xs font-semibold text-cyan-100"
              >
                Schedule or publish →
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
