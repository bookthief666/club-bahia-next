import { reservationAttributionLabel } from '@/lib/attribution/domain';
import type { StoredReservation } from '@/lib/reservations/domain';

function safeCsvValue(value: unknown): string {
  let text = value == null ? '' : String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export function reservationsToCsv(reservations: StoredReservation[]): string {
  const headers = [
    'Request ID',
    'Received At',
    'Status',
    'Event',
    'Reservation Date',
    'Guests',
    'First Name',
    'Last Name',
    'Phone',
    'Email',
    'Occasion',
    'Guest Note',
    'Staff Note',
    'Campaign Source',
    'UTM Source',
    'UTM Medium',
    'UTM Campaign',
    'UTM Content',
    'Referrer',
    'Landing Page',
    'Contacted At',
    'Follow Up At',
    'Confirmed At',
    'Cancelled At',
  ];

  const rows = reservations.map((reservation) => [
    reservation.id,
    reservation.createdAt,
    reservation.status,
    reservation.eventTitle || 'General reservation',
    reservation.date,
    reservation.guests,
    reservation.firstName,
    reservation.lastName,
    reservation.phone,
    reservation.email,
    reservation.occasion,
    reservation.note,
    reservation.staffNote,
    reservationAttributionLabel(reservation.attribution),
    reservation.attribution.source,
    reservation.attribution.medium,
    reservation.attribution.campaign,
    reservation.attribution.content,
    reservation.attribution.referrer,
    reservation.attribution.landingPage,
    reservation.contactedAt,
    reservation.followUpAt,
    reservation.confirmedAt,
    reservation.cancelledAt,
  ]);

  return [headers, ...rows]
    .map((row) => row.map(safeCsvValue).join(','))
    .join('\r\n');
}
