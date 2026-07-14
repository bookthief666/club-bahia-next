import { describe, expect, it } from 'vitest';
import {
  AdminWorkspaceConflictError,
  adminWorkspacePrefix,
  adminWorkspaceRevisionPath,
  createAdminWorkspaceRecord,
  isAdminWorkspaceRecord,
  parseAdminWorkspaceKey,
} from '../lib/admin/workspaces/domain';

const actor = {
  id: 'club-bahia-owner',
  name: 'Club Bahia Owner',
  role: 'owner' as const,
};

describe('shared Growth OS workspace records', () => {
  it('creates append-only revision metadata without changing the workspace value', () => {
    const value = { eventId: 'evt-1', title: 'Friday Night' };
    const first = createAdminWorkspaceRecord({
      kind: 'growth',
      key: 'evt-1',
      value,
      actor,
      expectedRevision: 0,
      now: new Date('2026-07-14T01:00:00.000Z'),
    });
    const second = createAdminWorkspaceRecord({
      kind: 'growth',
      key: 'evt-1',
      value: { ...value, title: 'Updated Friday Night' },
      actor,
      expectedRevision: 1,
      current: first,
      now: new Date('2026-07-14T01:05:00.000Z'),
    });

    expect(first).toMatchObject({
      schemaVersion: 1,
      revision: 1,
      updatedAt: '2026-07-14T01:00:00.000Z',
      updatedBy: actor,
      value,
    });
    expect(second.revision).toBe(2);
    expect(second.value.title).toBe('Updated Friday Night');
    expect(isAdminWorkspaceRecord(second)).toBe(true);
  });

  it('rejects stale writes with the current revision', () => {
    const current = createAdminWorkspaceRecord({
      kind: 'events',
      key: 'catalog',
      value: [],
      actor,
      expectedRevision: 0,
    });

    expect(() =>
      createAdminWorkspaceRecord({
        kind: 'events',
        key: 'catalog',
        value: [],
        actor,
        expectedRevision: 0,
        current,
      }),
    ).toThrow(AdminWorkspaceConflictError);

    try {
      createAdminWorkspaceRecord({
        kind: 'events',
        key: 'catalog',
        value: [],
        actor,
        expectedRevision: 0,
        current,
      });
    } catch (error) {
      expect(error).toMatchObject({
        code: 'WORKSPACE_VERSION_CONFLICT',
        expectedRevision: 0,
        currentRevision: 1,
      });
    }
  });

  it('uses safe deterministic paths and rejects unsafe keys', () => {
    expect(parseAdminWorkspaceKey('evt-safe_123')).toBe('evt-safe_123');
    expect(parseAdminWorkspaceKey('../private')).toBeNull();
    expect(adminWorkspacePrefix('post-assembly', 'evt-1')).toBe(
      'club-bahia/private-growth-os/post-assembly/evt-1/revisions/',
    );
    expect(adminWorkspaceRevisionPath('growth', 'evt-1', 12)).toBe(
      'club-bahia/private-growth-os/growth/evt-1/revisions/0000000012.json.enc',
    );
  });

  it('rejects non-JSON and oversized workspace payloads', () => {
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;

    expect(() =>
      createAdminWorkspaceRecord({
        kind: 'growth',
        key: 'evt-1',
        value: cyclic,
        actor,
        expectedRevision: 0,
      }),
    ).toThrow('valid JSON');

    expect(() =>
      createAdminWorkspaceRecord({
        kind: 'growth',
        key: 'evt-1',
        value: 'x'.repeat(2_000_001),
        actor,
        expectedRevision: 0,
      }),
    ).toThrow('too large');
  });
});
