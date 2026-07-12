import type { Metadata } from 'next';
import { ReservationShell } from '@/components/reservations/ReservationShell';
import { getPublicEventCard } from '@/lib/public-events/server';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: Promise<{ event?: string }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const event = params?.event
    ? await getPublicEventCard(params.event, {
        includePreview: process.env.VERCEL_ENV === 'preview',
      })
    : null;

  if (event) {
    return {
      title: `Reserve for ${event.title} | Club Bahia`,
      description: `Request a table or group reservation for ${event.title} at Club Bahia on Sunset Boulevard in Los Angeles.`,
      openGraph: {
        title: `Reserve for ${event.title} | Club Bahia`,
        description: event.summary,
        url: `/reservations?event=${event.slug}`,
        images: event.imageUrl ? [{ url: event.imageUrl, alt: event.imageAlt }] : undefined,
      },
    };
  }

  return {
    title: 'Reservations | Club Bahia Los Angeles',
    description:
      'Request Friday and Saturday night reservations for Club Bahia, a historic Latin nightlife venue on Sunset Boulevard in Los Angeles.',
  };
}

export default async function ReservationsPage({
  searchParams,
}: {
  searchParams?: Promise<{ event?: string }>;
}) {
  const params = await searchParams;
  const event = params?.event
    ? await getPublicEventCard(params.event, {
        includePreview: process.env.VERCEL_ENV === 'preview',
      })
    : null;

  return <ReservationShell event={event} />;
}
