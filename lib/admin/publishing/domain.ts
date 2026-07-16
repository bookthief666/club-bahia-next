import type { EventAsset, EventAssetPlatform } from '@/lib/admin/assets/domain';
import type {
  CampaignBrief,
  CampaignChannel,
  CampaignContentItem,
} from '@/lib/admin/growth/domain';

export interface CampaignPostPackage {
  contentItemId: string;
  channel: CampaignChannel;
  assetIds: string[];
  primaryAssetId?: string;
  updatedAt: string;
}

export interface EventPostAssembly {
  eventId: string;
  packages: CampaignPostPackage[];
  updatedAt: string;
}

export type PostReadinessSeverity = 'complete' | 'warning' | 'blocked';

export interface PostReadinessCheck {
  id: string;
  label: string;
  detail: string;
  severity: PostReadinessSeverity;
  complete: boolean;
}

export interface PostPackageReadiness {
  contentItemId: string;
  channel: CampaignChannel;
  ready: boolean;
  checks: PostReadinessCheck[];
}

export interface EventPostReadiness {
  readyCount: number;
  totalCount: number;
  packages: PostPackageReadiness[];
}

export const CHANNEL_ASSET_REQUIRED: Record<CampaignChannel, boolean> = {
  website: true,
  'instagram-feed': true,
  'instagram-story': true,
  reel: true,
  facebook: true,
  email: false,
  sms: false,
};

export const CHANNEL_DELIVERY_LABELS: Record<CampaignChannel, string> = {
  website: 'Website connector not installed',
  'instagram-feed': 'Manual publishing',
  'instagram-story': 'Manual publishing',
  reel: 'Manual publishing',
  facebook: 'Manual publishing',
  email: 'Manual publishing',
  sms: 'Manual publishing',
};

function channelPlatform(channel: CampaignChannel): EventAssetPlatform {
  return channel;
}

export function isAssetCompatibleWithChannel(
  asset: EventAsset,
  channel: CampaignChannel,
): boolean {
  if (asset.status !== 'approved') return false;
  if (!asset.platforms.includes(channelPlatform(channel))) return false;

  if (channel === 'reel') {
    return asset.kind === 'video' && asset.role === 'reel-video';
  }

  if (channel === 'instagram-story') {
    return asset.kind === 'image' || asset.kind === 'video';
  }

  if (channel === 'website' || channel === 'instagram-feed' || channel === 'facebook') {
    return asset.kind === 'image' || asset.kind === 'video';
  }

  if (channel === 'email') {
    return asset.kind === 'image';
  }

  return false;
}

function assetPriority(asset: EventAsset, channel: CampaignChannel): number {
  let score = 0;
  if (asset.platforms.includes(channelPlatform(channel))) score += 20;
  if (asset.status === 'approved') score += 20;

  const preferredRoles: Partial<Record<CampaignChannel, EventAsset['role'][]>> = {
    website: ['primary-flyer', 'venue-photo', 'performer-photo'],
    'instagram-feed': ['feed-creative', 'primary-flyer', 'performer-photo'],
    'instagram-story': ['story-creative', 'reel-video'],
    reel: ['reel-video'],
    facebook: ['feed-creative', 'primary-flyer', 'venue-photo'],
    email: ['primary-flyer', 'feed-creative', 'venue-photo'],
  };

  const roleIndex = preferredRoles[channel]?.indexOf(asset.role) ?? -1;
  if (roleIndex >= 0) score += 12 - roleIndex * 3;
  if (asset.altText.trim()) score += 2;
  return score;
}

export function selectBestAssetForChannel(
  assets: EventAsset[],
  channel: CampaignChannel,
): EventAsset | undefined {
  return assets
    .filter((asset) => isAssetCompatibleWithChannel(asset, channel))
    .sort((left, right) => assetPriority(right, channel) - assetPriority(left, channel))[0];
}

function check(
  id: string,
  label: string,
  detail: string,
  complete: boolean,
  severity: PostReadinessSeverity,
): PostReadinessCheck {
  return { id, label, detail, complete, severity };
}

export function buildPostPackageReadiness(
  item: CampaignContentItem,
  brief: CampaignBrief,
  postPackage: CampaignPostPackage | undefined,
  assets: EventAsset[],
): PostPackageReadiness {
  const selectedAssets = assets.filter((asset) =>
    postPackage?.assetIds.includes(asset.id),
  );
  const compatibleAssets = selectedAssets.filter((asset) =>
    isAssetCompatibleWithChannel(asset, item.channel),
  );
  const requiresAsset = CHANNEL_ASSET_REQUIRED[item.channel];
  const conversionRequired = ['reservations', 'ticket-sales'].includes(brief.objective);
  const copyApproved = ['approved', 'scheduled', 'published'].includes(item.status);

  const checks: PostReadinessCheck[] = [
    check(
      'copy',
      'Copy approved',
      copyApproved
        ? 'Human-reviewed copy is approved.'
        : 'Approve the campaign copy before preparing it for delivery.',
      copyApproved,
      copyApproved ? 'complete' : 'blocked',
    ),
    check(
      'asset',
      requiresAsset ? 'Approved media assigned' : 'Media optional',
      requiresAsset
        ? compatibleAssets.length
          ? 'At least one approved, platform-compatible asset is attached.'
          : 'Attach an approved asset that is assigned to this destination.'
        : compatibleAssets.length
          ? 'An optional compatible asset is attached.'
          : 'This channel can be delivered without media.',
      !requiresAsset || compatibleAssets.length > 0,
      !requiresAsset || compatibleAssets.length > 0 ? 'complete' : 'blocked',
    ),
    check(
      'link',
      conversionRequired ? 'Conversion link present' : 'Link optional',
      conversionRequired
        ? brief.reservationUrl.trim()
          ? 'The reservation or ticket destination is available.'
          : 'Add the final public reservation or ticket URL.'
        : 'This campaign objective does not require a conversion link.',
      !conversionRequired || Boolean(brief.reservationUrl.trim()),
      !conversionRequired || brief.reservationUrl.trim() ? 'complete' : 'blocked',
    ),
    check(
      'schedule',
      'Delivery time planned',
      item.publishAt
        ? 'A suggested delivery time is recorded.'
        : 'Choose a delivery date and time before publishing.',
      Boolean(item.publishAt),
      item.publishAt ? 'complete' : 'warning',
    ),
  ];

  return {
    contentItemId: item.id,
    channel: item.channel,
    ready: checks.every((entry) => entry.complete),
    checks,
  };
}

export function buildEventPostReadiness(
  content: CampaignContentItem[],
  brief: CampaignBrief,
  assembly: EventPostAssembly,
  assets: EventAsset[],
): EventPostReadiness {
  const packages = content.map((item) =>
    buildPostPackageReadiness(
      item,
      brief,
      assembly.packages.find((entry) => entry.contentItemId === item.id),
      assets,
    ),
  );

  return {
    readyCount: packages.filter((item) => item.ready).length,
    totalCount: packages.length,
    packages,
  };
}

export function emptyEventPostAssembly(eventId: string): EventPostAssembly {
  return {
    eventId,
    packages: [],
    updatedAt: new Date().toISOString(),
  };
}
