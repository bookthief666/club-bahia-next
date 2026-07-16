import 'server-only';

import {
  buildProductionActivationSnapshot,
  inspectPublicSiteOrigin,
  type ActivationProviderStatus,
  type ProductionActivationSnapshot,
} from '@/lib/admin/activation/domain';
import { getAdminAuthConfigurationStatus } from '@/lib/admin/auth/token';
import { getPromotionAutopilotReadiness } from '@/lib/admin/autopilot/server/readiness';
import { isAdminWorkspaceStorageConfigured } from '@/lib/admin/workspaces/server';

function providerStatus(
  value: string | undefined,
): ActivationProviderStatus {
  if (
    value === 'connected' ||
    value === 'ready-for-connection' ||
    value === 'needs-attention' ||
    value === 'setup-required'
  ) {
    return value;
  }
  return 'setup-required';
}

export async function getProductionActivationSnapshot(): Promise<ProductionActivationSnapshot> {
  const [auth, autopilot] = await Promise.all([
    Promise.resolve(getAdminAuthConfigurationStatus()),
    getPromotionAutopilotReadiness(),
  ]);
  const meta = autopilot.accounts.find((account) => account.provider === 'meta');
  const tiktok = autopilot.accounts.find(
    (account) => account.provider === 'tiktok',
  );

  return buildProductionActivationSnapshot({
    environment: auth.deploymentEnvironment,
    authenticationConfigured: auth.configured,
    mockAuthenticationEnabled: auth.mockAuthenticationEnabled,
    encryptedStorageConfigured: isAdminWorkspaceStorageConfigured(),
    publicOrigin: inspectPublicSiteOrigin(process.env.NEXT_PUBLIC_SITE_URL),
    websitePublishingEnabled:
      process.env.PUBLIC_EVENT_PUBLISH_ENABLED === 'true',
    aiGenerationConfigured: Boolean(process.env.OPENAI_API_KEY?.trim()),
    metaStatus: providerStatus(meta?.status),
    schedulerReady: autopilot.scheduler.ready,
    tiktokStatus: providerStatus(tiktok?.status),
  });
}
