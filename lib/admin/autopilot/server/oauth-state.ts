import 'server-only';

import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { NextResponse } from 'next/server';
import type { AdminUser } from '@/lib/admin/domain';
import type { OAuthProvider } from '@/lib/admin/autopilot/server/credential-store';

const OAUTH_STATE_TTL_SECONDS = 10 * 60;

interface OAuthStatePayload {
  version: 1;
  provider: OAuthProvider;
  adminId: string;
  nonce: string;
  returnTo: string;
  issuedAt: number;
  expiresAt: number;
}

function stateSecret(): string {
  const value =
    process.env.OAUTH_STATE_SECRET?.trim() ||
    process.env.ADMIN_AUTH_SECRET?.trim() ||
    '';
  if (value.length < 32) {
    throw new Error('OAuth state protection requires a server secret with at least 32 characters.');
  }
  return value;
}

function digest(value: string): Buffer {
  return createHash('sha256').update(value, 'utf8').digest();
}

function equal(left: string, right: string): boolean {
  return timingSafeEqual(digest(left), digest(right));
}

function sign(encoded: string): string {
  return createHmac('sha256', stateSecret())
    .update(encoded, 'utf8')
    .digest('base64url');
}

function safeReturnTo(value: string | undefined): string {
  const candidate = value?.trim() || '/admin/settings';
  return candidate.startsWith('/admin') && !candidate.startsWith('//')
    ? candidate
    : '/admin/settings';
}

function isPayload(value: unknown): value is OAuthStatePayload {
  if (!value || typeof value !== 'object') return false;
  const payload = value as Partial<OAuthStatePayload>;
  return (
    payload.version === 1 &&
    (payload.provider === 'meta' || payload.provider === 'tiktok') &&
    typeof payload.adminId === 'string' &&
    typeof payload.nonce === 'string' &&
    typeof payload.returnTo === 'string' &&
    typeof payload.issuedAt === 'number' &&
    typeof payload.expiresAt === 'number'
  );
}

export function oauthStateCookieName(provider: OAuthProvider): string {
  return `club_bahia_oauth_${provider}`;
}

export function createOAuthState(input: {
  provider: OAuthProvider;
  user: AdminUser;
  returnTo?: string;
  now?: Date;
}): string {
  const nowSeconds = Math.floor((input.now ?? new Date()).getTime() / 1000);
  const payload: OAuthStatePayload = {
    version: 1,
    provider: input.provider,
    adminId: input.user.id,
    nonce: randomBytes(24).toString('base64url'),
    returnTo: safeReturnTo(input.returnTo),
    issuedAt: nowSeconds,
    expiresAt: nowSeconds + OAUTH_STATE_TTL_SECONDS,
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  return `${encoded}.${sign(encoded)}`;
}

export function verifyOAuthState(input: {
  provider: OAuthProvider;
  state: string | undefined;
  cookieState: string | undefined;
  user: AdminUser;
  now?: Date;
}): OAuthStatePayload | null {
  if (!input.state || !input.cookieState || !equal(input.state, input.cookieState)) {
    return null;
  }
  const parts = input.state.split('.');
  if (parts.length !== 2) return null;
  const [encoded, signature] = parts;
  try {
    if (!equal(signature, sign(encoded))) return null;
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as unknown;
    if (!isPayload(parsed)) return null;
    const nowSeconds = Math.floor((input.now ?? new Date()).getTime() / 1000);
    if (
      parsed.provider !== input.provider ||
      parsed.adminId !== input.user.id ||
      parsed.expiresAt <= nowSeconds ||
      parsed.issuedAt > nowSeconds + 60
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function setOAuthStateCookie(
  response: NextResponse,
  provider: OAuthProvider,
  state: string,
): void {
  response.cookies.set(oauthStateCookieName(provider), state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: OAUTH_STATE_TTL_SECONDS,
  });
}

export function clearOAuthStateCookie(
  response: NextResponse,
  provider: OAuthProvider,
): void {
  response.cookies.set(oauthStateCookieName(provider), '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });
}

export function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get('cookie') ?? '';
  for (const item of header.split(';')) {
    const [key, ...parts] = item.trim().split('=');
    if (key === name) return decodeURIComponent(parts.join('='));
  }
  return undefined;
}
