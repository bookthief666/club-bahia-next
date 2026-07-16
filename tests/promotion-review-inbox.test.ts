import { describe, expect, it } from 'vitest';
import type { EventAsset } from '../lib/admin/assets/domain';
import {
  createQueueJob,
  emptyPublishingQueue,
  failQueueJob,
} from '../lib/admin/autopilot/queue-domain';
import type { OperationsEvent } from '../lib/admin/domain';
import type {
  CampaignContentItem,
  EventGrowthWorkspace,
} from '../lib/admin/growth/domain';
import type { EventPostAssembly } from '../lib/admin/publishing/domain';
import {
  buildPromotionReviewItems,
  filterPromotionReviewItems,
  summarizePromotionReviewItems,
  type PromotionReviewSource,
} from '../lib/admin/review/domain';

const timestamp = '2026-07-16T18:00:00.000Z';

function event(): OperationsEvent {
  return {
    id: 'evt-review',
    title: 'Azucar Friday',
    concept: 'Live cumbia, salsa, bachata, and merengue',
    startsAt: '2026-07-18T04:00:00.000Z',
    endsAt: '2026-07-18T08:00:00.000Z',
    status: 'announced',
    room: 'Main room',
    capacityTarget: 250,
    ticketsSold: 0,
    owner: 'Luis',
    marketingLaunchAt: '2026-07-10T19:00:00.000Z',
    riskFlags: [],
    revenueTarget: 0,
    committedCosts: 0,
  };
}

function content(body = 'Azucar Friday brings live cumbia, salsa, bachata, and merengue to Club Bahia. Reserve your table today.'): CampaignContentItem {
  return {
    id: 'content-website',
    channel: 'website',
    title: 'Website event listing',
    body,
    status: 'draft',
    publishingMode: 'automatic',
    publishAt: '2026-07-16T20:00:00.000Z',
    callToAction: 'Reserve now',
    updatedAt: timestamp,
  };
}

function workspace(item = content()): EventGrowthWorkspace {
  return {
    eventId: 'evt-review',
    brief: {
      theme: 'Azucar Friday',
      targetAudience: 'Club Bahia regulars and nearby Los Angeles nightlife audiences',
      objective: 'reservations',
      tone: 'warm, energetic, and welcoming',
      offer: 'Reserve now',
      budgetCents: 0,
      language: 'english',
      performers: 'Azucar LA',
      genres: 'cumbia, salsa, bachata, merengue',
      doorsTime: '9:00 PM',
      admission: '',
      ageRestriction: '',
      foodDrinkSpecial: '',
      reservationUrl: 'https://club-bahia.example/reservations?event=evt-review',
      address: '1130 W Sunset Blvd, Los Angeles, CA',
      mainAttraction: 'Azucar LA live',
    },
    readinessScore: 45,
    content: [item],
    milestones: [],
    history: [],
    updatedAt: timestamp,
    generatedAt: timestamp,
    generationProvider: 'fixture',
  };
}

function asset(): EventAsset {
  return {
    id: 'asset-feed',
    eventId: 'evt-review',
    name: 'Azucar crowd.jpg',
    pathname: 'club-bahia/events/evt-review/assets/asset-feed/crowd.jpg',
    url: 'https://assets.example/crowd.jpg',
    downloadUrl: 'https://assets.example/crowd.jpg',
    contentType: 'image/jpeg',
    size: 1000,
    kind: 'image',
    role: 'primary-flyer',
    platforms: ['website', 'instagram-feed', 'facebook'],
    status: 'approved',
    altText: 'Azucar LA performing for dancers at Club Bahia.',
    notes: '',
    rightsConfirmedAt: timestamp,
    uploadedAt: timestamp,
    updatedAt: timestamp,
  };
}

function assembly(assigned = true): EventPostAssembly {
  return {
    eventId: 'evt-review',
    packages: assigned
      ? [
          {
            contentItemId: 'content-website',
            channel: 'website',
            assetIds: ['asset-feed'],
            primaryAssetId: 'asset-feed',
            updatedAt: timestamp,
          },
        ]
      : [],
    updatedAt: timestamp,
  };
}

function source(overrides: Partial<PromotionReviewSource> = {}): PromotionReviewSource {
  return {
    event: event(),
    workspace: workspace(),
    assembly: assembly(),
    assets: [asset()],
    queueJobs: [],
    mediaAccess: 'available',
    ...overrides,
  };
}

describe('universal promotion review inbox', () => {
  it('marks a fully verified draft as safe for explicit bulk approval', () => {
    const [item] = buildPromotionReviewItems([source()]);

    expect(item.lane).toBe('ready');
    expect(item.bulkApprovable).toBe(true);
    expect(item.blockingReasons).toEqual([]);
    expect(item.primaryAsset?.id).toBe('asset-feed');
  });

  it('keeps an available approved asset in the missing-media lane until it is assigned', () => {
    const [item] = buildPromotionReviewItems([
      source({ assembly: assembly(false) }),
    ]);

    expect(item.lane).toBe('missing-media');
    expect(item.bulkApprovable).toBe(false);
    expect(item.autoAssignableAssetId).toBe('asset-feed');
  });

  it('blocks bulk approval when warning-level campaign language needs review', () => {
    const rough = content(
      'Azucar Friday details are TBD. Reserve your table for live music at Club Bahia.',
    );
    const [item] = buildPromotionReviewItems([
      source({ workspace: workspace(rough) }),
    ]);

    expect(item.lane).toBe('needs-review');
    expect(item.bulkApprovable).toBe(false);
    expect(item.blockingReasons).toContain(
      'Rough brief language remains in the campaign',
    );
  });

  it('does not treat visual posts as safe when protected media cannot be verified', () => {
    const [item] = buildPromotionReviewItems([
      source({ assets: [], mediaAccess: 'locked' }),
    ]);

    expect(item.lane).toBe('missing-media');
    expect(item.bulkApprovable).toBe(false);
    expect(item.blockingReasons.join(' ')).toContain('Unlock event media');
  });

  it('promotes provider failures above ordinary copy-review lanes and blocks batch approval', () => {
    const created = createQueueJob(
      {
        id: 'queue-website',
        eventId: 'evt-review',
        eventTitle: 'Azucar Friday',
        contentItemId: 'content-website',
        label: 'Instagram feed proof',
        provider: 'meta',
        channel: 'instagram-feed',
        scheduledFor: '2026-07-16T20:00:00.000Z',
        payload: {
          caption: 'Azucar Friday at Club Bahia.',
          mediaUrl: 'https://assets.example/crowd.jpg',
          mediaKind: 'image',
        },
        executionSupport: 'automatic',
      },
      new Date(timestamp),
    );
    const failed = failQueueJob({
      queue: { ...emptyPublishingQueue(), jobs: [created] },
      jobId: created.id,
      error: 'Provider rejected the request.',
      retryable: false,
      now: new Date(timestamp),
    }).jobs[0];
    const [item] = buildPromotionReviewItems([
      source({ queueJobs: [failed] }),
    ]);

    expect(item.lane).toBe('problems');
    expect(item.bulkApprovable).toBe(false);
    expect(item.blockingReasons.join(' ')).toContain('publishing job');
    expect(item.queue[0]).toMatchObject({
      status: 'failed',
      lastError: 'Provider rejected the request.',
    });
  });

  it('summarizes and filters cross-event action lanes', () => {
    const ready = buildPromotionReviewItems([source()])[0];
    const missing = buildPromotionReviewItems([
      source({ assembly: assembly(false) }),
    ])[0];
    const items = [ready, { ...missing, key: 'evt-review:missing-copy' }];
    const summary = summarizePromotionReviewItems(items);

    expect(summary).toMatchObject({
      total: 2,
      ready: 1,
      missingMedia: 1,
      bulkApprovable: 1,
      autoAssignable: 1,
    });
    expect(
      filterPromotionReviewItems({
        items,
        lane: 'missing-media',
        query: 'Azucar',
      }),
    ).toHaveLength(1);
  });
});
