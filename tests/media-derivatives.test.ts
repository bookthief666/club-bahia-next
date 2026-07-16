import { describe, expect, it } from 'vitest';
import type { OperationsEvent } from '../lib/admin/domain';
import {
  approvedDerivativeForPlatform,
  calculateMediaCoverCrop,
  derivativeReadinessCount,
  findMediaDerivative,
  MEDIA_DERIVATIVE_PRESETS,
  type MediaDerivative,
} from '../lib/admin/assets/derivatives';
import type { MediaLibraryAsset } from '../lib/admin/assets/library-domain';
import { buildMediaRecommendationLanes } from '../lib/admin/assets/library-recommendations';
import { MediaLibraryAssetSchema } from '../lib/admin/assets/library-validation';
import {
  buildDefaultMediaOverlay,
  mediaDerivativeRecordId,
  mediaOverlayIsComplete,
  mediaOverlayVariantKey,
  type MediaOverlayRecipe,
} from '../lib/admin/assets/overlays';
import { EventAssetSchema } from '../lib/admin/assets/validation';

const NOW = '2026-07-16T00:00:00.000Z';

function derivative(
  presetId: MediaDerivative['presetId'],
  status: MediaDerivative['status'] = 'approved',
  overlay?: MediaOverlayRecipe,
): MediaDerivative {
  const preset = MEDIA_DERIVATIVE_PRESETS.find((item) => item.id === presetId)!;
  const variantKey = mediaOverlayVariantKey(overlay);
  return {
    id: mediaDerivativeRecordId({ assetId: 'media-one', presetId, overlay }),
    presetId,
    sourceAssetId: 'media-one',
    variantKey,
    overlay,
    pathname: `club-bahia/media/${presetId}/${variantKey}.jpg`,
    url: `https://assets.example.com/${presetId}/${variantKey}.jpg`,
    downloadUrl: `https://assets.example.com/${presetId}/${variantKey}.jpg?download=1`,
    contentType: 'image/jpeg',
    size: 120000,
    width: preset.width,
    height: preset.height,
    focalX: 0.5,
    focalY: 0.5,
    zoom: 1,
    status,
    createdAt: NOW,
    updatedAt: NOW,
  };
}

function libraryAsset(overrides: Partial<MediaLibraryAsset> = {}): MediaLibraryAsset {
  return {
    schemaVersion: 1,
    id: 'media-one',
    sourceEventId: 'event-source',
    sourceAssetId: 'asset-source',
    name: 'Azucar crowd portrait.jpg',
    pathname: 'club-bahia/events/source/image.jpg',
    url: 'https://assets.example.com/image.jpg',
    downloadUrl: 'https://assets.example.com/image.jpg?download=1',
    contentType: 'image/jpeg',
    size: 900000,
    kind: 'image',
    role: 'feed-creative',
    platforms: ['instagram-feed', 'instagram-story', 'website'],
    status: 'active',
    altText: 'A crowded Club Bahia dance floor during Azucar LA.',
    notes: '',
    collections: ['azucar-friday'],
    tags: ['azucar', 'crowd', 'dancing'],
    performers: ['Azucar LA'],
    genres: ['cumbia', 'salsa'],
    orientation: 'portrait',
    width: 1200,
    height: 1600,
    qualityRating: 5,
    rightsBasis: 'club-bahia-owned',
    rightsNote: 'Club Bahia staff photo.',
    credit: 'Club Bahia',
    rightsConfirmedAt: NOW,
    derivatives: [],
    usageHistory: [],
    usageCount: 0,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function event(overrides: Partial<OperationsEvent> = {}): OperationsEvent {
  return {
    id: 'event-friday',
    title: 'Azucar LA — Friday, July 17',
    concept: 'Live cumbia, salsa, bachata, and Latin dance music.',
    startsAt: '2026-07-18T04:00:00.000Z',
    endsAt: '2026-07-18T08:00:00.000Z',
    status: 'approved',
    room: 'Main room',
    capacityTarget: 250,
    ticketsSold: 0,
    owner: 'Luis',
    marketingLaunchAt: NOW,
    riskFlags: [],
    revenueTarget: 0,
    committedCosts: 0,
    performers: 'Azucar LA',
    genres: 'cumbia, salsa, bachata',
    promotionTemplate: {
      schemaVersion: 1,
      id: 'azucar-friday',
      name: 'Azucar LA — Friday',
      summary: 'Recurring resident night',
      eventTitleBase: 'Azucar LA',
      concept: 'Live Latin dance music.',
      preferredWeekday: 5,
      startTime: '21:00',
      room: 'Main room',
      performers: 'Azucar LA',
      genres: 'cumbia, salsa, bachata',
      admission: '',
      ageRestriction: '',
      targetAudience: 'Latin nightlife audience',
      tone: 'warm and energetic',
      offer: 'Reserve your Friday night',
      language: 'bilingual',
      cadence: 'resident-weekend',
      hashtags: { branded: [], localDiscovery: [], musicCommunity: [] },
      visualDirection: 'Warm live-band energy.',
      preferredMediaRoles: [],
    },
    ...overrides,
  };
}

describe('platform media derivatives', () => {
  it('defines unique presets with positive output dimensions', () => {
    expect(new Set(MEDIA_DERIVATIVE_PRESETS.map((preset) => preset.id)).size).toBe(
      MEDIA_DERIVATIVE_PRESETS.length,
    );
    expect(
      MEDIA_DERIVATIVE_PRESETS.every(
        (preset) => preset.width > 0 && preset.height > 0,
      ),
    ).toBe(true);
  });

  it('calculates a centered cover crop without stretching the source', () => {
    const crop = calculateMediaCoverCrop({
      sourceWidth: 2000,
      sourceHeight: 1000,
      targetWidth: 1080,
      targetHeight: 1350,
    });
    expect(crop.sourceHeight).toBe(1000);
    expect(crop.sourceWidth).toBeCloseTo(800);
    expect(crop.sourceX).toBeCloseTo(600);
    expect(crop.sourceY).toBe(0);
  });

  it('clamps focal points and applies zoom safely', () => {
    const crop = calculateMediaCoverCrop({
      sourceWidth: 1000,
      sourceHeight: 1000,
      targetWidth: 1000,
      targetHeight: 1000,
      focalX: 2,
      focalY: -1,
      zoom: 2,
    });
    expect(crop.sourceWidth).toBe(500);
    expect(crop.sourceHeight).toBe(500);
    expect(crop.sourceX).toBe(500);
    expect(crop.sourceY).toBe(0);
  });

  it('keeps old catalog records readable by defaulting derivatives to an empty list', () => {
    const legacy = libraryAsset();
    delete legacy.derivatives;
    const parsed = MediaLibraryAssetSchema.parse(legacy);
    expect(parsed.derivatives).toEqual([]);
  });

  it('selects approved feed, Story, and website versions but never a draft', () => {
    const derivatives = [
      derivative('instagram-feed-portrait'),
      derivative('instagram-story'),
      derivative('website-hero', 'draft'),
    ];
    expect(
      approvedDerivativeForPlatform({ derivatives, platform: 'instagram-feed' })
        ?.presetId,
    ).toBe('instagram-feed-portrait');
    expect(
      approvedDerivativeForPlatform({ derivatives, platform: 'instagram-story' })
        ?.presetId,
    ).toBe('instagram-story');
    expect(
      approvedDerivativeForPlatform({ derivatives, platform: 'website' }),
    ).toBeUndefined();
  });

  it('builds complete Azucar overlay defaults from event facts', () => {
    const overlay = buildDefaultMediaOverlay(
      event(),
      'instagram-feed-portrait',
    );
    expect(overlay.styleId).toBe('azucar-warm');
    expect(overlay.title).toContain('Azucar LA');
    expect(overlay.dateLabel).toBe('Friday, July 17');
    expect(overlay.timeLabel).toBe('9:00 PM');
    expect(overlay.cta).toBe('Reserve your Friday night');
    expect(mediaOverlayIsComplete(overlay)).toBe(true);
  });

  it('keeps clean and event-branded variants separate for the same preset', () => {
    const overlay = buildDefaultMediaOverlay(
      event(),
      'instagram-feed-portrait',
    );
    const derivatives = [
      derivative('instagram-feed-portrait'),
      derivative('instagram-feed-portrait', 'approved', overlay),
    ];
    expect(
      findMediaDerivative({
        derivatives,
        presetId: 'instagram-feed-portrait',
        variantKey: 'base',
      })?.overlay,
    ).toBeUndefined();
    expect(
      findMediaDerivative({
        derivatives,
        presetId: 'instagram-feed-portrait',
        variantKey: 'event-event-friday',
      })?.overlay?.eventId,
    ).toBe('event-friday');
    expect(derivativeReadinessCount(derivatives, 'base')).toBe(1);
    expect(derivativeReadinessCount(derivatives, 'event-event-friday')).toBe(1);
  });

  it('prefers a branded derivative for the current event and ignores another event', () => {
    const currentOverlay = buildDefaultMediaOverlay(
      event(),
      'instagram-feed-portrait',
    );
    const otherOverlay = {
      ...currentOverlay,
      eventId: 'event-saturday',
      title: 'Azucar LA — Saturday',
    };
    const derivatives = [
      derivative('instagram-feed-portrait'),
      derivative('instagram-feed-portrait', 'approved', otherOverlay),
      derivative('instagram-feed-portrait', 'approved', currentOverlay),
    ];
    expect(
      approvedDerivativeForPlatform({
        derivatives,
        platform: 'instagram-feed',
        eventId: 'event-friday',
      })?.overlay?.eventId,
    ).toBe('event-friday');
    expect(
      approvedDerivativeForPlatform({
        derivatives,
        platform: 'instagram-feed',
        eventId: 'event-unknown',
      })?.variantKey,
    ).toBe('base');
  });

  it('boosts an approved event-branded graphic above an otherwise equal original', () => {
    const originalOnly = libraryAsset({ id: 'original-only', name: 'Original only' });
    const brandedOverlay = buildDefaultMediaOverlay(
      event(),
      'instagram-feed-portrait',
    );
    const prepared = libraryAsset({
      id: 'prepared',
      name: 'Prepared',
      derivatives: [derivative('instagram-feed-portrait', 'approved', brandedOverlay)],
    });
    const feed = buildMediaRecommendationLanes({
      event: event(),
      assets: [originalOnly, prepared],
      now: new Date(NOW),
    }).find((lane) => lane.id === 'instagram-feed');
    expect(feed?.recommendations[0].asset.id).toBe('prepared');
    expect(feed?.recommendations[0].reasons).toContain(
      'Approved graphic is branded for this event',
    );
  });

  it('validates overlay recipes and event assignments that preserve derivative references', () => {
    const overlay = buildDefaultMediaOverlay(
      event(),
      'instagram-feed-portrait',
    );
    const parsedLibrary = MediaLibraryAssetSchema.parse(
      libraryAsset({
        derivatives: [derivative('instagram-feed-portrait', 'approved', overlay)],
      }),
    );
    expect(parsedLibrary.derivatives[0].overlay?.eventId).toBe('event-friday');

    const parsed = EventAssetSchema.parse({
      id: 'reuse-one',
      eventId: 'event-one',
      name: 'Prepared feed image',
      pathname: 'club-bahia/media/feed.jpg',
      url: 'https://assets.example.com/feed.jpg',
      downloadUrl: 'https://assets.example.com/feed.jpg?download=1',
      contentType: 'image/jpeg',
      size: 120000,
      kind: 'image',
      role: 'feed-creative',
      platforms: ['instagram-feed'],
      status: 'approved',
      altText: 'Prepared Club Bahia feed image.',
      notes: '',
      rightsConfirmedAt: NOW,
      uploadedAt: NOW,
      updatedAt: NOW,
      width: 1080,
      height: 1350,
      sourceLibraryAssetId: 'media-one',
      sourceLibraryDerivativeId: 'media-one-instagram-feed-portrait-event-event-friday',
    });
    expect(parsed.sourceLibraryDerivativeId).toContain('event-event-friday');
  });
});
