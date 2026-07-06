import type { Metadata } from 'next';
import './globals.css';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { Footer } from '@/components/layout/Footer';
import { StickyReservationCTA } from '@/components/layout/StickyReservationCTA';

export const metadata: Metadata = {
  title: 'Club Bahia | Live Latin Entertainment in Los Angeles',
  description: 'Club Bahia is a historic Los Angeles Latin nightclub on Sunset Blvd, entertaining LA since 1974.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" className="font-vars"><body className="font-sans"><SiteHeader />{children}<Footer /><StickyReservationCTA /></body></html>;
}
