import { NextResponse } from 'next/server';
import {
  getControlledPublication,
  syncControlledPublicationStatus,
} from '@/lib/admin/autopilot/server/publication-store';
import {
  getTikTokPostStatus,
  TikTokPublishingError,
} from '@/lib/admin/autopilot/server/tiktok';
import { TikTokPublicationStatusRequestSchema } from '@/lib/admin/autopilot/validation';
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
    return json({ error: 'This account cannot inspect live social posts.' }, 403);
  }
  if (!isAdminWorkspaceStorageConfigured()) {
    return json(
      { error: 'Encrypted publication receipt storage is not configured.' },
      503,
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return json({ error: 'TikTok status request must be valid JSON.' }, 400);
  }
  const parsed = TikTokPublicationStatusRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return json(
      { error: 'TikTok status request failed validation.' },
      400,
    );
  }

  const current = await getControlledPublication(parsed.data.idempotencyKey);
  if (!current) {
    return json({ error: 'TikTok publication receipt was not found.' }, 404);
  }
  if (current.record.provider !== 'tiktok') {
    return json({ error: 'This receipt does not belong to TikTok.' }, 400);
  }
  if (current.record.status !== 'processing') {
    return json({
      processing: false,
      complete: current.record.status === 'published',
      receipt: current.record,
    });
  }
  if (!current.record.providerPublicationId) {
    return json(
      {
        error:
          'The TikTok receipt is processing but does not contain a provider publish ID.',
        receipt: current.record,
      },
      409,
    );
  }

  try {
    const providerStatus = await getTikTokPostStatus(
      current.record.providerPublicationId,
    );

    if (providerStatus.status === 'PUBLISH_COMPLETE') {
      const receipt = await syncControlledPublicationStatus({
        idempotencyKey: parsed.data.idempotencyKey,
        expectedRevision: current.revision,
        status: 'published',
        providerStatus: providerStatus.status,
        publicPostIds: providerStatus.publiclyVisiblePostId,
        warning:
          current.record.privacyLevel === 'SELF_ONLY'
            ? 'Private TikTok test completed. No public post URL is expected.'
            : undefined,
        safeToRetry: false,
        user,
      });
      return json({ processing: false, complete: true, receipt });
    }

    if (providerStatus.status === 'FAILED') {
      const safeToRetry = providerStatus.failReason === 'internal';
      const receipt = await syncControlledPublicationStatus({
        idempotencyKey: parsed.data.idempotencyKey,
        expectedRevision: current.revision,
        status: 'failed',
        providerStatus: providerStatus.status,
        publicPostIds: providerStatus.publiclyVisiblePostId,
        lastError:
          providerStatus.failReason || 'TikTok reported that processing failed.',
        safeToRetry,
        user,
      });
      return json(
        {
          processing: false,
          complete: false,
          safeToRetry,
          receipt,
        },
        502,
      );
    }

    const receipt = await syncControlledPublicationStatus({
      idempotencyKey: parsed.data.idempotencyKey,
      expectedRevision: current.revision,
      status: 'processing',
      providerStatus: providerStatus.status,
      publicPostIds: providerStatus.publiclyVisiblePostId,
      warning: ['PROCESSING_DOWNLOAD', 'PROCESSING_UPLOAD'].includes(
        providerStatus.status,
      )
        ? undefined
        : `TikTok returned the intermediate status ${providerStatus.status}.`,
      safeToRetry: false,
      user,
    });
    return json({ processing: true, complete: false, receipt });
  } catch (error) {
    const provider = error instanceof TikTokPublishingError ? error : undefined;
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Could not refresh TikTok publication status.',
        stage: provider?.stage,
        providerCode: provider?.providerCode,
        logId: provider?.logId,
        receipt: current.record,
      },
      provider?.status ?? 502,
    );
  }
}
