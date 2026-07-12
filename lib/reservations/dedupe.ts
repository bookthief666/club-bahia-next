import type {
  ReservationSubmission,
  StoredReservation,
} from '@/lib/reservations/domain';

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function normalizePhone(value: string): string {
  return value.replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '');
}

export function findRecentDuplicateReservation(
  reservations: StoredReservation[],
  submission: ReservationSubmission,
  now = new Date(),
  windowMinutes = 15,
): StoredReservation | undefined {
  const threshold = now.getTime() - windowMinutes * 60_000;
  const email = normalizeEmail(submission.email);
  const phone = normalizePhone(submission.phone);

  return reservations.find((reservation) => {
    if (new Date(reservation.createdAt).getTime() < threshold) return false;
    if (reservation.date !== submission.date) return false;

    const sameEvent = submission.eventSlug
      ? reservation.eventSlug === submission.eventSlug
      : !reservation.eventSlug;
    if (!sameEvent) return false;

    return (
      normalizeEmail(reservation.email) === email &&
      normalizePhone(reservation.phone) === phone
    );
  });
}
