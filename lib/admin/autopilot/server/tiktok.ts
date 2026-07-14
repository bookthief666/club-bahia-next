import 'server-only';

export type TikTokPublishingStage =
  | 'configuration'
  | 'query-creator'
  | 'init-video'
  | 'read-status';

export class TikTokPublishingError extends Error {
  readonly name = 'TikTokPublishingError';

  constructor(
    message: string,
    readonly stage: TikTokPublishingStage,
    readonly providerCode?: string,
    readonly logId?: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

export interface TikTokPublishingConfiguration {
  accessToken: string;
  enabled: boolean;
  audited: boolean;
  verifiedMediaHost: string;
}

export interface TikTokCreatorInfo {
  username?: string;
  nickname?: string;
  privacyLevelOptions: string[];
  commentDisabled: boolean;
  duetDisabled: boolean;
  stitchDisabled: boolean;
  maxVideoPostDurationSec: number;
}

export interface TikTokVideoPostInput {
  videoUrl: string;
  title: string;
  privacyLevel: string;
  disableComment: boolean;
  disableDuet: boolean;
  disableStitch: boolean;
  videoCoverTimestampMs?: number;
}

export interface TikTokVideoPublication {
  publishId: string;
}

export interface TikTokPostStatus {
  status: string;
  failReason?: string;
  publiclyVisiblePostId?: string[];
  uploadedBytes?: number;
}

type FetchLike = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

export function getTikTokPublishingConfiguration(): TikTokPublishingConfiguration {
  const accessToken = process.env.TIKTOK_ACCESS_TOKEN?.trim() ?? '';
  const verifiedMediaHost =
    process.env.TIKTOK_VERIFIED_MEDIA_HOST?.trim().toLowerCase() ?? '';
  if (accessToken.length < 20) {
    throw new TikTokPublishingError(
      'TIKTOK_ACCESS_TOKEN is not configured.',
      'configuration',
    );
  }
  if (!verifiedMediaHost || verifiedMediaHost.includes('/') || verifiedMediaHost.includes(':')) {
    throw new TikTokPublishingError(
      'TIKTOK_VERIFIED_MEDIA_HOST must be an exact verified hostname without a protocol or path.',
      'configuration',
    );
  }
  return {
    accessToken,
    verifiedMediaHost,
    enabled: process.env.TIKTOK_CONTENT_POSTING_ENABLED === 'true',
    audited: process.env.TIKTOK_APP_AUDITED === 'true',
  };
}

export function isTikTokPublishingConfigured(): boolean {
  try {
    return getTikTokPublishingConfiguration().enabled;
  } catch {
    return false;
  }
}

function apiUrl(path: string): string {
  const base =
    process.env.TIKTOK_API_BASE_URL?.trim() || 'https://open.tiktokapis.com';
  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

function readProviderError(payload: unknown): {
  code: string;
  message: string;
  logId?: string;
} {
  if (!payload || typeof payload !== 'object') {
    return {
      code: 'unreadable_response',
      message: 'TikTok returned an unreadable response.',
    };
  }
  const root = payload as Record<string, unknown>;
  const error =
    root.error && typeof root.error === 'object'
      ? (root.error as Record<string, unknown>)
      : {};
  return {
    code: typeof error.code === 'string' ? error.code : 'unknown_error',
    message:
      typeof error.message === 'string' && error.message.trim()
        ? error.message
        : 'TikTok rejected the request.',
    logId: typeof error.log_id === 'string' ? error.log_id : undefined,
  };
}

async function tiktokRequest(
  config: TikTokPublishingConfiguration,
  path: string,
  stage: TikTokPublishingStage,
  body: unknown,
  fetchImpl: FetchLike,
): Promise<Record<string, unknown>> {
  let response: Response;
  try {
    response = await fetchImpl(apiUrl(path), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
  } catch (error) {
    throw new TikTokPublishingError(
      error instanceof Error
        ? `TikTok request failed before a response was received: ${error.message}`
        : 'TikTok request failed before a response was received.',
      stage,
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  const provider = readProviderError(payload);
  if (!response.ok || provider.code !== 'ok') {
    throw new TikTokPublishingError(
      provider.message,
      stage,
      provider.code,
      provider.logId,
      response.status,
    );
  }

  const root = payload as Record<string, unknown>;
  return root.data && typeof root.data === 'object'
    ? (root.data as Record<string, unknown>)
    : {};
}

export async function queryTikTokCreatorInfo(
  fetchImpl: FetchLike = fetch,
): Promise<TikTokCreatorInfo> {
  const config = getTikTokPublishingConfiguration();
  if (!config.enabled) {
    throw new TikTokPublishingError(
      'TikTok Content Posting is disabled.',
      'configuration',
    );
  }
  const data = await tiktokRequest(
    config,
    '/v2/post/publish/creator_info/query/',
    'query-creator',
    {},
    fetchImpl,
  );
  const privacyLevelOptions = Array.isArray(data.privacy_level_options)
    ? data.privacy_level_options.filter(
        (value): value is string => typeof value === 'string',
      )
    : [];
  const maxDuration = Number(data.max_video_post_duration_sec);
  if (!privacyLevelOptions.length || !Number.isFinite(maxDuration)) {
    throw new TikTokPublishingError(
      'TikTok creator information omitted required privacy or video-duration settings.',
      'query-creator',
    );
  }
  return {
    username:
      typeof data.creator_username === 'string'
        ? data.creator_username
        : undefined,
    nickname:
      typeof data.creator_nickname === 'string'
        ? data.creator_nickname
        : undefined,
    privacyLevelOptions,
    commentDisabled: data.comment_disabled === true,
    duetDisabled: data.duet_disabled === true,
    stitchDisabled: data.stitch_disabled === true,
    maxVideoPostDurationSec: maxDuration,
  };
}

function assertVerifiedVideoUrl(
  videoUrl: string,
  config: TikTokPublishingConfiguration,
): void {
  const parsed = new URL(videoUrl);
  if (
    parsed.protocol !== 'https:' ||
    parsed.hostname.toLowerCase() !== config.verifiedMediaHost
  ) {
    throw new TikTokPublishingError(
      'TikTok video must use HTTPS and the exact verified media hostname.',
      'configuration',
    );
  }
}

export async function initializeTikTokVideoPost(
  input: TikTokVideoPostInput,
  creator: TikTokCreatorInfo,
  fetchImpl: FetchLike = fetch,
): Promise<TikTokVideoPublication> {
  const config = getTikTokPublishingConfiguration();
  if (!config.enabled) {
    throw new TikTokPublishingError(
      'TikTok Content Posting is disabled.',
      'configuration',
    );
  }
  assertVerifiedVideoUrl(input.videoUrl, config);
  if (!creator.privacyLevelOptions.includes(input.privacyLevel)) {
    throw new TikTokPublishingError(
      'The selected TikTok privacy level is not currently available for this account.',
      'configuration',
    );
  }
  if (input.title.trim().length > 2200) {
    throw new TikTokPublishingError(
      'TikTok title and caption must be 2,200 characters or fewer.',
      'configuration',
    );
  }

  const data = await tiktokRequest(
    config,
    '/v2/post/publish/video/init/',
    'init-video',
    {
      post_info: {
        title: input.title.trim(),
        privacy_level: input.privacyLevel,
        disable_duet: input.disableDuet,
        disable_comment: input.disableComment,
        disable_stitch: input.disableStitch,
        video_cover_timestamp_ms: input.videoCoverTimestampMs ?? 1000,
      },
      source_info: {
        source: 'PULL_FROM_URL',
        video_url: input.videoUrl,
      },
    },
    fetchImpl,
  );
  const publishId =
    typeof data.publish_id === 'string' ? data.publish_id.trim() : '';
  if (!publishId) {
    throw new TikTokPublishingError(
      'TikTok accepted the request without returning a publish ID.',
      'init-video',
    );
  }
  return { publishId };
}

export async function getTikTokPostStatus(
  publishId: string,
  fetchImpl: FetchLike = fetch,
): Promise<TikTokPostStatus> {
  const config = getTikTokPublishingConfiguration();
  if (!config.enabled) {
    throw new TikTokPublishingError(
      'TikTok Content Posting is disabled.',
      'configuration',
    );
  }
  if (!publishId.trim()) {
    throw new TikTokPublishingError(
      'TikTok publish ID is required.',
      'configuration',
    );
  }
  const data = await tiktokRequest(
    config,
    '/v2/post/publish/status/fetch/',
    'read-status',
    { publish_id: publishId.trim() },
    fetchImpl,
  );
  return {
    status:
      typeof data.status === 'string' ? data.status : 'UNKNOWN',
    failReason:
      typeof data.fail_reason === 'string' ? data.fail_reason : undefined,
    publiclyVisiblePostId: Array.isArray(data.publicaly_available_post_id)
      ? data.publicaly_available_post_id.filter(
          (value): value is string => typeof value === 'string',
        )
      : undefined,
    uploadedBytes:
      typeof data.uploaded_bytes === 'number' ? data.uploaded_bytes : undefined,
  };
}
