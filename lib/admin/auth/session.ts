import 'server-only';

import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { NextResponse } from 'next/server';
import type { AdminRole, AdminUser } from '@/lib/admin/domain';

export const ADMIN_SESSION_COOKIE = 'club_bahia_admin_session';
export const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 12;

export type AdminLoginRole = 'owner' | 'manager';

interface AdminSessionPayload {
  version: 1;
  sub: string;
  name: string;
  role: AdminLoginRole;
  initials: string;
  issuedAt: number;
  expiresAt: number;
}

interface AdminCredentialProfile {
  id: string;
  name: string;
  role: AdminLoginRole;
  initials: string;
  password: string;
}

function initialsForName(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
  return initials || 'CB';
}

function sessionSecret(): string {
  return process.env.ADMIN_AUTH_SECRET?.trim() ?? '';
}

function credentialProfiles(): AdminCredentialProfile[] {
  const ownerName = process.env.ADMIN_OWNER_NAME?.trim() || 'Club Bahia Owner';
  const managerName = process.env.ADMIN_MANAGER_NAME?.trim() || 'Club Bahia Manager';

  return [
    {
      id: 'club-bahia-owner',
      name: ownerName,
      role: 'owner',
      initials: initialsForName(ownerName),
      password: process.env.ADMIN_OWNER_PASSWORD ?? '',
    },
    {
      id: 'club-bahia-manager',
      name: managerName,
      role: 'manager',
      initials: initialsForName(managerName),
      password: process.env.ADMIN_MANAGER_PASSWORD ?? '',
    },
  ];
}

function digest(value: string): Buffer {
  return createHash('sha256').update(value, 'utf8').digest();
}

function constantTimeEqual(left: string, right: string): boolean {
  return timingSafeEqual(digest(left), digest(right));
}

function sign(encodedPayload: string): string {
  return createHmac('sha256', sessionSecret())
    .update(encodedPayload, 'utf8')
    .digest('base64url');
}

function isSessionPayload(value: unknown): value is AdminSessionPayload {
  if (!value || typeof value !== 'object') return false;
  const payload = value as Partial<AdminSessionPayload>;
  return (
    payload.version === 1 &&
    typeof payload.sub === 'string' &&
    typeof payload.name === 'string' &&
    (payload.role === 'owner' || payload.role === 'manager') &&
    typeof payload.initials === 'string' &&
    typeof payload.issuedAt === 'number' &&
    typeof payload.expiresAt === 'number'
  );
}

function payloadToUser(payload: AdminSessionPayload): AdminUser {
  return {
    id: payload.sub,
    name: payload.name,
    role: payload.role as AdminRole,
    avatarInitials: payload.initials,
  };
}

export function isProductionAdminAuthConfigured(): boolean {
  return (
    sessionSecret().length >= 32 &&
    credentialProfiles().some((profile) => profile.password.length >= 12)
  );
}

export function isManagerAdminAuthConfigured(): boolean {
  return credentialProfiles().some(
    (profile) => profile.role === 'manager' && profile.password.length >= 12,
  );
}

export function authenticateAdminCredential(
  role: AdminLoginRole,
  password: string,
): AdminUser | null {
  if (!isProductionAdminAuthConfigured()) return null;
  const profile = credentialProfiles().find((item) => item.role === role);
  if (!profile || profile.password.length < 12) return null;
  if (!constantTimeEqual(password, profile.password)) return null;

  return {
    id: profile.id,
    name: profile.name,
    role: profile.role,
    avatarInitials: profile.initials,
  };
}

export function createAdminSessionToken(
  user: AdminUser,
  now = new Date(),
): string {
  if (!isProductionAdminAuthConfigured()) {
    throw new Error('Production admin authentication is not configured.');
  }
  if (user.role !== 'owner' && user.role !== 'manager') {
    throw new Error('This account role cannot create an admin session.');
  }

  const issuedAt = Math.floor(now.getTime() / 1000);
  const payload: AdminSessionPayload = {
    version: 1,
    sub: user.id,
    name: user.name,
    role: user.role,
    initials: user.avatarInitials,
    issuedAt,
    expiresAt: issuedAt + ADMIN_SESSION_TTL_SECONDS,
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString(
    'base64url',
  );
  return `${encoded}.${sign(encoded)}`;
}

export function verifyAdminSessionToken(
  token: string | undefined,
  now = new Date(),
): AdminUser | null {
  if (!token || !isProductionAdminAuthConfigured()) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, signature] = parts;

  try {
    if (!constantTimeEqual(signature, sign(encoded))) return null;
    const parsed = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf8'),
    ) as unknown;
    if (!isSessionPayload(parsed)) return null;
    const nowSeconds = Math.floor(now.getTime() / 1000);
    if (parsed.expiresAt <= nowSeconds || parsed.issuedAt > nowSeconds + 60) {
      return null;
    }
    return payloadToUser(parsed);
  } catch {
    return null;
  }
}

export async function getCurrentAdminUser(): Promise<AdminUser | null> {
  const store = await cookies();
  return verifyAdminSessionToken(store.get(ADMIN_SESSION_COOKIE)?.value);
}

function mockAdminAllowed(): boolean {
  return (
    process.env.NODE_ENV !== 'production' ||
    process.env.VERCEL_ENV === 'preview' ||
    process.env.ADMIN_DEV_AUTH_ENABLED === 'true'
  );
}

function mockAdminUser(): AdminUser {
  const name = process.env.ADMIN_DEV_USER_NAME || 'Maya Rivera';
  return {
    id: 'dev-mock-admin',
    name,
    role: (process.env.ADMIN_DEV_USER_ROLE as AdminRole | undefined) || 'owner',
    avatarInitials: initialsForName(name),
  };
}

export async function requireAdminUser(): Promise<AdminUser> {
  const current = await getCurrentAdminUser();
  if (current) return current;

  if (!isProductionAdminAuthConfigured() && mockAdminAllowed()) {
    return mockAdminUser();
  }

  redirect('/login?next=/admin');
}

export function setAdminSessionCookie(
  response: NextResponse,
  token: string,
): void {
  response.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ADMIN_SESSION_TTL_SECONDS,
  });
}

export function clearAdminSessionCookie(response: NextResponse): void {
  response.cookies.set(ADMIN_SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });
}
