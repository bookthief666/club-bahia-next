import { z } from 'zod';

const SafeIdSchema = z
  .string()
  .trim()
  .regex(/^[a-zA-Z0-9_-]+$/)
  .max(160);

const VideoEditShotSchema = z.object({
  id: SafeIdSchema,
  order: z.number().int().min(0).max(20),
  startSecond: z.number().min(0).max(300),
  endSecond: z.number().min(0.01).max(300),
  description: z.string().trim().min(1).max(500),
  onScreenText: z.string().trim().max(240).optional(),
  voiceover: z.string().trim().max(500).optional(),
});

const VideoEditClipSchema = z.object({
  id: SafeIdSchema,
  sourceLibraryAssetId: SafeIdSchema,
  sourceName: z.string().trim().min(1).max(300),
  sourceUrl: z.string().url().max(2000),
  sourceDurationSeconds: z.number().positive().max(21600).optional(),
  shotId: SafeIdSchema,
  trimStartSeconds: z.number().min(0).max(21600),
  trimEndSeconds: z.number().positive().max(21600),
  muted: z.boolean(),
});

const VideoEditPlatformPackageSchema = z.object({
  platform: z.enum(['instagram-reel', 'tiktok']),
  caption: z.string().trim().max(2200),
  title: z.string().trim().max(200),
  hashtags: z.array(z.string().trim().min(1).max(100)).max(12),
  postingNotes: z.string().trim().max(1000),
  coverDerivativeId: SafeIdSchema.optional(),
});

export const VideoEditProjectSchema = z
  .object({
    schemaVersion: z.literal(1),
    eventId: SafeIdSchema,
    eventTitle: z.string().trim().min(1).max(300),
    campaignContentItemId: SafeIdSchema,
    targetDurationSeconds: z.number().min(1).max(60),
    status: z.enum(['draft', 'approved']),
    shots: z.array(VideoEditShotSchema).min(1).max(12),
    clips: z.array(VideoEditClipSchema).max(12),
    platformPackages: z.array(VideoEditPlatformPackageSchema).length(2),
    contentVersion: z.string().trim().min(1).max(80),
    approvedContentVersion: z.string().trim().min(1).max(80).optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    approvedAt: z.string().datetime().optional(),
  })
  .superRefine((project, context) => {
    const shotIds = new Set(project.shots.map((shot) => shot.id));
    if (shotIds.size !== project.shots.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['shots'],
        message: 'Shot IDs must be unique.',
      });
    }
    const clipIds = new Set(project.clips.map((clip) => clip.id));
    if (clipIds.size !== project.clips.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['clips'],
        message: 'Clip IDs must be unique.',
      });
    }
    project.clips.forEach((clip, index) => {
      if (!shotIds.has(clip.shotId)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['clips', index, 'shotId'],
          message: 'Clip shot does not exist in this project.',
        });
      }
      if (clip.trimEndSeconds <= clip.trimStartSeconds) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['clips', index, 'trimEndSeconds'],
          message: 'Clip end must be after clip start.',
        });
      }
    });
    const platforms = new Set(project.platformPackages.map((item) => item.platform));
    if (!platforms.has('instagram-reel') || !platforms.has('tiktok')) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['platformPackages'],
        message: 'Project requires Instagram Reel and TikTok packages.',
      });
    }
  });

export const VideoEditSaveSchema = z.object({
  action: z.literal('save'),
  eventId: SafeIdSchema,
  expectedRevision: z.number().int().min(0),
  project: VideoEditProjectSchema,
});

export const VideoEditApproveSchema = z.object({
  action: z.literal('approve'),
  eventId: SafeIdSchema,
  expectedRevision: z.number().int().min(0),
  project: VideoEditProjectSchema,
});

export const VideoEditReturnDraftSchema = z.object({
  action: z.literal('return-draft'),
  eventId: SafeIdSchema,
  expectedRevision: z.number().int().min(0),
  project: VideoEditProjectSchema,
});

export const VideoEditMutationSchema = z.discriminatedUnion('action', [
  VideoEditSaveSchema,
  VideoEditApproveSchema,
  VideoEditReturnDraftSchema,
]);
