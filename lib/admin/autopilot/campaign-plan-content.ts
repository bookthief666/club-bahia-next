import type { EventAsset } from '@/lib/admin/assets/domain';
import {
  buildPromotionTimeline,
  type PromotionTimelineEntry,
} from '@/lib/admin/autopilot/campaign-plan';
import type { PromotionAutopilotReadiness } from '@/lib/admin/autopilot/domain';
import { buildShortVideoPublicationDrafts } from '@/lib/admin/autopilot/short-video';
import type { OperationsEvent } from '@/lib/admin/domain';
import type {
  CampaignContentItem,
  EventGrowthWorkspace,
} from '@/lib/admin/growth/domain';
import {
  isAssetCompatibleWithChannel,
  selectBestAssetForChannel,
  type EventPostAssembly,
} from '@/lib/admin/publishing/domain';

export interface PreparedPromotionTimelineEntry extends PromotionTimelineEntry {
  caption: string;
  contentItemId: string;
  media?: EventAsset;
  copyApproved: boolean;
  executionSupport:
    | 'automatic'
    | 'connection-required'
    | 'provider-proof-required';
}

function selectedAsset(
  item: CampaignContentItem | undefined,
  assembly: EventPostAssembly,
  assets: EventAsset[],
): EventAsset | undefined {
  if (!item) return undefined;
  const postPackage = assembly.packages.find(
    (entry) => entry.contentItemId === item.id,
  );
  const selected = (postPackage?.assetIds ?? [])
    .map((assetId) => assets.find((asset) => asset.id === assetId))
    .filter((asset): asset is EventAsset => Boolean(asset));
  const compatible = selected.filter((asset) =>
    isAssetCompatibleWithChannel(asset, item.channel),
  );
  return (
    compatible.find((asset) => asset.id === postPackage?.primaryAssetId) ??
    compatible[0] ??
    selectBestAssetForChannel(assets, item.channel)
  );
}

function joinCaption(parts: Array<string | undefined>, max = 2200): string {
  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join('\n\n')
    .slice(0, max);
}

function storyCaption(
  item: CampaignContentItem | undefined,
  phase: PromotionTimelineEntry['phase'],
  event: OperationsEvent,
): string {
  const frames = item?.structured?.storyFrames
    ?.map((frame) => frame.text)
    .filter(Boolean);
  const body = frames?.length ? frames.join(' · ') : item?.body;
  const heading =
    phase === 'performer-spotlight'
      ? event.performers
        ? `Featuring ${event.performers}`
        : 'Featured night at Club Bahia'
      : phase === 'story-countdown'
        ? 'Save the date'
        : phase === 'tomorrow'
          ? 'Tomorrow at Club Bahia'
          : phase === 'tonight'
            ? 'Tonight at Club Bahia'
            : 'Final hours before tonight’s event';
  return joinCaption([heading, body]);
}

function feedCaption(
  item: CampaignContentItem | undefined,
  phase: PromotionTimelineEntry['phase'],
  event: OperationsEvent,
): string {
  if (phase === 'announcement') {
    return joinCaption([
      item?.structured?.longCaption,
      item?.structured?.standardCaption,
      item?.body,
    ]);
  }
  if (phase === 'reservation-reminder') {
    return joinCaption([
      item?.structured?.shortCaption,
      item?.structured?.standardCaption,
      item?.callToAction,
    ]);
  }
  return joinCaption([
    `Thank you to everyone who joined us for ${event.title}.`,
    'Follow Club Bahia for the next night, performance, and reservation announcement.',
  ]);
}

export function buildPreparedPromotionTimeline(input: {
  event: OperationsEvent;
  workspace: EventGrowthWorkspace;
  assembly: EventPostAssembly;
  assets: EventAsset[];
  readiness?: PromotionAutopilotReadiness;
  now?: Date;
}): PreparedPromotionTimelineEntry[] {
  const timeline = buildPromotionTimeline({ event: input.event, now: input.now });
  const feed = input.workspace.content.find(
    (item) => item.channel === 'instagram-feed',
  );
  const story = input.workspace.content.find(
    (item) => item.channel === 'instagram-story',
  );
  const video = input.workspace.content.find((item) => item.channel === 'reel');
  const feedMedia = selectedAsset(feed, input.assembly, input.assets);
  const storyMedia = selectedAsset(story, input.assembly, input.assets);
  const videoMedia = selectedAsset(video, input.assembly, input.assets);
  const shortVideo = video
    ? buildShortVideoPublicationDrafts({
        item: video,
        eventTitle: input.event.title,
      })
    : [];
  const instagramVideo = shortVideo.find(
    (draft) => draft.channel === 'instagram-reel',
  );
  const tiktokVideo = shortVideo.find(
    (draft) => draft.channel === 'tiktok-video',
  );
  const meta = input.readiness?.accounts.find(
    (account) => account.provider === 'meta',
  );
  const tiktok = input.readiness?.accounts.find(
    (account) => account.provider === 'tiktok',
  );
  const imageAutomatic = Boolean(
    meta?.capabilities.find((capability) => capability.id === 'instagram-image')
      ?.available,
  );
  const approved = (item: CampaignContentItem | undefined) =>
    Boolean(
      item && ['approved', 'scheduled', 'published'].includes(item.status),
    );

  return timeline.entries.map((entry) => {
    if (entry.channel === 'instagram-feed') {
      return {
        ...entry,
        caption: feedCaption(feed, entry.phase, input.event),
        contentItemId: `${feed?.id ?? 'instagram-feed'}-${entry.phase}`,
        media: feedMedia,
        copyApproved: approved(feed),
        executionSupport: imageAutomatic ? 'automatic' : 'connection-required',
      };
    }
    if (entry.channel === 'instagram-story') {
      return {
        ...entry,
        caption: storyCaption(story, entry.phase, input.event),
        contentItemId: `${story?.id ?? 'instagram-story'}-${entry.phase}`,
        media: storyMedia,
        copyApproved: approved(story),
        executionSupport:
          meta?.status === 'connected'
            ? 'provider-proof-required'
            : 'connection-required',
      };
    }
    if (entry.channel === 'instagram-reel') {
      return {
        ...entry,
        caption: instagramVideo
          ? joinCaption([
              instagramVideo.caption,
              instagramVideo.hashtags.join(' '),
            ])
          : '',
        contentItemId: `${video?.id ?? 'reel'}-instagram-reel`,
        media: videoMedia,
        copyApproved: approved(video),
        executionSupport: 'provider-proof-required',
      };
    }
    return {
      ...entry,
      caption: tiktokVideo
        ? joinCaption([tiktokVideo.caption, tiktokVideo.hashtags.join(' ')])
        : '',
      contentItemId: `${video?.id ?? 'reel'}-tiktok-video`,
      media: videoMedia,
      copyApproved: approved(video),
      executionSupport:
        tiktok?.status === 'connected'
          ? 'provider-proof-required'
          : 'connection-required',
    };
  });
}
