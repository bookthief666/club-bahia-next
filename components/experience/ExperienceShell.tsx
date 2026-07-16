'use client';

import { useCallback, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { type ExperienceOverlay } from '@/lib/experience/experience-copy';
import type { PublicEventCard } from '@/lib/public-events/domain';
import { ExperienceNav } from './ExperienceNav';
import { FloatingBahiaMark } from './FloatingBahiaMark';
import { HeroScene } from './HeroScene';
import { FeaturedEventScene } from './FeaturedEventScene';
import { UpcomingDefaultScene } from './UpcomingDefaultScene';
import { ResidentWeekendScene } from './ResidentWeekendScene';
import { MantraScene } from './MantraScene';
import { InsideBahiaScene } from './InsideBahiaScene';
import { TextureLayer } from './TextureLayer';
import { StoryOverlay } from './StoryOverlay';
import { ReservationOverlay } from './ReservationOverlay';
import { DressCodeOverlay } from './DressCodeOverlay';
import { MenuOverlay } from './MenuOverlay';
import { Footer } from '@/components/layout/Footer';

export function ExperienceShell({
  featuredEvent,
  residentProgram,
}: {
  featuredEvent?: PublicEventCard | null;
  residentProgram?: PublicEventCard | null;
}) {
  const [overlay, setOverlay] = useState<ExperienceOverlay | null>(null);
  const closeOverlay = useCallback(() => setOverlay(null), []);

  return (
    <main className="relative min-h-screen w-full max-w-full overflow-x-hidden bg-[#050304] text-amber-50">
      <TextureLayer />
      <ExperienceNav onOpen={setOverlay} />
      <HeroScene />
      <MantraScene />
      <InsideBahiaScene />
      {featuredEvent ? (
        <FeaturedEventScene event={featuredEvent} />
      ) : (
        <UpcomingDefaultScene residentProgram={residentProgram} />
      )}
      {residentProgram ? (
        <ResidentWeekendScene program={residentProgram} />
      ) : null}
      <Footer />
      <FloatingBahiaMark />
      <AnimatePresence mode="wait">
        {overlay === 'story' && <StoryOverlay key="story" onClose={closeOverlay} />}
        {overlay === 'reservations' && (
          <ReservationOverlay key="reservations" onClose={closeOverlay} />
        )}
        {overlay === 'dress' && <DressCodeOverlay key="dress" onClose={closeOverlay} />}
        {overlay === 'menu' && <MenuOverlay key="menu" onClose={closeOverlay} />}
      </AnimatePresence>
    </main>
  );
}
