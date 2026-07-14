import Link from 'next/link';
import { SocialConnectionsClient } from '@/components/admin/settings/SocialConnectionsClient';
import { getPromotionAutopilotReadiness } from '@/lib/admin/autopilot/server/readiness';
import { isAdminWorkspaceStorageConfigured } from '@/lib/admin/workspaces/server';

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
  if (status === 'connected') return 'Controlled publishing ready';
  if (status === 'ready-for-connection') return 'Ready to connect';
  if (status === 'needs-attention') return 'Needs attention';
  return 'Setup required';
}

export default async function PromotionSettingsPage() {
  const readiness = await getPromotionAutopilotReadiness();
  const queueStorageConfigured = isAdminWorkspaceStorageConfigured();
  const triggerConfigured = Boolean(
    process.env.PUBLISHING_CRON_SECRET?.trim(),
  );
  const schedulerReady = queueStorageConfigured && triggerConfigured;

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
          The Instagram image publisher, TikTok private proof, shared publishing queue, and Today dashboard are built. Connect the authorized Club Bahia accounts here without copying provider authorization into the browser.
        </p>
        <div className="mt-5 flex flex-wrap gap-2 text-xs text-white/48">
          <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5">
            No provider secrets shown
          </span>
          <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5">
            Signed anti-forgery state
          </span>
          <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5">
            Encrypted renewable credentials
          </span>
        </div>
      </section>

      <SocialConnectionsClient />

      <section className="grid gap-4 xl:grid-cols-2">
        {readiness.accounts.map((account) => (
          <article
            key={account.provider}
            className="rounded-[1.5rem] border border-white/10 bg-[#12110f]/88 p-4 shadow-[0_20px_60px_rgba(0,0,0,.25)] sm:p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-white/38">
                  Provider readiness
                </p>
                <h2 className="mt-1 font-serif text-3xl text-white">
                  {account.label}
                </h2>
              </div>
              <span
                className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[.12em] ${statusTone(account.status)}`}
              >
                {statusLabel(account.status)}
              </span>
            </div>

            <p className="mt-4 text-sm leading-7 text-white/58">
              {account.summary}
            </p>

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
                    <p className="text-sm font-semibold text-white/76">
                      {check.label}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-white/42">
                      {check.detail}
                    </p>
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
              Promotion schedule
            </p>
            <h2 className="mt-1 font-serif text-3xl text-white">
              Publish approved posts on time
            </h2>
          </div>
          <span
            className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[.12em] ${
              schedulerReady
                ? 'border-emerald-200/25 bg-emerald-200/10 text-emerald-100'
                : 'border-amber-200/18 bg-amber-200/[.06] text-amber-100'
            }`}
          >
            {schedulerReady ? 'Automatic trigger ready' : 'Manual worker available'}
          </span>
        </div>
        <p className="mt-4 text-sm leading-7 text-white/58">
          The venue pilot uses the existing encrypted Growth OS store for queue jobs, optimistic claims, retry state, and provider receipts. The Home dashboard can run due posts manually now. A protected recurring trigger is still required for posts to run while nobody has the app open.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/8 bg-black/18 p-3">
            <p className="text-sm font-semibold text-white/72">
              Durable encrypted queue
            </p>
            <p className="mt-1 text-xs text-white/42">
              {queueStorageConfigured
                ? 'Ready for scheduled jobs, leases, attempts, and retry history.'
                : 'Configure shared encrypted Growth OS storage before queueing posts.'}
            </p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-black/18 p-3">
            <p className="text-sm font-semibold text-white/72">
              Authenticated recurring trigger
            </p>
            <p className="mt-1 text-xs text-white/42">
              {triggerConfigured
                ? 'Protected scheduler authorization is configured.'
                : 'Still required for unattended execution at the scheduled minute.'}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-amber-200/15 bg-amber-200/[.055] p-4 sm:p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-amber-100/65">
          Current safety boundary
        </p>
        <h2 className="mt-1 font-serif text-2xl text-white">
          Instagram feed images can execute from the queue. TikTok and Reels remain review-gated.
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/58">
          The worker claims due jobs exactly once, records every attempt, retries only provider failures classified as safe, and stops uncertain responses for manual review. Public TikTok posts and Instagram Reels remain paused until their controlled provider proofs are completed.
        </p>
        <Link
          href="/admin"
          className="mt-4 inline-flex min-h-11 items-center rounded-full bg-amber-300 px-5 text-sm font-bold text-black"
        >
          Open today’s promotion →
        </Link>
      </section>
    </div>
  );
}
