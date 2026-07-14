import 'server-only';

import {
  getMetaPublishingConfiguration,
  type MetaPublishingConfiguration,
} from '@/lib/admin/autopilot/server/meta';

export type InstagramReelPublishingStage =
  | 'configuration'
  | 'create-container'
  | 'read-container'
  | 'publish-container'
  | 'read-publication';

export class InstagramReelPublishingError extends Error {
  readonly name = 'InstagramReelPublishingError';

  constructor(
    message: string,
    readonly stage: InstagramReelPublishingStage,
    readonly status?: number,
    readonly providerCode?: number,
    readonly providerSubcode?: number,
    readonly traceId?: string,
  ) {
    super(message);
  }
}

export type InstagramReelContainerStatusCode =
  | 'EXPIRED'
  | 'ERROR'
  | 'FINISHED'
  | 'IN_PROGRESS'
  | 'PUBLISHED'
  | 'UNKNOWN';

export interface InstagramReelContainer {
  creationId: string;
}

export interface InstagramReelContainerStatus {
  creationId: string;
  statusCode: InstagramReelContainerStatusCode;
  providerStatus?: string;
  readyToPublish: boolean;
  failed: boolean;
}

export interface InstagramReelPublication {
  providerPublicationId: string;
  permalink?: string;
  providerTimestamp?: string;
  warning?: string;
}

type FetchLike = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

function graphUrl(config: MetaPublishingConfiguration, path: string): string {
  const base =
    process.env.META_GRAPH_BASE_URL?.trim() || 'https://graph.facebook.com';
  return `${base.replace(/\/$/, '')}/${config.graphApiVersion}/${path.replace(/^\//, '')}`;
}

function parseProviderError(value: unknown): {
  message: string;
  code?: number;
  subcode?: number;
  traceId?: string;
} {
  if (!value || typeof value !== 'object') {
    return { message: 'Meta returned an unreadable error response.' };
  }
  const root = value as Record<string, unknown>;
  const error =
    root.error && typeof root.error === 'object'
      ? (root.error as Record<string, unknown>)
      : root;
  return {
    message:
      typeof error.message === 'string'
        ? error.message
        : 'Meta rejected the Instagram Reel request.',
    code: typeof error.code === 'number' ? error.code : undefined,
    subcode:
      typeof error.error_subcode === 'number'
        ? error.error_subcode
        : undefined,
    traceId:
      typeof error.fbtrace_id === 'string' ? error.fbtrace_id : undefined,
  };
}

async function graphRequest(
  config: MetaPublishingConfiguration,
  path: string,
  stage: InstagramReelPublishingStage,
  fetchImpl: FetchLike,
  init: RequestInit,
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetchImpl(graphUrl(config, path), {
      ...init,
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        ...(init.headers ?? {}),
      },
    });
  } catch (error) {
    throw new InstagramReelPublishingError(
      error instanceof Error
        ? `Meta Reel request failed before a response was received: ${error.message}`
        : 'Meta Reel request failed before a response was received.',
      stage,
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const provider = parseProviderError(payload);
    throw new InstagramReelPublishingError(
      provider.message,
      stage,
      response.status,
      provider.code,
      provider.subcode,
      provider.traceId,
    );
  }
  return payload;
}

function readId(
  value: unknown,
  stage: InstagramReelPublishingStage,
): string {
  if (value && typeof value === 'object') {
    const id = (value as Record<string, unknown>).id;
    if (typeof id === 'string' && id.trim()) return id.trim();
  }
  throw new InstagramReelPublishingError(
    'Meta returned a successful Reel response without an ID.',
    stage,
  );
}

async function reelConfiguration(): Promise<MetaPublishingConfiguration> {
  const config = await getMetaPublishingConfiguration();
  if (!config.enabled) {
    throw new InstagramReelPublishingError(
      'Live Meta publishing is disabled.',
      'configuration',
    );
  }
  if (process.env.META_REELS_PROOF_ENABLED !== 'true') {
    throw new InstagramReelPublishingError(
      'The controlled Instagram Reel proof switch is disabled.',
      'configuration',
    );
  }
  return config;
}

export async function isInstagramReelProofConfigured(): Promise<boolean> {
  try {
    await reelConfiguration();
    return true;
  } catch {
    return false;
  }
}

export async function initializeInstagramReel(
  input: {
    videoUrl: string;
    caption: string;
    shareToFeed: boolean;
  },
  fetchImpl: FetchLike = fetch,
): Promise<InstagramReelContainer> {
  const config = await reelConfiguration();
  const body = new URLSearchParams({
    media_type: 'REELS',
    video_url: input.videoUrl,
    caption: input.caption,
    share_to_feed: input.shareToFeed ? 'true' : 'false',
  });
  const payload = await graphRequest(
    config,
    `${encodeURIComponent(config.instagramAccountId)}/media`,
    'create-container',
    fetchImpl,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    },
  );
  return { creationId: readId(payload, 'create-container') };
}

function normalizeStatusCode(value: unknown): InstagramReelContainerStatusCode {
  const normalized = typeof value === 'string' ? value.trim().toUpperCase() : '';
  if (
    normalized === 'EXPIRED' ||
    normalized === 'ERROR' ||
    normalized === 'FINISHED' ||
    normalized === 'IN_PROGRESS' ||
    normalized === 'PUBLISHED'
  ) {
    return normalized;
  }
  return 'UNKNOWN';
}

export async function getInstagramReelContainerStatus(
  creationId: string,
  fetchImpl: FetchLike = fetch,
): Promise<InstagramReelContainerStatus> {
  const config = await reelConfiguration();
  const payload = await graphRequest(
    config,
    `${encodeURIComponent(creationId)}?fields=id,status_code,status`,
    'read-container',
    fetchImpl,
    { method: 'GET' },
  );
  const record =
    payload && typeof payload === 'object'
      ? (payload as Record<string, unknown>)
      : {};
  const statusCode = normalizeStatusCode(record.status_code);
  return {
    creationId,
    statusCode,
    providerStatus:
      typeof record.status === 'string' ? record.status : undefined,
    readyToPublish: statusCode === 'FINISHED',
    failed: statusCode === 'ERROR' || statusCode === 'EXPIRED',
  };
}

async function readPublication(
  config: MetaPublishingConfiguration,
  providerPublicationId: string,
  fetchImpl: FetchLike,
): Promise<InstagramReelPublication> {
  try {
    const payload = await graphRequest(
      config,
      `${encodeURIComponent(providerPublicationId)}?fields=id,permalink,timestamp`,
      'read-publication',
      fetchImpl,
      { method: 'GET' },
    );
    const record =
      payload && typeof payload === 'object'
        ? (payload as Record<string, unknown>)
        : {};
    return {
      providerPublicationId,
      permalink:
        typeof record.permalink === 'string' ? record.permalink : undefined,
      providerTimestamp:
        typeof record.timestamp === 'string' ? record.timestamp : undefined,
    };
  } catch (error) {
    return {
      providerPublicationId,
      warning:
        error instanceof Error
          ? `The Reel was published, but its permalink could not be read yet: ${error.message}`
          : 'The Reel was published, but its permalink could not be read yet.',
    };
  }
}

export async function publishInstagramReelContainer(
  creationId: string,
  fetchImpl: FetchLike = fetch,
): Promise<InstagramReelPublication> {
  const config = await reelConfiguration();
  const payload = await graphRequest(
    config,
    `${encodeURIComponent(config.instagramAccountId)}/media_publish`,
    'publish-container',
    fetchImpl,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ creation_id: creationId }).toString(),
    },
  );
  const providerPublicationId = readId(payload, 'publish-container');
  return readPublication(config, providerPublicationId, fetchImpl);
}
