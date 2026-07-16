import Link from 'next/link';

export function GuestWorkspaceNav({
  active,
}: {
  active: 'follow-up' | 'all';
}) {
  return (
    <nav
      aria-label="Guest workspace"
      className="grid gap-2 rounded-[1.25rem] border border-white/10 bg-black/18 p-2 sm:grid-cols-2"
    >
      <Link
        href="/admin/reservations/follow-up"
        aria-current={active === 'follow-up' ? 'page' : undefined}
        className={`rounded-xl border px-4 py-3 transition ${
          active === 'follow-up'
            ? 'border-amber-200/24 bg-amber-200/10 text-amber-100'
            : 'border-transparent text-white/48 hover:border-white/10 hover:text-white'
        }`}
      >
        <span className="block text-sm font-semibold">Follow-up queue</span>
        <span className="mt-1 block text-xs leading-5 opacity-65">
          What needs a reply or decision now
        </span>
      </Link>
      <Link
        href="/admin/reservations"
        aria-current={active === 'all' ? 'page' : undefined}
        className={`rounded-xl border px-4 py-3 transition ${
          active === 'all'
            ? 'border-amber-200/24 bg-amber-200/10 text-amber-100'
            : 'border-transparent text-white/48 hover:border-white/10 hover:text-white'
        }`}
      >
        <span className="block text-sm font-semibold">All requests</span>
        <span className="mt-1 block text-xs leading-5 opacity-65">
          Full guest details, messages, notes, and export
        </span>
      </Link>
    </nav>
  );
}
