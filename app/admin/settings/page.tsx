import Link from 'next/link';
import { ProductionActivationCenter } from '@/components/admin/settings/ProductionActivationCenter';
import { SocialConnectionsClient } from '@/components/admin/settings/SocialConnectionsClient';
import { getProductionActivationSnapshot } from '@/lib/admin/activation/server';
import { getPromotionAutopilotReadiness } from '@/lib/admin/autopilot/server/readiness';

function providerTone(status: string): string {
  if (status === 'connected') {
    return 'border-emerald-200/25 bg-emerald-200/10 text-emerald-100';
  }
  if (status === 'ready-for-connection') {
    return 'border-amber-200/25 bg-amber-200/10 text-amber-100';
  }
  if (status === 'needs-attention') {
    return 'border-red-200/25 bg-red-300/10 text-red-100';
  }
  return 'border-white/15 bg-white/[.05] text-white/55';
}

function providerLabel(status: string): string {
  if (status === 'connected') return 'Connected';
  if (status === 'ready-for-connection') return 'Ready to authorize';
  if (status === 'needs-attention') return 'Needs attention';
  return 'Setup required';
}

export default async function PromotionSettingsPage() {
  const [activation, providerReadiness] = await Promise.all([
    getProductionActivationSnapshot(),
    getPromotionAutopilotReadiness(),
  ]);

  return (
    <div className="space-y-5">
      <ProductionActivationCenter snapshot={activation} />

      <section className="rounded-[1.5rem] border border-white/10 bg-[#12110f]/88 p-4 shadow-[0_20px_60px_rgba(0,0,0,.24)] sm:p-5">
        <div className="max-w-3xl">
          <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-emerald-100/60">
            Account authorization
          </p>
          <h2 className="mt-1 font-serif text-3xl text-white">
            Connect Club Bahia accounts only when the launch checklist calls for them.
          </h2>
          <p className="mt-3 text-sm leading-7 text-white/55">
            Instagram is the first activation target. TikTok remains secondary. Authorization is stored server-side in the encrypted credential workspace; passwords, access tokens, refresh tokens, and secret fragments are never displayed here.
          </p>
        </div>
        <div className="mt-5">
          <SocialConnectionsClient />
        </div>
      </section>

      <details className="group rounded-[1.5rem] border border-white/10 bg-[#12110f]/88">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 text-sm font-semibold text-white/72 focus:outline-none focus:ring-2 focus:ring-emerald-200 sm:px-5">
          <span>Provider technical details and capability gates</span>
          <span className="text-white/35 transition group-open:rotate-45">+</span>
        </summary>
        <div className="grid gap-4 border-t border-white/8 p-4 xl:grid-cols-2 sm:p-5">
          {providerReadiness.accounts.map((account) => (
            <article
              key={account.provider}
              className="rounded-[1.25rem] border border-white/9 bg-black/18 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-white/35">
                    Provider readiness
                  </p>
                  <h3 className="mt-1 font-serif text-2xl text-white">
                    {account.label}
                  </h3>
                </div>
                <span
                  className={`rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.12em] ${providerTone(account.status)}`}
                >
                  {providerLabel(account.status)}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-white/52">
                {account.summary}
              </p>

              <div className="mt-4 space-y-2">
                {account.checks.map((check) => (
                  <div
                    key={check.id}
                    className="flex gap-3 rounded-xl border border-white/7 bg-black/14 p-3"
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
                      <p className="text-sm font-semibold text-white/72">
                        {check.label}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-white/42">
                        {check.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
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
            </article>
          ))}
        </div>
      </details>

      <section className="rounded-[1.5rem] border border-amber-200/15 bg-amber-200/[.055] p-4 sm:p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-amber-100/65">
          Current publishing boundary
        </p>
        <h2 className="mt-1 font-serif text-2xl text-white">
          Start with one supervised Instagram proof. Do not enable every channel at once.
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/58">
          Instagram feed images are the only automatic queue path currently eligible for execution after readiness checks. Reels retain a separate controlled proof. TikTok public posting remains gated by provider authorization and audit requirements. The system never treats an uncertain provider response as success.
        </p>
        <Link
          href="/admin"
          className="mt-4 inline-flex min-h-11 items-center rounded-full bg-amber-300 px-5 text-sm font-bold text-black focus:outline-none focus:ring-2 focus:ring-amber-100"
        >
          Open today’s promotion →
        </Link>
      </section>
    </div>
  );
}
