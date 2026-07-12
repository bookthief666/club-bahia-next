import { NextResponse } from 'next/server';
import { requireAssetAccess, setAssetSessionCookie } from '@/lib/admin/assets/server';
import { isMockAdminEnabled } from '@/lib/admin/mock-auth';
import {
  PublicEventSnapshotSchema,
  type PublicEventVisibility,
} from '@/lib/public-events/domain';
import {
  deletePublicEventSnapshot,
  listPublicEventSnapshots,
  savePublicEventSnapshot,
} from '@/lib/public-events/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' };

function authorizedJson(body: unknown, status = 200) {
  const response = NextResponse.json(body, {
    status,
    headers: NO_STORE_HEADERS,
  });
  setAssetSessionCookie(response);
  return response;
}

function authorize(request: Request): NextResponse | null {
  if (!isMockAdminEnabled) {
    return NextResponse.json(
      { error: 'Website publishing is disabled in this environment.' },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }

  try {
    requireAssetAccess(request);
    return null;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unauthorized.' },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }
}

export async function GET(request: Request) {
  const unauthorized = authorize(request);
  if (unauthorized) return unauthorized;

  const requested = new URL(request.url).searchParams.get('visibility');
  const visibility: PublicEventVisibility =
    requested === 'preview' ? 'preview' : 'public';

  try {
    const events = await listPublicEventSnapshots(visibility);
    return authorizedJson({ events });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Could not load website events.',
      },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}

export async function POST(request: Request) {
  const unauthorized = authorize(request);
  if (unauthorized) return unauthorized;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Website event data must be valid JSON.' },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const parsed = PublicEventSnapshotSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Website event data failed validation.',
        details: parsed.error.flatten(),
      },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  if (
    parsed.data.visibility === 'public' &&
    process.env.PUBLIC_EVENT_PUBLISH_ENABLED !== 'true'
  ) {
    return NextResponse.json(
      {
        error:
          'Live website publishing is disabled. Set PUBLIC_EVENT_PUBLISH_ENABLED=true after review.',
      },
      { status: 403, headers: NO_STORE_HEADERS },
    );
  }

  try {
    const event = await savePublicEventSnapshot(parsed.data);
    return authorizedJson({ event }, 201);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Could not publish the website event.',
      },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}

export async function DELETE(request: Request) {
  const unauthorized = authorize(request);
  if (unauthorized) return unauthorized;

  let slug = '';
  try {
    const body = (await request.json()) as { slug?: unknown };
    slug = typeof body.slug === 'string' ? body.slug.trim() : '';
  } catch {
    return NextResponse.json(
      { error: 'A valid event slug is required.' },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return NextResponse.json(
      { error: 'A valid event slug is required.' },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  try {
    await deletePublicEventSnapshot(slug);
    return authorizedJson({ deleted: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Could not remove the website event.',
      },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}
