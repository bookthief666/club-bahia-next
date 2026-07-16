import { describe, expect, it } from 'vitest';
import {
  buildProductionActivationSnapshot,
  inspectPublicSiteOrigin,
  type ProductionActivationInput,
} from '../lib/admin/activation/domain';

function readyInput(
  overrides: Partial<ProductionActivationInput> = {},
): ProductionActivationInput {
  return {
    environment: 'production',
    authenticationConfigured: true,
    mockAuthenticationEnabled: false,
    encryptedStorageConfigured: true,
    publicOrigin: inspectPublicSiteOrigin('https://club-bahia.com'),
    websitePublishingEnabled: true,
    aiGenerationConfigured: true,
    metaStatus: 'connected',
    schedulerReady: true,
    tiktokStatus: 'setup-required',
    ...overrides,
  };
}

describe('production activation center', () => {
  it('separates the secure core launch from Instagram automation', () => {
    const snapshot = buildProductionActivationSnapshot(
      readyInput({ metaStatus: 'ready-for-connection', schedulerReady: false }),
    );

    expect(snapshot.coreReady).toBe(true);
    expect(snapshot.coreCompletionPercent).toBe(100);
    expect(snapshot.supervisedInstagramReady).toBe(false);
    expect(snapshot.unattendedInstagramReady).toBe(false);
    expect(snapshot.nextAction?.id).toBe('instagram');
  });

  it('blocks the production core when mock authentication is enabled', () => {
    const snapshot = buildProductionActivationSnapshot(
      readyInput({ mockAuthenticationEnabled: true }),
    );

    expect(snapshot.coreReady).toBe(false);
    expect(snapshot.coreReadyCount).toBe(snapshot.coreTotal - 1);
    expect(snapshot.nextAction?.id).toBe('mock-auth');
    expect(
      snapshot.checks.find((check) => check.id === 'mock-auth')?.status,
    ).toBe('action-required');
  });

  it('prioritizes authentication before later configuration work', () => {
    const snapshot = buildProductionActivationSnapshot(
      readyInput({
        authenticationConfigured: false,
        encryptedStorageConfigured: false,
        metaStatus: 'setup-required',
      }),
    );

    expect(snapshot.nextAction?.id).toBe('authentication');
    expect(snapshot.coreReady).toBe(false);
  });

  it('accepts stable HTTPS origins and rejects branch Preview origins', () => {
    expect(inspectPublicSiteOrigin('https://club-bahia.com')).toMatchObject({
      configured: true,
      stable: true,
      origin: 'https://club-bahia.com',
    });
    expect(
      inspectPublicSiteOrigin(
        'https://club-bahia-next-git-feature-bookthief.vercel.app',
      ),
    ).toMatchObject({ configured: true, stable: false });
    expect(inspectPublicSiteOrigin('https://club-bahia.example')).toMatchObject({
      configured: true,
      stable: false,
    });
    expect(inspectPublicSiteOrigin('http://localhost:3000')).toMatchObject({
      configured: true,
      stable: false,
    });
  });

  it('does not let TikTok block the Instagram-first launch', () => {
    const snapshot = buildProductionActivationSnapshot(readyInput());

    expect(snapshot.coreReady).toBe(true);
    expect(snapshot.supervisedInstagramReady).toBe(true);
    expect(snapshot.unattendedInstagramReady).toBe(true);
    expect(snapshot.nextAction).toBeNull();
    expect(snapshot.checks.find((check) => check.id === 'tiktok')).toMatchObject({
      phase: 'later',
      status: 'optional',
    });
  });
});
