import { describe, expect, it } from 'vitest';
import type { OperationsEvent } from '../lib/admin/domain';
import { getRecurringEventTemplate } from '../lib/admin/event-templates/domain';
import type { CampaignBrief } from '../lib/admin/growth/domain';
import { buildFixtureCampaign } from '../lib/admin/growth/generator';
import {
  AiCampaignItemSchema,
  CampaignGenerationRequestSchema,
  CampaignGenerationResultSchema,
  CampaignStructuredContentSchema,
} from '../lib/admin/growth/validation';

const event: OperationsEvent = {
  id: 'evt-ai-validation',
  title: 'Noche Oscura',
  concept: 'A darkwave and post-punk dance night.',
  startsAt: '2026-09-13T04:00:00.000Z',
  endsAt: '2026-09-13T09:00:00.000Z',
  status: 'approved',
  room: 'Main room',
  capacityTarget: 350,
  ticketsSold: 0,
  owner: 'Maya',
  marketingLaunchAt: '2026-08-28T19:00:00.000Z',
  riskFlags: [],
  revenueTarget: 1_000_000,
  committedCosts: 300_000,
  performers: 'DJ Nocturna',
  genres: 'darkwave, post-punk, synthpop',
  admission: '$15 advance · $20 at the door',
  ageRestriction: '21+',
  reservationUrl: 'https://example.com/reserve',
  flyerUrl: 'https://example.com/flyer.jpg',
  promotionTemplate: getRecurringEventTemplate('bahia-nocturna'),
};

const brief: CampaignBrief = {
  theme: 'Darkwave, goth, and post-punk',
  publicSubtitle: 'Noche Oscura',
  targetAudience: 'alternative nightlife audiences in Los Angeles',
  objective: 'ticket-sales',
  tone: 'cinematic, nocturnal, stylish, and welcoming',
  offer: 'Reserve your table',
  budgetCents: 25000,
  language: 'bilingual',
  performers: 'DJ Nocturna',
  genres: 'darkwave, post-punk, synthpop',
  doorsTime: 'Doors 9 PM',
  admission: '$15 advance · $20 at the door',
  ageRestriction: '21+',
  foodDrinkSpecial: 'Late-night kitchen and black margarita special',
  reservationUrl: 'https://example.com/reserve',
  address: '1130 Sunset Blvd, Los Angeles, CA 90012',
  mainAttraction: 'A candlelit alternative dance floor in Echo Park',
};

function richAiItem() {
  return {
    channel: 'reel' as const,
    body: '0–3s opening hook\n3–8s atmosphere\n8–15s details and CTA',
    callToAction: 'Reserve your table',
    assetPrompt: 'Vertical video with readable safe-zone text and dark red light.',
    primaryHook: 'Noche Oscura at Club Bahia',
    captionVariants: [
      'Short caption',
      'Standard caption with verified event details',
      'Long caption with more atmosphere and context',
    ],
    hashtags: {
      branded: ['#ClubBahia', '#BahiaNocturna'],
      localDiscovery: ['#EchoPark'],
      musicCommunity: ['#DarkwaveLA', '#PostPunkLA'],
    },
    storyFrames: [],
    shortVideoVariants: [
      {
        platform: 'instagram-reel' as const,
        caption: 'Instagram Reel caption',
        title: 'Noche Oscura',
        hashtags: ['#ClubBahia', '#DarkwaveLA'],
        postingNotes: 'Use a clear cover frame.',
      },
      {
        platform: 'tiktok' as const,
        caption: 'TikTok-native caption',
        title: 'Noche Oscura in Echo Park',
        hashtags: ['#DarkwaveLA'],
        postingNotes: 'Open on motion immediately.',
      },
    ],
    emailSubjects: [],
    emailPreheader: '',
    smsVariants: [],
    altText: 'Crowd dancing under red light at Club Bahia.',
  };
}

describe('AI campaign validation boundary', () => {
  it('accepts a complete campaign request without stripping promotion facts', () => {
    const result = CampaignGenerationRequestSchema.parse({
      mode: 'campaign',
      event,
      brief,
    });

    expect(result.event.performers).toBe('DJ Nocturna');
    expect(result.event.reservationUrl).toBe('https://example.com/reserve');
    expect(result.event.promotionTemplate?.id).toBe('bahia-nocturna');
    expect(result.event.promotionTemplate?.hashtags.musicCommunity).toContain(
      '#DarkwaveLA',
    );
  });

  it('rejects an incomplete brief before it reaches a provider', () => {
    const result = CampaignGenerationRequestSchema.safeParse({
      mode: 'campaign',
      event,
      brief: { ...brief, mainAttraction: '' },
    });

    expect(result.success).toBe(false);
  });

  it('accepts a rich platform-native AI item package', () => {
    const parsed = AiCampaignItemSchema.parse(richAiItem());

    expect(parsed.captionVariants).toHaveLength(3);
    expect(parsed.shortVideoVariants.map((item) => item.platform)).toEqual([
      'instagram-reel',
      'tiktok',
    ]);
    expect(parsed.hashtags.musicCommunity).toContain('#DarkwaveLA');
    expect(parsed.altText).toContain('Club Bahia');
  });

  it('accepts a deterministic fallback response with structured promotion data', () => {
    const fixture = buildFixtureCampaign(event, brief);
    const result = CampaignGenerationResultSchema.safeParse({
      ...fixture,
      provider: 'fixture',
      warning: 'OPENAI_API_KEY is not configured.',
    });

    expect(result.success).toBe(true);
    expect(
      fixture.content.find((item) => item.channel === 'instagram-feed')?.structured
        ?.hashtags?.localDiscovery,
    ).toContain('#EchoPark');
    expect(
      fixture.content.find((item) => item.channel === 'reel')?.structured?.reelShots,
    ).toHaveLength(4);
    expect(
      fixture.content
        .find((item) => item.channel === 'reel')
        ?.structured?.shortVideoVariants?.map((item) => item.platform),
    ).toEqual(['instagram-reel', 'tiktok']);
    expect(
      fixture.content.find((item) => item.channel === 'email')?.structured
        ?.emailSubjects?.length,
    ).toBeGreaterThanOrEqual(3);
  });

  it('rejects structured Reel shots with an invalid time range', () => {
    const result = CampaignStructuredContentSchema.safeParse({
      reelShots: [
        {
          startSecond: 10,
          endSecond: 4,
          shot: 'Invalid reversed timeline',
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it('rejects malformed campaign content returned by a provider', () => {
    const fixture = buildFixtureCampaign(event, brief);
    const malformed = {
      ...fixture,
      content: fixture.content.map((item, index) =>
        index === 0 ? { ...item, body: '' } : item,
      ),
      provider: 'openai',
      model: 'gpt-5.6',
    };

    expect(CampaignGenerationResultSchema.safeParse(malformed).success).toBe(false);
  });
});
