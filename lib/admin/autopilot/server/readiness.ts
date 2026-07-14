import 'server-only';

import type {
  PromotionAutopilotReadiness,
  SocialAccountReadiness,
} from '@/lib/admin/autopilot/domain';
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

function metaReadiness(): SocialAccountReadiness {
  const appConfigured =
    configured('META_APP_ID') &&
    configured('META_APP_SECRET') &&
    configured('META_OAUTH_REDIRECT_URI');
  const accountConfigured =
    configured('META_FACEBOOK_PAGE_ID') &&
    configured('META_INSTAGRAM_ACCOUNT_ID') &&
    configured('META_PAGE_ACCESS_TOKEN');
  const liveEnabled = enabled('META_PUBLISH_ENABLED');
  const receiptStorage = isAdminWorkspaceStorageConfigured();
  const imageProofReady =
    accountConfigured && validGraphVersion() && liveEnabled && receiptStorage;

  return {
    provider: 'meta',
    label: 'Facebook and Instagram',
    status: accountConfigured
      ? imageProofReady
        ? 'connected'
        : 'needs-attention'
      : appConfigured
        ? 'ready-for-connection'
        : 'setup-required',
    summary: imageProofReady
      ? 'The controlled Instagram image publisher is configured with encrypted publication receipts and duplicate-post protection.'
      : accountConfigured
        ? 'The Meta account details are present, but one or more publication safety checks still need attention.'
        : appConfigured
          ? 'The Meta application is configured. Club Bahia still needs to authorize the Facebook Page and Instagram account.'
          : 'Create and configure a Meta developer application before automatic publishing can begin.',
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
        detail: 'The version is explicit so a platform upgrade cannot silently change publishing behavior.',
      },
      {
        id: 'meta-page',
        label: 'Club Bahia Facebook Page',
        complete: configured('META_FACEBOOK_PAGE_ID'),
        detail: 'The authorized Page ID is required for Facebook publishing and Page-linked Instagram discovery.',
      },
      {
        id: 'meta-instagram',
        label: 'Instagram professional account',
        complete: configured('META_INSTAGRAM_ACCOUNT_ID'),
        detail: 'The Instagram professional account must be authorized for content publishing.',
      },
      {
        id: 'meta-token',
        label: 'Server-side Page access token',
        complete: configured('META_PAGE_ACCESS_TOKEN'),
        detail: 'Environment storage supports the controlled proof; encrypted OAuth credential rotation remains a later connection milestone.',
      },
      {
        id: 'meta-receipts',
        label: 'Encrypted publication receipts',
        complete: receiptStorage,
        detail: 'A durable receipt claim blocks duplicate submissions and records the provider post ID.',
      },
      {
        id: 'meta-live-switch',
        label: 'Controlled live-publishing switch',
        complete: liveEnabled,
        detail: 'META_PUBLISH_ENABLED must be explicitly true before the live button can call Meta.',
      },
    ],
    capabilities: [
      {
        id: 'instagram-image',
        label: 'Instagram image post',
        available: imageProofReady,
        reason: imageProofReady
          ? undefined
          : 'Complete the Meta credentials, Graph version, encrypted receipt storage, and live-publishing switch.',
      },
      {
        id: 'facebook-page-post',
        label: 'Facebook Page post',
        available: false,
        reason: 'The Facebook Page publishing adapter follows the controlled Instagram proof.',
      },
      {
        id: 'instagram-carousel',
        label: 'Instagram carousel',
        available: false,
        reason: 'Planned after the single-image publishing proof of concept.',
      },
      {
        id: 'instagram-reel',
        label: 'Instagram Reel',
        available: false,
        reason: 'Requires the media-processing and asynchronous status pipeline.',
      },
      {
        id: 'instagram-story',
        label: 'Instagram Story',
        available: false,
        reason: 'Planned after feed, carousel, and Reel publishing are stable.',
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
        ? 'OAuth is configured. The approved Business Profile account and location still need to be connected.'
        : 'Google Business Profile API access and OAuth credentials are still required.',
    checks: [
      {
        id: 'google-oauth',
        label: 'Google OAuth credentials',
        complete:
          configured('GOOGLE_BUSINESS_CLIENT_ID') &&
          configured('GOOGLE_BUSINESS_CLIENT_SECRET'),
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
        complete:
          configured('GOOGLE_BUSINESS_ACCOUNT_ID') &&
          configured('GOOGLE_BUSINESS_LOCATION_ID'),
        detail: 'The account and location IDs identify the verified venue profile.',
      },
      {
        id: 'google-refresh',
        label: 'Server-side refresh token',
        complete: configured('GOOGLE_BUSINESS_REFRESH_TOKEN'),
        detail: 'Required to renew access without interrupting scheduled posts.',
      },
    ],
    capabilities: [
      {
        id: 'google-event-post',
        label: 'Google event post',
        available: locationConfigured,
        reason: locationConfigured
          ? undefined
          : 'Complete Google API approval and connect the Business Profile location.',
      },
      {
        id: 'google-cta',
        label: 'Reservation call-to-action',
        available: locationConfigured,
        reason: locationConfigured
          ? undefined
          : 'Connect the Business Profile before event CTAs can publish.',
      },
    ],
  };
}

export function getPromotionAutopilotReadiness(): PromotionAutopilotReadiness {
  const databaseConfigured =
    configured('PUBLISHING_DATABASE_URL') || configured('DATABASE_URL');
  const cronSecretConfigured = configured('PUBLISHING_CRON_SECRET');

  return {
    accounts: [metaReadiness(), googleReadiness()],
    scheduler: {
      databaseConfigured,
      cronSecretConfigured,
      ready: databaseConfigured && cronSecretConfigured,
      summary:
        databaseConfigured && cronSecretConfigured
          ? 'The durable publishing scheduler has its database and authenticated cron configuration.'
          : 'Automatic scheduling remains disabled until a transactional database and cron secret are configured.',
    },
  };
}
