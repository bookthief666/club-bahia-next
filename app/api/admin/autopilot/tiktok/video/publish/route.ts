import { isIP } from 'node:net';
import { NextResponse } from 'next/server';
import {
  buildPublishingIdempotencyKey,
  stablePublishingVersion,
} from '@/lib/admin/autopilot/domain';
import {
  claimControlledPublication,
  failControlledPublication,
  markControlledPublicationProcessing,
  PublicationClaimError,
} from '@/lib/admin/autopilot/server/publication-store';
import {
  getTikTokPublishingConfiguration,
  initializeTikTokVideoPost,
  queryTikTokCreatorInfo,
  TikTokPublishingError,
} from '@/lib/admin/autopilot/server/tiktok';
import { TikTokPrivateVideoPublishRequestSchema } from '@/lib/admin/autopilot/validation';
import { requireAdminRequest } from '@/lib/admin/auth/session';
import { AdminWorkspaceConflictError } from '@/lib/admin/workspaces/domain';
import { isAdminWorkspaceStorageConfigured } from '@/lib/admin/workspaces/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' };
const LIVE_PUBLISHING_ROLES = new Set(['owner', 'manager', 'marketing']);
const MAX_PRIVATE_TEST_BYTES = 250 * 1024 * 1024;

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE_HEADERS });
}

function isPrivateAddress(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  if (normalized === 'localhost' || normalized.endsWith('.localhost')) return true;
  const family = isIP(normalized);
  if (!family) return false;
  if (family === 6) {
    return (
      normalized === '::1' ||
      normalized.startsWith('fc') ||
      normalized.startsWith('fd') ||
      normalized.startsWith('fe80')
    );
  }
  const parts = normalized.split('.').map(Number);
  return (
    parts[0] === 10 ||
    parts[0] === 127 ||
    (parts[0] === 169 && parts[1] === 254) ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168)
  );
}

async function verifyTikTokVideo(videoUrl: string, verifiedHost: string) {
  const parsed = new URL(videoUrl);
  const expectedHost = verifiedHost.toLowerCase();
  if (
    parsed.protocol !== 'https:' ||
    parsed.hostname.toLowerCase() !== expectedHost ||
    isPrivateAddress(parsed.hostname)
  ) {
    throw new Error(
      'The TikTok test video must use HTTPS on the exact verified media hostname.',
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    let response = await fetch(parsed, {
      method: 'HEAD',
      redirect: 'follow',
      cache: 'no-store',
      signal: controller.signal,
    });
    if (response.status === 405) {
      response = await fetch(parsed, {
        method: 'GET',
        headers: { Range: 'bytes=0-0' },
        redirect: 'follow',
        cache: 'no-store',
        signal: controller.signal,
      });
    }
    const finalUrl = new URL(response.url || videoUrl);
    if (
      finalUrl.protocol !== 'https:' ||
      finalUrl.hostname.toLowerCase() !== expectedHost ||
      isPrivateAddress(finalUrl.hostname)
    ) {
      throw new Error('The TikTok video redirected away from the verified media host.');
    }
    const contentType = response.headers.get('content-type') ?? '';
    if (!response.ok || !contentType.toLowerCase().startsWith('video/')) {
      throw new Error('The selected TikTok media URL is not a publicly readable video.');
    }
    const contentLength = Number(response.headers.get('content-length'));
    if (Number.isFinite(contentLength) && contentLength > MAX_PRIVATE_TEST_BYTES) {
      throw new Error('The controlled TikTok test video must be 250 MB or smaller.');
    }
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: Request) {
  let user;
  try {
    user = requireAdminRequest(request);
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : 'Unauthorized.' },
      401,
    );
  }
  if (!LIVE_PUBLISHING_ROLES.has(user.role)) {
    return json({ error: 'This account cannot publish live social posts.' }, 403);
  }
  if (!isAdminWorkspaceStorageConfigured()) {
    return json(
      { error: 'Encrypted publication receipt storage must be configured first.' },
      503,
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return json({ error: 'TikTok publication request must be valid JSON.' }, 400);
  }
  const parsed = TikTokPrivateVideoPublishRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return json(
      {
        error: 'TikTok publication request failed validation.',
        details: parsed.error.flatten(),
      },
      400,
    );
  }

  let config;
  try {
    config = getTikTokPublishingConfiguration();
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : 'TikTok is not configured.' },
      503,
    );
  }
  if (!config.enabled || !config.verifiedMediaHost) {
    return json(
      {
        error:
          'TikTok Content Posting and the verified media hostname must be configured before a private test.',
      },
      503,
    );
  }

  try {
    await verifyTikTokVideo(parsed.data.videoUrl, config.verifiedMediaHost);
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'The TikTok test video could not be verified.',
      },
      400,
    );
  }

  let creator;
  try {
    creator = await queryTikTokCreatorInfo();
  } catch (error) {
    const provider = error instanceof TikTokPublishingError ? error : undefined;
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Could not verify the authorized TikTok creator.',
        stage: provider?.stage,
        providerCode: provider?.providerCode,
        logId: provider?.logId,
      },
      provider?.status ?? 502,
    );
  }
  if (!creator.privacyLevelOptions.includes('SELF_ONLY')) {
    return json(
      {
        error:
          'The connected TikTok account did not offer SELF_ONLY privacy, so the controlled private test was blocked.',
      },
      409,
    );
  }

  const idempotencyKey = buildPublishingIdempotencyKey({
    eventId: parsed.data.eventId,
    provider: 'tiktok',
    contentItemId: parsed.data.contentItemId,
    contentVersion: stablePublishingVersion(parsed.data.caption),
    mediaVersion: stablePublishingVersion(parsed.data.videoUrl),
  });

  let claim;
  try {
    claim = await claimControlledPublication({
      idempotencyKey,
      eventId: parsed.data.eventId,
      contentItemId: parsed.data.contentItemId,
      caption: parsed.data.caption,
      provider: 'tiktok',
      channel: 'tiktok-video',
      mediaUrl: parsed.data.videoUrl,
      user,
    });
  } catch (error) {
    if (
      error instanceof PublicationClaimError ||
      error instanceof AdminWorkspaceConflictError
    ) {
      return json(
        {
          error: error.message,
          duplicatePrevented: true,
          receipt:
            error instanceof PublicationClaimError ? error.record : undefined,
        },
        409,
      );
    }
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Could not reserve the TikTok publication attempt.',
      },
      500,
    );
  }

  if (claim.alreadyPublished) {
    return json({
      accepted: true,
      processing: false,
      duplicatePrevented: true,
      idempotencyKey,
      receipt: claim.record,
    });
  }

  try {
    const publication = await initializeTikTokVideoPost(
      {
        videoUrl: parsed.data.videoUrl,
        title: parsed.data.caption,
        privacyLevel: 'SELF_ONLY',
        disableComment: true,
        disableDuet: true,
        disableStitch: true,
        videoCoverTimestampMs: parsed.data.videoCoverTimestampMs,
      },
      creator,
    );

    try {
      const receipt = await markControlledPublicationProcessing({
        idempotencyKey,
        expectedRevision: claim.revision,
        providerPublicationId: publication.publishId,
        providerStatus: 'PROCESSING_DOWNLOAD',
        privacyLevel: 'SELF_ONLY',
        user,
      });
      return json({
        accepted: true,
        processing: true,
        duplicatePrevented: false,
        idempotencyKey,
        creator: {
          username: creator.username,
          nickname: creator.nickname,
          maxVideoPostDurationSec: creator.maxVideoPostDurationSec,
        },
        receipt,
      });
    } catch (storageError) {
      return json({
        accepted: true,
        processing: true,
        duplicatePrevented: true,
        idempotencyKey,
        receipt: {
          ...claim.record,
          status: 'needs-review',
          providerPublicationId: publication.publishId,
          privacyLevel: 'SELF_ONLY',
          warning:
            storageError instanceof Error
              ? `TikTok accepted the private test, but its processing receipt could not be stored: ${storageError.message}`
              : 'TikTok accepted the private test, but its processing receipt could not be stored.',
        },
      });
    }
  } catch (error) {
    const provider = error instanceof TikTokPublishingError ? error : undefined;
    const uncertain = provider?.stage === 'init-video' && !provider.status;
    const safeToRetry =
      provider?.stage === 'configuration' ||
      (provider?.stage === 'init-video' && Boolean(provider.status));
    const message =
      error instanceof Error ? error.message : 'TikTok private test failed.';
    await failControlledPublication({
      idempotencyKey,
      expectedRevision: claim.revision,
      error: message,
      safeToRetry,
      uncertain,
      user,
    }).catch(() => null);
    return json(
      {
        error: message,
        stage: provider?.stage,
        providerCode: provider?.providerCode,
        logId: provider?.logId,
        safeToRetry,
        manualReviewRequired: uncertain,
      },
      uncertain ? 409 : provider?.status ?? 502,
    );
  }
}
