import type { AdminUser } from '@/lib/admin/domain';

const nav = [
  { label: 'Dashboard', href: '/admin' },
  { label: 'Events', href: '/admin/events' },
  { label: 'Calendar', href: '/admin/calendar' },
  { label: 'Reservations', href: '#' },
  { label: 'Tasks', href: '#' },
];

export function AdminShell({ user, children }: { user: AdminUser; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#050304] text-[#fff6e8]">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_15%_5%,rgba(225,18,27,.28),transparent_24rem),radial-gradient(circle_at_85%_10%,rgba(246,183,60,.16),transparent_22rem),linear-gradient(180deg,#090407,#050304)]" />
      <div className="fixed inset-0 opacity-[.08] [background-image:linear-gradient(115deg,transparent_0_52%,rgba(246,183,60,.35)_52.2%_52.6%,transparent_52.8%),radial-gradient(circle_at_1px_1px,rgba(255,246,232,.7)_1px,transparent_0)] [background-size:100%_100%,14px_14px]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-[1480px] flex-col pb-24 md:flex-row md:pb-0">
        <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-black/30 px-5 py-6 backdrop-blur-xl md:block">
          <p className="text-xs uppercase tracking-[.42em] text-amber-200/70">Club Bahia</p>
          <h1 className="mt-3 font-serif text-3xl text-white">Command Center</h1>
          <nav className="mt-8 space-y-2" aria-label="Admin">
            {nav.map((item, index) => <a key={item.label} href={item.href} className={`block rounded-2xl px-4 py-3 text-sm ${index === 0 ? 'bg-red-600/25 text-white ring-1 ring-red-300/30' : 'text-white/65 hover:bg-white/10 hover:text-white'}`}>{item.label}</a>)}
          </nav>
        </aside>
        <main className="flex-1 px-4 py-5 min-[390px]:px-5 sm:px-6 lg:px-8">
          <header className="mb-5 flex items-center justify-between gap-4 rounded-3xl border border-white/10 bg-black/35 p-4 shadow-2xl backdrop-blur-xl">
            <div><p className="text-xs uppercase tracking-[.32em] text-amber-200/70">Ops console</p><h2 className="font-serif text-2xl sm:text-3xl">Tonight stays on track.</h2></div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-amber-200/30 bg-amber-300/10 text-sm font-bold" aria-label={`${user.name}, ${user.role}`}>{user.avatarInitials}</div>
          </header>
          {children}
        </main>
        <nav className="fixed inset-x-3 bottom-3 z-20 grid grid-cols-4 gap-2 rounded-3xl border border-white/10 bg-black/80 p-2 text-center text-[11px] shadow-2xl backdrop-blur-xl md:hidden" aria-label="Mobile admin">
          {[{label:'Today',href:'/admin#today'},{label:'Events',href:'/admin/events'},{label:'Calendar',href:'/admin/calendar'},{label:'Risk',href:'/admin#risk'}].map((item) => <a key={item.label} href={item.href} className="rounded-2xl px-2 py-3 text-white/75 focus:outline-none focus:ring-2 focus:ring-amber-200">{item.label}</a>)}
        </nav>
      </div>
    </div>
  );
}
