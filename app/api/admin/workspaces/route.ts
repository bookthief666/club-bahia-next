import { NextResponse } from 'next/server';
import { requireAdminRequest } from '@/lib/admin/auth/session';
import { isClientAdminWorkspaceKind } from '@/lib/admin/workspaces/client-kinds';
import {
  AdminWorkspaceConflictError,
  parseAdminWorkspaceKey,
} from '@/lib/admin/workspaces/domain';
import {
  getAdminWorkspaceRecord,
  isAdminWorkspaceStorageConfigured,
  saveAdminWorkspaceRecord,
} from '@/lib/admin/workspaces/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' };

function unauthorized(error: unknown): NextResponse {
  return NextResponse.json(
    { error: error instanceof Error ? error.message : 'Unauthorized.' },
    { status: 401, headers: NO_STORE_HEADERS },
  );
}

function unavailable(): NextResponse {
  return NextResponse.json(
    {
      error:
        'Shared Growth OS storage is not configured. Add BLOB_READ_WRITE_TOKEN and a 32-character Growth OS encryption secret.',
      code: 'WORKSPACE_STORAGE_NOT_CONFIGURED',
    },
    { status: 503, headers: NO_STORE_HEADERS },
  );
}

function parseIdentity(kindValue: unknown, keyValue: unknown) {
  const kind = isClientAdminWorkspaceKind(kindValue) ? kindValue : null;
  const key = parseAdminWorkspaceKey(keyValue);
  return kind && key ? { kind, key } : null;
}

export async function GET(request: Request) {
  try {
    requireAdminRequest(request);
  } catch (error) {
    return unauthorized(error);
  }

  if (!isAdminWorkspaceStorageConfigured()) return unavailable();

  const url = new URL(request.url);
  const identity = parseIdentity(
    url.searchParams.get('kind'),
    url.searchParams.get('key'),
  );
  if (!identity) {
    return NextResponse.json(
      { error: 'A valid browser workspace kind and key are required.' },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  try {
    const record = await getAdminWorkspaceRecord(identity.kind, identity.key);
    return NextResponse.json(
      { record },
      { status: 200, headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Could not load the shared Growth OS workspace.',
      },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}

export async function PUT(request: Request) {
  let user: ReturnType<typeof requireAdminRequest>;
  try {
    user = requireAdminRequest(request);
  } catch (error) {
    return unauthorized(error);
  }

  if (!isAdminWorkspaceStorageConfigured()) return unavailable();

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Workspace update must be valid JSON.' },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const input = raw as {
    kind?: unknown;
    key?: unknown;
    value?: unknown;
    expectedRevision?: unknown;
  };
  const identity = parseIdentity(input.kind, input.key);
  const expectedRevision = input.expectedRevision;
  if (
    !identity ||
    !Number.isSafeInteger(expectedRevision) ||
    Number(expectedRevision) < 0 ||
    !('value' in input)
  ) {
    return NextResponse.json(
      {
        error:
          'Workspace updates require a valid browser kind, key, value, and non-negative expected revision.',
      },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  try {
    const record = await saveAdminWorkspaceRecord({
      ...identity,
      value: input.value,
      expectedRevision: Number(expectedRevision),
      user,
    });
    return NextResponse.json(
      { record },
      { status: 200, headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    if (error instanceof AdminWorkspaceConflictError) {
      return NextResponse.json(
        {
          error:
            'This workspace was updated in another browser. Reload before saving again.',
          code: error.code,
          currentRevision: error.currentRevision,
        },
        { status: 409, headers: NO_STORE_HEADERS },
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Could not save the shared Growth OS workspace.',
      },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}
