import { z } from 'zod';

export const CampaignChannelSchema = z.enum([
  'website',
  'instagram-feed',
  'instagram-story',
  'reel',
  'facebook',
  'email',
  'sms',
]);

export const CampaignBriefSchema = z.object({
  theme: z.string().trim().min(1).max(160),
  targetAudience: z.string().trim().min(1).max(500),
  objective: z.enum(['reservations', 'ticket-sales', 'attendance', 'awareness']),
  tone: z.string().trim().min(1).max(300),
  offer: z.string().trim().min(1).max(240),
  budgetCents: z.number().int().min(0).max(10_000_000),
  language: z.enum(['english', 'spanish', 'bilingual']),
  performers: z.string().trim().max(500),
  genres: z.string().trim().max(300),
  doorsTime: z.string().trim().max(160),
  admission: z.string().trim().max(160),
  ageRestriction: z.string().trim().max(80),
  foodDrinkSpecial: z.string().trim().max(300),
  reservationUrl: z.string().trim().max(500),
  address: z.string().trim().max(300),
  mainAttraction: z.string().trim().min(1).max(600),
});

export const CampaignHashtagGroupsSchema = z.object({
  branded: z.array(z.string().trim().min(1).max(100)).max(12),
  localDiscovery: z.array(z.string().trim().min(1).max(100)).max(12),
  musicCommunity: z.array(z.string().trim().min(1).max(100)).max(12),
});

export const CampaignStoryFrameSchema = z.object({
  frame: z.number().int().min(1).max(20),
  text: z.string().trim().min(1).max(500),
  visualDirection: z.string().trim().max(700).optional(),
  interaction: z.string().trim().max(300).optional(),
});

export const CampaignReelShotSchema = z
  .object({
    startSecond: z.number().int().min(0).max(180),
    endSecond: z.number().int().min(1).max(180),
    shot: z.string().trim().min(1).max(700),
    onScreenText: z.string().trim().max(300).optional(),
    voiceover: z.string().trim().max(700).optional(),
  })
  .refine((shot) => shot.endSecond > shot.startSecond, {
    message: 'Reel shot must end after it starts.',
  });

export const CampaignShortVideoVariantSchema = z.object({
  platform: z.enum(['instagram-reel', 'tiktok']),
  caption: z.string().trim().min(1).max(2200),
  title: z.string().trim().max(300).optional(),
  hashtags: z.array(z.string().trim().min(1).max(100)).max(12).optional(),
  postingNotes: z.string().trim().max(700).optional(),
});

export const CampaignStructuredContentSchema = z.object({
  primaryHook: z.string().trim().max(500).optional(),
  alternativeHooks: z.array(z.string().trim().min(1).max(500)).max(8).optional(),
  shortCaption: z.string().trim().max(1500).optional(),
  standardCaption: z.string().trim().max(5000).optional(),
  longCaption: z.string().trim().max(7000).optional(),
  hashtags: CampaignHashtagGroupsSchema.optional(),
  storyFrames: z.array(CampaignStoryFrameSchema).max(12).optional(),
  reelShots: z.array(CampaignReelShotSchema).max(20).optional(),
  reelVoiceover: z.string().trim().max(2500).optional(),
  reelThumbnailText: z.string().trim().max(160).optional(),
  shortVideoVariants: z
    .array(CampaignShortVideoVariantSchema)
    .max(4)
    .optional(),
  emailSubjects: z.array(z.string().trim().min(1).max(300)).max(8).optional(),
  emailPreheader: z.string().trim().max(500).optional(),
  smsVariants: z.array(z.string().trim().min(1).max(300)).max(6).optional(),
  altText: z.string().trim().max(1000).optional(),
});

export const OperationsEventSchema = z.object({
  id: z.string().trim().min(1).max(160),
  title: z.string().trim().min(1).max(200),
  concept: z.string().trim().max(1200),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  status: z.enum([
    'idea',
    'evaluating',
    'approved',
    'announced',
    'on-sale',
    'final-prep',
    'live',
    'completed',
    'reviewed',
    'cancelled',
    'archived',
  ]),
  room: z.string().trim().min(1).max(160),
  capacityTarget: z.number().int().min(0).max(100_000),
  ticketsSold: z.number().int().min(0).max(100_000),
  owner: z.string().trim().max(160),
  marketingLaunchAt: z.string().datetime(),
  riskFlags: z.array(z.string().trim().max(300)).max(30),
  revenueTarget: z.number().int().min(0).max(1_000_000_000),
  committedCosts: z.number().int().min(0).max(1_000_000_000),
  archivedAt: z.string().datetime().optional(),
  cancelledAt: z.string().datetime().optional(),
  cancellationReason: z.string().trim().max(1000).optional(),
  completedAt: z.string().datetime().optional(),
  liveAt: z.string().datetime().optional(),
});

const BaseGenerationRequestSchema = z.object({
  event: OperationsEventSchema,
  brief: CampaignBriefSchema,
});

export const CampaignGenerationRequestSchema = z.discriminatedUnion('mode', [
  BaseGenerationRequestSchema.extend({ mode: z.literal('campaign') }),
  BaseGenerationRequestSchema.extend({
    mode: z.literal('item'),
    channel: CampaignChannelSchema,
  }),
]);

export const AiCampaignItemSchema = z.object({
  channel: CampaignChannelSchema,
  body: z.string().trim().min(1).max(7000),
  callToAction: z.string().trim().max(300),
  assetPrompt: z.string().trim().max(1600),
});

export const AiCampaignSchema = z.object({
  content: z.array(AiCampaignItemSchema).length(7),
});

export const CampaignContentItemSchema = z.object({
  id: z.string().trim().min(1).max(160),
  channel: CampaignChannelSchema,
  title: z.string().trim().min(1).max(300),
  body: z.string().trim().min(1).max(7000),
  status: z.enum(['draft', 'approved', 'scheduled', 'published']),
  publishingMode: z.enum(['automatic', 'manual']),
  publishAt: z.string().datetime().optional(),
  callToAction: z.string().trim().max(300).optional(),
  assetPrompt: z.string().trim().max(1600).optional(),
  structured: CampaignStructuredContentSchema.optional(),
  updatedAt: z.string().datetime(),
});

export const CampaignMilestoneSchema = z.object({
  id: z.string().trim().min(1).max(200),
  title: z.string().trim().min(1).max(500),
  dueAt: z.string().datetime(),
  status: z.enum(['todo', 'ready', 'complete']),
  channel: CampaignChannelSchema.optional(),
  contentItemId: z.string().trim().max(160).optional(),
});

const CampaignGenerationMetaSchema = z.object({
  provider: z.enum(['openai', 'fixture']),
  model: z.string().trim().max(200).optional(),
  warning: z.string().trim().max(1000).optional(),
});

export const CampaignGenerationResultSchema = z
  .object({
    content: z.array(CampaignContentItemSchema).length(7),
    milestones: z.array(CampaignMilestoneSchema).length(7),
    readinessScore: z.number().int().min(0).max(100),
  })
  .and(CampaignGenerationMetaSchema);

export const CampaignItemGenerationResultSchema = z
  .object({ item: CampaignContentItemSchema })
  .and(CampaignGenerationMetaSchema);

export const CAMPAIGN_CHANNELS = CampaignChannelSchema.options;

export const AI_CAMPAIGN_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['content'],
  properties: {
    content: {
      type: 'array',
      minItems: 7,
      maxItems: 7,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['channel', 'body', 'callToAction', 'assetPrompt'],
        properties: {
          channel: { type: 'string', enum: CAMPAIGN_CHANNELS },
          body: { type: 'string' },
          callToAction: { type: 'string' },
          assetPrompt: { type: 'string' },
        },
      },
    },
  },
} as const;

export const AI_CAMPAIGN_ITEM_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['channel', 'body', 'callToAction', 'assetPrompt'],
  properties: {
    channel: { type: 'string', enum: CAMPAIGN_CHANNELS },
    body: { type: 'string' },
    callToAction: { type: 'string' },
    assetPrompt: { type: 'string' },
  },
} as const;
