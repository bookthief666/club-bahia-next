import 'server-only';

import { requireAssetAccess } from '@/lib/admin/assets/server';
import type { AdminUser } from '@/lib/admin/domain';
import {
  isProductionAdminAuthConfigured,
  requireAdminRequest,
} from '@/lib/admin/auth/session';

/**
 * Production uses the signed Growth OS session. Preview environments without
 * production credentials retain the temporary media access code so existing
 * review deployments continue to work during migration.
 */
export function requireAdminResourceAccess(request: Request): AdminUser {
  const user = requireAdminRequest(request);
  if (!isProductionAdminAuthConfigured()) {
    requireAssetAccess(request);
  }
  return user;
}
