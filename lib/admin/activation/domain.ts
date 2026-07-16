export type ActivationEnvironment =
  | 'production'
  | 'preview'
  | 'development'
  | 'unknown';

export type ActivationCheckStatus = 'ready' | 'action-required' | 'optional';
export type ActivationPhase = 'core' | 'automation' | 'later';
export type ActivationProviderStatus =
  | 'connected'
  | 'ready-for-connection'
  | 'needs-attention'
  | 'setup-required';

export interface PublicOriginInspection {
  configured: boolean;
  stable: boolean;
  origin: string | null;
  reason: string;
}

export interface ProductionActivationInput {
  environment: ActivationEnvironment;
  authenticationConfigured: boolean;
  mockAuthenticationEnabled: boolean;
  encryptedStorageConfigured: boolean;
  publicOrigin: PublicOriginInspection;
  websitePublishingEnabled: boolean;
  aiGenerationConfigured: boolean;
  metaStatus: ActivationProviderStatus;
  schedulerReady: boolean;
  tiktokStatus: ActivationProviderStatus;
}

export interface ActivationCheck {
  id: string;
  phase: ActivationPhase;
  label: string;
  status: ActivationCheckStatus;
  summary: string;
  nextAction: string;
  href?: string;
}

export interface ProductionActivationSnapshot {
  environment: ActivationEnvironment;
  coreReady: boolean;
  supervisedInstagramReady: boolean;
  unattendedInstagramReady: boolean;
  coreReadyCount: number;
  coreTotal: number;
  coreCompletionPercent: number;
  nextAction: ActivationCheck | null;
  checks: ActivationCheck[];
}

function actionCheck(input: Omit<ActivationCheck, 'status'> & { ready: boolean }): ActivationCheck {
  return {
    id: input.id,
    phase: input.phase,
    label: input.label,
    status: input.ready ? 'ready' : 'action-required',
    summary: input.summary,
    nextAction: input.nextAction,
    href: input.href,
  };
}

export function inspectPublicSiteOrigin(value: string | undefined): PublicOriginInspection {
  const candidate = value?.trim() ?? '';
  if (!candidate) {
    return {
      configured: false,
      stable: false,
      origin: null,
      reason: 'Set NEXT_PUBLIC_SITE_URL to the final public website origin.',
    };
  }

  try {
    const parsed = new URL(candidate);
    const hostname = parsed.hostname.toLowerCase();
    const isOriginOnly =
      (parsed.pathname === '/' || parsed.pathname === '') &&
      !parsed.search &&
      !parsed.hash &&
      !parsed.username &&
      !parsed.password;
    const isLocal =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname.endsWith('.local');
    const isPlaceholder = hostname.endsWith('.example');
    const isEphemeralPreview =
      hostname.includes('-git-') || hostname.includes('-preview-');
    const stable =
      parsed.protocol === 'https:' &&
      isOriginOnly &&
      !isLocal &&
      !isPlaceholder &&
      !isEphemeralPreview;

    return {
      configured: true,
      stable,
      origin: parsed.origin,
      reason: stable
        ? 'The public origin is HTTPS and does not look like an ephemeral Preview deployment.'
        : 'Use one stable HTTPS origin with no path, query, placeholder hostname, localhost, or branch Preview hostname.',
    };
  } catch {
    return {
      configured: true,
      stable: false,
      origin: null,
      reason: 'NEXT_PUBLIC_SITE_URL is not a valid absolute URL.',
    };
  }
}

export function buildProductionActivationSnapshot(
  input: ProductionActivationInput,
): ProductionActivationSnapshot {
  const productionMockAuthSafe =
    input.environment !== 'production' || !input.mockAuthenticationEnabled;

  const checks: ActivationCheck[] = [
    actionCheck({
      id: 'authentication',
      phase: 'core',
      label: 'Production staff authentication',
      ready: input.authenticationConfigured,
      summary: input.authenticationConfigured
        ? 'Signed owner or manager sessions are configured.'
        : 'The Growth OS cannot protect staff operations until a signing secret and at least one valid password are configured.',
      nextAction: 'Configure ADMIN_AUTH_SECRET and an owner or manager password in the Production environment.',
      href: '/login',
    }),
    actionCheck({
      id: 'mock-auth',
      phase: 'core',
      label: 'Production mock access disabled',
      ready: productionMockAuthSafe,
      summary: productionMockAuthSafe
        ? 'Production will not bypass the signed staff login.'
        : 'Development mock authentication is enabled in Production.',
      nextAction: 'Set ADMIN_DEV_AUTH_ENABLED=false for Production.',
    }),
    actionCheck({
      id: 'encrypted-storage',
      phase: 'core',
      label: 'Encrypted shared storage',
      ready: input.encryptedStorageConfigured,
      summary: input.encryptedStorageConfigured
        ? 'Events, campaigns, reservations, credentials, queue jobs, and receipts can persist across devices.'
        : 'The app is missing Vercel Blob access or a valid 32-character encryption secret.',
      nextAction: 'Configure BLOB_READ_WRITE_TOKEN and GROWTH_OS_DATA_SECRET.',
    }),
    actionCheck({
      id: 'public-origin',
      phase: 'core',
      label: 'Stable public website origin',
      ready: input.publicOrigin.stable,
      summary: input.publicOrigin.origin
        ? `${input.publicOrigin.origin} — ${input.publicOrigin.reason}`
        : input.publicOrigin.reason,
      nextAction: 'Set NEXT_PUBLIC_SITE_URL to the final stable HTTPS origin used in campaign and OAuth links.',
    }),
    actionCheck({
      id: 'website-publishing',
      phase: 'core',
      label: 'Public event publishing enabled',
      ready: input.websitePublishingEnabled,
      summary: input.websitePublishingEnabled
        ? 'Approved event listings can be published to the public Club Bahia website.'
        : 'Preview publication remains available, but live website publication is still switched off.',
      nextAction: 'After confirming the public origin, set PUBLIC_EVENT_PUBLISH_ENABLED=true in Production.',
    }),
    actionCheck({
      id: 'ai-generation',
      phase: 'automation',
      label: 'OpenAI campaign generation',
      ready: input.aiGenerationConfigured,
      summary: input.aiGenerationConfigured
        ? 'Venue-aware campaign generation can use the configured server-side model.'
        : 'The deterministic fallback still works, but production caption quality will not use OpenAI.',
      nextAction: 'Configure OPENAI_API_KEY after the core launch checks are complete.',
      href: '/admin/events',
    }),
    actionCheck({
      id: 'instagram',
      phase: 'automation',
      label: 'Instagram controlled publishing',
      ready: input.metaStatus === 'connected',
      summary:
        input.metaStatus === 'connected'
          ? 'The authorized Meta account, live switch, API version, and publication receipts are ready.'
          : input.metaStatus === 'ready-for-connection'
            ? 'The Meta app is configured and waiting for Club Bahia account authorization.'
            : input.metaStatus === 'needs-attention'
              ? 'The account is partly connected, but at least one publishing safety check is incomplete.'
              : 'The Meta developer application still needs to be configured.',
      nextAction: 'Complete the Instagram checklist and one supervised image publication proof.',
      href: '/admin/settings',
    }),
    actionCheck({
      id: 'scheduler',
      phase: 'automation',
      label: 'Protected recurring scheduler',
      ready: input.schedulerReady,
      summary: input.schedulerReady
        ? 'Approved automatic jobs can run without somebody keeping the dashboard open.'
        : 'Manual queue execution works, but unattended posts still need an authenticated recurring trigger.',
      nextAction: 'Configure CRON_SECRET and an appropriate protected recurring trigger.',
      href: '/admin',
    }),
    {
      id: 'tiktok',
      phase: 'later',
      label: 'TikTok publishing',
      status: input.tiktokStatus === 'connected' ? 'ready' : 'optional',
      summary:
        input.tiktokStatus === 'connected'
          ? 'TikTok public direct-post requirements are configured.'
          : 'TikTok remains a secondary activation track and does not block the Instagram-first launch.',
      nextAction: 'Complete TikTok authorization and provider audit after the Instagram pilot is stable.',
      href: '/admin/settings',
    },
  ];

  const coreChecks = checks.filter((check) => check.phase === 'core');
  const coreReadyCount = coreChecks.filter((check) => check.status === 'ready').length;
  const coreReady = coreReadyCount === coreChecks.length;
  const metaReady = input.metaStatus === 'connected';
  const supervisedInstagramReady = coreReady && metaReady;
  const unattendedInstagramReady = supervisedInstagramReady && input.schedulerReady;
  const nextAction =
    checks.find((check) => check.phase === 'core' && check.status === 'action-required') ??
    checks.find((check) => check.phase === 'automation' && check.status === 'action-required') ??
    null;

  return {
    environment: input.environment,
    coreReady,
    supervisedInstagramReady,
    unattendedInstagramReady,
    coreReadyCount,
    coreTotal: coreChecks.length,
    coreCompletionPercent: Math.round((coreReadyCount / coreChecks.length) * 100),
    nextAction,
    checks,
  };
}
