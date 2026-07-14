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
    label: 'Instagram and Meta',
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
        ? 'The Instagram account details are present, but one or more publication safety checks still need attention.'
        : appConfigured
          ? 'The Meta application is configured. Club Bahia still needs to authorize its Instagram account and linked Facebook Page.'
          : 'Configure a Meta developer application so Instagram can become the first live publishing lane.',
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
        label: 'Linked Facebook Page',
        complete: configured('META_FACEBOOK_PAGE_ID'),
        detail: 'The current Instagram publishing path uses the Page-linked professional account. Facebook posting remains secondary.',
      },
      {
        id: 'meta-instagram',
        label: 'Club Bahia Instagram professional account',
        complete: configured('META_INSTAGRAM_ACCOUNT_ID'),
        detail: 'The authorized Instagram professional account is the primary Meta destination.',
      },
      {
        id: 'meta-token',
        label: 'Server-side Meta access token',
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
        id: 'instagram-reel',
        label: 'Instagram Reel',
        available: false,
        reason: 'The vertical-video processing and asynchronous status pipeline follows the image proof.',
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

function tiktokReadiness(): SocialAccountReadiness {
  const appConfigured =
    configured('TIKTOK_CLIENT_KEY') &&
    configured('TIKTOK_CLIENT_SECRET') &&
    configured('TIKTOK_OAUTH_REDIRECT_URI');
  const accountConfigured =
    configured('TIKTOK_OPEN_ID') &&
    configured('TIKTOK_ACCESS_TOKEN') &&
    configured('TIKTOK_REFRESH_TOKEN');
  const contentPostingEnabled = enabled('TIKTOK_CONTENT_POSTING_ENABLED');
  const audited = enabled('TIKTOK_APP_AUDITED');
  const verifiedMediaHost = configured('TIKTOK_VERIFIED_MEDIA_HOST');
  const receiptStorage = isAdminWorkspaceStorageConfigured();
  const integrationReady =
    appConfigured &&
    accountConfigured &&
    contentPostingEnabled &&
    verifiedMediaHost &&
    receiptStorage;
  const publicPostingReady = integrationReady && audited;

  return {
    provider: 'tiktok',
    label: 'TikTok',
    status: publicPostingReady
      ? 'connected'
      : accountConfigured || integrationReady
        ? 'needs-attention'
        : appConfigured
          ? 'ready-for-connection'
          : 'setup-required',
    summary: publicPostingReady
      ? 'TikTok is configured for public direct-post development with an audited client and verified media host.'
      : integrationReady
        ? 'The technical connection is present, but public visibility still depends on TikTok client audit approval.'
        : appConfigured
          ? 'The TikTok developer application is configured. Club Bahia still needs to authorize its account and complete Content Posting setup.'
          : 'TikTok is the second primary publishing lane. Register the developer app and Content Posting integration before direct posting can begin.',
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
        detail: 'Must exactly match the redirect configured in TikTok for Developers.',
      },
      {
        id: 'tiktok-account',
        label: 'Authorized Club Bahia TikTok account',
        complete: configured('TIKTOK_OPEN_ID'),
        detail: 'The authorized creator open ID identifies the publishing destination.',
      },
      {
        id: 'tiktok-tokens',
        label: 'TikTok access and refresh tokens',
        complete:
          configured('TIKTOK_ACCESS_TOKEN') && configured('TIKTOK_REFRESH_TOKEN'),
        detail: 'Direct posting requires the authorized account token and future refresh support.',
      },
      {
        id: 'tiktok-content-posting',
        label: 'Content Posting API and video.publish scope',
        complete: contentPostingEnabled,
        detail: 'The app and target account must be approved and authorized for direct posting.',
      },
      {
        id: 'tiktok-media-host',
        label: 'Verified TikTok media domain or URL prefix',
        complete: verifiedMediaHost,
        detail: 'TikTok pull-from-URL video and photo posts require media from a verified domain or URL prefix.',
      },
      {
        id: 'tiktok-audit',
        label: 'TikTok client audit for public posts',
        complete: audited,
        detail: 'Unaudited clients are restricted to private viewing mode even when direct posting works technically.',
      },
      {
        id: 'tiktok-receipts',
        label: 'Encrypted publication receipts',
        complete: receiptStorage,
        detail: 'Publication IDs and uncertain results need the same duplicate-prevention boundary used for Instagram.',
      },
    ],
    capabilities: [
      {
        id: 'tiktok-video',
        label: 'TikTok vertical video',
        available: false,
        reason: publicPostingReady
          ? 'Account readiness is complete; the controlled video adapter is the next build checkpoint.'
          : 'Complete TikTok authorization, Content Posting setup, verified media hosting, audit, and receipt storage.',
      },
      {
        id: 'tiktok-status',
        label: 'TikTok post-status polling',
        available: false,
        reason: 'Will be built with the video adapter because TikTok processing completes asynchronously.',
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
        ? 'OAuth is configured. The approved Business Profile account and location still need to be connected.'
        : 'Google remains a valuable local-discovery channel after Instagram and TikTok publishing are operational.',
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
    accounts: [metaReadiness(), tiktokReadiness(), googleReadiness()],
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
