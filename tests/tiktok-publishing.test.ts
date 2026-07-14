import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  getTikTokPostStatus,
  initializeTikTokVideoPost,
  queryTikTokCreatorInfo,
  TikTokPublishingError,
} from '../lib/admin/autopilot/server/tiktok';
import {
  TikTokPrivateVideoPublishRequestSchema,
  TikTokPublicationStatusRequestSchema,
} from '../lib/admin/autopilot/validation';

beforeEach(() => {
  vi.stubEnv('TIKTOK_ACCESS_TOKEN', 'test-tiktok-access-token-long-enough');
  vi.stubEnv('TIKTOK_VERIFIED_MEDIA_HOST', 'media.clubbahia.example');
  vi.stubEnv('TIKTOK_CONTENT_POSTING_ENABLED', 'true');
  vi.stubEnv('TIKTOK_APP_AUDITED', 'true');
  vi.stubEnv('TIKTOK_API_BASE_URL', 'https://tiktok.test');
});

describe('guarded TikTok Content Posting adapter', () => {
  it('requires an HTTPS video and explicit private-test confirmation', () => {
    expect(
      TikTokPrivateVideoPublishRequestSchema.safeParse({
        eventId: 'evt-1',
        contentItemId: 'reel-tiktok-video',
        caption: 'Tonight at Club Bahia #ClubBahia',
        videoUrl: 'https://media.clubbahia.example/events/night.mp4',
        confirmation: 'PUBLISH_PRIVATE_TEST',
      }).success,
    ).toBe(true);

    expect(
      TikTokPrivateVideoPublishRequestSchema.safeParse({
        eventId: 'evt-1',
        contentItemId: 'reel-tiktok-video',
        caption: 'Tonight at Club Bahia',
        videoUrl: 'http://media.clubbahia.example/events/night.mp4',
        confirmation: 'PUBLISH_PRIVATE_TEST',
      }).success,
    ).toBe(false);

    expect(
      TikTokPrivateVideoPublishRequestSchema.safeParse({
        eventId: 'evt-1',
        contentItemId: 'reel-tiktok-video',
        caption: 'Tonight at Club Bahia',
        videoUrl: 'https://media.clubbahia.example/events/night.mp4',
      }).success,
    ).toBe(false);
  });

  it('validates the durable status-refresh identity', () => {
    expect(
      TikTokPublicationStatusRequestSchema.safeParse({
        idempotencyKey:
          'evt-1:tiktok:reel-tiktok-video:c123:m456:publish-now',
        confirmation: 'CHECK_STATUS',
      }).success,
    ).toBe(true);
    expect(
      TikTokPublicationStatusRequestSchema.safeParse({
        idempotencyKey: '../../receipt',
        confirmation: 'CHECK_STATUS',
      }).success,
    ).toBe(false);
  });

  it('queries current creator settings before publishing', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          data: {
            creator_username: 'clubbahia',
            creator_nickname: 'Club Bahia',
            privacy_level_options: [
              'PUBLIC_TO_EVERYONE',
              'MUTUAL_FOLLOW_FRIENDS',
              'SELF_ONLY',
            ],
            comment_disabled: false,
            duet_disabled: false,
            stitch_disabled: true,
            max_video_post_duration_sec: 300,
          },
          error: { code: 'ok', message: '', log_id: 'creator-log' },
        }),
        { status: 200 },
      ),
    );

    const creator = await queryTikTokCreatorInfo(fetchImpl);
    expect(creator).toMatchObject({
      username: 'clubbahia',
      privacyLevelOptions: ['PUBLIC_TO_EVERYONE', 'MUTUAL_FOLLOW_FRIENDS', 'SELF_ONLY'],
      stitchDisabled: true,
      maxVideoPostDurationSec: 300,
    });
    expect(String(fetchImpl.mock.calls[0]?.[0])).toContain(
      '/v2/post/publish/creator_info/query/',
    );
  });

  it('can verify the creator before a media hostname is configured', async () => {
    vi.stubEnv('TIKTOK_VERIFIED_MEDIA_HOST', '');
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          data: {
            creator_username: 'clubbahia',
            privacy_level_options: ['SELF_ONLY'],
            comment_disabled: true,
            duet_disabled: true,
            stitch_disabled: true,
            max_video_post_duration_sec: 60,
          },
          error: { code: 'ok', message: '', log_id: 'creator-log' },
        }),
        { status: 200 },
      ),
    );

    await expect(queryTikTokCreatorInfo(fetchImpl)).resolves.toMatchObject({
      username: 'clubbahia',
      privacyLevelOptions: ['SELF_ONLY'],
    });
  });

  it('initializes a pull-from-URL video using an allowed creator privacy level', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          data: { publish_id: 'v_pub_url~v2.123' },
          error: { code: 'ok', message: '', log_id: 'publish-log' },
        }),
        { status: 200 },
      ),
    );

    const publication = await initializeTikTokVideoPost(
      {
        videoUrl: 'https://media.clubbahia.example/events/darkwave.mp4',
        title: 'Darkwave Thursday at Club Bahia #ClubBahia',
        privacyLevel: 'SELF_ONLY',
        disableComment: true,
        disableDuet: true,
        disableStitch: true,
      },
      {
        username: 'clubbahia',
        privacyLevelOptions: ['PUBLIC_TO_EVERYONE', 'SELF_ONLY'],
        commentDisabled: false,
        duetDisabled: false,
        stitchDisabled: true,
        maxVideoPostDurationSec: 300,
      },
      fetchImpl,
    );

    expect(publication.publishId).toBe('v_pub_url~v2.123');
    const request = fetchImpl.mock.calls[0];
    expect(String(request?.[0])).toContain('/v2/post/publish/video/init/');
    const body = JSON.parse(String(request?.[1]?.body));
    expect(body).toMatchObject({
      post_info: {
        privacy_level: 'SELF_ONLY',
        disable_comment: true,
        disable_duet: true,
        disable_stitch: true,
      },
      source_info: {
        source: 'PULL_FROM_URL',
        video_url: 'https://media.clubbahia.example/events/darkwave.mp4',
      },
    });
  });

  it('rejects unverified media hosts and unavailable privacy options', async () => {
    const creator = {
      privacyLevelOptions: ['SELF_ONLY'],
      commentDisabled: false,
      duetDisabled: false,
      stitchDisabled: false,
      maxVideoPostDurationSec: 300,
    };

    await expect(
      initializeTikTokVideoPost(
        {
          videoUrl: 'https://unverified.example/video.mp4',
          title: 'Club Bahia',
          privacyLevel: 'SELF_ONLY',
          disableComment: false,
          disableDuet: false,
          disableStitch: false,
        },
        creator,
        vi.fn(),
      ),
    ).rejects.toMatchObject<Partial<TikTokPublishingError>>({
      stage: 'configuration',
    });

    await expect(
      initializeTikTokVideoPost(
        {
          videoUrl: 'https://media.clubbahia.example/video.mp4',
          title: 'Club Bahia',
          privacyLevel: 'PUBLIC_TO_EVERYONE',
          disableComment: false,
          disableDuet: false,
          disableStitch: false,
        },
        creator,
        vi.fn(),
      ),
    ).rejects.toThrow(/privacy level/i);
  });

  it('reads asynchronous processing status from the publish ID', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          data: {
            status: 'PUBLISH_COMPLETE',
            publicaly_available_post_id: ['7460000000000000000'],
            uploaded_bytes: 123456,
          },
          error: { code: 'ok', message: '', log_id: 'status-log' },
        }),
        { status: 200 },
      ),
    );

    const status = await getTikTokPostStatus('v_pub_url~v2.123', fetchImpl);
    expect(status).toEqual({
      status: 'PUBLISH_COMPLETE',
      failReason: undefined,
      publiclyVisiblePostId: ['7460000000000000000'],
      uploadedBytes: 123456,
    });
  });

  it('surfaces TikTok provider errors even when the HTTP request succeeds', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          data: {},
          error: {
            code: 'scope_not_authorized',
            message: 'video.publish is not authorized',
            log_id: 'error-log',
          },
        }),
        { status: 200 },
      ),
    );

    await expect(queryTikTokCreatorInfo(fetchImpl)).rejects.toMatchObject<
      Partial<TikTokPublishingError>
    >({
      stage: 'query-creator',
      providerCode: 'scope_not_authorized',
      logId: 'error-log',
    });
  });
});
