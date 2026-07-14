import 'server-only';

import type {
  PromotionAutopilotReadiness,
  SocialAccountReadiness,
} from '@/lib/admin/autopilot/domain';

function configured(name: string): boolean {
  return Boolean(process.env[name]?.trim());
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

  return {
    provider: 'meta',
    label: 'Facebook and Instagram',
    status: accountConfigured
      ? 'connected'
      : appConfigured
        ? 'ready-for-connection'
        : 'setup-required',
    summary: accountConfigured
      ? 'A server-side Meta account configuration is present for the first publishing proof of concept.'
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
        id: 'meta-page',
        label: 'Club Bahia Facebook Page',
        complete: configured('META_FACEBOOK_PAGE_ID'),
        detail: 'The authorized Page ID is required for Facebook publishing.',
      },
      {
        id: 'meta-instagram',
        label: 'Instagram professional account',
        complete: configured('META_INSTAGRAM_ACCOUNT_ID'),
        detail: 'The Instagram professional account must be authorized for publishing.',
      },
      {
        id: 'meta-token',
        label: 'Server-side Page access token',
        complete: configured('META_PAGE_ACCESS_TOKEN'),
        detail: 'Temporary environment storage supports the proof of concept; durable encrypted credential storage comes next.',
      },
    ],
    capabilities: [
      {
        id: 'instagram-image',
        label: 'Instagram image post',
        available: accountConfigured,
        reason: accountConfigured
          ? undefined
          : 'Connect the Facebook Page and Instagram professional account.',
      },
      {
        id: 'facebook-page-post',
        label: 'Facebook Page post',
        available: accountConfigured,
        reason: accountConfigured
          ? undefined
          : 'Connect the Facebook Page and grant publishing permissions.',
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
