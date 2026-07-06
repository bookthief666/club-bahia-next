import { venue } from '@/lib/constants/venue';

export function HistoryFeature() {
  const stats = [`Est. ${venue.established}`, 'Sunset Blvd', 'Latin Nightlife'];
  return (
    <section id="history" className="px-4 py-12 sm:px-6 md:py-16">
      <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-[1.2fr_0.8fr]">
        <div className="max-w-md">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-amberGlow">Since 1974</p>
          <h2 className="mt-2 font-serif text-3xl italic leading-tight text-warmIvory sm:text-4xl">Entertaining Los Angeles since 1974</h2>
          <p className="mt-4 text-sm leading-7 text-mutedSand">Club Bahia carries the feeling of classic LA nightlife: intimate, rhythmic, warm, and unmistakably Latin on Sunset Boulevard.</p>
        </div>
        <div className="grid gap-3">
          {stats.map((stat) => <div key={stat} className="glass-panel rounded-2xl px-5 py-4 font-display text-3xl tracking-wide text-warmIvory">{stat}</div>)}
        </div>
      </div>
    </section>
  );
}
