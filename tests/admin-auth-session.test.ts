import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  authenticateAdminCredential,
  createAdminSessionToken,
  isManagerAdminAuthConfigured,
  isProductionAdminAuthConfigured,
  verifyAdminSessionToken,
} from '../lib/admin/auth/token';

const originalEnv = { ...process.env };

beforeEach(() => {
  process.env.ADMIN_AUTH_SECRET = 'a'.repeat(48);
  process.env.ADMIN_OWNER_NAME = 'Luis Bahia';
  process.env.ADMIN_OWNER_PASSWORD = 'owner-password-123';
  process.env.ADMIN_MANAGER_NAME = 'Maya Rivera';
  process.env.ADMIN_MANAGER_PASSWORD = 'manager-password-123';
});

afterEach(() => {
  process.env = { ...originalEnv };
});

describe('production admin authentication', () => {
  it('requires a long signing secret and at least one long password', () => {
    expect(isProductionAdminAuthConfigured()).toBe(true);
    expect(isManagerAdminAuthConfigured()).toBe(true);

    process.env.ADMIN_AUTH_SECRET = 'short';
    expect(isProductionAdminAuthConfigured()).toBe(false);
  });

  it('authenticates the selected account without accepting another role password', () => {
    const owner = authenticateAdminCredential('owner', 'owner-password-123');
    expect(owner).toMatchObject({
      id: 'club-bahia-owner',
      name: 'Luis Bahia',
      role: 'owner',
      avatarInitials: 'LB',
    });
    expect(
      authenticateAdminCredential('owner', 'manager-password-123'),
    ).toBeNull();
    expect(
      authenticateAdminCredential('manager', 'manager-password-123'),
    ).toMatchObject({ role: 'manager', avatarInitials: 'MR' });
  });

  it('creates a signed session that expires after twelve hours', () => {
    const user = authenticateAdminCredential('owner', 'owner-password-123');
    expect(user).not.toBeNull();
    if (!user) return;

    const issuedAt = new Date('2026-07-13T12:00:00.000Z');
    const token = createAdminSessionToken(user, issuedAt);
    expect(
      verifyAdminSessionToken(
        token,
        new Date('2026-07-13T20:00:00.000Z'),
      ),
    ).toEqual(user);
    expect(
      verifyAdminSessionToken(
        token,
        new Date('2026-07-14T00:00:01.000Z'),
      ),
    ).toBeNull();
  });

  it('rejects a token when either the payload or signature is changed', () => {
    const user = authenticateAdminCredential('owner', 'owner-password-123');
    expect(user).not.toBeNull();
    if (!user) return;

    const token = createAdminSessionToken(
      user,
      new Date('2026-07-13T12:00:00.000Z'),
    );
    const [payload, signature] = token.split('.');
    expect(
      verifyAdminSessionToken(
        `${payload}x.${signature}`,
        new Date('2026-07-13T12:30:00.000Z'),
      ),
    ).toBeNull();
    expect(
      verifyAdminSessionToken(
        `${payload}.${signature.slice(0, -1)}x`,
        new Date('2026-07-13T12:30:00.000Z'),
      ),
    ).toBeNull();
  });
});
