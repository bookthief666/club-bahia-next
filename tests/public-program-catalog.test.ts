import { describe, expect, it } from 'vitest';
import { buildPublicProgramCatalog } from '../lib/public-events/catalog';
import {
  PublicEventSnapshotSchema,
  type PublicEventCard,
} from '../lib/public-events/domain';

function card(overrides: Partial<PublicEventCard> = {}): PublicEventCard {
  return {
    id: 'event-1',
    slug: 'special-night',
    title: 'Special Night',
    eyebrow: 'Upcoming at Bahia',
    category: 'Live event',
    programType: 'scheduled',
    summary: 'A confirmed Club Bahia special event with music and dancing.',
    description: 'A confirmed Club Bahia special event with music and dancing.',
    startsAt: '2026-08-15T03:00:00.000Z',
    endsAt: '2026-08-15T09:00:00.000Z',
    dateLabel: 'Friday, August 14, 2026',
    timeLabel: '8:00 PM–2:00 AM',
    reservationHref: '/reservations?event=special-night',
    ticketUrl: '',
    imageUrl: '/assets/bahia/live-dance-crowd-stage.webp',
    imageAlt: 'Club Bahia event',
    status: 'Reservations available',
    ctaLabel: 'Request reservation',
    isFeatured: false,
    source: 'snapshot',
    ...overrides,
  };
}

describe('public program catalog', () => {
  it('keeps resident and evergreen programming visible when no dated event is upcoming', () => {
    const catalog = buildPublicProgramCatalog(
      [
        card({
          id: 'past',
          slug: 'past-event',
          startsAt: '2026-06-01T03:00:00.000Z',
          endsAt: '2026-06-01T09:00:00.000Z',
        }),
        card({
          id: 'resident',
          slug: 'azucar-la-live-weekends',
          title: 'Azucar LA Live Weekends',
          programType: 'resident',
          startsAt: undefined,
          endsAt: undefined,
          dateLabel: 'Most Fridays & Saturdays',
          timeLabel: 'Evening sets · schedule may vary',
          source: 'fallback',
        }),
        card({
          id: 'evergreen',
          slug: 'birthdays-and-celebrations',
          title: 'Birthdays & Celebrations',
          programType: 'evergreen',
          startsAt: undefined,
          endsAt: undefined,
          source: 'fallback',
        }),
      ],
      new Date('2026-07-13T00:00:00.000Z'),
    );

    expect(catalog.scheduledEvents).toHaveLength(0);
    expect(catalog.residentPrograms[0]?.slug).toBe(
      'azucar-la-live-weekends',
    );
    expect(catalog.evergreenPrograms[0]?.slug).toBe(
      'birthdays-and-celebrations',
    );
  });

  it('orders a featured upcoming event before later scheduled events', () => {
    const catalog = buildPublicProgramCatalog(
      [
        card({
          id: 'first-date',
          slug: 'first-date',
          startsAt: '2026-07-18T03:00:00.000Z',
          endsAt: '2026-07-18T09:00:00.000Z',
        }),
        card({
          id: 'featured',
          slug: 'featured-event',
          startsAt: '2026-07-25T03:00:00.000Z',
          endsAt: '2026-07-25T09:00:00.000Z',
          isFeatured: true,
        }),
      ],
      new Date('2026-07-13T00:00:00.000Z'),
    );

    expect(catalog.scheduledEvents.map((event) => event.slug)).toEqual([
      'featured-event',
      'first-date',
    ]);
  });

  it('keeps old version-one snapshots compatible by defaulting to scheduled', () => {
    const parsed = PublicEventSnapshotSchema.safeParse({
      version: 1,
      id: 'event-1',
      slug: 'special-night',
      title: 'Special Night',
      eyebrow: 'Upcoming at Bahia',
      category: 'Live event',
      summary: 'A confirmed Club Bahia special event with music and dancing.',
      websiteCopy:
        'A confirmed Club Bahia special event with music and dancing at the venue.',
      startsAt: '2026-08-15T03:00:00.000Z',
      endsAt: '2026-08-15T09:00:00.000Z',
      room: 'Main room',
      performers: '',
      genres: '',
      doorsTime: '',
      admission: '',
      ageRestriction: '21+',
      foodDrinkSpecial: '',
      address: '1130 Sunset Blvd, Los Angeles, CA 90012',
      reservationUrl: '',
      ticketUrl: '',
      imageUrl: 'https://example.com/event.jpg',
      imageAlt: 'Club Bahia event',
      statusLabel: 'Reservations available',
      visibility: 'preview',
      isFeatured: false,
      updatedAt: '2026-07-13T00:00:00.000Z',
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.programType).toBe('scheduled');
  });
});
