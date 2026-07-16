import Link from 'next/link';
import type {
  ActivationCheck,
  ActivationCheckStatus,
  ActivationPhase,
  ProductionActivationSnapshot,
} from '@/lib/admin/activation/domain';

function statusTone(status: ActivationCheckStatus): string {
  if (status === 'ready') {
    return 'border-emerald-200/25 bg-emerald-200/10 text-emerald-100';
  }
  if (status === 'action-required') {
    return 'border-amber-200/25 bg-amber-200/10 text-amber-100';
  }
  return 'border-white/12 bg-white/[.04] text-white/45';
}

function statusLabel(status: ActivationCheckStatus): string {
  if (status === 'ready') return 'Ready';
  if (status === 'action-required') return 'Action required';
  return 'Later';
}

function phaseLabel(phase: ActivationPhase): string {
  if (phase === 'core') return 'Core launch';
  if (phase === 'automation') return 'Instagram automation';
  return 'Later channel';
}

function CheckRow({ check }: { check: ActivationCheck }) {
  return (
    <article className="rounded-2xl border border-white/8 bg-black/18 p-3.5 sm:p-4">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${statusTone(check.status)}`}
        >
          {check.status === 'ready' ? '✓' : check.status === 'optional' ? '·' : '!'}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-white/35">
                {phaseLabel(check.phase)}
              </p>
              <h3 className="mt-1 text-sm font-semibold text-white/82 sm:text-base">
                {check.label}
              </h3>
            </div>
            <span
              className={`rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.12em] ${statusTone(check.status)}`}
            >
              {statusLabel(check.status)}
            </span>
          </div>
          <p className="mt-2 text-xs leading-5 text-white/48 sm:text-sm sm:leading-6">
            {check.summary}
          </p>
          {check.status !== 'ready' ? (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <p className="text-xs font-medium leading-5 text-amber-100/70">
                {check.nextAction}
              </p>
              {check.href ? (
                <Link
                  href={check.href}
                  className="inline-flex min-h-9 items-center rounded-full border border-amber-200/20 bg-amber-200/[.08] px-3 text-xs font-bold text-amber-50 transition hover:bg-amber-200/[.14] focus:outline-none focus:ring-2 focus:ring-amber-200"
                >
                  Open →
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function ReadinessCard({
  label,
  ready,
  readyCopy,
  pendingCopy,
}: {
  label: string;
  ready: boolean;
  readyCopy: string;
  pendingCopy: string;
}) {
  return (
    <article
      className={`rounded-2xl border p-4 ${
        ready
          ? 'border-emerald-200/20 bg-emerald-200/[.07]'
          : 'border-white/10 bg-black/18'
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-white/38">
        {label}
      </p>
      <p className={`mt-2 text-sm font-semibold ${ready ? 'text-emerald-100' : 'text-white/70'}`}>
        {ready ? readyCopy : pendingCopy}
      </p>
    </article>
  );
}

export function ProductionActivationCenter({
  snapshot,
}: {
  snapshot: ProductionActivationSnapshot;
}) {
  const coreChecks = snapshot.checks.filter((check) => check.phase === 'core');
  const automationChecks = snapshot.checks.filter(
    (check) => check.phase === 'automation',
  );
  const laterChecks = snapshot.checks.filter((check) => check.phase === 'later');

  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[radial-gradient(circle_at_90%_0%,rgba(52,211,153,.16),transparent_24rem),radial-gradient(circle_at_0%_100%,rgba(246,183,60,.14),transparent_26rem),linear-gradient(135deg,rgba(14,18,16,.98),rgba(24,15,12,.97))] shadow-[0_28px_90px_rgba(0,0,0,.4)]">
      <div className="p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-[10px] font-semibold uppercase tracking-[.24em] text-emerald-200/70">
              Production activation center
            </p>
            <h1 className="mt-3 font-serif text-4xl text-white sm:text-5xl">
              {snapshot.coreReady
                ? 'The core Growth OS is ready to launch.'
                : 'Finish the core launch before connecting more channels.'}
            </h1>
            <p className="mt-3 text-sm leading-7 text-white/58 sm:text-base">
              This page separates what Club Bahia needs for a secure live workflow from optional automation. No secret values, access tokens, passwords, or credential fragments are shown.
            </p>
          </div>
          <span
            className={`rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.14em] ${
              snapshot.coreReady
                ? 'border-emerald-200/25 bg-emerald-200/10 text-emerald-100'
                : 'border-amber-200/25 bg-amber-200/10 text-amber-100'
            }`}
          >
            {snapshot.environment} · {snapshot.coreReady ? 'Core ready' : 'Setup in progress'}
          </span>
        </div>

        <div className="mt-6 rounded-2xl border border-white/9 bg-black/22 p-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-white/38">
                Core launch progress
              </p>
              <p className="mt-1 text-2xl font-semibold text-white">
                {snapshot.coreReadyCount}/{snapshot.coreTotal} checks ready
              </p>
            </div>
            <p className="text-3xl font-semibold tabular-nums text-emerald-100">
              {snapshot.coreCompletionPercent}%
            </p>
          </div>
          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-white/8"
            role="progressbar"
            aria-label="Core launch readiness"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={snapshot.coreCompletionPercent}
          >
            <div
              className="h-full rounded-full bg-emerald-300 transition-[width]"
              style={{ width: `${snapshot.coreCompletionPercent}%` }}
            />
          </div>
        </div>

        {snapshot.nextAction ? (
          <div className="mt-4 rounded-2xl border border-amber-200/18 bg-amber-200/[.065] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-amber-100/65">
              Do this next
            </p>
            <h2 className="mt-1 text-lg font-semibold text-white">
              {snapshot.nextAction.label}
            </h2>
            <p className="mt-2 text-sm leading-6 text-white/58">
              {snapshot.nextAction.nextAction}
            </p>
            {snapshot.nextAction.href ? (
              <Link
                href={snapshot.nextAction.href}
                className="mt-4 inline-flex min-h-11 items-center rounded-full bg-amber-300 px-5 text-sm font-bold text-black focus:outline-none focus:ring-2 focus:ring-amber-100"
              >
                Open next step →
              </Link>
            ) : null}
          </div>
        ) : null}

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <ReadinessCard
            label="Secure weekly workflow"
            ready={snapshot.coreReady}
            readyCopy="Ready for real events, campaigns, media, reservations, and results."
            pendingCopy="Complete the core checklist below."
          />
          <ReadinessCard
            label="Supervised Instagram pilot"
            ready={snapshot.supervisedInstagramReady}
            readyCopy="Ready for one controlled real-account proof."
            pendingCopy="Requires the core launch and Meta readiness."
          />
          <ReadinessCard
            label="Unattended Instagram queue"
            ready={snapshot.unattendedInstagramReady}
            readyCopy="Ready to execute approved image posts without an open dashboard."
            pendingCopy="Requires the supervised pilot and recurring scheduler."
          />
        </div>
      </div>

      <div className="border-t border-white/8 bg-black/12 p-4 sm:p-5">
        <div className="space-y-3">
          {coreChecks.map((check) => (
            <CheckRow key={check.id} check={check} />
          ))}
        </div>

        <details className="group mt-4 rounded-2xl border border-white/9 bg-black/15">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-white/72 focus:outline-none focus:ring-2 focus:ring-emerald-200">
            <span>Instagram automation after core launch</span>
            <span className="text-white/35 transition group-open:rotate-45">+</span>
          </summary>
          <div className="space-y-3 border-t border-white/8 p-3 sm:p-4">
            {automationChecks.map((check) => (
              <CheckRow key={check.id} check={check} />
            ))}
          </div>
        </details>

        <details className="group mt-3 rounded-2xl border border-white/9 bg-black/15">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-white/62 focus:outline-none focus:ring-2 focus:ring-emerald-200">
            <span>Later channels that do not block launch</span>
            <span className="text-white/35 transition group-open:rotate-45">+</span>
          </summary>
          <div className="space-y-3 border-t border-white/8 p-3 sm:p-4">
            {laterChecks.map((check) => (
              <CheckRow key={check.id} check={check} />
            ))}
          </div>
        </details>
      </div>
    </section>
  );
}
