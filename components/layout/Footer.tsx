import { venue } from '@/lib/constants/venue';

export function Footer() {
  return <footer className="border-t border-warmIvory/10 bg-bahiaBlack px-4 py-10 text-center text-sm text-mutedSand"><p className="font-display text-3xl text-warmIvory">Club <span className="text-bahiaRed">Bahia</span></p><p className="mt-2">{venue.address} · <a className="underline decoration-sunsetGold underline-offset-4" href={venue.phoneHref}>{venue.phone}</a></p><p className="mt-4">© {new Date().getFullYear()} {venue.name}. Historic Latin nightlife in Los Angeles.</p></footer>;
}
