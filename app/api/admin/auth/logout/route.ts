import { NextResponse } from 'next/server';
import { clearAdminSessionCookie } from '@/lib/admin/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL('/login', request.url), 303);
  response.headers.set('Cache-Control', 'no-store, max-age=0');
  clearAdminSessionCookie(response);
  return response;
}
