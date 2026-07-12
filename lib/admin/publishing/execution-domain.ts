import type { EventAsset } from '@/lib/admin/assets/domain';
import type {
  CampaignBrief,
  CampaignChannel,
  CampaignContentItem,
} from '@/lib/admin/growth/domain';
import {
  buildEventPostReadiness,
  type EventPostAssembly,
} from '@/lib/admin/publishing/domain';

export type PublishingExecutionStatus =
  | 'ready'
  | 'scheduled'
  | 'published'
  | 'skipped';

export interface PublishingExecutionItem {
  contentItemId: string;
  channel: CampaignChannel;
  status: PublishingExecutionStatus;
  scheduledFor?: string;
  publishedAt?: string;
  externalUrl?: string;
  notes?: string;
  updatedAt: string;
}

export interface EventPublishingExecution {
  eventId: string;
  items: PublishingExecutionItem[];
  updatedAt: string;
}

export interface PublishingExecutionSummary {
  total: number;
  blocked: number;
  ready: number;
  scheduled: number;
  published: number;
  skipped: number;
}

export interface CampaignManifestItem {
  channel: CampaignChannel;
  title: string;
  copy: string;
  publishAt?: string;
  reservationUrl?: string;
  assetName?: string;
  assetUrl?: string;
  altText?: string;
  status: PublishingExecutionStatus | 'blocked';
  externalUrl?: string;
  notes?: string;
}

export interface CampaignManifest {
  eventId: string;
  eventTitle: string;
  exportedAt: string;
  objective: CampaignBrief['objective'];
  language: CampaignBrief['language'];
  reservationUrl: string;
  items: CampaignManifestItem[];
}

export function emptyPublishingExecution(
  eventId: string,
): EventPublishingExecution {
  return {
    eventId,
    items: [],
    updatedAt: new Date().toISOString(),
  };
}

export function normalizeExecutionItem(
  contentItem: CampaignContentItem,
  existing?: Partial<PublishingExecutionItem>,
): PublishingExecutionItem {
  const status: PublishingExecutionStatus =
    existing?.status === 'scheduled' ||
    existing?.status === 'published' ||
    existing?.status === 'skipped'
      ? existing.status
      : 'ready';

  return {
    contentItemId: contentItem.id,
    channel: contentItem.channel,
    status,
    scheduledFor: existing?.scheduledFor ?? contentItem.publishAt,
    publishedAt: existing?.publishedAt,
    externalUrl: existing?.externalUrl,
    notes: existing?.notes,
    updatedAt: existing?.updatedAt ?? new Date().toISOString(),
  };
}

export function summarizePublishingExecution(
  content: CampaignContentItem[],
  brief: CampaignBrief,
  assembly: EventPostAssembly,
  assets: EventAsset[],
  execution: EventPublishingExecution,
): PublishingExecutionSummary {
  const readiness = buildEventPostReadiness(content, brief, assembly, assets);
  const readyIds = new Set(
    readiness.packages
      .filter((item) => item.ready)
      .map((item) => item.contentItemId),
  );

  const summary: PublishingExecutionSummary = {
    total: content.length,
    blocked: 0,
    ready: 0,
    scheduled: 0,
    published: 0,
    skipped: 0,
  };

  for (const contentItem of content) {
    if (!readyIds.has(contentItem.id)) {
      summary.blocked += 1;
      continue;
    }

    const item = execution.items.find(
      (entry) => entry.contentItemId === contentItem.id,
    );
    const status = item?.status ?? 'ready';
    summary[status] += 1;
  }

  return summary;
}

export function buildCampaignManifest({
  eventId,
  eventTitle,
  content,
  brief,
  assembly,
  assets,
  execution,
}: {
  eventId: string;
  eventTitle: string;
  content: CampaignContentItem[];
  brief: CampaignBrief;
  assembly: EventPostAssembly;
  assets: EventAsset[];
  execution: EventPublishingExecution;
}): CampaignManifest {
  const readiness = buildEventPostReadiness(content, brief, assembly, assets);

  return {
    eventId,
    eventTitle,
    exportedAt: new Date().toISOString(),
    objective: brief.objective,
    language: brief.language,
    reservationUrl: brief.reservationUrl,
    items: content.map((item) => {
      const postPackage = assembly.packages.find(
        (entry) => entry.contentItemId === item.id,
      );
      const primaryAsset = assets.find(
        (asset) => asset.id === postPackage?.primaryAssetId,
      );
      const executionItem = execution.items.find(
        (entry) => entry.contentItemId === item.id,
      );
      const packageReadiness = readiness.packages.find(
        (entry) => entry.contentItemId === item.id,
      );

      return {
        channel: item.channel,
        title: item.title,
        copy: item.body,
        publishAt: executionItem?.scheduledFor ?? item.publishAt,
        reservationUrl: brief.reservationUrl || undefined,
        assetName: primaryAsset?.name,
        assetUrl: primaryAsset?.url,
        altText: primaryAsset?.altText || undefined,
        status: packageReadiness?.ready
          ? executionItem?.status ?? 'ready'
          : 'blocked',
        externalUrl: executionItem?.externalUrl,
        notes: executionItem?.notes,
      };
    }),
  };
}

function escapeCsvCell(value: string | undefined): string {
  const text = value ?? '';
  return `"${text.replace(/"/g, '""')}"`;
}

export function manifestToCsv(manifest: CampaignManifest): string {
  const header = [
    'Channel',
    'Title',
    'Status',
    'Scheduled For',
    'Copy',
    'Reservation URL',
    'Asset Name',
    'Asset URL',
    'Alt Text',
    'Published URL',
    'Notes',
  ];

  const rows = manifest.items.map((item) =>
    [
      item.channel,
      item.title,
      item.status,
      item.publishAt,
      item.copy,
      item.reservationUrl,
      item.assetName,
      item.assetUrl,
      item.altText,
      item.externalUrl,
      item.notes,
    ]
      .map(escapeCsvCell)
      .join(','),
  );

  return [header.map(escapeCsvCell).join(','), ...rows].join('\n');
}
