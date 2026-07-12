'use client';

import type { EventAsset } from '@/lib/admin/assets/domain';

const ACCESS_SESSION_KEY = 'club-bahia-event-assets-access';
const ASSET_API = '/api/admin/assets';
const SESSION_API = '/api/admin/assets/session';

export class AssetSessionError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'AssetSessionError';
    this.status = status;
  }
}

function legacyAccessHeader(): HeadersInit | undefined {
  if (typeof window === 'undefined') return undefined;
  const accessCode = window.sessionStorage.getItem(ACCESS_SESSION_KEY);
  return accessCode ? { 'x-admin-asset-key': accessCode } : undefined;
}

export async function fetchEventAssets(eventId: string): Promise<EventAsset[]> {
  const response = await fetch(
    `${ASSET_API}?eventId=${encodeURIComponent(eventId)}`,
    {
      cache: 'no-store',
      credentials: 'same-origin',
      headers: legacyAccessHeader(),
    },
  );
  const result = (await response.json()) as {
    assets?: EventAsset[];
    error?: string;
  };

  if (!response.ok || !result.assets) {
    throw new AssetSessionError(
      result.error || 'Could not load approved event media.',
      response.status,
    );
  }
  return result.assets;
}

export async function unlockAssetSession(accessCode: string): Promise<void> {
  const response = await fetch(SESSION_API, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessCode }),
  });
  const result = (await response.json()) as { error?: string };
  if (!response.ok) {
    throw new AssetSessionError(
      result.error || 'Could not unlock event media.',
      response.status,
    );
  }
}

export async function lockAssetSession(): Promise<void> {
  await fetch(SESSION_API, {
    method: 'DELETE',
    credentials: 'same-origin',
  });
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem(ACCESS_SESSION_KEY);
  }
}
