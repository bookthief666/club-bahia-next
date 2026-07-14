import 'server-only';

import { createHash } from 'node:crypto';
import type { AdminUser } from '@/lib/admin/domain';
import {
  getAdminWorkspaceRecord,
  saveAdminWorkspaceRecord,
} from '@/lib/admin/workspaces/server';

export type InstagramReelProofStatus =
  | 'claimed'
  | 'processing'
  | 'ready'
  | 'published'
  | 'failed'
  | 'needs-review';

export interface InstagramReelProofRecord {
  schemaVersion: 1;
  idempotencyKey: string;
  eventId: string;
  contentItemId: string;
  captionHash: string;
  videoUrl: string;
  shareToFeed: boolean;
  status: InstagramReelProofStatus;
  attemptCount: number;
  claimedAt: string;
  updatedAt: string;
  containerId?: string;
  providerStatus?: string;
  providerPublicationId?: string;
  externalUrl?: string;
  providerTimestamp?: string;
  warning?: string;
  lastError?: string;
  safeToRetry?: boolean;
}

export class InstagramReelProofClaimError extends Error {
  readonly status = 409;

  constructor(
    message: string,
    readonly record?: InstagramReelProofRecord,
  ) {
    super(message);
    this.name = 'InstagramReelProofClaimError';
  }
}

function hash(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function workspaceKey(idempotencyKey: string): string {
  return `reel_${hash(idempotencyKey).slice(0, 48)}`;
}

function captionHash(caption: string): string {
  return hash(caption);
}

export async function getInstagramReelProof(
  idempotencyKey: string,
): Promise<{ record: InstagramReelProofRecord; revision: number } | null> {
  const workspace = await getAdminWorkspaceRecord<InstagramReelProofRecord>(
    'autopilot-publication',
    workspaceKey(idempotencyKey),
  );
  if (!workspace) return null;
  return { record: workspace.value, revision: workspace.revision };
}

export async function claimInstagramReelProof(input: {
  idempotencyKey: string;
  eventId: string;
  contentItemId: string;
  caption: string;
  videoUrl: string;
  shareToFeed: boolean;
  user: AdminUser;
  now?: Date;
}): Promise<{
  record: InstagramReelProofRecord;
  revision: number;
  alreadyPublished: boolean;
}> {
  const current = await getInstagramReelProof(input.idempotencyKey);
  if (current?.record.status === 'published') {
    return { ...current, alreadyPublished: true };
  }
  if (
    current &&
    ['claimed', 'processing', 'ready'].includes(current.record.status)
  ) {
    throw new InstagramReelProofClaimError(
      'This exact Reel already has an active proof attempt. Continue from its saved receipt instead of creating another container.',
      current.record,
    );
  }
  if (current?.record.status === 'needs-review') {
    throw new InstagramReelProofClaimError(
      'The previous Reel response was uncertain. Check the real Instagram account before attempting another publication.',
      current.record,
    );
  }
  if (current?.record.status === 'failed' && !current.record.safeToRetry) {
    throw new InstagramReelProofClaimError(
      'The previous Reel attempt cannot be retried safely without checking Instagram first.',
      current.record,
    );
  }

  const timestamp = (input.now ?? new Date()).toISOString();
  const record: InstagramReelProofRecord = {
    schemaVersion: 1,
    idempotencyKey: input.idempotencyKey,
    eventId: input.eventId,
    contentItemId: input.contentItemId,
    captionHash: captionHash(input.caption),
    videoUrl: input.videoUrl,
    shareToFeed: input.shareToFeed,
    status: 'claimed',
    attemptCount: (current?.record.attemptCount ?? 0) + 1,
    claimedAt: timestamp,
    updatedAt: timestamp,
  };
  const saved = await saveAdminWorkspaceRecord({
    kind: 'autopilot-publication',
    key: workspaceKey(input.idempotencyKey),
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

async function replaceInstagramReelProof(input: {
  idempotencyKey: string;
  expectedRevision: number;
  record: InstagramReelProofRecord;
  user: AdminUser;
}): Promise<InstagramReelProofRecord> {
  const current = await getInstagramReelProof(input.idempotencyKey);
  if (!current || current.revision !== input.expectedRevision) {
    throw new InstagramReelProofClaimError(
      'The Reel proof receipt changed before the provider result could be saved.',
      current?.record,
    );
  }
  const saved = await saveAdminWorkspaceRecord({
    kind: 'autopilot-publication',
    key: workspaceKey(input.idempotencyKey),
    value: input.record,
    expectedRevision: current.revision,
    user: input.user,
  });
  return saved.value;
}

export async function markInstagramReelProcessing(input: {
  idempotencyKey: string;
  expectedRevision: number;
  containerId: string;
  providerStatus?: string;
  user: AdminUser;
  now?: Date;
}): Promise<InstagramReelProofRecord> {
  const current = await getInstagramReelProof(input.idempotencyKey);
  if (!current || current.revision !== input.expectedRevision) {
    throw new InstagramReelProofClaimError(
      'The Reel claim changed before its container receipt could be saved.',
      current?.record,
    );
  }
  return replaceInstagramReelProof({
    idempotencyKey: input.idempotencyKey,
    expectedRevision: current.revision,
    user: input.user,
    record: {
      ...current.record,
      status: 'processing',
      containerId: input.containerId,
      providerStatus: input.providerStatus ?? 'IN_PROGRESS',
      safeToRetry: false,
      lastError: undefined,
      updatedAt: (input.now ?? new Date()).toISOString(),
    },
  });
}

export async function syncInstagramReelProof(input: {
  idempotencyKey: string;
  expectedRevision: number;
  status: Exclude<InstagramReelProofStatus, 'claimed' | 'published'>;
  providerStatus?: string;
  warning?: string;
  lastError?: string;
  safeToRetry?: boolean;
  user: AdminUser;
  now?: Date;
}): Promise<InstagramReelProofRecord> {
  const current = await getInstagramReelProof(input.idempotencyKey);
  if (!current || current.revision !== input.expectedRevision) {
    throw new InstagramReelProofClaimError(
      'The Reel proof receipt changed before its status could be saved.',
      current?.record,
    );
  }
  return replaceInstagramReelProof({
    idempotencyKey: input.idempotencyKey,
    expectedRevision: current.revision,
    user: input.user,
    record: {
      ...current.record,
      status: input.status,
      providerStatus: input.providerStatus,
      warning: input.warning,
      lastError: input.lastError?.slice(0, 1000),
      safeToRetry: input.safeToRetry,
      updatedAt: (input.now ?? new Date()).toISOString(),
    },
  });
}

export async function completeInstagramReelProof(input: {
  idempotencyKey: string;
  expectedRevision: number;
  publication: {
    providerPublicationId: string;
    permalink?: string;
    providerTimestamp?: string;
    warning?: string;
  };
  user: AdminUser;
  now?: Date;
}): Promise<InstagramReelProofRecord> {
  const current = await getInstagramReelProof(input.idempotencyKey);
  if (!current || current.revision !== input.expectedRevision) {
    throw new InstagramReelProofClaimError(
      'The Reel proof receipt changed before its live publication could be saved.',
      current?.record,
    );
  }
  return replaceInstagramReelProof({
    idempotencyKey: input.idempotencyKey,
    expectedRevision: current.revision,
    user: input.user,
    record: {
      ...current.record,
      status: 'published',
      providerStatus: 'PUBLISHED',
      providerPublicationId: input.publication.providerPublicationId,
      externalUrl: input.publication.permalink,
      providerTimestamp: input.publication.providerTimestamp,
      warning: input.publication.warning,
      lastError: undefined,
      safeToRetry: false,
      updatedAt: (input.now ?? new Date()).toISOString(),
    },
  });
}

export async function failInstagramReelProof(input: {
  idempotencyKey: string;
  expectedRevision: number;
  error: string;
  safeToRetry: boolean;
  uncertain: boolean;
  user: AdminUser;
  now?: Date;
}): Promise<InstagramReelProofRecord | null> {
  const current = await getInstagramReelProof(input.idempotencyKey);
  if (!current || current.revision !== input.expectedRevision) return null;
  return replaceInstagramReelProof({
    idempotencyKey: input.idempotencyKey,
    expectedRevision: current.revision,
    user: input.user,
    record: {
      ...current.record,
      status: input.uncertain ? 'needs-review' : 'failed',
      lastError: input.error.slice(0, 1000),
      safeToRetry: input.safeToRetry,
      updatedAt: (input.now ?? new Date()).toISOString(),
    },
  });
}
