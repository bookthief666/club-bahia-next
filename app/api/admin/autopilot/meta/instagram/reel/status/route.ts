import { NextResponse } from 'next/server';
import { InstagramReelStatusRequestSchema } from '@/lib/admin/autopilot/reel-validation';
import {
  getInstagramReelContainerStatus,
  InstagramReelPublishingError,
} from '@/lib/admin/autopilot/server/meta-reels';
import {
  getInstagramReelProof,
  syncInstagramReelProof,
} from '@/lib/admin/autopilot/server/reel-publication-store';
import { requireAdminRequest } from '@/lib/admin/auth/session';
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
    return json({ error: 'This account cannot inspect live social media.' }, 403);
  }
  if (!isAdminWorkspaceStorageConfigured()) {
    return json(
      { error: 'Encrypted Reel proof receipt storage is not configured.' },
      503,
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return json({ error: 'Reel status request must be valid JSON.' }, 400);
  }
  const parsed = InstagramReelStatusRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return json({ error: 'Reel status request failed validation.' }, 400);
  }

  const current = await getInstagramReelProof(parsed.data.idempotencyKey);
  if (!current) return json({ error: 'Reel proof receipt was not found.' }, 404);
  if (current.record.status === 'published') {
    return json({
      processing: false,
      readyToPublish: false,
      complete: true,
      receipt: current.record,
    });
  }
  if (current.record.status === 'ready') {
    return json({
      processing: false,
      readyToPublish: true,
      complete: false,
      receipt: current.record,
    });
  }
  if (!['claimed', 'processing'].includes(current.record.status)) {
    return json({
      processing: false,
      readyToPublish: false,
      complete: false,
      receipt: current.record,
    });
  }
  if (!current.record.containerId) {
    return json(
      {
        error:
          'The Reel receipt is processing but does not contain a Meta container ID.',
        receipt: current.record,
      },
      409,
    );
  }

  try {
    const provider = await getInstagramReelContainerStatus(
      current.record.containerId,
    );

    if (provider.readyToPublish) {
      const receipt = await syncInstagramReelProof({
        idempotencyKey: parsed.data.idempotencyKey,
        expectedRevision: current.revision,
        status: 'ready',
        providerStatus: provider.statusCode,
        warning: provider.providerStatus,
        safeToRetry: false,
        user,
      });
      return json({
        processing: false,
        readyToPublish: true,
        complete: false,
        receipt,
      });
    }

    if (provider.failed) {
      const receipt = await syncInstagramReelProof({
        idempotencyKey: parsed.data.idempotencyKey,
        expectedRevision: current.revision,
        status: 'failed',
        providerStatus: provider.statusCode,
        lastError:
          provider.providerStatus ||
          `Meta reported that the Reel container ${provider.statusCode.toLowerCase()}.`,
        safeToRetry: true,
        user,
      });
      return json(
        {
          processing: false,
          readyToPublish: false,
          complete: false,
          safeToRetry: true,
          receipt,
        },
        502,
      );
    }

    if (provider.statusCode === 'PUBLISHED') {
      const receipt = await syncInstagramReelProof({
        idempotencyKey: parsed.data.idempotencyKey,
        expectedRevision: current.revision,
        status: 'needs-review',
        providerStatus: provider.statusCode,
        warning:
          'Meta says this container is already published. Verify Instagram before another action.',
        safeToRetry: false,
        user,
      });
      return json(
        {
          processing: false,
          readyToPublish: false,
          complete: false,
          manualReviewRequired: true,
          receipt,
        },
        409,
      );
    }

    const receipt = await syncInstagramReelProof({
      idempotencyKey: parsed.data.idempotencyKey,
      expectedRevision: current.revision,
      status: 'processing',
      providerStatus: provider.statusCode,
      warning:
        provider.statusCode === 'UNKNOWN'
          ? provider.providerStatus || 'Meta returned an unfamiliar container status.'
          : undefined,
      safeToRetry: false,
      user,
    });
    return json({
      processing: true,
      readyToPublish: false,
      complete: false,
      receipt,
    });
  } catch (error) {
    const provider =
      error instanceof InstagramReelPublishingError ? error : undefined;
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Could not refresh the Reel container status.',
        stage: provider?.stage,
        providerCode: provider?.providerCode,
        providerSubcode: provider?.providerSubcode,
        traceId: provider?.traceId,
        receipt: current.record,
      },
      provider?.status ?? 502,
    );
  }
}
