import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  buildPublishingIdempotencyKey,
  buildTrackedCampaignUrl,
  stablePublishingVersion,
} from '../lib/admin/autopilot/domain';
import {
  MetaPublishingError,
  publishInstagramImage,
} from '../lib/admin/autopilot/server/meta';
import { InstagramImagePublishRequestSchema } from '../lib/admin/autopilot/validation';

beforeEach(() => {
  vi.stubEnv('META_GRAPH_API_VERSION', 'v24.0');
  vi.stubEnv('META_INSTAGRAM_ACCOUNT_ID', '17841400000000000');
  vi.stubEnv('META_PAGE_ACCESS_TOKEN', 'test-token-that-is-long-enough');
  vi.stubEnv('META_PUBLISH_ENABLED', 'true');
  vi.stubEnv('META_GRAPH_BASE_URL', 'https://graph.test');
});

describe('controlled Instagram publication boundary', () => {
  it('requires HTTPS media and explicit live confirmation', () => {
    const valid = InstagramImagePublishRequestSchema.safeParse({
      eventId: 'evt-1',
      contentItemId: 'instagram-feed-1',
      caption: 'Tonight at Club Bahia.',
      imageUrl: 'https://assets.example.com/flyer.jpg',
      reservationUrl: 'https://example.com/reserve',
      confirmation: 'PUBLISH_NOW',
    });
    expect(valid.success).toBe(true);

    expect(
      InstagramImagePublishRequestSchema.safeParse({
        eventId: 'evt-1',
        contentItemId: 'instagram-feed-1',
        caption: 'Tonight at Club Bahia.',
        imageUrl: 'http://assets.example.com/flyer.jpg',
        confirmation: 'PUBLISH_NOW',
      }).success,
    ).toBe(false);
    expect(
      InstagramImagePublishRequestSchema.safeParse({
        eventId: 'evt-1',
        contentItemId: 'instagram-feed-1',
        caption: 'Tonight at Club Bahia.',
        imageUrl: 'https://assets.example.com/flyer.jpg',
      }).success,
    ).toBe(false);
  });

  it('derives stable versions, tracking links, and duplicate keys', () => {
    const contentVersion = stablePublishingVersion('Caption A');
    const mediaVersion = stablePublishingVersion('https://example.com/a.jpg');
    expect(contentVersion).toBe(stablePublishingVersion('Caption A'));
    expect(contentVersion).not.toBe(stablePublishingVersion('Caption B'));

    const key = buildPublishingIdempotencyKey({
      eventId: 'evt-1',
      provider: 'meta',
      contentItemId: 'instagram-feed-1',
      contentVersion,
      mediaVersion,
    });
    expect(key).toContain('evt-1:meta:instagram-feed-1');

    const tracked = new URL(
      buildTrackedCampaignUrl('https://club-bahia.example/reservations', {
        source: 'instagram',
        medium: 'feed',
        campaign: 'Darkwave Thursday',
        content: 'announcement-v1',
      }),
    );
    expect(tracked.searchParams.get('utm_source')).toBe('instagram');
    expect(tracked.searchParams.get('utm_campaign')).toBe('darkwave-thursday');
  });

  it('creates a media container, publishes it, and reads the permalink', async () => {
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    const responses = [
      new Response(JSON.stringify({ id: 'container-1' }), { status: 200 }),
      new Response(JSON.stringify({ id: 'media-1' }), { status: 200 }),
      new Response(
        JSON.stringify({
          id: 'media-1',
          permalink: 'https://www.instagram.com/p/example/',
          timestamp: '2026-07-14T12:00:00+0000',
        }),
        { status: 200 },
      ),
    ];
    const fetchImpl = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      requests.push({ url: String(url), init });
      const response = responses.shift();
      if (!response) throw new Error('Unexpected request');
      return response;
    });

    const publication = await publishInstagramImage(
      {
        imageUrl: 'https://assets.example.com/flyer.jpg',
        caption: 'Tonight at Club Bahia.',
      },
      fetchImpl,
    );

    expect(publication).toMatchObject({
      providerPublicationId: 'media-1',
      permalink: 'https://www.instagram.com/p/example/',
    });
    expect(requests).toHaveLength(3);
    expect(requests[0]?.url).toContain('/v24.0/17841400000000000/media');
    expect(String(requests[0]?.init?.body)).toContain('image_url=');
    expect(requests[1]?.url).toContain('/media_publish');
    expect(requests[2]?.url).toContain('fields=id,permalink,timestamp');
    expect(new Headers(requests[0]?.init?.headers).get('authorization')).toBe(
      'Bearer test-token-that-is-long-enough',
    );
  });

  it('labels container creation failures before any live publication exists', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          error: {
            message: 'Unsupported image format',
            code: 100,
            error_subcode: 2207052,
            fbtrace_id: 'trace-1',
          },
        }),
        { status: 400 },
      ),
    );

    await expect(
      publishInstagramImage(
        {
          imageUrl: 'https://assets.example.com/flyer.jpg',
          caption: 'Tonight at Club Bahia.',
        },
        fetchImpl,
      ),
    ).rejects.toMatchObject<Partial<MetaPublishingError>>({
      stage: 'create-container',
      status: 400,
      providerCode: 100,
      providerSubcode: 2207052,
      traceId: 'trace-1',
    });
  });
});
