import { createHash } from 'node:crypto';
import { put } from '@vercel/blob';
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
  setAssetSessionCookie,
} from '@/lib/admin/assets/server';
import { requireAdminResourceAccess } from '@/lib/admin/auth/resource-access';
import type { AdminUser } from '@/lib/admin/domain';
import {
  AdminWorkspaceConflictError,
  type AdminWorkspaceRecord,
} from '@/lib/admin/workspaces/domain';
import {
  getAdminWorkspaceRecord,
  saveAdminWorkspaceRecord,
} from '@/lib/admin/workspaces/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' };
const CATALOG_KEY = 'catalog';

function authorize(request: Request): AdminUser | NextResponse {
  try {
    return requireAdminResourceAccess(request);
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

function normalizeCatalog(value: unknown): MediaLibraryAsset[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => MediaLibraryAssetSchema.safeParse(item))
    .filter((result) => result.success)
    .map((result) => result.data as MediaLibraryAsset)
    .sort((left, right) => {
      if (left.status !== right.status) return left.status === 'active' ? -1 : 1;
      return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
    });
}

async function loadCatalog(): Promise<{
  record: AdminWorkspaceRecord<MediaLibraryAsset[]> | null;
  assets: MediaLibraryAsset[];
}> {
  const record = await getAdminWorkspaceRecord<MediaLibraryAsset[]>(
    'media-library',
    CATALOG_KEY,
  );
  return { record, assets: normalizeCatalog(record?.value) };
}

async function saveCatalog(input: {
  assets: MediaLibraryAsset[];
  expectedRevision: number;
  user: AdminUser;
}) {
  return saveAdminWorkspaceRecord({
    kind: 'media-library',
    key: CATALOG_KEY,
    value: input.assets,
    expectedRevision: input.expectedRevision,
    user: input.user,
  });
}

function libraryId(sourceEventId: string, sourceAssetId: string): string {
  const digest = createHash('sha256')
    .update(`${sourceEventId}:${sourceAssetId}`)
    .digest('hex')
    .slice(0, 24);
  return `media-${digest}`;
}

function assignmentId(input: {
  eventId: string;
  libraryAssetId: string;
  platform?: string;
  role?: string;
}): string {
  const digest = createHash('sha256')
    .update(
      `${input.eventId}:${input.libraryAssetId}:${input.platform ?? ''}:${input.role ?? ''}`,
    )
    .digest('hex')
    .slice(0, 22);
  return `reuse-${digest}`;
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
    rightsNote:
      'Permission was confirmed when this event asset was uploaded. Add source details before broad reuse.',
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
    id: assignmentId({
      eventId: input.eventId,
      libraryAssetId: input.asset.id,
      platform: input.platform,
      role: input.role,
    }),
    eventId: input.eventId,
    name: input.asset.name,
    pathname: input.asset.pathname,
    url: input.asset.url,
    downloadUrl: input.asset.downloadUrl,
    contentType: input.asset.contentType,
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

function conflictResponse(error: AdminWorkspaceConflictError) {
  return NextResponse.json(
    {
      error:
        'The media library changed in another browser. Reload before saving again.',
      expectedRevision: error.expectedRevision,
      currentRevision: error.currentRevision,
    },
    { status: 409, headers: NO_STORE_HEADERS },
  );
}

export async function GET(request: Request) {
  const authorization = authorize(request);
  if (authorization instanceof NextResponse) return authorization;
  try {
    const catalog = await loadCatalog();
    return authorizedJson({
      assets: catalog.assets,
      revision: catalog.record?.revision ?? 0,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not load media library.' },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}

export async function POST(request: Request) {
  const authorization = authorize(request);
  if (authorization instanceof NextResponse) return authorization;

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
      {
        error: 'Media library request failed validation.',
        details: parsed.error.flatten(),
      },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  try {
    const catalog = await loadCatalog();
    const expectedRevision = catalog.record?.revision ?? 0;

    if (parsed.data.action === 'import-event-asset') {
      const candidate = importEventAsset(
        parsed.data.asset as EventAsset,
        parsed.data.eventTitle,
      );
      const existing = catalog.assets.find((asset) => asset.id === candidate.id);
      const asset: MediaLibraryAsset = existing
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
        : candidate;
      const assets = existing
        ? catalog.assets.map((item) => (item.id === asset.id ? asset : item))
        : [asset, ...catalog.assets];
      const record = await saveCatalog({
        assets,
        expectedRevision,
        user: authorization,
      });
      return authorizedJson({ asset, revision: record.revision });
    }

    if (parsed.data.action === 'upsert') {
      const asset = MediaLibraryAssetSchema.parse({
        ...(parsed.data.asset as MediaLibraryAsset),
        tags: normalizeLibraryTags(parsed.data.asset.tags),
        updatedAt: new Date().toISOString(),
      }) as MediaLibraryAsset;
      const exists = catalog.assets.some((item) => item.id === asset.id);
      const assets = exists
        ? catalog.assets.map((item) => (item.id === asset.id ? asset : item))
        : [asset, ...catalog.assets];
      const record = await saveCatalog({
        assets,
        expectedRevision,
        user: authorization,
      });
      return authorizedJson({ asset, revision: record.revision });
    }

    if (parsed.data.action === 'archive') {
      const current = catalog.assets.find(
        (asset) => asset.id === parsed.data.libraryAssetId,
      );
      if (!current) {
        return NextResponse.json(
          { error: 'Media library asset not found.' },
          { status: 404, headers: NO_STORE_HEADERS },
        );
      }
      const asset: MediaLibraryAsset = {
        ...current,
        status: current.status === 'active' ? 'archived' : 'active',
        updatedAt: new Date().toISOString(),
      };
      const record = await saveCatalog({
        assets: catalog.assets.map((item) =>
          item.id === asset.id ? asset : item,
        ),
        expectedRevision,
        user: authorization,
      });
      return authorizedJson({ asset, revision: record.revision });
    }

    const current = catalog.assets.find(
      (asset) => asset.id === parsed.data.libraryAssetId,
    );
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
    const hasUsage = current.usageHistory.some(
      (usage) =>
        usage.eventId === parsed.data.eventId &&
        usage.platform === parsed.data.platform,
    );
    const usageHistory = hasUsage
      ? current.usageHistory
      : [
          ...current.usageHistory,
          {
            eventId: parsed.data.eventId,
            eventTitle: parsed.data.eventTitle,
            platform: parsed.data.platform,
            usedAt,
          },
        ].slice(-200);
    const updated: MediaLibraryAsset = {
      ...current,
      usageHistory,
      usageCount: usageHistory.length,
      lastUsedAt: hasUsage ? current.lastUsedAt : usedAt,
      updatedAt: usedAt,
    };
    const record = await saveCatalog({
      assets: catalog.assets.map((asset) =>
        asset.id === updated.id ? updated : asset,
      ),
      expectedRevision,
      user: authorization,
    });

    return authorizedJson({
      assignment,
      asset: updated,
      revision: record.revision,
    });
  } catch (error) {
    if (error instanceof AdminWorkspaceConflictError) {
      return conflictResponse(error);
    }
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Media library operation failed.',
      },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}
