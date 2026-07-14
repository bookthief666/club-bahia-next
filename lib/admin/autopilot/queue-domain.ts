import {
  approvePublishingJob,
  buildPublishingIdempotencyKey,
  stablePublishingVersion,
  type PublishingApprovalMode,
  type PublishingJob,
  type PublishingJobStatus,
  type SocialProvider,
} from '@/lib/admin/autopilot/domain';

export type QueueMediaKind = 'image' | 'video';
export type QueueExecutionSupport =
  | 'automatic'
  | 'connection-required'
  | 'provider-proof-required';

export interface PublishingQueuePayload {
  caption: string;
  mediaUrl: string;
  mediaKind: QueueMediaKind;
  reservationUrl?: string;
  altText?: string;
  privacyLevel?: string;
}

export interface PublishingQueueLease {
  workerId: string;
  claimedAt: string;
  expiresAt: string;
}

export interface PublishingQueueJob extends PublishingJob {
  eventTitle: string;
  label: string;
  payload: PublishingQueuePayload;
  executionSupport: QueueExecutionSupport;
  maxAttempts: number;
  nextAttemptAt?: string;
  lastAttemptAt?: string;
  lease?: PublishingQueueLease;
  permanentFailure?: boolean;
}

export interface PublishingQueueState {
  schemaVersion: 1;
  jobs: PublishingQueueJob[];
  updatedAt: string;
}

export interface PublishingQueueTodaySummary {
  publishingToday: PublishingQueueJob[];
  needsApproval: PublishingQueueJob[];
  problems: PublishingQueueJob[];
  upcoming: PublishingQueueJob[];
}

export interface CreateQueueJobInput {
  id: string;
  eventId: string;
  eventTitle: string;
  contentItemId: string;
  label: string;
  provider: SocialProvider;
  channel: string;
  scheduledFor?: string;
  approvalMode?: PublishingApprovalMode;
  payload: PublishingQueuePayload;
  executionSupport: QueueExecutionSupport;
  maxAttempts?: number;
}

function validDate(value: string | undefined): boolean {
  return Boolean(value && !Number.isNaN(new Date(value).getTime()));
}

function approvalStillMatches(job: PublishingQueueJob): boolean {
  return (
    job.approvedContentVersion === job.contentVersion &&
    job.approvedMediaVersion === job.mediaVersion
  );
}

function isLeaseActive(job: PublishingQueueJob, now: Date): boolean {
  if (!job.lease) return false;
  const expires = new Date(job.lease.expiresAt);
  return !Number.isNaN(expires.getTime()) && expires.getTime() > now.getTime();
}

export function emptyPublishingQueue(now = new Date()): PublishingQueueState {
  return { schemaVersion: 1, jobs: [], updatedAt: now.toISOString() };
}

export function createQueueJob(
  input: CreateQueueJobInput,
  now = new Date(),
): PublishingQueueJob {
  const caption = input.payload.caption.trim();
  const mediaUrl = input.payload.mediaUrl.trim();
  if (!caption) throw new Error('Scheduled publishing requires approved copy.');
  if (!mediaUrl) throw new Error('Scheduled publishing requires approved media.');
  if (input.scheduledFor && !validDate(input.scheduledFor)) {
    throw new Error('Scheduled publishing time is invalid.');
  }

  const contentVersion = stablePublishingVersion(caption);
  const mediaVersion = stablePublishingVersion(mediaUrl);
  const timestamp = now.toISOString();
  return {
    id: input.id,
    eventId: input.eventId,
    eventTitle: input.eventTitle.trim() || 'Club Bahia event',
    contentItemId: input.contentItemId,
    label: input.label.trim() || input.channel,
    provider: input.provider,
    channel: input.channel,
    scheduledFor: input.scheduledFor,
    status: 'needs-approval',
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
    attemptCount: 0,
    payload: {
      caption,
      mediaUrl,
      mediaKind: input.payload.mediaKind,
      reservationUrl: input.payload.reservationUrl?.trim() || undefined,
      altText: input.payload.altText?.trim() || undefined,
      privacyLevel: input.payload.privacyLevel?.trim() || undefined,
    },
    executionSupport: input.executionSupport,
    maxAttempts: Math.max(1, Math.min(input.maxAttempts ?? 4, 8)),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function upsertQueueJob(
  queue: PublishingQueueState,
  incoming: PublishingQueueJob,
  now = new Date(),
): PublishingQueueState {
  const existing = queue.jobs.find((job) => job.id === incoming.id);
  if (existing?.status === 'published') {
    throw new Error(
      'A published job cannot be replaced. Create a new content version instead.',
    );
  }

  let next = incoming;
  if (
    existing &&
    existing.contentVersion === incoming.contentVersion &&
    existing.mediaVersion === incoming.mediaVersion &&
    existing.scheduledFor === incoming.scheduledFor
  ) {
    next = {
      ...incoming,
      status: existing.status,
      approvedContentVersion: existing.approvedContentVersion,
      approvedMediaVersion: existing.approvedMediaVersion,
      approvedAt: existing.approvedAt,
      attemptCount: existing.attemptCount,
      nextAttemptAt: existing.nextAttemptAt,
      lastAttemptAt: existing.lastAttemptAt,
      lease: existing.lease,
      providerPublicationId: existing.providerPublicationId,
      externalUrl: existing.externalUrl,
      lastError: existing.lastError,
      createdAt: existing.createdAt,
    };
  }

  return {
    schemaVersion: 1,
    jobs: [...queue.jobs.filter((job) => job.id !== incoming.id), next].sort(
      (left, right) =>
        (left.scheduledFor ?? '9999').localeCompare(
          right.scheduledFor ?? '9999',
        ),
    ),
    updatedAt: now.toISOString(),
  };
}

export function approveQueueJob(
  queue: PublishingQueueState,
  jobId: string,
  now = new Date(),
): PublishingQueueState {
  let found = false;
  const jobs = queue.jobs.map((job) => {
    if (job.id !== jobId) return job;
    found = true;
    if (job.executionSupport === 'connection-required') {
      throw new Error('Connect the publishing account before approving this job.');
    }
    const approved = approvePublishingJob(job, now) as PublishingQueueJob;
    return {
      ...approved,
      status:
        job.executionSupport === 'provider-proof-required'
          ? 'paused'
          : approved.status,
      lastError:
        job.executionSupport === 'provider-proof-required'
          ? 'Complete the controlled provider proof before unattended publishing is enabled.'
          : undefined,
    };
  });
  if (!found) throw new Error('Publishing queue job not found.');
  return { schemaVersion: 1, jobs, updatedAt: now.toISOString() };
}

export function cancelQueueJob(
  queue: PublishingQueueState,
  jobId: string,
  now = new Date(),
): PublishingQueueState {
  let found = false;
  const jobs = queue.jobs.map((job) => {
    if (job.id !== jobId) return job;
    found = true;
    if (job.status === 'published') {
      throw new Error('A published job cannot be cancelled.');
    }
    return {
      ...job,
      status: 'cancelled' as PublishingJobStatus,
      lease: undefined,
      updatedAt: now.toISOString(),
    };
  });
  if (!found) throw new Error('Publishing queue job not found.');
  return { schemaVersion: 1, jobs, updatedAt: now.toISOString() };
}

export function claimNextDueQueueJob(input: {
  queue: PublishingQueueState;
  workerId: string;
  now?: Date;
  leaseSeconds?: number;
}): { queue: PublishingQueueState; job?: PublishingQueueJob } {
  const now = input.now ?? new Date();
  const leaseSeconds = Math.max(30, Math.min(input.leaseSeconds ?? 180, 900));
  const due = input.queue.jobs.find((job) => {
    if (!['approved', 'scheduled', 'retrying'].includes(job.status)) return false;
    if (job.executionSupport !== 'automatic') return false;
    if (!approvalStillMatches(job) || isLeaseActive(job, now)) return false;
    const dueAt = job.nextAttemptAt ?? job.scheduledFor;
    return (
      !dueAt ||
      (validDate(dueAt) && new Date(dueAt).getTime() <= now.getTime())
    );
  });
  if (!due) return { queue: input.queue };

  const lease: PublishingQueueLease = {
    workerId: input.workerId,
    claimedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + leaseSeconds * 1000).toISOString(),
  };
  const claimed: PublishingQueueJob = {
    ...due,
    status: 'publishing',
    attemptCount: due.attemptCount + 1,
    lastAttemptAt: now.toISOString(),
    lease,
    lastError: undefined,
    updatedAt: now.toISOString(),
  };
  return {
    queue: {
      schemaVersion: 1,
      jobs: input.queue.jobs.map((job) =>
        job.id === due.id ? claimed : job,
      ),
      updatedAt: now.toISOString(),
    },
    job: claimed,
  };
}

export function completeQueueJob(input: {
  queue: PublishingQueueState;
  jobId: string;
  providerPublicationId: string;
  externalUrl?: string;
  now?: Date;
}): PublishingQueueState {
  const now = input.now ?? new Date();
  return {
    schemaVersion: 1,
    jobs: input.queue.jobs.map((job) =>
      job.id === input.jobId
        ? {
            ...job,
            status: 'published',
            providerPublicationId: input.providerPublicationId,
            externalUrl: input.externalUrl,
            lease: undefined,
            nextAttemptAt: undefined,
            lastError: undefined,
            updatedAt: now.toISOString(),
          }
        : job,
    ),
    updatedAt: now.toISOString(),
  };
}

export function failQueueJob(input: {
  queue: PublishingQueueState;
  jobId: string;
  error: string;
  retryable: boolean;
  manualReviewRequired?: boolean;
  now?: Date;
}): PublishingQueueState {
  const now = input.now ?? new Date();
  return {
    schemaVersion: 1,
    jobs: input.queue.jobs.map((job) => {
      if (job.id !== input.jobId) return job;
      const exhausted = job.attemptCount >= job.maxAttempts;
      const retry =
        input.retryable && !exhausted && !input.manualReviewRequired;
      const delayMinutes = Math.min(
        5 * 2 ** Math.max(0, job.attemptCount - 1),
        120,
      );
      return {
        ...job,
        status: retry ? ('retrying' as const) : ('failed' as const),
        nextAttemptAt: retry
          ? new Date(now.getTime() + delayMinutes * 60_000).toISOString()
          : undefined,
        lease: undefined,
        permanentFailure: !retry,
        lastError: input.manualReviewRequired
          ? `Manual review required: ${input.error}`
          : input.error,
        updatedAt: now.toISOString(),
      };
    }),
    updatedAt: now.toISOString(),
  };
}

function localDateKey(
  value: string | undefined,
  timeZone: string,
): string | undefined {
  if (!value || !validDate(value)) return undefined;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value));
}

export function summarizePublishingQueueToday(
  queue: PublishingQueueState,
  now = new Date(),
  timeZone = 'America/Los_Angeles',
): PublishingQueueTodaySummary {
  const today = localDateKey(now.toISOString(), timeZone);
  const active = queue.jobs.filter(
    (job) => !['cancelled', 'published'].includes(job.status),
  );
  return {
    publishingToday: active.filter(
      (job) =>
        localDateKey(job.nextAttemptAt ?? job.scheduledFor, timeZone) === today &&
        ['approved', 'scheduled', 'retrying', 'publishing', 'processing'].includes(
          job.status,
        ),
    ),
    needsApproval: active.filter((job) => job.status === 'needs-approval'),
    problems: active.filter((job) =>
      ['failed', 'paused', 'needs-media'].includes(job.status),
    ),
    upcoming: active.filter((job) => {
      const key = localDateKey(job.scheduledFor, timeZone);
      return Boolean(
        key &&
          today &&
          key > today &&
          ['scheduled', 'approved'].includes(job.status),
      );
    }),
  };
}
