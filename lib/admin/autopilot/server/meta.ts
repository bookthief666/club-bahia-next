import 'server-only';

import { getOAuthCredential } from '@/lib/admin/autopilot/server/credential-store';

export type MetaPublishingStage =
  | 'configuration'
  | 'create-container'
  | 'publish-container'
  | 'read-publication';

export class MetaPublishingError extends Error {
  readonly name = 'MetaPublishingError';

  constructor(
    message: string,
    readonly stage: MetaPublishingStage,
    readonly status?: number,
    readonly providerCode?: number,
    readonly providerSubcode?: number,
    readonly traceId?: string,
  ) {
    super(message);
  }
}

export interface MetaPublishingConfiguration {
  graphApiVersion: string;
  instagramAccountId: string;
  accessToken: string;
  enabled: boolean;
  source: 'oauth' | 'environment';
}

export interface InstagramImagePublication {
  providerPublicationId: string;
  permalink?: string;
  providerTimestamp?: string;
  warning?: string;
}

type FetchLike = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

function cleanGraphVersion(value: string | undefined): string {
  const version = value?.trim() ?? '';
  if (!/^v\d+\.\d+$/.test(version)) {
    throw new MetaPublishingError(
      'META_GRAPH_API_VERSION must be explicitly configured, for example v24.0.',
      'configuration',
    );
  }
  return version;
}

async function connectedCredential(): Promise<{
  instagramAccountId: string;
  accessToken: string;
} | null> {
  try {
    const stored = await getOAuthCredential('meta');
    if (
      stored?.record.status === 'connected' &&
      stored.record.secretMaterial.length >= 20
    ) {
      const instagramAccountId =
        stored.record.relatedInstagramId || stored.record.accountId;
      if (/^\d{4,40}$/.test(instagramAccountId)) {
        return {
          instagramAccountId,
          accessToken: stored.record.secretMaterial,
        };
      }
    }
  } catch {
    // Preview and tests may intentionally use environment-only provider setup.
  }
  return null;
}

export async function getMetaPublishingConfiguration(): Promise<MetaPublishingConfiguration> {
  const stored = await connectedCredential();
  const instagramAccountId =
    stored?.instagramAccountId || process.env.META_INSTAGRAM_ACCOUNT_ID?.trim() || '';
  const accessToken =
    stored?.accessToken || process.env.META_PAGE_ACCESS_TOKEN?.trim() || '';
  if (!/^\d{4,40}$/.test(instagramAccountId)) {
    throw new MetaPublishingError(
      'Connect the Club Bahia Instagram professional account or configure its numeric account ID.',
      'configuration',
    );
  }
  if (accessToken.length < 20) {
    throw new MetaPublishingError(
      'Connect the Club Bahia Meta account before publishing.',
      'configuration',
    );
  }

  return {
    graphApiVersion: cleanGraphVersion(process.env.META_GRAPH_API_VERSION),
    instagramAccountId,
    accessToken,
    enabled: process.env.META_PUBLISH_ENABLED === 'true',
    source: stored ? 'oauth' : 'environment',
  };
}

export async function isMetaPublishingConfigured(): Promise<boolean> {
  try {
    const config = await getMetaPublishingConfiguration();
    return config.enabled;
  } catch {
    return false;
  }
}

function graphUrl(config: MetaPublishingConfiguration, path: string): string {
  const base = process.env.META_GRAPH_BASE_URL?.trim() || 'https://graph.facebook.com';
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
        : 'Meta rejected the publication request.',
    code: typeof error.code === 'number' ? error.code : undefined,
    subcode:
      typeof error.error_subcode === 'number' ? error.error_subcode : undefined,
    traceId:
      typeof error.fbtrace_id === 'string' ? error.fbtrace_id : undefined,
  };
}

async function graphRequest(
  config: MetaPublishingConfiguration,
  path: string,
  stage: MetaPublishingStage,
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
    throw new MetaPublishingError(
      error instanceof Error
        ? `Meta request failed before a response was received: ${error.message}`
        : 'Meta request failed before a response was received.',
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
    throw new MetaPublishingError(
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

function readId(value: unknown, stage: MetaPublishingStage): string {
  if (value && typeof value === 'object') {
    const id = (value as Record<string, unknown>).id;
    if (typeof id === 'string' && id.trim()) return id.trim();
  }
  throw new MetaPublishingError(
    'Meta returned a successful response without a publication ID.',
    stage,
  );
}

export async function publishInstagramImage(
  input: { imageUrl: string; caption: string },
  fetchImpl: FetchLike = fetch,
): Promise<InstagramImagePublication> {
  const config = await getMetaPublishingConfiguration();
  if (!config.enabled) {
    throw new MetaPublishingError(
      'Live Meta publishing is disabled. Enable it only for the controlled proof of publication.',
      'configuration',
    );
  }

  const containerBody = new URLSearchParams({
    image_url: input.imageUrl,
    caption: input.caption,
  });
  const containerPayload = await graphRequest(
    config,
    `${encodeURIComponent(config.instagramAccountId)}/media`,
    'create-container',
    fetchImpl,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: containerBody.toString(),
    },
  );
  const creationId = readId(containerPayload, 'create-container');

  const publishPayload = await graphRequest(
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
  const providerPublicationId = readId(publishPayload, 'publish-container');

  try {
    const publicationPayload = await graphRequest(
      config,
      `${encodeURIComponent(providerPublicationId)}?fields=id,permalink,timestamp`,
      'read-publication',
      fetchImpl,
      { method: 'GET' },
    );
    const publication =
      publicationPayload && typeof publicationPayload === 'object'
        ? (publicationPayload as Record<string, unknown>)
        : {};
    return {
      providerPublicationId,
      permalink:
        typeof publication.permalink === 'string'
          ? publication.permalink
          : undefined,
      providerTimestamp:
        typeof publication.timestamp === 'string'
          ? publication.timestamp
          : undefined,
    };
  } catch (error) {
    return {
      providerPublicationId,
      warning:
        error instanceof Error
          ? `The post was published, but its permalink could not be read yet: ${error.message}`
          : 'The post was published, but its permalink could not be read yet.',
    };
  }
}
