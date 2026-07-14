import { describe, expect, it } from 'vitest';
import {
  CLIENT_ADMIN_WORKSPACE_KINDS,
  isClientAdminWorkspaceKind,
} from '../lib/admin/workspaces/client-kinds';
import { isAdminWorkspaceKind } from '../lib/admin/workspaces/domain';

describe('Growth OS workspace access boundary', () => {
  it('allows the four collaborative browser workspaces', () => {
    expect(CLIENT_ADMIN_WORKSPACE_KINDS).toEqual([
      'events',
      'growth',
      'post-assembly',
      'publishing-execution',
    ]);
    expect(CLIENT_ADMIN_WORKSPACE_KINDS.every(isClientAdminWorkspaceKind)).toBe(
      true,
    );
  });

  it('keeps publication claims and OAuth credentials server-only', () => {
    expect(isAdminWorkspaceKind('autopilot-publication')).toBe(true);
    expect(isAdminWorkspaceKind('autopilot-credential')).toBe(true);
    expect(isClientAdminWorkspaceKind('autopilot-publication')).toBe(false);
    expect(isClientAdminWorkspaceKind('autopilot-credential')).toBe(false);
  });
});
