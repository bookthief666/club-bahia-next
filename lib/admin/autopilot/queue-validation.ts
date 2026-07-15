import { z } from 'zod';

const safeIdentifier = z
  .string()
  .trim()
  .min(1)
  .max(160)
  .regex(/^[a-zA-Z0-9_-]+$/);

const httpsUrl = z
  .string()
  .url()
  .refine((value) => new URL(value).protocol === 'https:', {
    message: 'Publishing media must use a public HTTPS URL.',
  });

const optionalPublicUrl = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => !value || /^https?:\/\//i.test(value), {
    message: 'Link must be empty or use HTTP/HTTPS.',
  })
  .optional();

export const PublishingQueueJobInputSchema = z.object({
  id: safeIdentifier,
  eventId: safeIdentifier,
  eventTitle: z.string().trim().min(1).max(180),
  contentItemId: safeIdentifier,
  label: z.string().trim().min(1).max(120),
  provider: z.enum(['meta', 'tiktok']),
  channel: z.enum([
    'instagram-feed',
    'instagram-story',
    'instagram-reel',
    'tiktok-video',
  ]),
  scheduledFor: z.string().datetime().optional(),
  approvalMode: z
    .enum(['prepare-only', 'approve-each', 'approve-campaign'])
    .optional(),
  payload: z.object({
    caption: z.string().trim().min(1).max(2200),
    mediaUrl: httpsUrl,
    mediaKind: z.enum(['image', 'video']),
    reservationUrl: optionalPublicUrl,
    altText: z.string().trim().max(1000).optional(),
    privacyLevel: z.string().trim().max(80).optional(),
  }),
  executionSupport: z.enum([
    'automatic',
    'connection-required',
    'provider-proof-required',
  ]),
  maxAttempts: z.number().int().min(1).max(8).optional(),
});

export const PublishingQueueUpsertSchema = z.object({
  action: z.literal('upsert'),
  job: PublishingQueueJobInputSchema,
});

export const PublishingQueueActionSchema = z.discriminatedUnion('action', [
  PublishingQueueUpsertSchema,
  z.object({
    action: z.literal('upsert-campaign'),
    eventId: safeIdentifier,
    jobs: z.array(PublishingQueueJobInputSchema).min(1).max(20),
  }),
  z.object({ action: z.literal('approve'), jobId: safeIdentifier }),
  z.object({
    action: z.literal('approve-campaign'),
    eventId: safeIdentifier,
    jobIds: z.array(safeIdentifier).min(1).max(20),
  }),
  z.object({ action: z.literal('cancel'), jobId: safeIdentifier }),
]);

export type PublishingQueueAction = z.infer<typeof PublishingQueueActionSchema>;
