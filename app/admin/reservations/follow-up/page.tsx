import { GuestWorkspaceNav } from '@/components/admin/reservations/GuestWorkspaceNav';
import { ReservationFollowUpQueueClient } from '@/components/admin/reservations/ReservationFollowUpQueueClient';

export const dynamic = 'force-dynamic';

export default function ReservationFollowUpPage() {
  return (
    <div className="space-y-4">
      <GuestWorkspaceNav active="follow-up" />
      <ReservationFollowUpQueueClient />
    </div>
  );
}
