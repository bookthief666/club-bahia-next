import 'server-only';

import type { AdminUser } from '@/lib/admin/domain';
import {
  approveQueueJob,
  cancelQueueJob,
  claimNextDueQueueJob,
  completeQueueJob,
  createQueueJob,
  emptyPublishingQueue,
  failQueueJob,
  upsertQueueJob,
  type CreateQueueJobInput,
  type PublishingQueueJob,
  type PublishingQueueState,
} from '@/lib/admin/autopilot/queue-domain';
import { AdminWorkspaceConflictError } from '@/lib/admin/workspaces/domain';
import {
  getAdminWorkspaceRecord,
  saveAdminWorkspaceRecord,
} from '@/lib/admin/workspaces/server';

const QUEUE_KEY = 'primary';
const MAX_MUTATION_ATTEMPTS = 5;

function normalizeQueue(value: unknown): PublishingQueueState {
  if (!value || typeof value !== 'object') return emptyPublishingQueue();
  const candidate = value as Partial<PublishingQueueState>;
  return {
    schemaVersion: 1,
    jobs: Array.isArray(candidate.jobs)
      ? candidate.jobs.filter(
          (job): job is PublishingQueueJob =>
            Boolean(job) &&
            typeof job === 'object' &&
            typeof (job as PublishingQueueJob).id === 'string' &&
            typeof (job as PublishingQueueJob).eventId === 'string' &&
            typeof (job as PublishingQueueJob).status === 'string',
        )
      : [],
    updatedAt:
      typeof candidate.updatedAt === 'string'
        ? candidate.updatedAt
        : new Date().toISOString(),
  };
}

export async function getPublishingQueue(): Promise<{
  queue: PublishingQueueState;
  revision: number;
}> {
  const record = await getAdminWorkspaceRecord<PublishingQueueState>(
    'autopilot-queue',
    QUEUE_KEY,
  );
  return {
    queue: normalizeQueue(record?.value),
    revision: record?.revision ?? 0,
  };
}

async function mutateQueue<T>(input: {
  user: AdminUser;
  mutate: (queue: PublishingQueueState) => {
    queue: PublishingQueueState;
    result: T;
    changed?: boolean;
  };
}): Promise<{ queue: PublishingQueueState; result: T }> {
  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_MUTATION_ATTEMPTS; attempt += 1) {
    const current = await getPublishingQueue();
    const mutation = input.mutate(current.queue);
    if (mutation.changed === false) {
      return { queue: current.queue, result: mutation.result };
    }
    try {
      const saved = await saveAdminWorkspaceRecord({
        kind: 'autopilot-queue',
        key: QUEUE_KEY,
        value: mutation.queue,
        expectedRevision: current.revision,
        user: input.user,
      });
      return { queue: saved.value, result: mutation.result };
    } catch (error) {
      lastError = error;
      if (!(error instanceof AdminWorkspaceConflictError)) throw error;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error('The publishing queue changed repeatedly. Try again.');
}

export async function upsertPublishingQueueJob(input: {
  job: CreateQueueJobInput;
  user: AdminUser;
}): Promise<PublishingQueueJob> {
  const incoming = createQueueJob(input.job);
  const saved = await mutateQueue({
    user: input.user,
    mutate: (queue) => {
      const next = upsertQueueJob(queue, incoming);
      return {
        queue: next,
        result: next.jobs.find((job) => job.id === incoming.id) ?? incoming,
      };
    },
  });
  return saved.result;
}

export async function upsertPublishingQueueCampaign(input: {
  eventId: string;
  jobs: CreateQueueJobInput[];
  user: AdminUser;
}): Promise<PublishingQueueJob[]> {
  if (!input.jobs.length) throw new Error('The campaign does not contain any posts.');
  if (input.jobs.some((job) => job.eventId !== input.eventId)) {
    throw new Error('Every campaign post must belong to the same event.');
  }
  const incoming = input.jobs.map((job) => createQueueJob(job));
  const ids = new Set(incoming.map((job) => job.id));
  if (ids.size !== incoming.length) {
    throw new Error('Campaign posts must have unique queue identities.');
  }

  const saved = await mutateQueue({
    user: input.user,
    mutate: (queue) => {
      let next = queue;
      for (const job of incoming) next = upsertQueueJob(next, job);
      return {
        queue: next,
        result: next.jobs.filter((job) => ids.has(job.id)),
      };
    },
  });
  return saved.result;
}

export async function approvePublishingQueueJob(input: {
  jobId: string;
  user: AdminUser;
}): Promise<PublishingQueueJob> {
  const saved = await mutateQueue({
    user: input.user,
    mutate: (queue) => {
      const next = approveQueueJob(queue, input.jobId);
      const job = next.jobs.find((entry) => entry.id === input.jobId);
      if (!job) throw new Error('Publishing queue job not found.');
      return { queue: next, result: job };
    },
  });
  return saved.result;
}

export interface CampaignApprovalResult {
  jobs: PublishingQueueJob[];
  blocked: Array<{ jobId: string; reason: string }>;
}

export async function approvePublishingQueueCampaign(input: {
  eventId: string;
  jobIds: string[];
  user: AdminUser;
}): Promise<CampaignApprovalResult> {
  const ids = new Set(input.jobIds);
  const saved = await mutateQueue({
    user: input.user,
    mutate: (queue) => {
      let next = queue;
      const blocked: CampaignApprovalResult['blocked'] = [];

      for (const jobId of ids) {
        const current = next.jobs.find((job) => job.id === jobId);
        if (!current || current.eventId !== input.eventId) {
          throw new Error('A campaign queue job could not be found for this event.');
        }
        if (current.status === 'published') continue;
        if (current.status === 'cancelled') {
          blocked.push({ jobId, reason: 'Cancelled posts cannot be approved.' });
          continue;
        }
        if (current.executionSupport === 'connection-required') {
          blocked.push({
            jobId,
            reason: 'Connect the publishing account before approving this post.',
          });
          continue;
        }
        next = approveQueueJob(next, jobId);
      }

      return {
        queue: next,
        result: {
          jobs: next.jobs.filter((job) => ids.has(job.id)),
          blocked,
        },
      };
    },
  });
  return saved.result;
}

export async function cancelPublishingQueueJob(input: {
  jobId: string;
  user: AdminUser;
}): Promise<PublishingQueueJob> {
  const saved = await mutateQueue({
    user: input.user,
    mutate: (queue) => {
      const next = cancelQueueJob(queue, input.jobId);
      const job = next.jobs.find((entry) => entry.id === input.jobId);
      if (!job) throw new Error('Publishing queue job not found.');
      return { queue: next, result: job };
    },
  });
  return saved.result;
}

export async function claimDuePublishingQueueJob(input: {
  workerId: string;
  user: AdminUser;
  now?: Date;
}): Promise<PublishingQueueJob | undefined> {
  const saved = await mutateQueue({
    user: input.user,
    mutate: (queue) => {
      const claimed = claimNextDueQueueJob({
        queue,
        workerId: input.workerId,
        now: input.now,
      });
      return {
        queue: claimed.queue,
        result: claimed.job,
        changed: Boolean(claimed.job),
      };
    },
  });
  return saved.result;
}

export async function completePublishingQueueJob(input: {
  jobId: string;
  providerPublicationId: string;
  externalUrl?: string;
  user: AdminUser;
}): Promise<PublishingQueueJob> {
  const saved = await mutateQueue({
    user: input.user,
    mutate: (queue) => {
      const next = completeQueueJob({
        queue,
        jobId: input.jobId,
        providerPublicationId: input.providerPublicationId,
        externalUrl: input.externalUrl,
      });
      const job = next.jobs.find((entry) => entry.id === input.jobId);
      if (!job) throw new Error('Publishing queue job not found.');
      return { queue: next, result: job };
    },
  });
  return saved.result;
}

export async function failPublishingQueueJob(input: {
  jobId: string;
  error: string;
  retryable: boolean;
  manualReviewRequired?: boolean;
  user: AdminUser;
}): Promise<PublishingQueueJob> {
  const saved = await mutateQueue({
    user: input.user,
    mutate: (queue) => {
      const next = failQueueJob({
        queue,
        jobId: input.jobId,
        error: input.error,
        retryable: input.retryable,
        manualReviewRequired: input.manualReviewRequired,
      });
      const job = next.jobs.find((entry) => entry.id === input.jobId);
      if (!job) throw new Error('Publishing queue job not found.');
      return { queue: next, result: job };
    },
  });
  return saved.result;
}
