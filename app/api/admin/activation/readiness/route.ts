import { NextResponse } from 'next/server';
import { getProductionActivationSnapshot } from '@/lib/admin/activation/server';
import { requireAdminRequest } from '@/lib/admin/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
};

export async function GET(request: Request) {
  try {
    requireAdminRequest(request);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unauthorized.' },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }

  return NextResponse.json(await getProductionActivationSnapshot(), {
    headers: NO_STORE_HEADERS,
  });
}
