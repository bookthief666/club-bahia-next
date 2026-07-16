import { NextResponse } from 'next/server';
import { requireConnectionAdmin } from '@/lib/admin/autopilot/server/connection-access';
import {
  disconnectOAuthCredential,
  type OAuthProvider,
} from '@/lib/admin/autopilot/server/credential-store';

export const dynamic = 'force-dynamic';

function provider(value: unknown): OAuthProvider | null {
  return value === 'meta' || value === 'tiktok' ? value : null;
}

export async function POST(request: Request) {
  try {
    const user = requireConnectionAdmin(request);
    const body = (await request.json()) as { provider?: unknown };
    const selected = provider(body.provider);
    if (!selected) {
      return NextResponse.json({ error: 'Unsupported social provider.' }, { status: 400 });
    }
    await disconnectOAuthCredential({ provider: selected, user });
    return NextResponse.json({ disconnected: true, provider: selected });
  } catch (error) {
    const status =
      error && typeof error === 'object' && 'status' in error
        ? Number((error as { status?: number }).status) || 500
        : 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'The account could not be disconnected.' },
      { status },
    );
  }
}
