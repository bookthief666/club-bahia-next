import { NextResponse } from 'next/server';
import { requireConnectionAdmin } from '@/lib/admin/autopilot/server/connection-access';
import { saveOAuthCredential } from '@/lib/admin/autopilot/server/credential-store';
import {
  clearOAuthStateCookie,
  oauthStateCookieName,
  readCookie,
  verifyOAuthState,
} from '@/lib/admin/autopilot/server/oauth-state';
import { exchangeTikTokAuthorizationCode } from '@/lib/admin/autopilot/server/tiktok-oauth';

export const dynamic = 'force-dynamic';

function redirectResult(
  request: Request,
  returnTo: string,
  status: 'connected' | 'error',
  message: string,
) {
  const target = new URL(returnTo, request.url);
  target.searchParams.set('oauth_provider', 'tiktok');
  target.searchParams.set('oauth_status', status);
  target.searchParams.set('oauth_message', message.slice(0, 300));
  const response = NextResponse.redirect(target);
  clearOAuthStateCookie(response, 'tiktok');
  return response;
}

export async function GET(request: Request) {
  let returnTo = '/admin/settings';
  try {
    const user = requireConnectionAdmin(request);
    const url = new URL(request.url);
    const state = verifyOAuthState({
      provider: 'tiktok',
      state: url.searchParams.get('state') || undefined,
      cookieState: readCookie(request, oauthStateCookieName('tiktok')),
      user,
    });
    if (!state) {
      return redirectResult(
        request,
        returnTo,
        'error',
        'TikTok connection expired or failed its security check. Start again from Publishing Connections.',
      );
    }
    returnTo = state.returnTo;
    const providerError = url.searchParams.get('error_description') || url.searchParams.get('error');
    if (providerError) {
      return redirectResult(request, returnTo, 'error', providerError);
    }
    const code = url.searchParams.get('code')?.trim();
    if (!code) {
      return redirectResult(request, returnTo, 'error', 'TikTok did not return an authorization code.');
    }
    const result = await exchangeTikTokAuthorizationCode(code);
    await saveOAuthCredential({
      provider: 'tiktok',
      secretMaterial: result.secretMaterial,
      renewableMaterial: result.renewableMaterial,
      scopes: result.scopes,
      expiresAt: result.expiresAt,
      renewableUntil: result.renewableUntil,
      accountId: result.accountId,
      accountLabel: 'Club Bahia TikTok',
      user,
    });
    return redirectResult(
      request,
      returnTo,
      'connected',
      'Club Bahia TikTok is connected with renewable authorization.',
    );
  } catch (error) {
    return redirectResult(
      request,
      returnTo,
      'error',
      error instanceof Error ? error.message : 'TikTok connection failed.',
    );
  }
}
