export function TonightPoster() {
  const notes = ['Salsa rhythms', 'Tropical noir lighting', 'Dance floor energy', '21+ nightlife', 'Dress code enforced'];
  return (
    <section id="tonight" className="px-4 py-12 sm:px-6 md:py-16">
      <div className="mx-auto grid max-w-5xl items-center gap-5 md:grid-cols-[0.9fr_1.1fr]">
        <div className="max-w-md">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-amberGlow">Tonight</p>
          <h2 className="mt-2 font-serif text-3xl italic leading-tight text-warmIvory sm:text-4xl">Live Latin Entertainment</h2>
        </div>
        <div className="poster-tilt glass-panel relative overflow-hidden rounded-[1.75rem] p-5 sm:p-7">
          <div className="absolute right-[-4rem] top-[-4rem] h-40 w-40 rounded-full bg-bahiaRed/25 blur-3xl" aria-hidden="true" />
          <div className="relative grid gap-3 sm:grid-cols-2">
            {notes.map((note) => <div key={note} className="rounded-2xl border border-warmIvory/10 bg-black/25 px-4 py-3 text-sm font-bold text-warmIvory">{note}</div>)}
          </div>
        </div>
      </div>
    </section>
  );
}
