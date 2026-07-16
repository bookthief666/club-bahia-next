import { z } from 'zod';
import {
  EVENT_ASSET_ALLOWED_CONTENT_TYPES,
  EVENT_ASSET_MAX_SIZE_BYTES,
} from './domain';

export const EventAssetKindSchema = z.enum([
  'image',
  'video',
  'audio',
  'document',
]);

export const EventAssetRoleSchema = z.enum([
  'primary-flyer',
  'feed-creative',
  'story-creative',
  'reel-video',
  'raw-video',
  'performer-photo',
  'venue-photo',
  'logo',
  'audio',
  'print-flyer',
  'other',
]);

export const EventAssetPlatformSchema = z.enum([
  'website',
  'instagram-feed',
  'instagram-story',
  'reel',
  'tiktok',
  'facebook',
  'email',
  'sms',
  'print',
]);

const SafeAssetIdSchema = z
  .string()
  .trim()
  .regex(/^[a-zA-Z0-9_-]+$/)
  .max(160);

export const EventAssetSchema = z.object({
  id: z.string().trim().min(1).max(160),
  eventId: z.string().trim().min(1).max(160),
  name: z.string().trim().min(1).max(300),
  pathname: z.string().trim().min(1).max(1200),
  url: z.string().url().max(2000),
  downloadUrl: z.string().url().max(2000),
  contentType: z.enum(EVENT_ASSET_ALLOWED_CONTENT_TYPES),
  size: z.number().int().min(1).max(EVENT_ASSET_MAX_SIZE_BYTES),
  kind: EventAssetKindSchema,
  role: EventAssetRoleSchema,
  platforms: z.array(EventAssetPlatformSchema).max(9),
  status: z.enum(['draft', 'approved']),
  altText: z.string().trim().max(500),
  notes: z.string().trim().max(1200),
  rightsConfirmedAt: z.string().datetime(),
  uploadedAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  width: z.number().int().min(1).max(20000).optional(),
  height: z.number().int().min(1).max(20000).optional(),
  sourceLibraryAssetId: SafeAssetIdSchema.optional(),
  sourceLibraryDerivativeId: SafeAssetIdSchema.optional(),
});

export const EventAssetUploadPayloadSchema = z.object({
  eventId: SafeAssetIdSchema,
  assetId: SafeAssetIdSchema,
});

export const EventAssetDeleteSchema = z.object({
  eventId: SafeAssetIdSchema,
  assetId: SafeAssetIdSchema,
  fileUrl: z.string().url().max(2000),
});
