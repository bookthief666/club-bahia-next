import { describe, expect, it } from 'vitest';
import {
  approveQueueJob,
  claimNextDueQueueJob,
  createQueueJob,
  emptyPublishingQueue,
  failQueueJob,
  summarizePublishingQueueToday,
  upsertQueueJob,
} from '../lib/admin/autopilot/queue-domain';

const now = new Date('2026-08-08T18:00:00.000Z');

function instagramJob(overrides: Record<string, unknown> = {}) {
  return createQueueJob(
    {
      id: 'event-1-instagram-feed',
      eventId: 'event-1',
      eventTitle: 'Saturday at Club Bahia',
      contentItemId: 'instagram-feed',
      label: 'Instagram feed image',
      provider: 'meta',
      channel: 'instagram-feed',
      scheduledFor: '2026-08-08T17:55:00.000Z',
      payload: {
        caption: 'Tonight at Club Bahia.',
        mediaUrl:
          'https://store.public.blob.vercel-storage.com/events/flyer.jpg',
        mediaKind: 'image',
      },
      executionSupport: 'automatic',
      ...overrides,
    },
    new Date('2026-08-01T12:00:00.000Z'),
  );
}

describe('durable Promotion Autopilot queue', () => {
  it('requires approval and claims one due job exactly once while its lease is active', () => {
    const queued = upsertQueueJob(emptyPublishingQueue(), instagramJob());
    const approved = approveQueueJob(queued, 'event-1-instagram-feed', now);
    const first = claimNextDueQueueJob({
      queue: approved,
      workerId: 'worker-a',
      now,
    });
    const second = claimNextDueQueueJob({
      queue: first.queue,
      workerId: 'worker-b',
      now,
    });

    expect(first.job?.status).toBe('publishing');
    expect(first.job?.attemptCount).toBe(1);
    expect(second.job).toBeUndefined();
  });

  it('uses bounded exponential retry delays and stops after the maximum attempts', () => {
    const queued = upsertQueueJob(
      emptyPublishingQueue(),
      instagramJob({ maxAttempts: 2 }),
    );
    const approved = approveQueueJob(queued, 'event-1-instagram-feed', now);
    const claimed = claimNextDueQueueJob({
      queue: approved,
      workerId: 'worker-a',
      now,
    });
    const retrying = failQueueJob({
      queue: claimed.queue,
      jobId: 'event-1-instagram-feed',
      error: 'Temporary provider error',
      retryable: true,
      now,
    });
    const retryAt = retrying.jobs[0].nextAttemptAt;
    const claimedAgain = claimNextDueQueueJob({
      queue: retrying,
      workerId: 'worker-b',
      now: new Date(retryAt ?? now),
    });
    const failed = failQueueJob({
      queue: claimedAgain.queue,
      jobId: 'event-1-instagram-feed',
      error: 'Provider still unavailable',
      retryable: true,
      now: new Date(retryAt ?? now),
    });

    expect(retrying.jobs[0].status).toBe('retrying');
    expect(failed.jobs[0].status).toBe('failed');
    expect(failed.jobs[0].permanentFailure).toBe(true);
  });

  it('pauses a TikTok job until the controlled provider proof is complete', () => {
    const tiktok = createQueueJob({
      id: 'event-1-tiktok-video',
      eventId: 'event-1',
      eventTitle: 'Saturday at Club Bahia',
      contentItemId: 'vertical-video-tiktok',
      label: 'TikTok vertical video',
      provider: 'tiktok',
      channel: 'tiktok-video',
      scheduledFor: '2026-08-08T19:00:00.000Z',
      payload: {
        caption: 'Club Bahia tonight.',
        mediaUrl:
          'https://store.public.blob.vercel-storage.com/events/video.mp4',
        mediaKind: 'video',
      },
      executionSupport: 'provider-proof-required',
    });
    const approved = approveQueueJob(
      upsertQueueJob(emptyPublishingQueue(), tiktok),
      tiktok.id,
      now,
    );

    expect(approved.jobs[0].status).toBe('paused');
    expect(approved.jobs[0].lastError).toMatch(/controlled provider proof/i);
  });

  it('separates publishing today, approvals, and problems in Los Angeles time', () => {
    const due = approveQueueJob(
      upsertQueueJob(emptyPublishingQueue(), instagramJob()),
      'event-1-instagram-feed',
      now,
    );
    const approval = instagramJob({
      id: 'event-2-instagram-feed',
      eventId: 'event-2',
      scheduledFor: '2026-08-08T23:00:00.000Z',
    });
    const paused = createQueueJob({
      id: 'event-3-tiktok-video',
      eventId: 'event-3',
      eventTitle: 'TikTok event',
      contentItemId: 'tiktok-video',
      label: 'TikTok video',
      provider: 'tiktok',
      channel: 'tiktok-video',
      scheduledFor: '2026-08-08T20:00:00.000Z',
      payload: {
        caption: 'TikTok copy',
        mediaUrl:
          'https://store.public.blob.vercel-storage.com/events/video.mp4',
        mediaKind: 'video',
      },
      executionSupport: 'provider-proof-required',
    });
    let queue = upsertQueueJob(due, approval);
    queue = approveQueueJob(upsertQueueJob(queue, paused), paused.id, now);
    const summary = summarizePublishingQueueToday(queue, now);

    expect(summary.publishingToday).toHaveLength(1);
    expect(summary.needsApproval).toHaveLength(1);
    expect(summary.problems).toHaveLength(1);
  });
});
