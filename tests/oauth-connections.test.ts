import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  summarizeOAuthCredential,
  type OAuthCredentialRecord,
} from '../lib/admin/autopilot/server/credential-store';
import { buildMetaAuthorizationUrl } from '../lib/admin/autopilot/server/meta-oauth';
import {
  createOAuthState,
  verifyOAuthState,
} from '../lib/admin/autopilot/server/oauth-state';
import { buildTikTokAuthorizationUrl } from '../lib/admin/autopilot/server/tiktok-oauth';

const user = {
  id: 'club-bahia-owner',
  name: 'Club Bahia Owner',
  role: 'owner' as const,
  avatarInitials: 'CB',
};

beforeEach(() => {
  vi.stubEnv('ADMIN_AUTH_SECRET', 'oauth-test-secret-that-is-at-least-thirty-two-characters');
  vi.stubEnv('META_APP_ID', '1234567890');
  vi.stubEnv('META_APP_SECRET', 'meta-test-secret');
  vi.stubEnv('META_OAUTH_REDIRECT_URI', 'https://club-bahia.example/api/admin/autopilot/oauth/meta/callback');
  vi.stubEnv('META_GRAPH_API_VERSION', 'v24.0');
  vi.stubEnv('TIKTOK_CLIENT_KEY', 'tiktok-client-key');
  vi.stubEnv('TIKTOK_CLIENT_SECRET', 'tiktok-client-secret');
  vi.stubEnv('TIKTOK_OAUTH_REDIRECT_URI', 'https://club-bahia.example/api/admin/autopilot/oauth/tiktok/callback');
});

describe('OAuth connection security boundary', () => {
  it('creates and verifies a signed, short-lived provider state', () => {
    const now = new Date('2026-07-15T12:00:00.000Z');
    const state = createOAuthState({
      provider: 'tiktok',
      user,
      returnTo: '/admin/settings?section=connections',
      now,
    });

    const verified = verifyOAuthState({
      provider: 'tiktok',
      state,
      cookieState: state,
      user,
      now: new Date('2026-07-15T12:05:00.000Z'),
    });

    expect(verified).toMatchObject({
      provider: 'tiktok',
      adminId: user.id,
      returnTo: '/admin/settings?section=connections',
    });
  });

  it('rejects mismatched cookies, users, providers, and expired state', () => {
    const now = new Date('2026-07-15T12:00:00.000Z');
    const state = createOAuthState({ provider: 'meta', user, now });

    expect(
      verifyOAuthState({
        provider: 'meta',
        state,
        cookieState: `${state}x`,
        user,
        now,
      }),
    ).toBeNull();
    expect(
      verifyOAuthState({
        provider: 'tiktok',
        state,
        cookieState: state,
        user,
        now,
      }),
    ).toBeNull();
    expect(
      verifyOAuthState({
        provider: 'meta',
        state,
        cookieState: state,
        user: { ...user, id: 'another-admin' },
        now,
      }),
    ).toBeNull();
    expect(
      verifyOAuthState({
        provider: 'meta',
        state,
        cookieState: state,
        user,
        now: new Date('2026-07-15T12:11:00.000Z'),
      }),
    ).toBeNull();
  });

  it('rejects external return destinations', () => {
    const now = new Date('2026-07-15T12:00:00.000Z');
    const state = createOAuthState({
      provider: 'meta',
      user,
      returnTo: 'https://malicious.example/steal',
      now,
    });
    const verified = verifyOAuthState({
      provider: 'meta',
      state,
      cookieState: state,
      user,
      now,
    });
    expect(verified?.returnTo).toBe('/admin/settings');
  });

  it('never exposes encrypted provider material in browser summaries', () => {
    const record: OAuthCredentialRecord = {
      schemaVersion: 1,
      provider: 'tiktok',
      status: 'connected',
      secretMaterial: 'private-access-material-that-must-never-render',
      renewableMaterial: 'private-renewable-material-that-must-never-render',
      scopes: ['user.info.basic', 'video.publish'],
      expiresAt: '2026-07-16T12:00:00.000Z',
      renewableUntil: '2027-07-15T12:00:00.000Z',
      accountId: 'creator-open-id',
      accountLabel: 'Club Bahia TikTok',
      connectedAt: '2026-07-15T12:00:00.000Z',
      updatedAt: '2026-07-15T12:00:00.000Z',
    };
    const summary = summarizeOAuthCredential(record);
    expect(summary).not.toHaveProperty('secretMaterial');
    expect(summary).not.toHaveProperty('renewableMaterial');
    expect(summary).toMatchObject({
      provider: 'tiktok',
      accountLabel: 'Club Bahia TikTok',
      renewable: true,
    });
  });

  it('builds provider authorization URLs with explicit state and approved scopes', () => {
    const meta = new URL(buildMetaAuthorizationUrl('meta-state'));
    expect(meta.searchParams.get('state')).toBe('meta-state');
    expect(meta.searchParams.get('scope')).toContain('instagram_content_publish');

    const tiktok = new URL(buildTikTokAuthorizationUrl('tiktok-state'));
    expect(tiktok.origin).toBe('https://www.tiktok.com');
    expect(tiktok.searchParams.get('state')).toBe('tiktok-state');
    expect(tiktok.searchParams.get('scope')).toBe('user.info.basic,video.publish');
  });
});
