import type { Metadata } from 'next';
import { Fraunces } from 'next/font/google';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  axes: ['SOFT', 'WONK', 'opsz'],
});


export const metadata: Metadata = {
  metadataBase: new URL('https://clubbahia.com'),
  title: {
    default: 'Club Bahia | Latin Nightclub in Los Angeles',
    template: '%s | Club Bahia',
  },
  description: 'Club Bahia is a historic Latin nightlife venue on Sunset Blvd in Los Angeles, offering live Latin entertainment, dancing, reservations, and private events since 1974.',
  openGraph: {
    title: 'Club Bahia | Latin Nightclub in Los Angeles',
    description: 'Live music, hot kitchen, and a big dance floor on Sunset Boulevard since 1974.',
    url: '/',
    siteName: 'Club Bahia',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" className={fraunces.variable}><body className="font-sans">{children}</body></html>;
}
