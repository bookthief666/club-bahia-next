import { del, list, put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import type { EventAsset } from '@/lib/admin/assets/domain';
import {
  eventAssetMetadataPath,
  eventAssetPrefix,
  setAssetSessionCookie,
} from '@/lib/admin/assets/server';
import {
  EventAssetDeleteSchema,
  EventAssetSchema,
} from '@/lib/admin/assets/validation';
import { requireAdminResourceAccess } from '@/lib/admin/auth/resource-access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' };

function unauthorized(error?: unknown) {
  return NextResponse.json(
    {
      error:
        error instanceof Error
          ? error.message
          : 'Event media access is not authorized.',
    },
    { status: 401, headers: NO_STORE_HEADERS },
  );
}

function authorize(request: Request): NextResponse | null {
  try {
    requireAdminResourceAccess(request);
    return null;
  } catch (error) {
    return unauthorized(error);
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

async function listAllMetadata(eventId: string): Promise<EventAsset[]> {
  const prefix = eventAssetPrefix(eventId);
  const metadataBlobs: Array<{ url: string }> = [];
  let cursor: string | undefined;

  do {
    const result = await list({ prefix, limit: 1000, cursor });
    metadataBlobs.push(
      ...result.blobs
        .filter((blob) => blob.pathname.endsWith('/metadata.json'))
        .map((blob) => ({ url: blob.url })),
    );
    cursor = result.hasMore ? result.cursor : undefined;
  } while (cursor && metadataBlobs.length < 500);

  const assets: Array<EventAsset | null> = await Promise.all(
    metadataBlobs.map(async ({ url }): Promise<EventAsset | null> => {
      try {
        const response = await fetch(`${url}?v=${Date.now()}`, {
          cache: 'no-store',
        });
        if (!response.ok) return null;
        const parsed = EventAssetSchema.safeParse(await response.json());
        return parsed.success ? (parsed.data as EventAsset) : null;
      } catch {
        return null;
      }
    }),
  );

  const validAssets = assets.filter(
    (asset): asset is EventAsset => asset !== null,
  );

  return validAssets.sort(
    (left, right) =>
      new Date(right.uploadedAt).getTime() - new Date(left.uploadedAt).getTime(),
  );
}

export async function GET(request: Request) {
  const unauthorizedResponse = authorize(request);
  if (unauthorizedResponse) return unauthorizedResponse;

  const eventId = new URL(request.url).searchParams.get('eventId')?.trim() ?? '';
  if (!/^[a-zA-Z0-9_-]{1,160}$/.test(eventId)) {
    return NextResponse.json(
      { error: 'A valid eventId is required.' },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  try {
    const assets = await listAllMetadata(eventId);
    return authorizedJson({ assets });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not load event media.' },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}

export async function POST(request: Request) {
  const unauthorizedResponse = authorize(request);
  if (unauthorizedResponse) return unauthorizedResponse;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Asset metadata must be valid JSON.' },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const parsed = EventAssetSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Asset metadata failed validation.', details: parsed.error.flatten() },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  try {
    const metadataPath = eventAssetMetadataPath(parsed.data.eventId, parsed.data.id);
    const metadataBlob = await put(metadataPath, JSON.stringify(parsed.data), {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
      cacheControlMaxAge: 60,
    });

    return authorizedJson({ asset: parsed.data, metadataUrl: metadataBlob.url });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not save asset metadata.' },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}

export async function DELETE(request: Request) {
  const unauthorizedResponse = authorize(request);
  if (unauthorizedResponse) return unauthorizedResponse;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Delete request must be valid JSON.' },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const parsed = EventAssetDeleteSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Delete request failed validation.' },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  try {
    const metadataPath = eventAssetMetadataPath(
      parsed.data.eventId,
      parsed.data.assetId,
    );
    const metadataList = await list({ prefix: metadataPath, limit: 10 });
    const metadataUrl = metadataList.blobs.find(
      (blob) => blob.pathname === metadataPath,
    )?.url;

    await del([parsed.data.fileUrl, ...(metadataUrl ? [metadataUrl] : [])]);
    return authorizedJson({ deleted: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not delete event media.' },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}
