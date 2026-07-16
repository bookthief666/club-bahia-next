import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  InstagramReelCommitRequestSchema,
  InstagramReelInitializeRequestSchema,
  InstagramReelStatusRequestSchema,
} from '../lib/admin/autopilot/reel-validation';
import {
  getInstagramReelContainerStatus,
  initializeInstagramReel,
  InstagramReelPublishingError,
  publishInstagramReelContainer,
} from '../lib/admin/autopilot/server/meta-reels';

beforeEach(() => {
  vi.stubEnv('META_GRAPH_API_VERSION', 'v24.0');
  vi.stubEnv('META_INSTAGRAM_ACCOUNT_ID', '17841400000000000');
  vi.stubEnv('META_PAGE_ACCESS_TOKEN', 'test-token-that-is-long-enough');
  vi.stubEnv('META_PUBLISH_ENABLED', 'true');
  vi.stubEnv('META_REELS_PROOF_ENABLED', 'true');
  vi.stubEnv('META_GRAPH_BASE_URL', 'https://graph.test');
});

describe('controlled Instagram Reel proof', () => {
  it('requires HTTPS video and separate confirmations for each phase', () => {
    expect(
      InstagramReelInitializeRequestSchema.safeParse({
        eventId: 'evt-1',
        contentItemId: 'reel-1',
        caption: 'Tonight at Club Bahia.',
        videoUrl: 'https://assets.example.com/reel.mp4',
        shareToFeed: true,
        confirmation: 'CREATE_REEL_CONTAINER',
      }).success,
    ).toBe(true);
    expect(
      InstagramReelInitializeRequestSchema.safeParse({
        eventId: 'evt-1',
        contentItemId: 'reel-1',
        caption: 'Tonight at Club Bahia.',
        videoUrl: 'http://assets.example.com/reel.mp4',
        confirmation: 'CREATE_REEL_CONTAINER',
      }).success,
    ).toBe(false);
    expect(
      InstagramReelStatusRequestSchema.safeParse({
        idempotencyKey: 'evt-1:meta:reel-1:c1:m1:publish-now',
        confirmation: 'CHECK_REEL_STATUS',
      }).success,
    ).toBe(true);
    expect(
      InstagramReelCommitRequestSchema.safeParse({
        idempotencyKey: 'evt-1:meta:reel-1:c1:m1:publish-now',
        confirmation: 'PUBLISH_READY_REEL',
      }).success,
    ).toBe(true);
  });

  it('creates a Reel container without publishing it', async () => {
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    const fetchImpl = vi.fn(
      async (url: string | URL | Request, init?: RequestInit) => {
        requests.push({ url: String(url), init });
        return new Response(JSON.stringify({ id: 'reel-container-1' }), {
          status: 200,
        });
      },
    );

    const container = await initializeInstagramReel(
      {
        videoUrl: 'https://assets.example.com/reel.mp4',
        caption: 'Tonight at Club Bahia.',
        shareToFeed: true,
      },
      fetchImpl,
    );

    expect(container.creationId).toBe('reel-container-1');
    expect(requests).toHaveLength(1);
    expect(requests[0]?.url).toContain('/17841400000000000/media');
    expect(String(requests[0]?.init?.body)).toContain('media_type=REELS');
    expect(String(requests[0]?.init?.body)).toContain('video_url=');
    expect(String(requests[0]?.init?.body)).toContain('share_to_feed=true');
    expect(requests[0]?.url).not.toContain('media_publish');
  });

  it('reports when Meta has finished processing the Reel container', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          id: 'reel-container-1',
          status_code: 'FINISHED',
          status: 'Finished',
        }),
        { status: 200 },
      ),
    );

    const status = await getInstagramReelContainerStatus(
      'reel-container-1',
      fetchImpl,
    );

    expect(status).toMatchObject({
      creationId: 'reel-container-1',
      statusCode: 'FINISHED',
      readyToPublish: true,
      failed: false,
    });
  });

  it('publishes only a ready container and then reads the live permalink', async () => {
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    const responses = [
      new Response(JSON.stringify({ id: 'reel-media-1' }), { status: 200 }),
      new Response(
        JSON.stringify({
          id: 'reel-media-1',
          permalink: 'https://www.instagram.com/reel/example/',
          timestamp: '2026-07-15T12:00:00+0000',
        }),
        { status: 200 },
      ),
    ];
    const fetchImpl = vi.fn(
      async (url: string | URL | Request, init?: RequestInit) => {
        requests.push({ url: String(url), init });
        const response = responses.shift();
        if (!response) throw new Error('Unexpected request');
        return response;
      },
    );

    const publication = await publishInstagramReelContainer(
      'reel-container-1',
      fetchImpl,
    );

    expect(publication).toMatchObject({
      providerPublicationId: 'reel-media-1',
      permalink: 'https://www.instagram.com/reel/example/',
    });
    expect(requests[0]?.url).toContain('/media_publish');
    expect(String(requests[0]?.init?.body)).toContain(
      'creation_id=reel-container-1',
    );
    expect(requests[1]?.url).toContain('fields=id,permalink,timestamp');
  });

  it('classifies Meta processing-status failures separately from publishing', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          error: {
            message: 'Container not found',
            code: 100,
            error_subcode: 2207027,
            fbtrace_id: 'trace-reel-1',
          },
        }),
        { status: 400 },
      ),
    );

    await expect(
      getInstagramReelContainerStatus('missing-container', fetchImpl),
    ).rejects.toMatchObject<Partial<InstagramReelPublishingError>>({
      stage: 'read-container',
      status: 400,
      providerCode: 100,
      providerSubcode: 2207027,
      traceId: 'trace-reel-1',
    });
  });
});
