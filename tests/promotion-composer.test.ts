import { describe, expect, it } from 'vitest';
import {
  campaignCopyVariants,
  campaignItemBlockingReason,
  campaignItemMatchesGroup,
  campaignItemMetrics,
  flattenHashtagGroups,
} from '../lib/admin/growth/composer';
import type { CampaignContentItem } from '../lib/admin/growth/domain';

function item(
  input: Partial<CampaignContentItem> & Pick<CampaignContentItem, 'channel'>,
): CampaignContentItem {
  return {
    id: input.channel,
    channel: input.channel,
    title: 'Promotion item',
    body: 'Recommended copy',
    status: 'draft',
    publishingMode: 'manual',
    updatedAt: '2026-07-15T12:00:00.000Z',
    ...input,
  };
}

describe('Promotion Studio composer helpers', () => {
  it('deduplicates saved hashtag groups while preserving useful order', () => {
    expect(
      flattenHashtagGroups({
        branded: ['#ClubBahia', '#AzucarLA'],
        localDiscovery: ['#EchoPark', '#clubbahia'],
        musicCommunity: ['#Cumbia', '#EchoPark'],
      }),
    ).toEqual(['#ClubBahia', '#AzucarLA', '#EchoPark', '#Cumbia']);
  });

  it('presents short, standard, and long Instagram choices without duplicates', () => {
    const variants = campaignCopyVariants(
      item({
        channel: 'instagram-feed',
        body: 'Standard caption',
        structured: {
          shortCaption: 'Short caption',
          standardCaption: 'Standard caption',
          longCaption: 'Long caption with more context',
        },
      }),
    );

    expect(variants.map((variant) => variant.label)).toEqual([
      'Short',
      'Standard',
      'Long',
    ]);
  });

  it('keeps the shared edit plan separate from Instagram Reel and TikTok captions', () => {
    const variants = campaignCopyVariants(
      item({
        channel: 'reel',
        body: '0–3s opening\n3–15s edit plan',
        structured: {
          shortVideoVariants: [
            {
              platform: 'instagram-reel',
              caption: 'Instagram-native caption',
            },
            {
              platform: 'tiktok',
              caption: 'TikTok-native caption',
            },
          ],
        },
      }),
    );

    expect(variants.map((variant) => variant.id)).toEqual([
      'instagram-reel',
      'tiktok',
      'video-plan',
    ]);
    expect(variants[0].body).not.toBe(variants[1].body);
  });

  it('blocks a vertical-video package until both platform captions exist', () => {
    const incomplete = item({
      channel: 'reel',
      structured: {
        shortVideoVariants: [
          {
            platform: 'instagram-reel',
            caption: 'Instagram caption',
          },
        ],
      },
    });

    expect(campaignItemBlockingReason(incomplete)).toContain('TikTok');
    expect(
      campaignItemBlockingReason({
        ...incomplete,
        structured: {
          shortVideoVariants: [
            {
              platform: 'instagram-reel',
              caption: 'Instagram caption',
            },
            { platform: 'tiktok', caption: 'TikTok caption' },
          ],
        },
      }),
    ).toBeUndefined();
  });

  it('groups the review queue around the manager’s actual tasks', () => {
    const instagram = item({ channel: 'instagram-feed' });
    const reel = item({ channel: 'reel' });
    const email = item({ channel: 'email', status: 'approved' });

    expect(campaignItemMatchesGroup(instagram, 'needs-review')).toBe(true);
    expect(campaignItemMatchesGroup(instagram, 'instagram')).toBe(true);
    expect(campaignItemMatchesGroup(reel, 'video')).toBe(true);
    expect(campaignItemMatchesGroup(email, 'direct')).toBe(true);
    expect(campaignItemMatchesGroup(email, 'needs-review')).toBe(false);
  });

  it('returns compact card metrics for quick review', () => {
    const metrics = campaignItemMetrics(
      item({
        channel: 'instagram-feed',
        body: 'A concise caption for Club Bahia.',
        structured: {
          shortCaption: 'Short',
          standardCaption: 'A concise caption for Club Bahia.',
          hashtags: {
            branded: ['#ClubBahia'],
            localDiscovery: ['#EchoPark'],
            musicCommunity: ['#Cumbia'],
          },
        },
      }),
    );

    expect(metrics.words).toBe(6);
    expect(metrics.hashtags).toBe(3);
    expect(metrics.variants).toBe(2);
  });
});
