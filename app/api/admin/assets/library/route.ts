import { createHash } from 'node:crypto';
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import type { EventAsset } from '@/lib/admin/assets/domain';
import {
  approvedDerivativeForPlatform,
  getMediaDerivativePreset,
  MEDIA_DERIVATIVE_PRESET_LABELS,
  mediaDerivativeVariantKey,
  type MediaDerivative,
} from '@/lib/admin/assets/derivatives';
import type { MediaLibraryAsset } from '@/lib/admin/assets/library-domain';
import {
  inferMediaOrientation,
  normalizeLibraryTags,
} from '@/lib/admin/assets/library-domain';
import {
  loadMediaLibraryCatalog,
  saveMediaLibraryCatalog,
} from '@/lib/admin/assets/library-server';
import {
  MediaLibraryAssetSchema,
  MediaLibraryMutationSchema,
} from '@/lib/admin/assets/library-validation';
import { mediaOverlayVariantKey } from '@/lib/admin/assets/overlays';
import {
  eventAssetMetadataPath,
  setAssetSessionCookie,
} from '@/lib/admin/assets/server';
import { requireAdminResourceAccess } from '@/lib/admin/auth/resource-access';
import type { AdminUser } from '@/lib/admin/domain';
import { AdminWorkspaceConflictError } from '@/lib/admin/workspaces/domain';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' };

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
  derivativeId?: string;
  platform?: string;
  role?: string;
}): string {
  const digest = createHash('sha256')
    .update(
      `${input.eventId}:${input.libraryAssetId}:${input.derivativeId ?? ''}:${input.platform ?? ''}:${input.role ?? ''}`,
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
    tags: normalizeLibraryTags([
      asset.role,
      ...eventTitle.split(/[^a-zA-Z0-9áéíóúñü]+/i),
    ]),
    performers: [],
    genres: [],
    orientation: inferMediaOrientation({
      kind: asset.kind,
      role: asset.role,
      width: asset.width,
      height: asset.height,
    }),
    width: asset.width,
    height: asset.height,
    qualityRating: 3,
    rightsBasis: 'other-confirmed',
    rightsNote:
      'Permission was confirmed when this event asset was uploaded. Add source details before broad reuse.',
    credit: '',
    rightsConfirmedAt: asset.rightsConfirmedAt,
    derivatives: [],
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
  derivative?: MediaDerivative;
}): EventAsset {
  const now = new Date().toISOString();
  const derivative =
    input.derivative ??
    approvedDerivativeForPlatform({
      derivatives: input.asset.derivatives,
      platform: input.platform,
      eventId: input.eventId,
    });
  return {
    id: assignmentId({
      eventId: input.eventId,
      libraryAssetId: input.asset.id,
      derivativeId: derivative?.id,
      platform: input.platform,
      role: input.role,
    }),
    eventId: input.eventId,
    name: derivative
      ? `${input.asset.name} — ${MEDIA_DERIVATIVE_PRESET_LABELS[derivative.presetId]}`
      : input.asset.name,
    pathname: derivative?.pathname ?? input.asset.pathname,
    url: derivative?.url ?? input.asset.url,
    downloadUrl: derivative?.downloadUrl ?? input.asset.downloadUrl,
    contentType: derivative?.contentType ?? input.asset.contentType,
    size: derivative?.size ?? input.asset.size,
    kind: derivative ? 'image' : input.asset.kind,
    role: input.role ?? input.asset.role,
    platforms: input.platform ? [input.platform] : input.asset.platforms,
    status: 'approved',
    altText: input.asset.altText,
    notes: [
      input.asset.notes,
      `Reused from media library asset ${input.asset.id}.`,
      derivative
        ? `Prepared with ${MEDIA_DERIVATIVE_PRESET_LABELS[derivative.presetId]}.`
        : '',
      derivative?.overlay
        ? `Branded for event ${derivative.overlay.eventId}.`
        : '',
    ]
      .filter(Boolean)
      .join(' '),
    rightsConfirmedAt: input.asset.rightsConfirmedAt,
    uploadedAt: now,
    updatedAt: now,
    width: derivative?.width ?? input.asset.width,
    height: derivative?.height ?? input.asset.height,
    sourceLibraryAssetId: input.asset.id,
    sourceLibraryDerivativeId: derivative?.id,
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
    const catalog = await loadMediaLibraryCatalog();
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
    const catalog = await loadMediaLibraryCatalog();
    const expectedRevision = catalog.record?.revision ?? 0;
    const mutation = parsed.data;

    switch (mutation.action) {
      case 'import-event-asset': {
        const candidate = importEventAsset(
          mutation.asset as EventAsset,
          mutation.eventTitle,
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
              derivatives: existing.derivatives ?? [],
              updatedAt: new Date().toISOString(),
            }
          : candidate;
        const record = await saveMediaLibraryCatalog({
          assets: existing
            ? catalog.assets.map((item) => (item.id === asset.id ? asset : item))
            : [asset, ...catalog.assets],
          expectedRevision,
          user: authorization,
        });
        return authorizedJson({ asset, revision: record.revision });
      }

      case 'upsert': {
        const asset = MediaLibraryAssetSchema.parse({
          ...(mutation.asset as MediaLibraryAsset),
          tags: normalizeLibraryTags(mutation.asset.tags),
          updatedAt: new Date().toISOString(),
        }) as MediaLibraryAsset;
        const exists = catalog.assets.some((item) => item.id === asset.id);
        const record = await saveMediaLibraryCatalog({
          assets: exists
            ? catalog.assets.map((item) => (item.id === asset.id ? asset : item))
            : [asset, ...catalog.assets],
          expectedRevision,
          user: authorization,
        });
        return authorizedJson({ asset, revision: record.revision });
      }

      case 'save-derivative': {
        const libraryAssetId = mutation.libraryAssetId;
        const current = catalog.assets.find(
          (asset) => asset.id === libraryAssetId,
        );
        if (!current) {
          return NextResponse.json(
            { error: 'Media library asset not found.' },
            { status: 404, headers: NO_STORE_HEADERS },
          );
        }
        const preset = getMediaDerivativePreset(mutation.derivative.presetId);
        const variantKey = mutation.derivative.variantKey || 'base';
        const expectedVariantKey = mediaOverlayVariantKey(
          mutation.derivative.overlay,
        );
        if (
          mutation.derivative.sourceAssetId !== current.id ||
          mutation.derivative.width !== preset.width ||
          mutation.derivative.height !== preset.height ||
          variantKey !== expectedVariantKey
        ) {
          return NextResponse.json(
            { error: 'Derivative dimensions, source, or event variant do not match the selected preset.' },
            { status: 400, headers: NO_STORE_HEADERS },
          );
        }
        if (mutation.derivative.overlay?.logoAssetId) {
          const logo = catalog.assets.find(
            (asset) => asset.id === mutation.derivative.overlay?.logoAssetId,
          );
          if (!logo || logo.status !== 'active' || logo.kind !== 'image') {
            return NextResponse.json(
              { error: 'The selected Club Bahia logo asset is not available.' },
              { status: 400, headers: NO_STORE_HEADERS },
            );
          }
        }
        const existing = (current.derivatives ?? []).find(
          (item) =>
            item.presetId === mutation.derivative.presetId &&
            mediaDerivativeVariantKey(item) === variantKey,
        );
        const derivative: MediaDerivative = {
          ...mutation.derivative,
          variantKey,
          createdAt: existing?.createdAt ?? mutation.derivative.createdAt,
          updatedAt: new Date().toISOString(),
        };
        const asset: MediaLibraryAsset = {
          ...current,
          derivatives: [
            ...(current.derivatives ?? []).filter(
              (item) =>
                !(
                  item.presetId === derivative.presetId &&
                  mediaDerivativeVariantKey(item) === variantKey
                ),
            ),
            derivative,
          ],
          updatedAt: derivative.updatedAt,
        };
        const record = await saveMediaLibraryCatalog({
          assets: catalog.assets.map((item) =>
            item.id === asset.id ? asset : item,
          ),
          expectedRevision,
          user: authorization,
        });
        return authorizedJson({ asset, derivative, revision: record.revision });
      }

      case 'archive': {
        const libraryAssetId = mutation.libraryAssetId;
        const current = catalog.assets.find(
          (asset) => asset.id === libraryAssetId,
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
        const record = await saveMediaLibraryCatalog({
          assets: catalog.assets.map((item) =>
            item.id === asset.id ? asset : item,
          ),
          expectedRevision,
          user: authorization,
        });
        return authorizedJson({ asset, revision: record.revision });
      }

      case 'assign-to-event': {
        const libraryAssetId = mutation.libraryAssetId;
        const current = catalog.assets.find(
          (asset) => asset.id === libraryAssetId,
        );
        if (!current || current.status !== 'active') {
          return NextResponse.json(
            { error: 'This media library asset is not available for reuse.' },
            { status: 404, headers: NO_STORE_HEADERS },
          );
        }
        const explicitDerivative = mutation.derivativeId
          ? (current.derivatives ?? []).find(
              (item) =>
                item.id === mutation.derivativeId && item.status === 'approved',
            )
          : undefined;
        if (mutation.derivativeId && !explicitDerivative) {
          return NextResponse.json(
            { error: 'The selected platform version is not approved or no longer exists.' },
            { status: 400, headers: NO_STORE_HEADERS },
          );
        }
        if (
          explicitDerivative?.overlay &&
          explicitDerivative.overlay.eventId !== mutation.eventId
        ) {
          return NextResponse.json(
            { error: 'This branded graphic belongs to a different event.' },
            { status: 400, headers: NO_STORE_HEADERS },
          );
        }
        if (
          explicitDerivative &&
          (mutation.platform === 'reel' || mutation.platform === 'tiktok')
        ) {
          return NextResponse.json(
            { error: 'A static cover cannot replace the finished vertical video.' },
            { status: 400, headers: NO_STORE_HEADERS },
          );
        }
        const assignment = assignmentFromLibrary({
          asset: current,
          eventId: mutation.eventId,
          platform: mutation.platform,
          role: mutation.role,
          derivative: explicitDerivative,
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
            usage.eventId === mutation.eventId &&
            usage.platform === mutation.platform,
        );
        const usageHistory = hasUsage
          ? current.usageHistory
          : [
              ...current.usageHistory,
              {
                eventId: mutation.eventId,
                eventTitle: mutation.eventTitle,
                platform: mutation.platform,
                usedAt,
              },
            ].slice(-200);
        const asset: MediaLibraryAsset = {
          ...current,
          usageHistory,
          usageCount: usageHistory.length,
          lastUsedAt: hasUsage ? current.lastUsedAt : usedAt,
          updatedAt: usedAt,
        };
        const record = await saveMediaLibraryCatalog({
          assets: catalog.assets.map((item) =>
            item.id === asset.id ? asset : item,
          ),
          expectedRevision,
          user: authorization,
        });
        return authorizedJson({
          assignment,
          asset,
          revision: record.revision,
        });
      }
    }
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
