export type EventAssetKind = 'image' | 'video' | 'audio' | 'document';

export type EventAssetRole =
  | 'primary-flyer'
  | 'feed-creative'
  | 'story-creative'
  | 'reel-video'
  | 'raw-video'
  | 'performer-photo'
  | 'venue-photo'
  | 'logo'
  | 'audio'
  | 'print-flyer'
  | 'other';

export type EventAssetPlatform =
  | 'website'
  | 'instagram-feed'
  | 'instagram-story'
  | 'reel'
  | 'tiktok'
  | 'facebook'
  | 'email'
  | 'sms'
  | 'print';

export type EventAssetStatus = 'draft' | 'approved';

export interface EventAsset {
  id: string;
  eventId: string;
  name: string;
  pathname: string;
  url: string;
  downloadUrl: string;
  contentType: string;
  size: number;
  kind: EventAssetKind;
  role: EventAssetRole;
  platforms: EventAssetPlatform[];
  status: EventAssetStatus;
  altText: string;
  notes: string;
  rightsConfirmedAt: string;
  uploadedAt: string;
  updatedAt: string;
}

export interface EventAssetReadinessItem {
  id: string;
  label: string;
  description: string;
  complete: boolean;
}

export const EVENT_ASSET_ROLE_LABELS: Record<EventAssetRole, string> = {
  'primary-flyer': 'Primary event flyer',
  'feed-creative': 'Instagram feed creative',
  'story-creative': 'Story creative',
  'reel-video': 'Vertical video for Instagram / TikTok',
  'raw-video': 'Raw video clip',
  'performer-photo': 'Performer / DJ photo',
  'venue-photo': 'Venue photo',
  logo: 'Logo / sponsor mark',
  audio: 'Audio / voice-over',
  'print-flyer': 'Printable flyer',
  other: 'Other campaign asset',
};

export const EVENT_ASSET_PLATFORM_LABELS: Record<EventAssetPlatform, string> = {
  website: 'Website',
  'instagram-feed': 'Instagram feed',
  'instagram-story': 'Instagram Story',
  reel: 'Instagram Reel',
  tiktok: 'TikTok',
  facebook: 'Facebook',
  email: 'Email',
  sms: 'SMS',
  print: 'Print',
};

export const EVENT_ASSET_PLATFORMS = Object.keys(
  EVENT_ASSET_PLATFORM_LABELS,
) as EventAssetPlatform[];

export const EVENT_ASSET_ROLES = Object.keys(
  EVENT_ASSET_ROLE_LABELS,
) as EventAssetRole[];

export const EVENT_ASSET_ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'audio/mpeg',
  'audio/mp4',
  'audio/wav',
  'audio/x-wav',
  'application/pdf',
] as const;

export const EVENT_ASSET_MAX_SIZE_BYTES = 250 * 1024 * 1024;

export function inferEventAssetKind(contentType: string): EventAssetKind {
  if (contentType.startsWith('image/')) return 'image';
  if (contentType.startsWith('video/')) return 'video';
  if (contentType.startsWith('audio/')) return 'audio';
  return 'document';
}

export function buildEventAssetReadiness(
  assets: EventAsset[],
): EventAssetReadinessItem[] {
  const approved = assets.filter((asset) => asset.status === 'approved');
  const hasRole = (role: EventAssetRole) =>
    approved.some((asset) => asset.role === role);
  const hasPlatform = (platform: EventAssetPlatform) =>
    approved.some((asset) => asset.platforms.includes(platform));

  return [
    {
      id: 'primary-flyer',
      label: 'Primary flyer',
      description: 'An approved flyer or hero image for the event.',
      complete: hasRole('primary-flyer'),
    },
    {
      id: 'feed',
      label: 'Feed creative',
      description: 'An approved image assigned to Instagram feed or Facebook.',
      complete: hasRole('feed-creative') || hasPlatform('instagram-feed'),
    },
    {
      id: 'story',
      label: 'Story creative',
      description: 'An approved vertical asset for Stories.',
      complete: hasRole('story-creative') || hasPlatform('instagram-story'),
    },
    {
      id: 'reel',
      label: 'Vertical video',
      description: 'An approved finished vertical video for Instagram Reel or TikTok.',
      complete:
        hasRole('reel-video') || hasPlatform('reel') || hasPlatform('tiktok'),
    },
  ];
}
