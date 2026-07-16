import { describe, expect, it } from 'vitest';
import type { OperationsEvent } from '../lib/admin/domain';
import type { MediaLibraryAsset } from '../lib/admin/assets/library-domain';
import { normalizeLibraryTags } from '../lib/admin/assets/library-domain';
import { buildMediaRecommendationLanes } from '../lib/admin/assets/library-recommendations';
import { EventAssetSchema } from '../lib/admin/assets/validation';
import { MediaLibraryAssetSchema } from '../lib/admin/assets/library-validation';
import { getRecurringEventTemplate } from '../lib/admin/event-templates/domain';

function event(): OperationsEvent {
  return {
    id: 'evt-azucar-friday',
    title: 'Azucar LA — Friday, August 14',
    concept: 'Live cumbia, salsa, bachata, and dancing at Club Bahia.',
    startsAt: '2026-08-15T04:00:00.000Z',
    endsAt: '2026-08-15T08:00:00.000Z',
    status: 'approved',
    room: 'Main room',
    capacityTarget: 250,
    ticketsSold: 0,
    owner: 'Luis',
    marketingLaunchAt: '2026-08-07T19:00:00.000Z',
    riskFlags: [],
    revenueTarget: 0,
    committedCosts: 0,
    performers: 'Azucar LA',
    genres: 'cumbia, salsa, bachata',
    promotionTemplate: getRecurringEventTemplate('azucar-friday'),
  };
}

function asset(
  overrides: Partial<MediaLibraryAsset> & Pick<MediaLibraryAsset, 'id' | 'name'>,
): MediaLibraryAsset {
  return {
    schemaVersion: 1,
    id: overrides.id,
    sourceEventId: 'evt-source',
    sourceAssetId: `source-${overrides.id}`,
    name: overrides.name,
    pathname: `club-bahia/events/evt-source/assets/${overrides.id}/file.jpg`,
    url: `https://example.com/${overrides.id}.jpg`,
    downloadUrl: `https://example.com/${overrides.id}.jpg?download=1`,
    contentType: 'image/jpeg',
    size: 1024,
    kind: 'image',
    role: 'feed-creative',
    platforms: ['instagram-feed'],
    status: 'active',
    altText: 'Guests dancing during a live Club Bahia performance.',
    notes: '',
    collections: ['club-bahia-evergreen'],
    tags: [],
    performers: [],
    genres: [],
    orientation: 'portrait',
    qualityRating: 3,
    rightsBasis: 'club-bahia-owned',
    rightsNote: 'Club Bahia promotional archive.',
    credit: '',
    rightsConfirmedAt: '2026-06-01T00:00:00.000Z',
    usageHistory: [],
    usageCount: 0,
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('reusable media library', () => {
  it('prioritizes a recurring-night collection match over generic media', () => {
    const generic = asset({
      id: 'generic',
      name: 'Generic venue image',
      qualityRating: 5,
    });
    const azucar = asset({
      id: 'azucar',
      name: 'Azucar dance floor',
      collections: ['azucar-friday', 'crowd-energy'],
      tags: ['cumbia', 'dancing'],
      performers: ['Azucar LA'],
      qualityRating: 4,
    });

    const feed = buildMediaRecommendationLanes({
      event: event(),
      assets: [generic, azucar],
      now: new Date('2026-08-01T00:00:00.000Z'),
    }).find((lane) => lane.id === 'instagram-feed');

    expect(feed?.recommendations[0].asset.id).toBe('azucar');
    expect(feed?.recommendations[0].reasons).toContain(
      'Matches this recurring-night template',
    );
  });

  it('penalizes recently reused media', () => {
    const recent = asset({
      id: 'recent',
      name: 'Recent image',
      collections: ['azucar-friday'],
      lastUsedAt: '2026-07-30T00:00:00.000Z',
      usageCount: 4,
    });
    const fresh = asset({
      id: 'fresh',
      name: 'Fresh image',
      collections: ['azucar-friday'],
      usageCount: 0,
    });

    const feed = buildMediaRecommendationLanes({
      event: event(),
      assets: [recent, fresh],
      now: new Date('2026-08-01T00:00:00.000Z'),
    }).find((lane) => lane.id === 'instagram-feed');

    expect(feed?.recommendations[0].asset.id).toBe('fresh');
    expect(
      feed?.recommendations.find((item) => item.asset.id === 'recent')?.warnings,
    ).toContain('Used within the last 7 days');
  });

  it('keeps image assets out of the vertical-video lane', () => {
    const image = asset({ id: 'image', name: 'Poster image' });
    const video = asset({
      id: 'video',
      name: 'Vertical crowd clip',
      pathname: 'club-bahia/events/source/video.mp4',
      url: 'https://example.com/video.mp4',
      downloadUrl: 'https://example.com/video.mp4?download=1',
      contentType: 'video/mp4',
      kind: 'video',
      role: 'reel-video',
      platforms: ['reel', 'tiktok'],
      orientation: 'vertical-video',
    });

    const vertical = buildMediaRecommendationLanes({
      event: event(),
      assets: [image, video],
    }).find((lane) => lane.id === 'vertical-video');

    expect(vertical?.recommendations.map((item) => item.asset.id)).toEqual(['video']);
  });

  it('normalizes and deduplicates reusable tags', () => {
    expect(
      normalizeLibraryTags(['Crowd Energy', 'crowd   energy', ' Salsa ', '']),
    ).toEqual(['crowd-energy', 'salsa']);
  });

  it('validates library metadata and event references to canonical media', () => {
    const library = asset({ id: 'valid', name: 'Valid media' });
    expect(MediaLibraryAssetSchema.safeParse(library).success).toBe(true);

    expect(
      EventAssetSchema.safeParse({
        id: 'reuse-valid-1',
        eventId: 'evt-target',
        name: library.name,
        pathname: library.pathname,
        url: library.url,
        downloadUrl: library.downloadUrl,
        contentType: 'image/jpeg',
        size: library.size,
        kind: 'image',
        role: 'feed-creative',
        platforms: ['instagram-feed'],
        status: 'approved',
        altText: library.altText,
        notes: 'Reused from canonical media.',
        rightsConfirmedAt: library.rightsConfirmedAt,
        uploadedAt: '2026-08-01T00:00:00.000Z',
        updatedAt: '2026-08-01T00:00:00.000Z',
        sourceLibraryAssetId: library.id,
      }).success,
    ).toBe(true);
  });
});
