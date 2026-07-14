import type { EventIdeaConcept } from '@/lib/admin/event-ideas/domain';

export type AdminRole = 'owner' | 'manager' | 'producer' | 'marketing' | 'door' | 'viewer';

export type EventStatus = 'idea' | 'evaluating' | 'approved' | 'announced' | 'on-sale' | 'final-prep' | 'live' | 'completed' | 'reviewed' | 'cancelled' | 'archived';
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';
export type ReservationStatus = 'new' | 'pending' | 'confirmed' | 'waitlist' | 'cancelled' | 'no-show' | 'completed';

export interface AdminUser {
  id: string;
  name: string;
  role: AdminRole;
  avatarInitials: string;
}

export interface OperationsEvent {
  id: string;
  title: string;
  concept: string;
  startsAt: string;
  endsAt: string;
  status: EventStatus;
  room: string;
  capacityTarget: number;
  ticketsSold: number;
  owner: string;
  marketingLaunchAt: string;
  riskFlags: string[];
  revenueTarget: number;
  committedCosts: number;
  ideaPlan?: EventIdeaConcept;
  archivedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  completedAt?: string;
  liveAt?: string;
}

export interface OperationsTask {
  id: string;
  title: string;
  dueAt: string;
  priority: TaskPriority;
  owner: string;
  linkedEventId?: string;
  completed: boolean;
}

export interface ReservationRequest {
  id: string;
  guestName: string;
  partySize: number;
  occasion: string;
  requestedAt: string;
  eventId?: string;
  source: string;
  status: ReservationStatus;
  assignedTo?: string;
  lastContactAt?: string;
}

export interface CommandCenterData {
  generatedAt: string;
  user: AdminUser;
  events: OperationsEvent[];
  tasks: OperationsTask[];
  reservations: ReservationRequest[];
}
