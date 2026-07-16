import { afterEach, describe, expect, it } from 'vitest';
import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
} from '../lib/admin/auth/session';
import { requireAdminResourceAccess } from '../lib/admin/auth/resource-access';

const ENV_KEYS = [
  'ADMIN_AUTH_SECRET',
  'ADMIN_OWNER_PASSWORD',
  'ADMIN_MANAGER_PASSWORD',
  'ADMIN_ASSET_UPLOAD_SECRET',
  'BLOB_READ_WRITE_TOKEN',
] as const;

const originalEnv = Object.fromEntries(
  ENV_KEYS.map((key) => [key, process.env[key]]),
) as Record<(typeof ENV_KEYS)[number], string | undefined>;

afterEach(() => {
  for (const key of ENV_KEYS) {
    const value = originalEnv[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

function configureAdminAuth() {
  process.env.ADMIN_AUTH_SECRET = 'owner-presentation-test-secret-1234567890';
  process.env.ADMIN_OWNER_PASSWORD = 'owner-password-1234';
  delete process.env.ADMIN_MANAGER_PASSWORD;
}

describe('private admin resource access', () => {
  it('uses the signed staff session without requiring a second media password', () => {
    configureAdminAuth();
    delete process.env.ADMIN_ASSET_UPLOAD_SECRET;
    delete process.env.BLOB_READ_WRITE_TOKEN;

    const user = {
      id: 'club-bahia-owner',
      name: 'Club Bahia Owner',
      role: 'owner' as const,
      avatarInitials: 'CB',
    };
    const token = createAdminSessionToken(user, new Date('2026-07-16T12:00:00.000Z'));
    const request = new Request('https://club-bahia.example/api/admin/assets/library', {
      headers: {
        cookie: `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(token)}`,
      },
    });

    expect(requireAdminResourceAccess(request)).toEqual(user);
  });

  it('still rejects requests that do not have a valid staff session', () => {
    configureAdminAuth();
    const request = new Request('https://club-bahia.example/api/admin/assets/library');

    expect(() => requireAdminResourceAccess(request)).toThrow(
      'Admin sign-in is required.',
    );
  });
});
