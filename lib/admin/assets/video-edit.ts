import type { OperationsEvent } from '@/lib/admin/domain';
import type {
  CampaignContentItem,
  CampaignReelShot,
  ShortVideoPlatform,
} from '@/lib/admin/growth/domain';
import { buildShortVideoPublicationDrafts } from '@/lib/admin/autopilot/short-video';

export type VideoEditStatus = 'draft' | 'approved';

export interface VideoEditShot {
  id: string;
  order: number;
  startSecond: number;
  endSecond: number;
  description: string;
  onScreenText?: string;
  voiceover?: string;
}

export interface VideoEditClip {
  id: string;
  sourceLibraryAssetId: string;
  sourceName: string;
  sourceUrl: string;
  sourceDurationSeconds?: number;
  shotId: string;
  trimStartSeconds: number;
  trimEndSeconds: number;
  muted: boolean;
}

export interface VideoEditPlatformPackage {
  platform: ShortVideoPlatform;
  caption: string;
  title: string;
  hashtags: string[];
  postingNotes: string;
  coverDerivativeId?: string;
}

export interface VideoEditProject {
  schemaVersion: 1;
  eventId: string;
  eventTitle: string;
  campaignContentItemId: string;
  targetDurationSeconds: number;
  status: VideoEditStatus;
  shots: VideoEditShot[];
  clips: VideoEditClip[];
  platformPackages: VideoEditPlatformPackage[];
  contentVersion: string;
  approvedContentVersion?: string;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
}

export interface VideoEditReadinessIssue {
  id: string;
  severity: 'error' | 'warning';
  message: string;
  shotId?: string;
  clipId?: string;
}

export interface VideoEditReadiness {
  ready: boolean;
  totalDurationSeconds: number;
  targetDurationSeconds: number;
  coveredShotIds: string[];
  issues: VideoEditReadinessIssue[];
}

const DEFAULT_SHOTS: CampaignReelShot[] = [
  {
    startSecond: 0,
    endSecond: 3,
    shot: 'Open with the strongest Club Bahia establishing shot.',
    onScreenText: 'Club Bahia',
  },
  {
    startSecond: 3,
    endSecond: 8,
    shot: 'Show atmosphere, movement, and dance-floor energy.',
  },
  {
    startSecond: 8,
    endSecond: 11,
    shot: 'Feature the performer, band, or defining event detail.',
  },
  {
    startSecond: 11,
    endSecond: 15,
    shot: 'Close with the event details and call to action.',
  },
];

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function clean(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function uniqueHashtags(values: string[]): string[] {
  const seen = new Set<string>();
  return values
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => (value.startsWith('#') ? value : `#${value}`))
    .filter((value) => {
      const key = value.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 12);
}

function stableHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `ve-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function sortedShots(shots: CampaignReelShot[] | undefined): VideoEditShot[] {
  const source = shots?.length ? shots : DEFAULT_SHOTS;
  return source
    .filter(
      (shot) =>
        Number.isFinite(shot.startSecond) &&
        Number.isFinite(shot.endSecond) &&
        shot.endSecond > shot.startSecond,
    )
    .sort((left, right) => left.startSecond - right.startSecond)
    .slice(0, 12)
    .map((shot, order) => ({
      id: `shot-${order + 1}`,
      order,
      startSecond: round(shot.startSecond),
      endSecond: round(shot.endSecond),
      description: clean(shot.shot) || `Shot ${order + 1}`,
      onScreenText: shot.onScreenText ? clean(shot.onScreenText) : undefined,
      voiceover: shot.voiceover ? clean(shot.voiceover) : undefined,
    }));
}

function platformPackages(
  item: CampaignContentItem,
  eventTitle: string,
): VideoEditPlatformPackage[] {
  return buildShortVideoPublicationDrafts({ item, eventTitle }).map((draft) => ({
    platform: draft.platform,
    caption: draft.caption.trim(),
    title: draft.title?.trim() || eventTitle,
    hashtags: uniqueHashtags(draft.hashtags),
    postingNotes: draft.postingNotes?.trim() || '',
  }));
}

function projectContent(project: VideoEditProject): unknown {
  return {
    eventId: project.eventId,
    eventTitle: project.eventTitle,
    campaignContentItemId: project.campaignContentItemId,
    targetDurationSeconds: project.targetDurationSeconds,
    shots: project.shots,
    clips: project.clips,
    platformPackages: project.platformPackages,
  };
}

export function videoEditContentVersion(project: VideoEditProject): string {
  return stableHash(JSON.stringify(projectContent(project)));
}

export function clipDurationSeconds(clip: VideoEditClip): number {
  return round(Math.max(0, clip.trimEndSeconds - clip.trimStartSeconds));
}

export function videoEditTotalDuration(project: VideoEditProject): number {
  return round(project.clips.reduce((total, clip) => total + clipDurationSeconds(clip), 0));
}

export function createVideoEditProject(input: {
  event: OperationsEvent;
  item: CampaignContentItem;
  now?: Date;
}): VideoEditProject {
  if (input.item.channel !== 'reel') {
    throw new Error('A vertical-video edit requires the Reel campaign item.');
  }
  const now = (input.now ?? new Date()).toISOString();
  const shots = sortedShots(input.item.structured?.reelShots);
  const targetDurationSeconds = round(
    Math.max(1, shots.reduce((maximum, shot) => Math.max(maximum, shot.endSecond), 0)),
  );
  const project: VideoEditProject = {
    schemaVersion: 1,
    eventId: input.event.id,
    eventTitle: input.event.title,
    campaignContentItemId: input.item.id,
    targetDurationSeconds,
    status: 'draft',
    shots,
    clips: [],
    platformPackages: platformPackages(input.item, input.event.title),
    contentVersion: '',
    createdAt: now,
    updatedAt: now,
  };
  return { ...project, contentVersion: videoEditContentVersion(project) };
}

export function prepareVideoEditDraft(
  project: VideoEditProject,
  now: Date = new Date(),
): VideoEditProject {
  const next: VideoEditProject = {
    ...project,
    status: 'draft',
    clips: project.clips.map((clip) => ({
      ...clip,
      trimStartSeconds: round(clip.trimStartSeconds),
      trimEndSeconds: round(clip.trimEndSeconds),
    })),
    platformPackages: project.platformPackages.map((item) => ({
      ...item,
      caption: item.caption.trim(),
      title: item.title.trim(),
      hashtags: uniqueHashtags(item.hashtags),
      postingNotes: item.postingNotes.trim(),
    })),
    approvedAt: undefined,
    approvedContentVersion: undefined,
    updatedAt: now.toISOString(),
  };
  return { ...next, contentVersion: videoEditContentVersion(next) };
}

export function videoEditReadiness(project: VideoEditProject): VideoEditReadiness {
  const issues: VideoEditReadinessIssue[] = [];
  const shotIds = new Set(project.shots.map((shot) => shot.id));
  const coveredShotIds = new Set<string>();

  if (!project.clips.length) {
    issues.push({
      id: 'no-clips',
      severity: 'error',
      message: 'Add at least one approved reusable video clip.',
    });
  }
  if (project.clips.length > 12) {
    issues.push({
      id: 'too-many-clips',
      severity: 'error',
      message: 'Keep the edit to 12 clips or fewer.',
    });
  }

  project.clips.forEach((clip, index) => {
    const duration = clipDurationSeconds(clip);
    if (!shotIds.has(clip.shotId)) {
      issues.push({
        id: `clip-shot-${clip.id}`,
        severity: 'error',
        message: `Clip ${index + 1} is not assigned to a valid shot.`,
        clipId: clip.id,
      });
    } else {
      coveredShotIds.add(clip.shotId);
    }
    if (duration < 0.25) {
      issues.push({
        id: `clip-short-${clip.id}`,
        severity: 'error',
        message: `Clip ${index + 1} must be at least 0.25 seconds long.`,
        clipId: clip.id,
      });
    }
    if (duration > 15) {
      issues.push({
        id: `clip-long-${clip.id}`,
        severity: 'error',
        message: `Clip ${index + 1} cannot exceed 15 seconds.`,
        clipId: clip.id,
      });
    }
    if (clip.trimStartSeconds < 0 || clip.trimEndSeconds <= clip.trimStartSeconds) {
      issues.push({
        id: `clip-trim-${clip.id}`,
        severity: 'error',
        message: `Clip ${index + 1} has invalid trim points.`,
        clipId: clip.id,
      });
    }
    if (
      clip.sourceDurationSeconds !== undefined &&
      clip.trimEndSeconds > clip.sourceDurationSeconds + 0.05
    ) {
      issues.push({
        id: `clip-source-${clip.id}`,
        severity: 'error',
        message: `Clip ${index + 1} extends beyond the source video.`,
        clipId: clip.id,
      });
    }
  });

  project.shots.forEach((shot) => {
    if (!coveredShotIds.has(shot.id)) {
      issues.push({
        id: `shot-empty-${shot.id}`,
        severity: 'error',
        message: `Add footage for shot ${shot.order + 1}: ${shot.description}`,
        shotId: shot.id,
      });
    }
  });

  const totalDurationSeconds = videoEditTotalDuration(project);
  const difference = Math.abs(totalDurationSeconds - project.targetDurationSeconds);
  if (difference > 0.25) {
    issues.push({
      id: 'duration-target',
      severity: 'error',
      message: `Timeline is ${totalDurationSeconds.toFixed(2)} seconds; target ${project.targetDurationSeconds.toFixed(2)} seconds within 0.25 seconds.`,
    });
  }

  const instagram = project.platformPackages.find(
    (item) => item.platform === 'instagram-reel',
  );
  const tiktok = project.platformPackages.find((item) => item.platform === 'tiktok');
  if (!instagram?.caption.trim()) {
    issues.push({
      id: 'instagram-caption',
      severity: 'error',
      message: 'Instagram Reel needs a caption.',
    });
  }
  if (!tiktok?.caption.trim()) {
    issues.push({
      id: 'tiktok-caption',
      severity: 'error',
      message: 'TikTok needs a caption.',
    });
  }
  if (
    instagram?.caption.trim() &&
    tiktok?.caption.trim() &&
    instagram.caption.trim() === tiktok.caption.trim()
  ) {
    issues.push({
      id: 'duplicate-platform-caption',
      severity: 'error',
      message: 'Instagram Reel and TikTok captions must remain platform-specific.',
    });
  }
  project.platformPackages.forEach((item) => {
    if (!item.title.trim()) {
      issues.push({
        id: `title-${item.platform}`,
        severity: 'error',
        message: `${item.platform === 'instagram-reel' ? 'Instagram Reel' : 'TikTok'} needs a title or cover label.`,
      });
    }
    if (item.hashtags.length > 12) {
      issues.push({
        id: `hashtags-${item.platform}`,
        severity: 'error',
        message: 'Keep platform hashtags to 12 or fewer.',
      });
    }
  });

  return {
    ready: !issues.some((issue) => issue.severity === 'error'),
    totalDurationSeconds,
    targetDurationSeconds: project.targetDurationSeconds,
    coveredShotIds: [...coveredShotIds],
    issues,
  };
}

export function approveVideoEditProject(
  project: VideoEditProject,
  now: Date = new Date(),
): VideoEditProject {
  const draft = prepareVideoEditDraft(project, now);
  const readiness = videoEditReadiness(draft);
  if (!readiness.ready) {
    throw new Error(readiness.issues[0]?.message || 'The vertical-video edit is not ready.');
  }
  return {
    ...draft,
    status: 'approved',
    approvedContentVersion: draft.contentVersion,
    approvedAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

export function isVideoEditApprovalCurrent(project: VideoEditProject): boolean {
  return (
    project.status === 'approved' &&
    project.approvedContentVersion === videoEditContentVersion(project)
  );
}
