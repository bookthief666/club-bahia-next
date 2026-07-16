import type {
  CampaignChannel,
  CampaignContentItem,
  CampaignHashtagGroups,
} from '@/lib/admin/growth/domain';

export type CampaignChannelGroup =
  | 'all'
  | 'needs-review'
  | 'instagram'
  | 'video'
  | 'direct';

export interface CampaignCopyVariant {
  id: string;
  label: string;
  body: string;
  platform?: 'instagram' | 'tiktok' | 'email' | 'sms' | 'website' | 'facebook';
  note?: string;
}

function unique(values: string[]): string[] {
  const seen = new Set<string>();
  return values.filter((value) => {
    const cleaned = value.trim();
    if (!cleaned) return false;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function flattenHashtagGroups(
  groups?: CampaignHashtagGroups,
): string[] {
  if (!groups) return [];
  return unique([
    ...groups.branded,
    ...groups.localDiscovery,
    ...groups.musicCommunity,
  ]);
}

function addVariant(
  variants: CampaignCopyVariant[],
  candidate: CampaignCopyVariant,
): void {
  const body = candidate.body.trim();
  if (!body) return;
  if (variants.some((item) => item.body.trim() === body)) return;
  variants.push({ ...candidate, body });
}

export function campaignCopyVariants(
  item: CampaignContentItem,
): CampaignCopyVariant[] {
  const variants: CampaignCopyVariant[] = [];
  const structured = item.structured;

  if (item.channel === 'reel') {
    for (const variant of structured?.shortVideoVariants ?? []) {
      addVariant(variants, {
        id: variant.platform,
        label:
          variant.platform === 'instagram-reel'
            ? 'Instagram Reel'
            : 'TikTok',
        body: variant.caption,
        platform:
          variant.platform === 'instagram-reel' ? 'instagram' : 'tiktok',
        note: variant.postingNotes,
      });
    }
    addVariant(variants, {
      id: 'video-plan',
      label: '15-second edit plan',
      body: item.body,
    });
    return variants;
  }

  if (item.channel === 'sms') {
    for (const [index, body] of (structured?.smsVariants ?? []).entries()) {
      addVariant(variants, {
        id: `sms-${index + 1}`,
        label: `SMS ${index + 1}`,
        body,
        platform: 'sms',
      });
    }
    addVariant(variants, {
      id: 'recommended',
      label: 'Recommended',
      body: item.body,
      platform: 'sms',
    });
    return variants;
  }

  if (item.channel === 'email') {
    addVariant(variants, {
      id: 'recommended',
      label: 'Recommended email',
      body: item.body,
      platform: 'email',
    });
    for (const [index, subject] of (structured?.emailSubjects ?? []).entries()) {
      addVariant(variants, {
        id: `subject-${index + 1}`,
        label: `Subject ${index + 1}`,
        body: subject,
        platform: 'email',
        note: 'Subject line only',
      });
    }
    return variants;
  }

  addVariant(variants, {
    id: 'short',
    label: 'Short',
    body: structured?.shortCaption ?? '',
  });
  addVariant(variants, {
    id: 'standard',
    label: 'Standard',
    body: structured?.standardCaption ?? item.body,
  });
  addVariant(variants, {
    id: 'long',
    label: 'Long',
    body: structured?.longCaption ?? '',
  });
  addVariant(variants, {
    id: 'recommended',
    label: 'Recommended',
    body: item.body,
  });

  return variants;
}

export function campaignChannelGroup(channel: CampaignChannel): Exclude<
  CampaignChannelGroup,
  'all' | 'needs-review'
> {
  if (channel === 'instagram-feed' || channel === 'instagram-story') {
    return 'instagram';
  }
  if (channel === 'reel') return 'video';
  return 'direct';
}

export function campaignItemMatchesGroup(
  item: CampaignContentItem,
  group: CampaignChannelGroup,
): boolean {
  if (group === 'all') return true;
  if (group === 'needs-review') return item.status === 'draft';
  return campaignChannelGroup(item.channel) === group;
}

export function campaignItemMetrics(item: CampaignContentItem): {
  characters: number;
  words: number;
  hashtags: number;
  variants: number;
} {
  const body = item.body.trim();
  return {
    characters: body.length,
    words: body ? body.split(/\s+/).length : 0,
    hashtags: flattenHashtagGroups(item.structured?.hashtags).length,
    variants: campaignCopyVariants(item).length,
  };
}

export function campaignItemBlockingReason(
  item: CampaignContentItem,
): string | undefined {
  if (!item.body.trim()) return 'The content is empty.';
  if (item.channel === 'sms' && item.body.length > 300) {
    return `The SMS is ${item.body.length} characters; the limit is 300.`;
  }
  if (
    item.channel === 'reel' &&
    !(item.structured?.shortVideoVariants ?? []).some(
      (variant) => variant.platform === 'instagram-reel',
    )
  ) {
    return 'The vertical-video package needs an Instagram Reel caption.';
  }
  if (
    item.channel === 'reel' &&
    !(item.structured?.shortVideoVariants ?? []).some(
      (variant) => variant.platform === 'tiktok',
    )
  ) {
    return 'The vertical-video package needs a separate TikTok caption.';
  }
  return undefined;
}
