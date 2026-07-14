import { NextResponse } from 'next/server';
import { requireConnectionAdmin } from '@/lib/admin/autopilot/server/connection-access';
import {
  getOAuthCredential,
  saveOAuthCredential,
  summarizeOAuthCredential,
} from '@/lib/admin/autopilot/server/credential-store';
import { refreshTikTokAuthorization } from '@/lib/admin/autopilot/server/tiktok-oauth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const user = requireConnectionAdmin(request);
    const current = await getOAuthCredential('tiktok');
    if (!current || current.record.status === 'disconnected') {
      return NextResponse.json({ error: 'TikTok is not connected.' }, { status: 409 });
    }
    const refreshed = await refreshTikTokAuthorization(current.record);
    const saved = await saveOAuthCredential({
      provider: 'tiktok',
      secretMaterial: refreshed.secretMaterial,
      renewableMaterial: refreshed.renewableMaterial,
      scopes: refreshed.scopes,
      expiresAt: refreshed.expiresAt,
      renewableUntil: refreshed.renewableUntil,
      accountId: refreshed.accountId,
      accountLabel: current.record.accountLabel,
      accountUsername: current.record.accountUsername,
      user,
    });
    return NextResponse.json({ refreshed: true, connection: summarizeOAuthCredential(saved) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'TikTok authorization could not be refreshed.' },
      { status: 500 },
    );
  }
}
