'use client';

import type {
  ClientAdminWorkspaceKind,
} from '@/lib/admin/workspaces/client-kinds';
import type {
  AdminWorkspaceRecord,
} from '@/lib/admin/workspaces/domain';

const WORKSPACE_API = '/api/admin/workspaces';

export class SharedWorkspaceConflictError extends Error {
  readonly code = 'WORKSPACE_VERSION_CONFLICT';

  constructor(readonly currentRevision?: number) {
    super(
      'This Growth OS workspace changed in another browser. Reload the page before saving again.',
    );
    this.name = 'SharedWorkspaceConflictError';
  }
}

interface WorkspaceApiError {
  error?: string;
  code?: string;
  currentRevision?: number;
}

function endpoint(kind: ClientAdminWorkspaceKind, key: string): string {
  const query = new URLSearchParams({ kind, key });
  return `${WORKSPACE_API}?${query.toString()}`;
}

async function responseJson<T>(response: Response): Promise<T> {
  const result = (await response.json()) as T & WorkspaceApiError;
  if (response.status === 409 || result.code === 'WORKSPACE_VERSION_CONFLICT') {
    throw new SharedWorkspaceConflictError(result.currentRevision);
  }
  if (!response.ok) {
    throw new Error(result.error || 'Could not access shared Growth OS storage.');
  }
  return result;
}

export function canUseSharedWorkspaceStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.fetch === 'function';
}

export async function loadSharedWorkspace<T>(
  kind: ClientAdminWorkspaceKind,
  key: string,
): Promise<AdminWorkspaceRecord<T> | null> {
  const response = await window.fetch(endpoint(kind, key), {
    method: 'GET',
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });
  const result = await responseJson<{ record: AdminWorkspaceRecord<T> | null }>(
    response,
  );
  return result.record;
}

export async function saveSharedWorkspace<T>(input: {
  kind: ClientAdminWorkspaceKind;
  key: string;
  value: T;
  expectedRevision: number;
}): Promise<AdminWorkspaceRecord<T>> {
  const response = await window.fetch(WORKSPACE_API, {
    method: 'PUT',
    credentials: 'same-origin',
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
  const result = await responseJson<{ record: AdminWorkspaceRecord<T> }>(response);
  return result.record;
}

export async function loadOrMigrateSharedWorkspace<T>(input: {
  kind: ClientAdminWorkspaceKind;
  key: string;
  legacyValue?: T;
}): Promise<AdminWorkspaceRecord<T> | null> {
  const current = await loadSharedWorkspace<T>(input.kind, input.key);
  if (current || input.legacyValue === undefined) return current;

  try {
    return await saveSharedWorkspace({
      kind: input.kind,
      key: input.key,
      value: input.legacyValue,
      expectedRevision: 0,
    });
  } catch (error) {
    if (error instanceof SharedWorkspaceConflictError) {
      return loadSharedWorkspace<T>(input.kind, input.key);
    }
    throw error;
  }
}
