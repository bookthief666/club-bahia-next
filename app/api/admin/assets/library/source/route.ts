import { NextResponse } from 'next/server';
import { requireAdminResourceAccess } from '@/lib/admin/auth/resource-access';
import { loadMediaLibraryCatalog } from '@/lib/admin/assets/library-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = { 'Cache-Control': 'private, no-store, max-age=0' };

export async function GET(request: Request): Promise<Response> {
  try {
    requireAdminResourceAccess(request);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unauthorized.' },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }

  const assetId = new URL(request.url).searchParams.get('assetId')?.trim() ?? '';
  if (!/^[a-zA-Z0-9_-]{1,160}$/.test(assetId)) {
    return NextResponse.json(
      { error: 'A valid media library asset ID is required.' },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  try {
    const catalog = await loadMediaLibraryCatalog();
    const asset = catalog.assets.find((item) => item.id === assetId);
    if (!asset || asset.status !== 'active') {
      return NextResponse.json(
        { error: 'Media library asset not found.' },
        { status: 404, headers: NO_STORE_HEADERS },
      );
    }
    if (asset.kind !== 'image' && asset.kind !== 'video') {
      return NextResponse.json(
        { error: 'Only image and video assets can create platform versions.' },
        { status: 400, headers: NO_STORE_HEADERS },
      );
    }

    const upstream = await fetch(asset.url, { cache: 'no-store' });
    if (!upstream.ok || !upstream.body) {
      throw new Error(`Source media returned status ${upstream.status}.`);
    }
    const headers = new Headers(NO_STORE_HEADERS);
    headers.set(
      'Content-Type',
      upstream.headers.get('content-type') || asset.contentType,
    );
    const length = upstream.headers.get('content-length');
    if (length) headers.set('Content-Length', length);
    headers.set('X-Content-Type-Options', 'nosniff');
    return new Response(upstream.body, { status: 200, headers });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Could not load the source media.',
      },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}
