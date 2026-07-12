import {
  reservationAttributionLabel,
  type ReservationAttribution,
} from '@/lib/attribution/domain';
import type { StoredReservation } from '@/lib/reservations/domain';

export interface ReservationBreakdownItem {
  label: string;
  requests: number;
  guests: number;
  confirmedRequests: number;
  confirmedGuests: number;
}

export interface ReservationAnalytics {
  totalRequests: number;
  activeRequests: number;
  newRequests: number;
  confirmedRequests: number;
  requestedGuests: number;
  confirmedGuests: number;
  confirmationRate: number;
  requestsToday: number;
  requestsThisWeek: number;
  topSources: ReservationBreakdownItem[];
  topEvents: ReservationBreakdownItem[];
}

function startOfLosAngelesDay(now: Date): Date {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return new Date(`${values.year}-${values.month}-${values.day}T00:00:00-07:00`);
}

function startOfLosAngelesWeek(now: Date): Date {
  const start = startOfLosAngelesDay(now);
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    weekday: 'short',
  }).format(now);
  const offset = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(weekday);
  start.setUTCDate(start.getUTCDate() - Math.max(0, offset));
  return start;
}

function buildBreakdown(
  reservations: StoredReservation[],
  labelFor: (reservation: StoredReservation) => string,
): ReservationBreakdownItem[] {
  const map = new Map<string, ReservationBreakdownItem>();
  for (const reservation of reservations) {
    const label = labelFor(reservation) || 'Unknown';
    const current = map.get(label) ?? {
      label,
      requests: 0,
      guests: 0,
      confirmedRequests: 0,
      confirmedGuests: 0,
    };
    current.requests += 1;
    current.guests += reservation.guests;
    if (reservation.status === 'confirmed' || reservation.status === 'completed') {
      current.confirmedRequests += 1;
      current.confirmedGuests += reservation.guests;
    }
    map.set(label, current);
  }
  return [...map.values()]
    .sort((left, right) => right.requests - left.requests || right.guests - left.guests)
    .slice(0, 6);
}

export function sourceLabel(attribution: ReservationAttribution): string {
  const source = reservationAttributionLabel(attribution);
  const content = attribution.content ? ` · ${attribution.content}` : '';
  return `${source}${content}`;
}

export function buildReservationAnalytics(
  reservations: StoredReservation[],
  now = new Date(),
): ReservationAnalytics {
  const confirmed = reservations.filter((reservation) =>
    ['confirmed', 'completed'].includes(reservation.status),
  );
  const active = reservations.filter(
    (reservation) => !['cancelled', 'completed'].includes(reservation.status),
  );
  const dayStart = startOfLosAngelesDay(now).getTime();
  const weekStart = startOfLosAngelesWeek(now).getTime();

  return {
    totalRequests: reservations.length,
    activeRequests: active.length,
    newRequests: reservations.filter((reservation) => reservation.status === 'new').length,
    confirmedRequests: confirmed.length,
    requestedGuests: reservations.reduce(
      (sum, reservation) => sum + reservation.guests,
      0,
    ),
    confirmedGuests: confirmed.reduce(
      (sum, reservation) => sum + reservation.guests,
      0,
    ),
    confirmationRate: reservations.length
      ? Math.round((confirmed.length / reservations.length) * 100)
      : 0,
    requestsToday: reservations.filter(
      (reservation) => new Date(reservation.createdAt).getTime() >= dayStart,
    ).length,
    requestsThisWeek: reservations.filter(
      (reservation) => new Date(reservation.createdAt).getTime() >= weekStart,
    ).length,
    topSources: buildBreakdown(reservations, (reservation) =>
      sourceLabel(reservation.attribution),
    ),
    topEvents: buildBreakdown(
      reservations,
      (reservation) => reservation.eventTitle || 'General reservation',
    ),
  };
}
