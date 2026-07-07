'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { BahiaOrnament } from './BahiaOrnament';
import { experienceCopy } from '@/lib/experience/experience-copy';
import { sceneReveal } from '@/lib/experience/experience-motion';

export function HeroScene() {
  const reduceMotion = useReducedMotion();
  return (
    <section id="experience-hero" className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-28 text-center">
      <div className="absolute inset-x-6 top-24 mx-auto max-w-xs rounded-full border border-red-500/30 px-4 py-2 text-[0.58rem] uppercase tracking-[0.28em] text-red-100/70 sm:max-w-sm">
        Future Club Bahia SVG logo / neon crest
      </div>
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="relative z-10 flex w-full max-w-5xl flex-col items-center">
        <motion.div variants={sceneReveal} custom={0.05} animate={reduceMotion ? { opacity: 1, y: 0 } : undefined}>
          <BahiaOrnament />
        </motion.div>
        <motion.p variants={sceneReveal} custom={0.16} className="mt-8 text-xs uppercase tracking-[0.45em] text-amber-200/80">
          {experienceCopy.venue.label}
        </motion.p>
        <motion.h1 variants={sceneReveal} custom={0.24} className="mt-2 font-serif text-[clamp(4rem,17vw,12rem)] leading-[0.78] tracking-[-0.08em] text-amber-50 drop-shadow-[0_0_26px_rgba(225,18,27,0.35)]">
          Club Bahia
        </motion.h1>
        <motion.div variants={sceneReveal} custom={0.34} className="mt-8 flex flex-col items-center gap-2 text-xs uppercase tracking-[0.24em] text-amber-100/80 sm:flex-row sm:gap-5">
          <span>{experienceCopy.venue.established}</span>
          <span className="hidden h-px w-10 bg-red-500/70 sm:block" />
          <span>{experienceCopy.venue.address}</span>
        </motion.div>
      </motion.div>
      <a href="#experience-mantra" className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-[0.62rem] uppercase tracking-[0.35em] text-amber-100/60 transition hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500">
        Scroll
      </a>
    </section>
  );
}
