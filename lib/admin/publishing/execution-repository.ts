'use client';

import type { CampaignContentItem } from '@/lib/admin/growth/domain';
import {
  emptyPublishingExecution,
  normalizeExecutionItem,
  type EventPublishingExecution,
  type PublishingExecutionItem,
  type PublishingExecutionStatus,
} from '@/lib/admin/publishing/execution-domain';
import {
  canUseSharedWorkspaceStorage,
  loadOrMigrateSharedWorkspace,
  saveSharedWorkspace,
  SharedWorkspaceConflictError,
} from '@/lib/admin/workspaces/client';

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
  private readonly sharedRevisions = new Map<string, number>();

  private readAllLocal(): Record<string, Partial<EventPublishingExecution>> {
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

  private writeAllLocal(
    all: Record<string, Partial<EventPublishingExecution>>,
  ): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }

  private clearLegacy(eventId: string): void {
    const all = this.readAllLocal();
    if (!(eventId in all)) return;
    delete all[eventId];
    if (Object.keys(all).length) this.writeAllLocal(all);
    else window.localStorage.removeItem(STORAGE_KEY);
  }

  private notify(eventId: string): void {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(
      new CustomEvent(PUBLISHING_EXECUTION_UPDATED_EVENT, {
        detail: { eventId },
      }),
    );
  }

  private async save(
    execution: EventPublishingExecution,
  ): Promise<EventPublishingExecution> {
    const next = {
      ...execution,
      updatedAt: new Date().toISOString(),
    };

    if (!canUseSharedWorkspaceStorage()) {
      const all = this.readAllLocal();
      all[execution.eventId] = next;
      this.writeAllLocal(all);
      this.notify(execution.eventId);
      return clone(next);
    }

    try {
      const record = await saveSharedWorkspace({
        kind: 'publishing-execution',
        key: execution.eventId,
        value: next,
        expectedRevision: this.sharedRevisions.get(execution.eventId) ?? 0,
      });
      this.sharedRevisions.set(execution.eventId, record.revision);
      this.notify(execution.eventId);
      return clone(record.value);
    } catch (error) {
      if (error instanceof SharedWorkspaceConflictError) {
        throw new Error(
          'Publishing status changed in another browser. Reload before saving again.',
        );
      }
      throw error;
    }
  }

  async get(
    eventId: string,
    content: CampaignContentItem[],
  ): Promise<EventPublishingExecution> {
    if (!content.length) return emptyPublishingExecution(eventId);

    if (!canUseSharedWorkspaceStorage()) {
      return clone(normalizeExecution(eventId, content, this.readAllLocal()[eventId]));
    }

    const legacy = this.readAllLocal()[eventId];
    const record = await loadOrMigrateSharedWorkspace<
      Partial<EventPublishingExecution>
    >({
      kind: 'publishing-execution',
      key: eventId,
      legacyValue: legacy,
    });
    this.sharedRevisions.set(eventId, record?.revision ?? 0);
    if (record && legacy) this.clearLegacy(eventId);
    return clone(normalizeExecution(eventId, content, record?.value));
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
