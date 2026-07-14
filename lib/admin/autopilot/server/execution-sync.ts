import 'server-only';

import type { AdminUser } from '@/lib/admin/domain';
import type {
  EventPublishingExecution,
  PublishingExecutionItem,
} from '@/lib/admin/publishing/execution-domain';
import { AdminWorkspaceConflictError } from '@/lib/admin/workspaces/domain';
import {
  getAdminWorkspaceRecord,
  saveAdminWorkspaceRecord,
} from '@/lib/admin/workspaces/server';

export async function syncQueuePublicationToExecution(input: {
  eventId: string;
  contentItemId: string;
  channel: string;
  status: 'scheduled' | 'published';
  scheduledFor?: string;
  externalUrl?: string;
  note?: string;
  user: AdminUser;
}): Promise<void> {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const current = await getAdminWorkspaceRecord<EventPublishingExecution>(
      'publishing-execution',
      input.eventId,
    );
    const now = new Date().toISOString();
    const previous = current?.value?.items?.find(
      (item) => item.contentItemId === input.contentItemId,
    );
    const item: PublishingExecutionItem = {
      contentItemId: input.contentItemId,
      channel: (previous?.channel ?? input.channel) as PublishingExecutionItem['channel'],
      status: input.status,
      scheduledFor: input.scheduledFor ?? previous?.scheduledFor,
      publishedAt: input.status === 'published' ? now : previous?.publishedAt,
      externalUrl: input.externalUrl ?? previous?.externalUrl,
      notes: input.note ?? previous?.notes,
      updatedAt: now,
    };
    const value: EventPublishingExecution = {
      eventId: input.eventId,
      items: [
        ...(current?.value?.items ?? []).filter(
          (entry) => entry.contentItemId !== input.contentItemId,
        ),
        item,
      ],
      updatedAt: now,
    };
    try {
      await saveAdminWorkspaceRecord({
        kind: 'publishing-execution',
        key: input.eventId,
        value,
        expectedRevision: current?.revision ?? 0,
        user: input.user,
      });
      return;
    } catch (error) {
      if (!(error instanceof AdminWorkspaceConflictError) || attempt === 3) {
        throw error;
      }
    }
  }
}
