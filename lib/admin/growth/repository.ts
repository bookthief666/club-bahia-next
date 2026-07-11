'use client';

import type { OperationsEvent } from '@/lib/admin/domain';
import type {
  CampaignBrief,
  CampaignContentItem,
  CampaignGenerator,
  CampaignItemStatus,
  CampaignMilestone,
  CampaignMilestoneStatus,
  EventGrowthWorkspace,
} from './domain';
import { FixtureCampaignGenerator } from './generator';

const STORAGE_KEY = 'club-bahia-growth-workspaces-v1';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function defaultBrief(event: OperationsEvent): CampaignBrief {
  return {
    theme: event.title,
    targetAudience: 'Club Bahia regulars and nearby Los Angeles nightlife audiences',
    primaryGoal: 'Increase reservations and attendance',
    tone: 'energetic, stylish, and welcoming',
    offer: 'Reserve now',
    budgetCents: 15000,
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
    manual: 0.62,
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

export interface GrowthWorkspaceRepository {
  getWorkspace(event: OperationsEvent): Promise<EventGrowthWorkspace>;
  updateBrief(event: OperationsEvent, brief: CampaignBrief): Promise<EventGrowthWorkspace>;
  generateCampaign(event: OperationsEvent, brief: CampaignBrief): Promise<EventGrowthWorkspace>;
  updateContentStatus(
    event: OperationsEvent,
    contentItemId: string,
    status: CampaignItemStatus,
  ): Promise<EventGrowthWorkspace>;
}

export class BrowserGrowthWorkspaceRepository implements GrowthWorkspaceRepository {
  constructor(private readonly generator: CampaignGenerator = new FixtureCampaignGenerator()) {}

  private readAll(): Record<string, EventGrowthWorkspace> {
    if (typeof window === 'undefined') return {};

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};

    try {
      return JSON.parse(raw) as Record<string, EventGrowthWorkspace>;
    } catch {
      return {};
    }
  }

  private writeAll(workspaces: Record<string, EventGrowthWorkspace>): void {
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
    return clone(this.readAll()[event.id] ?? emptyWorkspace(event));
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

  async updateContentStatus(
    event: OperationsEvent,
    contentItemId: string,
    status: CampaignItemStatus,
  ): Promise<EventGrowthWorkspace> {
    const current = await this.getWorkspace(event);

    const content: CampaignContentItem[] = current.content.map((item) =>
      item.id === contentItemId ? { ...item, status } : item,
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
