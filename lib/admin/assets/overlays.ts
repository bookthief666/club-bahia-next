import type { OperationsEvent } from '@/lib/admin/domain';
import { formatVenueTime } from '@/lib/admin/date';
import type { MediaDerivativePresetId } from './derivatives';

export type MediaOverlayStyleId =
  | 'club-bahia-classic'
  | 'azucar-warm'
  | 'bahia-nocturna'
  | 'minimal-light';

export type MediaOverlayPlacement = 'top-left' | 'bottom-left' | 'center';
export type MediaOverlayAlignment = 'left' | 'center';

export interface MediaOverlayRecipe {
  schemaVersion: 1;
  eventId: string;
  styleId: MediaOverlayStyleId;
  wordmark: string;
  title: string;
  dateLabel: string;
  timeLabel: string;
  cta: string;
  placement: MediaOverlayPlacement;
  alignment: MediaOverlayAlignment;
  textScale: number;
  shadeOpacity: number;
  accentColor: string;
  textColor: string;
  logoAssetId?: string;
}

export interface MediaOverlayStyle {
  id: MediaOverlayStyleId;
  label: string;
  description: string;
  titleFont: string;
  bodyFont: string;
  accentColor: string;
  textColor: string;
  shadeOpacity: number;
}

export const MEDIA_OVERLAY_STYLES: MediaOverlayStyle[] = [
  {
    id: 'club-bahia-classic',
    label: 'Club Bahia Classic',
    description: 'Elegant ivory and gold treatment for general venue promotions.',
    titleFont: 'Georgia, serif',
    bodyFont: 'Arial, sans-serif',
    accentColor: '#e9b95c',
    textColor: '#fff7e8',
    shadeOpacity: 0.64,
  },
  {
    id: 'azucar-warm',
    label: 'Azucar Warm',
    description: 'Warm gold and coral treatment for live Latin dance nights.',
    titleFont: 'Georgia, serif',
    bodyFont: 'Arial, sans-serif',
    accentColor: '#f2b343',
    textColor: '#fff4df',
    shadeOpacity: 0.6,
  },
  {
    id: 'bahia-nocturna',
    label: 'Bahía Nocturna',
    description: 'Dark cinematic treatment with a restrained red accent.',
    titleFont: 'Georgia, serif',
    bodyFont: 'Arial, sans-serif',
    accentColor: '#dc5148',
    textColor: '#f5f2ea',
    shadeOpacity: 0.72,
  },
  {
    id: 'minimal-light',
    label: 'Minimal Light',
    description: 'Clean white typography with minimal framing.',
    titleFont: 'Arial, sans-serif',
    bodyFont: 'Arial, sans-serif',
    accentColor: '#ffffff',
    textColor: '#ffffff',
    shadeOpacity: 0.48,
  },
];

export const MEDIA_OVERLAY_STYLE_LABELS = Object.fromEntries(
  MEDIA_OVERLAY_STYLES.map((style) => [style.id, style.label]),
) as Record<MediaOverlayStyleId, string>;

export function getMediaOverlayStyle(id: MediaOverlayStyleId): MediaOverlayStyle {
  const style = MEDIA_OVERLAY_STYLES.find((item) => item.id === id);
  if (!style) throw new Error(`Unknown media overlay style: ${id}`);
  return style;
}

function styleForEvent(event: OperationsEvent): MediaOverlayStyleId {
  if (
    event.promotionTemplate?.id === 'azucar-friday' ||
    event.promotionTemplate?.id === 'azucar-saturday'
  ) {
    return 'azucar-warm';
  }
  if (event.promotionTemplate?.id === 'bahia-nocturna') {
    return 'bahia-nocturna';
  }
  return 'club-bahia-classic';
}

function placementForPreset(
  presetId: MediaDerivativePresetId,
): Pick<MediaOverlayRecipe, 'placement' | 'alignment'> {
  if (
    presetId === 'instagram-story' ||
    presetId === 'instagram-reel-cover' ||
    presetId === 'tiktok-cover'
  ) {
    return { placement: 'bottom-left', alignment: 'left' };
  }
  if (presetId === 'website-hero') {
    return { placement: 'center', alignment: 'left' };
  }
  return { placement: 'bottom-left', alignment: 'left' };
}

export function formatOverlayDate(startsAt: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date(startsAt));
}

export function buildDefaultMediaOverlay(
  event: OperationsEvent,
  presetId: MediaDerivativePresetId,
): MediaOverlayRecipe {
  const style = getMediaOverlayStyle(styleForEvent(event));
  const placement = placementForPreset(presetId);
  return {
    schemaVersion: 1,
    eventId: event.id,
    styleId: style.id,
    wordmark: 'CLUB BAHIA',
    title: event.title,
    dateLabel: formatOverlayDate(event.startsAt),
    timeLabel: formatVenueTime(event.startsAt),
    cta: event.promotionTemplate?.offer || 'Reserve your night',
    placement: placement.placement,
    alignment: placement.alignment,
    textScale: 1,
    shadeOpacity: style.shadeOpacity,
    accentColor: style.accentColor,
    textColor: style.textColor,
  };
}

function cleanSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 100);
}

export function mediaOverlayVariantKey(
  overlay?: MediaOverlayRecipe,
): string {
  return overlay ? `event-${cleanSegment(overlay.eventId)}` : 'base';
}

export function mediaDerivativeRecordId(input: {
  assetId: string;
  presetId: MediaDerivativePresetId;
  overlay?: MediaOverlayRecipe;
}): string {
  return `${cleanSegment(input.assetId)}-${cleanSegment(input.presetId)}-${mediaOverlayVariantKey(input.overlay)}`;
}

export function mediaOverlayIsComplete(overlay: MediaOverlayRecipe): boolean {
  return Boolean(
    overlay.eventId.trim() &&
      overlay.wordmark.trim() &&
      overlay.title.trim() &&
      overlay.dateLabel.trim() &&
      overlay.timeLabel.trim() &&
      overlay.cta.trim(),
  );
}

export function overlayForPreset(input: {
  event: OperationsEvent;
  presetId: MediaDerivativePresetId;
  current?: MediaOverlayRecipe;
}): MediaOverlayRecipe {
  const defaults = buildDefaultMediaOverlay(input.event, input.presetId);
  if (!input.current || input.current.eventId !== input.event.id) return defaults;
  return {
    ...defaults,
    styleId: input.current.styleId,
    wordmark: input.current.wordmark,
    title: input.current.title,
    dateLabel: input.current.dateLabel,
    timeLabel: input.current.timeLabel,
    cta: input.current.cta,
    textScale: input.current.textScale,
    shadeOpacity: input.current.shadeOpacity,
    accentColor: input.current.accentColor,
    textColor: input.current.textColor,
    logoAssetId: input.current.logoAssetId,
  };
}
