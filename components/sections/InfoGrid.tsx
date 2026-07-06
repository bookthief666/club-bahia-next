import { hours } from '@/lib/constants/hours';
import { dressCode } from '@/lib/constants/dress-code';

export function InfoGrid() {
  return (
    <section id="hours" className="px-4 py-12 sm:px-6 md:py-16">
      <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-2">
        <article className="glass-panel rounded-[1.5rem] p-5 sm:p-6">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-amberGlow">Hours</p>
          <div className="mt-4 grid gap-2">
            {hours.map((item) => <div key={item.day} className="flex justify-between gap-4 border-b border-warmIvory/10 py-2 text-sm"><span className="text-mutedSand">{item.day}</span><span className="font-bold text-warmIvory">{item.time}</span></div>)}
          </div>
          <p className="mt-4 rounded-2xl border border-bahiaRed/35 bg-bahiaRed/10 px-4 py-3 text-xs font-bold text-warmIvory">Hours must be verified before production.</p>
        </article>
        <article id="dress-code" className="glass-panel rounded-[1.5rem] p-5 sm:p-6">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-amberGlow">Door Policy</p>
          <h2 className="mt-2 font-serif text-3xl italic text-warmIvory">Not permitted</h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {dressCode.notPermitted.map((item) => <span key={item} className="rounded-full border border-warmIvory/12 bg-black/25 px-3 py-2 text-xs font-black uppercase tracking-[0.1em] text-mutedSand">{item.replace(' or short pants', '')}</span>)}
          </div>
        </article>
      </div>
    </section>
  );
}
