import type { EventStatus, OperationsEvent } from './domain';
import { eventLocalDate, getVenueToday } from './date';

export const ACTIVE_STATUSES: EventStatus[] = ['idea', 'evaluating', 'approved', 'announced', 'on-sale', 'final-prep', 'live'];
export const TERMINAL_STATUSES: EventStatus[] = ['completed', 'cancelled', 'reviewed', 'archived'];

export const STATUS_TONES: Record<EventStatus, { label: string; className: string; description: string }> = {
  idea: { label: 'Idea', className: 'border-slate-300/30 bg-slate-400/10 text-slate-50', description: 'Concept only' },
  evaluating: { label: 'Evaluating', className: 'border-sky-200/30 bg-sky-400/10 text-sky-50', description: 'Being vetted' },
  approved: { label: 'Approved', className: 'border-emerald-200/30 bg-emerald-400/10 text-emerald-50', description: 'Approved to plan' },
  announced: { label: 'Announced', className: 'border-fuchsia-200/30 bg-fuchsia-400/10 text-fuchsia-50', description: 'Public announcement started' },
  'on-sale': { label: 'On sale', className: 'border-amber-200/40 bg-amber-400/15 text-amber-50', description: 'Tickets or RSVPs moving' },
  'final-prep': { label: 'Final prep', className: 'border-orange-200/40 bg-orange-500/15 text-orange-50', description: 'Final production push' },
  live: { label: 'Live', className: 'border-red-200/50 bg-red-500/20 text-red-50', description: 'Happening today' },
  completed: { label: 'Completed', className: 'border-teal-200/35 bg-teal-500/12 text-teal-50', description: 'Event finished' },
  cancelled: { label: 'Cancelled', className: 'border-rose-200/45 bg-rose-700/25 text-rose-50 line-through decoration-rose-200/70', description: 'Cancelled with reason' },
  reviewed: { label: 'Reviewed', className: 'border-violet-200/35 bg-violet-500/12 text-violet-50', description: 'Post-event reviewed' },
  archived: { label: 'Archived', className: 'border-zinc-300/25 bg-zinc-500/10 text-zinc-200 opacity-80', description: 'Hidden from active work' },
};

export const TRANSITIONS: Record<EventStatus, EventStatus[]> = {
  idea: ['evaluating', 'cancelled', 'archived'],
  evaluating: ['idea', 'approved', 'cancelled', 'archived'],
  approved: ['evaluating', 'announced', 'cancelled', 'archived'],
  announced: ['approved', 'on-sale', 'cancelled', 'archived'],
  'on-sale': ['announced', 'final-prep', 'cancelled', 'archived'],
  'final-prep': ['on-sale', 'live', 'cancelled', 'archived'],
  live: ['completed', 'cancelled'],
  completed: ['reviewed', 'archived'],
  reviewed: ['archived'],
  cancelled: ['evaluating', 'archived'],
  archived: ['idea', 'evaluating', 'approved', 'announced', 'on-sale', 'final-prep', 'completed', 'cancelled', 'reviewed'],
};

export function getValidNextStatuses(status: EventStatus): EventStatus[] { return [status, ...TRANSITIONS[status]]; }
export function isValidTransition(from: EventStatus, to: EventStatus) { return from === to || TRANSITIONS[from].includes(to); }

export function assertValidTransition(event: OperationsEvent, next: EventStatus, opts: { cancellationReason?: string; now?: Date } = {}) {
  if (!isValidTransition(event.status, next)) throw new Error(`Cannot move event from ${STATUS_TONES[event.status].label} to ${STATUS_TONES[next].label}.`);
  if (next === 'cancelled' && !opts.cancellationReason?.trim()) throw new Error('Cancellation requires a reason.');
  if (next === 'live' && eventLocalDate(event.startsAt) !== getVenueToday(opts.now)) throw new Error('Only events scheduled for the current Los Angeles venue date can move to Live.');
}
