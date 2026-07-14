import 'server-only';

import type {
  PromotionAutopilotReadiness,
  SocialAccountReadiness,
} from '@/lib/admin/autopilot/domain';
import {
  getOAuthCredential,
  type OAuthCredentialRecord,
  type OAuthProvider,
} from '@/lib/admin/autopilot/server/credential-store';
import { isAdminWorkspaceStorageConfigured } from '@/lib/admin/workspaces/server';

function configured(name: string): boolean {
  return Boolean(process.env[name]?.trim());
}

function enabled(name: string): boolean {
  return process.env[name] === 'true';
}

function validGraphVersion(): boolean {
  return /^v\d+\.\d+$/.test(process.env.META_GRAPH_API_VERSION?.trim() ?? '');
}

async function storedCredential(provider: OAuthProvider): Promise<OAuthCredentialRecord | null> {
  try {
    const stored = await getOAuthCredential(provider);
    return stored?.record.status === 'disconnected' ? null : stored?.record ?? null;
  } catch {
    return null;
  }
}

function metaReadiness(stored: OAuthCredentialRecord | null): SocialAccountReadiness {
  const appConfigured =
    configured('META_APP_ID') &&
    configured('META_APP_SECRET') &&
    configured('META_OAUTH_REDIRECT_URI');
  const oauthAccount = Boolean(
    stored?.provider === 'meta' &&
      stored.secretMaterial.length >= 20 &&
      (stored.relatedInstagramId || stored.accountId),
  );
  const environmentAccount =
    configured('META_FACEBOOK_PAGE_ID') &&
    configured('META_INSTAGRAM_ACCOUNT_ID') &&
    configured('META_PAGE_ACCESS_TOKEN');
  const accountConfigured = oauthAccount || environmentAccount;
  const liveEnabled = enabled('META_PUBLISH_ENABLED');
  const receiptStorage = isAdminWorkspaceStorageConfigured();
  const imageProofReady =
    accountConfigured && validGraphVersion() && liveEnabled && receiptStorage;

  return {
    provider: 'meta',
    label: 'Instagram and Meta',
    status: accountConfigured
      ? imageProofReady
        ? 'connected'
        : 'needs-attention'
      : appConfigured
        ? 'ready-for-connection'
        : 'setup-required',
    summary: imageProofReady
      ? `Controlled Instagram publishing is ready for ${stored?.accountLabel || 'the configured Club Bahia account'}.`
      : accountConfigured
        ? 'The Instagram account is connected, but one or more publishing safety checks still need attention.'
        : appConfigured
          ? 'The Meta application is configured. Authorize the Club Bahia Instagram account above.'
          : 'Configure the Meta developer application before connecting Instagram.',
    checks: [
      {
        id: 'meta-app',
        label: 'Meta application credentials',
        complete: configured('META_APP_ID') && configured('META_APP_SECRET'),
        detail: 'App ID and App Secret remain server-only.',
      },
      {
        id: 'meta-redirect',
        label: 'Approved OAuth redirect URL',
        complete: configured('META_OAUTH_REDIRECT_URI'),
        detail: 'Must exactly match the callback URL configured in Meta.',
      },
      {
        id: 'meta-version',
        label: 'Pinned Graph API version',
        complete: validGraphVersion(),
        detail: 'An explicit version prevents silent provider behavior changes.',
      },
      {
        id: 'meta-page',
        label: 'Linked Facebook Page',
        complete: Boolean(stored?.relatedPageId) || configured('META_FACEBOOK_PAGE_ID'),
        detail: 'The current Instagram path uses a Page-linked professional account.',
      },
      {
        id: 'meta-instagram',
        label: 'Club Bahia Instagram professional account',
        complete: Boolean(stored?.relatedInstagramId || stored?.accountId) || configured('META_INSTAGRAM_ACCOUNT_ID'),
        detail: stored?.accountLabel || 'The authorized professional account is the primary Meta destination.',
      },
      {
        id: 'meta-authorization',
        label: 'Encrypted server-side authorization',
        complete: oauthAccount || configured('META_PAGE_ACCESS_TOKEN'),
        detail: oauthAccount
          ? 'Authorization is stored in the encrypted internal credential workspace.'
          : 'Environment authorization remains supported during migration.',
      },
      {
        id: 'meta-receipts',
        label: 'Encrypted publication receipts',
        complete: receiptStorage,
        detail: 'Durable claims block duplicate submissions and store provider IDs.',
      },
      {
        id: 'meta-live-switch',
        label: 'Controlled live-publishing switch',
        complete: liveEnabled,
        detail: 'The explicit live switch must be enabled before Meta can be called.',
      },
    ],
    capabilities: [
      {
        id: 'instagram-image',
        label: 'Instagram image post',
        available: imageProofReady,
        reason: imageProofReady
          ? undefined
          : 'Complete account authorization, Graph version, receipt storage, and the live switch.',
      },
      {
        id: 'instagram-reel',
        label: 'Instagram Reel',
        available: false,
        reason: 'The asynchronous vertical-video pipeline follows the image proof.',
      },
      {
        id: 'instagram-carousel',
        label: 'Instagram carousel',
        available: false,
        reason: 'Planned after single-image publishing is verified.',
      },
      {
        id: 'instagram-story',
        label: 'Instagram Story',
        available: false,
        reason: 'Planned after feed and vertical-video publishing are stable.',
      },
      {
        id: 'facebook-page-post',
        label: 'Facebook Page cross-post',
        available: false,
        reason: 'Secondary reuse channel after Instagram and TikTok are operational.',
      },
    ],
  };
}

function tiktokReadiness(stored: OAuthCredentialRecord | null): SocialAccountReadiness {
  const appConfigured =
    configured('TIKTOK_CLIENT_KEY') &&
    configured('TIKTOK_CLIENT_SECRET') &&
    configured('TIKTOK_OAUTH_REDIRECT_URI');
  const oauthAccount = Boolean(
    stored?.provider === 'tiktok' && stored.secretMaterial.length >= 20 && stored.accountId,
  );
  const environmentAccount =
    configured('TIKTOK_OPEN_ID') &&
    configured('TIKTOK_ACCESS_TOKEN') &&
    configured('TIKTOK_REFRESH_TOKEN');
  const accountConfigured = oauthAccount || environmentAccount;
  const contentPostingEnabled = enabled('TIKTOK_CONTENT_POSTING_ENABLED');
  const audited = enabled('TIKTOK_APP_AUDITED');
  const verifiedMediaHost = configured('TIKTOK_VERIFIED_MEDIA_HOST');
  const receiptStorage = isAdminWorkspaceStorageConfigured();
  const privateProofReady =
    appConfigured &&
    accountConfigured &&
    contentPostingEnabled &&
    verifiedMediaHost &&
    receiptStorage;
  const publicPostingReady = privateProofReady && audited;

  return {
    provider: 'tiktok',
    label: 'TikTok',
    status: privateProofReady
      ? publicPostingReady
        ? 'connected'
        : 'needs-attention'
      : accountConfigured
        ? 'needs-attention'
        : appConfigured
          ? 'ready-for-connection'
          : 'setup-required',
    summary: publicPostingReady
      ? `TikTok is connected for public direct-post development as ${stored?.accountLabel || 'the authorized Club Bahia account'}.`
      : privateProofReady
        ? 'The private SELF_ONLY proof is ready. Public visibility still requires TikTok client audit approval.'
        : accountConfigured
          ? 'TikTok is connected, but Content Posting, verified media hosting, or receipt storage is incomplete.'
          : appConfigured
            ? 'The TikTok developer application is configured. Authorize the Club Bahia account above.'
            : 'Register the TikTok developer application before direct posting can begin.',
    checks: [
      {
        id: 'tiktok-app',
        label: 'TikTok developer application',
        complete: configured('TIKTOK_CLIENT_KEY') && configured('TIKTOK_CLIENT_SECRET'),
        detail: 'Client key and secret remain server-only.',
      },
      {
        id: 'tiktok-redirect',
        label: 'Approved TikTok OAuth redirect URL',
        complete: configured('TIKTOK_OAUTH_REDIRECT_URI'),
        detail: 'Must exactly match the redirect registered with TikTok.',
      },
      {
        id: 'tiktok-account',
        label: 'Authorized Club Bahia TikTok account',
        complete: Boolean(stored?.accountId) || configured('TIKTOK_OPEN_ID'),
        detail: stored?.accountLabel || 'The creator account identifies the publishing destination.',
      },
      {
        id: 'tiktok-authorization',
        label: 'Encrypted renewable authorization',
        complete:
          Boolean(stored?.secretMaterial && stored?.renewableMaterial) ||
          (configured('TIKTOK_ACCESS_TOKEN') && configured('TIKTOK_REFRESH_TOKEN')),
        detail: stored?.renewableMaterial
          ? 'Access can be renewed from Publishing Connections without copying credentials.'
          : 'Reconnect or provide the temporary migration authorization.',
      },
      {
        id: 'tiktok-content-posting',
        label: 'Content Posting API and video.publish scope',
        complete: contentPostingEnabled,
        detail: 'The app and target account must be approved and authorized for Direct Post.',
      },
      {
        id: 'tiktok-media-host',
        label: 'Verified TikTok media hostname',
        complete: verifiedMediaHost,
        detail: 'Pull-from-URL media must come from the exact verified hostname.',
      },
      {
        id: 'tiktok-audit',
        label: 'TikTok client audit for public posts',
        complete: audited,
        detail: 'The private proof does not require public visibility; public automation does.',
      },
      {
        id: 'tiktok-receipts',
        label: 'Encrypted publication receipts',
        complete: receiptStorage,
        detail: 'Publish IDs and uncertain responses use the same duplicate-prevention boundary as Instagram.',
      },
    ],
    capabilities: [
      {
        id: 'tiktok-video',
        label: 'TikTok private video proof',
        available: privateProofReady,
        reason: privateProofReady
          ? undefined
          : 'Complete authorization, Content Posting setup, verified media hosting, and receipt storage.',
      },
      {
        id: 'tiktok-status',
        label: 'TikTok post-status polling',
        available: privateProofReady,
        reason: privateProofReady ? undefined : 'Available with the controlled private-video adapter.',
      },
      {
        id: 'tiktok-photo',
        label: 'TikTok photo post',
        available: false,
        reason: 'Planned after controlled vertical-video publishing is verified.',
      },
    ],
  };
}

function googleReadiness(): SocialAccountReadiness {
  const oauthConfigured =
    configured('GOOGLE_BUSINESS_CLIENT_ID') &&
    configured('GOOGLE_BUSINESS_CLIENT_SECRET') &&
    configured('GOOGLE_BUSINESS_REDIRECT_URI');
  const locationConfigured =
    configured('GOOGLE_BUSINESS_ACCOUNT_ID') &&
    configured('GOOGLE_BUSINESS_LOCATION_ID') &&
    configured('GOOGLE_BUSINESS_REFRESH_TOKEN');

  return {
    provider: 'google-business',
    label: 'Google Business Profile',
    status: locationConfigured
      ? 'connected'
      : oauthConfigured
        ? 'ready-for-connection'
        : 'setup-required',
    summary: locationConfigured
      ? 'The Business Profile location is configured for event-post development.'
      : oauthConfigured
        ? 'OAuth is configured. The approved Business Profile location still needs to be connected.'
        : 'Google remains a later local-discovery channel after Instagram and TikTok.',
    checks: [
      {
        id: 'google-oauth',
        label: 'Google OAuth credentials',
        complete: configured('GOOGLE_BUSINESS_CLIENT_ID') && configured('GOOGLE_BUSINESS_CLIENT_SECRET'),
        detail: 'Client credentials remain server-only.',
      },
      {
        id: 'google-redirect',
        label: 'Approved OAuth redirect URL',
        complete: configured('GOOGLE_BUSINESS_REDIRECT_URI'),
        detail: 'Must match the Google Cloud OAuth configuration.',
      },
      {
        id: 'google-location',
        label: 'Club Bahia Business Profile location',
        complete: configured('GOOGLE_BUSINESS_ACCOUNT_ID') && configured('GOOGLE_BUSINESS_LOCATION_ID'),
        detail: 'The account and location IDs identify the verified venue profile.',
      },
      {
        id: 'google-refresh',
        label: 'Server-side refresh authorization',
        complete: configured('GOOGLE_BUSINESS_REFRESH_TOKEN'),
        detail: 'Required to renew access without interrupting scheduled posts.',
      },
    ],
    capabilities: [
      {
        id: 'google-event-post',
        label: 'Google event post',
        available: locationConfigured,
        reason: locationConfigured ? undefined : 'Complete Google API approval and connect the location.',
      },
      {
        id: 'google-cta',
        label: 'Reservation call-to-action',
        available: locationConfigured,
        reason: locationConfigured ? undefined : 'Connect the Business Profile before event CTAs can publish.',
      },
    ],
  };
}

export async function getPromotionAutopilotReadiness(): Promise<PromotionAutopilotReadiness> {
  const [metaCredential, tiktokCredential] = await Promise.all([
    storedCredential('meta'),
    storedCredential('tiktok'),
  ]);
  const databaseConfigured =
    configured('PUBLISHING_DATABASE_URL') || configured('DATABASE_URL');
  const cronSecretConfigured = configured('PUBLISHING_CRON_SECRET');

  return {
    accounts: [
      metaReadiness(metaCredential),
      tiktokReadiness(tiktokCredential),
      googleReadiness(),
    ],
    scheduler: {
      databaseConfigured,
      cronSecretConfigured,
      ready: databaseConfigured && cronSecretConfigured,
      summary:
        databaseConfigured && cronSecretConfigured
          ? 'The durable publishing scheduler has its database and authenticated trigger.'
          : 'Automatic scheduling remains disabled until a transactional database and authenticated trigger are configured.',
    },
  };
}
