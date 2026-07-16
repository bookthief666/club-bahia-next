import { NextResponse } from 'next/server';
import { requireAdminResourceAccess } from '@/lib/admin/auth/resource-access';
import { getPublishingQueue } from '@/lib/admin/autopilot/server/queue-store';
import { buildEventPromotionResults } from '@/lib/admin/results/domain';
import {
  isReservationStorageConfigured,
  listStoredReservations,
} from '@/lib/reservations/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' };

function response(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE_HEADERS });
}

export async function GET(request: Request) {
  try {
    requireAdminResourceAccess(request);
  } catch (error) {
    return response(
      { error: error instanceof Error ? error.message : 'Unauthorized.' },
      401,
    );
  }

  const url = new URL(request.url);
  const eventId = url.searchParams.get('eventId')?.trim() ?? '';
  const eventTitle = url.searchParams.get('eventTitle')?.trim() ?? '';

  if (!/^[a-zA-Z0-9_-]{1,160}$/.test(eventId)) {
    return response({ error: 'A valid event ID is required.' }, 400);
  }
  if (eventTitle.length > 180) {
    return response({ error: 'Event title is too long.' }, 400);
  }

  try {
    const [reservations, queue] = await Promise.all([
      listStoredReservations(),
      getPublishingQueue(),
    ]);
    return response({
      configured: isReservationStorageConfigured(),
      results: buildEventPromotionResults({
        eventId,
        eventTitle,
        reservations,
        jobs: queue.queue.jobs,
      }),
    });
  } catch (error) {
    return response(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Could not load event promotion results.',
      },
      500,
    );
  }
}
