import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';
import type { NextResponse } from 'next/server';
import type { EventAsset } from './domain';
import type { MediaDerivativePresetId } from './derivatives';

export const ASSET_ACCESS_HEADER = 'x-admin-asset-key';
export const ASSET_SESSION_COOKIE = 'club_bahia_asset_session';
export const ASSET_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

export function isAssetStorageConfigured(): boolean {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN && process.env.ADMIN_ASSET_UPLOAD_SECRET,
  );
}

function assetSecret(): string {
  const secret = process.env.ADMIN_ASSET_UPLOAD_SECRET;
  if (!secret) {
    throw new Error('ADMIN_ASSET_UPLOAD_SECRET is not configured.');
  }
  return secret;
}

function secureEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function signSessionPayload(payload: string): string {
  return createHmac('sha256', assetSecret())
    .update(`club-bahia-assets:${payload}`)
    .digest('base64url');
}

export function createAssetSessionToken(now = Date.now()): string {
  const expiresAt = Math.floor(now / 1000) + ASSET_SESSION_MAX_AGE_SECONDS;
  const payload = String(expiresAt);
  return `${payload}.${signSessionPayload(payload)}`;
}

export function verifyAssetSessionToken(token: string): boolean {
  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra) return false;
  const expiresAt = Number(payload);
  if (!Number.isFinite(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) {
    return false;
  }
  return secureEqual(signature, signSessionPayload(payload));
}

function cookieValue(request: Request, name: string): string {
  const cookieHeader = request.headers.get('cookie') ?? '';
  const match = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : '';
}

export function hasAssetSession(request: Request): boolean {
  const token = cookieValue(request, ASSET_SESSION_COOKIE);
  return Boolean(token && verifyAssetSessionToken(token));
}

export function validateAssetAccessCode(supplied: string): void {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('Vercel Blob storage is not configured.');
  }
  const expected = assetSecret();
  if (!secureEqual(expected, supplied)) {
    throw new Error('Invalid asset access code.');
  }
}

export function requireAssetAccess(request: Request): 'session' | 'header' {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('Vercel Blob storage is not configured.');
  }

  if (hasAssetSession(request)) return 'session';

  const supplied = request.headers.get(ASSET_ACCESS_HEADER) ?? '';
  validateAssetAccessCode(supplied);
  return 'header';
}

export function setAssetSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: ASSET_SESSION_COOKIE,
    value: createAssetSessionToken(),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ASSET_SESSION_MAX_AGE_SECONDS,
  });
}

export function clearAssetSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: ASSET_SESSION_COOKIE,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
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

export function mediaLibraryPrefix(): string {
  return 'club-bahia/media-library/assets/';
}

export function mediaLibraryAssetFolder(assetId: string): string {
  return `${mediaLibraryPrefix()}${cleanAssetSegment(assetId)}`;
}

export function mediaLibraryMetadataPath(assetId: string): string {
  return `${mediaLibraryAssetFolder(assetId)}/metadata.json`;
}

export function mediaLibraryDerivativeFolder(assetId: string): string {
  return `${mediaLibraryAssetFolder(assetId)}/derivatives`;
}

export function mediaLibraryDerivativePath(
  assetId: string,
  presetId: MediaDerivativePresetId,
  variantKey = 'base',
): string {
  return `${mediaLibraryDerivativeFolder(assetId)}/${cleanAssetSegment(presetId)}/${cleanAssetSegment(variantKey)}.jpg`;
}

export function isEventAsset(value: unknown): value is EventAsset {
  return Boolean(value && typeof value === 'object' && 'eventId' in value && 'url' in value);
}
