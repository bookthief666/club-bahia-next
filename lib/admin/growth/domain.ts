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

export interface CampaignBrief {
  theme: string;
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

export interface EventGrowthWorkspace {
  eventId: string;
  brief: CampaignBrief;
  readinessScore: number;
  content: CampaignContentItem[];
  milestones: CampaignMilestone[];
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
  ): Promise<CampaignGenerationResult>;
  generateItem(
    event: OperationsEvent,
    brief: CampaignBrief,
    channel: CampaignChannel,
  ): Promise<CampaignItemGenerationResult>;
}

export const CAMPAIGN_CHANNEL_LABELS: Record<CampaignChannel, string> = {
  website: 'Website',
  'instagram-feed': 'Instagram post',
  'instagram-story': 'Instagram story',
  reel: 'Reel',
  facebook: 'Facebook',
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
