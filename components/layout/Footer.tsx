import Link from 'next/link';
import { venue } from '@/lib/constants/venue';

export function Footer() {
  return (
    <footer className="border-t border-amber-100/12 bg-[#050304] px-4 py-10 text-center text-sm text-amber-50/70 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4">
        <p className="bahia-display-serif text-4xl font-semibold leading-none tracking-[-0.035em] text-amber-50">
          Club Bahia
        </p>
        <address className="not-italic">{venue.address}</address>
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-xs font-semibold uppercase tracking-[0.18em] text-amber-100">
          <a href={venue.phoneHref} className="transition hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500">
            Call {venue.phone}
          </a>
          <Link href="/reservations" className="transition hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500">
            Reservations
          </Link>
          <Link href="/events" className="transition hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500">
            Events
          </Link>
          <span className="text-amber-50/45" aria-label="Instagram placeholder pending verified Club Bahia handle">
            Instagram placeholder
          </span>
        </nav>
        <p className="text-xs text-amber-50/45">© {new Date().getFullYear()} {venue.name}. Historic Latin nightlife in Los Angeles.</p>
      </div>
    </footer>
  );
}
