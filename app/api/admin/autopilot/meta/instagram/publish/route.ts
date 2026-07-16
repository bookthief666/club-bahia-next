import { isIP } from 'node:net';
import { NextResponse } from 'next/server';
import {
  buildPublishingIdempotencyKey,
  buildTrackedCampaignUrl,
  stablePublishingVersion,
} from '@/lib/admin/autopilot/domain';
import {
  isMetaPublishingConfigured,
  MetaPublishingError,
  publishInstagramImage,
} from '@/lib/admin/autopilot/server/meta';
import {
  claimControlledPublication,
  completeControlledPublication,
  failControlledPublication,
  PublicationClaimError,
} from '@/lib/admin/autopilot/server/publication-store';
import { InstagramImagePublishRequestSchema } from '@/lib/admin/autopilot/validation';
import { requireAdminRequest } from '@/lib/admin/auth/session';
import { AdminWorkspaceConflictError } from '@/lib/admin/workspaces/domain';
import { isAdminWorkspaceStorageConfigured } from '@/lib/admin/workspaces/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' };
const LIVE_PUBLISHING_ROLES = new Set(['owner', 'manager', 'marketing']);

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE_HEADERS });
}

function configuredMediaHosts(): Set<string> {
  const hosts = new Set<string>();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (siteUrl) {
    try {
      hosts.add(new URL(siteUrl).hostname.toLowerCase());
    } catch {
      // The readiness screen will surface the invalid production site URL elsewhere.
    }
  }
  for (const host of (process.env.META_ALLOWED_MEDIA_HOSTS ?? '').split(',')) {
    const cleaned = host.trim().toLowerCase();
    if (cleaned) hosts.add(cleaned);
  }
  return hosts;
}

function isPrivateAddress(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  if (normalized === 'localhost' || normalized.endsWith('.localhost')) return true;
  const family = isIP(normalized);
  if (!family) return false;
  if (family === 6) {
    return normalized === '::1' || normalized.startsWith('fc') || normalized.startsWith('fd');
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

function isAllowedMediaHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  if (isPrivateAddress(normalized)) return false;
  if (normalized.endsWith('.public.blob.vercel-storage.com')) return true;
  return configuredMediaHosts().has(normalized);
}

async function verifyPublicImage(imageUrl: string): Promise<void> {
  const parsed = new URL(imageUrl);
  if (parsed.protocol !== 'https:' || !isAllowedMediaHost(parsed.hostname)) {
    throw new Error(
      'The selected image must be hosted on the approved Club Bahia site or public Vercel Blob storage.',
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
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
    const finalUrl = new URL(response.url || imageUrl);
    if (!isAllowedMediaHost(finalUrl.hostname)) {
      throw new Error('The selected image redirected to an unapproved host.');
    }
    const contentType = response.headers.get('content-type') ?? '';
    if (!response.ok || !contentType.toLowerCase().startsWith('image/')) {
      throw new Error('The selected media URL is not a publicly readable image.');
    }
  } finally {
    clearTimeout(timeout);
  }
}

function captionWithTrackedLink(input: {
  caption: string;
  reservationUrl?: string;
  eventId: string;
  contentItemId: string;
}): { caption: string; trackedUrl?: string } {
  if (!input.reservationUrl) return { caption: input.caption };
  const trackedUrl = buildTrackedCampaignUrl(input.reservationUrl, {
    source: 'instagram',
    medium: 'feed',
    campaign: input.eventId,
    content: input.contentItemId,
  });
  const caption = input.caption.includes(input.reservationUrl)
    ? input.caption.replaceAll(input.reservationUrl, trackedUrl)
    : input.caption;
  if (caption.length > 2200) {
    throw new Error(
      'The Instagram caption is too long after applying its tracked reservation link.',
    );
  }
  return { caption, trackedUrl };
}

export async function POST(request: Request) {
  let user: ReturnType<typeof requireAdminRequest>;
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
      { error: 'Encrypted Growth OS storage must be configured before publishing.' },
      503,
    );
  }
  if (!isMetaPublishingConfigured()) {
    return json(
      {
        error:
          'Meta publishing is not fully configured or META_PUBLISH_ENABLED is not true.',
      },
      503,
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return json({ error: 'Publication request must be valid JSON.' }, 400);
  }
  const parsed = InstagramImagePublishRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return json(
      {
        error: 'Publication request failed validation.',
        details: parsed.error.flatten(),
      },
      400,
    );
  }

  try {
    await verifyPublicImage(parsed.data.imageUrl);
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'The selected image could not be verified.',
      },
      400,
    );
  }

  let prepared;
  try {
    prepared = captionWithTrackedLink({
      caption: parsed.data.caption,
      reservationUrl: parsed.data.reservationUrl,
      eventId: parsed.data.eventId,
      contentItemId: parsed.data.contentItemId,
    });
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : 'Caption is invalid.' },
      400,
    );
  }

  const idempotencyKey = buildPublishingIdempotencyKey({
    eventId: parsed.data.eventId,
    provider: 'meta',
    contentItemId: parsed.data.contentItemId,
    contentVersion: stablePublishingVersion(prepared.caption),
    mediaVersion: stablePublishingVersion(parsed.data.imageUrl),
  });

  let claim;
  try {
    claim = await claimControlledPublication({
      idempotencyKey,
      eventId: parsed.data.eventId,
      contentItemId: parsed.data.contentItemId,
      caption: prepared.caption,
      imageUrl: parsed.data.imageUrl,
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
            : 'Could not reserve this publication attempt.',
      },
      500,
    );
  }

  if (claim.alreadyPublished) {
    return json({
      published: true,
      duplicatePrevented: true,
      trackedUrl: prepared.trackedUrl,
      receipt: claim.record,
    });
  }

  try {
    const publication = await publishInstagramImage({
      imageUrl: parsed.data.imageUrl,
      caption: prepared.caption,
    });
    try {
      const receipt = await completeControlledPublication({
        idempotencyKey,
        expectedRevision: claim.revision,
        publication,
        user,
      });
      return json({
        published: true,
        duplicatePrevented: false,
        trackedUrl: prepared.trackedUrl,
        receipt,
      });
    } catch (storageError) {
      return json({
        published: true,
        duplicatePrevented: true,
        trackedUrl: prepared.trackedUrl,
        receipt: {
          ...claim.record,
          status: 'needs-review',
          providerPublicationId: publication.providerPublicationId,
          externalUrl: publication.permalink,
          warning:
            storageError instanceof Error
              ? `The post is live, but its receipt could not be stored: ${storageError.message}`
              : 'The post is live, but its receipt could not be stored.',
        },
      });
    }
  } catch (error) {
    const metaError = error instanceof MetaPublishingError ? error : undefined;
    const safeToRetry = metaError?.stage === 'create-container';
    const uncertain = metaError?.stage === 'publish-container' || !metaError;
    const message =
      error instanceof Error ? error.message : 'Meta publication failed.';
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
        stage: metaError?.stage,
        providerCode: metaError?.providerCode,
        providerSubcode: metaError?.providerSubcode,
        traceId: metaError?.traceId,
        safeToRetry,
        manualReviewRequired: uncertain,
      },
      uncertain ? 409 : 502,
    );
  }
}
