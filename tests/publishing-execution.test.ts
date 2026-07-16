import { describe, expect, it } from 'vitest';
import type { EventAsset } from '../lib/admin/assets/domain';
import type {
  CampaignBrief,
  CampaignContentItem,
} from '../lib/admin/growth/domain';
import type { EventPostAssembly } from '../lib/admin/publishing/domain';
import {
  buildCampaignManifest,
  emptyPublishingExecution,
  manifestToCsv,
  summarizePublishingExecution,
  type EventPublishingExecution,
} from '../lib/admin/publishing/execution-domain';

const timestamp = '2026-07-12T05:00:00.000Z';

const brief: CampaignBrief = {
  theme: 'Darkwave campaign',
  publicSubtitle: '',
  targetAudience: 'Los Angeles nightlife audiences',
  objective: 'reservations',
  tone: 'cinematic and nocturnal',
  offer: 'Reserve now',
  budgetCents: 20000,
  language: 'bilingual',
  performers: 'Bookthief',
  genres: 'darkwave',
  doorsTime: '8 PM',
  admission: '$15',
  ageRestriction: '18+',
  foodDrinkSpecial: '',
  reservationUrl: 'https://example.com/reservations',
  address: '1130 Sunset Blvd, Los Angeles, CA 90012',
  mainAttraction: 'A neon darkwave dance night',
};

const content: CampaignContentItem[] = [
  {
    id: 'website-item',
    channel: 'website',
    title: 'Website event description',
    body: 'Club Bahia presents a darkwave night.',
    status: 'approved',
    publishingMode: 'automatic',
    publishAt: '2026-07-25T19:00:00.000Z',
    updatedAt: timestamp,
  },
  {
    id: 'sms-item',
    channel: 'sms',
    title: 'Day-before SMS',
    body: 'Club Bahia tomorrow. Reserve now.',
    status: 'approved',
    publishingMode: 'manual',
    publishAt: '2026-07-26T19:00:00.000Z',
    updatedAt: timestamp,
  },
];

const flyer: EventAsset = {
  id: 'flyer',
  eventId: 'evt-night',
  name: 'event-flyer.jpg',
  pathname: 'club-bahia/events/evt-night/assets/flyer/event-flyer.jpg',
  url: 'https://example.public.blob.vercel-storage.com/event-flyer.jpg',
  downloadUrl:
    'https://example.public.blob.vercel-storage.com/event-flyer.jpg?download=1',
  contentType: 'image/jpeg',
  size: 1_000_000,
  kind: 'image',
  role: 'primary-flyer',
  platforms: ['website'],
  status: 'approved',
  altText: 'Neon Club Bahia flyer.',
  notes: '',
  rightsConfirmedAt: timestamp,
  uploadedAt: timestamp,
  updatedAt: timestamp,
};

const assembly: EventPostAssembly = {
  eventId: 'evt-night',
  packages: [
    {
      contentItemId: 'website-item',
      channel: 'website',
      assetIds: ['flyer'],
      primaryAssetId: 'flyer',
      updatedAt: timestamp,
    },
    {
      contentItemId: 'sms-item',
      channel: 'sms',
      assetIds: [],
      updatedAt: timestamp,
    },
  ],
  updatedAt: timestamp,
};

describe('publishing execution summary', () => {
  it('counts ready packages before manual execution begins', () => {
    const summary = summarizePublishingExecution(
      content,
      brief,
      assembly,
      [flyer],
      emptyPublishingExecution('evt-night'),
    );

    expect(summary).toMatchObject({
      total: 2,
      blocked: 0,
      ready: 2,
      scheduled: 0,
      published: 0,
    });
  });

  it('counts scheduled and published states', () => {
    const execution: EventPublishingExecution = {
      eventId: 'evt-night',
      items: [
        {
          contentItemId: 'website-item',
          channel: 'website',
          status: 'scheduled',
          scheduledFor: content[0].publishAt,
          updatedAt: timestamp,
        },
        {
          contentItemId: 'sms-item',
          channel: 'sms',
          status: 'published',
          publishedAt: timestamp,
          updatedAt: timestamp,
        },
      ],
      updatedAt: timestamp,
    };

    const summary = summarizePublishingExecution(
      content,
      brief,
      assembly,
      [flyer],
      execution,
    );

    expect(summary.scheduled).toBe(1);
    expect(summary.published).toBe(1);
    expect(summary.ready).toBe(0);
  });

  it('keeps an incomplete conversion campaign blocked', () => {
    const summary = summarizePublishingExecution(
      content,
      { ...brief, reservationUrl: '' },
      assembly,
      [flyer],
      emptyPublishingExecution('evt-night'),
    );

    expect(summary.blocked).toBe(2);
    expect(summary.ready).toBe(0);
  });
});

describe('campaign manifest export', () => {
  it('includes final copy, media, reservation URL, and execution status', () => {
    const execution: EventPublishingExecution = {
      eventId: 'evt-night',
      items: [
        {
          contentItemId: 'website-item',
          channel: 'website',
          status: 'published',
          publishedAt: timestamp,
          externalUrl: 'https://example.com/events/night',
          updatedAt: timestamp,
        },
      ],
      updatedAt: timestamp,
    };

    const manifest = buildCampaignManifest({
      eventId: 'evt-night',
      eventTitle: 'Noche Oscura',
      content,
      brief,
      assembly,
      assets: [flyer],
      execution,
    });

    expect(manifest.reservationUrl).toBe(brief.reservationUrl);
    expect(manifest.items[0]).toMatchObject({
      channel: 'website',
      status: 'published',
      assetName: 'event-flyer.jpg',
      assetUrl: flyer.url,
      externalUrl: 'https://example.com/events/night',
    });
  });

  it('escapes quotes and line breaks in CSV output', () => {
    const manifest = buildCampaignManifest({
      eventId: 'evt-night',
      eventTitle: 'Noche Oscura',
      content: [
        {
          ...content[1],
          body: 'Tonight: "Noche Oscura"\nReserve now.',
        },
      ],
      brief,
      assembly,
      assets: [flyer],
      execution: emptyPublishingExecution('evt-night'),
    });

    const csv = manifestToCsv(manifest);
    expect(csv).toContain('"Tonight: ""Noche Oscura""\nReserve now."');
    expect(csv).toContain('"Reservation URL"');
  });
});
