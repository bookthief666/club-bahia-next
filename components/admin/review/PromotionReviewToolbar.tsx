'use client';

import {
  PROMOTION_REVIEW_LANE_LABELS,
  type PromotionReviewItem,
  type PromotionReviewLane,
  type PromotionReviewSummary,
} from '@/lib/admin/review/domain';

const FILTERS: PromotionReviewLane[] = [
  'needs-review',
  'missing-media',
  'ready',
  'approved',
  'problems',
  'all',
];

function laneCount(
  filter: PromotionReviewLane,
  items: PromotionReviewItem[],
  summary: PromotionReviewSummary,
): number {
  if (filter === 'all') return summary.total;
  return items.filter((item) => item.lane === filter).length;
}

export function PromotionReviewToolbar({
  items,
  summary,
  lane,
  query,
  selectedCount,
  safeCount,
  mediaCount,
  busy,
  onLaneChange,
  onQueryChange,
  onSelectVisible,
  onClearSelection,
  onAssignMedia,
  onApproveSafe,
  onRefresh,
}: {
  items: PromotionReviewItem[];
  summary: PromotionReviewSummary;
  lane: PromotionReviewLane;
  query: string;
  selectedCount: number;
  safeCount: number;
  mediaCount: number;
  busy: boolean;
  onLaneChange: (lane: PromotionReviewLane) => void;
  onQueryChange: (query: string) => void;
  onSelectVisible: () => void;
  onClearSelection: () => void;
  onAssignMedia: () => void;
  onApproveSafe: () => void;
  onRefresh: () => void;
}) {
  return (
    <section className="sticky top-[5.6rem] z-[8] rounded-[1.35rem] border border-white/10 bg-[linear-gradient(145deg,rgba(14,16,14,.96),rgba(17,12,11,.96))] p-3 shadow-[0_18px_55px_rgba(0,0,0,.35)] backdrop-blur-xl sm:p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => onLaneChange(filter)}
              className={`min-h-9 rounded-full border px-3 text-xs font-semibold ${
                lane === filter
                  ? 'border-cyan-200/30 bg-cyan-200/10 text-cyan-100'
                  : 'border-white/10 text-white/48'
              }`}
            >
              {PROMOTION_REVIEW_LANE_LABELS[filter]} ·{' '}
              {laneCount(filter, items, summary)}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search event, channel, copy, or blocker"
          className="min-h-11 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-white outline-none focus:border-cyan-200/35 xl:max-w-sm"
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/8 pt-3">
        <button
          type="button"
          onClick={onSelectVisible}
          disabled={busy || !items.length}
          className="min-h-10 rounded-full border border-white/12 px-4 text-xs font-semibold text-white/55 disabled:opacity-35"
        >
          Select actionable visible
        </button>
        <button
          type="button"
          onClick={onClearSelection}
          disabled={busy || !selectedCount}
          className="min-h-10 rounded-full border border-white/12 px-4 text-xs font-semibold text-white/45 disabled:opacity-30"
        >
          Clear selection
        </button>
        <button
          type="button"
          onClick={onAssignMedia}
          disabled={busy || !mediaCount}
          className="min-h-10 rounded-full border border-fuchsia-200/20 bg-fuchsia-200/[.07] px-4 text-xs font-bold text-fuchsia-100 disabled:opacity-35"
        >
          Assign approved media · {mediaCount}
        </button>
        <button
          type="button"
          onClick={onApproveSafe}
          disabled={busy || !safeCount}
          className="min-h-10 rounded-full bg-emerald-200 px-4 text-xs font-bold text-black disabled:opacity-35"
        >
          Approve safe selected · {safeCount}
        </button>
        <button
          type="button"
          onClick={onRefresh}
          disabled={busy}
          className="ml-auto min-h-10 rounded-full border border-cyan-200/18 px-4 text-xs font-semibold text-cyan-100/75 disabled:opacity-35"
        >
          Refresh
        </button>
      </div>
    </section>
  );
}
