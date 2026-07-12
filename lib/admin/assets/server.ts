import 'server-only';

import { timingSafeEqual } from 'node:crypto';
import type { EventAsset } from './domain';

export const ASSET_ACCESS_HEADER = 'x-admin-asset-key';

export function isAssetStorageConfigured(): boolean {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN && process.env.ADMIN_ASSET_UPLOAD_SECRET,
  );
}

export function requireAssetAccess(request: Request): void {
  const expected = process.env.ADMIN_ASSET_UPLOAD_SECRET;
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('Vercel Blob storage is not configured.');
  }
  if (!expected) {
    throw new Error('ADMIN_ASSET_UPLOAD_SECRET is not configured.');
  }

  const supplied = request.headers.get(ASSET_ACCESS_HEADER) ?? '';
  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(supplied);

  if (
    expectedBuffer.length !== suppliedBuffer.length ||
    !timingSafeEqual(expectedBuffer, suppliedBuffer)
  ) {
    throw new Error('Invalid asset access code.');
  }
}

export function cleanAssetSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 160);
}

export function cleanAssetFilename(value: string): string {
  const cleaned = value
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(0, 180);

  return cleaned || 'event-asset';
}

export function eventAssetFolder(eventId: string, assetId: string): string {
  return `club-bahia/events/${cleanAssetSegment(eventId)}/assets/${cleanAssetSegment(assetId)}`;
}

export function eventAssetPrefix(eventId: string): string {
  return `club-bahia/events/${cleanAssetSegment(eventId)}/assets/`;
}

export function eventAssetMetadataPath(eventId: string, assetId: string): string {
  return `${eventAssetFolder(eventId, assetId)}/metadata.json`;
}

export function isEventAsset(value: unknown): value is EventAsset {
  return Boolean(value && typeof value === 'object' && 'eventId' in value && 'url' in value);
}
