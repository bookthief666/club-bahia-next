import { describe, expect, it } from 'vitest';
import type { EventAsset } from '../lib/admin/assets/domain';
import type { OperationsEvent } from '../lib/admin/domain';
import type {
  CampaignBrief,
  CampaignContentItem,
  EventGrowthWorkspace,
} from '../lib/admin/growth/domain';
import type { EventPostAssembly } from '../lib/admin/publishing/domain';
import type { EventPublishingExecution } from '../lib/admin/publishing/execution-domain';
import { buildCampaignIntegrityReport } from '../lib/admin/publishing/integrity';

const timestamp = '2026-07-12T05:00:00.000Z';

const event: OperationsEvent = {
  id: 'evt-sabado-caliente',
  title: 'Sábado Caliente',
  concept: 'Salsa and bachata night',
  startsAt: '2026-08-08T21:00:00.000-07:00',
  endsAt: '2026-08-09T04:00:00.000-07:00',
  status: 'final-prep',
  room: 'Main room',
  capacityTarget: 250,
  ticketsSold: 40,
  owner: 'Manuel',
  marketingLaunchAt: '2026-07-25T19:00:00.000Z',
  riskFlags: [],
  revenueTarget: 10000,
  committedCosts: 3000,
};

function brief(overrides: Partial<CampaignBrief> = {}): CampaignBrief {
  return {
    theme: 'Sábado Caliente',
    targetAudience: 'Latin nightlife audiences in Los Angeles',
    objective: 'reservations',
    tone: 'warm and energetic',
    offer: 'Reserve now',
    budgetCents: 20000,
    language: 'bilingual',
    performers: 'DJ Plato',
    genres: 'Salsa, bachata',
    doorsTime: '8 PM',
    admission: '$15',
    ageRestriction: '21+',
    foodDrinkSpecial: 'Late-night kitchen',
    reservationUrl: 'https://club-bahia.example/reservations',
    address: '1130 Sunset Blvd, Los Angeles, CA 90012',
    mainAttraction: 'Salsa and bachata dance night',
    ...overrides,
  };
}

function content(overrides: Partial<CampaignContentItem>[] = []): CampaignContentItem[] {
  const base: CampaignContentItem[] = [
    {
      id: 'website',
      channel: 'website',
      title: 'Website event description',
      body: 'Sábado Caliente at Club Bahia.\n\n— Español —\n\nSábado Caliente en Club Bahia. Reserva ahora.',
      status: 'approved',
      publishingMode: 'automatic',
      publishAt: '2026-07-25T19:00:00.000Z',
      updatedAt: timestamp,
    },
    {
      id: 'sms',
      channel: 'sms',
      title: 'Day-before SMS',
      body: 'Sábado Caliente tomorrow. Reserve: https://club-bahia.example/reservations. Reply STOP to opt out.',
      status: 'approved',
      publishingMode: 'manual',
      publishAt: '2026-08-08T00:00:00.000Z',
      updatedAt: timestamp,
    },
  ];
  return base.map((item, index) => ({ ...item, ...overrides[index] }));
}

function asset(overrides: Partial<EventAsset> = {}): EventAsset {
  return {
    id: 'flyer',
    eventId: event.id,
    name: 'sabado-caliente.jpg',
    pathname: 'club-bahia/events/evt-sabado-caliente/assets/flyer/sabado-caliente.jpg',
    url: 'https://example.public.blob.vercel-storage.com/sabado-caliente.jpg',
    downloadUrl: 'https://example.public.blob.vercel-storage.com/sabado-caliente.jpg?download=1',
    contentType: 'image/jpeg',
    size: 1_000_000,
    kind: 'image',
    role: 'primary-flyer',
    platforms: ['website'],
    status: 'approved',
    altText: 'Club Bahia Sábado Caliente flyer for August 8, 21+, with salsa and bachata.',
    notes: '',
    rightsConfirmedAt: timestamp,
    uploadedAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}

function workspace(
  briefValue: CampaignBrief,
  contentValue: CampaignContentItem[],
): EventGrowthWorkspace {
  return {
    eventId: event.id,
    brief: briefValue,
    readinessScore: 100,
    content: contentValue,
    milestones: [],
    history: [],
    updatedAt: timestamp,
  };
}

function assembly(assetId = 'flyer'): EventPostAssembly {
  return {
    eventId: event.id,
    packages: [
      {
        contentItemId: 'website',
        channel: 'website',
        assetIds: [assetId],
        primaryAssetId: assetId,
        updatedAt: timestamp,
      },
      {
        contentItemId: 'sms',
        channel: 'sms',
        assetIds: [],
        updatedAt: timestamp,
      },
    ],
    updatedAt: timestamp,
  };
}

const execution: EventPublishingExecution = {
  eventId: event.id,
  items: [],
  updatedAt: timestamp,
};

describe('campaign integrity gate', () => {
  it('allows a coherent campaign with matching media and compliant SMS', () => {
    const report = buildCampaignIntegrityReport({
      event,
      workspace: workspace(brief(), content()),
      assembly: assembly(),
      assets: [asset()],
      execution,
    });

    expect(report.canPublish).toBe(true);
    expect(report.blockers).toBe(0);
  });

  it('blocks a flyer from a different date, age restriction, and genre', () => {
    const report = buildCampaignIntegrityReport({
      event,
      workspace: workspace(brief(), content()),
      assembly: assembly(),
      assets: [
        asset({
          name: 'geist-goth-night.jpg',
          altText:
            'Club Bahia goth and darkwave flyer for May 21, 18+, featuring Bookthief and LSDMTHC.',
        }),
      ],
      execution,
    });

    expect(report.canPublish).toBe(false);
    expect(report.issues.some((item) => item.id === 'asset-date-flyer')).toBe(true);
    expect(report.issues.some((item) => item.id === 'asset-age-flyer')).toBe(true);
    expect(report.issues.some((item) => item.id === 'asset-genre-flyer')).toBe(true);
  });

  it('blocks untranslated Spanish CTA and missing SMS opt-out text', () => {
    const brokenContent = content([
      {
        body: 'Sábado Caliente.\n\n— Español —\n\nSábado Caliente. Reserve now.',
      },
      {
        body: 'Sábado Caliente tomorrow. Reserve now.',
      },
    ]);
    const report = buildCampaignIntegrityReport({
      event,
      workspace: workspace(brief(), brokenContent),
      assembly: assembly(),
      assets: [asset()],
      execution,
    });

    expect(report.issues.some((item) => item.id === 'spanish-cta-website')).toBe(true);
    expect(report.issues.some((item) => item.id === 'sms-opt-out')).toBe(true);
    expect(report.canPublish).toBe(false);
  });

  it('warns about temporary Preview URLs and test notes', () => {
    const previewContent = content([
      {
        body: 'Sábado Caliente. Reserve: https://club-bahia-git-test.vercel.app/reservations.\n\n— Español —\n\nReserva ahora.',
      },
    ]);
    const report = buildCampaignIntegrityReport({
      event,
      workspace: workspace(brief(), previewContent),
      assembly: assembly(),
      assets: [asset()],
      execution: {
        eventId: event.id,
        updatedAt: timestamp,
        items: [
          {
            contentItemId: 'website',
            channel: 'website',
            status: 'ready',
            notes: 'Hmmmm test',
            updatedAt: timestamp,
          },
        ],
      },
    });

    expect(report.issues.some((item) => item.id === 'preview-url')).toBe(true);
    expect(report.issues.some((item) => item.id === 'test-note-website')).toBe(true);
  });
});
