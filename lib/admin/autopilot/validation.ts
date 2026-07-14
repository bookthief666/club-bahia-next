import { z } from 'zod';

const safeIdentifier = z
  .string()
  .trim()
  .min(1)
  .max(160)
  .regex(/^[a-zA-Z0-9_-]+$/);

const httpsMediaUrl = z
  .string()
  .url()
  .refine((value) => new URL(value).protocol === 'https:', {
    message: 'Publishing media must use a public HTTPS URL.',
  });

export const InstagramImagePublishRequestSchema = z.object({
  eventId: safeIdentifier,
  contentItemId: safeIdentifier,
  caption: z.string().trim().min(1).max(2200),
  imageUrl: httpsMediaUrl,
  reservationUrl: z
    .string()
    .trim()
    .max(2048)
    .refine((value) => !value || /^https?:\/\//i.test(value), {
      message: 'Reservation URL must be empty or use HTTP/HTTPS.',
    })
    .optional()
    .default(''),
  confirmation: z.literal('PUBLISH_NOW'),
});

export const TikTokPrivateVideoPublishRequestSchema = z.object({
  eventId: safeIdentifier,
  contentItemId: safeIdentifier,
  caption: z.string().trim().min(1).max(2200),
  videoUrl: httpsMediaUrl,
  videoCoverTimestampMs: z.number().int().min(0).max(60_000).optional(),
  confirmation: z.literal('PUBLISH_PRIVATE_TEST'),
});

export const TikTokPublicationStatusRequestSchema = z.object({
  idempotencyKey: z
    .string()
    .trim()
    .min(1)
    .max(600)
    .regex(/^[a-z0-9:-]+$/),
  confirmation: z.literal('CHECK_STATUS'),
});

export type InstagramImagePublishRequest = z.infer<
  typeof InstagramImagePublishRequestSchema
>;
export type TikTokPrivateVideoPublishRequest = z.infer<
  typeof TikTokPrivateVideoPublishRequestSchema
>;
export type TikTokPublicationStatusRequest = z.infer<
  typeof TikTokPublicationStatusRequestSchema
>;
