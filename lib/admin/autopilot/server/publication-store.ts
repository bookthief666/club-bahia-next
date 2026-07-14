import 'server-only';

import { createHash } from 'node:crypto';
import type { AdminUser } from '@/lib/admin/domain';
import {
  getAdminWorkspaceRecord,
  saveAdminWorkspaceRecord,
} from '@/lib/admin/workspaces/server';

export type ControlledPublicationStatus =
  | 'claimed'
  | 'processing'
  | 'published'
  | 'failed'
  | 'needs-review';

export type ControlledPublicationProvider = 'meta' | 'tiktok';
export type ControlledPublicationChannel = 'instagram-feed' | 'tiktok-video';

export interface ControlledProviderPublication {
  providerPublicationId: string;
  permalink?: string;
  providerTimestamp?: string;
  providerStatus?: string;
  warning?: string;
}

export interface ControlledPublicationRecord {
  schemaVersion: 1;
  idempotencyKey: string;
  eventId: string;
  contentItemId: string;
  provider: ControlledPublicationProvider;
  channel: ControlledPublicationChannel;
  captionHash: string;
  mediaUrl: string;
  imageUrl?: string;
  status: ControlledPublicationStatus;
  attemptCount: number;
  claimedAt: string;
  updatedAt: string;
  providerPublicationId?: string;
  providerStatus?: string;
  externalUrl?: string;
  providerTimestamp?: string;
  privacyLevel?: string;
  downloadedBytes?: number;
  publicPostIds?: string[];
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

function providerLabel(provider: ControlledPublicationProvider): string {
  return provider === 'tiktok' ? 'TikTok' : 'Meta';
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
  provider?: ControlledPublicationProvider;
  channel?: ControlledPublicationChannel;
  mediaUrl?: string;
  imageUrl?: string;
  user: AdminUser;
  now?: Date;
}): Promise<{
  record: ControlledPublicationRecord;
  revision: number;
  alreadyPublished: boolean;
}> {
  const now = input.now ?? new Date();
  const current = await getControlledPublication(input.idempotencyKey);
  const provider = input.provider ?? 'meta';
  const channel = input.channel ?? 'instagram-feed';
  const mediaUrl = input.mediaUrl ?? input.imageUrl;
  if (!mediaUrl) throw new Error('Controlled publication media URL is required.');

  if (current?.record.status === 'published') {
    return {
      ...current,
      alreadyPublished: true,
    };
  }
  if (
    current?.record.status === 'claimed' ||
    current?.record.status === 'processing'
  ) {
    throw new PublicationClaimError(
      'This exact post already has an active publication attempt. Wait for it to finish before doing anything else.',
      current.record,
    );
  }
  if (current?.record.status === 'needs-review') {
    throw new PublicationClaimError(
      `The previous ${providerLabel(current.record.provider)} response was uncertain. Verify the connected account before attempting another publication.`,
      current.record,
    );
  }
  if (current?.record.status === 'failed' && !current.record.safeToRetry) {
    throw new PublicationClaimError(
      'The previous publication attempt cannot be retried safely without checking the connected account first.',
      current.record,
    );
  }

  const timestamp = now.toISOString();
  const record: ControlledPublicationRecord = {
    schemaVersion: 1,
    idempotencyKey: input.idempotencyKey,
    eventId: input.eventId,
    contentItemId: input.contentItemId,
    provider,
    channel,
    captionHash: publicationCaptionHash(input.caption),
    mediaUrl,
    imageUrl: provider === 'meta' ? mediaUrl : undefined,
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

async function replaceControlledPublication(input: {
  idempotencyKey: string;
  expectedRevision: number;
  record: ControlledPublicationRecord;
  user: AdminUser;
}): Promise<ControlledPublicationRecord> {
  const current = await getControlledPublication(input.idempotencyKey);
  if (!current || current.revision !== input.expectedRevision) {
    throw new PublicationClaimError(
      'The publication claim changed before its provider receipt could be saved.',
      current?.record,
    );
  }
  const saved = await saveAdminWorkspaceRecord({
    kind: 'autopilot-publication',
    key: publicationWorkspaceKey(input.idempotencyKey),
    value: input.record,
    expectedRevision: current.revision,
    user: input.user,
  });
  return saved.value;
}

export async function markControlledPublicationProcessing(input: {
  idempotencyKey: string;
  expectedRevision: number;
  providerPublicationId: string;
  providerStatus: string;
  privacyLevel?: string;
  user: AdminUser;
  now?: Date;
}): Promise<ControlledPublicationRecord> {
  const current = await getControlledPublication(input.idempotencyKey);
  if (!current || current.revision !== input.expectedRevision) {
    throw new PublicationClaimError(
      'The publication claim changed before its processing receipt could be saved.',
      current?.record,
    );
  }
  return replaceControlledPublication({
    idempotencyKey: input.idempotencyKey,
    expectedRevision: current.revision,
    user: input.user,
    record: {
      ...current.record,
      status: 'processing',
      providerPublicationId: input.providerPublicationId,
      providerStatus: input.providerStatus,
      privacyLevel: input.privacyLevel,
      safeToRetry: false,
      lastError: undefined,
      updatedAt: (input.now ?? new Date()).toISOString(),
    },
  });
}

export async function syncControlledPublicationStatus(input: {
  idempotencyKey: string;
  expectedRevision: number;
  status: ControlledPublicationStatus;
  providerStatus?: string;
  downloadedBytes?: number;
  publicPostIds?: string[];
  warning?: string;
  lastError?: string;
  safeToRetry?: boolean;
  user: AdminUser;
  now?: Date;
}): Promise<ControlledPublicationRecord> {
  const current = await getControlledPublication(input.idempotencyKey);
  if (!current || current.revision !== input.expectedRevision) {
    throw new PublicationClaimError(
      'The publication receipt changed before its provider status could be saved.',
      current?.record,
    );
  }
  return replaceControlledPublication({
    idempotencyKey: input.idempotencyKey,
    expectedRevision: current.revision,
    user: input.user,
    record: {
      ...current.record,
      status: input.status,
      providerStatus: input.providerStatus,
      downloadedBytes: input.downloadedBytes,
      publicPostIds: input.publicPostIds,
      warning: input.warning,
      lastError: input.lastError?.slice(0, 1000),
      safeToRetry: input.safeToRetry,
      updatedAt: (input.now ?? new Date()).toISOString(),
    },
  });
}

export async function completeControlledPublication(input: {
  idempotencyKey: string;
  expectedRevision: number;
  publication: ControlledProviderPublication;
  user: AdminUser;
  now?: Date;
}): Promise<ControlledPublicationRecord> {
  const current = await getControlledPublication(input.idempotencyKey);
  if (!current || current.revision !== input.expectedRevision) {
    throw new PublicationClaimError(
      'The publication claim changed before its provider receipt could be saved.',
      current?.record,
    );
  }

  return replaceControlledPublication({
    idempotencyKey: input.idempotencyKey,
    expectedRevision: current.revision,
    user: input.user,
    record: {
      ...current.record,
      status: 'published',
      providerPublicationId: input.publication.providerPublicationId,
      providerStatus: input.publication.providerStatus,
      externalUrl: input.publication.permalink,
      providerTimestamp: input.publication.providerTimestamp,
      warning: input.publication.warning,
      safeToRetry: false,
      lastError: undefined,
      updatedAt: (input.now ?? new Date()).toISOString(),
    },
  });
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

  return replaceControlledPublication({
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
