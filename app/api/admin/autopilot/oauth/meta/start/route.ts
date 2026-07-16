import { NextResponse } from 'next/server';
import { requireConnectionAdmin } from '@/lib/admin/autopilot/server/connection-access';
import { buildMetaAuthorizationUrl } from '@/lib/admin/autopilot/server/meta-oauth';
import {
  createOAuthState,
  setOAuthStateCookie,
} from '@/lib/admin/autopilot/server/oauth-state';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = requireConnectionAdmin(request);
    const requestUrl = new URL(request.url);
    const state = createOAuthState({
      provider: 'meta',
      user,
      returnTo: requestUrl.searchParams.get('returnTo') || '/admin/settings',
    });
    const response = NextResponse.redirect(buildMetaAuthorizationUrl(state));
    setOAuthStateCookie(response, 'meta', state);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Meta connection could not start.';
    const target = new URL('/admin/settings', request.url);
    target.searchParams.set('oauth_provider', 'meta');
    target.searchParams.set('oauth_status', 'error');
    target.searchParams.set('oauth_message', message.slice(0, 300));
    return NextResponse.redirect(target);
  }
}
