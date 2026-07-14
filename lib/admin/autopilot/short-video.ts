import {
  createPublishingJob,
  type PublishingApprovalMode,
  type PublishingJob,
} from '@/lib/admin/autopilot/domain';
import type {
  CampaignContentItem,
  CampaignShortVideoVariant,
  ShortVideoPlatform,
} from '@/lib/admin/growth/domain';

export interface ShortVideoPublicationDraft {
  platform: ShortVideoPlatform;
  provider: 'meta' | 'tiktok';
  channel: 'instagram-reel' | 'tiktok-video';
  label: string;
  caption: string;
  title?: string;
  hashtags: string[];
  postingNotes?: string;
}

function uniqueHashtags(values: string[]): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter(Boolean)
        .map((value) => (value.startsWith('#') ? value : `#${value}`)),
    ),
  ).slice(0, 12);
}

function campaignHashtags(item: CampaignContentItem): string[] {
  const groups = item.structured?.hashtags;
  if (!groups) return ['#ClubBahia', '#LosAngelesNightlife'];
  return uniqueHashtags([
    ...groups.branded,
    ...groups.localDiscovery,
    ...groups.musicCommunity,
  ]);
}

function defaultCaption(
  item: CampaignContentItem,
  eventTitle: string,
  platform: ShortVideoPlatform,
): string {
  const hook = item.structured?.primaryHook?.trim() || eventTitle.trim();
  const voiceover = item.structured?.reelVoiceover?.trim();
  const callToAction = item.callToAction?.trim();
  const lines = [hook, voiceover, callToAction].filter(Boolean);
  if (platform === 'tiktok') {
    lines.push('Follow Club Bahia for the next night.');
  }
  return Array.from(new Set(lines)).join('\n\n');
}

function findVariant(
  item: CampaignContentItem,
  platform: ShortVideoPlatform,
): CampaignShortVideoVariant | undefined {
  return item.structured?.shortVideoVariants?.find(
    (variant) => variant.platform === platform,
  );
}

export function buildShortVideoPublicationDrafts(input: {
  item: CampaignContentItem;
  eventTitle: string;
}): ShortVideoPublicationDraft[] {
  if (input.item.channel !== 'reel') {
    throw new Error('Short-video publication drafts require the vertical-video campaign item.');
  }

  const sharedHashtags = campaignHashtags(input.item);
  const instagram = findVariant(input.item, 'instagram-reel');
  const tiktok = findVariant(input.item, 'tiktok');

  return [
    {
      platform: 'instagram-reel',
      provider: 'meta',
      channel: 'instagram-reel',
      label: 'Instagram Reel',
      caption:
        instagram?.caption?.trim() ||
        defaultCaption(input.item, input.eventTitle, 'instagram-reel'),
      title: instagram?.title?.trim() || input.item.structured?.reelThumbnailText,
      hashtags: uniqueHashtags(instagram?.hashtags ?? sharedHashtags),
      postingNotes:
        instagram?.postingNotes?.trim() ||
        'Use the approved vertical video and review the Reel cover before publishing.',
    },
    {
      platform: 'tiktok',
      provider: 'tiktok',
      channel: 'tiktok-video',
      label: 'TikTok video',
      caption:
        tiktok?.caption?.trim() ||
        defaultCaption(input.item, input.eventTitle, 'tiktok'),
      title: tiktok?.title?.trim() || input.eventTitle,
      hashtags: uniqueHashtags(
        tiktok?.hashtags ?? sharedHashtags.slice(0, 6),
      ),
      postingNotes:
        tiktok?.postingNotes?.trim() ||
        'Query current creator settings before posting and preserve the account-selected privacy, comment, duet, and stitch choices.',
    },
  ];
}

export function createShortVideoPublishingJobs(input: {
  eventId: string;
  eventTitle: string;
  item: CampaignContentItem;
  campaignSlug: string;
  reservationUrl?: string;
  hasApprovedVideo: boolean;
  approvalMode?: PublishingApprovalMode;
  instagramScheduledFor?: string;
  tiktokScheduledFor?: string;
  now?: Date;
}): PublishingJob[] {
  const drafts = buildShortVideoPublicationDrafts({
    item: input.item,
    eventTitle: input.eventTitle,
  });

  return drafts.map((draft) =>
    createPublishingJob(
      {
        id: `${input.eventId}-${draft.channel}`,
        eventId: input.eventId,
        contentItemId: `${input.item.id}-${draft.channel}`,
        provider: draft.provider,
        channel: draft.channel,
        scheduledFor:
          draft.platform === 'instagram-reel'
            ? input.instagramScheduledFor
            : input.tiktokScheduledFor,
        approvalMode: input.approvalMode,
        hasMedia: input.hasApprovedVideo,
        reservationUrl: input.reservationUrl,
        campaignSlug: input.campaignSlug,
      },
      input.now,
    ),
  );
}
