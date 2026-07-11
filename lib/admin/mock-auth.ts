import 'server-only';
import { redirect } from 'next/navigation';
import type { AdminRole, AdminUser } from './domain';

const enabled = process.env.ADMIN_DEV_AUTH_ENABLED === 'true' || process.env.NODE_ENV !== 'production';

export async function requireMockAdminUser(): Promise<AdminUser> {
  if (!enabled) redirect('/');
  return {
    id: 'dev-mock-admin',
    name: process.env.ADMIN_DEV_USER_NAME || 'Maya Rivera',
    role: (process.env.ADMIN_DEV_USER_ROLE as AdminRole | undefined) || 'owner',
    avatarInitials: 'MR',
  };
}
