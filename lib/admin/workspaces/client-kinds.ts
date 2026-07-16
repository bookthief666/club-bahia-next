import type { AdminWorkspaceKind } from '@/lib/admin/workspaces/domain';

export const CLIENT_ADMIN_WORKSPACE_KINDS = [
  'events',
  'growth',
  'post-assembly',
  'publishing-execution',
] as const satisfies readonly AdminWorkspaceKind[];

export type ClientAdminWorkspaceKind =
  (typeof CLIENT_ADMIN_WORKSPACE_KINDS)[number];

export function isClientAdminWorkspaceKind(
  value: unknown,
): value is ClientAdminWorkspaceKind {
  return CLIENT_ADMIN_WORKSPACE_KINDS.includes(
    value as ClientAdminWorkspaceKind,
  );
}
