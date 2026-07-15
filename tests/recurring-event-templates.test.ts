import { describe, expect, it } from 'vitest';
import { buildPromotionTimeline } from '../lib/admin/autopilot/campaign-plan';
import type { OperationsEvent } from '../lib/admin/domain';
import { buildInitialCampaignBrief } from '../lib/admin/event-templates/campaign';
import {
  getRecurringEventTemplate,
  nextTemplateDate,
  templateEventTitle,
} from '../lib/admin/event-templates/domain';
import { buildFixtureCampaign } from '../lib/admin/growth/generator';
import type { CampaignBrief } from '../lib/admin/growth/domain';

function baseBrief(): CampaignBrief {
  return {
    theme: 'Generic night',
    publicSubtitle: '',
    targetAudience: 'Generic nightlife audience',
    objective: 'reservations',
    tone: 'generic',
    offer: 'Reserve now',
    budgetCents: 15000,
    language: 'english',
    performers: '',
    genres: '',
    doorsTime: '',
    admission: '',
    ageRestriction: '',
    foodDrinkSpecial: '',
    reservationUrl: '',
    address: 'Club Bahia, Los Angeles',
    mainAttraction: '',
  };
}

function templateEvent(
  templateId: 'azucar-friday' | 'azucar-saturday' | 'bahia-nocturna',
  startsAt: string,
): OperationsEvent {
  const template = getRecurringEventTemplate(templateId);
  return {
    id: `evt-${templateId}`,
    title: templateEventTitle(template, startsAt.slice(0, 10)),
    concept: template.concept,
    startsAt,
    endsAt: new Date(new Date(startsAt).getTime() + 4 * 3_600_000).toISOString(),
    status: 'approved',
    room: template.room,
    capacityTarget: 250,
    ticketsSold: 0,
    owner: 'Luis',
    marketingLaunchAt: startsAt,
    riskFlags: [],
    revenueTarget: 0,
    committedCosts: 0,
    performers: template.performers,
    genres: template.genres,
    promotionTemplate: template,
  };
}

describe('recurring Club Bahia event templates', () => {
  it('suggests the next matching weekday and a unique dated title', () => {
    const friday = getRecurringEventTemplate('azucar-friday');
    const saturday = getRecurringEventTemplate('azucar-saturday');
    const nocturna = getRecurringEventTemplate('bahia-nocturna');

    expect(nextTemplateDate('2026-07-15', friday)).toBe('2026-07-17');
    expect(nextTemplateDate('2026-07-15', saturday)).toBe('2026-07-18');
    expect(nextTemplateDate('2026-07-15', nocturna)).toBe('2026-07-16');
    expect(templateEventTitle(friday, '2026-07-17')).toBe(
      'Azucar LA — Friday, July 17',
    );
  });

  it('returns an immutable snapshot rather than a shared live template object', () => {
    const first = getRecurringEventTemplate('azucar-friday');
    first.hashtags.branded.push('#ChangedLater');
    const second = getRecurringEventTemplate('azucar-friday');

    expect(second.hashtags.branded).not.toContain('#ChangedLater');
  });

  it('initializes the campaign brief and lets confirmed event facts override defaults', () => {
    const event = templateEvent('azucar-saturday', '2026-08-09T04:00:00.000Z');
    event.admission = '$15 before 10 PM';
    event.reservationUrl = 'https://club-bahia.example/reservations';
    const brief = buildInitialCampaignBrief(event, baseBrief());

    expect(brief.language).toBe('bilingual');
    expect(brief.performers).toBe('Azucar LA');
    expect(brief.genres).toContain('cumbia');
    expect(brief.admission).toBe('$15 before 10 PM');
    expect(brief.offer).toBe('Reserve your Saturday night');
    expect(brief.reservationUrl).toContain('/reservations');
  });

  it('inherits approved hashtag families and visual direction in generated assets', () => {
    const event = templateEvent('bahia-nocturna', '2026-08-07T04:00:00.000Z');
    const brief = buildInitialCampaignBrief(event, baseBrief());
    const campaign = buildFixtureCampaign(event, brief);
    const instagram = campaign.content.find(
      (item) => item.channel === 'instagram-feed',
    );

    expect(instagram?.structured?.hashtags?.branded).toContain('#BahiaNocturna');
    expect(instagram?.structured?.hashtags?.musicCommunity).toContain('#DarkwaveLA');
    expect(instagram?.assetPrompt).toContain('Dark tropical noir');
    expect(instagram?.body).toContain('#BahiaNocturna');
  });

  it('uses seven touches for resident weekends and ten for an experimental launch', () => {
    const now = new Date('2026-08-01T19:00:00.000Z');
    const resident = buildPromotionTimeline({
      event: templateEvent('azucar-saturday', '2026-08-16T04:00:00.000Z'),
      now,
    });
    const experimental = buildPromotionTimeline({
      event: templateEvent('bahia-nocturna', '2026-08-21T04:00:00.000Z'),
      now,
    });

    expect(resident.entries).toHaveLength(7);
    expect(resident.cadenceLabel).toContain('Resident weekend');
    expect(experimental.entries).toHaveLength(10);
    expect(experimental.cadenceLabel).toContain('Experimental launch');
  });
});
