import { createHash, randomUUID } from 'node:crypto';
import { list, put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import type { EventAsset } from '@/lib/admin/assets/domain';
import type { MediaLibraryAsset } from '@/lib/admin/assets/library-domain';
import {
  inferMediaOrientation,
  normalizeLibraryTags,
} from '@/lib/admin/assets/library-domain';
import {
  MediaLibraryAssetSchema,
  MediaLibraryMutationSchema,
} from '@/lib/admin/assets/library-validation';
import {
  eventAssetMetadataPath,
  mediaLibraryMetadataPath,
  mediaLibraryPrefix,
  setAssetSessionCookie,
} from '@/lib/admin/assets/server';
import { requireAdminResourceAccess } from '@/lib/admin/auth/resource-access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' };

function authorize(request: Request): NextResponse | null {
  try {
    requireAdminResourceAccess(request);
    return null;
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Media library access is not authorized.',
      },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }
}

function authorizedJson(body: unknown, init?: { status?: number }) {
  const response = NextResponse.json(body, {
    status: init?.status,
    headers: NO_STORE_HEADERS,
  });
  setAssetSessionCookie(response);
  return response;
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(`${url}?v=${Date.now()}`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Could not read media metadata (${response.status}).`);
  return response.json();
}

async function listLibraryAssets(): Promise<MediaLibraryAsset[]> {
  const metadataBlobs: Array<{ url: string }> = [];
  let cursor: string | undefined;

  do {
    const result = await list({ prefix: mediaLibraryPrefix(), limit: 1000, cursor });
    metadataBlobs.push(
      ...result.blobs
        .filter((blob) => blob.pathname.endsWith('/metadata.json'))
        .map((blob) => ({ url: blob.url })),
    );
    cursor = result.hasMore ? result.cursor : undefined;
  } while (cursor && metadataBlobs.length < 1000);

  const parsed = await Promise.all(
    metadataBlobs.map(async ({ url }) => {
      try {
        const result = MediaLibraryAssetSchema.safeParse(await fetchJson(url));
        return result.success ? (result.data as MediaLibraryAsset) : null;
      } catch {
        return null;
      }
    }),
  );

  return parsed
    .filter((asset): asset is MediaLibraryAsset => asset !== null)
    .sort((left, right) => {
      if (left.status !== right.status) return left.status === 'active' ? -1 : 1;
      return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
    });
}

async function readLibraryAsset(assetId: string): Promise<MediaLibraryAsset | null> {
  const path = mediaLibraryMetadataPath(assetId);
  const result = await list({ prefix: path, limit: 10 });
  const blob = result.blobs.find((item) => item.pathname === path);
  if (!blob) return null;
  const parsed = MediaLibraryAssetSchema.safeParse(await fetchJson(blob.url));
  return parsed.success ? (parsed.data as MediaLibraryAsset) : null;
}

async function saveLibraryAsset(asset: MediaLibraryAsset): Promise<MediaLibraryAsset> {
  const parsed = MediaLibraryAssetSchema.parse(asset) as MediaLibraryAsset;
  await put(mediaLibraryMetadataPath(parsed.id), JSON.stringify(parsed), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
    cacheControlMaxAge: 60,
  });
  return parsed;
}

function libraryId(sourceEventId: string, sourceAssetId: string): string {
  const digest = createHash('sha256')
    .update(`${sourceEventId}:${sourceAssetId}`)
    .digest('hex')
    .slice(0, 24);
  return `media-${digest}`;
}

function defaultCollections(asset: EventAsset, eventTitle: string) {
  const collections: MediaLibraryAsset['collections'] = [];
  const title = eventTitle.toLowerCase();
  if (title.includes('azucar') && title.includes('friday')) collections.push('azucar-friday');
  if (title.includes('azucar') && title.includes('saturday')) collections.push('azucar-saturday');
  if (title.includes('bahía nocturna') || title.includes('bahia nocturna')) {
    collections.push('bahia-nocturna');
  }
  if (asset.role === 'logo') collections.push('logos-brand');
  if (asset.role === 'performer-photo') collections.push('performers');
  if (asset.role === 'venue-photo') collections.push('venue-interior');
  if (asset.role === 'reel-video' || asset.role === 'raw-video') {
    collections.push('crowd-energy');
  }
  if (!collections.length) collections.push('club-bahia-evergreen');
  return [...new Set(collections)];
}

function importEventAsset(asset: EventAsset, eventTitle: string): MediaLibraryAsset {
  if (asset.status !== 'approved') {
    throw new Error('Only approved event media can enter the reusable library.');
  }
  const now = new Date().toISOString();
  const tags = normalizeLibraryTags([
    asset.role,
    ...eventTitle.split(/[^a-zA-Z0-9áéíóúñü]+/i),
  ]);
  return {
    schemaVersion: 1,
    id: libraryId(asset.eventId, asset.id),
    sourceEventId: asset.eventId,
    sourceAssetId: asset.id,
    name: asset.name,
    pathname: asset.pathname,
    url: asset.url,
    downloadUrl: asset.downloadUrl,
    contentType: asset.contentType,
    size: asset.size,
    kind: asset.kind,
    role: asset.role,
    platforms: asset.platforms,
    status: 'active',
    altText: asset.altText,
    notes: asset.notes,
    collections: defaultCollections(asset, eventTitle),
    tags,
    performers: [],
    genres: [],
    orientation: inferMediaOrientation({ kind: asset.kind, role: asset.role }),
    qualityRating: 3,
    rightsBasis: 'other-confirmed',
    rightsNote: 'Permission was confirmed when this event asset was uploaded. Add source details before broad reuse.',
    credit: '',
    rightsConfirmedAt: asset.rightsConfirmedAt,
    usageHistory: [],
    usageCount: 0,
    createdAt: asset.uploadedAt || now,
    updatedAt: now,
  };
}

function assignmentFromLibrary(input: {
  asset: MediaLibraryAsset;
  eventId: string;
  platform?: EventAsset['platforms'][number];
  role?: EventAsset['role'];
}): EventAsset {
  const now = new Date().toISOString();
  return {
    id: `reuse-${input.asset.id}-${randomUUID().slice(0, 8)}`,
    eventId: input.eventId,
    name: input.asset.name,
    pathname: input.asset.pathname,
    url: input.asset.url,
    downloadUrl: input.asset.downloadUrl,
    contentType: input.asset.contentType as EventAsset['contentType'],
    size: input.asset.size,
    kind: input.asset.kind,
    role: input.role ?? input.asset.role,
    platforms: input.platform ? [input.platform] : input.asset.platforms,
    status: 'approved',
    altText: input.asset.altText,
    notes: [
      input.asset.notes,
      `Reused from media library asset ${input.asset.id}.`,
    ]
      .filter(Boolean)
      .join(' '),
    rightsConfirmedAt: input.asset.rightsConfirmedAt,
    uploadedAt: now,
    updatedAt: now,
    sourceLibraryAssetId: input.asset.id,
  };
}

export async function GET(request: Request) {
  const unauthorized = authorize(request);
  if (unauthorized) return unauthorized;
  try {
    return authorizedJson({ assets: await listLibraryAssets() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not load media library.' },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}

export async function POST(request: Request) {
  const unauthorized = authorize(request);
  if (unauthorized) return unauthorized;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Media library request must be valid JSON.' },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const parsed = MediaLibraryMutationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Media library request failed validation.', details: parsed.error.flatten() },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  try {
    if (parsed.data.action === 'import-event-asset') {
      const candidate = importEventAsset(
        parsed.data.asset as EventAsset,
        parsed.data.eventTitle,
      );
      const existing = await readLibraryAsset(candidate.id);
      const asset = await saveLibraryAsset(
        existing
          ? {
              ...candidate,
              ...existing,
              status: 'active',
              name: candidate.name,
              url: candidate.url,
              downloadUrl: candidate.downloadUrl,
              pathname: candidate.pathname,
              contentType: candidate.contentType,
              size: candidate.size,
              altText: candidate.altText || existing.altText,
              notes: candidate.notes || existing.notes,
              platforms: candidate.platforms.length
                ? candidate.platforms
                : existing.platforms,
              updatedAt: new Date().toISOString(),
            }
          : candidate,
      );
      return authorizedJson({ asset });
    }

    if (parsed.data.action === 'upsert') {
      const asset = await saveLibraryAsset({
        ...(parsed.data.asset as MediaLibraryAsset),
        tags: normalizeLibraryTags(parsed.data.asset.tags),
        updatedAt: new Date().toISOString(),
      });
      return authorizedJson({ asset });
    }

    if (parsed.data.action === 'archive') {
      const current = await readLibraryAsset(parsed.data.libraryAssetId);
      if (!current) {
        return NextResponse.json(
          { error: 'Media library asset not found.' },
          { status: 404, headers: NO_STORE_HEADERS },
        );
      }
      const asset = await saveLibraryAsset({
        ...current,
        status: current.status === 'active' ? 'archived' : 'active',
        updatedAt: new Date().toISOString(),
      });
      return authorizedJson({ asset });
    }

    const current = await readLibraryAsset(parsed.data.libraryAssetId);
    if (!current || current.status !== 'active') {
      return NextResponse.json(
        { error: 'This media library asset is not available for reuse.' },
        { status: 404, headers: NO_STORE_HEADERS },
      );
    }

    const assignment = assignmentFromLibrary({
      asset: current,
      eventId: parsed.data.eventId,
      platform: parsed.data.platform,
      role: parsed.data.role,
    });
    await put(
      eventAssetMetadataPath(assignment.eventId, assignment.id),
      JSON.stringify(assignment),
      {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'application/json',
        cacheControlMaxAge: 60,
      },
    );

    const usedAt = new Date().toISOString();
    const usageHistory = [
      ...current.usageHistory,
      {
        eventId: parsed.data.eventId,
        eventTitle: parsed.data.eventTitle,
        platform: parsed.data.platform,
        usedAt,
      },
    ].slice(-200);
    let usageWarning: string | undefined;
    try {
      await saveLibraryAsset({
        ...current,
        usageHistory,
        usageCount: usageHistory.length,
        lastUsedAt: usedAt,
        updatedAt: usedAt,
      });
    } catch {
      usageWarning = 'The event assignment was saved, but usage history needs to be refreshed.';
    }

    return authorizedJson({ assignment, usageWarning });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Media library operation failed.' },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}
