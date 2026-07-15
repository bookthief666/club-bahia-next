import { NextResponse } from 'next/server';
import {
  summarizePublishingQueueToday,
  type PublishingQueueJob,
} from '@/lib/admin/autopilot/queue-domain';
import { PublishingQueueActionSchema } from '@/lib/admin/autopilot/queue-validation';
import {
  approvePublishingQueueCampaign,
  approvePublishingQueueJob,
  cancelPublishingQueueJob,
  getPublishingQueue,
  upsertPublishingQueueCampaign,
  upsertPublishingQueueJob,
} from '@/lib/admin/autopilot/server/queue-store';
import { requireAdminRequest } from '@/lib/admin/auth/session';
import { isAdminWorkspaceStorageConfigured } from '@/lib/admin/workspaces/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' };
const QUEUE_EDIT_ROLES = new Set(['owner', 'manager', 'marketing']);

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE_HEADERS });
}

function safeJob(job: PublishingQueueJob): PublishingQueueJob {
  return {
    ...job,
    lease: job.lease
      ? {
          workerId: 'active-worker',
          claimedAt: job.lease.claimedAt,
          expiresAt: job.lease.expiresAt,
        }
      : undefined,
  };
}

export async function GET(request: Request) {
  try {
    requireAdminRequest(request);
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : 'Unauthorized.' },
      401,
    );
  }
  if (!isAdminWorkspaceStorageConfigured()) {
    return json(
      { error: 'Encrypted publishing queue storage is not configured.' },
      503,
    );
  }

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('eventId')?.trim();
  const current = await getPublishingQueue();
  const jobs = eventId
    ? current.queue.jobs.filter((job) => job.eventId === eventId)
    : current.queue.jobs;
  return json({
    jobs: jobs.map(safeJob),
    today: summarizePublishingQueueToday(current.queue),
    updatedAt: current.queue.updatedAt,
  });
}

export async function POST(request: Request) {
  let user;
  try {
    user = requireAdminRequest(request);
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : 'Unauthorized.' },
      401,
    );
  }
  if (!QUEUE_EDIT_ROLES.has(user.role)) {
    return json({ error: 'This account cannot change the publishing queue.' }, 403);
  }
  if (!isAdminWorkspaceStorageConfigured()) {
    return json(
      { error: 'Encrypted publishing queue storage is not configured.' },
      503,
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return json({ error: 'Publishing queue request must be valid JSON.' }, 400);
  }
  const parsed = PublishingQueueActionSchema.safeParse(raw);
  if (!parsed.success) {
    return json(
      {
        error: 'Publishing queue request failed validation.',
        details: parsed.error.flatten(),
      },
      400,
    );
  }

  try {
    if (parsed.data.action === 'upsert') {
      const job = await upsertPublishingQueueJob({
        job: parsed.data.job,
        user,
      });
      return json({ job: safeJob(job) });
    }
    if (parsed.data.action === 'upsert-campaign') {
      const jobs = await upsertPublishingQueueCampaign({
        eventId: parsed.data.eventId,
        jobs: parsed.data.jobs,
        user,
      });
      return json({ jobs: jobs.map(safeJob) });
    }
    if (parsed.data.action === 'approve') {
      const job = await approvePublishingQueueJob({
        jobId: parsed.data.jobId,
        user,
      });
      return json({ job: safeJob(job) });
    }
    if (parsed.data.action === 'approve-campaign') {
      const result = await approvePublishingQueueCampaign({
        eventId: parsed.data.eventId,
        jobIds: parsed.data.jobIds,
        user,
      });
      return json({
        jobs: result.jobs.map(safeJob),
        blocked: result.blocked,
      });
    }
    const job = await cancelPublishingQueueJob({
      jobId: parsed.data.jobId,
      user,
    });
    return json({ job: safeJob(job) });
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Publishing queue could not be updated.',
      },
      409,
    );
  }
}
