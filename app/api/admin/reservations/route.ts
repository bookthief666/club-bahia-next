import { NextResponse } from 'next/server';
import { requireAssetAccess, setAssetSessionCookie } from '@/lib/admin/assets/server';
import { isMockAdminEnabled } from '@/lib/admin/mock-auth';
import { ReservationStatusUpdateSchema } from '@/lib/reservations/domain';
import {
  isReservationStorageConfigured,
  listStoredReservations,
  updateStoredReservation,
} from '@/lib/reservations/server';

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
      { error: 'Reservation administration is disabled in this environment.' },
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

  if (!isReservationStorageConfigured()) {
    return NextResponse.json(
      {
        error:
          'Reservation storage is not configured. Add RESERVATION_DATA_SECRET and BLOB_READ_WRITE_TOKEN.',
      },
      { status: 503, headers: NO_STORE_HEADERS },
    );
  }

  try {
    const reservations = await listStoredReservations();
    return authorizedJson({ reservations });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Could not load reservation requests.',
      },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}

export async function PATCH(request: Request) {
  const unauthorized = authorize(request);
  if (unauthorized) return unauthorized;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Reservation update must be valid JSON.' },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const parsed = ReservationStatusUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Reservation update failed validation.' },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  try {
    const reservation = await updateStoredReservation(parsed.data);
    return authorizedJson({ reservation });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Could not update the reservation request.',
      },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}
