'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const steps = [
  { id: 'event', label: 'Event', short: 'Event', suffix: '' },
  { id: 'campaign', label: 'Create campaign', short: 'Campaign', suffix: '/growth' },
  { id: 'media', label: 'Add media', short: 'Media', suffix: '/assets' },
  { id: 'prepare', label: 'Prepare posts', short: 'Review', suffix: '/publishing' },
  { id: 'publish', label: 'Publish campaign', short: 'Publish', suffix: '/publishing/execute' },
] as const;

function activeStep(pathname: string): string {
  if (pathname.includes('/publishing/execute')) return 'publish';
  if (pathname.endsWith('/publishing')) return 'prepare';
  if (pathname.endsWith('/assets')) return 'media';
  if (pathname.endsWith('/growth')) return 'campaign';
  return 'event';
}

export function CampaignWorkflowNav({ eventId }: { eventId: string }) {
  const pathname = usePathname();
  const active = activeStep(pathname);
  const activeIndex = steps.findIndex((step) => step.id === active);

  return (
    <section className="mb-5 overflow-hidden rounded-[1.35rem] border border-white/10 bg-[linear-gradient(135deg,rgba(10,22,19,.92),rgba(20,13,11,.94)_52%,rgba(31,19,9,.9))] shadow-[0_20px_70px_rgba(0,0,0,.28)]">
      <div className="flex items-center justify-between gap-3 border-b border-white/8 px-4 py-3 sm:px-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-emerald-200/65">
            Campaign workflow
          </p>
          <p className="mt-1 text-sm text-white/65">
            Follow the steps from event details to a finished promotion.
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-amber-200/20 bg-amber-200/10 px-3 py-1 text-[11px] font-semibold text-amber-100">
          Step {activeIndex + 1} of {steps.length}
        </span>
      </div>

      <nav
        aria-label="Campaign workflow"
        className="flex gap-2 overflow-x-auto px-3 py-3 [scrollbar-width:none] sm:px-4 [&::-webkit-scrollbar]:hidden"
      >
        {steps.map((step, index) => {
          const isActive = step.id === active;
          const isEarlier = index < activeIndex;
          const href = `/admin/events/${eventId}${step.suffix}`;

          return (
            <Link
              key={step.id}
              href={href}
              aria-current={isActive ? 'step' : undefined}
              className={`group flex min-w-[9.2rem] flex-1 items-center gap-3 rounded-2xl border px-3 py-3 transition sm:min-w-0 ${
                isActive
                  ? 'border-amber-200/35 bg-[linear-gradient(135deg,rgba(246,183,60,.22),rgba(225,18,27,.09))] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.12),0_10px_30px_rgba(0,0,0,.22)]'
                  : isEarlier
                    ? 'border-emerald-200/15 bg-emerald-200/[.06] text-white/72 hover:bg-emerald-200/[.09]'
                    : 'border-white/8 bg-black/15 text-white/48 hover:border-white/15 hover:text-white/70'
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                  isActive
                    ? 'border-amber-100/40 bg-amber-200 text-black'
                    : isEarlier
                      ? 'border-emerald-100/25 bg-emerald-200/15 text-emerald-100'
                      : 'border-white/10 bg-white/5 text-white/45'
                }`}
              >
                {index + 1}
              </span>
              <span className="min-w-0">
                <span className={`block truncate text-[10px] uppercase tracking-[.15em] ${isActive ? 'text-white/58' : 'text-white/38'}`}>
                  {step.short}
                </span>
                <span className="mt-0.5 block truncate text-sm font-semibold">
                  {step.label}
                </span>
              </span>
            </Link>
          );
        })}
      </nav>
    </section>
  );
}
