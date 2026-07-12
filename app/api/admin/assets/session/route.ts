import { NextResponse } from 'next/server';
import { isMockAdminEnabled } from '@/lib/admin/mock-auth';
import {
  clearAssetSessionCookie,
  hasAssetSession,
  setAssetSessionCookie,
  validateAssetAccessCode,
} from '@/lib/admin/assets/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' };

export async function GET(request: Request) {
  if (!isMockAdminEnabled) {
    return NextResponse.json(
      { authorized: false },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }

  const authorized = hasAssetSession(request);
  return NextResponse.json(
    { authorized },
    { status: authorized ? 200 : 401, headers: NO_STORE_HEADERS },
  );
}

export async function POST(request: Request) {
  if (!isMockAdminEnabled) {
    return NextResponse.json(
      { error: 'Media sessions are disabled in this environment.' },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }

  let accessCode = '';
  try {
    const body = (await request.json()) as { accessCode?: unknown };
    accessCode = typeof body.accessCode === 'string' ? body.accessCode.trim() : '';
  } catch {
    return NextResponse.json(
      { error: 'A valid access code is required.' },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  try {
    validateAssetAccessCode(accessCode);
    const response = NextResponse.json(
      { authorized: true },
      { headers: NO_STORE_HEADERS },
    );
    setAssetSessionCookie(response);
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Access denied.' },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json(
    { authorized: false },
    { headers: NO_STORE_HEADERS },
  );
  clearAssetSessionCookie(response);
  return response;
}
