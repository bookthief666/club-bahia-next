'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PromotionReviewCard } from '@/components/admin/review/PromotionReviewCard';
import { PromotionReviewToolbar } from '@/components/admin/review/PromotionReviewToolbar';
import {
  approvePromotionReviewItems,
  assignPromotionReviewMedia,
  improvePromotionReviewItem,
  loadPromotionReviewInbox,
  type LoadedEventReviewData,
} from '@/lib/admin/review/client';
import {
  filterPromotionReviewItems,
  summarizePromotionReviewItems,
  type PromotionReviewItem,
  type PromotionReviewLane,
} from '@/lib/admin/review/domain';

export function PromotionReviewInboxClient() {
  const [records, setRecords] = useState<LoadedEventReviewData[]>([]);
  const [items, setItems] = useState<PromotionReviewItem[]>([]);
  const [lane, setLane] = useState<PromotionReviewLane>('needs-review');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState('');
  const [message, setMessage] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);

  const refresh = useCallback(async (clearMessage = true) => {
    setLoading(true);
    if (clearMessage) setMessage('');
    try {
      const loaded = await loadPromotionReviewInbox();
      setRecords(loaded.records);
      setItems(loaded.items);
      setWarnings(loaded.warnings);
      setSelected(new Set());
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Promotion review inbox could not be loaded.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const summary = useMemo(() => summarizePromotionReviewItems(items), [items]);
  const visibleItems = useMemo(
    () => filterPromotionReviewItems({ items, lane, query }),
    [items, lane, query],
  );
  const selectedItems = useMemo(
    () => items.filter((item) => selected.has(item.key)),
    [items, selected],
  );
  const selectedSafe = selectedItems.filter((item) => item.bulkApprovable);
  const selectedAutoMedia = selectedItems.filter(
    (item) => item.autoAssignableAssetId,
  );
  const mediaLocked = records.some(
    (record) => record.mediaAccess !== 'available',
  );
  const busy = loading || Boolean(pending);

  function toggle(key: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function selectVisible() {
    setSelected(
      new Set(
        visibleItems
          .filter((item) => item.bulkApprovable || item.autoAssignableAssetId)
          .map((item) => item.key),
      ),
    );
  }

  async function approveItems(candidates: PromotionReviewItem[]) {
    if (!candidates.length) return;
    const confirmed = window.confirm(
      `Approve ${candidates.length} item${candidates.length === 1 ? '' : 's'} that currently pass every copy, media, link, and delivery-time gate?`,
    );
    if (!confirmed) return;
    setPending('approve');
    setMessage('');
    try {
      await approvePromotionReviewItems({ items: candidates, records });
      await refresh(false);
      setMessage(
        `${candidates.length} safe promotion item${candidates.length === 1 ? '' : 's'} approved. Scheduling remains a separate confirmation.`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Safe approval failed.');
    } finally {
      setPending('');
    }
  }

  async function assignMedia(candidates: PromotionReviewItem[]) {
    if (!candidates.length) return;
    const confirmed = window.confirm(
      `Assign the best already-approved media to ${candidates.length} selected post${candidates.length === 1 ? '' : 's'}? No files will be uploaded or approved automatically.`,
    );
    if (!confirmed) return;
    setPending('media');
    setMessage('');
    try {
      await assignPromotionReviewMedia({ items: candidates, records });
      await refresh(false);
      setMessage(
        `${candidates.length} post${candidates.length === 1 ? '' : 's'} received the strongest compatible approved media.`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Media assignment failed.');
    } finally {
      setPending('');
    }
  }

  async function improve(item: PromotionReviewItem) {
    const confirmed = window.confirm(
      `Improve the ${item.channelLabel.toLowerCase()} for ${item.eventTitle}? The replacement returns to draft for review.`,
    );
    if (!confirmed) return;
    setPending(item.key);
    setMessage('');
    try {
      await improvePromotionReviewItem({ item, records });
      await refresh(false);
      setMessage(`${item.channelLabel} regenerated and returned to draft.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Content could not be improved.');
    } finally {
      setPending('');
    }
  }

  return (
    <div className="space-y-5 pb-32 lg:pb-10">
      <section className="relative overflow-hidden rounded-[1.65rem] border border-white/10 bg-[radial-gradient(circle_at_90%_0%,rgba(34,211,238,.14),transparent_24rem),radial-gradient(circle_at_5%_100%,rgba(246,183,60,.12),transparent_26rem),linear-gradient(145deg,rgba(13,20,19,.98),rgba(22,13,12,.96))] p-5 shadow-[0_25px_80px_rgba(0,0,0,.34)] sm:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-cyan-100/65">
          Cross-event promotion queue
        </p>
        <h1 className="mt-2 font-serif text-4xl text-white sm:text-5xl">
          Review every campaign from one inbox.
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/55 sm:text-base">
          Fix blockers, assign approved media, and approve only posts that pass the existing safety gates. Scheduling and live publication remain separate confirmations.
        </p>
        <div className="mt-5 grid gap-2 min-[440px]:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-white/9 bg-black/20 p-3">
            <p className="text-[10px] uppercase tracking-[.14em] text-white/38">
              Needs review
            </p>
            <p className="mt-1 text-2xl font-semibold text-white">
              {summary.needsReview}
            </p>
          </div>
          <div className="rounded-xl border border-fuchsia-200/12 bg-fuchsia-200/[.04] p-3">
            <p className="text-[10px] uppercase tracking-[.14em] text-fuchsia-100/55">
              Missing media
            </p>
            <p className="mt-1 text-2xl font-semibold text-fuchsia-100">
              {summary.missingMedia}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-200/12 bg-emerald-200/[.04] p-3">
            <p className="text-[10px] uppercase tracking-[.14em] text-emerald-100/55">
              Safe to approve
            </p>
            <p className="mt-1 text-2xl font-semibold text-emerald-100">
              {summary.ready}
            </p>
          </div>
          <div className="rounded-xl border border-red-200/12 bg-red-200/[.04] p-3">
            <p className="text-[10px] uppercase tracking-[.14em] text-red-100/55">
              Publishing problems
            </p>
            <p className="mt-1 text-2xl font-semibold text-red-100">
              {summary.problems}
            </p>
          </div>
        </div>
      </section>

      {mediaLocked ? (
        <section className="rounded-xl border border-amber-200/16 bg-amber-200/[.055] p-4 text-sm leading-6 text-amber-50/70">
          Some event media could not be verified in this session. Open that event’s Choose Media step once to restore protected media access; the inbox will not bulk-approve those visual posts while verification is unavailable.
        </section>
      ) : null}
      {warnings.length ? (
        <details className="group rounded-xl border border-white/10 bg-white/[.035] p-4 text-sm text-white/48">
          <summary className="cursor-pointer list-none font-semibold text-white/62">
            Partial data warnings · {warnings.length}
          </summary>
          <ul className="mt-3 space-y-2 border-t border-white/8 pt-3 text-xs leading-5 text-white/46">
            {warnings.map((warning) => (
              <li key={warning}>• {warning}</li>
            ))}
          </ul>
        </details>
      ) : null}

      <PromotionReviewToolbar
        items={visibleItems}
        summary={summary}
        lane={lane}
        query={query}
        selectedCount={selected.size}
        safeCount={selectedSafe.length}
        mediaCount={selectedAutoMedia.length}
        busy={busy}
        onLaneChange={setLane}
        onQueryChange={setQuery}
        onSelectVisible={selectVisible}
        onClearSelection={() => setSelected(new Set())}
        onAssignMedia={() => void assignMedia(selectedAutoMedia)}
        onApproveSafe={() => void approveItems(selectedSafe)}
        onRefresh={() => void refresh()}
      />

      {message ? (
        <p
          role="status"
          className="rounded-xl border border-amber-200/15 bg-amber-200/[.055] px-4 py-3 text-sm text-amber-50/75"
        >
          {message}
        </p>
      ) : null}

      {loading ? (
        <section className="rounded-[1.45rem] border border-white/10 bg-white/[.025] p-8 text-center text-sm text-white/45">
          Loading active event campaigns, approved media, and publishing status…
        </section>
      ) : visibleItems.length ? (
        <div className="space-y-3">
          {visibleItems.map((item) => (
            <PromotionReviewCard
              key={item.key}
              item={item}
              selected={selected.has(item.key)}
              pending={busy}
              onToggle={() => toggle(item.key)}
              onApprove={() => void approveItems([item])}
              onImprove={() => void improve(item)}
            />
          ))}
        </div>
      ) : (
        <section className="rounded-[1.45rem] border border-white/10 bg-white/[.025] p-8 text-center">
          <h2 className="font-serif text-3xl text-white">Nothing in this view</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-white/45">
            Change the filter, clear the search, or generate a campaign for an active event.
          </p>
          <Link
            href="/admin/events"
            className="mt-5 inline-flex min-h-11 items-center rounded-full bg-amber-300 px-5 text-sm font-bold text-black"
          >
            Open events
          </Link>
        </section>
      )}
    </div>
  );
}
