import { describe, expect, it } from 'vitest';
import {
  createQueueJob,
  type PublishingQueueJob,
} from '../lib/admin/autopilot/queue-domain';
import { buildEventPromotionResults } from '../lib/admin/results/domain';
import type { StoredReservation } from '../lib/reservations/domain';

const NOW = new Date('2026-07-16T12:00:00.000Z');

function reservation(input: {
  id: string;
  eventId?: string;
  eventTitle?: string;
  guests: number;
  status: StoredReservation['status'];
  source: string;
  content?: string;
}): StoredReservation {
  return {
    id: input.id,
    createdAt: NOW.toISOString(),
    updatedAt: NOW.toISOString(),
    status: input.status,
    source: 'website',
    firstName: 'Test',
    lastName: 'Guest',
    phone: '3235551212',
    email: `${input.id}@example.com`,
    date: '2026-07-17',
    guests: input.guests,
    occasion: '',
    note: '',
    eventId: input.eventId ?? '',
    eventSlug: '',
    eventTitle: input.eventTitle ?? '',
    attribution: {
      source: input.source,
      medium: 'social',
      campaign: 'azucar-friday',
      content: input.content ?? '',
      term: '',
      referrer: '',
      landingPage: '',
      firstTouchAt: NOW.toISOString(),
    },
    consentAt: NOW.toISOString(),
    staffNote: '',
  };
}

function queueJob(
  id: string,
  status: PublishingQueueJob['status'],
  eventId = 'event-friday',
): PublishingQueueJob {
  const job = createQueueJob(
    {
      id,
      eventId,
      eventTitle: 'Azucar LA — Friday, July 17',
      contentItemId: id,
      label: id,
      provider: id.includes('tiktok') ? 'tiktok' : 'meta',
      channel: id.includes('tiktok') ? 'tiktok-video' : 'instagram-feed',
      scheduledFor: '2026-07-17T19:00:00.000Z',
      payload: {
        caption: 'Approved campaign caption.',
        mediaUrl: 'https://assets.example.com/media.jpg',
        mediaKind: id.includes('tiktok') ? 'video' : 'image',
      },
      executionSupport: 'automatic',
    },
    NOW,
  );
  return {
    ...job,
    status,
    externalUrl:
      status === 'published' ? `https://social.example.com/${id}` : undefined,
    lastError: status === 'failed' ? 'Provider rejected the post.' : undefined,
  };
}

describe('event promotion results', () => {
  it('connects event reservations, confirmations, and tracked sources', () => {
    const results = buildEventPromotionResults({
      eventId: 'event-friday',
      eventTitle: 'Azucar LA — Friday, July 17',
      now: NOW,
      reservations: [
        reservation({
          id: 'one',
          eventId: 'event-friday',
          guests: 4,
          status: 'confirmed',
          source: 'instagram',
          content: 'announcement',
        }),
        reservation({
          id: 'two',
          eventId: 'event-friday',
          guests: 2,
          status: 'new',
          source: 'instagram',
          content: 'announcement',
        }),
        reservation({
          id: 'three',
          eventTitle: 'Azucar LA — Friday, July 17',
          guests: 3,
          status: 'completed',
          source: 'tiktok',
          content: 'vertical-video',
        }),
        reservation({
          id: 'other',
          eventId: 'another-event',
          guests: 8,
          status: 'confirmed',
          source: 'instagram',
        }),
      ],
      jobs: [],
    });

    expect(results.reservations.totalRequests).toBe(3);
    expect(results.reservations.requestedGuests).toBe(9);
    expect(results.reservations.confirmedRequests).toBe(2);
    expect(results.reservations.confirmedGuests).toBe(7);
    expect(results.reservations.confirmationRate).toBe(67);
    expect(results.sources[0]).toMatchObject({
      label: 'instagram · social · announcement',
      requests: 2,
      requestedGuests: 6,
    });
  });

  it('summarizes publishing progress without inventing provider analytics', () => {
    const results = buildEventPromotionResults({
      eventId: 'event-friday',
      eventTitle: 'Azucar LA — Friday, July 17',
      now: NOW,
      reservations: [],
      jobs: [
        queueJob('published-instagram', 'published'),
        queueJob('scheduled-instagram', 'scheduled'),
        queueJob('approval-instagram', 'needs-approval'),
        queueJob('failed-tiktok', 'failed'),
        queueJob('paused-tiktok', 'paused'),
        queueJob('cancelled-instagram', 'cancelled'),
        queueJob('other-event', 'published', 'another-event'),
      ],
    });

    expect(results.publishing.total).toBe(6);
    expect(results.publishing.published).toBe(1);
    expect(results.publishing.scheduledOrActive).toBe(1);
    expect(results.publishing.needsApproval).toBe(1);
    expect(results.publishing.problems).toBe(2);
    expect(results.publishing.cancelled).toBe(1);
    expect(results.publishing.posts[0].externalUrl).toBeDefined();
    expect(results.providerAnalytics.available).toBe(false);
    expect(results.providerAnalytics.message).toContain('after production Meta and TikTok');
  });
});
