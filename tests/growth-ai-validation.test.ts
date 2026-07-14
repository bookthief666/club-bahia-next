import { describe, expect, it } from 'vitest';
import type { OperationsEvent } from '../lib/admin/domain';
import type { CampaignBrief } from '../lib/admin/growth/domain';
import { buildFixtureCampaign } from '../lib/admin/growth/generator';
import {
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

describe('AI campaign validation boundary', () => {
  it('accepts a complete campaign request', () => {
    const result = CampaignGenerationRequestSchema.safeParse({
      mode: 'campaign',
      event,
      brief,
    });

    expect(result.success).toBe(true);
  });

  it('rejects an incomplete brief before it reaches a provider', () => {
    const result = CampaignGenerationRequestSchema.safeParse({
      mode: 'campaign',
      event,
      brief: { ...brief, mainAttraction: '' },
    });

    expect(result.success).toBe(false);
  });

  it('accepts a deterministic fallback response with structured promotion data', () => {
    const fixture = buildFixtureCampaign(event, brief);
    const result = CampaignGenerationResultSchema.safeParse({
      ...fixture,
      provider: 'fixture',
      warning: 'OPENAI_API_KEY is not configured.',
    });

    expect(result.success).toBe(true);
    expect(fixture.content.find((item) => item.channel === 'instagram-feed')?.structured?.hashtags?.localDiscovery)
      .toContain('#EchoPark');
    expect(fixture.content.find((item) => item.channel === 'reel')?.structured?.reelShots)
      .toHaveLength(4);
    expect(fixture.content.find((item) => item.channel === 'email')?.structured?.emailSubjects?.length)
      .toBeGreaterThanOrEqual(3);
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
