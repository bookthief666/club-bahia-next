import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Club Bahia | Live Latin Entertainment in Los Angeles',
  description: 'Club Bahia is a historic Los Angeles Latin nightclub on Sunset Blvd, entertaining LA since 1974.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" className="font-vars"><body className="font-sans">{children}</body></html>;
}
