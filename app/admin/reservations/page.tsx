import { GuestWorkspaceNav } from '@/components/admin/reservations/GuestWorkspaceNav';
import { ReservationInboxClient } from '@/components/admin/reservations/ReservationInboxClient';

export default function AdminReservationsPage() {
  return (
    <div className="space-y-4">
      <GuestWorkspaceNav active="all" />
      <ReservationInboxClient />
    </div>
  );
}
