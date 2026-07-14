import { z } from 'zod';

const safeIdentifier = z
  .string()
  .trim()
  .min(1)
  .max(160)
  .regex(/^[a-zA-Z0-9_-]+$/);

const httpsVideoUrl = z
  .string()
  .url()
  .refine((value) => new URL(value).protocol === 'https:', {
    message: 'Instagram Reel media must use a public HTTPS URL.',
  });

const idempotencyKey = z
  .string()
  .trim()
  .min(1)
  .max(600)
  .regex(/^[a-z0-9:-]+$/);

export const InstagramReelInitializeRequestSchema = z.object({
  eventId: safeIdentifier,
  contentItemId: safeIdentifier,
  caption: z.string().trim().min(1).max(2200),
  videoUrl: httpsVideoUrl,
  shareToFeed: z.boolean().optional().default(true),
  confirmation: z.literal('CREATE_REEL_CONTAINER'),
});

export const InstagramReelStatusRequestSchema = z.object({
  idempotencyKey,
  confirmation: z.literal('CHECK_REEL_STATUS'),
});

export const InstagramReelCommitRequestSchema = z.object({
  idempotencyKey,
  confirmation: z.literal('PUBLISH_READY_REEL'),
});

export type InstagramReelInitializeRequest = z.infer<
  typeof InstagramReelInitializeRequestSchema
>;
export type InstagramReelStatusRequest = z.infer<
  typeof InstagramReelStatusRequestSchema
>;
export type InstagramReelCommitRequest = z.infer<
  typeof InstagramReelCommitRequestSchema
>;
