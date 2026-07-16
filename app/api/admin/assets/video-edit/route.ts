import { NextResponse } from 'next/server';
import {
  approveVideoEditProject,
  prepareVideoEditDraft,
} from '@/lib/admin/assets/video-edit';
import {
  loadVideoEditProject,
  saveVideoEditProject,
} from '@/lib/admin/assets/video-edit-server';
import { VideoEditMutationSchema } from '@/lib/admin/assets/video-edit-validation';
import { requireAdminResourceAccess } from '@/lib/admin/auth/resource-access';
import { AdminWorkspaceConflictError } from '@/lib/admin/workspaces/domain';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' };

function authorizedJson(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE_HEADERS });
}

export async function GET(request: Request) {
  try {
    requireAdminResourceAccess(request);
  } catch (error) {
    return authorizedJson(
      { error: error instanceof Error ? error.message : 'Unauthorized.' },
      401,
    );
  }

  const url = new URL(request.url);
  const eventId = url.searchParams.get('eventId')?.trim() ?? '';
  if (!/^[a-zA-Z0-9_-]{1,160}$/.test(eventId)) {
    return authorizedJson({ error: 'A valid event ID is required.' }, 400);
  }

  try {
    const current = await loadVideoEditProject(eventId);
    return authorizedJson({
      project: current.project,
      revision: current.record?.revision ?? 0,
    });
  } catch (error) {
    return authorizedJson(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Could not load the vertical-video project.',
      },
      500,
    );
  }
}

export async function POST(request: Request) {
  let user;
  try {
    user = requireAdminResourceAccess(request);
  } catch (error) {
    return authorizedJson(
      { error: error instanceof Error ? error.message : 'Unauthorized.' },
      401,
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return authorizedJson({ error: 'Video edit request must be valid JSON.' }, 400);
  }

  const parsed = VideoEditMutationSchema.safeParse(body);
  if (!parsed.success) {
    return authorizedJson(
      {
        error: 'Video edit request failed validation.',
        details: parsed.error.flatten(),
      },
      400,
    );
  }

  const mutation = parsed.data;
  if (mutation.project.eventId !== mutation.eventId) {
    return authorizedJson(
      { error: 'The vertical-video project does not belong to this event.' },
      400,
    );
  }

  try {
    const project =
      mutation.action === 'approve'
        ? approveVideoEditProject(mutation.project)
        : prepareVideoEditDraft(mutation.project);
    const record = await saveVideoEditProject({
      eventId: mutation.eventId,
      project,
      expectedRevision: mutation.expectedRevision,
      user,
    });
    return authorizedJson({ project: record.value, revision: record.revision });
  } catch (error) {
    if (error instanceof AdminWorkspaceConflictError) {
      return authorizedJson(
        {
          error:
            'The vertical-video edit changed in another browser. Reload before saving again.',
          expectedRevision: error.expectedRevision,
          currentRevision: error.currentRevision,
        },
        409,
      );
    }
    return authorizedJson(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Could not save the vertical-video project.',
      },
      400,
    );
  }
}
