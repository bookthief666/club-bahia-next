'use client';

import type { CampaignChannel } from '@/lib/admin/growth/domain';
import type {
  CampaignPostPackage,
  EventPostAssembly,
} from '@/lib/admin/publishing/domain';
import { emptyEventPostAssembly } from '@/lib/admin/publishing/domain';
import {
  canUseSharedWorkspaceStorage,
  loadOrMigrateSharedWorkspace,
  saveSharedWorkspace,
  SharedWorkspaceConflictError,
} from '@/lib/admin/workspaces/client';

const STORAGE_KEY = 'club-bahia-post-assembly-v1';
export const POST_ASSEMBLY_UPDATED_EVENT = 'club-bahia-post-assembly-updated';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function normalizePackage(value: Partial<CampaignPostPackage>): CampaignPostPackage | null {
  if (!value.contentItemId || !value.channel) return null;

  const assetIds = Array.isArray(value.assetIds)
    ? value.assetIds.filter((assetId): assetId is string => typeof assetId === 'string')
    : [];

  return {
    contentItemId: value.contentItemId,
    channel: value.channel as CampaignChannel,
    assetIds,
    primaryAssetId:
      value.primaryAssetId && assetIds.includes(value.primaryAssetId)
        ? value.primaryAssetId
        : assetIds[0],
    updatedAt: value.updatedAt ?? new Date().toISOString(),
  };
}

function normalizeAssembly(
  eventId: string,
  value?: Partial<EventPostAssembly>,
): EventPostAssembly {
  if (!value) return emptyEventPostAssembly(eventId);

  return {
    eventId,
    packages: Array.isArray(value.packages)
      ? value.packages
          .map(normalizePackage)
          .filter((item): item is CampaignPostPackage => item !== null)
      : [],
    updatedAt: value.updatedAt ?? new Date().toISOString(),
  };
}

export interface PostAssemblyRepository {
  get(eventId: string): Promise<EventPostAssembly>;
  assignPrimaryAsset(
    eventId: string,
    contentItemId: string,
    channel: CampaignChannel,
    assetId?: string,
  ): Promise<EventPostAssembly>;
  replace(eventId: string, assembly: EventPostAssembly): Promise<EventPostAssembly>;
}

export class BrowserPostAssemblyRepository implements PostAssemblyRepository {
  private readonly sharedRevisions = new Map<string, number>();

  private readAllLocal(): Record<string, Partial<EventPostAssembly>> {
    if (typeof window === 'undefined') return {};
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};

    try {
      return JSON.parse(raw) as Record<string, Partial<EventPostAssembly>>;
    } catch {
      return {};
    }
  }

  private writeAllLocal(all: Record<string, Partial<EventPostAssembly>>): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
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
      new CustomEvent(POST_ASSEMBLY_UPDATED_EVENT, {
        detail: { eventId },
      }),
    );
  }

  private async save(assembly: EventPostAssembly): Promise<EventPostAssembly> {
    const next = {
      ...assembly,
      updatedAt: new Date().toISOString(),
    };

    if (!canUseSharedWorkspaceStorage()) {
      const all = this.readAllLocal();
      all[assembly.eventId] = next;
      this.writeAllLocal(all);
      this.notify(assembly.eventId);
      return clone(next);
    }

    try {
      const record = await saveSharedWorkspace({
        kind: 'post-assembly',
        key: assembly.eventId,
        value: next,
        expectedRevision: this.sharedRevisions.get(assembly.eventId) ?? 0,
      });
      this.sharedRevisions.set(assembly.eventId, record.revision);
      this.notify(assembly.eventId);
      return clone(normalizeAssembly(assembly.eventId, record.value));
    } catch (error) {
      if (error instanceof SharedWorkspaceConflictError) {
        throw new Error(
          'Post assignments changed in another browser. Reload before saving again.',
        );
      }
      throw error;
    }
  }

  async get(eventId: string): Promise<EventPostAssembly> {
    if (!canUseSharedWorkspaceStorage()) {
      return clone(normalizeAssembly(eventId, this.readAllLocal()[eventId]));
    }

    const legacy = this.readAllLocal()[eventId];
    const record = await loadOrMigrateSharedWorkspace<Partial<EventPostAssembly>>({
      kind: 'post-assembly',
      key: eventId,
      legacyValue: legacy,
    });
    this.sharedRevisions.set(eventId, record?.revision ?? 0);
    if (record && legacy) this.clearLegacy(eventId);
    return clone(normalizeAssembly(eventId, record?.value));
  }

  async assignPrimaryAsset(
    eventId: string,
    contentItemId: string,
    channel: CampaignChannel,
    assetId?: string,
  ): Promise<EventPostAssembly> {
    const current = await this.get(eventId);
    const existing = current.packages.find(
      (item) => item.contentItemId === contentItemId,
    );
    const nextPackage: CampaignPostPackage = {
      contentItemId,
      channel,
      assetIds: assetId ? [assetId] : [],
      primaryAssetId: assetId,
      updatedAt: new Date().toISOString(),
    };
    const packages = existing
      ? current.packages.map((item) =>
          item.contentItemId === contentItemId ? nextPackage : item,
        )
      : [...current.packages, nextPackage];

    return this.save({ ...current, packages });
  }

  async replace(
    eventId: string,
    assembly: EventPostAssembly,
  ): Promise<EventPostAssembly> {
    return this.save({ ...assembly, eventId });
  }
}

export const postAssemblyRepository = new BrowserPostAssemblyRepository();
