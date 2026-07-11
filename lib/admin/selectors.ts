import type { CommandCenterData, OperationsEvent, OperationsTask, ReservationRequest } from './domain';

const DAY = 24 * 60 * 60 * 1000;
export const parseDate = (value: string) => new Date(value);

export function getTodayTasks(data: CommandCenterData, now = parseDate(data.generatedAt)): OperationsTask[] {
  const end = new Date(now); end.setUTCHours(23, 59, 59, 999);
  return data.tasks.filter((task) => !task.completed && parseDate(task.dueAt) <= end)
    .sort((a, b) => parseDate(a.dueAt).getTime() - parseDate(b.dueAt).getTime());
}

export function getUpcomingEvents(data: CommandCenterData, now = parseDate(data.generatedAt), days = 14): OperationsEvent[] {
  const cutoff = new Date(now.getTime() + days * DAY);
  return data.events.filter((event) => {
    const starts = parseDate(event.startsAt);
    return starts >= now && starts <= cutoff && !['completed', 'reviewed', 'archived'].includes(event.status);
  }).sort((a, b) => parseDate(a.startsAt).getTime() - parseDate(b.startsAt).getTime());
}

export function getAtRiskEvents(data: CommandCenterData, now = parseDate(data.generatedAt)): OperationsEvent[] {
  return data.events.filter((event) => {
    const starts = parseDate(event.startsAt);
    const daysUntil = (starts.getTime() - now.getTime()) / DAY;
    const ticketPace = event.capacityTarget === 0 ? 1 : event.ticketsSold / event.capacityTarget;
    return event.riskFlags.length > 0 || (daysUntil <= 7 && ticketPace < 0.4) || event.committedCosts > event.revenueTarget * 0.7;
  }).sort((a, b) => b.riskFlags.length - a.riskFlags.length || parseDate(a.startsAt).getTime() - parseDate(b.startsAt).getTime());
}

export function getPendingReservations(data: CommandCenterData): ReservationRequest[] {
  return data.reservations.filter((reservation) => ['new', 'pending', 'waitlist'].includes(reservation.status))
    .sort((a, b) => parseDate(a.requestedAt).getTime() - parseDate(b.requestedAt).getTime());
}

export function hasOperationalAttention(data: CommandCenterData): boolean {
  return getTodayTasks(data).length > 0 || getAtRiskEvents(data).length > 0 || getPendingReservations(data).length > 0;
}
