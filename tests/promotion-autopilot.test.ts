import { describe, expect, it } from 'vitest';
import {
  approvePublishingJob,
  buildPublishingIdempotencyKey,
  buildTrackedCampaignUrl,
  createPublishingJob,
  invalidatePublishingApproval,
  isPublishingJobDue,
} from '../lib/admin/autopilot/domain';

const scheduledFor = '2026-08-08T02:00:00.000Z';

describe('Promotion Autopilot publishing domain', () => {
  it('creates stable idempotency keys for the same publication version', () => {
    const input = {
      eventId: 'evt-darkwave',
      provider: 'meta' as const,
      contentItemId: 'instagram-announcement',
      contentVersion: 2,
      mediaVersion: 3,
      scheduledFor,
    };

    expect(buildPublishingIdempotencyKey(input)).toBe(
      buildPublishingIdempotencyKey(input),
    );
  });

  it('creates channel-specific UTM links without removing existing query values', () => {
    const url = buildTrackedCampaignUrl(
      'https://club-bahia.example/reservations?event=darkwave',
      {
        source: 'Instagram',
        medium: 'Feed',
        campaign: 'Darkwave August',
        content: 'Announcement V2',
      },
    );
    const parsed = new URL(url);

    expect(parsed.searchParams.get('event')).toBe('darkwave');
    expect(parsed.searchParams.get('utm_source')).toBe('instagram');
    expect(parsed.searchParams.get('utm_medium')).toBe('feed');
    expect(parsed.searchParams.get('utm_campaign')).toBe('darkwave-august');
    expect(parsed.searchParams.get('utm_content')).toBe('announcement-v2');
  });

  it('requires media before a post can be approved', () => {
    const job = createPublishingJob({
      id: 'job-1',
      eventId: 'evt-1',
      contentItemId: 'post-1',
      provider: 'meta',
      channel: 'instagram-feed',
      hasMedia: false,
      campaignSlug: 'saturday-live',
    });

    expect(job.status).toBe('needs-media');
    expect(() => approvePublishingJob(job)).toThrow(/approved media/i);
  });

  it('invalidates approval whenever approved copy or media changes', () => {
    const initial = createPublishingJob({
      id: 'job-2',
      eventId: 'evt-2',
      contentItemId: 'post-2',
      provider: 'meta',
      channel: 'instagram-feed',
      hasMedia: true,
      scheduledFor,
      campaignSlug: 'saturday-live',
    });
    const approved = approvePublishingJob(
      initial,
      new Date('2026-08-01T12:00:00.000Z'),
    );
    const changed = invalidatePublishingApproval(
      approved,
      'content',
      new Date('2026-08-01T13:00:00.000Z'),
    );

    expect(approved.status).toBe('scheduled');
    expect(changed.status).toBe('needs-approval');
    expect(changed.contentVersion).toBe(approved.contentVersion + 1);
    expect(changed.approvedAt).toBeUndefined();
    expect(changed.idempotencyKey).not.toBe(approved.idempotencyKey);
  });

  it('only treats a scheduled job as due when the approved versions still match', () => {
    const initial = createPublishingJob({
      id: 'job-3',
      eventId: 'evt-3',
      contentItemId: 'post-3',
      provider: 'meta',
      channel: 'instagram-feed',
      hasMedia: true,
      scheduledFor,
      campaignSlug: 'saturday-live',
    });
    const approved = approvePublishingJob(initial);

    expect(
      isPublishingJobDue(approved, new Date('2026-08-08T02:01:00.000Z')),
    ).toBe(true);
    expect(
      isPublishingJobDue(
        { ...approved, contentVersion: approved.contentVersion + 1 },
        new Date('2026-08-08T02:01:00.000Z'),
      ),
    ).toBe(false);
  });
});
