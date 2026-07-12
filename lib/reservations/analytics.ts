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

function losAngelesDateKey(value: string | Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(typeof value === 'string' ? new Date(value) : value);
}

function startOfLosAngelesWeekKey(now: Date): string {
  const todayKey = losAngelesDateKey(now);
  const [year, month, day] = todayKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() - date.getUTCDay());
  return date.toISOString().slice(0, 10);
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
  const todayKey = losAngelesDateKey(now);
  const weekStartKey = startOfLosAngelesWeekKey(now);

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
      (reservation) => losAngelesDateKey(reservation.createdAt) === todayKey,
    ).length,
    requestsThisWeek: reservations.filter((reservation) => {
      const key = losAngelesDateKey(reservation.createdAt);
      return key >= weekStartKey && key <= todayKey;
    }).length,
    topSources: buildBreakdown(reservations, (reservation) =>
      sourceLabel(reservation.attribution),
    ),
    topEvents: buildBreakdown(
      reservations,
      (reservation) => reservation.eventTitle || 'General reservation',
    ),
  };
}
