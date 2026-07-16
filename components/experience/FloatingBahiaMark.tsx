import Link from 'next/link';
import { BahiaSunsetLogo } from './BahiaSunsetLogo';

export function FloatingBahiaMark() {
  return (
    <Link href="/reservations" aria-label="Reserve at Club Bahia" className="fixed bottom-[calc(0.8rem+env(safe-area-inset-bottom))] right-[calc(0.65rem+env(safe-area-inset-right))] z-50 flex min-h-9 items-center gap-1 rounded-full border border-amber-300/20 bg-black/50 px-2 py-1 text-[0.5rem] uppercase tracking-[0.12em] text-amber-100/85 shadow-[0_0_20px_rgba(225,18,27,0.26)] backdrop-blur-md transition hover:bg-black/70 sm:right-[calc(1rem+env(safe-area-inset-right))] sm:gap-1.5 sm:px-2.5 sm:text-[0.58rem] sm:tracking-[0.18em]">
      <BahiaSunsetLogo className="h-6 w-6 sm:h-7 sm:w-7" tone="mark" />
      <span>Bahia</span>
    </Link>
  );
}
