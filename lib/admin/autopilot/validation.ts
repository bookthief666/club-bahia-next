import { z } from 'zod';

const safeIdentifier = z
  .string()
  .trim()
  .min(1)
  .max(160)
  .regex(/^[a-zA-Z0-9_-]+$/);

export const InstagramImagePublishRequestSchema = z.object({
  eventId: safeIdentifier,
  contentItemId: safeIdentifier,
  caption: z.string().trim().min(1).max(2200),
  imageUrl: z
    .string()
    .url()
    .refine((value) => new URL(value).protocol === 'https:', {
      message: 'Instagram media must use a public HTTPS URL.',
    }),
  reservationUrl: z
    .string()
    .trim()
    .max(2048)
    .refine((value) => !value || /^https?:\/\//i.test(value), {
      message: 'Reservation URL must be empty or use HTTP/HTTPS.',
    })
    .optional()
    .default(''),
});

export type InstagramImagePublishRequest = z.infer<
  typeof InstagramImagePublishRequestSchema
>;
