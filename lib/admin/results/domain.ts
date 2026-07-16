import type { PublishingQueueJob } from '@/lib/admin/autopilot/queue-domain';
import { sourceLabel } from '@/lib/reservations/analytics';
import type { StoredReservation } from '@/lib/reservations/domain';

export interface EventResultBreakdown {
  label: string;
  requests: number;
  requestedGuests: number;
  confirmedRequests: number;
  confirmedGuests: number;
}

export interface EventPublishingResult {
  id: string;
  label: string;
  provider: string;
  channel: string;
  status: PublishingQueueJob['status'];
  scheduledFor?: string;
  externalUrl?: string;
  lastError?: string;
}

export interface EventPromotionResults {
  eventId: string;
  generatedAt: string;
  reservations: {
    totalRequests: number;
    newRequests: number;
    requestedGuests: number;
    confirmedRequests: number;
    confirmedGuests: number;
    confirmationRate: number;
  };
  sources: EventResultBreakdown[];
  publishing: {
    total: number;
    published: number;
    scheduledOrActive: number;
    needsApproval: number;
    problems: number;
    cancelled: number;
    posts: EventPublishingResult[];
  };
  providerAnalytics: {
    available: false;
    message: string;
  };
}

function normalized(value: string): string {
  return value.trim().toLocaleLowerCase('en-US').replace(/\s+/g, ' ');
}

function reservationBelongsToEvent(
  reservation: StoredReservation,
  eventId: string,
  eventTitle: string,
): boolean {
  if (reservation.eventId) return reservation.eventId === eventId;
  if (!reservation.eventTitle || !eventTitle) return false;
  return normalized(reservation.eventTitle) === normalized(eventTitle);
}

function buildSourceBreakdown(
  reservations: StoredReservation[],
): EventResultBreakdown[] {
  const bySource = new Map<string, EventResultBreakdown>();

  for (const reservation of reservations) {
    const label = sourceLabel(reservation.attribution);
    const current = bySource.get(label) ?? {
      label,
      requests: 0,
      requestedGuests: 0,
      confirmedRequests: 0,
      confirmedGuests: 0,
    };
    current.requests += 1;
    current.requestedGuests += reservation.guests;
    if (reservation.status === 'confirmed' || reservation.status === 'completed') {
      current.confirmedRequests += 1;
      current.confirmedGuests += reservation.guests;
    }
    bySource.set(label, current);
  }

  return [...bySource.values()]
    .sort(
      (left, right) =>
        right.requests - left.requests ||
        right.requestedGuests - left.requestedGuests ||
        left.label.localeCompare(right.label),
    )
    .slice(0, 8);
}

function publishingCategory(status: PublishingQueueJob['status']):
  | 'published'
  | 'scheduledOrActive'
  | 'needsApproval'
  | 'problems'
  | 'cancelled' {
  if (status === 'published') return 'published';
  if (status === 'needs-approval') return 'needsApproval';
  if (status === 'failed' || status === 'paused') return 'problems';
  if (status === 'cancelled') return 'cancelled';
  return 'scheduledOrActive';
}

export function buildEventPromotionResults(input: {
  eventId: string;
  eventTitle: string;
  reservations: StoredReservation[];
  jobs: PublishingQueueJob[];
  now?: Date;
}): EventPromotionResults {
  const reservations = input.reservations.filter((reservation) =>
    reservationBelongsToEvent(reservation, input.eventId, input.eventTitle),
  );
  const confirmed = reservations.filter(
    (reservation) =>
      reservation.status === 'confirmed' || reservation.status === 'completed',
  );
  const jobs = input.jobs
    .filter((job) => job.eventId === input.eventId)
    .sort((left, right) =>
      (right.updatedAt ?? right.createdAt).localeCompare(
        left.updatedAt ?? left.createdAt,
      ),
    );

  const publishingCounts = {
    published: 0,
    scheduledOrActive: 0,
    needsApproval: 0,
    problems: 0,
    cancelled: 0,
  };
  for (const job of jobs) publishingCounts[publishingCategory(job.status)] += 1;

  return {
    eventId: input.eventId,
    generatedAt: (input.now ?? new Date()).toISOString(),
    reservations: {
      totalRequests: reservations.length,
      newRequests: reservations.filter((reservation) => reservation.status === 'new')
        .length,
      requestedGuests: reservations.reduce(
        (sum, reservation) => sum + reservation.guests,
        0,
      ),
      confirmedRequests: confirmed.length,
      confirmedGuests: confirmed.reduce(
        (sum, reservation) => sum + reservation.guests,
        0,
      ),
      confirmationRate: reservations.length
        ? Math.round((confirmed.length / reservations.length) * 100)
        : 0,
    },
    sources: buildSourceBreakdown(reservations),
    publishing: {
      total: jobs.length,
      ...publishingCounts,
      posts: jobs.map((job) => ({
        id: job.id,
        label: job.label,
        provider: job.provider,
        channel: job.channel,
        status: job.status,
        scheduledFor: job.scheduledFor,
        externalUrl: job.externalUrl,
        lastError: job.lastError,
      })),
    },
    providerAnalytics: {
      available: false,
      message:
        'Reach, views, saves, shares, and watch time will appear after production Meta and TikTok analytics permissions are connected. Reservation attribution is already active for tracked Club Bahia RSVP links.',
    },
  };
}
