import 'server-only';
import { redirect } from 'next/navigation';
import type { AdminRole, AdminUser } from './domain';

const isLocalDevelopment = process.env.NODE_ENV !== 'production';
const isVercelPreview = process.env.VERCEL_ENV === 'preview';
const isExplicitlyEnabled = process.env.ADMIN_DEV_AUTH_ENABLED === 'true';

// This mock boundary is available only for local development, explicitly enabled
// environments, and synthetic-data Vercel previews. Production deployments still
// redirect away from /admin until real authentication replaces this module.
const enabled = isLocalDevelopment || isVercelPreview || isExplicitlyEnabled;

export async function requireMockAdminUser(): Promise<AdminUser> {
  if (!enabled) redirect('/');
  return {
    id: 'dev-mock-admin',
    name: process.env.ADMIN_DEV_USER_NAME || 'Maya Rivera',
    role: (process.env.ADMIN_DEV_USER_ROLE as AdminRole | undefined) || 'owner',
    avatarInitials: 'MR',
  };
}
