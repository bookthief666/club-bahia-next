'use client';

import type { CampaignChannel } from '@/lib/admin/growth/domain';
import type {
  CampaignPostPackage,
  EventPostAssembly,
} from '@/lib/admin/publishing/domain';
import { emptyEventPostAssembly } from '@/lib/admin/publishing/domain';

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
  private readAll(): Record<string, Partial<EventPostAssembly>> {
    if (typeof window === 'undefined') return {};
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};

    try {
      return JSON.parse(raw) as Record<string, Partial<EventPostAssembly>>;
    } catch {
      return {};
    }
  }

  private save(assembly: EventPostAssembly): EventPostAssembly {
    const next = {
      ...assembly,
      updatedAt: new Date().toISOString(),
    };
    const all = this.readAll();
    all[assembly.eventId] = next;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    window.dispatchEvent(
      new CustomEvent(POST_ASSEMBLY_UPDATED_EVENT, {
        detail: { eventId: assembly.eventId },
      }),
    );
    return clone(next);
  }

  async get(eventId: string): Promise<EventPostAssembly> {
    return clone(normalizeAssembly(eventId, this.readAll()[eventId]));
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
