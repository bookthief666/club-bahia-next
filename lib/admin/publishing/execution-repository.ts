'use client';

import type { CampaignContentItem } from '@/lib/admin/growth/domain';
import {
  emptyPublishingExecution,
  normalizeExecutionItem,
  type EventPublishingExecution,
  type PublishingExecutionItem,
  type PublishingExecutionStatus,
} from '@/lib/admin/publishing/execution-domain';

const STORAGE_KEY = 'club-bahia-publishing-execution-v1';
export const PUBLISHING_EXECUTION_UPDATED_EVENT =
  'club-bahia-publishing-execution-updated';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function normalizeExecution(
  eventId: string,
  content: CampaignContentItem[],
  stored?: Partial<EventPublishingExecution>,
): EventPublishingExecution {
  const existing = Array.isArray(stored?.items) ? stored.items : [];

  return {
    eventId,
    items: content.map((item) =>
      normalizeExecutionItem(
        item,
        existing.find((entry) => entry.contentItemId === item.id),
      ),
    ),
    updatedAt: stored?.updatedAt ?? new Date().toISOString(),
  };
}

export interface PublishingExecutionRepository {
  get(
    eventId: string,
    content: CampaignContentItem[],
  ): Promise<EventPublishingExecution>;
  updateItem(
    eventId: string,
    content: CampaignContentItem[],
    contentItemId: string,
    patch: Partial<
      Pick<
        PublishingExecutionItem,
        'status' | 'scheduledFor' | 'publishedAt' | 'externalUrl' | 'notes'
      >
    >,
  ): Promise<EventPublishingExecution>;
  setStatus(
    eventId: string,
    content: CampaignContentItem[],
    contentItemId: string,
    status: PublishingExecutionStatus,
  ): Promise<EventPublishingExecution>;
}

export class BrowserPublishingExecutionRepository
  implements PublishingExecutionRepository
{
  private readAll(): Record<string, Partial<EventPublishingExecution>> {
    if (typeof window === 'undefined') return {};
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};

    try {
      return JSON.parse(raw) as Record<
        string,
        Partial<EventPublishingExecution>
      >;
    } catch {
      return {};
    }
  }

  private save(execution: EventPublishingExecution): EventPublishingExecution {
    const next = {
      ...execution,
      updatedAt: new Date().toISOString(),
    };
    const all = this.readAll();
    all[execution.eventId] = next;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    window.dispatchEvent(
      new CustomEvent(PUBLISHING_EXECUTION_UPDATED_EVENT, {
        detail: { eventId: execution.eventId },
      }),
    );
    return clone(next);
  }

  async get(
    eventId: string,
    content: CampaignContentItem[],
  ): Promise<EventPublishingExecution> {
    if (!content.length) return emptyPublishingExecution(eventId);
    return clone(normalizeExecution(eventId, content, this.readAll()[eventId]));
  }

  async updateItem(
    eventId: string,
    content: CampaignContentItem[],
    contentItemId: string,
    patch: Partial<
      Pick<
        PublishingExecutionItem,
        'status' | 'scheduledFor' | 'publishedAt' | 'externalUrl' | 'notes'
      >
    >,
  ): Promise<EventPublishingExecution> {
    const current = await this.get(eventId, content);
    const found = current.items.some(
      (item) => item.contentItemId === contentItemId,
    );
    if (!found) throw new Error('Publishing execution item not found.');

    const items = current.items.map((item) =>
      item.contentItemId === contentItemId
        ? {
            ...item,
            ...patch,
            updatedAt: new Date().toISOString(),
          }
        : item,
    );

    return this.save({ ...current, items });
  }

  async setStatus(
    eventId: string,
    content: CampaignContentItem[],
    contentItemId: string,
    status: PublishingExecutionStatus,
  ): Promise<EventPublishingExecution> {
    const now = new Date().toISOString();
    return this.updateItem(eventId, content, contentItemId, {
      status,
      publishedAt: status === 'published' ? now : undefined,
    });
  }
}

export const publishingExecutionRepository =
  new BrowserPublishingExecutionRepository();
