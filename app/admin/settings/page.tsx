import Link from 'next/link';
import { getPromotionAutopilotReadiness } from '@/lib/admin/autopilot/server/readiness';

function statusTone(status: string): string {
  if (status === 'connected') {
    return 'border-emerald-200/25 bg-emerald-200/10 text-emerald-100';
  }
  if (status === 'ready-for-connection') {
    return 'border-amber-200/25 bg-amber-200/10 text-amber-100';
  }
  if (status === 'needs-attention') {
    return 'border-red-200/25 bg-red-300/10 text-red-100';
  }
  return 'border-white/15 bg-white/[.05] text-white/60';
}

function statusLabel(status: string): string {
  if (status === 'connected') return 'Configured';
  if (status === 'ready-for-connection') return 'Ready to connect';
  if (status === 'needs-attention') return 'Needs attention';
  return 'Setup required';
}

export default function PromotionSettingsPage() {
  const readiness = getPromotionAutopilotReadiness();

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[radial-gradient(circle_at_88%_6%,rgba(246,183,60,.2),transparent_24rem),radial-gradient(circle_at_7%_100%,rgba(18,120,106,.22),transparent_26rem),linear-gradient(135deg,rgba(14,18,16,.98),rgba(27,14,12,.96))] p-5 shadow-[0_28px_90px_rgba(0,0,0,.42)] sm:p-7">
        <p className="text-[10px] font-semibold uppercase tracking-[.24em] text-emerald-200/70">
          Promotion Autopilot
        </p>
        <h1 className="mt-3 font-serif text-4xl text-white sm:text-5xl">
          Connect the accounts that will publish.
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/58 sm:text-base">
          The Growth OS will prepare posts first. Automatic publishing stays disabled until the venue accounts, permissions, durable job storage, and retry safeguards are verified.
        </p>
        <div className="mt-5 flex flex-wrap gap-2 text-xs text-white/48">
          <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5">
            No tokens shown in the browser
          </span>
          <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5">
            Approval required before publishing
          </span>
          <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5">
            Duplicate-post protection planned
          </span>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {readiness.accounts.map((account) => (
          <article
            key={account.provider}
            className="rounded-[1.5rem] border border-white/10 bg-[#12110f]/88 p-4 shadow-[0_20px_60px_rgba(0,0,0,.25)] sm:p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-white/38">
                  Connected account
                </p>
                <h2 className="mt-1 font-serif text-3xl text-white">{account.label}</h2>
              </div>
              <span
                className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[.12em] ${statusTone(account.status)}`}
              >
                {statusLabel(account.status)}
              </span>
            </div>

            <p className="mt-4 text-sm leading-7 text-white/58">{account.summary}</p>

            <div className="mt-5 space-y-2">
              {account.checks.map((check) => (
                <div
                  key={check.id}
                  className="flex gap-3 rounded-2xl border border-white/8 bg-black/18 p-3"
                >
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs ${
                      check.complete
                        ? 'border-emerald-200/25 bg-emerald-200/10 text-emerald-100'
                        : 'border-white/12 bg-white/[.04] text-white/35'
                    }`}
                  >
                    {check.complete ? '✓' : '·'}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white/76">{check.label}</p>
                    <p className="mt-1 text-xs leading-5 text-white/42">{check.detail}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5">
              <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-white/38">
                Publishing capabilities
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {account.capabilities.map((capability) => (
                  <span
                    key={capability.id}
                    title={capability.reason}
                    className={`rounded-full border px-3 py-1.5 text-xs ${
                      capability.available
                        ? 'border-emerald-200/20 bg-emerald-200/[.07] text-emerald-100/80'
                        : 'border-white/10 bg-white/[.035] text-white/38'
                    }`}
                  >
                    {capability.label}
                  </span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-[1.5rem] border border-white/10 bg-[#12110f]/88 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-amber-100/60">
              Durable scheduler
            </p>
            <h2 className="mt-1 font-serif text-3xl text-white">Publish exactly once</h2>
          </div>
          <span
            className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[.12em] ${
              readiness.scheduler.ready
                ? 'border-emerald-200/25 bg-emerald-200/10 text-emerald-100'
                : 'border-white/15 bg-white/[.05] text-white/55'
            }`}
          >
            {readiness.scheduler.ready ? 'Scheduler configured' : 'Not configured'}
          </span>
        </div>
        <p className="mt-4 text-sm leading-7 text-white/58">{readiness.scheduler.summary}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/8 bg-black/18 p-3">
            <p className="text-sm font-semibold text-white/72">Transactional publishing database</p>
            <p className="mt-1 text-xs text-white/42">
              {readiness.scheduler.databaseConfigured ? 'Configuration detected.' : 'Still required for atomic job claims, retries, and unique idempotency keys.'}
            </p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-black/18 p-3">
            <p className="text-sm font-semibold text-white/72">Authenticated scheduler trigger</p>
            <p className="mt-1 text-xs text-white/42">
              {readiness.scheduler.cronSecretConfigured ? 'Configuration detected.' : 'Still required before a cron or durable workflow can execute approved posts.'}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-amber-200/15 bg-amber-200/[.055] p-4 sm:p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-amber-100/65">
          Current safety boundary
        </p>
        <h2 className="mt-1 font-serif text-2xl text-white">Preparation remains live. Automatic posting remains gated.</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/58">
          Captions, hashtags, media matching, tracked links, schedules, and approval records can be prepared now. The first live provider milestone will publish one controlled Instagram image post and save the provider ID and public URL without allowing a duplicate retry.
        </p>
        <Link
          href="/admin/events"
          className="mt-4 inline-flex min-h-11 items-center rounded-full bg-amber-300 px-5 text-sm font-bold text-black"
        >
          Return to events →
        </Link>
      </section>
    </div>
  );
}
