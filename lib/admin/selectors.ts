import type {
  CommandCenterData,
  OperationsEvent,
  OperationsTask,
  ReservationRequest,
} from "./domain";
import { getVenueToday } from "./date";
import { ACTIVE_STATUSES } from "./event-status";
const DAY = 24 * 60 * 60 * 1000;
export const parseDate = (value: string) => new Date(value);
const active = (event: OperationsEvent) =>
  ACTIVE_STATUSES.includes(event.status);
export function getTodayTasks(
  data: CommandCenterData,
  now = parseDate(data.generatedAt),
): OperationsTask[] {
  const today = getVenueToday(now);
  return data.tasks
    .filter(
      (task) =>
        !task.completed && getVenueToday(parseDate(task.dueAt)) <= today,
    )
    .sort(
      (a, b) => parseDate(a.dueAt).getTime() - parseDate(b.dueAt).getTime(),
    );
}
export function getUpcomingEvents(
  data: CommandCenterData,
  now = parseDate(data.generatedAt),
  days = 14,
): OperationsEvent[] {
  const cutoff = now.getTime() + days * DAY;
  return data.events
    .filter((event) => {
      const starts = parseDate(event.startsAt);
      return starts >= now && starts.getTime() <= cutoff && active(event);
    })
    .sort(
      (a, b) =>
        parseDate(a.startsAt).getTime() - parseDate(b.startsAt).getTime(),
    );
}
export function getEventsThisWeek(
  data: CommandCenterData,
  now = parseDate(data.generatedAt),
): OperationsEvent[] {
  return getUpcomingEvents(data, now, 7);
}
export function getNeedsPromotionEvents(
  data: CommandCenterData,
  now = parseDate(data.generatedAt),
): OperationsEvent[] {
  return data.events.filter(
    (event) =>
      active(event) &&
      parseDate(event.marketingLaunchAt) <= now &&
      event.ticketsSold / Math.max(event.capacityTarget, 1) < 0.5,
  );
}
export function getNeedsStaffingEvents(
  data: CommandCenterData,
): OperationsEvent[] {
  return data.events.filter(
    (event) =>
      active(event) &&
      event.riskFlags.some((flag) => /staff|security|door/i.test(flag)),
  );
}
export function getPastDuePreparationEvents(
  data: CommandCenterData,
  now = parseDate(data.generatedAt),
): OperationsEvent[] {
  return data.events.filter(
    (event) =>
      active(event) &&
      parseDate(event.startsAt) < now &&
      event.status !== "live",
  );
}
export function getCancelledEvents(data: CommandCenterData): OperationsEvent[] {
  return data.events.filter((event) => event.status === "cancelled");
}
export function getAtRiskEvents(
  data: CommandCenterData,
  now = parseDate(data.generatedAt),
): OperationsEvent[] {
  return data.events
    .filter((event) => {
      if (!active(event)) return false;
      const starts = parseDate(event.startsAt);
      const daysUntil = (starts.getTime() - now.getTime()) / DAY;
      const ticketPace =
        event.capacityTarget === 0
          ? 1
          : event.ticketsSold / event.capacityTarget;
      return (
        event.riskFlags.length > 0 ||
        (daysUntil <= 7 && ticketPace < 0.4) ||
        event.committedCosts > event.revenueTarget * 0.7
      );
    })
    .sort(
      (a, b) =>
        b.riskFlags.length - a.riskFlags.length ||
        parseDate(a.startsAt).getTime() - parseDate(b.startsAt).getTime(),
    );
}
export function getPendingReservations(
  data: CommandCenterData,
): ReservationRequest[] {
  return data.reservations
    .filter((reservation) =>
      ["new", "pending", "waitlist"].includes(reservation.status),
    )
    .sort(
      (a, b) =>
        parseDate(a.requestedAt).getTime() - parseDate(b.requestedAt).getTime(),
    );
}
export function hasOperationalAttention(data: CommandCenterData): boolean {
  return (
    getTodayTasks(data).length > 0 ||
    getAtRiskEvents(data).length > 0 ||
    getPendingReservations(data).length > 0
  );
}
