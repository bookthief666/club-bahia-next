import { describe, expect, it } from 'vitest';
import type { OperationsEvent } from '../lib/admin/domain';
import type {
  CampaignBrief,
  CampaignContentItem,
  EventGrowthWorkspace,
} from '../lib/admin/growth/domain';
import { buildCampaignQualityReport } from '../lib/admin/growth/quality';

const event: OperationsEvent = {
  id: 'evt-quality',
  title: 'Azucar LA — Saturday, August 15',
  concept: 'A live Latin dance night.',
  startsAt: '2026-08-16T04:00:00.000Z',
  endsAt: '2026-08-16T08:00:00.000Z',
  status: 'approved',
  room: 'Main room',
  capacityTarget: 250,
  ticketsSold: 0,
  owner: 'Luis',
  marketingLaunchAt: '2026-08-01T19:00:00.000Z',
  riskFlags: [],
  revenueTarget: 0,
  committedCosts: 0,
};

const brief: CampaignBrief = {
  theme: 'Azucar Saturday',
  targetAudience: 'Latin dance audiences in Los Angeles',
  objective: 'reservations',
  tone: 'Energetic and welcoming',
  offer: 'Reserve your Saturday night',
  budgetCents: 15000,
  language: 'english',
  performers: 'Azucar LA',
  genres: 'cumbia, salsa, bachata',
  doorsTime: '9 PM',
  admission: '$15',
  ageRestriction: '21+',
  foodDrinkSpecial: '',
  reservationUrl: 'https://example.com/reserve',
  address: '1130 Sunset Blvd, Los Angeles, CA 90012',
  mainAttraction: 'Live Latin music and dancing',
};

function contentItem(
  channel: CampaignContentItem['channel'],
  body: string,
): CampaignContentItem {
  return {
    id: channel,
    channel,
    title: channel,
    body,
    status: 'draft',
    publishingMode: 'manual',
    updatedAt: '2026-07-15T12:00:00.000Z',
  };
}

function workspace(content: CampaignContentItem[]): EventGrowthWorkspace {
  return {
    eventId: event.id,
    brief,
    readinessScore: 45,
    content,
    milestones: [],
    history: [],
    updatedAt: '2026-07-15T12:00:00.000Z',
  };
}

describe('refined campaign quality report', () => {
  it('flags identical Instagram Reel and TikTok captions', () => {
    const reel = contentItem(
      'reel',
      'Azucar LA — Saturday, August 15 vertical-video edit plan.',
    );
    reel.structured = {
      reelShots: [
        { startSecond: 0, endSecond: 3, shot: 'Opening' },
        { startSecond: 3, endSecond: 8, shot: 'Dance floor' },
        { startSecond: 8, endSecond: 11, shot: 'Band' },
        { startSecond: 11, endSecond: 15, shot: 'CTA' },
      ],
      shortVideoVariants: [
        { platform: 'instagram-reel', caption: 'Same caption' },
        { platform: 'tiktok', caption: 'Same caption' },
      ],
      altText: 'Live band and dancers at Club Bahia.',
    };

    const report = buildCampaignQualityReport(event, workspace([reel]));
    expect(report.issues.map((item) => item.id)).toContain(
      'duplicated-short-video-caption',
    );
  });

  it('flags unfocused Instagram hashtag sets and missing alt text', () => {
    const instagram = contentItem(
      'instagram-feed',
      'Azucar LA — Saturday, August 15 at Club Bahia. Reserve now.',
    );
    instagram.structured = {
      shortCaption: 'Short option',
      standardCaption: 'Standard option',
      hashtags: {
        branded: ['#One'],
        localDiscovery: [],
        musicCommunity: [],
      },
    };

    const report = buildCampaignQualityReport(event, workspace([instagram]));
    const ids = report.issues.map((item) => item.id);
    expect(ids).toContain('instagram-hashtag-count');
    expect(ids).toContain('missing-alt-text-instagram-feed');
  });

  it('accepts separate platform captions and a complete visual package', () => {
    const reel = contentItem(
      'reel',
      'Azucar LA — Saturday, August 15 vertical-video edit plan.',
    );
    reel.structured = {
      reelShots: [
        { startSecond: 0, endSecond: 3, shot: 'Opening' },
        { startSecond: 3, endSecond: 8, shot: 'Dance floor' },
        { startSecond: 8, endSecond: 11, shot: 'Band' },
        { startSecond: 11, endSecond: 15, shot: 'CTA' },
      ],
      shortVideoVariants: [
        { platform: 'instagram-reel', caption: 'A polished Instagram caption.' },
        { platform: 'tiktok', caption: 'Your Saturday plans just arrived.' },
      ],
      altText: 'Live band and dancers at Club Bahia.',
    };

    const report = buildCampaignQualityReport(event, workspace([reel]));
    const ids = report.issues.map((item) => item.id);
    expect(ids).not.toContain('missing-instagram-reel-caption');
    expect(ids).not.toContain('missing-tiktok-caption');
    expect(ids).not.toContain('duplicated-short-video-caption');
    expect(ids).not.toContain('missing-alt-text-reel');
  });
});
