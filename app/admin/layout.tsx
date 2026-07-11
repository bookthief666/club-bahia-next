import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin/AdminShell';
import { requireMockAdminUser } from '@/lib/admin/mock-auth';

export const metadata: Metadata = { title: 'Command Center' };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireMockAdminUser();
  return <AdminShell user={user}>{children}</AdminShell>;
}
