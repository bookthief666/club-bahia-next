export type SocialProvider = 'meta' | 'tiktok' | 'google-business';

export type SocialConnectionStatus =
  | 'setup-required'
  | 'ready-for-connection'
  | 'connected'
  | 'needs-attention';

export type PublishingApprovalMode =
  | 'prepare-only'
  | 'approve-each'
  | 'approve-campaign';

export type PublishingJobStatus =
  | 'draft'
  | 'needs-media'
  | 'needs-approval'
  | 'approved'
  | 'scheduled'
  | 'publishing'
  | 'processing'
  | 'published'
  | 'retrying'
  | 'failed'
  | 'paused'
  | 'cancelled';

export interface ProviderCapability {
  id: string;
  label: string;
  available: boolean;
  reason?: string;
}

export interface SocialAccountReadiness {
  provider: SocialProvider;
  label: string;
  status: SocialConnectionStatus;
  summary: string;
  checks: Array<{
    id: string;
    label: string;
    complete: boolean;
    detail: string;
  }>;
  capabilities: ProviderCapability[];
}

export interface PromotionAutopilotReadiness {
  accounts: SocialAccountReadiness[];
  scheduler: {
    databaseConfigured: boolean;
    cronSecretConfigured: boolean;
    ready: boolean;
    summary: string;
  };
}

export interface PublishingJob {
  id: string;
  eventId: string;
  contentItemId: string;
  provider: SocialProvider;
  channel: string;
  scheduledFor?: string;
  status: PublishingJobStatus;
  approvalMode: PublishingApprovalMode;
  contentVersion: number;
  mediaVersion: number;
  approvedContentVersion?: number;
  approvedMediaVersion?: number;
  approvedAt?: string;
  idempotencyKey: string;
  trackedUrl?: string;
  attemptCount: number;
  providerPublicationId?: string;
  externalUrl?: string;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublishingJobInput {
  id: string;
  eventId: string;
  contentItemId: string;
  provider: SocialProvider;
  channel: string;
  scheduledFor?: string;
  approvalMode?: PublishingApprovalMode;
  contentVersion?: number;
  mediaVersion?: number;
  hasMedia: boolean;
  reservationUrl?: string;
  campaignSlug: string;
}

function safeToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'unknown';
}

export function stablePublishingVersion(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0 || 1;
}

export function buildPublishingIdempotencyKey(input: {
  eventId: string;
  provider: SocialProvider;
  contentItemId: string;
  contentVersion: number;
  mediaVersion: number;
  scheduledFor?: string;
}): string {
  return [
    safeToken(input.eventId),
    input.provider,
    safeToken(input.contentItemId),
    `c${input.contentVersion}`,
    `m${input.mediaVersion}`,
    safeToken(input.scheduledFor ?? 'publish-now'),
  ].join(':');
}

export function buildTrackedCampaignUrl(
  baseUrl: string,
  input: {
    source: string;
    medium: string;
    campaign: string;
    content: string;
  },
): string {
  const url = new URL(baseUrl);
  url.searchParams.set('utm_source', safeToken(input.source));
  url.searchParams.set('utm_medium', safeToken(input.medium));
  url.searchParams.set('utm_campaign', safeToken(input.campaign));
  url.searchParams.set('utm_content', safeToken(input.content));
  return url.toString();
}

export function createPublishingJob(
  input: PublishingJobInput,
  now = new Date(),
): PublishingJob {
  const contentVersion = input.contentVersion ?? 1;
  const mediaVersion = input.mediaVersion ?? 1;
  const createdAt = now.toISOString();
  const status: PublishingJobStatus = input.hasMedia
    ? 'needs-approval'
    : 'needs-media';
  const trackedUrl = input.reservationUrl
    ? buildTrackedCampaignUrl(input.reservationUrl, {
        source: input.provider,
        medium: input.channel,
        campaign: input.campaignSlug,
        content: `${input.contentItemId}-v${contentVersion}`,
      })
    : undefined;

  return {
    id: input.id,
    eventId: input.eventId,
    contentItemId: input.contentItemId,
    provider: input.provider,
    channel: input.channel,
    scheduledFor: input.scheduledFor,
    status,
    approvalMode: input.approvalMode ?? 'approve-each',
    contentVersion,
    mediaVersion,
    idempotencyKey: buildPublishingIdempotencyKey({
      eventId: input.eventId,
      provider: input.provider,
      contentItemId: input.contentItemId,
      contentVersion,
      mediaVersion,
      scheduledFor: input.scheduledFor,
    }),
    trackedUrl,
    attemptCount: 0,
    createdAt,
    updatedAt: createdAt,
  };
}

export function approvePublishingJob(
  job: PublishingJob,
  now = new Date(),
): PublishingJob {
  if (job.status === 'needs-media') {
    throw new Error('Add approved media before approving this post.');
  }
  if (job.status === 'published' || job.status === 'cancelled') {
    throw new Error(`Cannot approve a ${job.status} publishing job.`);
  }

  return {
    ...job,
    status: job.scheduledFor ? 'scheduled' : 'approved',
    approvedContentVersion: job.contentVersion,
    approvedMediaVersion: job.mediaVersion,
    approvedAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

export function invalidatePublishingApproval(
  job: PublishingJob,
  change: 'content' | 'media',
  now = new Date(),
): PublishingJob {
  const contentVersion =
    change === 'content' ? job.contentVersion + 1 : job.contentVersion;
  const mediaVersion =
    change === 'media' ? job.mediaVersion + 1 : job.mediaVersion;

  return {
    ...job,
    status: change === 'media' ? 'needs-media' : 'needs-approval',
    contentVersion,
    mediaVersion,
    approvedContentVersion: undefined,
    approvedMediaVersion: undefined,
    approvedAt: undefined,
    providerPublicationId: undefined,
    externalUrl: undefined,
    lastError: undefined,
    idempotencyKey: buildPublishingIdempotencyKey({
      eventId: job.eventId,
      provider: job.provider,
      contentItemId: job.contentItemId,
      contentVersion,
      mediaVersion,
      scheduledFor: job.scheduledFor,
    }),
    updatedAt: now.toISOString(),
  };
}

export function isPublishingJobDue(
  job: PublishingJob,
  now = new Date(),
): boolean {
  if (!['approved', 'scheduled', 'retrying'].includes(job.status)) return false;
  if (
    job.approvedContentVersion !== job.contentVersion ||
    job.approvedMediaVersion !== job.mediaVersion
  ) {
    return false;
  }
  if (!job.scheduledFor) return job.status === 'approved';
  const scheduled = new Date(job.scheduledFor);
  return !Number.isNaN(scheduled.getTime()) && scheduled.getTime() <= now.getTime();
}
