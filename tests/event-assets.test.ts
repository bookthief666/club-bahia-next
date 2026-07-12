import { describe, expect, it } from 'vitest';
import {
  buildEventAssetReadiness,
  EVENT_ASSET_MAX_SIZE_BYTES,
  inferEventAssetKind,
  type EventAsset,
} from '../lib/admin/assets/domain';
import { EventAssetSchema } from '../lib/admin/assets/validation';

function asset(overrides: Partial<EventAsset> = {}): EventAsset {
  const timestamp = '2026-07-12T05:00:00.000Z';
  return {
    id: 'asset-1',
    eventId: 'evt-night',
    name: 'noche-oscura.jpg',
    pathname: 'club-bahia/events/evt-night/assets/asset-1/noche-oscura.jpg',
    url: 'https://example.public.blob.vercel-storage.com/noche-oscura.jpg',
    downloadUrl:
      'https://example.public.blob.vercel-storage.com/noche-oscura.jpg?download=1',
    contentType: 'image/jpeg',
    size: 1_000_000,
    kind: 'image',
    role: 'primary-flyer',
    platforms: ['website', 'instagram-feed', 'facebook'],
    status: 'draft',
    altText: '',
    notes: '',
    rightsConfirmedAt: timestamp,
    uploadedAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}

describe('event asset domain', () => {
  it('infers the major supported media kinds', () => {
    expect(inferEventAssetKind('image/png')).toBe('image');
    expect(inferEventAssetKind('video/mp4')).toBe('video');
    expect(inferEventAssetKind('audio/mpeg')).toBe('audio');
    expect(inferEventAssetKind('application/pdf')).toBe('document');
  });

  it('requires approved assets before media readiness is complete', () => {
    const draftReadiness = buildEventAssetReadiness([asset()]);
    expect(draftReadiness.find((item) => item.id === 'primary-flyer')?.complete).toBe(
      false,
    );

    const approvedReadiness = buildEventAssetReadiness([
      asset({ status: 'approved' }),
    ]);
    expect(
      approvedReadiness.find((item) => item.id === 'primary-flyer')?.complete,
    ).toBe(true);
  });

  it('recognizes approved story and reel assignments', () => {
    const readiness = buildEventAssetReadiness([
      asset({
        id: 'story',
        status: 'approved',
        role: 'story-creative',
        platforms: ['instagram-story'],
      }),
      asset({
        id: 'reel',
        name: 'reel.mp4',
        contentType: 'video/mp4',
        kind: 'video',
        status: 'approved',
        role: 'reel-video',
        platforms: ['reel'],
      }),
    ]);

    expect(readiness.find((item) => item.id === 'story')?.complete).toBe(true);
    expect(readiness.find((item) => item.id === 'reel')?.complete).toBe(true);
  });
});

describe('event asset validation', () => {
  it('accepts a valid cloud asset record', () => {
    expect(EventAssetSchema.safeParse(asset()).success).toBe(true);
  });

  it('rejects unsupported content types and oversized files', () => {
    expect(
      EventAssetSchema.safeParse(asset({ contentType: 'application/zip' })).success,
    ).toBe(false);
    expect(
      EventAssetSchema.safeParse(asset({ size: EVENT_ASSET_MAX_SIZE_BYTES + 1 }))
        .success,
    ).toBe(false);
  });
});
