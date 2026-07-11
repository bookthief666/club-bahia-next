import { describe, expect, it } from 'vitest';
import type { OperationsEvent } from '../lib/admin/domain';
import {
  buildFixtureCampaign,
  FixtureCampaignGenerator,
} from '../lib/admin/growth/generator';
import type { CampaignBrief } from '../lib/admin/growth/domain';

const event: OperationsEvent = {
  id: 'evt-growth-test',
  title: 'Echo Park Darkwave',
  concept: 'An 80s darkwave and post-punk dance night.',
  startsAt: '2026-08-09T04:00:00.000Z',
  endsAt: '2026-08-09T08:00:00.000Z',
  status: 'approved',
  room: 'Main room',
  capacityTarget: 300,
  ticketsSold: 0,
  owner: 'Maya',
  marketingLaunchAt: '2026-07-25T19:00:00.000Z',
  riskFlags: [],
  revenueTarget: 900000,
  committedCosts: 250000,
};

const brief: CampaignBrief = {
  theme: '80s goth and darkwave',
  targetAudience: 'goth, post-punk, and alternative music fans in Los Angeles',
  objective: 'reservations',
  tone: 'cinematic, nocturnal, and welcoming',
  offer: 'Reserve your table',
  budgetCents: 20000,
  language: 'bilingual',
  performers: 'DJ Nocturna and Black Veil Selectors',
  genres: 'darkwave, post-punk, and synthpop',
  doorsTime: 'Doors 9 PM',
  admission: '$15 advance · $20 at the door',
  ageRestriction: '21+',
  foodDrinkSpecial: 'Midnight kitchen and black margarita special',
  reservationUrl: 'https://example.com/reserve',
  address: '1130 Sunset Blvd, Los Angeles, CA 90012',
  mainAttraction: 'A candlelit darkwave dance floor in Echo Park',
};

describe('fixture growth campaign generator', () => {
  it('creates a coordinated seven-channel campaign', () => {
    const campaign = buildFixtureCampaign(event, brief);

    expect(campaign.content).toHaveLength(7);
    expect(campaign.content.map((item) => item.channel)).toEqual([
      'website',
      'instagram-feed',
      'instagram-story',
      'reel',
      'facebook',
      'email',
      'sms',
    ]);
    expect(campaign.milestones).toHaveLength(campaign.content.length);
  });

  it('keeps every generated item in human-review draft state', () => {
    const campaign = buildFixtureCampaign(event, brief);

    expect(campaign.content.every((item) => item.status === 'draft')).toBe(true);
    expect(campaign.content.every((item) => item.body.trim().length > 0)).toBe(true);
    expect(campaign.content.every((item) => Boolean(item.updatedAt))).toBe(true);
    expect(campaign.readinessScore).toBe(45);
  });

  it('schedules promotion before the event begins', () => {
    const campaign = buildFixtureCampaign(event, brief);
    const eventTime = new Date(event.startsAt).getTime();

    expect(
      campaign.content.every(
        (item) => item.publishAt && new Date(item.publishAt).getTime() < eventTime,
      ),
    ).toBe(true);
  });

  it('uses the internal audience as strategy without printing it in public copy', () => {
    const campaign = buildFixtureCampaign(event, brief);
    const publicCopy = campaign.content.map((item) => item.body).join('\n');

    expect(publicCopy).not.toContain(brief.targetAudience);
    expect(publicCopy).toContain('— Español —');
    expect(publicCopy).toContain('DJ Nocturna');
  });

  it('can regenerate one channel without regenerating the entire campaign', async () => {
    const generator = new FixtureCampaignGenerator();
    const item = await generator.generateItem(event, brief, 'instagram-feed');

    expect(item.channel).toBe('instagram-feed');
    expect(item.status).toBe('draft');
    expect(item.body).toContain('Echo Park Darkwave');
  });
});
