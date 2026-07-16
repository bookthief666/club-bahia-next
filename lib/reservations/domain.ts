import { z } from 'zod';
import {
  ReservationAttributionSchema,
  emptyReservationAttribution,
} from '@/lib/attribution/domain';

const phoneRegex = /^(?:\+?1[-.\s]?)?(?:\(?[2-9]\d{2}\)?[-.\s]?)[2-9]\d{2}[-.\s]?\d{4}$/;
const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const ReservationStatusSchema = z.enum([
  'new',
  'contacted',
  'confirmed',
  'waitlist',
  'cancelled',
  'completed',
]);

export type ReservationStatus = z.infer<typeof ReservationStatusSchema>;

export const ReservationSubmissionSchema = z.object({
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(80),
  phone: z.string().trim().regex(phoneRegex).max(40),
  email: z.string().trim().email().max(200),
  date: z.string().regex(isoDateRegex),
  guests: z.coerce.number().int().min(1).max(30),
  occasion: z.string().trim().max(80).optional().default(''),
  note: z.string().trim().max(500).optional().default(''),
  eventId: z.string().trim().max(160).optional().default(''),
  eventSlug: z.string().trim().max(180).optional().default(''),
  eventTitle: z.string().trim().max(180).optional().default(''),
  attribution: ReservationAttributionSchema.optional().default(
    emptyReservationAttribution(),
  ),
  consent: z.literal(true),
  website: z.string().max(0).optional().default(''),
  startedAt: z.number().int().positive(),
});

export type ReservationSubmission = z.infer<typeof ReservationSubmissionSchema>;

export const StoredReservationSchema = z.object({
  id: z.string().trim().min(1).max(120),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  status: ReservationStatusSchema,
  source: z.literal('website'),
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(80),
  phone: z.string().trim().max(40),
  email: z.string().trim().email().max(200),
  date: z.string().regex(isoDateRegex),
  guests: z.number().int().min(1).max(30),
  occasion: z.string().trim().max(80),
  note: z.string().trim().max(500),
  eventId: z.string().trim().max(160),
  eventSlug: z.string().trim().max(180),
  eventTitle: z.string().trim().max(180),
  attribution: ReservationAttributionSchema.optional().default(
    emptyReservationAttribution(),
  ),
  consentAt: z.string().datetime(),
  contactedAt: z.string().datetime().optional(),
  confirmedAt: z.string().datetime().optional(),
  cancelledAt: z.string().datetime().optional(),
  followUpAt: z.string().datetime().optional(),
  staffNote: z.string().trim().max(1000).optional().default(''),
});

export type StoredReservation = z.infer<typeof StoredReservationSchema>;

export const ReservationStatusUpdateSchema = z.object({
  id: z.string().trim().min(1).max(120),
  status: ReservationStatusSchema,
  staffNote: z.string().trim().max(1000).optional(),
  followUpAt: z.union([z.string().datetime(), z.null()]).optional(),
});

export interface ReservationReceipt {
  id: string;
  receivedAt: string;
  eventTitle?: string;
  date: string;
  guests: number;
}

export function reservationGuestName(reservation: StoredReservation): string {
  return `${reservation.firstName} ${reservation.lastName}`.trim();
}
