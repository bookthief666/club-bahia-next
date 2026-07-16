import type { StoredReservation } from '@/lib/reservations/domain';

export type ReservationMessageKind =
  | 'received'
  | 'confirmed'
  | 'waitlist'
  | 'change-request';

function readableDate(value: string): string {
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function eventPhrase(reservation: StoredReservation): string {
  return reservation.eventTitle ? ` for ${reservation.eventTitle}` : '';
}

export function reservationMessage(
  reservation: StoredReservation,
  kind: ReservationMessageKind,
): string {
  const firstName = reservation.firstName;
  const date = readableDate(reservation.date);
  const event = eventPhrase(reservation);
  const party = `${reservation.guests} guest${reservation.guests === 1 ? '' : 's'}`;

  if (kind === 'confirmed') {
    return `Hi ${firstName}, your Club Bahia reservation request${event} on ${date} for ${party} is confirmed. Please bring valid 21+ identification and let us know if your party size changes. We look forward to seeing you.`;
  }

  if (kind === 'waitlist') {
    return `Hi ${firstName}, thank you for your Club Bahia reservation request${event} on ${date} for ${party}. We do not have a confirmed table available yet, but we have added your request to the waitlist and will contact you if availability opens.`;
  }

  if (kind === 'change-request') {
    return `Hi ${firstName}, this is Club Bahia regarding your reservation request${event} on ${date} for ${party}. We need a little more information before we can confirm it. Please reply with your preferred arrival time and any changes to your party size.`;
  }

  return `Hi ${firstName}, this is Club Bahia. We received your reservation request${event} on ${date} for ${party}. Our team is reviewing availability and will follow up shortly. This message is not yet a final table confirmation.`;
}

export function reservationEmailSubject(
  reservation: StoredReservation,
  kind: ReservationMessageKind,
): string {
  const event = reservation.eventTitle || 'Club Bahia reservation';
  if (kind === 'confirmed') return `Confirmed: ${event}`;
  if (kind === 'waitlist') return `Waitlist update: ${event}`;
  if (kind === 'change-request') return `More information needed: ${event}`;
  return `We received your Club Bahia reservation request`;
}
