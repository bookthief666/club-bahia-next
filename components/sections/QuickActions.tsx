import { venue } from '@/lib/constants/venue';

const actions = [
  ['Reserve', '#reservations'],
  ['Call', venue.phoneHref],
  ['Maps', venue.mapsHref],
] as const;

export function QuickActions() {
  return (
    <section aria-label="Quick actions" className="px-4 py-5 sm:px-6">
      <div className="mx-auto grid max-w-md grid-cols-3 gap-2 md:max-w-5xl">
        {actions.map(([label, href]) => (
          <a key={label} href={href} className="rounded-2xl border border-sunsetGold/25 bg-bahiaBlack/45 px-3 py-4 text-center text-xs font-black uppercase tracking-[0.16em] text-warmIvory shadow-[inset_0_1px_0_rgba(255,255,255,.08)] backdrop-blur transition hover:border-sunsetGold hover:bg-sunsetGold/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amberGlow">
            {label}
          </a>
        ))}
      </div>
    </section>
  );
}
