import { describe, expect, it } from 'vitest';
import type { EventAsset } from '../lib/admin/assets/domain';
import type {
  CampaignBrief,
  CampaignContentItem,
} from '../lib/admin/growth/domain';
import {
  buildPostPackageReadiness,
  isAssetCompatibleWithChannel,
  selectBestAssetForChannel,
  type CampaignPostPackage,
} from '../lib/admin/publishing/domain';

const timestamp = '2026-07-12T05:00:00.000Z';

function asset(overrides: Partial<EventAsset> = {}): EventAsset {
  return {
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
    platforms: ['website', 'instagram-feed', 'facebook'],
    status: 'approved',
    altText: 'Neon event flyer.',
    notes: '',
    rightsConfirmedAt: timestamp,
    uploadedAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}

const brief: CampaignBrief = {
  theme: 'Darkwave campaign',
  targetAudience: 'Alternative nightlife audiences in Los Angeles',
  objective: 'reservations',
  tone: 'cinematic and nocturnal',
  offer: 'Reserve now',
  budgetCents: 20000,
  language: 'bilingual',
  performers: 'Bookthief',
  genres: 'darkwave and goth',
  doorsTime: '8 PM',
  admission: '$15',
  ageRestriction: '18+',
  foodDrinkSpecial: '',
  reservationUrl: 'https://example.com/reservations',
  address: '1130 Sunset Blvd, Los Angeles, CA 90012',
  mainAttraction: 'A neon darkwave dance night',
};

function content(
  overrides: Partial<CampaignContentItem> = {},
): CampaignContentItem {
  return {
    id: 'instagram-feed',
    channel: 'instagram-feed',
    title: 'Instagram launch caption',
    body: 'Club Bahia presents a darkwave night.',
    status: 'approved',
    publishingMode: 'manual',
    publishAt: '2026-07-25T19:00:00.000Z',
    updatedAt: timestamp,
    ...overrides,
  };
}

function postPackage(assetId = 'flyer'): CampaignPostPackage {
  return {
    contentItemId: 'instagram-feed',
    channel: 'instagram-feed',
    assetIds: [assetId],
    primaryAssetId: assetId,
    updatedAt: timestamp,
  };
}

describe('post asset compatibility', () => {
  it('accepts an approved image assigned to Instagram feed', () => {
    expect(isAssetCompatibleWithChannel(asset(), 'instagram-feed')).toBe(true);
  });

  it('requires a finished approved video for Reels', () => {
    expect(isAssetCompatibleWithChannel(asset(), 'reel')).toBe(false);
    expect(
      isAssetCompatibleWithChannel(
        asset({
          id: 'reel',
          name: 'reel.mp4',
          kind: 'video',
          contentType: 'video/mp4',
          role: 'reel-video',
          platforms: ['reel', 'instagram-story'],
        }),
        'reel',
      ),
    ).toBe(true);
  });

  it('does not treat draft media as compatible', () => {
    expect(
      isAssetCompatibleWithChannel(asset({ status: 'draft' }), 'instagram-feed'),
    ).toBe(false);
  });

  it('selects the platform-specific creative over a generic flyer', () => {
    const selected = selectBestAssetForChannel(
      [asset(), asset({ id: 'feed', role: 'feed-creative' })],
      'instagram-feed',
    );
    expect(selected?.id).toBe('feed');
  });
});

describe('post package readiness', () => {
  it('marks an approved post with media, link, and time as ready', () => {
    const result = buildPostPackageReadiness(
      content(),
      brief,
      postPackage(),
      [asset()],
    );
    expect(result.ready).toBe(true);
  });

  it('blocks draft copy', () => {
    const result = buildPostPackageReadiness(
      content({ status: 'draft' }),
      brief,
      postPackage(),
      [asset()],
    );
    expect(result.ready).toBe(false);
    expect(result.checks.find((item) => item.id === 'copy')?.complete).toBe(false);
  });

  it('blocks required media and conversion links when missing', () => {
    const result = buildPostPackageReadiness(
      content(),
      { ...brief, reservationUrl: '' },
      undefined,
      [asset()],
    );
    expect(result.ready).toBe(false);
    expect(result.checks.find((item) => item.id === 'asset')?.complete).toBe(false);
    expect(result.checks.find((item) => item.id === 'link')?.complete).toBe(false);
  });

  it('allows SMS without media', () => {
    const result = buildPostPackageReadiness(
      content({ id: 'sms', channel: 'sms' }),
      brief,
      undefined,
      [],
    );
    expect(result.checks.find((item) => item.id === 'asset')?.complete).toBe(true);
  });
});
