import { NextResponse } from 'next/server';
import { InstagramReelCommitRequestSchema } from '@/lib/admin/autopilot/reel-validation';
import {
  InstagramReelPublishingError,
  publishInstagramReelContainer,
} from '@/lib/admin/autopilot/server/meta-reels';
import {
  completeInstagramReelProof,
  failInstagramReelProof,
  getInstagramReelProof,
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
    return json({ error: 'This account cannot publish live social media.' }, 403);
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
    return json({ error: 'Reel publish request must be valid JSON.' }, 400);
  }
  const parsed = InstagramReelCommitRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return json({ error: 'Reel publish request failed validation.' }, 400);
  }

  const current = await getInstagramReelProof(parsed.data.idempotencyKey);
  if (!current) return json({ error: 'Reel proof receipt was not found.' }, 404);
  if (current.record.status === 'published') {
    return json({
      published: true,
      duplicatePrevented: true,
      receipt: current.record,
    });
  }
  if (current.record.status !== 'ready') {
    return json(
      {
        error:
          current.record.status === 'processing'
            ? 'Meta is still processing this Reel container. Refresh its status before publishing.'
            : 'This Reel container is not approved for the final live publish step.',
        receipt: current.record,
      },
      409,
    );
  }
  if (!current.record.containerId) {
    return json(
      {
        error: 'The ready Reel receipt does not contain a Meta container ID.',
        receipt: current.record,
      },
      409,
    );
  }

  try {
    const publication = await publishInstagramReelContainer(
      current.record.containerId,
    );
    try {
      const receipt = await completeInstagramReelProof({
        idempotencyKey: parsed.data.idempotencyKey,
        expectedRevision: current.revision,
        publication,
        user,
      });
      return json({
        published: true,
        duplicatePrevented: false,
        receipt,
      });
    } catch (storageError) {
      return json({
        published: true,
        duplicatePrevented: true,
        receipt: {
          ...current.record,
          status: 'needs-review',
          providerStatus: 'PUBLISHED',
          providerPublicationId: publication.providerPublicationId,
          externalUrl: publication.permalink,
          warning:
            storageError instanceof Error
              ? `The Reel is live, but its final receipt could not be stored: ${storageError.message}`
              : 'The Reel is live, but its final receipt could not be stored.',
        },
      });
    }
  } catch (error) {
    const provider =
      error instanceof InstagramReelPublishingError ? error : undefined;
    const message =
      error instanceof Error ? error.message : 'Instagram Reel publication failed.';
    const uncertain =
      provider?.stage === 'publish-container' && !provider.status;
    const safeToRetry =
      provider?.stage === 'configuration' ||
      (provider?.stage === 'publish-container' && Boolean(provider.status));
    const receipt = await failInstagramReelProof({
      idempotencyKey: parsed.data.idempotencyKey,
      expectedRevision: current.revision,
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
        providerSubcode: provider?.providerSubcode,
        traceId: provider?.traceId,
        safeToRetry,
        manualReviewRequired: uncertain,
        receipt: receipt ?? current.record,
      },
      uncertain ? 409 : provider?.status ?? 502,
    );
  }
}
