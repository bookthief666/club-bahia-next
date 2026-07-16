import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const resourceAccessSource = readFileSync(
  new URL('../lib/admin/auth/resource-access.ts', import.meta.url),
  'utf8',
);

describe('private admin resource access', () => {
  it('uses one signed staff session without a second media credential', () => {
    expect(resourceAccessSource).toContain('return requireAdminRequest(request);');
    expect(resourceAccessSource).not.toContain('requireAssetAccess');
    expect(resourceAccessSource).not.toContain('x-admin-asset-key');
  });
});
