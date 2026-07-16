'use client';

import type { EventAsset } from '@/lib/admin/assets/domain';
import type { PublishingQueueJob } from '@/lib/admin/autopilot/queue-domain';
import type { OperationsEvent } from '@/lib/admin/domain';
import { eventRepository, isActiveEvent } from '@/lib/admin/event-repository';
import type { EventGrowthWorkspace } from '@/lib/admin/growth/domain';
import { growthWorkspaceRepository } from '@/lib/admin/growth/repository';
import type { EventPostAssembly } from '@/lib/admin/publishing/domain';
import { postAssemblyRepository } from '@/lib/admin/publishing/repository';
import {
  buildPromotionReviewItems,
  type PromotionMediaAccess,
  type PromotionReviewItem,
  type PromotionReviewSource,
} from '@/lib/admin/review/domain';

export interface LoadedEventReviewData {
  event: OperationsEvent;
  workspace: EventGrowthWorkspace;
  assembly: EventPostAssembly;
  assets: EventAsset[];
  mediaAccess: PromotionMediaAccess;
}

export interface LoadedPromotionReviewInbox {
  records: LoadedEventReviewData[];
  items: PromotionReviewItem[];
  queueWarning: string;
}

interface QueueResponse {
  jobs?: PublishingQueueJob[];
  error?: string;
}

async function mapWithConcurrency<T, R>(
  values: T[],
  limit: number,
  worker: (value: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(values.length);
  let cursor = 0;
  const workers = Array.from(
    { length: Math.min(Math.max(limit, 1), Math.max(values.length, 1)) },
    async () => {
      while (cursor < values.length) {
        const index = cursor;
        cursor += 1;
        results[index] = await worker(values[index]);
      }
    },
  );
  await Promise.all(workers);
  return results;
}

async function loadQueue(): Promise<{
  jobs: PublishingQueueJob[];
  warning: string;
}> {
  const response = await fetch('/api/admin/autopilot/queue', {
    cache: 'no-store',
  });
  const payload = (await response.json().catch(() => ({}))) as QueueResponse;
  if (!response.ok) {
    return {
      jobs: [],
      warning:
        payload.error ||
        'Publishing queue status is unavailable. Copy and media review still work.',
    };
  }
  return { jobs: payload.jobs ?? [], warning: '' };
}

async function loadAssets(eventId: string): Promise<{
  assets: EventAsset[];
  mediaAccess: PromotionMediaAccess;
}> {
  const response = await fetch(
    `/api/admin/assets?eventId=${encodeURIComponent(eventId)}`,
    { cache: 'no-store' },
  );
  if (response.ok) {
    const payload = (await response.json()) as { assets?: EventAsset[] };
    return { assets: payload.assets ?? [], mediaAccess: 'available' };
  }
  return {
    assets: [],
    mediaAccess: response.status === 401 ? 'locked' : 'unavailable',
  };
}

export async function loadPromotionReviewInbox(): Promise<LoadedPromotionReviewInbox> {
  const [allEvents, queue] = await Promise.all([
    eventRepository.listEvents(),
    loadQueue(),
  ]);
  const activeEvents = allEvents.filter(isActiveEvent).slice(0, 40);
  const loaded = await mapWithConcurrency(activeEvents, 4, async (event) => {
    const workspace = await growthWorkspaceRepository.getWorkspace(event);
    if (!workspace.content.length) return null;
    const [assembly, media] = await Promise.all([
      postAssemblyRepository.get(event.id),
      loadAssets(event.id),
    ]);
    return {
      event,
      workspace,
      assembly,
      assets: media.assets,
      mediaAccess: media.mediaAccess,
    };
  });
  const records = loaded.filter(
    (record): record is LoadedEventReviewData => record !== null,
  );
  const sources: PromotionReviewSource[] = records.map((record) => ({
    ...record,
    queueJobs: queue.jobs.filter((job) => job.eventId === record.event.id),
  }));
  return {
    records,
    items: buildPromotionReviewItems(sources),
    queueWarning: queue.warning,
  };
}

export async function approvePromotionReviewItems(input: {
  items: PromotionReviewItem[];
  records: LoadedEventReviewData[];
}): Promise<void> {
  for (const item of input.items) {
    const record = input.records.find((entry) => entry.event.id === item.eventId);
    if (!record) throw new Error(`Event ${item.eventTitle} is no longer loaded.`);
    await growthWorkspaceRepository.updateContentStatus(
      record.event,
      item.contentItemId,
      'approved',
    );
  }
}

export async function assignPromotionReviewMedia(
  items: PromotionReviewItem[],
): Promise<void> {
  for (const item of items) {
    if (!item.autoAssignableAssetId) continue;
    await postAssemblyRepository.assignPrimaryAsset(
      item.eventId,
      item.contentItemId,
      item.channel,
      item.autoAssignableAssetId,
    );
  }
}

export async function improvePromotionReviewItem(input: {
  item: PromotionReviewItem;
  records: LoadedEventReviewData[];
}): Promise<void> {
  const record = input.records.find(
    (entry) => entry.event.id === input.item.eventId,
  );
  if (!record) throw new Error(`Event ${input.item.eventTitle} is no longer loaded.`);
  await growthWorkspaceRepository.regenerateContentItem(
    record.event,
    input.item.contentItemId,
  );
}
