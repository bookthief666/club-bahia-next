import 'server-only';

import type { AdminUser } from '@/lib/admin/domain';
import { requireAdminRequest } from '@/lib/admin/auth/session';

export class ConnectionAccessError extends Error {
  readonly status = 403;

  constructor(message = 'Only the Club Bahia Owner or Manager can change publishing connections.') {
    super(message);
    this.name = 'ConnectionAccessError';
  }
}

export function requireConnectionAdmin(request: Request): AdminUser {
  const user = requireAdminRequest(request);
  if (user.role !== 'owner' && user.role !== 'manager') {
    throw new ConnectionAccessError();
  }
  return user;
}
