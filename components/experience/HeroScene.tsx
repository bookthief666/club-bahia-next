'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { BahiaCrest } from './BahiaCrest';
import { experienceCopy } from '@/lib/experience/experience-copy';
import { sceneReveal } from '@/lib/experience/experience-motion';

export function HeroScene() {
  const reduceMotion = useReducedMotion();
  return (
    <section id="experience-hero" className="relative isolate flex min-h-[100svh] items-start justify-center overflow-hidden px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-24 text-center sm:min-h-screen sm:items-center sm:px-6 sm:py-28">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="relative z-10 flex w-full max-w-[min(100%,64rem)] flex-col items-center">
        <motion.div variants={sceneReveal} custom={0.05} animate={reduceMotion ? { opacity: 1, y: 0 } : undefined} className="flex w-full justify-center">
          <BahiaCrest variant="hero" title="Club Bahia sunset palm crest" />
        </motion.div>
        <motion.p variants={sceneReveal} custom={0.16} className="mt-4 max-w-full text-[0.68rem] uppercase tracking-[0.34em] text-amber-200/80 sm:mt-6 sm:text-xs sm:tracking-[0.45em]">
          {experienceCopy.venue.label}
        </motion.p>
        <motion.h1 variants={sceneReveal} custom={0.24} className="mt-2 max-w-full overflow-visible break-normal font-serif text-[clamp(3.45rem,17vw,12rem)] leading-[0.82] tracking-[-0.075em] text-amber-50 drop-shadow-[0_0_26px_rgba(225,18,27,0.35)] sm:leading-[0.78]">
          Club Bahia
        </motion.h1>
        <motion.div variants={sceneReveal} custom={0.34} className="mt-4 flex max-w-full flex-col items-center gap-1 text-[0.62rem] uppercase tracking-[0.16em] text-amber-100/80 sm:mt-6 sm:flex-row sm:gap-5 sm:text-xs sm:tracking-[0.24em]">
          <span>{experienceCopy.venue.established}</span>
          <span className="hidden h-px w-10 bg-red-500/70 sm:block" />
          <span className="max-w-[18rem] leading-5">{experienceCopy.venue.address}</span>
        </motion.div>
      </motion.div>
      <a href="#experience-mantra" className="absolute bottom-[calc(1.2rem+env(safe-area-inset-bottom))] left-1/2 z-10 -translate-x-1/2 whitespace-nowrap text-[0.58rem] uppercase tracking-[0.28em] text-amber-100/60 transition hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500 sm:bottom-8 sm:text-[0.62rem] sm:tracking-[0.35em]">
        Scroll
      </a>
    </section>
  );
}
