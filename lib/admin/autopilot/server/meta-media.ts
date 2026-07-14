import 'server-only';

import { isIP } from 'node:net';

const MAX_REEL_BYTES = 250 * 1024 * 1024;

function configuredMediaHosts(): Set<string> {
  const hosts = new Set<string>();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (siteUrl) {
    try {
      hosts.add(new URL(siteUrl).hostname.toLowerCase());
    } catch {
      // Invalid deployment configuration is surfaced by provider readiness.
    }
  }
  for (const value of (process.env.META_ALLOWED_MEDIA_HOSTS ?? '').split(',')) {
    const host = value.trim().toLowerCase();
    if (host) hosts.add(host);
  }
  return hosts;
}

function isPrivateAddress(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  if (normalized === 'localhost' || normalized.endsWith('.localhost')) return true;
  const family = isIP(normalized);
  if (!family) return false;
  if (family === 6) {
    return (
      normalized === '::1' ||
      normalized.startsWith('fc') ||
      normalized.startsWith('fd') ||
      normalized.startsWith('fe80')
    );
  }
  const parts = normalized.split('.').map(Number);
  return (
    parts[0] === 10 ||
    parts[0] === 127 ||
    (parts[0] === 169 && parts[1] === 254) ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168)
  );
}

function isAllowedMediaHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  if (isPrivateAddress(normalized)) return false;
  if (normalized.endsWith('.public.blob.vercel-storage.com')) return true;
  return configuredMediaHosts().has(normalized);
}

export async function verifyPublicMetaReelVideo(videoUrl: string): Promise<void> {
  const parsed = new URL(videoUrl);
  if (parsed.protocol !== 'https:' || !isAllowedMediaHost(parsed.hostname)) {
    throw new Error(
      'The Reel video must be hosted on the approved Club Bahia site or public Vercel Blob storage.',
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    let response = await fetch(parsed, {
      method: 'HEAD',
      redirect: 'follow',
      cache: 'no-store',
      signal: controller.signal,
    });
    if (response.status === 405) {
      response = await fetch(parsed, {
        method: 'GET',
        headers: { Range: 'bytes=0-0' },
        redirect: 'follow',
        cache: 'no-store',
        signal: controller.signal,
      });
    }

    const finalUrl = new URL(response.url || videoUrl);
    if (
      finalUrl.protocol !== 'https:' ||
      !isAllowedMediaHost(finalUrl.hostname)
    ) {
      throw new Error('The Reel video redirected to an unapproved host.');
    }
    const contentType = response.headers.get('content-type') ?? '';
    if (!response.ok || !contentType.toLowerCase().startsWith('video/')) {
      throw new Error('The selected Reel URL is not a publicly readable video.');
    }
    const contentLength = Number(response.headers.get('content-length'));
    if (Number.isFinite(contentLength) && contentLength > MAX_REEL_BYTES) {
      throw new Error('The controlled Reel proof video must be 250 MB or smaller.');
    }
  } finally {
    clearTimeout(timeout);
  }
}
