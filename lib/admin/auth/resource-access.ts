import 'server-only';

import type { AdminUser } from '@/lib/admin/domain';
import { requireAdminRequest } from '@/lib/admin/auth/session';

/**
 * Private Growth OS resources use the same signed staff session as the rest of
 * the admin application. Media, reservation, and publishing APIs must never
 * require a second browser password after staff sign-in.
 */
export function requireAdminResourceAccess(request: Request): AdminUser {
  return requireAdminRequest(request);
}
