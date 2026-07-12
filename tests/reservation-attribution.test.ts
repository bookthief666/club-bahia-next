import { describe, expect, it } from 'vitest';
import {
  ReservationAttributionSchema,
  trackedReservationHref,
} from '../lib/attribution/domain';
import { buildReservationAnalytics } from '../lib/reservations/analytics';
import {
  StoredReservationSchema,
  type StoredReservation,
} from '../lib/reservations/domain';

function reservation(
  overrides: Partial<StoredReservation> = {},
): StoredReservation {
  return StoredReservationSchema.parse({
    id: 'CB-20260712-ABC12345',
    createdAt: '2026-07-12T19:00:00.000Z',
    updatedAt: '2026-07-12T19:00:00.000Z',
    status: 'new',
    source: 'website',
    firstName: 'Maria',
    lastName: 'Lopez',
    phone: '(213) 555-0123',
    email: 'maria@example.com',
    date: '2026-08-08',
    guests: 4,
    occasion: 'Birthday',
    note: '',
    eventId: 'evt-sabado-caliente',
    eventSlug: 'sabado-caliente',
    eventTitle: 'Sábado Caliente',
    attribution: {
      source: 'instagram',
      medium: 'social',
      campaign: 'sabado-caliente',
      content: 'story-link-sticker',
      term: '',
      referrer: '',
      landingPage:
        'https://club-bahia.example/reservations?event=sabado-caliente',
      firstTouchAt: '2026-07-12T18:55:00.000Z',
    },
    consentAt: '2026-07-12T19:00:00.000Z',
    staffNote: '',
    ...overrides,
  });
}

describe('tracked reservation links', () => {
  it('creates an event-specific UTM link', () => {
    const href = trackedReservationHref({
      eventSlug: 'sabado-caliente',
      source: 'instagram',
      medium: 'social',
      campaign: 'sabado-caliente',
      content: 'story-link-sticker',
    });

    expect(href).toContain('/reservations?');
    expect(href).toContain('event=sabado-caliente');
    expect(href).toContain('utm_source=instagram');
    expect(href).toContain('utm_medium=social');
    expect(href).toContain('utm_content=story-link-sticker');
  });

  it('accepts empty attribution for direct traffic', () => {
    const result = ReservationAttributionSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.source).toBe('');
  });
});

describe('reservation analytics', () => {
  it('counts requests, confirmed guests, events, and sources', () => {
    const reservations = [
      reservation(),
      reservation({
        id: 'CB-20260712-DEF67890',
        status: 'confirmed',
        guests: 6,
        attribution: {
          source: 'printed-flyer',
          medium: 'qr',
          campaign: 'sabado-caliente',
          content: 'flyer-qr-code',
          term: '',
          referrer: '',
          landingPage: 'https://club-bahia.example/reservations',
          firstTouchAt: '2026-07-12T18:00:00.000Z',
        },
      }),
    ];

    const analytics = buildReservationAnalytics(
      reservations,
      new Date('2026-07-12T20:00:00.000Z'),
    );

    expect(analytics.totalRequests).toBe(2);
    expect(analytics.confirmedRequests).toBe(1);
    expect(analytics.confirmedGuests).toBe(6);
    expect(analytics.requestedGuests).toBe(10);
    expect(analytics.confirmationRate).toBe(50);
    expect(analytics.requestsToday).toBe(2);
    expect(analytics.topEvents[0]?.label).toBe('Sábado Caliente');
    expect(analytics.topSources).toHaveLength(2);
  });

  it('keeps older stored reservations compatible when attribution is missing', () => {
    const parsed = StoredReservationSchema.safeParse({
      ...reservation(),
      attribution: undefined,
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.attribution.source).toBe('');
  });
});
