import { commandCenterFixture } from './fixtures';
import type { EventStatus, OperationsEvent } from './domain';
import { addDays, getVenueToday, localDateToVenueDate, type LocalDate } from './date';
import { ACTIVE_STATUSES, assertValidTransition } from './event-status';

const STORAGE_KEY = 'club-bahia-dev-events-v2';
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

export interface EventRepository {
  listEvents(): Promise<OperationsEvent[]>;
  getEvent(id: string): Promise<OperationsEvent | null>;
  createEvent(input: EventInput): Promise<OperationsEvent>;
  updateEvent(id: string, input: Partial<EventInput> & { status?: EventStatus; cancellationReason?: string }, opts?: { now?: Date }): Promise<OperationsEvent>;
  duplicateEvent(id: string, input: { title: string; date: LocalDate }): Promise<OperationsEvent>;
  archiveEvent(id: string, opts?: { now?: Date }): Promise<OperationsEvent>;
  restoreEvent(id: string, status?: EventStatus, opts?: { now?: Date }): Promise<OperationsEvent>;
  deleteEvent(id: string): Promise<void>;
}

export type EventInput = Pick<OperationsEvent, 'title' | 'concept' | 'room' | 'owner'> & {
  date: LocalDate;
  status?: EventStatus;
  capacityTarget?: number;
  ticketsSold?: number;
  marketingLaunchAt?: string;
  riskFlags?: string[];
  revenueTarget?: number;
  committedCosts?: number;
};

export function newEventDefaults(now = new Date()): EventInput {
  const date = addDays(getVenueToday(now), 7);
  return { title: '', concept: '', room: 'Main room', owner: 'Luis', date, status: 'idea', capacityTarget: 250, ticketsSold: 0, riskFlags: [], revenueTarget: 0, committedCosts: 0 };
}

export class BrowserFixtureEventRepository implements EventRepository {
  private read(): OperationsEvent[] {
    const storage = globalThis.localStorage;
    if (!storage) return clone(commandCenterFixture.events);
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) { const seeded = clone(commandCenterFixture.events); this.write(seeded); return seeded; }
    return JSON.parse(raw) as OperationsEvent[];
  }
  private write(events: OperationsEvent[]) { globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(events)); }
  async listEvents() { return this.read().sort((a,b)=>new Date(a.startsAt).getTime()-new Date(b.startsAt).getTime()); }
  async getEvent(id: string) { return this.read().find((event) => event.id === id) ?? null; }
  async createEvent(input: EventInput) {
    const events = this.read();
    const starts = localDateToVenueDate(input.date, 21);
    const ends = new Date(starts.getTime() + 4 * 60 * 60 * 1000);
    const event: OperationsEvent = { id: `evt-dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`, title: input.title.trim(), concept: input.concept.trim(), startsAt: starts.toISOString(), endsAt: ends.toISOString(), status: input.status ?? 'idea', room: input.room, capacityTarget: input.capacityTarget ?? 250, ticketsSold: input.ticketsSold ?? 0, owner: input.owner, marketingLaunchAt: input.marketingLaunchAt ?? localDateToVenueDate(addDays(input.date, -10), 12).toISOString(), riskFlags: input.riskFlags ?? [], revenueTarget: input.revenueTarget ?? 0, committedCosts: input.committedCosts ?? 0 };
    events.push(event); this.write(events); return event;
  }
  async updateEvent(id: string, input: Partial<EventInput> & { status?: EventStatus; cancellationReason?: string }, opts: { now?: Date } = {}) {
    const events = this.read(); const index = events.findIndex((event) => event.id === id); if (index < 0) throw new Error('Event not found.');
    const current = events[index];
    if (input.status) assertValidTransition(current, input.status, { cancellationReason: input.cancellationReason, now: opts.now });
    const patch: Partial<OperationsEvent> = { title: input.title?.trim(), concept: input.concept?.trim(), room: input.room, owner: input.owner, capacityTarget: input.capacityTarget, ticketsSold: input.ticketsSold, riskFlags: input.riskFlags, revenueTarget: input.revenueTarget, committedCosts: input.committedCosts };
    if (input.date) { const starts = localDateToVenueDate(input.date, 21); patch.startsAt = starts.toISOString(); patch.endsAt = new Date(starts.getTime() + 4*60*60*1000).toISOString(); }
    if (input.status) { patch.status = input.status; if (input.status === 'cancelled') { patch.cancelledAt = new Date().toISOString(); patch.cancellationReason = input.cancellationReason; } if (input.status === 'live') patch.liveAt = new Date().toISOString(); if (input.status === 'completed') patch.completedAt = new Date().toISOString(); }
    events[index] = { ...current, ...Object.fromEntries(Object.entries(patch).filter(([,v]) => v !== undefined)) };
    this.write(events); return events[index];
  }
  async duplicateEvent(id: string, input: { title: string; date: LocalDate }) {
    if (!input.date) throw new Error('Choose a new event date before duplicating.');
    const original = await this.getEvent(id); if (!original) throw new Error('Event not found.');
    return this.createEvent({ title: input.title || `${original.title} copy`, concept: original.concept, room: original.room, owner: original.owner, date: input.date, status: 'idea', capacityTarget: original.capacityTarget, ticketsSold: 0, riskFlags: [], revenueTarget: original.revenueTarget, committedCosts: original.committedCosts });
  }
  async archiveEvent(id: string, opts: { now?: Date } = {}) { const event = await this.updateEvent(id, { status: 'archived' }, opts); event.archivedAt = new Date().toISOString(); const events = this.read().map((e)=>e.id===id?event:e); this.write(events); return event; }
  async restoreEvent(id: string, status?: EventStatus, opts: { now?: Date } = {}) { const event = await this.getEvent(id); if (!event) throw new Error('Event not found.'); const target = status ?? (event.cancelledAt ? 'cancelled' : event.completedAt ? 'completed' : 'evaluating'); return this.updateEvent(id, { status: target }, opts); }
  async deleteEvent(id: string) { this.write(this.read().filter((event) => event.id !== id)); }
}

export const eventRepository = new BrowserFixtureEventRepository();
export function isActiveEvent(event: OperationsEvent) { return ACTIVE_STATUSES.includes(event.status); }
