'use client';

import { experienceCopy, type ExperienceOverlay } from '@/lib/experience/experience-copy';

type ExperienceNavProps = {
  onOpen: (overlay: ExperienceOverlay) => void;
};

export function ExperienceNav({ onOpen }: ExperienceNavProps) {
  return (
    <header className="fixed left-0 right-0 top-0 z-40 px-4 py-4 sm:px-6">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-3 border-b border-amber-100/15 bg-[#050304]/55 pb-3 text-[0.66rem] uppercase tracking-[0.26em] text-amber-100/85 backdrop-blur-md">
        <a href="#experience-hero" className="shrink-0 text-red-100 transition hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500">
          {experienceCopy.venue.established}
        </a>
        <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 sm:gap-x-7">
          {experienceCopy.nav.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => onOpen(item.overlay)}
              className="transition hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>
    </header>
  );
}
