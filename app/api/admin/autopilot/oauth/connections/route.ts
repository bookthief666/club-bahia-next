import { NextResponse } from 'next/server';
import { requireAdminRequest } from '@/lib/admin/auth/session';
import {
  getOAuthCredential,
  summarizeOAuthCredential,
  type OAuthProvider,
} from '@/lib/admin/autopilot/server/credential-store';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    requireAdminRequest(request);
    const providers: OAuthProvider[] = ['meta', 'tiktok'];
    const connections = await Promise.all(
      providers.map(async (provider) => {
        try {
          const credential = await getOAuthCredential(provider);
          return credential ? summarizeOAuthCredential(credential.record) : null;
        } catch {
          return null;
        }
      }),
    );
    return NextResponse.json({ connections: connections.filter(Boolean) });
  } catch (error) {
    const status =
      error && typeof error === 'object' && 'status' in error
        ? Number((error as { status?: number }).status) || 401
        : 401;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Authentication required.' },
      { status },
    );
  }
}
