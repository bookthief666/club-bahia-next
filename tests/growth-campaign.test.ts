import { describe, expect, it } from 'vitest';
import type { OperationsEvent } from '../lib/admin/domain';
import { buildFixtureCampaign } from '../lib/admin/growth/generator';
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
  primaryGoal: 'Drive reservations',
  tone: 'cinematic, nocturnal, and welcoming',
  offer: 'Reserve your table',
  budgetCents: 20000,
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
    expect(campaign.readinessScore).toBeLessThan(100);
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
});
