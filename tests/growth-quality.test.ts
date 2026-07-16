import { describe, expect, it } from 'vitest';
import type { OperationsEvent } from '../lib/admin/domain';
import type { CampaignBrief, EventGrowthWorkspace } from '../lib/admin/growth/domain';
import { buildFixtureCampaign } from '../lib/admin/growth/generator';
import { buildCampaignQualityReport } from '../lib/admin/growth/quality';

const event: OperationsEvent = {
  id: 'evt-quality',
  title: 'Sábado Caliente',
  concept: 'A recurring Latin music night.',
  startsAt: '2026-08-09T04:00:00.000Z',
  endsAt: '2026-08-09T09:00:00.000Z',
  status: 'approved',
  room: 'Main room',
  capacityTarget: 350,
  ticketsSold: 0,
  owner: 'Maya',
  marketingLaunchAt: '2026-07-25T19:00:00.000Z',
  riskFlags: [],
  revenueTarget: 1_000_000,
  committedCosts: 300_000,
};

const brief: CampaignBrief = {
  theme: 'Darkwave Goth Night',
  targetAudience: 'alternative nightlife audiences in Los Angeles',
  objective: 'ticket-sales',
  tone: 'cinematic and nocturnal',
  offer: 'Reserve now',
  budgetCents: 25000,
  language: 'spanish',
  performers: 'DJ Nocturna',
  genres: 'darkwave, post-punk, synthpop',
  doorsTime: 'Doors 9 PM',
  admission: '$15 advance',
  ageRestriction: '21+',
  foodDrinkSpecial: '',
  reservationUrl: '',
  address: '1130 Sunset Blvd, Los Angeles, CA 90012',
  mainAttraction: 'A candlelit alternative dance floor',
};

function workspace(overrides: Partial<EventGrowthWorkspace> = {}): EventGrowthWorkspace {
  const generated = buildFixtureCampaign(event, brief);
  return {
    eventId: event.id,
    brief,
    ...generated,
    history: [],
    generatedAt: '2026-07-12T00:00:00.000Z',
    updatedAt: '2026-07-12T00:00:00.000Z',
    ...overrides,
  };
}

describe('campaign quality checks', () => {
  it('flags missing conversion URL and an actual mixed-language CTA', () => {
    const current = workspace();
    const content = current.content.map((item, index) =>
      index === 0 ? { ...item, body: `${item.body}\n\nReserve now` } : item,
    );
    const report = buildCampaignQualityReport(event, { ...current, content });
    const ids = report.issues.map((item) => item.id);

    expect(ids).toContain('missing-conversion-url');
    expect(ids).toContain('mixed-language-cta');
    expect(report.score).toBeLessThan(100);
  });

  it('does not flag the deterministic Spanish CTA when it is translated', () => {
    const report = buildCampaignQualityReport(event, workspace());
    expect(report.issues.map((item) => item.id)).not.toContain('mixed-language-cta');
  });

  it('flags campaigns that omit the single public event name', () => {
    const current = workspace();
    const content = current.content.map((item) => ({
      ...item,
      body: item.body.replaceAll(event.title, 'A Different Name'),
    }));
    const report = buildCampaignQualityReport(event, { ...current, content });

    expect(report.issues.some((item) => item.id === 'missing-public-event-name')).toBe(true);
  });

  it('flags an overlong SMS', () => {
    const current = workspace();
    const content = current.content.map((item) =>
      item.channel === 'sms' ? { ...item, body: 'x'.repeat(301) } : item,
    );
    const report = buildCampaignQualityReport(event, { ...current, content });

    expect(report.issues.some((item) => item.id === 'sms-length')).toBe(true);
  });
});
