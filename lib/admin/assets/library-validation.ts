import { z } from 'zod';
import { MEDIA_DERIVATIVE_PRESETS } from './derivatives';
import {
  EventAssetKindSchema,
  EventAssetPlatformSchema,
  EventAssetRoleSchema,
  EventAssetSchema,
} from './validation';

const SafeLibraryIdSchema = z
  .string()
  .trim()
  .regex(/^[a-zA-Z0-9_-]+$/)
  .max(160);

const MediaLibraryCollectionSchema = z.enum([
  'club-bahia-evergreen',
  'venue-exterior',
  'venue-interior',
  'crowd-energy',
  'live-band',
  'azucar-friday',
  'azucar-saturday',
  'bahia-nocturna',
  'performers',
  'logos-brand',
]);

const MediaOrientationSchema = z.enum([
  'square',
  'portrait',
  'landscape',
  'vertical-video',
  'unknown',
]);

const MediaRightsBasisSchema = z.enum([
  'club-bahia-owned',
  'performer-provided',
  'photographer-permission',
  'licensed',
  'other-confirmed',
]);

export const MediaDerivativePresetSchema = z.enum(
  MEDIA_DERIVATIVE_PRESETS.map((preset) => preset.id) as [
    (typeof MEDIA_DERIVATIVE_PRESETS)[number]['id'],
    ...(typeof MEDIA_DERIVATIVE_PRESETS)[number]['id'][],
  ],
);

export const MediaDerivativeSchema = z.object({
  id: SafeLibraryIdSchema,
  presetId: MediaDerivativePresetSchema,
  sourceAssetId: SafeLibraryIdSchema,
  pathname: z.string().trim().min(1).max(1200),
  url: z.string().url().max(2000),
  downloadUrl: z.string().url().max(2000),
  contentType: z.literal('image/jpeg'),
  size: z.number().int().min(1).max(25 * 1024 * 1024),
  width: z.number().int().min(1).max(5000),
  height: z.number().int().min(1).max(5000),
  focalX: z.number().min(0).max(1),
  focalY: z.number().min(0).max(1),
  zoom: z.number().min(1).max(3),
  frameTimeSeconds: z.number().min(0).max(21600).optional(),
  status: z.enum(['draft', 'approved']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const MediaLibraryUsageSchema = z.object({
  eventId: z.string().trim().min(1).max(160),
  eventTitle: z.string().trim().min(1).max(300),
  platform: EventAssetPlatformSchema.optional(),
  usedAt: z.string().datetime(),
});

export const MediaLibraryAssetSchema = z.object({
  schemaVersion: z.literal(1),
  id: SafeLibraryIdSchema,
  sourceEventId: z.string().trim().min(1).max(160),
  sourceAssetId: z.string().trim().min(1).max(160),
  name: z.string().trim().min(1).max(300),
  pathname: z.string().trim().min(1).max(1200),
  url: z.string().url().max(2000),
  downloadUrl: z.string().url().max(2000),
  contentType: z.string().trim().min(1).max(160),
  size: z.number().int().min(1).max(250 * 1024 * 1024),
  kind: EventAssetKindSchema,
  role: EventAssetRoleSchema,
  platforms: z.array(EventAssetPlatformSchema).max(9),
  status: z.enum(['active', 'archived']),
  altText: z.string().trim().max(500),
  notes: z.string().trim().max(1200),
  collections: z.array(MediaLibraryCollectionSchema).max(10),
  tags: z.array(z.string().trim().min(1).max(80)).max(30),
  performers: z.array(z.string().trim().min(1).max(160)).max(20),
  genres: z.array(z.string().trim().min(1).max(120)).max(20),
  orientation: MediaOrientationSchema,
  width: z.number().int().min(1).max(20000).optional(),
  height: z.number().int().min(1).max(20000).optional(),
  durationSeconds: z.number().min(0.1).max(21600).optional(),
  qualityRating: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
  ]),
  rightsBasis: MediaRightsBasisSchema,
  rightsNote: z.string().trim().max(1000),
  credit: z.string().trim().max(300),
  rightsConfirmedAt: z.string().datetime(),
  capturedAt: z.string().datetime().optional(),
  derivatives: z.array(MediaDerivativeSchema).max(20).default([]),
  usageHistory: z.array(MediaLibraryUsageSchema).max(200),
  usageCount: z.number().int().min(0).max(100000),
  lastUsedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const MediaLibraryImportSchema = z.object({
  action: z.literal('import-event-asset'),
  eventTitle: z.string().trim().min(1).max(300),
  asset: EventAssetSchema,
});

export const MediaLibraryUpsertSchema = z.object({
  action: z.literal('upsert'),
  asset: MediaLibraryAssetSchema,
});

export const MediaLibraryDerivativeSaveSchema = z.object({
  action: z.literal('save-derivative'),
  libraryAssetId: SafeLibraryIdSchema,
  derivative: MediaDerivativeSchema,
});

export const MediaLibraryAssignSchema = z.object({
  action: z.literal('assign-to-event'),
  libraryAssetId: SafeLibraryIdSchema,
  derivativeId: SafeLibraryIdSchema.optional(),
  eventId: SafeLibraryIdSchema,
  eventTitle: z.string().trim().min(1).max(300),
  platform: EventAssetPlatformSchema.optional(),
  role: EventAssetRoleSchema.optional(),
});

export const MediaLibraryArchiveSchema = z.object({
  action: z.literal('archive'),
  libraryAssetId: SafeLibraryIdSchema,
});

export const MediaLibraryMutationSchema = z.discriminatedUnion('action', [
  MediaLibraryImportSchema,
  MediaLibraryUpsertSchema,
  MediaLibraryDerivativeSaveSchema,
  MediaLibraryAssignSchema,
  MediaLibraryArchiveSchema,
]);

export const MediaDerivativeUploadPayloadSchema = z.object({
  libraryAssetId: SafeLibraryIdSchema,
  presetId: MediaDerivativePresetSchema,
});

export type MediaLibraryMutation = z.infer<typeof MediaLibraryMutationSchema>;
