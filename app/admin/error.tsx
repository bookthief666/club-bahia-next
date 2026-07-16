'use client';

export default function AdminError({ reset }: { reset: () => void }) {
  return <div className="rounded-[1.75rem] border border-red-300/30 bg-red-500/10 p-6"><p className="text-xs uppercase tracking-[.3em] text-red-100/70">Error state</p><h2 className="mt-2 font-serif text-3xl">Command Center could not load.</h2><p className="mt-2 text-white/70">No operational records were changed. Check your connection and retry.</p><button onClick={reset} className="mt-5 rounded-full bg-red-600 px-5 py-3 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-200">Retry dashboard</button></div>;
}
