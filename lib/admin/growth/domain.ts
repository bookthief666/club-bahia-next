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
  | 'published'
  | 'manual';

export type CampaignMilestoneStatus = 'todo' | 'ready' | 'complete';

export interface CampaignBrief {
  theme: string;
  targetAudience: string;
  primaryGoal: string;
  tone: string;
  offer: string;
  budgetCents: number;
}

export interface CampaignContentItem {
  id: string;
  channel: CampaignChannel;
  title: string;
  body: string;
  status: CampaignItemStatus;
  publishAt?: string;
  callToAction?: string;
  assetPrompt?: string;
}

export interface CampaignMilestone {
  id: string;
  title: string;
  dueAt: string;
  status: CampaignMilestoneStatus;
  channel?: CampaignChannel;
  contentItemId?: string;
}

export interface EventGrowthWorkspace {
  eventId: string;
  brief: CampaignBrief;
  readinessScore: number;
  content: CampaignContentItem[];
  milestones: CampaignMilestone[];
  updatedAt: string;
  generatedAt?: string;
}

export interface CampaignGenerator {
  generate(
    event: OperationsEvent,
    brief: CampaignBrief,
  ): Promise<Pick<EventGrowthWorkspace, 'content' | 'milestones' | 'readinessScore'>>;
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
