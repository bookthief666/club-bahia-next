'use client';

import type { OperationsEvent } from '@/lib/admin/domain';
import type {
  CampaignBrief,
  CampaignChannel,
  CampaignContentItem,
  CampaignGenerator,
  CampaignItemStatus,
  CampaignMilestone,
  CampaignMilestoneStatus,
  EventGrowthWorkspace,
  PublishingMode,
} from './domain';
import { ApiCampaignGenerator } from './api-generator';

const STORAGE_KEY = 'club-bahia-growth-workspaces-v1';

type StoredBrief = Partial<CampaignBrief> & { primaryGoal?: string };
type StoredContentItem = Omit<Partial<CampaignContentItem>, 'status'> & {
  status?: CampaignItemStatus | 'manual';
};
type StoredWorkspace = Omit<Partial<EventGrowthWorkspace>, 'brief' | 'content'> & {
  brief?: StoredBrief;
  content?: StoredContentItem[];
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function defaultBrief(event: OperationsEvent): CampaignBrief {
  return {
    theme: event.title,
    targetAudience: 'Club Bahia regulars and nearby Los Angeles nightlife audiences',
    objective: 'reservations',
    tone: 'energetic, stylish, and welcoming',
    offer: 'Reserve now',
    budgetCents: 15000,
    language: 'bilingual',
    performers: '',
    genres: '',
    doorsTime: '',
    admission: '',
    ageRestriction: '21+',
    foodDrinkSpecial: '',
    reservationUrl: '',
    address: '1130 Sunset Blvd, Los Angeles, CA 90012',
    mainAttraction: event.concept,
  };
}

function objectiveFromLegacy(value?: string): CampaignBrief['objective'] {
  const normalized = value?.toLowerCase() ?? '';
  if (normalized.includes('ticket')) return 'ticket-sales';
  if (normalized.includes('awareness')) return 'awareness';
  if (normalized.includes('attendance')) return 'attendance';
  return 'reservations';
}

function normalizeBrief(event: OperationsEvent, stored?: StoredBrief): CampaignBrief {
  const defaults = defaultBrief(event);
  if (!stored) return defaults;

  return {
    ...defaults,
    ...stored,
    objective: stored.objective ?? objectiveFromLegacy(stored.primaryGoal),
    language: stored.language ?? defaults.language,
  };
}

function isCampaignChannel(value: unknown): value is CampaignChannel {
  return [
    'website',
    'instagram-feed',
    'instagram-story',
    'reel',
    'facebook',
    'email',
    'sms',
  ].includes(String(value));
}

function normalizeStatus(value: StoredContentItem['status']): CampaignItemStatus {
  if (value === 'approved' || value === 'scheduled' || value === 'published') return value;
  if (value === 'manual') return 'approved';
  return 'draft';
}

function normalizePublishingMode(
  channel: CampaignChannel,
  value?: PublishingMode,
): PublishingMode {
  if (value === 'automatic' || value === 'manual') return value;
  return channel === 'website' ? 'automatic' : 'manual';
}

function normalizeContentItem(item: StoredContentItem): CampaignContentItem | null {
  if (!item.id || !item.title || !item.body || !isCampaignChannel(item.channel)) return null;

  return {
    id: item.id,
    channel: item.channel,
    title: item.title,
    body: item.body,
    status: normalizeStatus(item.status),
    publishingMode: normalizePublishingMode(item.channel, item.publishingMode),
    publishAt: item.publishAt,
    callToAction: item.callToAction,
    assetPrompt: item.assetPrompt,
    updatedAt: item.updatedAt ?? new Date().toISOString(),
  };
}

function emptyWorkspace(event: OperationsEvent): EventGrowthWorkspace {
  return {
    eventId: event.id,
    brief: defaultBrief(event),
    readinessScore: 18,
    content: [],
    milestones: [],
    updatedAt: new Date().toISOString(),
  };
}

function calculateReadiness(content: CampaignContentItem[]): number {
  if (!content.length) return 18;

  const weights: Record<CampaignItemStatus, number> = {
    draft: 0.45,
    approved: 0.72,
    scheduled: 0.9,
    published: 1,
  };

  const average =
    content.reduce((sum, item) => sum + weights[item.status], 0) / content.length;

  return Math.round(average * 100);
}

function milestoneStatusForContent(status: CampaignItemStatus): CampaignMilestoneStatus {
  if (status === 'published') return 'complete';
  if (status === 'draft') return 'todo';
  return 'ready';
}

function normalizeWorkspace(
  event: OperationsEvent,
  stored?: StoredWorkspace,
): EventGrowthWorkspace {
  if (!stored) return emptyWorkspace(event);

  const content = (stored.content ?? [])
    .map(normalizeContentItem)
    .filter((item): item is CampaignContentItem => item !== null);

  return {
    eventId: event.id,
    brief: normalizeBrief(event, stored.brief),
    readinessScore: content.length ? calculateReadiness(content) : 18,
    content,
    milestones: Array.isArray(stored.milestones) ? stored.milestones : [],
    generatedAt: stored.generatedAt,
    generationProvider: stored.generationProvider,
    generationModel: stored.generationModel,
    generationWarning: stored.generationWarning,
    updatedAt: stored.updatedAt ?? new Date().toISOString(),
  };
}

const ALLOWED_TRANSITIONS: Record<CampaignItemStatus, CampaignItemStatus[]> = {
  draft: ['approved'],
  approved: ['scheduled', 'published'],
  scheduled: ['published'],
  published: [],
};

export interface GrowthWorkspaceRepository {
  getWorkspace(event: OperationsEvent): Promise<EventGrowthWorkspace>;
  updateBrief(event: OperationsEvent, brief: CampaignBrief): Promise<EventGrowthWorkspace>;
  generateCampaign(event: OperationsEvent, brief: CampaignBrief): Promise<EventGrowthWorkspace>;
  regenerateContentItem(
    event: OperationsEvent,
    contentItemId: string,
  ): Promise<EventGrowthWorkspace>;
  updateContentItem(
    event: OperationsEvent,
    contentItemId: string,
    body: string,
  ): Promise<EventGrowthWorkspace>;
  updateContentStatus(
    event: OperationsEvent,
    contentItemId: string,
    status: CampaignItemStatus,
  ): Promise<EventGrowthWorkspace>;
}

export class BrowserGrowthWorkspaceRepository implements GrowthWorkspaceRepository {
  constructor(private readonly generator: CampaignGenerator = new ApiCampaignGenerator()) {}

  private readAll(): Record<string, StoredWorkspace> {
    if (typeof window === 'undefined') return {};

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};

    try {
      return JSON.parse(raw) as Record<string, StoredWorkspace>;
    } catch {
      return {};
    }
  }

  private writeAll(workspaces: Record<string, StoredWorkspace>): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workspaces));
  }

  private save(workspace: EventGrowthWorkspace): EventGrowthWorkspace {
    const all = this.readAll();
    const next: EventGrowthWorkspace = {
      ...workspace,
      updatedAt: new Date().toISOString(),
    };

    all[workspace.eventId] = next;
    this.writeAll(all);
    return clone(next);
  }

  async getWorkspace(event: OperationsEvent): Promise<EventGrowthWorkspace> {
    return clone(normalizeWorkspace(event, this.readAll()[event.id]));
  }

  async updateBrief(
    event: OperationsEvent,
    brief: CampaignBrief,
  ): Promise<EventGrowthWorkspace> {
    const current = await this.getWorkspace(event);
    return this.save({ ...current, brief });
  }

  async generateCampaign(
    event: OperationsEvent,
    brief: CampaignBrief,
  ): Promise<EventGrowthWorkspace> {
    const generated = await this.generator.generate(event, brief);

    return this.save({
      eventId: event.id,
      brief,
      ...generated,
      generatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  async regenerateContentItem(
    event: OperationsEvent,
    contentItemId: string,
  ): Promise<EventGrowthWorkspace> {
    const current = await this.getWorkspace(event);
    const existing = current.content.find((item) => item.id === contentItemId);
    if (!existing) throw new Error('Campaign content item not found.');

    const regenerated = await this.generator.generateItem(
      event,
      current.brief,
      existing.channel,
    );

    const content = current.content.map((item) =>
      item.id === contentItemId ? regenerated : item,
    );
    const milestones = current.milestones.map((item) =>
      item.contentItemId === contentItemId ? { ...item, status: 'todo' as const } : item,
    );

    return this.save({
      ...current,
      content,
      milestones,
      readinessScore: calculateReadiness(content),
    });
  }

  async updateContentItem(
    event: OperationsEvent,
    contentItemId: string,
    body: string,
  ): Promise<EventGrowthWorkspace> {
    const current = await this.getWorkspace(event);
    const nextBody = body.trim();
    if (!nextBody) throw new Error('Content cannot be empty.');

    const content = current.content.map((item) =>
      item.id === contentItemId
        ? {
            ...item,
            body: nextBody,
            status: 'draft' as const,
            updatedAt: new Date().toISOString(),
          }
        : item,
    );
    const milestones = current.milestones.map((item) =>
      item.contentItemId === contentItemId ? { ...item, status: 'todo' as const } : item,
    );

    return this.save({
      ...current,
      content,
      milestones,
      readinessScore: calculateReadiness(content),
    });
  }

  async updateContentStatus(
    event: OperationsEvent,
    contentItemId: string,
    status: CampaignItemStatus,
  ): Promise<EventGrowthWorkspace> {
    const current = await this.getWorkspace(event);
    const existing = current.content.find((item) => item.id === contentItemId);
    if (!existing) throw new Error('Campaign content item not found.');

    if (
      existing.status !== status &&
      !ALLOWED_TRANSITIONS[existing.status].includes(status)
    ) {
      throw new Error(`Cannot move content from ${existing.status} to ${status}.`);
    }

    const content: CampaignContentItem[] = current.content.map((item) =>
      item.id === contentItemId
        ? { ...item, status, updatedAt: new Date().toISOString() }
        : item,
    );

    const milestones: CampaignMilestone[] = current.milestones.map((item) =>
      item.contentItemId === contentItemId
        ? { ...item, status: milestoneStatusForContent(status) }
        : item,
    );

    return this.save({
      ...current,
      content,
      milestones,
      readinessScore: calculateReadiness(content),
    });
  }
}

export const growthWorkspaceRepository = new BrowserGrowthWorkspaceRepository();
