import type { Metadata } from 'next';
import { ReservationShell } from '@/components/reservations/ReservationShell';

export const metadata: Metadata = {
  title: 'Reservations | Club Bahia Los Angeles',
  description: 'Request Friday and Saturday night reservations for Club Bahia, a historic Latin nightlife venue on Sunset Blvd in Los Angeles.',
};

export default async function ReservationsPage({ searchParams }: { searchParams?: Promise<{ event?: string }> }) {
  const params = await searchParams;
  return <ReservationShell eventSlug={params?.event} />;
}
