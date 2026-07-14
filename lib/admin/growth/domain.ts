import type { OperationsEvent } from '@/lib/admin/domain';

export type CampaignChannel =
  | 'website'
  | 'instagram-feed'
  | 'instagram-story'
  | 'reel'
  | 'facebook'
  | 'email'
  | 'sms';

export type CampaignItemStatus =
  | 'draft'
  | 'approved'
  | 'scheduled'
  | 'published';

export type CampaignMilestoneStatus = 'todo' | 'ready' | 'complete';
export type CampaignLanguage = 'english' | 'spanish' | 'bilingual';
export type CampaignObjective = 'reservations' | 'ticket-sales' | 'attendance' | 'awareness';
export type PublishingMode = 'automatic' | 'manual';
export type CampaignGenerationProvider = 'openai' | 'fixture';
export type CampaignQualitySeverity = 'error' | 'warning' | 'info';
export type ShortVideoPlatform = 'instagram-reel' | 'tiktok';

export interface CampaignBrief {
  theme: string;
  /** Legacy preview-only field retained solely to migrate old browser records. */
  publicSubtitle?: string;
  targetAudience: string;
  objective: CampaignObjective;
  tone: string;
  offer: string;
  budgetCents: number;
  language: CampaignLanguage;
  performers: string;
  genres: string;
  doorsTime: string;
  admission: string;
  ageRestriction: string;
  foodDrinkSpecial: string;
  reservationUrl: string;
  address: string;
  mainAttraction: string;
}

export interface CampaignHashtagGroups {
  branded: string[];
  localDiscovery: string[];
  musicCommunity: string[];
}

export interface CampaignStoryFrame {
  frame: number;
  text: string;
  visualDirection?: string;
  interaction?: string;
}

export interface CampaignReelShot {
  startSecond: number;
  endSecond: number;
  shot: string;
  onScreenText?: string;
  voiceover?: string;
}

export interface CampaignShortVideoVariant {
  platform: ShortVideoPlatform;
  caption: string;
  title?: string;
  hashtags?: string[];
  postingNotes?: string;
}

export interface CampaignStructuredContent {
  primaryHook?: string;
  alternativeHooks?: string[];
  shortCaption?: string;
  standardCaption?: string;
  longCaption?: string;
  hashtags?: CampaignHashtagGroups;
  storyFrames?: CampaignStoryFrame[];
  reelShots?: CampaignReelShot[];
  reelVoiceover?: string;
  reelThumbnailText?: string;
  shortVideoVariants?: CampaignShortVideoVariant[];
  emailSubjects?: string[];
  emailPreheader?: string;
  smsVariants?: string[];
  altText?: string;
}

export interface CampaignContentItem {
  id: string;
  channel: CampaignChannel;
  title: string;
  body: string;
  status: CampaignItemStatus;
  publishingMode: PublishingMode;
  publishAt?: string;
  callToAction?: string;
  assetPrompt?: string;
  structured?: CampaignStructuredContent;
  updatedAt: string;
}

export interface CampaignMilestone {
  id: string;
  title: string;
  dueAt: string;
  status: CampaignMilestoneStatus;
  channel?: CampaignChannel;
  contentItemId?: string;
}

export interface CampaignGenerationMeta {
  provider: CampaignGenerationProvider;
  model?: string;
  warning?: string;
}

export interface CampaignRevision {
  id: string;
  generatedAt: string;
  provider?: CampaignGenerationProvider;
  model?: string;
  brief: CampaignBrief;
  content: CampaignContentItem[];
}

export interface CampaignQualityIssue {
  id: string;
  severity: CampaignQualitySeverity;
  title: string;
  detail: string;
  channel?: CampaignChannel;
}

export interface CampaignQualityReport {
  score: number;
  issues: CampaignQualityIssue[];
}

export interface EventGrowthWorkspace {
  eventId: string;
  brief: CampaignBrief;
  readinessScore: number;
  content: CampaignContentItem[];
  milestones: CampaignMilestone[];
  history: CampaignRevision[];
  updatedAt: string;
  generatedAt?: string;
  generationProvider?: CampaignGenerationProvider;
  generationModel?: string;
  generationWarning?: string;
}

export type CampaignGenerationResult = Pick<
  EventGrowthWorkspace,
  'content' | 'milestones' | 'readinessScore'
> & CampaignGenerationMeta;

export interface CampaignItemGenerationResult extends CampaignGenerationMeta {
  item: CampaignContentItem;
}

export interface CampaignGenerator {
  generate(
    event: OperationsEvent,
    brief: CampaignBrief,
  ): Promise<Pick<EventGrowthWorkspace, 'content' | 'milestones' | 'readinessScore'>>;
  generateItem(
    event: OperationsEvent,
    brief: CampaignBrief,
    channel: CampaignChannel,
  ): Promise<CampaignContentItem>;
}

export const CAMPAIGN_CHANNEL_LABELS: Record<CampaignChannel, string> = {
  website: 'Website',
  'instagram-feed': 'Instagram post',
  'instagram-story': 'Instagram story',
  reel: 'Vertical video',
  facebook: 'Facebook cross-post',
  email: 'Email',
  sms: 'SMS',
};

export const CAMPAIGN_OBJECTIVE_LABELS: Record<CampaignObjective, string> = {
  reservations: 'Increase reservations',
  'ticket-sales': 'Increase ticket sales',
  attendance: 'Increase attendance',
  awareness: 'Build awareness',
};

export const CAMPAIGN_LANGUAGE_LABELS: Record<CampaignLanguage, string> = {
  english: 'English',
  spanish: 'Spanish',
  bilingual: 'Bilingual',
};
