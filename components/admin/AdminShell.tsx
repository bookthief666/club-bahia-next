'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { AdminUser } from '@/lib/admin/domain';

const nav = [
  {
    label: 'Home',
    mobileLabel: 'Home',
    href: '/admin',
    icon: '◆',
    description: 'Today’s priorities',
  },
  {
    label: 'Events',
    mobileLabel: 'Events',
    href: '/admin/events',
    icon: '◐',
    description: 'Plan and promote',
  },
  {
    label: 'Reservations',
    mobileLabel: 'Guests',
    href: '/admin/reservations',
    icon: '✦',
    description: 'Guest requests',
  },
  {
    label: 'Calendar',
    mobileLabel: 'Calendar',
    href: '/admin/calendar',
    icon: '◷',
    description: 'See the schedule',
  },
];

function pageIdentity(pathname: string): {
  eyebrow: string;
  title: string;
  subtitle: string;
} {
  if (pathname.includes('/publishing/execute')) {
    return {
      eyebrow: 'Campaign workflow · Step 5',
      title: 'Publish campaign',
      subtitle: 'Use the final copy and media, then record what went live.',
    };
  }
  if (pathname.endsWith('/publishing')) {
    return {
      eyebrow: 'Campaign workflow · Step 4',
      title: 'Prepare posts',
      subtitle: 'Match each caption with the correct approved image or video.',
    };
  }
  if (pathname.endsWith('/assets')) {
    return {
      eyebrow: 'Campaign workflow · Step 3',
      title: 'Event media',
      subtitle: 'Upload, organize, and approve flyers, Stories, and Reels.',
    };
  }
  if (pathname.endsWith('/growth')) {
    return {
      eyebrow: 'Campaign workflow · Step 2',
      title: 'Create campaign',
      subtitle: 'Generate and approve the promotional plan and channel copy.',
    };
  }
  if (pathname.startsWith('/admin/reservations')) {
    return {
      eyebrow: 'Club Bahia operations',
      title: 'Guest operations',
      subtitle: 'Review website requests and follow up with guests.',
    };
  }
  if (pathname.startsWith('/admin/calendar')) {
    return {
      eyebrow: 'Club Bahia operations',
      title: 'Calendar',
      subtitle: 'See events, launches, and important deadlines.',
    };
  }
  if (pathname.includes('/new')) {
    return {
      eyebrow: 'Campaign workflow · Step 1',
      title: 'Create event',
      subtitle: 'Start with the information guests need to know.',
    };
  }
  if (pathname.includes('/edit')) {
    return {
      eyebrow: 'Campaign workflow · Step 1',
      title: 'Edit event',
      subtitle: 'Keep public event information accurate and current.',
    };
  }
  if (/^\/admin\/events\/[^/]+$/.test(pathname)) {
    return {
      eyebrow: 'Campaign workflow · Step 1',
      title: 'Event overview',
      subtitle: 'Review the event and continue into promotion.',
    };
  }
  if (pathname.startsWith('/admin/events')) {
    return {
      eyebrow: 'Club Bahia Growth OS',
      title: 'Events',
      subtitle: 'Choose an event, then build and publish its campaign.',
    };
  }
  return {
    eyebrow: 'Club Bahia Growth OS',
    title: 'Home',
    subtitle: 'See what needs attention and what is ready to move forward.',
  };
}

export function AdminShell({
  user,
  children,
}: {
  user: AdminUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const identity = pageIdentity(pathname);

  return (
    <div className="min-h-screen bg-[#050505] text-[#fff7ea]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_9%_2%,rgba(10,114,83,.25),transparent_25rem),radial-gradient(circle_at_92%_8%,rgba(226,35,42,.13),transparent_24rem),radial-gradient(circle_at_70%_80%,rgba(246,183,60,.08),transparent_28rem),linear-gradient(180deg,#090908,#050505_50%,#070504)]" />
        <div className="absolute inset-0 opacity-[.035] [background-image:linear-gradient(rgba(255,255,255,.25)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.2)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(circle_at_center,black,transparent_86%)]" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1580px] flex-col pb-[calc(7rem+env(safe-area-inset-bottom))] lg:flex-row lg:pb-0">
        <aside className="hidden w-64 shrink-0 border-r border-white/8 bg-[linear-gradient(180deg,rgba(12,16,14,.94),rgba(10,9,8,.9))] px-4 py-5 backdrop-blur-2xl lg:flex lg:flex-col xl:w-72 xl:px-5 xl:py-6">
          <Link
            href="/admin"
            className="block rounded-2xl p-2 outline-none focus-visible:ring-2 focus-visible:ring-emerald-200/50"
          >
            <p className="text-[11px] font-black uppercase tracking-[.28em] text-emerald-200 [text-shadow:0_0_12px_rgba(52,211,153,.65)]">
              Club Bahia
            </p>
            <h1 className="mt-1 font-serif text-3xl text-white">Growth OS</h1>
            <p className="mt-2 text-xs leading-5 text-white/42">
              Events, promotion, reservations, and publishing in one place.
            </p>
          </Link>

          <div className="mt-5 rounded-2xl border border-amber-200/15 bg-[linear-gradient(145deg,rgba(246,183,60,.11),rgba(225,18,27,.05))] p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] font-semibold uppercase tracking-[.17em] text-amber-100/65">
                Workspace
              </span>
              <span className="rounded-full border border-amber-200/20 bg-black/20 px-2 py-0.5 text-[10px] font-bold text-amber-100">
                DEMO
              </span>
            </div>
            <p className="mt-2 text-xs leading-5 text-white/48">
              Website publishing and reservation intake are connected for review, while social delivery remains manual.
            </p>
          </div>

          <nav className="mt-6 space-y-2" aria-label="Main navigation">
            {nav.map((item) => {
              const active =
                item.href === '/admin'
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`group flex items-center gap-3 rounded-2xl border px-3 py-3 transition ${
                    active
                      ? 'border-amber-200/20 bg-[linear-gradient(135deg,rgba(246,183,60,.15),rgba(18,120,106,.08))] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.08)]'
                      : 'border-transparent text-white/55 hover:border-white/8 hover:bg-white/[.04] hover:text-white'
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-xl border text-base ${
                      active
                        ? 'border-amber-200/25 bg-amber-200/10 text-amber-100'
                        : 'border-white/8 bg-black/15 text-white/45'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{item.label}</span>
                    <span className="mt-0.5 block text-[11px] text-white/35">
                      {item.description}
                    </span>
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto rounded-2xl border border-emerald-200/12 bg-emerald-200/[.045] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-emerald-100/60">
              Simple rule
            </p>
            <p className="mt-2 text-xs leading-5 text-white/48">
              Green means ready. Amber needs review. Red must be fixed before publishing or confirming.
            </p>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-3 py-3 min-[390px]:px-4 sm:px-5 sm:py-4 md:px-6 lg:px-7 lg:py-5 xl:px-8">
          <header className="sticky top-2 z-10 mb-4 flex items-center justify-between gap-3 rounded-[1.2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(16,18,16,.9),rgba(19,13,11,.88))] px-3 py-2.5 shadow-[0_20px_55px_rgba(0,0,0,.28)] backdrop-blur-2xl sm:mb-5 sm:rounded-[1.35rem] sm:px-5 sm:py-4">
            <div className="min-w-0">
              <p className="truncate text-[9px] font-semibold uppercase tracking-[.18em] text-emerald-200/62 sm:text-[10px] sm:tracking-[.2em]">
                {identity.eyebrow}
              </p>
              <h2 className="mt-0.5 truncate font-serif text-xl text-white sm:mt-1 sm:text-3xl">
                {identity.title}
              </h2>
              <p className="mt-1 hidden truncate text-xs text-white/40 sm:block">
                {identity.subtitle}
              </p>
            </div>
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-amber-200/25 bg-[radial-gradient(circle_at_35%_25%,rgba(246,183,60,.2),rgba(15,13,11,.95))] text-[10px] font-bold text-amber-100 shadow-[0_0_24px_rgba(246,183,60,.08)] sm:h-11 sm:w-11 sm:text-xs"
              aria-label={`${user.name}, ${user.role}`}
              title={`${user.name} · ${user.role}`}
            >
              {user.avatarInitials}
            </div>
          </header>

          {children}
        </main>

        <nav
          className="fixed inset-x-2 bottom-2 z-30 mx-auto grid h-[calc(4rem+env(safe-area-inset-bottom))] max-w-2xl grid-cols-4 gap-1 rounded-[1.2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,14,13,.96),rgba(8,8,8,.97))] p-1.5 pb-[calc(.375rem+env(safe-area-inset-bottom))] text-center text-[9px] shadow-[0_20px_70px_rgba(0,0,0,.6)] backdrop-blur-2xl sm:inset-x-4 sm:h-[calc(4.25rem+env(safe-area-inset-bottom))] sm:rounded-[1.35rem] sm:text-[10px] lg:hidden"
          aria-label="Mobile navigation"
        >
          {nav.map((item) => {
            const active =
              item.href === '/admin'
                ? pathname === item.href
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex min-w-0 flex-col items-center justify-center rounded-xl px-1 py-1 outline-none focus:ring-2 focus:ring-amber-200/50 sm:rounded-2xl ${
                  active
                    ? 'bg-[linear-gradient(135deg,rgba(246,183,60,.16),rgba(18,120,106,.08))] text-amber-100'
                    : 'text-white/58'
                }`}
              >
                <span className="text-sm sm:text-base">{item.icon}</span>
                <span className="mt-0.5 max-w-full truncate font-semibold">
                  {item.mobileLabel}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
