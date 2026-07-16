import { NextResponse } from 'next/server';
import { requireAdminRequest } from '@/lib/admin/auth/session';
import {
  isTikTokPublishingConfigured,
  queryTikTokCreatorInfo,
  TikTokPublishingError,
} from '@/lib/admin/autopilot/server/tiktok';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' };
const LIVE_PUBLISHING_ROLES = new Set(['owner', 'manager', 'marketing']);

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE_HEADERS });
}

export async function GET(request: Request) {
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
    return json({ error: 'This account cannot inspect live social connections.' }, 403);
  }
  if (!isTikTokPublishingConfigured()) {
    return json(
      {
        error:
          'TikTok Content Posting is not fully configured or its controlled switch is not enabled.',
      },
      503,
    );
  }

  try {
    const creator = await queryTikTokCreatorInfo();
    return json({
      creator,
      privateTestAvailable: creator.privacyLevelOptions.includes('SELF_ONLY'),
      privateTestPolicy: {
        privacyLevel: 'SELF_ONLY',
        disableComment: true,
        disableDuet: true,
        disableStitch: true,
      },
    });
  } catch (error) {
    const provider = error instanceof TikTokPublishingError ? error : undefined;
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Could not query the authorized TikTok creator.',
        stage: provider?.stage,
        providerCode: provider?.providerCode,
        logId: provider?.logId,
      },
      provider?.status ?? 502,
    );
  }
}
