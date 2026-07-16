import 'server-only';

import { isIP } from 'node:net';
import type { AdminUser } from '@/lib/admin/domain';
import { buildTrackedCampaignUrl } from '@/lib/admin/autopilot/domain';
import type { PublishingQueueJob } from '@/lib/admin/autopilot/queue-domain';
import {
  claimControlledPublication,
  completeControlledPublication,
  failControlledPublication,
  PublicationClaimError,
} from '@/lib/admin/autopilot/server/publication-store';
import {
  MetaPublishingError,
  publishInstagramImage,
} from '@/lib/admin/autopilot/server/meta';

export class QueueExecutionError extends Error {
  constructor(
    message: string,
    readonly retryable: boolean,
    readonly manualReviewRequired = false,
  ) {
    super(message);
    this.name = 'QueueExecutionError';
  }
}

export interface QueueExecutionResult {
  providerPublicationId: string;
  externalUrl?: string;
  processing?: boolean;
}

function configuredMediaHosts(): Set<string> {
  const hosts = new Set<string>();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (siteUrl) {
    try {
      hosts.add(new URL(siteUrl).hostname.toLowerCase());
    } catch {
      // Invalid deployment configuration is surfaced by provider readiness.
    }
  }
  for (const value of (process.env.META_ALLOWED_MEDIA_HOSTS ?? '').split(',')) {
    const host = value.trim().toLowerCase();
    if (host) hosts.add(host);
  }
  return hosts;
}

function privateAddress(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  if (normalized === 'localhost' || normalized.endsWith('.localhost')) return true;
  const family = isIP(normalized);
  if (!family) return false;
  if (family === 6) {
    return (
      normalized === '::1' ||
      normalized.startsWith('fc') ||
      normalized.startsWith('fd') ||
      normalized.startsWith('fe80')
    );
  }
  const parts = normalized.split('.').map(Number);
  return (
    parts[0] === 10 ||
    parts[0] === 127 ||
    (parts[0] === 169 && parts[1] === 254) ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168)
  );
}

function assertApprovedInstagramImage(job: PublishingQueueJob): void {
  const parsed = new URL(job.payload.mediaUrl);
  const host = parsed.hostname.toLowerCase();
  const blobHost = host.endsWith('.public.blob.vercel-storage.com');
  if (
    job.payload.mediaKind !== 'image' ||
    parsed.protocol !== 'https:' ||
    privateAddress(host) ||
    (!blobHost && !configuredMediaHosts().has(host))
  ) {
    throw new QueueExecutionError(
      'Instagram queue media must be an approved public image hosted by Club Bahia or Vercel Blob.',
      false,
    );
  }
}

function prepareInstagramCaption(job: PublishingQueueJob): string {
  const baseUrl = job.payload.reservationUrl?.trim();
  if (!baseUrl || !job.payload.caption.includes(baseUrl)) {
    return job.payload.caption;
  }
  const tracked = buildTrackedCampaignUrl(baseUrl, {
    source: 'instagram',
    medium: 'feed',
    campaign: job.eventId,
    content: job.contentItemId,
  });
  const caption = job.payload.caption.replaceAll(baseUrl, tracked);
  if (caption.length > 2200) {
    throw new QueueExecutionError(
      'Instagram caption exceeds 2,200 characters after its tracking link is applied.',
      false,
    );
  }
  return caption;
}

async function executeInstagramFeed(
  job: PublishingQueueJob,
  user: AdminUser,
): Promise<QueueExecutionResult> {
  assertApprovedInstagramImage(job);
  const caption = prepareInstagramCaption(job);
  let claim;
  try {
    claim = await claimControlledPublication({
      idempotencyKey: job.idempotencyKey,
      eventId: job.eventId,
      contentItemId: job.contentItemId,
      caption,
      provider: 'meta',
      channel: 'instagram-feed',
      mediaUrl: job.payload.mediaUrl,
      user,
    });
  } catch (error) {
    if (error instanceof PublicationClaimError && error.record?.status === 'published') {
      return {
        providerPublicationId: error.record.providerPublicationId ?? job.id,
        externalUrl: error.record.externalUrl,
      };
    }
    throw new QueueExecutionError(
      error instanceof Error ? error.message : 'Could not claim the Instagram post.',
      false,
      true,
    );
  }

  if (claim.alreadyPublished) {
    return {
      providerPublicationId:
        claim.record.providerPublicationId ?? job.providerPublicationId ?? job.id,
      externalUrl: claim.record.externalUrl,
    };
  }

  try {
    const publication = await publishInstagramImage({
      imageUrl: job.payload.mediaUrl,
      caption,
    });
    const receipt = await completeControlledPublication({
      idempotencyKey: job.idempotencyKey,
      expectedRevision: claim.revision,
      publication,
      user,
    });
    return {
      providerPublicationId:
        receipt.providerPublicationId ?? publication.providerPublicationId,
      externalUrl: receipt.externalUrl ?? publication.permalink,
    };
  } catch (error) {
    const provider = error instanceof MetaPublishingError ? error : undefined;
    const retryable = provider?.stage === 'create-container';
    const uncertain = provider?.stage === 'publish-container' || !provider;
    const message =
      error instanceof Error ? error.message : 'Instagram publication failed.';
    await failControlledPublication({
      idempotencyKey: job.idempotencyKey,
      expectedRevision: claim.revision,
      error: message,
      safeToRetry: retryable,
      uncertain,
      user,
    }).catch(() => null);
    throw new QueueExecutionError(message, retryable, uncertain);
  }
}

export async function executePublishingQueueJob(
  job: PublishingQueueJob,
  user: AdminUser,
): Promise<QueueExecutionResult> {
  if (job.provider === 'meta' && job.channel === 'instagram-feed') {
    return executeInstagramFeed(job, user);
  }
  throw new QueueExecutionError(
    `${job.label} is in the shared queue, but unattended provider execution is not enabled for this format yet.`,
    false,
    true,
  );
}
