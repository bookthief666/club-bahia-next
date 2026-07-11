export function AsyncStatePanels() {
  return <section className="grid gap-3 md:grid-cols-3" aria-label="Dashboard states">
    <div className="rounded-3xl border border-white/10 bg-white/[.04] p-4"><p className="text-xs uppercase tracking-[.25em] text-white/45">Loading</p><div className="mt-3 h-3 w-3/4 animate-pulse rounded bg-white/20" /><div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-white/10" /></div>
    <div className="rounded-3xl border border-emerald-300/20 bg-emerald-400/[.06] p-4"><p className="text-xs uppercase tracking-[.25em] text-emerald-100/70">Empty</p><p className="mt-2 text-sm text-white/70">Sections collapse to clear messages when no work needs attention.</p></div>
    <div className="rounded-3xl border border-amber-300/20 bg-amber-400/[.06] p-4"><p className="text-xs uppercase tracking-[.25em] text-amber-100/80">Offline-aware</p><p className="mt-2 text-sm text-white/70">Demo data is read-only; reconnect before changing operational records.</p></div>
  </section>;
}
