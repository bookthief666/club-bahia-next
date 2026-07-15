import type { OperationsEvent } from '@/lib/admin/domain';
import type { EventAssetPlatform, EventAssetRole } from './domain';
import { approvedDerivativeForPlatform } from './derivatives';
import type {
  MediaLibraryAsset,
  MediaLibraryCollectionId,
  MediaOrientation,
} from './library-domain';

export interface MediaRecommendation {
  asset: MediaLibraryAsset;
  score: number;
  reasons: string[];
  warnings: string[];
}

export interface MediaRecommendationLane {
  id: 'instagram-feed' | 'instagram-story' | 'vertical-video' | 'website';
  label: string;
  platform: EventAssetPlatform;
  preferredRoles: EventAssetRole[];
  recommendations: MediaRecommendation[];
}

const LANE_RULES: Array<{
  id: MediaRecommendationLane['id'];
  label: string;
  platform: EventAssetPlatform;
  preferredRoles: EventAssetRole[];
  preferredOrientations: MediaOrientation[];
  requiredKind?: MediaLibraryAsset['kind'];
}> = [
  {
    id: 'instagram-feed',
    label: 'Instagram feed',
    platform: 'instagram-feed',
    preferredRoles: ['feed-creative', 'primary-flyer', 'venue-photo', 'performer-photo'],
    preferredOrientations: ['portrait', 'square'],
    requiredKind: 'image',
  },
  {
    id: 'instagram-story',
    label: 'Instagram Story',
    platform: 'instagram-story',
    preferredRoles: ['story-creative', 'feed-creative', 'venue-photo', 'performer-photo'],
    preferredOrientations: ['portrait', 'vertical-video'],
  },
  {
    id: 'vertical-video',
    label: 'Instagram Reel + TikTok',
    platform: 'reel',
    preferredRoles: ['reel-video', 'raw-video'],
    preferredOrientations: ['vertical-video', 'portrait'],
    requiredKind: 'video',
  },
  {
    id: 'website',
    label: 'Website event image',
    platform: 'website',
    preferredRoles: ['primary-flyer', 'venue-photo', 'performer-photo', 'feed-creative'],
    preferredOrientations: ['landscape', 'portrait', 'square'],
    requiredKind: 'image',
  },
];

function eventCollections(event: OperationsEvent): MediaLibraryCollectionId[] {
  const templateId = event.promotionTemplate?.id;
  const values: MediaLibraryCollectionId[] = ['club-bahia-evergreen'];
  if (templateId === 'azucar-friday') values.unshift('azucar-friday');
  if (templateId === 'azucar-saturday') values.unshift('azucar-saturday');
  if (templateId === 'bahia-nocturna') values.unshift('bahia-nocturna');
  return values;
}

function words(value: string | undefined): string[] {
  return (value ?? '')
    .toLowerCase()
    .split(/[^a-z0-9áéíóúñü]+/i)
    .map((item) => item.trim())
    .filter((item) => item.length >= 3);
}

function daysSince(value: string | undefined, now: Date): number | undefined {
  if (!value) return undefined;
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return undefined;
  return Math.max(0, (now.getTime() - time) / 86_400_000);
}

function scoreAsset(input: {
  asset: MediaLibraryAsset;
  event: OperationsEvent;
  platform: EventAssetPlatform;
  preferredRoles: EventAssetRole[];
  preferredOrientations: MediaOrientation[];
  requiredKind?: MediaLibraryAsset['kind'];
  now: Date;
}): MediaRecommendation | null {
  const {
    asset,
    event,
    platform,
    preferredRoles,
    preferredOrientations,
    requiredKind,
    now,
  } = input;
  if (asset.status !== 'active') return null;
  if (requiredKind && asset.kind !== requiredKind) return null;

  let score = asset.qualityRating * 8;
  const reasons: string[] = [`Quality rated ${asset.qualityRating}/5`];
  const warnings: string[] = [];

  const approvedDerivative = approvedDerivativeForPlatform({
    derivatives: asset.derivatives,
    platform,
  });
  if (approvedDerivative) {
    score += 26;
    reasons.unshift('Approved platform-ready crop is available');
  } else if (
    platform === 'instagram-feed' ||
    platform === 'instagram-story' ||
    platform === 'website'
  ) {
    warnings.push('No approved platform crop yet; the original will be used');
  }

  if (platform === 'reel') {
    const covers = (asset.derivatives ?? []).filter(
      (derivative) =>
        derivative.status === 'approved' &&
        (derivative.presetId === 'instagram-reel-cover' ||
          derivative.presetId === 'tiktok-cover'),
    );
    if (covers.length === 2) {
      score += 10;
      reasons.push('Instagram and TikTok covers are approved');
    } else if (covers.length === 1) {
      score += 5;
      reasons.push('One vertical-video cover is approved');
    } else {
      warnings.push('Reel and TikTok covers still need preparation');
    }
  }

  if (asset.platforms.includes(platform)) {
    score += 22;
    reasons.push(`Approved for ${platform.replaceAll('-', ' ')}`);
  } else if (platform === 'reel' && asset.platforms.includes('tiktok')) {
    score += 18;
    reasons.push('Approved for TikTok vertical video');
  }

  const roleIndex = preferredRoles.indexOf(asset.role);
  if (roleIndex >= 0) {
    score += 18 - roleIndex * 3;
    reasons.push(`Strong ${asset.role.replaceAll('-', ' ')} role match`);
  }

  if (preferredOrientations.includes(asset.orientation)) {
    score += 14;
    reasons.push(
      `${asset.orientation.replaceAll('-', ' ')} format fits this placement`,
    );
  } else if (asset.orientation === 'unknown') {
    warnings.push('Orientation has not been confirmed');
  }

  const desiredCollections = eventCollections(event);
  const collectionMatch = desiredCollections.find((collection) =>
    asset.collections.includes(collection),
  );
  if (collectionMatch) {
    score += collectionMatch === 'club-bahia-evergreen' ? 8 : 28;
    reasons.unshift(
      collectionMatch === 'club-bahia-evergreen'
        ? 'Approved Club Bahia evergreen media'
        : 'Matches this recurring-night template',
    );
  }

  const eventTerms = new Set([
    ...words(event.title),
    ...words(event.concept),
    ...words(event.performers),
    ...words(event.genres),
  ]);
  const assetTerms = new Set([
    ...asset.tags,
    ...asset.performers.flatMap(words),
    ...asset.genres.flatMap(words),
  ]);
  const overlap = [...assetTerms]
    .filter((term) => eventTerms.has(term))
    .slice(0, 4);
  if (overlap.length) {
    score += overlap.length * 5;
    reasons.push(`Matches ${overlap.join(', ')}`);
  }

  if (asset.altText.trim()) score += 4;
  else warnings.push('Alt text still needs review');

  if (!asset.rightsNote.trim() && asset.rightsBasis === 'other-confirmed') {
    score -= 10;
    warnings.push('Rights note is incomplete');
  }

  const recency = daysSince(asset.lastUsedAt, now);
  if (recency !== undefined) {
    if (recency < 7) {
      score -= 28;
      warnings.push('Used within the last 7 days');
    } else if (recency < 21) {
      score -= 14;
      warnings.push('Used within the last 3 weeks');
    } else if (recency > 60) {
      score += 5;
      reasons.push('Has not been used recently');
    }
  } else {
    score += 7;
    reasons.push('Not yet used in a recorded campaign');
  }

  score -= Math.min(asset.usageCount, 10) * 1.5;
  if (asset.usageCount >= 6) warnings.push('Frequently reused asset');

  return {
    asset,
    score: Math.round(score),
    reasons: reasons.slice(0, 4),
    warnings: warnings.slice(0, 3),
  };
}

export function buildMediaRecommendationLanes(input: {
  event: OperationsEvent;
  assets: MediaLibraryAsset[];
  now?: Date;
  limitPerLane?: number;
}): MediaRecommendationLane[] {
  const now = input.now ?? new Date();
  const limit = input.limitPerLane ?? 4;
  return LANE_RULES.map((lane) => ({
    id: lane.id,
    label: lane.label,
    platform: lane.platform,
    preferredRoles: lane.preferredRoles,
    recommendations: input.assets
      .map((asset) =>
        scoreAsset({
          asset,
          event: input.event,
          platform: lane.platform,
          preferredRoles: lane.preferredRoles,
          preferredOrientations: lane.preferredOrientations,
          requiredKind: lane.requiredKind,
          now,
        }),
      )
      .filter((item): item is MediaRecommendation => item !== null)
      .sort(
        (left, right) =>
          right.score - left.score || left.asset.name.localeCompare(right.asset.name),
      )
      .slice(0, limit),
  }));
}
