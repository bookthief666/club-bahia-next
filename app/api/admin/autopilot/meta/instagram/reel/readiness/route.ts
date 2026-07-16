import { NextResponse } from 'next/server';
import { isMetaPublishingConfigured } from '@/lib/admin/autopilot/server/meta';
import { isInstagramReelProofConfigured } from '@/lib/admin/autopilot/server/meta-reels';
import { requireAdminRequest } from '@/lib/admin/auth/session';
import { isAdminWorkspaceStorageConfigured } from '@/lib/admin/workspaces/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' };

export async function GET(request: Request) {
  try {
    requireAdminRequest(request);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unauthorized.' },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }

  const [metaReady, proofReady] = await Promise.all([
    isMetaPublishingConfigured(),
    isInstagramReelProofConfigured(),
  ]);
  const storageReady = isAdminWorkspaceStorageConfigured();
  const proofSwitchEnabled = process.env.META_REELS_PROOF_ENABLED === 'true';

  return NextResponse.json(
    {
      ready: metaReady && proofReady && storageReady,
      checks: [
        {
          id: 'meta-live',
          label: 'Connected Meta publishing account',
          complete: metaReady,
        },
        {
          id: 'reel-proof-switch',
          label: 'Controlled Reel proof switch',
          complete: proofSwitchEnabled,
        },
        {
          id: 'reel-receipts',
          label: 'Encrypted Reel proof receipts',
          complete: storageReady,
        },
      ],
      summary:
        metaReady && proofReady && storageReady
          ? 'The controlled Reel container workflow is ready.'
          : 'Complete the missing Reel proof checks before contacting Meta.',
    },
    { headers: NO_STORE_HEADERS },
  );
}
