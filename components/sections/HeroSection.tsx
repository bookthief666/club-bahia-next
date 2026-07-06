'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { venue } from '@/lib/constants/venue';

const heroBadges = ['21+', 'Dress Code', 'Sunset Blvd'];

export function HeroSection() {
  const reduceMotion = useReducedMotion();
  const initial = reduceMotion ? false : { opacity: 0, y: 16 };

  return (
    <section id="top" className="relative isolate overflow-hidden bg-bahiaBlack px-4 pb-10 pt-[4.25rem] sm:px-6 sm:pb-16 sm:pt-24">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(225,18,27,.34),transparent_18rem),radial-gradient(circle_at_88%_18%,rgba(246,183,60,.18),transparent_18rem),linear-gradient(180deg,#12070a_0%,#080405_72%,#050304_100%)]" />
      <div className="palm-shadow absolute inset-0 -z-10 opacity-45" />
      <div className="absolute inset-x-8 top-20 -z-10 h-px bg-gradient-to-r from-transparent via-sunsetGold/50 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 -z-10 h-20 bg-gradient-to-t from-bahiaBlack to-transparent" />

      <motion.div
        initial={initial}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: .55, ease: 'easeOut' }}
        className="mx-auto flex min-h-[calc(100svh-7rem)] max-w-6xl items-center sm:min-h-[34rem]"
      >
        <div className="grid w-full gap-5 lg:grid-cols-[.95fr_.7fr] lg:items-center">
          <div className="relative overflow-hidden rounded-[2rem] border border-sunsetGold/35 bg-charcoal/72 p-5 shadow-[0_0_0_1px_rgba(255,246,232,.04),0_28px_90px_rgba(0,0,0,.48),0_0_54px_rgba(225,18,27,.24)] backdrop-blur-md sm:p-8">
            <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-amberGlow to-transparent" />
            <div className="absolute -right-20 -top-24 h-56 w-56 rounded-full bg-bahiaRed/25 blur-3xl" />
            <div className="absolute -bottom-24 -left-16 h-52 w-52 rounded-full bg-sunsetGold/15 blur-3xl" />
            <div className="relative">
              <Badge className="border-sunsetGold/45 bg-bahiaBlack/45">Bahia Sunset · Est. {venue.established}</Badge>
              <h1 className="mt-5 font-display text-[clamp(4.25rem,25vw,9.25rem)] leading-[0.78] tracking-wide text-warmIvory drop-shadow-[0_0_20px_rgba(255,246,232,.1)]">
                Club <span className="block text-bahiaRed drop-shadow-[0_0_26px_rgba(225,18,27,.62)]">Bahia</span>
              </h1>
              <div className="mt-4 h-1 rounded-full bg-gradient-to-r from-sunsetGold via-amberGlow to-bahiaRed shadow-gold" />
              <p className="mt-4 max-w-md text-[clamp(1.15rem,5vw,1.7rem)] font-semibold leading-tight text-warmIvory">Live Latin Entertainment</p>
              <p className="mt-2 text-sm font-medium uppercase tracking-[0.16em] text-mutedSand">{venue.address}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {heroBadges.map((badge) => <span key={badge} className="rounded-full border border-warmIvory/12 bg-warmIvory/7 px-3 py-1.5 text-[0.68rem] font-black uppercase tracking-[0.16em] text-softGray">{badge}</span>)}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button href="#reservations" className="min-h-10 px-5 py-2.5">Start Reservation</Button>
                <Button href="#location" variant="secondary" className="min-h-10 px-5 py-2.5">Find Us</Button>
              </div>
            </div>
          </div>

          <aside className="rounded-[1.5rem] border border-bahiaRed/20 bg-bahiaBlack/48 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.06)] sm:p-5">
            <p className="text-[0.66rem] font-black uppercase tracking-[0.32em] text-amberGlow">Live Latin Entertainment in Los Angeles</p>
            <p className="mt-3 text-sm leading-6 text-mutedSand">Historic Sunset Blvd energy in a compact red-neon room built for dancing, warm marquee light, and tropical noir nights.</p>
          </aside>
        </div>
      </motion.div>
    </section>
  );
}
