import { commandCenterFixture } from './fixtures';
import type { OperationsEvent } from './domain';
import { addDays, eventLocalDate, getVenueToday } from './date';
import { isActiveEvent } from './event-repository';

export type EventListQuery = {
  q?: string | null;
  archive?: string | null;
  status?: string | null;
  sort?: string | null;
  date?: string | null;
  risk?: string | null;
};

function fixtureNow() {
  return new Date(commandCenterFixture.generatedAt);
}

function ticketPace(event: OperationsEvent) {
  return event.capacityTarget === 0 ? 1 : event.ticketsSold / event.capacityTarget;
}

export function filterEventsForList(events: OperationsEvent[], query: EventListQuery, now = fixtureNow()): OperationsEvent[] {
  let rows = [...events];
  const q = (query.q ?? '').toLowerCase();
  const archive = query.archive ?? 'active';
  const status = query.status;
  const date = query.date;
  const risk = query.risk;

  if (q) rows = rows.filter((event) => `${event.title} ${event.concept} ${event.owner}`.toLowerCase().includes(q));
  if (archive === 'active') rows = rows.filter(isActiveEvent);
  if (archive === 'archived') rows = rows.filter((event) => event.status === 'archived');
  if (status) rows = rows.filter((event) => event.status === status);
  else if (archive === 'active') rows = rows.filter(isActiveEvent);

  if (date === 'this-week') {
    const start = getVenueToday(now);
    const end = addDays(start, 7);
    rows = rows.filter((event) => {
      const eventDate = eventLocalDate(event.startsAt);
      return eventDate >= start && eventDate <= end;
    });
  }

  if (risk === 'promotion') rows = rows.filter((event) => new Date(event.marketingLaunchAt) <= now && ticketPace(event) < 0.5);
  if (risk === 'staffing') rows = rows.filter((event) => event.riskFlags.some((flag) => /staff|security|door/i.test(flag)));
  if (risk === 'past-due') rows = rows.filter((event) => new Date(event.startsAt) < now && event.status !== 'live');

  if (query.sort === 'title') rows.sort((a, b) => a.title.localeCompare(b.title));
  else if (query.sort === 'risk') rows.sort((a, b) => b.riskFlags.length - a.riskFlags.length);
  else rows.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

  return rows;
}
