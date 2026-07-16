import {
  addDays,
  getVenueToday,
  localDateToVenueDate,
  type LocalDate,
} from '@/lib/admin/date';
import type {
  ReservationStatus,
  StoredReservation,
} from '@/lib/reservations/domain';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const FIRST_REPLY_OVERDUE_MINUTES = 60;
const EVENT_DECISION_WINDOW_DAYS = 2;
const CONFIRMED_UPCOMING_WINDOW_DAYS = 7;

export type ReservationFollowUpLane =
  | 'needs-reply'
  | 'follow-up-due'
  | 'event-near'
  | 'scheduled'
  | 'confirmed-upcoming'
  | 'active'
  | 'closed';

export type ReservationFollowUpView =
  | 'action-needed'
  | ReservationFollowUpLane
  | 'all-active';

export type ReservationFollowUpPriority = 'urgent' | 'high' | 'normal' | 'low';
export type ReservationFollowUpPreset = 'two-hours' | 'tomorrow' | 'day-before-event';

export interface ReservationFollowUpState {
  lane: ReservationFollowUpLane;
  priority: ReservationFollowUpPriority;
  label: string;
  detail: string;
  daysUntilEvent: number;
  actionAt?: string;
  overdue: boolean;
}

export interface ReservationFollowUpSummary {
  total: number;
  actionNeeded: number;
  needsReply: number;
  followUpDue: number;
  eventNear: number;
  scheduled: number;
  confirmedUpcoming: number;
  active: number;
  closed: number;
}

export const RESERVATION_FOLLOW_UP_LANE_LABELS: Record<
  ReservationFollowUpLane,
  string
> = {
  'needs-reply': 'Needs first reply',
  'follow-up-due': 'Follow-up due',
  'event-near': 'Event decision needed',
  scheduled: 'Reminder scheduled',
  'confirmed-upcoming': 'Confirmed upcoming',
  active: 'Active',
  closed: 'Closed',
};

export const RESERVATION_FOLLOW_UP_VIEW_LABELS: Record<
  ReservationFollowUpView,
  string
> = {
  'action-needed': 'Action needed',
  'needs-reply': 'Needs first reply',
  'follow-up-due': 'Follow-up due',
  'event-near': 'Event approaching',
  scheduled: 'Scheduled reminders',
  'confirmed-upcoming': 'Confirmed upcoming',
  active: 'Other active',
  closed: 'Closed',
  'all-active': 'All active',
};

function validTimestamp(value?: string): number | undefined {
  if (!value) return undefined;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? undefined : parsed;
}

function localDateOrdinal(value: string): number {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return Number.NaN;
  return Date.UTC(year, month - 1, day);
}

export function daysUntilReservation(
  reservation: Pick<StoredReservation, 'date'>,
  now = new Date(),
): number {
  const today = localDateOrdinal(getVenueToday(now));
  const eventDate = localDateOrdinal(reservation.date);
  if (Number.isNaN(today) || Number.isNaN(eventDate)) return 9999;
  return Math.round((eventDate - today) / DAY_MS);
}

function newRequestDetail(
  ageMinutes: number,
  daysUntilEvent: number,
): string {
  if (daysUntilEvent < 0) {
    return 'The requested reservation date has passed and this request still has no recorded response.';
  }
  if (daysUntilEvent === 0) {
    return 'The guest requested tonight and still needs a first response.';
  }
  if (daysUntilEvent === 1) {
    return 'The guest requested tomorrow and still needs a first response.';
  }
  if (ageMinutes >= FIRST_REPLY_OVERDUE_MINUTES) {
    const hours = Math.max(1, Math.floor(ageMinutes / 60));
    return `The request has waited about ${hours} hour${hours === 1 ? '' : 's'} for a first response.`;
  }
  return 'A new website request is waiting for acknowledgment and a venue decision.';
}

function eventNearDetail(daysUntilEvent: number): string {
  if (daysUntilEvent < 0) {
    return 'The reservation date has passed. Record the final outcome and close the request.';
  }
  if (daysUntilEvent === 0) {
    return 'The reservation is for tonight and still needs a final decision.';
  }
  if (daysUntilEvent === 1) {
    return 'The reservation is for tomorrow and still needs a final decision.';
  }
  return 'The reservation is within two days and still needs a final decision.';
}

export function classifyReservationFollowUp(
  reservation: StoredReservation,
  now = new Date(),
): ReservationFollowUpState {
  const nowMs = now.getTime();
  const daysUntilEvent = daysUntilReservation(reservation, now);
  const createdAt = validTimestamp(reservation.createdAt) ?? nowMs;
  const followUpAt = validTimestamp(reservation.followUpAt);
  const terminal = ['cancelled', 'completed'].includes(reservation.status);

  if (terminal) {
    return {
      lane: 'closed',
      priority: 'low',
      label: RESERVATION_FOLLOW_UP_LANE_LABELS.closed,
      detail: 'This request has a recorded final outcome.',
      daysUntilEvent,
      actionAt: reservation.updatedAt,
      overdue: false,
    };
  }

  if (reservation.status === 'new') {
    const ageMinutes = Math.max(0, Math.floor((nowMs - createdAt) / 60_000));
    const overdue =
      ageMinutes >= FIRST_REPLY_OVERDUE_MINUTES || daysUntilEvent <= 1;
    return {
      lane: 'needs-reply',
      priority: overdue ? 'urgent' : 'high',
      label: RESERVATION_FOLLOW_UP_LANE_LABELS['needs-reply'],
      detail: newRequestDetail(ageMinutes, daysUntilEvent),
      daysUntilEvent,
      actionAt: reservation.createdAt,
      overdue,
    };
  }

  if (followUpAt !== undefined && followUpAt <= nowMs) {
    const overdueHours = Math.max(0, Math.floor((nowMs - followUpAt) / HOUR_MS));
    return {
      lane: 'follow-up-due',
      priority:
        daysUntilEvent <= 1 || overdueHours >= 4 ? 'urgent' : 'high',
      label: RESERVATION_FOLLOW_UP_LANE_LABELS['follow-up-due'],
      detail:
        overdueHours > 0
          ? `The saved follow-up reminder is about ${overdueHours} hour${overdueHours === 1 ? '' : 's'} overdue.`
          : 'The saved follow-up reminder is due now.',
      daysUntilEvent,
      actionAt: reservation.followUpAt,
      overdue: true,
    };
  }

  if (
    daysUntilEvent < 0 ||
    (['contacted', 'waitlist'].includes(reservation.status) &&
      daysUntilEvent <= EVENT_DECISION_WINDOW_DAYS)
  ) {
    return {
      lane: 'event-near',
      priority: daysUntilEvent <= 0 ? 'urgent' : 'high',
      label: RESERVATION_FOLLOW_UP_LANE_LABELS['event-near'],
      detail: eventNearDetail(daysUntilEvent),
      daysUntilEvent,
      actionAt: localDateToVenueDate(reservation.date, 12).toISOString(),
      overdue: daysUntilEvent <= 0,
    };
  }

  if (followUpAt !== undefined) {
    return {
      lane: 'scheduled',
      priority: 'normal',
      label: RESERVATION_FOLLOW_UP_LANE_LABELS.scheduled,
      detail: 'A future follow-up reminder is saved for this request.',
      daysUntilEvent,
      actionAt: reservation.followUpAt,
      overdue: false,
    };
  }

  if (
    reservation.status === 'confirmed' &&
    daysUntilEvent >= 0 &&
    daysUntilEvent <= CONFIRMED_UPCOMING_WINDOW_DAYS
  ) {
    return {
      lane: 'confirmed-upcoming',
      priority: 'low',
      label: RESERVATION_FOLLOW_UP_LANE_LABELS['confirmed-upcoming'],
      detail:
        daysUntilEvent === 0
          ? 'This confirmed party is expected tonight.'
          : `This confirmed party is expected in ${daysUntilEvent} day${daysUntilEvent === 1 ? '' : 's'}.`,
      daysUntilEvent,
      actionAt: localDateToVenueDate(reservation.date, 12).toISOString(),
      overdue: false,
    };
  }

  return {
    lane: 'active',
    priority: 'normal',
    label: RESERVATION_FOLLOW_UP_LANE_LABELS.active,
    detail: 'The request remains active but has no immediate reminder or deadline.',
    daysUntilEvent,
    actionAt: reservation.updatedAt,
    overdue: false,
  };
}

const PRIORITY_ORDER: Record<ReservationFollowUpPriority, number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
};

const LANE_ORDER: Record<ReservationFollowUpLane, number> = {
  'follow-up-due': 0,
  'needs-reply': 1,
  'event-near': 2,
  scheduled: 3,
  'confirmed-upcoming': 4,
  active: 5,
  closed: 6,
};

export function sortReservationsForFollowUp(
  reservations: StoredReservation[],
  now = new Date(),
): StoredReservation[] {
  return [...reservations].sort((left, right) => {
    const leftState = classifyReservationFollowUp(left, now);
    const rightState = classifyReservationFollowUp(right, now);
    const priority =
      PRIORITY_ORDER[leftState.priority] - PRIORITY_ORDER[rightState.priority];
    if (priority !== 0) return priority;
    const lane = LANE_ORDER[leftState.lane] - LANE_ORDER[rightState.lane];
    if (lane !== 0) return lane;
    const leftAction =
      validTimestamp(leftState.actionAt) ?? validTimestamp(left.createdAt) ?? 0;
    const rightAction =
      validTimestamp(rightState.actionAt) ?? validTimestamp(right.createdAt) ?? 0;
    if (leftAction !== rightAction) return leftAction - rightAction;
    return left.id.localeCompare(right.id);
  });
}

export function filterReservationsForFollowUp(input: {
  reservations: StoredReservation[];
  view: ReservationFollowUpView;
  now?: Date;
}): StoredReservation[] {
  const now = input.now ?? new Date();
  return sortReservationsForFollowUp(input.reservations, now).filter(
    (reservation) => {
      const lane = classifyReservationFollowUp(reservation, now).lane;
      if (input.view === 'action-needed') {
        return ['needs-reply', 'follow-up-due', 'event-near'].includes(lane);
      }
      if (input.view === 'all-active') return lane !== 'closed';
      return lane === input.view;
    },
  );
}

export function summarizeReservationFollowUps(
  reservations: StoredReservation[],
  now = new Date(),
): ReservationFollowUpSummary {
  const summary: ReservationFollowUpSummary = {
    total: reservations.length,
    actionNeeded: 0,
    needsReply: 0,
    followUpDue: 0,
    eventNear: 0,
    scheduled: 0,
    confirmedUpcoming: 0,
    active: 0,
    closed: 0,
  };

  for (const reservation of reservations) {
    const lane = classifyReservationFollowUp(reservation, now).lane;
    if (['needs-reply', 'follow-up-due', 'event-near'].includes(lane)) {
      summary.actionNeeded += 1;
    }
    if (lane === 'needs-reply') summary.needsReply += 1;
    if (lane === 'follow-up-due') summary.followUpDue += 1;
    if (lane === 'event-near') summary.eventNear += 1;
    if (lane === 'scheduled') summary.scheduled += 1;
    if (lane === 'confirmed-upcoming') summary.confirmedUpcoming += 1;
    if (lane === 'active') summary.active += 1;
    if (lane === 'closed') summary.closed += 1;
  }

  return summary;
}

export function resolveReservationFollowUpAt(input: {
  current?: string;
  requested?: string | null;
  status: ReservationStatus;
}): string | undefined {
  if (['confirmed', 'cancelled', 'completed'].includes(input.status)) {
    return undefined;
  }
  if (input.requested === null) return undefined;
  return input.requested ?? input.current;
}

export function followUpAtForPreset(input: {
  preset: ReservationFollowUpPreset;
  reservation: Pick<StoredReservation, 'date'>;
  now?: Date;
}): string {
  const now = input.now ?? new Date();
  if (input.preset === 'two-hours') {
    return new Date(now.getTime() + 2 * HOUR_MS).toISOString();
  }

  if (input.preset === 'tomorrow') {
    const tomorrow = addDays(getVenueToday(now), 1);
    return localDateToVenueDate(tomorrow, 11).toISOString();
  }

  const eventDay = input.reservation.date as LocalDate;
  const dayBefore = addDays(eventDay, -1);
  const proposed = localDateToVenueDate(dayBefore, 11);
  if (proposed.getTime() <= now.getTime()) {
    return new Date(now.getTime() + 2 * HOUR_MS).toISOString();
  }
  return proposed.toISOString();
}
