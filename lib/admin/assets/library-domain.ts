import type {
  EventAssetKind,
  EventAssetPlatform,
  EventAssetRole,
} from './domain';
import type { MediaDerivative } from './derivatives';

export type MediaLibraryCollectionId =
  | 'club-bahia-evergreen'
  | 'venue-exterior'
  | 'venue-interior'
  | 'crowd-energy'
  | 'live-band'
  | 'azucar-friday'
  | 'azucar-saturday'
  | 'bahia-nocturna'
  | 'performers'
  | 'logos-brand';

export type MediaOrientation =
  | 'square'
  | 'portrait'
  | 'landscape'
  | 'vertical-video'
  | 'unknown';

export type MediaRightsBasis =
  | 'club-bahia-owned'
  | 'performer-provided'
  | 'photographer-permission'
  | 'licensed'
  | 'other-confirmed';

export type MediaLibraryStatus = 'active' | 'archived';

export interface MediaLibraryUsage {
  eventId: string;
  eventTitle: string;
  platform?: EventAssetPlatform;
  usedAt: string;
}

export interface MediaLibraryAsset {
  schemaVersion: 1;
  id: string;
  sourceEventId: string;
  sourceAssetId: string;
  name: string;
  pathname: string;
  url: string;
  downloadUrl: string;
  contentType: string;
  size: number;
  kind: EventAssetKind;
  role: EventAssetRole;
  platforms: EventAssetPlatform[];
  status: MediaLibraryStatus;
  altText: string;
  notes: string;
  collections: MediaLibraryCollectionId[];
  tags: string[];
  performers: string[];
  genres: string[];
  orientation: MediaOrientation;
  width?: number;
  height?: number;
  durationSeconds?: number;
  qualityRating: 1 | 2 | 3 | 4 | 5;
  rightsBasis: MediaRightsBasis;
  rightsNote: string;
  credit: string;
  rightsConfirmedAt: string;
  capturedAt?: string;
  derivatives?: MediaDerivative[];
  usageHistory: MediaLibraryUsage[];
  usageCount: number;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const MEDIA_LIBRARY_COLLECTION_LABELS: Record<
  MediaLibraryCollectionId,
  string
> = {
  'club-bahia-evergreen': 'Club Bahia evergreen',
  'venue-exterior': 'Venue exterior and signage',
  'venue-interior': 'Venue interior',
  'crowd-energy': 'Crowd and dance-floor energy',
  'live-band': 'Live bands and musicians',
  'azucar-friday': 'Azucar LA — Friday',
  'azucar-saturday': 'Azucar LA — Saturday',
  'bahia-nocturna': 'Bahía Nocturna',
  performers: 'Performers and DJs',
  'logos-brand': 'Logos and brand marks',
};

export const MEDIA_LIBRARY_COLLECTIONS = Object.keys(
  MEDIA_LIBRARY_COLLECTION_LABELS,
) as MediaLibraryCollectionId[];

export const MEDIA_ORIENTATION_LABELS: Record<MediaOrientation, string> = {
  square: 'Square',
  portrait: 'Portrait',
  landscape: 'Landscape',
  'vertical-video': 'Vertical video',
  unknown: 'Not set',
};

export const MEDIA_RIGHTS_LABELS: Record<MediaRightsBasis, string> = {
  'club-bahia-owned': 'Club Bahia owns the media',
  'performer-provided': 'Provided by performer or promoter',
  'photographer-permission': 'Photographer permission confirmed',
  licensed: 'Licensed for promotional use',
  'other-confirmed': 'Other permission confirmed',
};

export function inferMediaOrientation(input: {
  kind: EventAssetKind;
  width?: number;
  height?: number;
  role?: EventAssetRole;
}): MediaOrientation {
  if (input.kind === 'video' && input.role === 'reel-video') {
    return 'vertical-video';
  }
  if (!input.width || !input.height) return 'unknown';
  const ratio = input.width / input.height;
  if (ratio > 1.18) return 'landscape';
  if (ratio < 0.78) {
    return input.kind === 'video' ? 'vertical-video' : 'portrait';
  }
  return 'square';
}

export function normalizeLibraryTags(values: string[]): string[] {
  const seen = new Set<string>();
  return values
    .map((value) => value.trim().toLowerCase().replace(/\s+/g, '-'))
    .filter((value) => {
      if (!value || seen.has(value)) return false;
      seen.add(value);
      return true;
    })
    .slice(0, 30);
}
