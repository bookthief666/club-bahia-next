import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin/AdminShell';
import { requireAdminUser } from '@/lib/admin/auth/session';

export const metadata: Metadata = {
  title: 'Club Bahia Growth OS',
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdminUser();
  return <AdminShell user={user}>{children}</AdminShell>;
}
