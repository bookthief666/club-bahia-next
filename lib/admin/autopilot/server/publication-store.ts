import 'server-only';

import { createHash } from 'node:crypto';
import type { AdminUser } from '@/lib/admin/domain';
import type { InstagramImagePublication } from '@/lib/admin/autopilot/server/meta';
import {
  getAdminWorkspaceRecord,
  saveAdminWorkspaceRecord,
} from '@/lib/admin/workspaces/server';

export type ControlledPublicationStatus =
  | 'claimed'
  | 'published'
  | 'failed'
  | 'needs-review';

export interface ControlledPublicationRecord {
  schemaVersion: 1;
  idempotencyKey: string;
  eventId: string;
  contentItemId: string;
  provider: 'meta';
  channel: 'instagram-feed';
  captionHash: string;
  imageUrl: string;
  status: ControlledPublicationStatus;
  attemptCount: number;
  claimedAt: string;
  updatedAt: string;
  providerPublicationId?: string;
  externalUrl?: string;
  providerTimestamp?: string;
  warning?: string;
  lastError?: string;
  safeToRetry?: boolean;
}

export class PublicationClaimError extends Error {
  readonly status = 409;

  constructor(
    message: string,
    readonly record?: ControlledPublicationRecord,
  ) {
    super(message);
    this.name = 'PublicationClaimError';
  }
}

function hash(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

export function publicationWorkspaceKey(idempotencyKey: string): string {
  return `pub_${hash(idempotencyKey).slice(0, 48)}`;
}

export function publicationCaptionHash(caption: string): string {
  return hash(caption);
}

export async function getControlledPublication(
  idempotencyKey: string,
): Promise<{
  record: ControlledPublicationRecord;
  revision: number;
} | null> {
  const workspace = await getAdminWorkspaceRecord<ControlledPublicationRecord>(
    'autopilot-publication',
    publicationWorkspaceKey(idempotencyKey),
  );
  if (!workspace) return null;
  return { record: workspace.value, revision: workspace.revision };
}

export async function claimControlledPublication(input: {
  idempotencyKey: string;
  eventId: string;
  contentItemId: string;
  caption: string;
  imageUrl: string;
  user: AdminUser;
  now?: Date;
}): Promise<{
  record: ControlledPublicationRecord;
  revision: number;
  alreadyPublished: boolean;
}> {
  const now = input.now ?? new Date();
  const current = await getControlledPublication(input.idempotencyKey);

  if (current?.record.status === 'published') {
    return {
      ...current,
      alreadyPublished: true,
    };
  }
  if (current?.record.status === 'claimed') {
    throw new PublicationClaimError(
      'This exact post already has an active publication attempt. Wait for it to finish before doing anything else.',
      current.record,
    );
  }
  if (current?.record.status === 'needs-review') {
    throw new PublicationClaimError(
      'The previous Meta response was uncertain. Verify Instagram manually before attempting another publication.',
      current.record,
    );
  }
  if (current?.record.status === 'failed' && !current.record.safeToRetry) {
    throw new PublicationClaimError(
      'The previous publication attempt cannot be retried safely without checking Instagram first.',
      current.record,
    );
  }

  const timestamp = now.toISOString();
  const record: ControlledPublicationRecord = {
    schemaVersion: 1,
    idempotencyKey: input.idempotencyKey,
    eventId: input.eventId,
    contentItemId: input.contentItemId,
    provider: 'meta',
    channel: 'instagram-feed',
    captionHash: publicationCaptionHash(input.caption),
    imageUrl: input.imageUrl,
    status: 'claimed',
    attemptCount: (current?.record.attemptCount ?? 0) + 1,
    claimedAt: timestamp,
    updatedAt: timestamp,
  };

  const saved = await saveAdminWorkspaceRecord({
    kind: 'autopilot-publication',
    key: publicationWorkspaceKey(input.idempotencyKey),
    value: record,
    expectedRevision: current?.revision ?? 0,
    user: input.user,
  });

  return {
    record: saved.value,
    revision: saved.revision,
    alreadyPublished: false,
  };
}

export async function completeControlledPublication(input: {
  idempotencyKey: string;
  expectedRevision: number;
  publication: InstagramImagePublication;
  user: AdminUser;
  now?: Date;
}): Promise<ControlledPublicationRecord> {
  const current = await getControlledPublication(input.idempotencyKey);
  if (!current || current.revision !== input.expectedRevision) {
    throw new PublicationClaimError(
      'The publication claim changed before its Meta receipt could be saved.',
      current?.record,
    );
  }

  const record: ControlledPublicationRecord = {
    ...current.record,
    status: 'published',
    providerPublicationId: input.publication.providerPublicationId,
    externalUrl: input.publication.permalink,
    providerTimestamp: input.publication.providerTimestamp,
    warning: input.publication.warning,
    safeToRetry: false,
    lastError: undefined,
    updatedAt: (input.now ?? new Date()).toISOString(),
  };
  const saved = await saveAdminWorkspaceRecord({
    kind: 'autopilot-publication',
    key: publicationWorkspaceKey(input.idempotencyKey),
    value: record,
    expectedRevision: current.revision,
    user: input.user,
  });
  return saved.value;
}

export async function failControlledPublication(input: {
  idempotencyKey: string;
  expectedRevision: number;
  error: string;
  safeToRetry: boolean;
  uncertain: boolean;
  user: AdminUser;
  now?: Date;
}): Promise<ControlledPublicationRecord | null> {
  const current = await getControlledPublication(input.idempotencyKey);
  if (!current || current.revision !== input.expectedRevision) return null;

  const record: ControlledPublicationRecord = {
    ...current.record,
    status: input.uncertain ? 'needs-review' : 'failed',
    lastError: input.error.slice(0, 1000),
    safeToRetry: input.safeToRetry,
    updatedAt: (input.now ?? new Date()).toISOString(),
  };
  const saved = await saveAdminWorkspaceRecord({
    kind: 'autopilot-publication',
    key: publicationWorkspaceKey(input.idempotencyKey),
    value: record,
    expectedRevision: current.revision,
    user: input.user,
  });
  return saved.value;
}
