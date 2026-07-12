import { describe, expect, it } from 'vitest';
import {
  PublicEventSnapshotSchema,
  slugifyPublicEvent,
} from '../lib/public-events/domain';
import { createReservationSchema } from '../lib/reservations/reservation-schema';

const baseReservation = {
  firstName: 'Maria',
  lastName: 'Lopez',
  phone: '(213) 555-0123',
  email: 'maria@example.com',
  guests: 4,
  occasion: 'Birthday',
  note: '',
  consent: true,
};

describe('public reservation validation', () => {
  it('accepts Friday and Saturday for general reservations', () => {
    const schema = createReservationSchema();
    expect(
      schema.safeParse({ ...baseReservation, date: '2026-08-14' }).success,
    ).toBe(true);
    expect(
      schema.safeParse({ ...baseReservation, date: '2026-08-15' }).success,
    ).toBe(true);
  });

  it('rejects non-weekend general reservations', () => {
    const result = createReservationSchema().safeParse({
      ...baseReservation,
      date: '2026-08-16',
    });
    expect(result.success).toBe(false);
  });

  it('accepts an event-specific date on any weekday', () => {
    const schema = createReservationSchema('2026-08-16');
    expect(
      schema.safeParse({ ...baseReservation, date: '2026-08-16' }).success,
    ).toBe(true);
    expect(
      schema.safeParse({ ...baseReservation, date: '2026-08-15' }).success,
    ).toBe(false);
  });
});

describe('public event snapshots', () => {
  it('normalizes event names into stable public slugs', () => {
    expect(slugifyPublicEvent('Sábado Caliente — Club Bahia')).toBe(
      'sabado-caliente-club-bahia',
    );
  });

  it('accepts a complete preview website snapshot', () => {
    const parsed = PublicEventSnapshotSchema.safeParse({
      version: 1,
      id: 'evt-sabado-caliente',
      slug: 'sabado-caliente',
      title: 'Sábado Caliente',
      eyebrow: 'Website preview',
      category: 'Salsa, bachata',
      summary: 'A full night of salsa, bachata, dancing, and late-night food at Club Bahia.',
      websiteCopy:
        'Sábado Caliente returns to Club Bahia with salsa, bachata, dancing, and late-night food on Sunset Boulevard.',
      startsAt: '2026-08-08T21:00:00.000Z',
      endsAt: '2026-08-09T05:00:00.000Z',
      room: 'Main room',
      performers: 'DJ Bahia',
      genres: 'Salsa, bachata',
      doorsTime: 'Doors 9 PM',
      admission: '$15',
      ageRestriction: '21+',
      foodDrinkSpecial: 'Late-night kitchen',
      address: '1130 Sunset Blvd, Los Angeles, CA 90012',
      reservationUrl: '',
      ticketUrl: '',
      imageUrl: 'https://example.com/flyer.jpg',
      imageAlt: 'Sábado Caliente flyer at Club Bahia',
      statusLabel: 'Reservations available',
      visibility: 'preview',
      isFeatured: true,
      updatedAt: '2026-07-12T05:00:00.000Z',
    });

    expect(parsed.success).toBe(true);
  });
});
