import 'server-only';

interface MetaTokenPayload {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  error?: { message?: string; code?: number; error_subcode?: number };
}

interface MetaPageAccount {
  id?: string;
  name?: string;
  access_token?: string;
  tasks?: string[];
  instagram_business_account?: {
    id?: string;
    username?: string;
    name?: string;
  };
}

interface MetaAccountsPayload {
  data?: MetaPageAccount[];
  error?: { message?: string; code?: number; error_subcode?: number };
}

export interface MetaOAuthResult {
  secretMaterial: string;
  accountId: string;
  accountLabel: string;
  accountUsername?: string;
  relatedPageId: string;
  relatedInstagramId: string;
  scopes: string[];
  expiresAt?: string;
}

function configuration() {
  const appId = process.env.META_APP_ID?.trim() ?? '';
  const appSecret = process.env.META_APP_SECRET?.trim() ?? '';
  const redirectUri = process.env.META_OAUTH_REDIRECT_URI?.trim() ?? '';
  const graphVersion = process.env.META_GRAPH_API_VERSION?.trim() ?? '';
  if (!appId || !appSecret || !redirectUri || !/^v\d+\.\d+$/.test(graphVersion)) {
    throw new Error('Meta OAuth application settings are incomplete.');
  }
  const parsed = new URL(redirectUri);
  if (parsed.protocol !== 'https:' && process.env.NODE_ENV === 'production') {
    throw new Error('Meta OAuth redirect URI must use HTTPS in production.');
  }
  return { appId, appSecret, redirectUri, graphVersion };
}

function graphUrl(version: string, path: string): URL {
  const base = process.env.META_GRAPH_BASE_URL?.trim() || 'https://graph.facebook.com';
  return new URL(`${base.replace(/\/$/, '')}/${version}/${path.replace(/^\//, '')}`);
}

async function readJson<T>(response: Response, label: string): Promise<T> {
  const payload = (await response.json()) as T & {
    error?: { message?: string };
  };
  if (!response.ok || payload.error) {
    throw new Error(payload.error?.message || `${label} failed with status ${response.status}.`);
  }
  return payload;
}

function futureIso(seconds: number | undefined, now: Date): string | undefined {
  if (!Number.isFinite(seconds) || Number(seconds) <= 0) return undefined;
  return new Date(now.getTime() + Number(seconds) * 1000).toISOString();
}

export function isMetaOAuthConfigured(): boolean {
  try {
    configuration();
    return true;
  } catch {
    return false;
  }
}

export function buildMetaAuthorizationUrl(state: string): string {
  const config = configuration();
  const url = new URL(`https://www.facebook.com/${config.graphVersion}/dialog/oauth`);
  url.searchParams.set('client_id', config.appId);
  url.searchParams.set('redirect_uri', config.redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('state', state);
  url.searchParams.set(
    'scope',
    [
      'pages_show_list',
      'pages_read_engagement',
      'pages_manage_posts',
      'instagram_basic',
      'instagram_content_publish',
    ].join(','),
  );
  return url.toString();
}

async function exchangeCode(code: string): Promise<MetaTokenPayload> {
  const config = configuration();
  const url = graphUrl(config.graphVersion, 'oauth/access_token');
  url.searchParams.set('client_id', config.appId);
  url.searchParams.set('client_secret', config.appSecret);
  url.searchParams.set('redirect_uri', config.redirectUri);
  url.searchParams.set('code', code.trim());
  const response = await fetch(url, { cache: 'no-store' });
  return readJson<MetaTokenPayload>(response, 'Meta authorization exchange');
}

async function exchangeLongLived(shortValue: string): Promise<MetaTokenPayload> {
  const config = configuration();
  const url = graphUrl(config.graphVersion, 'oauth/access_token');
  url.searchParams.set('grant_type', 'fb_exchange_token');
  url.searchParams.set('client_id', config.appId);
  url.searchParams.set('client_secret', config.appSecret);
  url.searchParams.set('fb_exchange_token', shortValue);
  const response = await fetch(url, { cache: 'no-store' });
  return readJson<MetaTokenPayload>(response, 'Meta long-lived authorization exchange');
}

async function discoverAccounts(userValue: string): Promise<MetaPageAccount[]> {
  const config = configuration();
  const url = graphUrl(config.graphVersion, 'me/accounts');
  url.searchParams.set(
    'fields',
    'id,name,access_token,tasks,instagram_business_account{id,username,name}',
  );
  url.searchParams.set('limit', '100');
  url.searchParams.set('access_token', userValue);
  const response = await fetch(url, { cache: 'no-store' });
  const payload = await readJson<MetaAccountsPayload>(response, 'Meta account discovery');
  return payload.data ?? [];
}

function selectClubBahiaAccount(accounts: MetaPageAccount[]): MetaPageAccount {
  const preferredPageId = process.env.META_FACEBOOK_PAGE_ID?.trim();
  const eligible = accounts.filter(
    (account) =>
      account.id &&
      account.access_token &&
      account.instagram_business_account?.id,
  );
  if (preferredPageId) {
    const preferred = eligible.find((account) => account.id === preferredPageId);
    if (preferred) return preferred;
    throw new Error('The authorized Meta user cannot access the configured Club Bahia Facebook Page and linked Instagram account.');
  }
  if (eligible.length === 1) return eligible[0];
  if (!eligible.length) {
    throw new Error('No authorized Facebook Page with a linked Instagram professional account was found.');
  }
  throw new Error('More than one eligible Meta Page was found. Configure the Club Bahia Page ID before reconnecting.');
}

export async function exchangeMetaAuthorizationCode(
  code: string,
  now = new Date(),
): Promise<MetaOAuthResult> {
  const short = await exchangeCode(code);
  if (!short.access_token) {
    throw new Error('Meta did not return authorization material.');
  }
  const long = await exchangeLongLived(short.access_token);
  const userValue = long.access_token || short.access_token;
  const account = selectClubBahiaAccount(await discoverAccounts(userValue));
  const instagram = account.instagram_business_account;
  if (!account.id || !account.access_token || !instagram?.id) {
    throw new Error('Meta account discovery returned an incomplete Page or Instagram account.');
  }
  return {
    secretMaterial: account.access_token,
    accountId: instagram.id,
    accountLabel: instagram.name || instagram.username || account.name || 'Club Bahia Instagram',
    accountUsername: instagram.username,
    relatedPageId: account.id,
    relatedInstagramId: instagram.id,
    scopes: [
      'pages_show_list',
      'pages_read_engagement',
      'pages_manage_posts',
      'instagram_basic',
      'instagram_content_publish',
    ],
    expiresAt: futureIso(long.expires_in || short.expires_in, now),
  };
}
