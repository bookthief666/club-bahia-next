import 'server-only';

import type { AdminUser } from '@/lib/admin/domain';
import type { AdminWorkspaceRecord } from '@/lib/admin/workspaces/domain';
import {
  getAdminWorkspaceRecord,
  saveAdminWorkspaceRecord,
} from '@/lib/admin/workspaces/server';
import type { VideoEditProject } from './video-edit';
import { VideoEditProjectSchema } from './video-edit-validation';

export function normalizeVideoEditProject(value: unknown): VideoEditProject | null {
  const parsed = VideoEditProjectSchema.safeParse(value);
  return parsed.success ? (parsed.data as VideoEditProject) : null;
}

export async function loadVideoEditProject(eventId: string): Promise<{
  record: AdminWorkspaceRecord<VideoEditProject> | null;
  project: VideoEditProject | null;
}> {
  const record = await getAdminWorkspaceRecord<VideoEditProject>(
    'video-edit',
    eventId,
  );
  return {
    record,
    project: normalizeVideoEditProject(record?.value),
  };
}

export async function saveVideoEditProject(input: {
  eventId: string;
  project: VideoEditProject;
  expectedRevision: number;
  user: AdminUser;
}) {
  if (input.project.eventId !== input.eventId) {
    throw new Error('Vertical-video project does not belong to this event.');
  }
  const project = VideoEditProjectSchema.parse(input.project) as VideoEditProject;
  return saveAdminWorkspaceRecord({
    kind: 'video-edit',
    key: input.eventId,
    value: project,
    expectedRevision: input.expectedRevision,
    user: input.user,
  });
}
