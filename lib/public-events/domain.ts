import { z } from 'zod';

export const PublicEventVisibilitySchema = z.enum(['preview', 'public']);
export const PublicProgramTypeSchema = z.enum([
  'scheduled',
  'resident',
  'evergreen',
]);

export const PublicEventSnapshotSchema = z.object({
  version: z.literal(1),
  id: z.string().trim().min(1).max(160),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(180)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().trim().min(2).max(180),
  eyebrow: z.string().trim().max(100).default('Upcoming at Bahia'),
  category: z.string().trim().max(80).default('Live event'),
  programType: PublicProgramTypeSchema.default('scheduled'),
  summary: z.string().trim().min(20).max(700),
  websiteCopy: z.string().trim().min(20).max(8000),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  room: z.string().trim().max(120),
  performers: z.string().trim().max(400).default(''),
  genres: z.string().trim().max(300).default(''),
  doorsTime: z.string().trim().max(120).default(''),
  admission: z.string().trim().max(160).default(''),
  ageRestriction: z.string().trim().max(80).default('21+'),
  foodDrinkSpecial: z.string().trim().max(300).default(''),
  address: z.string().trim().max(300).default('1130 Sunset Blvd, Los Angeles, CA 90012'),
  reservationUrl: z.string().trim().url().max(2000).or(z.literal('')),
  ticketUrl: z.string().trim().url().max(2000).or(z.literal('')),
  imageUrl: z.string().trim().url().max(2000).or(z.literal('')),
  imageAlt: z.string().trim().max(500).default(''),
  statusLabel: z.string().trim().max(100).default('Reservations available'),
  visibility: PublicEventVisibilitySchema,
  isFeatured: z.boolean().default(false),
  publishedAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime(),
});

export type PublicEventSnapshot = z.infer<typeof PublicEventSnapshotSchema>;
export type PublicEventVisibility = z.infer<typeof PublicEventVisibilitySchema>;
export type PublicProgramType = z.infer<typeof PublicProgramTypeSchema>;

export interface PublicEventCard {
  id: string;
  slug: string;
  title: string;
  eyebrow: string;
  category: string;
  programType: PublicProgramType;
  summary: string;
  description: string;
  startsAt?: string;
  endsAt?: string;
  dateLabel: string;
  timeLabel: string;
  room?: string;
  performers?: string;
  genres?: string;
  doorsTime?: string;
  admission?: string;
  ageRestriction?: string;
  foodDrinkSpecial?: string;
  address?: string;
  reservationHref: string;
  ticketUrl: string;
  imageUrl: string;
  imageAlt: string;
  status: string;
  ctaLabel: string;
  isFeatured: boolean;
  source: 'snapshot' | 'fallback';
}

export function slugifyPublicEvent(value: string): string {
  return (
    value
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 160) || 'club-bahia-event'
  );
}
