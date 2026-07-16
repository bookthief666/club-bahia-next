import type { EventAsset } from '@/lib/admin/assets/domain';
import type { PublishingQueueJob } from '@/lib/admin/autopilot/queue-domain';
import type { OperationsEvent } from '@/lib/admin/domain';
import {
  CAMPAIGN_CHANNEL_LABELS,
  type CampaignChannel,
  type CampaignContentItem,
  type CampaignItemStatus,
  type CampaignQualityIssue,
  type EventGrowthWorkspace,
} from '@/lib/admin/growth/domain';
import { buildCampaignQualityReport } from '@/lib/admin/growth/quality';
import {
  buildPostPackageReadiness,
  CHANNEL_ASSET_REQUIRED,
  isAssetCompatibleWithChannel,
  selectBestAssetForChannel,
  type EventPostAssembly,
  type PostReadinessCheck,
} from '@/lib/admin/publishing/domain';

export type PromotionReviewLane =
  | 'needs-review'
  | 'missing-media'
  | 'ready'
  | 'approved'
  | 'problems'
  | 'all';

export type PromotionMediaAccess = 'available' | 'locked' | 'unavailable';

export interface PromotionReviewSource {
  event: OperationsEvent;
  workspace: EventGrowthWorkspace;
  assembly: EventPostAssembly;
  assets: EventAsset[];
  queueJobs: PublishingQueueJob[];
  mediaAccess: PromotionMediaAccess;
}

export interface PromotionReviewQueueState {
  id: string;
  status: string;
  provider: string;
  label: string;
  scheduledFor?: string;
  lastError?: string;
  externalUrl?: string;
}

export interface PromotionReviewAssetPreview {
  id: string;
  name: string;
  url: string;
  kind: EventAsset['kind'];
  role: EventAsset['role'];
  altText: string;
}

export interface PromotionReviewItem {
  key: string;
  eventId: string;
  eventTitle: string;
  eventStartsAt: string;
  eventStatus: OperationsEvent['status'];
  contentItemId: string;
  channel: CampaignChannel;
  channelLabel: string;
  title: string;
  body: string;
  copyStatus: CampaignItemStatus;
  publishAt?: string;
  updatedAt: string;
  lane: Exclude<PromotionReviewLane, 'all'>;
  qualityIssues: CampaignQualityIssue[];
  readinessChecks: PostReadinessCheck[];
  blockingReasons: string[];
  bulkApprovable: boolean;
  readyForScheduling: boolean;
  autoAssignableAssetId?: string;
  primaryAsset?: PromotionReviewAssetPreview;
  queue: PromotionReviewQueueState[];
}

export interface PromotionReviewSummary {
  total: number;
  needsReview: number;
  missingMedia: number;
  ready: number;
  approved: number;
  problems: number;
  bulkApprovable: number;
  autoAssignable: number;
}

export const PROMOTION_REVIEW_LANE_LABELS: Record<PromotionReviewLane, string> = {
  'needs-review': 'Needs review',
  'missing-media': 'Missing media',
  ready: 'Ready to approve',
  approved: 'Approved',
  problems: 'Publishing problems',
  all: 'All',
};

const PROBLEM_QUEUE_STATUSES = new Set(['failed', 'paused', 'needs-media']);

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function selectedAssetsForItem(
  source: PromotionReviewSource,
  item: CampaignContentItem,
): EventAsset[] {
  const postPackage = source.assembly.packages.find(
    (entry) => entry.contentItemId === item.id,
  );
  if (!postPackage) return [];
  return source.assets.filter((asset) => postPackage.assetIds.includes(asset.id));
}

function primaryAssetForItem(
  source: PromotionReviewSource,
  item: CampaignContentItem,
): EventAsset | undefined {
  const postPackage = source.assembly.packages.find(
    (entry) => entry.contentItemId === item.id,
  );
  const selected = selectedAssetsForItem(source, item);
  return (
    selected.find((asset) => asset.id === postPackage?.primaryAssetId) ??
    selected.find((asset) => isAssetCompatibleWithChannel(asset, item.channel)) ??
    selected[0]
  );
}

function queueState(job: PublishingQueueJob): PromotionReviewQueueState {
  return {
    id: job.id,
    status: job.status,
    provider: job.provider,
    label: job.label,
    scheduledFor: job.scheduledFor,
    lastError: job.lastError,
    externalUrl: job.externalUrl,
  };
}

function laneFor(input: {
  item: CampaignContentItem;
  hasQueueProblem: boolean;
  missingMedia: boolean;
  bulkApprovable: boolean;
}): Exclude<PromotionReviewLane, 'all'> {
  if (input.hasQueueProblem) return 'problems';
  if (input.missingMedia) return 'missing-media';
  if (input.bulkApprovable) return 'ready';
  if (input.item.status === 'draft') return 'needs-review';
  return 'approved';
}

export function buildPromotionReviewItems(
  sources: PromotionReviewSource[],
): PromotionReviewItem[] {
  const items = sources.flatMap((source) => {
    const quality = buildCampaignQualityReport(source.event, source.workspace);

    return source.workspace.content.map((item): PromotionReviewItem => {
      const postPackage = source.assembly.packages.find(
        (entry) => entry.contentItemId === item.id,
      );
      const hypotheticalApprovedItem: CampaignContentItem =
        item.status === 'draft' ? { ...item, status: 'approved' } : item;
      const readiness = buildPostPackageReadiness(
        hypotheticalApprovedItem,
        source.workspace.brief,
        postPackage,
        source.assets,
      );
      const qualityIssues = quality.issues.filter(
        (issue) => !issue.channel || issue.channel === item.channel,
      );
      const qualityBlockers = qualityIssues.filter(
        (issue) => issue.severity === 'error' || issue.severity === 'warning',
      );
      const mediaVerificationBlocked =
        CHANNEL_ASSET_REQUIRED[item.channel] && source.mediaAccess !== 'available';
      const matchingQueue = source.queueJobs
        .filter((job) => job.contentItemId === item.id)
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
      const hasQueueProblem = matchingQueue.some((job) =>
        PROBLEM_QUEUE_STATUSES.has(job.status),
      );
      const incompleteChecks = readiness.checks.filter(
        (check) => !check.complete && check.id !== 'copy',
      );
      const blockingReasons = unique([
        ...qualityBlockers.map((issue) => issue.title),
        ...incompleteChecks.map((check) => check.detail),
        ...(mediaVerificationBlocked
          ? ['Unlock event media so the assigned asset and usage approval can be verified.']
          : []),
        ...(hasQueueProblem
          ? ['Resolve the failed, paused, or media-blocked publishing job before using a bulk approval action.']
          : []),
      ]);
      const assetCheck = readiness.checks.find((check) => check.id === 'asset');
      const missingMedia = Boolean(
        CHANNEL_ASSET_REQUIRED[item.channel] &&
          (mediaVerificationBlocked || !assetCheck?.complete),
      );
      const bulkApprovable =
        item.status === 'draft' &&
        qualityBlockers.length === 0 &&
        !mediaVerificationBlocked &&
        !hasQueueProblem &&
        readiness.ready;
      const selected = selectedAssetsForItem(source, item);
      const compatibleSelected = selected.some((asset) =>
        isAssetCompatibleWithChannel(asset, item.channel),
      );
      const bestAsset = selectBestAssetForChannel(source.assets, item.channel);
      const autoAssignableAssetId =
        item.status !== 'published' &&
        source.mediaAccess === 'available' &&
        CHANNEL_ASSET_REQUIRED[item.channel] &&
        !compatibleSelected
          ? bestAsset?.id
          : undefined;
      const primaryAsset = primaryAssetForItem(source, item);
      const readyForScheduling =
        item.status !== 'draft' &&
        qualityBlockers.length === 0 &&
        !mediaVerificationBlocked &&
        !hasQueueProblem &&
        readiness.ready;

      return {
        key: `${source.event.id}:${item.id}`,
        eventId: source.event.id,
        eventTitle: source.event.title,
        eventStartsAt: source.event.startsAt,
        eventStatus: source.event.status,
        contentItemId: item.id,
        channel: item.channel,
        channelLabel: CAMPAIGN_CHANNEL_LABELS[item.channel],
        title: item.title,
        body: item.body,
        copyStatus: item.status,
        publishAt: item.publishAt,
        updatedAt: item.updatedAt,
        lane: laneFor({ item, hasQueueProblem, missingMedia, bulkApprovable }),
        qualityIssues,
        readinessChecks: readiness.checks,
        blockingReasons,
        bulkApprovable,
        readyForScheduling,
        autoAssignableAssetId,
        primaryAsset: primaryAsset
          ? {
              id: primaryAsset.id,
              name: primaryAsset.name,
              url: primaryAsset.url,
              kind: primaryAsset.kind,
              role: primaryAsset.role,
              altText: primaryAsset.altText,
            }
          : undefined,
        queue: matchingQueue.map(queueState),
      };
    });
  });

  return items.sort((left, right) => {
    const eventOrder = left.eventStartsAt.localeCompare(right.eventStartsAt);
    if (eventOrder !== 0) return eventOrder;
    const publishOrder = (left.publishAt ?? '9999').localeCompare(
      right.publishAt ?? '9999',
    );
    if (publishOrder !== 0) return publishOrder;
    return left.channelLabel.localeCompare(right.channelLabel);
  });
}

export function summarizePromotionReviewItems(
  items: PromotionReviewItem[],
): PromotionReviewSummary {
  return {
    total: items.length,
    needsReview: items.filter((item) => item.lane === 'needs-review').length,
    missingMedia: items.filter((item) => item.lane === 'missing-media').length,
    ready: items.filter((item) => item.lane === 'ready').length,
    approved: items.filter((item) => item.lane === 'approved').length,
    problems: items.filter((item) => item.lane === 'problems').length,
    bulkApprovable: items.filter((item) => item.bulkApprovable).length,
    autoAssignable: items.filter((item) => item.autoAssignableAssetId).length,
  };
}

export function filterPromotionReviewItems(input: {
  items: PromotionReviewItem[];
  lane: PromotionReviewLane;
  query?: string;
}): PromotionReviewItem[] {
  const normalizedQuery = input.query?.trim().toLowerCase() ?? '';
  return input.items.filter((item) => {
    if (input.lane !== 'all' && item.lane !== input.lane) return false;
    if (!normalizedQuery) return true;
    return [
      item.eventTitle,
      item.title,
      item.body,
      item.channelLabel,
      item.copyStatus,
      ...item.blockingReasons,
    ]
      .join(' ')
      .toLowerCase()
      .includes(normalizedQuery);
  });
}
