import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Club Bahia | Latin Nightclub in Los Angeles',
  description: 'Club Bahia is a historic Latin nightlife venue on Sunset Blvd in Los Angeles, offering live Latin entertainment, dancing, reservations, and private events since 1974.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" className="font-vars"><body className="font-sans">{children}</body></html>;
}
