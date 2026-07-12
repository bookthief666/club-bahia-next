import { NextResponse } from 'next/server';
import { requireAssetAccess, setAssetSessionCookie } from '@/lib/admin/assets/server';
import { isMockAdminEnabled } from '@/lib/admin/mock-auth';
import { reservationsToCsv } from '@/lib/reservations/csv';
import {
  ReservationStatusSchema,
  type StoredReservation,
} from '@/lib/reservations/domain';
import {
  isReservationStorageConfigured,
  listStoredReservations,
} from '@/lib/reservations/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' };

function unauthorized(message: string) {
  return NextResponse.json(
    { error: message },
    { status: 401, headers: NO_STORE_HEADERS },
  );
}

function filterReservations(
  reservations: StoredReservation[],
  request: Request,
): StoredReservation[] {
  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const event = url.searchParams.get('event')?.trim().toLowerCase() ?? '';
  const from = url.searchParams.get('from') ?? '';
  const to = url.searchParams.get('to') ?? '';
  const parsedStatus = status ? ReservationStatusSchema.safeParse(status) : null;

  return reservations.filter((reservation) => {
    if (parsedStatus?.success && reservation.status !== parsedStatus.data) {
      return false;
    }
    if (
      event &&
      !reservation.eventTitle.toLowerCase().includes(event) &&
      !reservation.eventSlug.toLowerCase().includes(event)
    ) {
      return false;
    }
    if (from && reservation.date < from) return false;
    if (to && reservation.date > to) return false;
    return true;
  });
}

export async function GET(request: Request) {
  if (!isMockAdminEnabled) {
    return unauthorized('Reservation administration is disabled in this environment.');
  }

  try {
    requireAssetAccess(request);
  } catch (error) {
    return unauthorized(error instanceof Error ? error.message : 'Unauthorized.');
  }

  if (!isReservationStorageConfigured()) {
    return NextResponse.json(
      { error: 'Reservation storage is not configured.' },
      { status: 503, headers: NO_STORE_HEADERS },
    );
  }

  try {
    const reservations = filterReservations(
      await listStoredReservations(),
      request,
    );
    const csv = reservationsToCsv(reservations);
    const date = new Date().toISOString().slice(0, 10);
    const response = new NextResponse(csv, {
      status: 200,
      headers: {
        ...NO_STORE_HEADERS,
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="club-bahia-reservations-${date}.csv"`,
        'X-Content-Type-Options': 'nosniff',
      },
    });
    setAssetSessionCookie(response);
    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Could not export reservation requests.',
      },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}
