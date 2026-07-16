import { describe, expect, it } from 'vitest';
import type { MediaLibraryAsset } from '../lib/admin/assets/library-domain';
import {
  approveVideoEditProject,
  createVideoEditProject,
  isVideoEditApprovalCurrent,
  prepareVideoEditDraft,
  videoEditReadiness,
  videoEditTotalDuration,
  type VideoEditClip,
} from '../lib/admin/assets/video-edit';
import { canonicalizeVideoEditSources } from '../lib/admin/assets/video-edit-sources';
import { VideoEditProjectSchema } from '../lib/admin/assets/video-edit-validation';
import type { OperationsEvent } from '../lib/admin/domain';
import type { CampaignContentItem } from '../lib/admin/growth/domain';

const NOW = new Date('2026-07-16T00:00:00.000Z');

function event(): OperationsEvent {
  return {
    id: 'event-friday',
    title: 'Azucar LA — Friday, July 17',
    concept: 'Live Latin dance music.',
    startsAt: '2026-07-18T04:00:00.000Z',
    endsAt: '2026-07-18T08:00:00.000Z',
    status: 'approved',
    room: 'Main room',
    capacityTarget: 250,
    ticketsSold: 0,
    owner: 'Luis',
    marketingLaunchAt: NOW.toISOString(),
    riskFlags: [],
    revenueTarget: 0,
    committedCosts: 0,
  };
}

function reelItem(): CampaignContentItem {
  return {
    id: 'reel',
    channel: 'reel',
    title: '15-second vertical video',
    body: 'Instagram Reel caption:\nDance with Azucar LA.\n\nTikTok caption:\nFriday plans solved.',
    status: 'approved',
    publishingMode: 'manual',
    callToAction: 'Reserve your Friday night',
    structured: {
      reelShots: [
        { startSecond: 0, endSecond: 3, shot: 'Club Bahia exterior.' },
        { startSecond: 3, endSecond: 8, shot: 'Crowd and dancing.' },
        { startSecond: 8, endSecond: 11, shot: 'Azucar LA on stage.' },
        { startSecond: 11, endSecond: 15, shot: 'Event details and CTA.' },
      ],
      shortVideoVariants: [
        {
          platform: 'instagram-reel',
          caption: 'Dance with Azucar LA this Friday.',
          title: 'Azucar LA Friday',
          hashtags: ['#ClubBahia', '#AzucarLA'],
        },
        {
          platform: 'tiktok',
          caption: 'Your Friday night plans are solved.',
          title: 'Friday at Club Bahia',
          hashtags: ['#LATok', '#ClubBahia'],
        },
      ],
    },
    updatedAt: NOW.toISOString(),
  };
}

function clip(
  id: string,
  shotId: string,
  start: number,
  end: number,
): VideoEditClip {
  return {
    id,
    sourceLibraryAssetId: `media-${id}`,
    sourceName: `${id}.mp4`,
    sourceUrl: `https://assets.example.com/${id}.mp4`,
    sourceDurationSeconds: 20,
    shotId,
    trimStartSeconds: start,
    trimEndSeconds: end,
    muted: true,
  };
}

function libraryVideo(id: string, overrides: Partial<MediaLibraryAsset> = {}): MediaLibraryAsset {
  return {
    schemaVersion: 1,
    id: `media-${id}`,
    sourceEventId: 'source-event',
    sourceAssetId: `source-${id}`,
    name: `Canonical ${id}.mp4`,
    pathname: `club-bahia/media/${id}.mp4`,
    url: `https://canonical.example.com/${id}.mp4`,
    downloadUrl: `https://canonical.example.com/${id}.mp4?download=1`,
    contentType: 'video/mp4',
    size: 2_000_000,
    kind: 'video',
    role: 'raw-video',
    platforms: ['reel', 'tiktok'],
    status: 'active',
    altText: `Club Bahia ${id} footage.`,
    notes: '',
    collections: ['crowd-energy'],
    tags: ['crowd'],
    performers: [],
    genres: [],
    orientation: 'vertical-video',
    width: 1080,
    height: 1920,
    durationSeconds: 20,
    qualityRating: 4,
    rightsBasis: 'club-bahia-owned',
    rightsNote: 'Club Bahia footage.',
    credit: 'Club Bahia',
    rightsConfirmedAt: NOW.toISOString(),
    derivatives: [],
    usageHistory: [],
    usageCount: 0,
    createdAt: NOW.toISOString(),
    updatedAt: NOW.toISOString(),
    ...overrides,
  };
}

function completeProject() {
  const project = createVideoEditProject({ event: event(), item: reelItem(), now: NOW });
  return prepareVideoEditDraft(
    {
      ...project,
      clips: [
        clip('one', 'shot-1', 0, 3),
        clip('two', 'shot-2', 1, 6),
        clip('three', 'shot-3', 2, 5),
        clip('four', 'shot-4', 4, 8),
      ],
    },
    NOW,
  );
}

describe('vertical video sequencing', () => {
  it('inherits the campaign shot plan and separate platform packages', () => {
    const project = createVideoEditProject({ event: event(), item: reelItem(), now: NOW });
    expect(project.targetDurationSeconds).toBe(15);
    expect(project.shots).toHaveLength(4);
    expect(project.shots[1].description).toContain('Crowd');
    expect(project.platformPackages).toHaveLength(2);
    expect(project.platformPackages[0].caption).not.toBe(
      project.platformPackages[1].caption,
    );
    expect(VideoEditProjectSchema.parse(project).eventId).toBe('event-friday');
  });

  it('requires every shot and a timeline within 0.25 seconds of target', () => {
    const project = completeProject();
    const readiness = videoEditReadiness(project);
    expect(videoEditTotalDuration(project)).toBe(15);
    expect(readiness.coveredShotIds).toHaveLength(4);
    expect(readiness.ready).toBe(true);
  });

  it('blocks missing shots and off-target duration', () => {
    const project = createVideoEditProject({ event: event(), item: reelItem(), now: NOW });
    const draft = prepareVideoEditDraft(
      { ...project, clips: [clip('one', 'shot-1', 0, 2)] },
      NOW,
    );
    const readiness = videoEditReadiness(draft);
    expect(readiness.ready).toBe(false);
    expect(readiness.issues.some((issue) => issue.id === 'duration-target')).toBe(true);
    expect(readiness.issues.filter((issue) => issue.id.startsWith('shot-empty-'))).toHaveLength(3);
  });

  it('blocks trim points beyond known source duration', () => {
    const project = completeProject();
    const invalid = prepareVideoEditDraft(
      {
        ...project,
        clips: project.clips.map((item, index) =>
          index === 0
            ? { ...item, sourceDurationSeconds: 2, trimEndSeconds: 3 }
            : item,
        ),
      },
      NOW,
    );
    expect(
      videoEditReadiness(invalid).issues.some((issue) => issue.id.startsWith('clip-source-')),
    ).toBe(true);
  });

  it('requires genuinely separate Instagram and TikTok captions', () => {
    const project = completeProject();
    const instagram = project.platformPackages.find(
      (item) => item.platform === 'instagram-reel',
    )!;
    const duplicate = prepareVideoEditDraft(
      {
        ...project,
        platformPackages: project.platformPackages.map((item) => ({
          ...item,
          caption: instagram.caption,
        })),
      },
      NOW,
    );
    expect(
      videoEditReadiness(duplicate).issues.some(
        (issue) => issue.id === 'duplicate-platform-caption',
      ),
    ).toBe(true);
  });

  it('approves only a ready recipe and invalidates approval after editing', () => {
    const approved = approveVideoEditProject(completeProject(), NOW);
    expect(approved.status).toBe('approved');
    expect(isVideoEditApprovalCurrent(approved)).toBe(true);

    const changed = prepareVideoEditDraft(
      {
        ...approved,
        clips: approved.clips.map((item, index) =>
          index === 0 ? { ...item, muted: false } : item,
        ),
      },
      new Date('2026-07-16T00:01:00.000Z'),
    );
    expect(changed.status).toBe('draft');
    expect(changed.approvedContentVersion).toBeUndefined();
    expect(isVideoEditApprovalCurrent(changed)).toBe(false);
  });

  it('replaces browser-supplied names, URLs, and duration with canonical library facts', () => {
    const project = completeProject();
    const canonical = canonicalizeVideoEditSources({
      project,
      assets: ['one', 'two', 'three', 'four'].map((id) => libraryVideo(id)),
    });
    expect(canonical.clips[0].sourceName).toBe('Canonical one.mp4');
    expect(canonical.clips[0].sourceUrl).toBe(
      'https://canonical.example.com/one.mp4',
    );
    expect(canonical.clips[0].sourceDurationSeconds).toBe(20);
  });

  it('rejects archived or non-video source substitutions', () => {
    const project = completeProject();
    expect(() =>
      canonicalizeVideoEditSources({
        project,
        assets: [
          libraryVideo('one', { status: 'archived' }),
          libraryVideo('two'),
          libraryVideo('three'),
          libraryVideo('four'),
        ],
      }),
    ).toThrow(/no longer active/i);
    expect(() =>
      canonicalizeVideoEditSources({
        project,
        assets: [
          libraryVideo('one', { kind: 'image', contentType: 'image/jpeg' }),
          libraryVideo('two'),
          libraryVideo('three'),
          libraryVideo('four'),
        ],
      }),
    ).toThrow(/not a video/i);
  });
});
