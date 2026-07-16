import { describe, expect, it } from 'vitest';
import { reservationsToCsv } from '../lib/reservations/csv';
import {
  ReservationStatusUpdateSchema,
  StoredReservationSchema,
  type StoredReservation,
} from '../lib/reservations/domain';
import {
  classifyReservationFollowUp,
  filterReservationsForFollowUp,
  followUpAtForPreset,
  resolveReservationFollowUpAt,
  sortReservationsForFollowUp,
  summarizeReservationFollowUps,
} from '../lib/reservations/follow-up';

const now = new Date('2026-07-16T20:00:00.000Z');

function reservation(
  overrides: Partial<StoredReservation> = {},
): StoredReservation {
  return StoredReservationSchema.parse({
    id: 'CB-20260716-ABC12345',
    createdAt: '2026-07-16T19:30:00.000Z',
    updatedAt: '2026-07-16T19:30:00.000Z',
    status: 'new',
    source: 'website',
    firstName: 'Maria',
    lastName: 'Lopez',
    phone: '(213) 555-0123',
    email: 'maria@example.com',
    date: '2026-07-18',
    guests: 4,
    occasion: 'Birthday',
    note: '',
    eventId: 'evt-azucar-friday',
    eventSlug: 'azucar-friday',
    eventTitle: 'Azucar Friday',
    attribution: {
      source: 'instagram',
      medium: 'social',
      campaign: 'azucar-friday',
      content: 'story-link',
      term: '',
      referrer: '',
      landingPage: 'https://club-bahia.example/reservations',
      firstTouchAt: '2026-07-16T19:20:00.000Z',
    },
    consentAt: '2026-07-16T19:30:00.000Z',
    staffNote: '',
    ...overrides,
  });
}

describe('reservation follow-up classification', () => {
  it('places a fresh website request in the first-reply lane', () => {
    const state = classifyReservationFollowUp(reservation(), now);

    expect(state).toMatchObject({
      lane: 'needs-reply',
      priority: 'high',
      overdue: false,
      daysUntilEvent: 2,
    });
  });

  it('escalates an unanswered request after one hour', () => {
    const state = classifyReservationFollowUp(
      reservation({ createdAt: '2026-07-16T18:00:00.000Z' }),
      now,
    );

    expect(state.lane).toBe('needs-reply');
    expect(state.priority).toBe('urgent');
    expect(state.overdue).toBe(true);
    expect(state.detail).toContain('2 hours');
  });

  it('surfaces a saved reminder as soon as it is due', () => {
    const state = classifyReservationFollowUp(
      reservation({
        status: 'contacted',
        contactedAt: '2026-07-15T20:00:00.000Z',
        followUpAt: '2026-07-16T19:00:00.000Z',
        date: '2026-07-25',
      }),
      now,
    );

    expect(state.lane).toBe('follow-up-due');
    expect(state.overdue).toBe(true);
  });

  it('keeps a future reminder in the scheduled lane', () => {
    const state = classifyReservationFollowUp(
      reservation({
        status: 'contacted',
        contactedAt: '2026-07-16T19:00:00.000Z',
        followUpAt: '2026-07-17T18:00:00.000Z',
        date: '2026-07-25',
      }),
      now,
    );

    expect(state).toMatchObject({
      lane: 'scheduled',
      priority: 'normal',
      overdue: false,
    });
  });

  it('escalates unresolved requests when the event is within two days', () => {
    const state = classifyReservationFollowUp(
      reservation({
        status: 'waitlist',
        date: '2026-07-17',
        followUpAt: undefined,
      }),
      now,
    );

    expect(state.lane).toBe('event-near');
    expect(state.priority).toBe('high');
    expect(state.detail).toContain('tomorrow');
  });

  it('shows confirmed parties arriving within the next week', () => {
    const state = classifyReservationFollowUp(
      reservation({
        status: 'confirmed',
        confirmedAt: '2026-07-16T19:00:00.000Z',
        date: '2026-07-20',
      }),
      now,
    );

    expect(state.lane).toBe('confirmed-upcoming');
    expect(state.daysUntilEvent).toBe(4);
  });

  it('keeps completed and cancelled requests out of active work', () => {
    expect(
      classifyReservationFollowUp(
        reservation({ status: 'completed' }),
        now,
      ).lane,
    ).toBe('closed');
    expect(
      classifyReservationFollowUp(
        reservation({ status: 'cancelled' }),
        now,
      ).lane,
    ).toBe('closed');
  });
});

describe('reservation follow-up queue', () => {
  it('summarizes, filters, and sorts action-needed requests deterministically', () => {
    const due = reservation({
      id: 'due',
      status: 'contacted',
      date: '2026-07-25',
      followUpAt: '2026-07-16T18:00:00.000Z',
    });
    const fresh = reservation({ id: 'fresh' });
    const near = reservation({
      id: 'near',
      status: 'waitlist',
      date: '2026-07-17',
    });
    const confirmed = reservation({
      id: 'confirmed',
      status: 'confirmed',
      date: '2026-07-20',
    });
    const closed = reservation({ id: 'closed', status: 'completed' });
    const reservations = [confirmed, fresh, closed, near, due];

    const summary = summarizeReservationFollowUps(reservations, now);
    expect(summary).toMatchObject({
      total: 5,
      actionNeeded: 3,
      needsReply: 1,
      followUpDue: 1,
      eventNear: 1,
      confirmedUpcoming: 1,
      closed: 1,
    });

    expect(
      filterReservationsForFollowUp({
        reservations,
        view: 'action-needed',
        now,
      }).map((item) => item.id),
    ).toEqual(['due', 'fresh', 'near']);

    expect(
      sortReservationsForFollowUp(reservations, now)[0].id,
    ).toBe('due');
  });
});

describe('follow-up reminder presets', () => {
  it('creates venue-local two-hour, tomorrow, and day-before reminders', () => {
    const item = reservation({ date: '2026-08-08' });

    expect(
      followUpAtForPreset({
        preset: 'two-hours',
        reservation: item,
        now,
      }),
    ).toBe('2026-07-16T22:00:00.000Z');

    expect(
      followUpAtForPreset({
        preset: 'tomorrow',
        reservation: item,
        now,
      }),
    ).toBe('2026-07-17T18:00:00.000Z');

    expect(
      followUpAtForPreset({
        preset: 'day-before-event',
        reservation: item,
        now,
      }),
    ).toBe('2026-08-07T18:00:00.000Z');
  });

  it('falls back to two hours when the day-before reminder is already past', () => {
    expect(
      followUpAtForPreset({
        preset: 'day-before-event',
        reservation: reservation({ date: '2026-07-16' }),
        now,
      }),
    ).toBe('2026-07-16T22:00:00.000Z');
  });

  it('preserves, clears, and closes reminders according to status', () => {
    expect(
      resolveReservationFollowUpAt({
        current: '2026-07-17T18:00:00.000Z',
        status: 'contacted',
      }),
    ).toBe('2026-07-17T18:00:00.000Z');
    expect(
      resolveReservationFollowUpAt({
        current: '2026-07-17T18:00:00.000Z',
        requested: null,
        status: 'contacted',
      }),
    ).toBeUndefined();
    expect(
      resolveReservationFollowUpAt({
        current: '2026-07-17T18:00:00.000Z',
        requested: '2026-07-18T18:00:00.000Z',
        status: 'confirmed',
      }),
    ).toBeUndefined();
  });

  it('includes the reminder timestamp in protected CSV exports', () => {
    const csv = reservationsToCsv([
      reservation({ followUpAt: '2026-07-17T18:00:00.000Z' }),
    ]);

    expect(csv).toContain('Follow Up At');
    expect(csv).toContain('2026-07-17T18:00:00.000Z');
  });

  it('accepts explicit reminder clearing in the protected update schema', () => {
    expect(
      ReservationStatusUpdateSchema.parse({
        id: 'CB-20260716-ABC12345',
        status: 'contacted',
        followUpAt: null,
      }).followUpAt,
    ).toBeNull();
  });
});
