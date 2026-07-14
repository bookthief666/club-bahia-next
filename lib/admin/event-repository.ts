'use client';

import { commandCenterFixture } from './fixtures';
import type { EventStatus, OperationsEvent } from './domain';
import type { EventIdeaConcept } from './event-ideas/domain';
import { addDays, getVenueToday, localDateToVenueDate, type LocalDate } from './date';
import { ACTIVE_STATUSES, assertValidTransition } from './event-status';
import {
  canUseSharedWorkspaceStorage,
  loadOrMigrateSharedWorkspace,
  saveSharedWorkspace,
  SharedWorkspaceConflictError,
} from '@/lib/admin/workspaces/client';

const STORAGE_KEY = 'club-bahia-dev-events-v2';
const SHARED_KEY = 'catalog';
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

export interface EventRepository {
  listEvents(): Promise<OperationsEvent[]>;
  getEvent(id: string): Promise<OperationsEvent | null>;
  createEvent(input: EventInput): Promise<OperationsEvent>;
  updateEvent(
    id: string,
    input: Partial<EventInput> & {
      status?: EventStatus;
      cancellationReason?: string;
    },
    opts?: { now?: Date },
  ): Promise<OperationsEvent>;
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
  ideaPlan?: EventIdeaConcept;
};

export function newEventDefaults(now = new Date()): EventInput {
  const date = addDays(getVenueToday(now), 7);
  return {
    title: '',
    concept: '',
    room: 'Main room',
    owner: 'Luis',
    date,
    status: 'idea',
    capacityTarget: 250,
    ticketsSold: 0,
    riskFlags: [],
    revenueTarget: 0,
    committedCosts: 0,
  };
}

function isOperationsEvent(value: unknown): value is OperationsEvent {
  if (!value || typeof value !== 'object') return false;
  const event = value as Partial<OperationsEvent>;
  return (
    typeof event.id === 'string' &&
    typeof event.title === 'string' &&
    typeof event.concept === 'string' &&
    typeof event.startsAt === 'string' &&
    typeof event.endsAt === 'string' &&
    typeof event.status === 'string'
  );
}

export class BrowserFixtureEventRepository implements EventRepository {
  private sharedRevision = 0;

  private readLocal(): OperationsEvent[] | null {
    const storage = globalThis.localStorage;
    if (!storage) return null;
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? parsed.filter(isOperationsEvent) : null;
    } catch {
      return null;
    }
  }

  private writeLocal(events: OperationsEvent[]): void {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(events));
  }

  private async read(): Promise<OperationsEvent[]> {
    const local = this.readLocal();
    if (!canUseSharedWorkspaceStorage()) {
      if (local) return local;
      const seeded = clone(commandCenterFixture.events);
      this.writeLocal(seeded);
      return seeded;
    }

    const initial = local ?? clone(commandCenterFixture.events);
    const record = await loadOrMigrateSharedWorkspace<OperationsEvent[]>({
      kind: 'events',
      key: SHARED_KEY,
      legacyValue: initial,
    });
    this.sharedRevision = record?.revision ?? 0;
    if (record && local) globalThis.localStorage?.removeItem(STORAGE_KEY);

    const value = Array.isArray(record?.value)
      ? record.value.filter(isOperationsEvent)
      : initial;
    return clone(value);
  }

  private async write(events: OperationsEvent[]): Promise<OperationsEvent[]> {
    if (!canUseSharedWorkspaceStorage()) {
      this.writeLocal(events);
      return clone(events);
    }

    try {
      const record = await saveSharedWorkspace({
        kind: 'events',
        key: SHARED_KEY,
        value: events,
        expectedRevision: this.sharedRevision,
      });
      this.sharedRevision = record.revision;
      return clone(record.value);
    } catch (error) {
      if (error instanceof SharedWorkspaceConflictError) {
        throw new Error(
          'The event catalog changed in another browser. Reload before saving again.',
        );
      }
      throw error;
    }
  }

  async listEvents() {
    return (await this.read()).sort(
      (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    );
  }

  async getEvent(id: string) {
    return (await this.read()).find((event) => event.id === id) ?? null;
  }

  async createEvent(input: EventInput) {
    const events = await this.read();
    const starts = localDateToVenueDate(input.date, 21);
    const ends = new Date(starts.getTime() + 4 * 60 * 60 * 1000);
    const event: OperationsEvent = {
      id: `evt-dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      title: input.title.trim(),
      concept: input.concept.trim(),
      startsAt: starts.toISOString(),
      endsAt: ends.toISOString(),
      status: input.status ?? 'idea',
      room: input.room,
      capacityTarget: input.capacityTarget ?? 250,
      ticketsSold: input.ticketsSold ?? 0,
      owner: input.owner,
      marketingLaunchAt:
        input.marketingLaunchAt ??
        localDateToVenueDate(addDays(input.date, -10), 12).toISOString(),
      riskFlags: input.riskFlags ?? [],
      revenueTarget: input.revenueTarget ?? 0,
      committedCosts: input.committedCosts ?? 0,
      ideaPlan: input.ideaPlan ? clone(input.ideaPlan) : undefined,
    };
    events.push(event);
    await this.write(events);
    return event;
  }

  async updateEvent(
    id: string,
    input: Partial<EventInput> & {
      status?: EventStatus;
      cancellationReason?: string;
    },
    opts: { now?: Date } = {},
  ) {
    const events = await this.read();
    const index = events.findIndex((event) => event.id === id);
    if (index < 0) throw new Error('Event not found.');

    const current = events[index];
    const patch: Partial<OperationsEvent> = {
      title: input.title?.trim(),
      concept: input.concept?.trim(),
      room: input.room,
      owner: input.owner,
      capacityTarget: input.capacityTarget,
      ticketsSold: input.ticketsSold,
      riskFlags: input.riskFlags,
      revenueTarget: input.revenueTarget,
      committedCosts: input.committedCosts,
      ideaPlan: input.ideaPlan ? clone(input.ideaPlan) : undefined,
    };

    if (input.date) {
      const starts = localDateToVenueDate(input.date, 21);
      patch.startsAt = starts.toISOString();
      patch.endsAt = new Date(starts.getTime() + 4 * 60 * 60 * 1000).toISOString();
    }

    const nextStatus = input.status;
    const candidate = {
      ...current,
      ...Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined)),
    } as OperationsEvent;

    if (nextStatus) {
      assertValidTransition(
        { ...candidate, status: current.status },
        nextStatus,
        {
          cancellationReason: input.cancellationReason ?? current.cancellationReason,
          now: opts.now,
        },
      );
      patch.status = nextStatus;
      if (nextStatus === 'cancelled') {
        patch.cancelledAt = current.cancelledAt ?? new Date().toISOString();
        patch.cancellationReason = input.cancellationReason ?? current.cancellationReason;
      }
      if (nextStatus === 'live') patch.liveAt = new Date().toISOString();
      if (nextStatus === 'completed') patch.completedAt = new Date().toISOString();
    }

    events[index] = {
      ...current,
      ...Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined)),
    };
    await this.write(events);
    return events[index];
  }

  async duplicateEvent(id: string, input: { title: string; date: LocalDate }) {
    if (!input.date) throw new Error('Choose a new event date before duplicating.');
    const original = await this.getEvent(id);
    if (!original) throw new Error('Event not found.');
    return this.createEvent({
      title: input.title || `${original.title} copy`,
      concept: original.concept,
      room: original.room,
      owner: original.owner,
      date: input.date,
      status: 'idea',
      capacityTarget: original.capacityTarget,
      ticketsSold: 0,
      riskFlags: [],
      revenueTarget: original.revenueTarget,
      committedCosts: original.committedCosts,
      ideaPlan: original.ideaPlan,
    });
  }

  async archiveEvent(id: string, opts: { now?: Date } = {}) {
    const event = await this.updateEvent(id, { status: 'archived' }, opts);
    event.archivedAt = new Date().toISOString();
    const events = (await this.read()).map((item) => (item.id === id ? event : item));
    await this.write(events);
    return event;
  }

  async restoreEvent(
    id: string,
    status?: EventStatus,
    opts: { now?: Date } = {},
  ) {
    const event = await this.getEvent(id);
    if (!event) throw new Error('Event not found.');
    const target =
      status ??
      (event.cancelledAt
        ? 'cancelled'
        : event.completedAt
          ? 'completed'
          : 'evaluating');
    return this.updateEvent(id, { status: target }, opts);
  }

  async deleteEvent(id: string) {
    await this.write((await this.read()).filter((event) => event.id !== id));
  }
}

export const eventRepository = new BrowserFixtureEventRepository();

export function isActiveEvent(event: OperationsEvent) {
  return ACTIVE_STATUSES.includes(event.status);
}
