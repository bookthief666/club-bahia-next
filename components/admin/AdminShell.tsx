"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AdminUser } from "@/lib/admin/domain";
const nav = [
  { label: "Dashboard", href: "/admin", icon: "◆" },
  { label: "Events", href: "/admin/events", icon: "◐" },
  { label: "Calendar", href: "/admin/calendar", icon: "◷" },
];
function pageTitle(pathname: string) {
  if (pathname.startsWith("/admin/calendar")) return "Calendar";
  if (pathname.includes("/new")) return "New event";
  if (pathname.includes("/edit")) return "Edit event";
  if (pathname.startsWith("/admin/events")) return "Events";
  return "Dashboard";
}
export function AdminShell({ user, children }: { user: AdminUser; children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-[#060606] text-[#fff7ea]">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(49,97,84,.25),transparent_24rem),radial-gradient(circle_at_90%_4%,rgba(208,148,48,.12),transparent_18rem),linear-gradient(180deg,#0b0908,#060606)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-[1480px] flex-col pb-[calc(5rem+env(safe-area-inset-bottom))] md:flex-row md:pb-0">
        <aside className="hidden w-60 shrink-0 border-r border-white/10 bg-[#11100e]/80 px-4 py-5 backdrop-blur-xl md:block">
          <p className="text-[11px] uppercase tracking-[.28em] text-amber-200/65">Club Bahia</p>
          <h1 className="mt-1 font-serif text-2xl text-white">Command Center</h1>
          <span className="mt-3 inline-flex rounded-full border border-amber-200/20 bg-amber-200/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[.18em] text-amber-100">Demo mode</span>
          <nav className="mt-6 space-y-1" aria-label="Admin">
            {nav.map((item) => {
              const active = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);
              return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${active ? "bg-amber-200/12 text-white ring-1 ring-amber-200/20" : "text-white/65 hover:bg-white/8 hover:text-white"}`}><span>{item.icon}</span>{item.label}</Link>;
            })}
          </nav>
        </aside>
        <main className="flex-1 px-4 py-4 min-[390px]:px-5 sm:px-6 lg:px-8">
          <header className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#12100e]/85 px-3.5 py-3 shadow-xl backdrop-blur-xl sm:px-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[.2em] text-amber-200/70"><span>Club Bahia / Command Center</span><span className="rounded-full border border-amber-200/20 px-2 py-0.5 tracking-[.12em]">Demo mode</span></div>
              <h2 className="mt-1 truncate font-serif text-2xl sm:text-3xl">{pageTitle(pathname)}</h2>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-amber-200/25 bg-stone-900 text-xs font-bold" aria-label={`${user.name}, ${user.role}`}>{user.avatarInitials}</div>
          </header>
          {children}
        </main>
        <nav className="fixed inset-x-3 bottom-2 z-20 grid h-[calc(4rem+env(safe-area-inset-bottom))] grid-cols-3 gap-1 rounded-2xl border border-white/10 bg-[#0d0b0a]/95 p-1.5 pb-[calc(.375rem+env(safe-area-inset-bottom))] text-center text-[11px] shadow-2xl backdrop-blur-xl md:hidden" aria-label="Mobile admin">
          {nav.map((item) => { const active = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href); return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`flex flex-col items-center justify-center rounded-xl px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-200 ${active ? "bg-amber-200/12 text-amber-100" : "text-white/70"}`}><span className="text-base">{item.icon}</span><span>{item.label}</span></Link>; })}
        </nav>
      </div>
    </div>
  );
}
