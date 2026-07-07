'use client';

import { useState } from 'react';
import { experienceCopy, type ExperienceOverlay } from '@/lib/experience/experience-copy';

type ExperienceNavProps = {
  onOpen: (overlay: ExperienceOverlay) => void;
};

export function ExperienceNav({ onOpen }: ExperienceNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const reserveItem = experienceCopy.nav.find((item) => item.overlay === 'reservations');
  const menuItems = experienceCopy.nav.filter((item) => item.overlay !== 'reservations');

  const openOverlay = (overlay: ExperienceOverlay) => {
    setMenuOpen(false);
    onOpen(overlay);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-40 px-3 pt-3 sm:px-6 sm:pt-4">
      <nav className="relative mx-auto flex h-12 w-full max-w-7xl items-center justify-between gap-2 overflow-visible border-b border-amber-100/15 bg-[#050304]/70 px-1 pb-2 text-[0.62rem] uppercase tracking-[0.18em] text-amber-100/85 backdrop-blur-md md:h-auto md:gap-3 md:px-0 md:pb-3 md:text-[0.66rem] md:tracking-[0.24em] lg:tracking-[0.26em]">
        <a href="#experience-hero" className="min-w-0 shrink-0 whitespace-nowrap text-red-100 transition hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500">
          {experienceCopy.venue.established}
        </a>
        <div className="flex min-w-0 items-center justify-end gap-2 md:hidden">
          {reserveItem && (
            <button
              type="button"
              onClick={() => openOverlay(reserveItem.overlay)}
              className="shrink-0 whitespace-nowrap rounded-full border border-red-400/50 bg-red-600/25 px-3 py-2 text-[0.62rem] tracking-[0.14em] text-white transition hover:bg-red-600/40 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {reserveItem.label}
            </button>
          )}
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls="experience-mobile-menu"
            onClick={() => setMenuOpen((open) => !open)}
            className="shrink-0 whitespace-nowrap rounded-full border border-amber-100/25 px-3 py-2 text-[0.62rem] tracking-[0.14em] transition hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Menu
          </button>
        </div>
        <div className="hidden items-center justify-end gap-x-4 md:flex lg:gap-x-7">
          {experienceCopy.nav.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => openOverlay(item.overlay)}
              className="whitespace-nowrap transition hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {item.label}
            </button>
          ))}
        </div>
        {menuOpen && (
          <div id="experience-mobile-menu" className="absolute left-0 right-0 top-full mt-2 grid gap-2 rounded-2xl border border-amber-100/15 bg-[#050304]/95 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur md:hidden">
            {menuItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => openOverlay(item.overlay)}
                className="w-full rounded-xl border border-amber-100/10 px-4 py-3 text-left text-[0.7rem] uppercase tracking-[0.18em] text-amber-100 transition hover:border-red-400/60 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </nav>
    </header>
  );
}
