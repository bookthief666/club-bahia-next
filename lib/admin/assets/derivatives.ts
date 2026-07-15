import type {
  EventAssetKind,
  EventAssetPlatform,
} from './domain';

export type MediaDerivativePresetId =
  | 'instagram-feed-portrait'
  | 'instagram-square'
  | 'instagram-story'
  | 'instagram-reel-cover'
  | 'tiktok-cover'
  | 'website-hero'
  | 'google-business-image';

export type MediaDerivativeStatus = 'draft' | 'approved';

export interface MediaDerivativeSafeArea {
  topPercent: number;
  rightPercent: number;
  bottomPercent: number;
  leftPercent: number;
  label: string;
}

export interface MediaDerivativeGridCrop {
  aspectRatio: number;
  label: string;
}

export interface MediaDerivativePreset {
  id: MediaDerivativePresetId;
  label: string;
  shortLabel: string;
  description: string;
  width: number;
  height: number;
  accepts: EventAssetKind[];
  platform?: EventAssetPlatform;
  safeArea?: MediaDerivativeSafeArea;
  gridCrop?: MediaDerivativeGridCrop;
}

export interface MediaDerivative {
  id: string;
  presetId: MediaDerivativePresetId;
  sourceAssetId: string;
  pathname: string;
  url: string;
  downloadUrl: string;
  contentType: 'image/jpeg';
  size: number;
  width: number;
  height: number;
  focalX: number;
  focalY: number;
  zoom: number;
  frameTimeSeconds?: number;
  status: MediaDerivativeStatus;
  createdAt: string;
  updatedAt: string;
}

export interface MediaCropRect {
  sourceX: number;
  sourceY: number;
  sourceWidth: number;
  sourceHeight: number;
}

export const MEDIA_DERIVATIVE_PRESETS: MediaDerivativePreset[] = [
  {
    id: 'instagram-feed-portrait',
    label: 'Instagram feed portrait',
    shortLabel: 'Feed 4:5',
    description: 'Primary portrait feed image with a conservative text-safe inset.',
    width: 1080,
    height: 1350,
    accepts: ['image'],
    platform: 'instagram-feed',
    safeArea: {
      topPercent: 4,
      rightPercent: 4,
      bottomPercent: 6,
      leftPercent: 4,
      label: 'Keep critical text and faces inside this guide.',
    },
  },
  {
    id: 'instagram-square',
    label: 'Instagram square',
    shortLabel: 'Square 1:1',
    description: 'Reusable square version for feed, email, and cross-platform fallback.',
    width: 1080,
    height: 1080,
    accepts: ['image'],
    platform: 'instagram-feed',
    safeArea: {
      topPercent: 5,
      rightPercent: 5,
      bottomPercent: 5,
      leftPercent: 5,
      label: 'Keep critical content inside this inset.',
    },
  },
  {
    id: 'instagram-story',
    label: 'Instagram Story',
    shortLabel: 'Story 9:16',
    description: 'Full-screen Story image with conservative interface-safe zones.',
    width: 1080,
    height: 1920,
    accepts: ['image'],
    platform: 'instagram-story',
    safeArea: {
      topPercent: 12,
      rightPercent: 5,
      bottomPercent: 17,
      leftPercent: 5,
      label: 'Avoid placing essential details behind Story interface controls.',
    },
  },
  {
    id: 'instagram-reel-cover',
    label: 'Instagram Reel cover',
    shortLabel: 'Reel cover',
    description: 'Vertical Reel cover with interface-safe zones and a central profile-grid guide.',
    width: 1080,
    height: 1920,
    accepts: ['image', 'video'],
    platform: 'reel',
    safeArea: {
      topPercent: 12,
      rightPercent: 6,
      bottomPercent: 18,
      leftPercent: 6,
      label: 'Keep the title and faces away from Reel controls.',
    },
    gridCrop: {
      aspectRatio: 3 / 4,
      label: 'Profile-grid preview',
    },
  },
  {
    id: 'tiktok-cover',
    label: 'TikTok cover',
    shortLabel: 'TikTok cover',
    description: 'Vertical TikTok cover with extra room for right-side and bottom controls.',
    width: 1080,
    height: 1920,
    accepts: ['image', 'video'],
    platform: 'tiktok',
    safeArea: {
      topPercent: 10,
      rightPercent: 13,
      bottomPercent: 20,
      leftPercent: 6,
      label: 'Keep essential content clear of captions and action controls.',
    },
  },
  {
    id: 'website-hero',
    label: 'Website event hero',
    shortLabel: 'Website 16:9',
    description: 'Wide event-page hero with room for responsive cropping.',
    width: 1600,
    height: 900,
    accepts: ['image'],
    platform: 'website',
    safeArea: {
      topPercent: 8,
      rightPercent: 10,
      bottomPercent: 8,
      leftPercent: 10,
      label: 'Keep the main subject within the responsive center area.',
    },
  },
  {
    id: 'google-business-image',
    label: 'Google Business image',
    shortLabel: 'Google 4:3',
    description: 'General-purpose 4:3 venue or event image for a future Google listing workflow.',
    width: 1200,
    height: 900,
    accepts: ['image'],
    safeArea: {
      topPercent: 6,
      rightPercent: 6,
      bottomPercent: 6,
      leftPercent: 6,
      label: 'Keep critical content within this general-purpose safe area.',
    },
  },
];

export const MEDIA_DERIVATIVE_PRESET_LABELS = Object.fromEntries(
  MEDIA_DERIVATIVE_PRESETS.map((preset) => [preset.id, preset.label]),
) as Record<MediaDerivativePresetId, string>;

export function getMediaDerivativePreset(
  id: MediaDerivativePresetId,
): MediaDerivativePreset {
  const preset = MEDIA_DERIVATIVE_PRESETS.find((item) => item.id === id);
  if (!preset) throw new Error(`Unknown media derivative preset: ${id}`);
  return preset;
}

export function mediaDerivativePresetsForKind(
  kind: EventAssetKind,
): MediaDerivativePreset[] {
  return MEDIA_DERIVATIVE_PRESETS.filter((preset) => preset.accepts.includes(kind));
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export function calculateMediaCoverCrop(input: {
  sourceWidth: number;
  sourceHeight: number;
  targetWidth: number;
  targetHeight: number;
  focalX?: number;
  focalY?: number;
  zoom?: number;
}): MediaCropRect {
  const sourceWidth = Math.max(1, input.sourceWidth);
  const sourceHeight = Math.max(1, input.sourceHeight);
  const targetRatio = input.targetWidth / input.targetHeight;
  const sourceRatio = sourceWidth / sourceHeight;
  const zoom = clamp(input.zoom ?? 1, 1, 3);

  let cropWidth: number;
  let cropHeight: number;
  if (sourceRatio > targetRatio) {
    cropHeight = sourceHeight / zoom;
    cropWidth = cropHeight * targetRatio;
  } else {
    cropWidth = sourceWidth / zoom;
    cropHeight = cropWidth / targetRatio;
  }

  cropWidth = Math.min(sourceWidth, cropWidth);
  cropHeight = Math.min(sourceHeight, cropHeight);
  const focalX = clamp(input.focalX ?? 0.5, 0, 1) * sourceWidth;
  const focalY = clamp(input.focalY ?? 0.5, 0, 1) * sourceHeight;
  const sourceX = clamp(focalX - cropWidth / 2, 0, sourceWidth - cropWidth);
  const sourceY = clamp(focalY - cropHeight / 2, 0, sourceHeight - cropHeight);

  return {
    sourceX,
    sourceY,
    sourceWidth: cropWidth,
    sourceHeight: cropHeight,
  };
}

export function approvedDerivativeForPlatform(input: {
  derivatives?: MediaDerivative[];
  platform?: EventAssetPlatform;
}): MediaDerivative | undefined {
  const approved = (input.derivatives ?? []).filter(
    (derivative) => derivative.status === 'approved',
  );
  const preferredIds: MediaDerivativePresetId[] =
    input.platform === 'instagram-feed'
      ? ['instagram-feed-portrait', 'instagram-square']
      : input.platform === 'instagram-story'
        ? ['instagram-story']
        : input.platform === 'website'
          ? ['website-hero']
          : [];

  for (const id of preferredIds) {
    const derivative = approved.find((item) => item.presetId === id);
    if (derivative) return derivative;
  }
  return undefined;
}

export function derivativeReadinessCount(derivatives?: MediaDerivative[]): number {
  return new Set(
    (derivatives ?? [])
      .filter((derivative) => derivative.status === 'approved')
      .map((derivative) => derivative.presetId),
  ).size;
}
