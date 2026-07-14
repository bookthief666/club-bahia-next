import 'server-only';

import type { OAuthCredentialRecord } from '@/lib/admin/autopilot/server/credential-store';

interface TikTokTokenPayload {
  access_token?: string;
  expires_in?: number;
  open_id?: string;
  refresh_expires_in?: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
  log_id?: string;
}

export interface TikTokOAuthResult {
  secretMaterial: string;
  renewableMaterial: string;
  accountId: string;
  scopes: string[];
  expiresAt: string;
  renewableUntil: string;
}

function configuration() {
  const clientKey = process.env.TIKTOK_CLIENT_KEY?.trim() ?? '';
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET?.trim() ?? '';
  const redirectUri = process.env.TIKTOK_OAUTH_REDIRECT_URI?.trim() ?? '';
  if (!clientKey || !clientSecret || !redirectUri) {
    throw new Error('TikTok OAuth application settings are incomplete.');
  }
  const parsed = new URL(redirectUri);
  if (parsed.protocol !== 'https:' && process.env.NODE_ENV === 'production') {
    throw new Error('TikTok OAuth redirect URI must use HTTPS in production.');
  }
  return { clientKey, clientSecret, redirectUri };
}

function scopes(value: string | undefined): string[] {
  return Array.from(
    new Set(
      (value ?? '')
        .split(',')
        .map((scope) => scope.trim())
        .filter(Boolean),
    ),
  ).sort();
}

function futureIso(seconds: number | undefined, now: Date): string {
  const safeSeconds = Number.isFinite(seconds) && Number(seconds) > 0 ? Number(seconds) : 0;
  return new Date(now.getTime() + safeSeconds * 1000).toISOString();
}

function parseTokenPayload(payload: TikTokTokenPayload, now = new Date()): TikTokOAuthResult {
  if (payload.error || !payload.access_token || !payload.refresh_token || !payload.open_id) {
    throw new Error(
      payload.error_description || payload.error || 'TikTok did not return a complete authorization response.',
    );
  }
  return {
    secretMaterial: payload.access_token,
    renewableMaterial: payload.refresh_token,
    accountId: payload.open_id,
    scopes: scopes(payload.scope),
    expiresAt: futureIso(payload.expires_in, now),
    renewableUntil: futureIso(payload.refresh_expires_in, now),
  };
}

async function tokenRequest(body: URLSearchParams): Promise<TikTokTokenPayload> {
  const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
    cache: 'no-store',
  });
  const payload = (await response.json()) as TikTokTokenPayload;
  if (!response.ok) {
    throw new Error(
      payload.error_description || payload.error || `TikTok authorization failed with status ${response.status}.`,
    );
  }
  return payload;
}

export function isTikTokOAuthConfigured(): boolean {
  try {
    configuration();
    return true;
  } catch {
    return false;
  }
}

export function buildTikTokAuthorizationUrl(state: string): string {
  const config = configuration();
  const url = new URL('https://www.tiktok.com/v2/auth/authorize/');
  url.searchParams.set('client_key', config.clientKey);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'user.info.basic,video.publish');
  url.searchParams.set('redirect_uri', config.redirectUri);
  url.searchParams.set('state', state);
  url.searchParams.set('disable_auto_auth', '1');
  return url.toString();
}

export async function exchangeTikTokAuthorizationCode(
  code: string,
  now = new Date(),
): Promise<TikTokOAuthResult> {
  const config = configuration();
  const payload = await tokenRequest(
    new URLSearchParams({
      client_key: config.clientKey,
      client_secret: config.clientSecret,
      code: code.trim(),
      grant_type: 'authorization_code',
      redirect_uri: config.redirectUri,
    }),
  );
  return parseTokenPayload(payload, now);
}

export async function refreshTikTokAuthorization(
  credential: OAuthCredentialRecord,
  now = new Date(),
): Promise<TikTokOAuthResult> {
  if (credential.provider !== 'tiktok' || !credential.renewableMaterial) {
    throw new Error('The TikTok connection does not contain renewable authorization material.');
  }
  const config = configuration();
  const payload = await tokenRequest(
    new URLSearchParams({
      client_key: config.clientKey,
      client_secret: config.clientSecret,
      grant_type: 'refresh_token',
      refresh_token: credential.renewableMaterial,
    }),
  );
  return parseTokenPayload(payload, now);
}
