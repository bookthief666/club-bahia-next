import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AdminLoginClient } from '@/components/admin/auth/AdminLoginClient';
import type {
  AdminAuthConfigurationStatus,
  AdminAuthValueStatus,
} from '@/lib/admin/auth/domain';
import {
  getAdminAuthConfigurationStatus,
  getCurrentAdminUser,
  isManagerAdminAuthConfigured,
} from '@/lib/admin/auth/session';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Growth OS Sign In | Club Bahia',
  robots: { index: false, follow: false },
};

function safeNext(value: string | undefined): string {
  if (!value?.startsWith('/admin') || value.startsWith('//')) return '/admin';
  return value;
}

function valueLabel(status: AdminAuthValueStatus): string {
  if (!status.exists) return 'Missing';
  if (!status.valid) return `Present, below ${status.minimumLength} characters`;
  return 'Present, length valid';
}

function environmentLabel(
  environment: AdminAuthConfigurationStatus['deploymentEnvironment'],
): string {
  return environment.charAt(0).toUpperCase() + environment.slice(1);
}

function configurationProblem(status: AdminAuthConfigurationStatus): string {
  if (!status.authSecret.exists) {
    return 'ADMIN_AUTH_SECRET is missing from this deployment.';
  }
  if (!status.authSecret.valid) {
    return 'ADMIN_AUTH_SECRET is present but does not meet the 32-character requirement.';
  }
  if (!status.ownerPassword.exists) {
    return 'ADMIN_OWNER_PASSWORD is missing from this deployment.';
  }
  if (!status.ownerPassword.valid) {
    return 'ADMIN_OWNER_PASSWORD is present but does not meet the 12-character requirement.';
  }
  return 'No valid admin password is available in this deployment.';
}

function ConfigurationNotice({
  status,
}: {
  status: AdminAuthConfigurationStatus;
}) {
  const rows = [
    ['ADMIN_AUTH_SECRET', valueLabel(status.authSecret)],
    ['ADMIN_OWNER_PASSWORD', valueLabel(status.ownerPassword)],
    ['Deployment', environmentLabel(status.deploymentEnvironment)],
    [
      'Mock authentication',
      status.mockAuthenticationEnabled ? 'Enabled' : 'Disabled',
    ],
  ];

  return (
    <div
      role="alert"
      className="mt-7 rounded-2xl border border-amber-200/18 bg-amber-200/[.06] p-4 sm:p-5"
    >
      <p className="font-semibold text-amber-50">Sign-in is not configured.</p>
      <p className="mt-2 text-sm leading-6 text-amber-50/72">
        {configurationProblem(status)}
      </p>

      <dl className="mt-4 overflow-hidden rounded-xl border border-white/8 bg-black/20">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="grid gap-1 border-b border-white/8 px-3 py-3 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4"
          >
            <dt className="break-all font-mono text-[11px] text-white/46 sm:break-normal">
              {label}
            </dt>
            <dd className="text-xs font-semibold text-amber-50/82 sm:text-right">
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-4 text-xs leading-5 text-amber-50/52">
        Check that the variables target Preview and this branch, then redeploy.
        Saved environment changes do not alter an existing deployment. Only
        presence and minimum-length status are shown here; secret values are
        never returned.
      </p>
    </div>
  );
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const current = await getCurrentAdminUser();
  const query = await searchParams;
  const nextPath = safeNext(query.next);
  if (current) redirect(nextPath);

  const authStatus = getAdminAuthConfigurationStatus();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050304] px-4 py-8 text-amber-50 sm:px-6 sm:py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(16,185,129,.2),transparent_28rem),radial-gradient(circle_at_88%_4%,rgba(225,18,27,.2),transparent_26rem),radial-gradient(circle_at_62%_92%,rgba(246,183,60,.09),transparent_24rem),linear-gradient(180deg,#090706,#050304)]"
      />
      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center justify-center sm:min-h-[calc(100vh-6rem)]">
        <section className="grid w-full overflow-hidden rounded-[1.8rem] border border-amber-100/12 bg-[linear-gradient(145deg,rgba(15,17,14,.96),rgba(19,9,8,.96))] shadow-[0_35px_120px_rgba(0,0,0,.55)] lg:grid-cols-[.92fr_1.08fr]">
          <div className="relative hidden min-h-[38rem] overflow-hidden border-r border-white/8 lg:block">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_25%,rgba(246,183,60,.18),transparent_24rem),linear-gradient(160deg,rgba(12,68,49,.88),rgba(52,7,10,.9)_62%,rgba(7,5,5,.98))]" />
            <div className="absolute inset-0 opacity-[.06] [background-image:linear-gradient(rgba(255,255,255,.3)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.25)_1px,transparent_1px)] [background-size:52px_52px]" />
            <div className="absolute inset-x-0 bottom-0 p-10">
              <p className="text-[10px] font-black uppercase tracking-[.32em] text-emerald-200/72">
                Club Bahia
              </p>
              <h1 className="mt-3 font-serif text-6xl leading-[.9] tracking-[-.05em] text-white">
                Growth OS
              </h1>
              <p className="mt-5 max-w-md text-base leading-7 text-white/58">
                Events, promotion, website publishing, and guest operations in one private workspace.
              </p>
            </div>
          </div>

          <div className="p-5 sm:p-8 lg:p-10 xl:p-12">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[.26em] text-amber-200/62">
                  Private administration
                </p>
                <h2 className="mt-3 font-serif text-4xl tracking-[-.04em] text-white sm:text-5xl">
                  Sign in
                </h2>
                <p className="mt-3 max-w-lg text-sm leading-6 text-white/52 sm:text-base">
                  Use the private owner or manager password. Guest reservations and campaign records remain unavailable without a valid session.
                </p>
              </div>
              <Link
                href="/"
                className="shrink-0 rounded-full border border-white/12 px-3 py-2 text-[10px] font-semibold uppercase tracking-[.14em] text-white/55 transition hover:border-white/25 hover:text-white"
              >
                Website
              </Link>
            </div>

            {authStatus.configured ? (
              <AdminLoginClient
                nextPath={nextPath}
                managerEnabled={isManagerAdminAuthConfigured()}
              />
            ) : (
              <ConfigurationNotice status={authStatus} />
            )}

            <p className="mt-6 text-xs leading-5 text-white/32">
              Sessions expire automatically after 12 hours. Sign out when using a shared device.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
