import 'server-only';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { NextResponse } from 'next/server';
import type { AdminRole, AdminUser } from '@/lib/admin/domain';
import { shouldAllowMockAdmin } from '@/lib/admin/auth/domain';
import {
  ADMIN_SESSION_TTL_SECONDS,
  authenticateAdminCredential,
  createAdminSessionToken,
  getAdminAuthConfigurationStatus,
  isManagerAdminAuthConfigured,
  isProductionAdminAuthConfigured,
  verifyAdminSessionToken,
} from '@/lib/admin/auth/token';

export {
  ADMIN_SESSION_TTL_SECONDS,
  authenticateAdminCredential,
  createAdminSessionToken,
  getAdminAuthConfigurationStatus,
  isManagerAdminAuthConfigured,
  isProductionAdminAuthConfigured,
  verifyAdminSessionToken,
};
export type {
  AdminAuthConfigurationStatus,
  AdminLoginRole,
} from '@/lib/admin/auth/domain';

export const ADMIN_SESSION_COOKIE = 'club_bahia_admin_session';

export class AdminAuthenticationError extends Error {
  readonly status = 401;

  constructor(message = 'Admin sign-in is required.') {
    super(message);
    this.name = 'AdminAuthenticationError';
  }
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

function mockAdminAllowed(): boolean {
  return shouldAllowMockAdmin({
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    devAuthEnabled: process.env.ADMIN_DEV_AUTH_ENABLED,
  });
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

function cookieValue(request: Request, name: string): string | undefined {
  const header = request.headers.get('cookie') ?? '';
  for (const item of header.split(';')) {
    const [key, ...valueParts] = item.trim().split('=');
    if (key === name) return decodeURIComponent(valueParts.join('='));
  }
  return undefined;
}

export function getAdminUserFromRequest(request: Request): AdminUser | null {
  return verifyAdminSessionToken(cookieValue(request, ADMIN_SESSION_COOKIE));
}

export function requireAdminRequest(request: Request): AdminUser {
  const current = getAdminUserFromRequest(request);
  if (current) return current;

  if (!isProductionAdminAuthConfigured() && mockAdminAllowed()) {
    return mockAdminUser();
  }

  throw new AdminAuthenticationError();
}

export async function getCurrentAdminUser(): Promise<AdminUser | null> {
  const store = await cookies();
  return verifyAdminSessionToken(store.get(ADMIN_SESSION_COOKIE)?.value);
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
