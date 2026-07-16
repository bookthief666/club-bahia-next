import { NextResponse } from 'next/server';
import {
  buildPublishingIdempotencyKey,
  stablePublishingVersion,
} from '@/lib/admin/autopilot/domain';
import { InstagramReelInitializeRequestSchema } from '@/lib/admin/autopilot/reel-validation';
import { verifyPublicMetaReelVideo } from '@/lib/admin/autopilot/server/meta-media';
import {
  initializeInstagramReel,
  InstagramReelPublishingError,
  isInstagramReelProofConfigured,
} from '@/lib/admin/autopilot/server/meta-reels';
import {
  claimInstagramReelProof,
  failInstagramReelProof,
  InstagramReelProofClaimError,
  markInstagramReelProcessing,
} from '@/lib/admin/autopilot/server/reel-publication-store';
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
    return json({ error: 'This account cannot create live social media.' }, 403);
  }
  if (!isAdminWorkspaceStorageConfigured()) {
    return json(
      { error: 'Encrypted Reel proof receipt storage must be configured first.' },
      503,
    );
  }
  if (!(await isInstagramReelProofConfigured())) {
    return json(
      {
        error:
          'Connect Instagram, enable controlled Meta publishing, and enable the Reel proof switch before creating a Reel container.',
      },
      503,
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return json({ error: 'Reel initialization must be valid JSON.' }, 400);
  }
  const parsed = InstagramReelInitializeRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return json(
      {
        error: 'Reel initialization failed validation.',
        details: parsed.error.flatten(),
      },
      400,
    );
  }

  try {
    await verifyPublicMetaReelVideo(parsed.data.videoUrl);
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'The Reel video could not be verified.',
      },
      400,
    );
  }

  const idempotencyKey = buildPublishingIdempotencyKey({
    eventId: parsed.data.eventId,
    provider: 'meta',
    contentItemId: parsed.data.contentItemId,
    contentVersion: stablePublishingVersion(parsed.data.caption),
    mediaVersion: stablePublishingVersion(parsed.data.videoUrl),
  });

  let claim;
  try {
    claim = await claimInstagramReelProof({
      idempotencyKey,
      eventId: parsed.data.eventId,
      contentItemId: parsed.data.contentItemId,
      caption: parsed.data.caption,
      videoUrl: parsed.data.videoUrl,
      shareToFeed: parsed.data.shareToFeed,
      user,
    });
  } catch (error) {
    if (
      error instanceof InstagramReelProofClaimError ||
      error instanceof AdminWorkspaceConflictError
    ) {
      return json(
        {
          error: error.message,
          duplicatePrevented: true,
          idempotencyKey,
          receipt:
            error instanceof InstagramReelProofClaimError
              ? error.record
              : undefined,
        },
        409,
      );
    }
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Could not reserve the Reel proof attempt.',
      },
      500,
    );
  }

  if (claim.alreadyPublished) {
    return json({
      accepted: true,
      processing: false,
      complete: true,
      duplicatePrevented: true,
      idempotencyKey,
      receipt: claim.record,
    });
  }

  try {
    const container = await initializeInstagramReel({
      videoUrl: parsed.data.videoUrl,
      caption: parsed.data.caption,
      shareToFeed: parsed.data.shareToFeed,
    });
    try {
      const receipt = await markInstagramReelProcessing({
        idempotencyKey,
        expectedRevision: claim.revision,
        containerId: container.creationId,
        providerStatus: 'IN_PROGRESS',
        user,
      });
      return json({
        accepted: true,
        processing: true,
        complete: false,
        duplicatePrevented: false,
        idempotencyKey,
        receipt,
      });
    } catch (storageError) {
      return json({
        accepted: true,
        processing: true,
        complete: false,
        duplicatePrevented: true,
        idempotencyKey,
        receipt: {
          ...claim.record,
          status: 'needs-review',
          containerId: container.creationId,
          providerStatus: 'IN_PROGRESS',
          warning:
            storageError instanceof Error
              ? `Meta created the Reel container, but its receipt could not be stored: ${storageError.message}`
              : 'Meta created the Reel container, but its receipt could not be stored.',
        },
      });
    }
  } catch (error) {
    const provider =
      error instanceof InstagramReelPublishingError ? error : undefined;
    const message =
      error instanceof Error ? error.message : 'Reel container creation failed.';
    const safeToRetry =
      provider?.stage === 'configuration' ||
      provider?.stage === 'create-container';
    await failInstagramReelProof({
      idempotencyKey,
      expectedRevision: claim.revision,
      error: message,
      safeToRetry,
      uncertain: false,
      user,
    }).catch(() => null);
    return json(
      {
        error: message,
        stage: provider?.stage,
        providerCode: provider?.providerCode,
        providerSubcode: provider?.providerSubcode,
        traceId: provider?.traceId,
        safeToRetry,
        manualReviewRequired: false,
      },
      provider?.status ?? 502,
    );
  }
}
