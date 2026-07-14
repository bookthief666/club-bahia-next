import { NextResponse } from 'next/server';
import {
  authenticateAdminCredential,
  createAdminSessionToken,
  isProductionAdminAuthConfigured,
  setAdminSessionCookie,
  type AdminLoginRole,
} from '@/lib/admin/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' };
const MAX_ATTEMPTS = 6;
const WINDOW_MS = 15 * 60 * 1000;

type AttemptRecord = { count: number; resetAt: number };

declare global {
  var __clubBahiaAdminLoginAttempts: Map<string, AttemptRecord> | undefined;
}

const attempts =
  globalThis.__clubBahiaAdminLoginAttempts ??
  (globalThis.__clubBahiaAdminLoginAttempts = new Map<string, AttemptRecord>());

function clientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || request.headers.get('x-real-ip') || 'unknown';
}

function currentAttempt(key: string, now: number): AttemptRecord {
  const existing = attempts.get(key);
  if (!existing || existing.resetAt <= now) {
    const next = { count: 0, resetAt: now + WINDOW_MS };
    attempts.set(key, next);
    return next;
  }
  return existing;
}

function sanitizeNext(value: unknown): string {
  if (typeof value !== 'string') return '/admin';
  if (!value.startsWith('/admin') || value.startsWith('//')) return '/admin';
  return value;
}

export async function POST(request: Request) {
  if (!isProductionAdminAuthConfigured()) {
    return NextResponse.json(
      {
        error:
          'Admin sign-in is not configured. Add ADMIN_AUTH_SECRET and at least one 12-character admin password.',
        code: 'ADMIN_AUTH_NOT_CONFIGURED',
      },
      { status: 503, headers: NO_STORE_HEADERS },
    );
  }

  const key = clientKey(request);
  const now = Date.now();
  const attempt = currentAttempt(key, now);
  if (attempt.count >= MAX_ATTEMPTS) {
    return NextResponse.json(
      {
        error: 'Too many sign-in attempts. Wait a few minutes and try again.',
        retryAfterSeconds: Math.max(1, Math.ceil((attempt.resetAt - now) / 1000)),
      },
      {
        status: 429,
        headers: {
          ...NO_STORE_HEADERS,
          'Retry-After': String(
            Math.max(1, Math.ceil((attempt.resetAt - now) / 1000)),
          ),
        },
      },
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Sign-in request must be valid JSON.' },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const input = raw as { role?: unknown; password?: unknown; next?: unknown };
  const role: AdminLoginRole | null =
    input.role === 'owner' || input.role === 'manager' ? input.role : null;
  const password = typeof input.password === 'string' ? input.password : '';

  if (!role || !password) {
    return NextResponse.json(
      { error: 'Choose an account type and enter the password.' },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const user = authenticateAdminCredential(role, password);
  if (!user) {
    attempt.count += 1;
    attempts.set(key, attempt);
    await new Promise((resolve) => setTimeout(resolve, 450));
    return NextResponse.json(
      { error: 'The account type or password is incorrect.' },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }

  attempts.delete(key);
  const response = NextResponse.json(
    { user, next: sanitizeNext(input.next) },
    { status: 200, headers: NO_STORE_HEADERS },
  );
  setAdminSessionCookie(response, createAdminSessionToken(user));
  return response;
}
