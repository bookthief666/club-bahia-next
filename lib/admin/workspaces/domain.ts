import type { AdminRole } from '@/lib/admin/domain';

export const ADMIN_WORKSPACE_KINDS = [
  'events',
  'growth',
  'post-assembly',
  'publishing-execution',
  'autopilot-publication',
  'autopilot-credential',
] as const;

export type AdminWorkspaceKind = (typeof ADMIN_WORKSPACE_KINDS)[number];

export interface AdminWorkspaceActor {
  id: string;
  name: string;
  role: AdminRole;
}

export interface AdminWorkspaceRecord<T = unknown> {
  schemaVersion: 1;
  kind: AdminWorkspaceKind;
  key: string;
  revision: number;
  value: T;
  updatedAt: string;
  updatedBy: AdminWorkspaceActor;
}

export const MAX_ADMIN_WORKSPACE_BYTES = 2_000_000;

export class AdminWorkspaceConflictError extends Error {
  readonly code = 'WORKSPACE_VERSION_CONFLICT';

  constructor(
    readonly expectedRevision: number,
    readonly currentRevision: number,
  ) {
    super(
      `Workspace revision conflict: expected ${expectedRevision}, current ${currentRevision}.`,
    );
    this.name = 'AdminWorkspaceConflictError';
  }
}

export function isAdminWorkspaceKind(value: unknown): value is AdminWorkspaceKind {
  return ADMIN_WORKSPACE_KINDS.includes(value as AdminWorkspaceKind);
}

export function parseAdminWorkspaceKey(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const key = value.trim();
  return /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,159}$/.test(key) ? key : null;
}

export function adminWorkspacePrefix(
  kind: AdminWorkspaceKind,
  key: string,
): string {
  const parsedKey = parseAdminWorkspaceKey(key);
  if (!parsedKey) throw new Error('Invalid Growth OS workspace key.');
  return `club-bahia/private-growth-os/${kind}/${parsedKey}/revisions/`;
}

export function adminWorkspaceRevisionPath(
  kind: AdminWorkspaceKind,
  key: string,
  revision: number,
): string {
  if (!Number.isSafeInteger(revision) || revision < 1) {
    throw new Error('Workspace revision must be a positive integer.');
  }
  return `${adminWorkspacePrefix(kind, key)}${String(revision).padStart(10, '0')}.json.enc`;
}

export function assertAdminWorkspaceValue(value: unknown): void {
  let serialized: string | undefined;
  try {
    serialized = JSON.stringify(value);
  } catch {
    throw new Error('Growth OS workspace data must be valid JSON.');
  }

  if (serialized === undefined) {
    throw new Error('Growth OS workspace data cannot be undefined.');
  }

  if (new TextEncoder().encode(serialized).byteLength > MAX_ADMIN_WORKSPACE_BYTES) {
    throw new Error('Growth OS workspace data is too large to save.');
  }
}

export function createAdminWorkspaceRecord<T>(input: {
  kind: AdminWorkspaceKind;
  key: string;
  value: T;
  actor: AdminWorkspaceActor;
  expectedRevision: number;
  current?: AdminWorkspaceRecord<unknown> | null;
  now?: Date;
}): AdminWorkspaceRecord<T> {
  const key = parseAdminWorkspaceKey(input.key);
  if (!key) throw new Error('Invalid Growth OS workspace key.');
  if (!Number.isSafeInteger(input.expectedRevision) || input.expectedRevision < 0) {
    throw new Error('Expected workspace revision must be a non-negative integer.');
  }
  assertAdminWorkspaceValue(input.value);

  const currentRevision = input.current?.revision ?? 0;
  if (input.expectedRevision !== currentRevision) {
    throw new AdminWorkspaceConflictError(
      input.expectedRevision,
      currentRevision,
    );
  }

  return {
    schemaVersion: 1,
    kind: input.kind,
    key,
    revision: currentRevision + 1,
    value: input.value,
    updatedAt: (input.now ?? new Date()).toISOString(),
    updatedBy: {
      id: input.actor.id,
      name: input.actor.name,
      role: input.actor.role,
    },
  };
}

export function isAdminWorkspaceRecord(
  value: unknown,
): value is AdminWorkspaceRecord<unknown> {
  if (!value || typeof value !== 'object') return false;
  const record = value as Partial<AdminWorkspaceRecord<unknown>>;
  const actor = record.updatedBy as Partial<AdminWorkspaceActor> | undefined;
  return (
    record.schemaVersion === 1 &&
    isAdminWorkspaceKind(record.kind) &&
    parseAdminWorkspaceKey(record.key) === record.key &&
    Number.isSafeInteger(record.revision) &&
    Number(record.revision) >= 1 &&
    typeof record.updatedAt === 'string' &&
    Boolean(actor) &&
    typeof actor?.id === 'string' &&
    typeof actor?.name === 'string' &&
    typeof actor?.role === 'string' &&
    'value' in record
  );
}
