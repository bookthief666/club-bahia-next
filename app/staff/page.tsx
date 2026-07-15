import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function StaffShortcutPage() {
  redirect('/login?next=/admin');
}
