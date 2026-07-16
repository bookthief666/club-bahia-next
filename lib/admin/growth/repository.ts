'use client';

import type { OperationsEvent } from '@/lib/admin/domain';
import { getVenueFact } from '@/lib/admin/venue-intelligence/profile';
import {
  canUseSharedWorkspaceStorage,
  loadOrMigrateSharedWorkspace,
  saveSharedWorkspace,
  SharedWorkspaceConflictError,
} from '@/lib/admin/workspaces/client';
import type {
  CampaignBrief,
  CampaignChannel,
  CampaignContentItem,
  CampaignGenerator,
  CampaignItemStatus,
  CampaignMilestone,
  CampaignMilestoneStatus,
  CampaignRevision,
  EventGrowthWorkspace,
  PublishingMode,
} from './domain';
import { ApiCampaignGenerator } from './api-generator';
import { CampaignStructuredContentSchema } from './validation';

const STORAGE_KEY = 'club-bahia-growth-workspaces-v1';
export const GROWTH_WORKSPACE_UPDATED_EVENT = 'club-bahia-growth-workspace-updated';
const MAX_REVISIONS = 5;

type StoredBrief = Partial<CampaignBrief> & { primaryGoal?: string };
type StoredContentItem = Omit<Partial<CampaignContentItem>, 'status'> & {
  status?: CampaignItemStatus | 'manual';
};
type StoredRevision = Omit<Partial<CampaignRevision>, 'brief' | 'content'> & {
  brief?: StoredBrief;
  content?: StoredContentItem[];
};
type StoredWorkspace = Omit<Partial<EventGrowthWorkspace>, 'brief' | 'content' | 'history'> & {
  brief?: StoredBrief;
  content?: StoredContentItem[];
  history?: StoredRevision[];
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function defaultBrief(event: OperationsEvent): CampaignBrief {
  return {
    theme: event.title,
    publicSubtitle: '',
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
    ageRestriction: getVenueFact('age-policy')?.value ?? '',
    foodDrinkSpecial: '',
    reservationUrl: '',
    address: getVenueFact('address')?.value ?? '',
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
    publicSubtitle: stored.publicSubtitle ?? '',
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

  const structured = CampaignStructuredContentSchema.safeParse(item.structured);

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
    structured: structured.success ? structured.data : undefined,
    updatedAt: item.updatedAt ?? new Date().toISOString(),
  };
}

function normalizeRevision(
  event: OperationsEvent,
  stored: StoredRevision,
): CampaignRevision | null {
  if (!stored.id || !stored.generatedAt || !stored.brief) return null;

  const content = (stored.content ?? [])
    .map(normalizeContentItem)
    .filter((item): item is CampaignContentItem => item !== null);

  if (!content.length) return null;

  return {
    id: stored.id,
    generatedAt: stored.generatedAt,
    provider: stored.provider,
    model: stored.model,
    brief: normalizeBrief(event, stored.brief),
    content,
  };
}

function emptyWorkspace(event: OperationsEvent): EventGrowthWorkspace {
  return {
    eventId: event.id,
    brief: defaultBrief(event),
    readinessScore: 18,
    content: [],
    milestones: [],
    history: [],
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

function milestonesForContent(content: CampaignContentItem[]): CampaignMilestone[] {
  return content.map((item) => ({
    id: `milestone-${item.id}`,
    title: `Review ${item.title.toLowerCase()}`,
    dueAt: item.publishAt ?? new Date().toISOString(),
    status: milestoneStatusForContent(item.status),
    channel: item.channel,
    contentItemId: item.id,
  }));
}

function normalizeWorkspace(
  event: OperationsEvent,
  stored?: StoredWorkspace,
): EventGrowthWorkspace {
  if (!stored) return emptyWorkspace(event);

  const content = (stored.content ?? [])
    .map(normalizeContentItem)
    .filter((item): item is CampaignContentItem => item !== null);
  const history = (stored.history ?? [])
    .map((revision) => normalizeRevision(event, revision))
    .filter((revision): revision is CampaignRevision => revision !== null)
    .slice(0, MAX_REVISIONS);

  return {
    eventId: event.id,
    brief: normalizeBrief(event, stored.brief),
    readinessScore: content.length ? calculateReadiness(content) : 18,
    content,
    milestones: Array.isArray(stored.milestones)
      ? stored.milestones
      : milestonesForContent(content),
    history,
    generatedAt: stored.generatedAt,
    generationProvider: stored.generationProvider,
    generationModel: stored.generationModel,
    generationWarning: stored.generationWarning,
    updatedAt: stored.updatedAt ?? new Date().toISOString(),
  };
}

function snapshotWorkspace(workspace: EventGrowthWorkspace): CampaignRevision {
  return {
    id: `revision-${Date.now()}`,
    generatedAt: workspace.generatedAt ?? workspace.updatedAt,
    provider: workspace.generationProvider,
    model: workspace.generationModel,
    brief: clone(workspace.brief),
    content: clone(workspace.content),
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
  restoreRevision(event: OperationsEvent, revisionId: string): Promise<EventGrowthWorkspace>;
}

export class BrowserGrowthWorkspaceRepository implements GrowthWorkspaceRepository {
  private readonly sharedRevisions = new Map<string, number>();

  constructor(private readonly generator: CampaignGenerator = new ApiCampaignGenerator()) {}

  private readAllLocal(): Record<string, StoredWorkspace> {
    if (typeof window === 'undefined') return {};

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};

    try {
      return JSON.parse(raw) as Record<string, StoredWorkspace>;
    } catch {
      return {};
    }
  }

  private writeAllLocal(workspaces: Record<string, StoredWorkspace>): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workspaces));
  }

  private clearLegacy(eventId: string): void {
    const all = this.readAllLocal();
    if (!(eventId in all)) return;
    delete all[eventId];
    if (Object.keys(all).length) this.writeAllLocal(all);
    else window.localStorage.removeItem(STORAGE_KEY);
  }

  private notify(eventId: string): void {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(
      new CustomEvent(GROWTH_WORKSPACE_UPDATED_EVENT, { detail: { eventId } }),
    );
  }

  private async save(workspace: EventGrowthWorkspace): Promise<EventGrowthWorkspace> {
    const next: EventGrowthWorkspace = {
      ...workspace,
      updatedAt: new Date().toISOString(),
    };

    if (!canUseSharedWorkspaceStorage()) {
      const all = this.readAllLocal();
      all[workspace.eventId] = next;
      this.writeAllLocal(all);
      this.notify(workspace.eventId);
      return clone(next);
    }

    try {
      const record = await saveSharedWorkspace({
        kind: 'growth',
        key: workspace.eventId,
        value: next,
        expectedRevision: this.sharedRevisions.get(workspace.eventId) ?? 0,
      });
      this.sharedRevisions.set(workspace.eventId, record.revision);
      this.notify(workspace.eventId);
      return clone(record.value);
    } catch (error) {
      if (error instanceof SharedWorkspaceConflictError) {
        throw new Error(
          'This promotion changed in another browser. Reload before saving again.',
        );
      }
      throw error;
    }
  }

  async getWorkspace(event: OperationsEvent): Promise<EventGrowthWorkspace> {
    if (!canUseSharedWorkspaceStorage()) {
      return clone(normalizeWorkspace(event, this.readAllLocal()[event.id]));
    }

    const legacy = this.readAllLocal()[event.id];
    const record = await loadOrMigrateSharedWorkspace<StoredWorkspace>({
      kind: 'growth',
      key: event.id,
      legacyValue: legacy,
    });
    this.sharedRevisions.set(event.id, record?.revision ?? 0);
    if (record && legacy) this.clearLegacy(event.id);
    return clone(normalizeWorkspace(event, record?.value));
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
    const current = await this.getWorkspace(event);
    const generated = await this.generator.generate(event, brief);
    const generationMeta = generated as Partial<EventGrowthWorkspace>;
    const history = current.content.length
      ? [snapshotWorkspace(current), ...current.history].slice(0, MAX_REVISIONS)
      : current.history;

    return this.save({
      eventId: event.id,
      brief,
      ...generated,
      history,
      generationProvider: generationMeta.generationProvider,
      generationModel: generationMeta.generationModel,
      generationWarning: generationMeta.generationWarning,
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
    if (!existing) throw new Error('Promotional item not found.');

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
    if (!nextBody) throw new Error('Promotional copy cannot be empty.');

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
    if (!existing) throw new Error('Promotional item not found.');

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

  async restoreRevision(
    event: OperationsEvent,
    revisionId: string,
  ): Promise<EventGrowthWorkspace> {
    const current = await this.getWorkspace(event);
    const revision = current.history.find((item) => item.id === revisionId);
    if (!revision) throw new Error('Previous promotion version not found.');

    const currentSnapshot = current.content.length ? snapshotWorkspace(current) : null;
    const remainingHistory = current.history.filter((item) => item.id !== revisionId);
    const history = [
      ...(currentSnapshot ? [currentSnapshot] : []),
      ...remainingHistory,
    ].slice(0, MAX_REVISIONS);
    const content = clone(revision.content).map((item) => ({
      ...item,
      status: 'draft' as const,
      updatedAt: new Date().toISOString(),
    }));

    return this.save({
      ...current,
      brief: clone(revision.brief),
      content,
      milestones: milestonesForContent(content),
      readinessScore: calculateReadiness(content),
      history,
      generatedAt: revision.generatedAt,
      generationProvider: revision.provider,
      generationModel: revision.model,
      generationWarning: undefined,
    });
  }
}

export const growthWorkspaceRepository = new BrowserGrowthWorkspaceRepository();
