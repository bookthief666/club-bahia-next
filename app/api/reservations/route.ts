import { NextResponse } from 'next/server';
import {
  ReservationSubmissionSchema,
  type ReservationReceipt,
} from '@/lib/reservations/domain';
import {
  createStoredReservation,
  isReservationStorageConfigured,
} from '@/lib/reservations/server';
import { getPublicEventCard } from '@/lib/public-events/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' };

function losAngelesDate(value: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value));
}

function isFridayOrSaturday(value: string): boolean {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const weekday = date.getUTCDay();
  return weekday === 5 || weekday === 6;
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > 24_000) {
    return NextResponse.json(
      { error: 'Reservation request is too large.' },
      { status: 413, headers: NO_STORE_HEADERS },
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Reservation request must be valid JSON.' },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const parsed = ReservationSubmissionSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Please review the reservation details and try again.',
        details: parsed.error.flatten(),
      },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const submission = parsed.data;

  // Quietly accept honeypot submissions without storing guest data.
  if (submission.website) {
    const receipt: ReservationReceipt = {
      id: `CB-${Date.now().toString(36).toUpperCase()}`,
      receivedAt: new Date().toISOString(),
      eventTitle: submission.eventTitle || undefined,
      date: submission.date,
      guests: submission.guests,
    };
    return NextResponse.json(
      { receipt },
      { status: 201, headers: NO_STORE_HEADERS },
    );
  }

  const today = losAngelesDate(new Date().toISOString());
  if (submission.date < today) {
    return NextResponse.json(
      { error: 'Choose a current or future reservation date.' },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  let canonicalEventTitle = submission.eventTitle;
  let canonicalEventId = submission.eventId;

  if (submission.eventSlug) {
    const includePreview = process.env.VERCEL_ENV === 'preview';
    const event = await getPublicEventCard(submission.eventSlug, { includePreview });
    if (!event) {
      return NextResponse.json(
        { error: 'This event is no longer available for online requests.' },
        { status: 400, headers: NO_STORE_HEADERS },
      );
    }

    if (event.startsAt) {
      const eventDate = losAngelesDate(event.startsAt);
      if (submission.date !== eventDate) {
        return NextResponse.json(
          { error: `This event reservation is available for ${event.dateLabel}.` },
          { status: 400, headers: NO_STORE_HEADERS },
        );
      }
    } else if (!isFridayOrSaturday(submission.date)) {
      return NextResponse.json(
        {
          error:
            'This recurring reservation option is currently available for Friday and Saturday nights.',
        },
        { status: 400, headers: NO_STORE_HEADERS },
      );
    }

    canonicalEventTitle = event.title;
    canonicalEventId = event.id;
  } else if (!isFridayOrSaturday(submission.date)) {
    return NextResponse.json(
      {
        error:
          'General table reservations are currently available for Friday and Saturday nights. Choose an event listing for other dates.',
      },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  if (!isReservationStorageConfigured()) {
    return NextResponse.json(
      {
        error:
          'Online reservation requests are temporarily unavailable. Please call Club Bahia at (213) 250-4313.',
        code: 'RESERVATION_STORAGE_NOT_CONFIGURED',
      },
      { status: 503, headers: NO_STORE_HEADERS },
    );
  }

  try {
    const reservation = await createStoredReservation({
      ...submission,
      eventTitle: canonicalEventTitle,
      eventId: canonicalEventId,
    });
    const receipt: ReservationReceipt = {
      id: reservation.id,
      receivedAt: reservation.createdAt,
      eventTitle: reservation.eventTitle || undefined,
      date: reservation.date,
      guests: reservation.guests,
    };

    return NextResponse.json(
      { receipt },
      { status: 201, headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'The reservation request could not be saved.',
      },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}
