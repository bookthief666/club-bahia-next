import { NextResponse } from 'next/server';
import { requireConnectionAdmin } from '@/lib/admin/autopilot/server/connection-access';
import { saveOAuthCredential } from '@/lib/admin/autopilot/server/credential-store';
import { exchangeMetaAuthorizationCode } from '@/lib/admin/autopilot/server/meta-oauth';
import {
  clearOAuthStateCookie,
  oauthStateCookieName,
  readCookie,
  verifyOAuthState,
} from '@/lib/admin/autopilot/server/oauth-state';

export const dynamic = 'force-dynamic';

function redirectResult(
  request: Request,
  returnTo: string,
  status: 'connected' | 'error',
  message: string,
) {
  const target = new URL(returnTo, request.url);
  target.searchParams.set('oauth_provider', 'meta');
  target.searchParams.set('oauth_status', status);
  target.searchParams.set('oauth_message', message.slice(0, 300));
  const response = NextResponse.redirect(target);
  clearOAuthStateCookie(response, 'meta');
  return response;
}

export async function GET(request: Request) {
  let returnTo = '/admin/settings';
  try {
    const user = requireConnectionAdmin(request);
    const url = new URL(request.url);
    const state = verifyOAuthState({
      provider: 'meta',
      state: url.searchParams.get('state') || undefined,
      cookieState: readCookie(request, oauthStateCookieName('meta')),
      user,
    });
    if (!state) {
      return redirectResult(
        request,
        returnTo,
        'error',
        'Meta connection expired or failed its security check. Start again from Publishing Connections.',
      );
    }
    returnTo = state.returnTo;
    const providerError = url.searchParams.get('error_description') || url.searchParams.get('error');
    if (providerError) {
      return redirectResult(request, returnTo, 'error', providerError);
    }
    const code = url.searchParams.get('code')?.trim();
    if (!code) {
      return redirectResult(request, returnTo, 'error', 'Meta did not return an authorization code.');
    }
    const result = await exchangeMetaAuthorizationCode(code);
    await saveOAuthCredential({
      provider: 'meta',
      secretMaterial: result.secretMaterial,
      scopes: result.scopes,
      expiresAt: result.expiresAt,
      accountId: result.accountId,
      accountLabel: result.accountLabel,
      accountUsername: result.accountUsername,
      relatedPageId: result.relatedPageId,
      relatedInstagramId: result.relatedInstagramId,
      user,
    });
    return redirectResult(
      request,
      returnTo,
      'connected',
      `${result.accountLabel} is connected for controlled Instagram publishing.`,
    );
  } catch (error) {
    return redirectResult(
      request,
      returnTo,
      'error',
      error instanceof Error ? error.message : 'Meta connection failed.',
    );
  }
}
