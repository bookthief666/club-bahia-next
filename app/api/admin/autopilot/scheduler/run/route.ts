import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import type { AdminUser } from '@/lib/admin/domain';
import {
  completePublishingQueueJob,
  claimDuePublishingQueueJob,
  failPublishingQueueJob,
} from '@/lib/admin/autopilot/server/queue-store';
import {
  executePublishingQueueJob,
  QueueExecutionError,
} from '@/lib/admin/autopilot/server/queue-executor';
import { syncQueuePublicationToExecution } from '@/lib/admin/autopilot/server/execution-sync';
import { getAdminUserFromRequest } from '@/lib/admin/auth/session';
import { isAdminWorkspaceStorageConfigured } from '@/lib/admin/workspaces/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' };
const MAX_JOBS_PER_RUN = 5;

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE_HEADERS });
}

function digest(value: string): Buffer {
  return createHash('sha256').update(value, 'utf8').digest();
}

function equal(left: string, right: string): boolean {
  return timingSafeEqual(digest(left), digest(right));
}

function schedulerUser(request: Request): AdminUser | null {
  const admin = getAdminUserFromRequest(request);
  if (admin && ['owner', 'manager'].includes(admin.role)) return admin;

  const configured = process.env.PUBLISHING_CRON_SECRET?.trim() ?? '';
  const header = request.headers.get('authorization') ?? '';
  const supplied = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (configured.length >= 32 && supplied && equal(configured, supplied)) {
    return {
      id: 'promotion-autopilot-scheduler',
      name: 'Promotion Autopilot',
      role: 'owner',
      avatarInitials: 'PA',
    };
  }
  return null;
}

export async function POST(request: Request) {
  const user = schedulerUser(request);
  if (!user) return json({ error: 'Scheduler authorization failed.' }, 401);
  if (!isAdminWorkspaceStorageConfigured()) {
    return json({ error: 'Publishing queue storage is not configured.' }, 503);
  }

  const workerId = `worker-${randomUUID()}`;
  const results: Array<{
    jobId: string;
    status: 'published' | 'retrying' | 'failed';
    externalUrl?: string;
    error?: string;
  }> = [];

  for (let index = 0; index < MAX_JOBS_PER_RUN; index += 1) {
    const job = await claimDuePublishingQueueJob({ workerId, user });
    if (!job) break;

    try {
      const publication = await executePublishingQueueJob(job, user);
      const completed = await completePublishingQueueJob({
        jobId: job.id,
        providerPublicationId: publication.providerPublicationId,
        externalUrl: publication.externalUrl,
        user,
      });
      await syncQueuePublicationToExecution({
        eventId: job.eventId,
        contentItemId: job.contentItemId,
        channel: job.channel,
        status: 'published',
        scheduledFor: job.scheduledFor,
        externalUrl: completed.externalUrl,
        note: 'Published automatically by Club Bahia Promotion Autopilot.',
        user,
      }).catch(() => null);
      results.push({
        jobId: job.id,
        status: 'published',
        externalUrl: completed.externalUrl,
      });
    } catch (error) {
      const execution =
        error instanceof QueueExecutionError
          ? error
          : new QueueExecutionError(
              error instanceof Error ? error.message : 'Scheduled publication failed.',
              false,
              true,
            );
      const failed = await failPublishingQueueJob({
        jobId: job.id,
        error: execution.message,
        retryable: execution.retryable,
        manualReviewRequired: execution.manualReviewRequired,
        user,
      });
      results.push({
        jobId: job.id,
        status: failed.status === 'retrying' ? 'retrying' : 'failed',
        error: failed.lastError,
      });
    }
  }

  return json({
    workerId,
    processed: results.length,
    results,
    completedAt: new Date().toISOString(),
  });
}
