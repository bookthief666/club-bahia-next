import { NextResponse } from 'next/server';
import { requireConnectionAdmin } from '@/lib/admin/autopilot/server/connection-access';
import {
  createOAuthState,
  setOAuthStateCookie,
} from '@/lib/admin/autopilot/server/oauth-state';
import { buildTikTokAuthorizationUrl } from '@/lib/admin/autopilot/server/tiktok-oauth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = requireConnectionAdmin(request);
    const requestUrl = new URL(request.url);
    const state = createOAuthState({
      provider: 'tiktok',
      user,
      returnTo: requestUrl.searchParams.get('returnTo') || '/admin/settings',
    });
    const response = NextResponse.redirect(buildTikTokAuthorizationUrl(state));
    setOAuthStateCookie(response, 'tiktok', state);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'TikTok connection could not start.';
    const target = new URL('/admin/settings', request.url);
    target.searchParams.set('oauth_provider', 'tiktok');
    target.searchParams.set('oauth_status', 'error');
    target.searchParams.set('oauth_message', message.slice(0, 300));
    return NextResponse.redirect(target);
  }
}
