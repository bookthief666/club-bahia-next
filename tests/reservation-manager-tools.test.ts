import { describe, expect, it } from 'vitest';
import { reservationsToCsv } from '../lib/reservations/csv';
import { findRecentDuplicateReservation } from '../lib/reservations/dedupe';
import {
  StoredReservationSchema,
  type ReservationSubmission,
  type StoredReservation,
} from '../lib/reservations/domain';
import {
  reservationEmailSubject,
  reservationMessage,
} from '../lib/reservations/messages';

function storedReservation(
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
      landingPage: 'https://club-bahia.example/reservations',
      firstTouchAt: '2026-07-12T18:55:00.000Z',
    },
    consentAt: '2026-07-12T19:00:00.000Z',
    staffNote: '',
    ...overrides,
  });
}

function submission(
  overrides: Partial<ReservationSubmission> = {},
): ReservationSubmission {
  return {
    firstName: 'Maria',
    lastName: 'Lopez',
    phone: '213-555-0123',
    email: 'MARIA@example.com',
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
      landingPage: 'https://club-bahia.example/reservations',
      firstTouchAt: '2026-07-12T18:55:00.000Z',
    },
    consent: true,
    website: '',
    startedAt: Date.parse('2026-07-12T18:54:00.000Z'),
    ...overrides,
  };
}

describe('recent duplicate reservation detection', () => {
  it('finds the same recent guest, event, and date despite phone formatting', () => {
    const match = findRecentDuplicateReservation(
      [storedReservation()],
      submission(),
      new Date('2026-07-12T19:10:00.000Z'),
    );
    expect(match?.id).toBe('CB-20260712-ABC12345');
  });

  it('does not collapse a different event or an older legitimate request', () => {
    expect(
      findRecentDuplicateReservation(
        [storedReservation()],
        submission({ eventSlug: 'darkwave-night' }),
        new Date('2026-07-12T19:10:00.000Z'),
      ),
    ).toBeUndefined();
    expect(
      findRecentDuplicateReservation(
        [storedReservation()],
        submission(),
        new Date('2026-07-12T20:00:00.000Z'),
      ),
    ).toBeUndefined();
  });
});

describe('manager follow-up messages', () => {
  it('creates truthful received and confirmation messages', () => {
    const reservation = storedReservation();
    expect(reservationMessage(reservation, 'received')).toContain(
      'not yet a final table confirmation',
    );
    expect(reservationMessage(reservation, 'confirmed')).toContain(
      'is confirmed',
    );
    expect(reservationEmailSubject(reservation, 'waitlist')).toContain(
      'Waitlist update',
    );
  });

  it('keeps general reservation wording natural when no event is selected', () => {
    const reservation = storedReservation({
      eventId: '',
      eventSlug: '',
      eventTitle: '',
    });
    const confirmed = reservationMessage(reservation, 'confirmed');
    expect(confirmed).toContain(
      'your Club Bahia reservation request on Saturday, August 8 for 4 guests is confirmed',
    );
    expect(confirmed).not.toContain('for your Club Bahia reservation');
  });
});

describe('reservation CSV export', () => {
  it('includes attribution and protects spreadsheet formula cells', () => {
    const csv = reservationsToCsv([
      storedReservation({ staffNote: '=HYPERLINK("bad")' }),
    ]);
    expect(csv).toContain('UTM Source');
    expect(csv).toContain('instagram');
    expect(csv).toContain("'=HYPERLINK");
  });
});
