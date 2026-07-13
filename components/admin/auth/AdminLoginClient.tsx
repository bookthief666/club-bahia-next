'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AdminLoginRole } from '@/lib/admin/auth/domain';

export function AdminLoginClient({
  nextPath,
  managerEnabled,
}: {
  nextPath: string;
  managerEnabled: boolean;
}) {
  const router = useRouter();
  const [role, setRole] = useState<AdminLoginRole>('owner');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');

  async function submit() {
    setPending(true);
    setMessage('');

    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, password, next: nextPath }),
      });
      const result = (await response.json()) as {
        error?: string;
        next?: string;
      };
      if (!response.ok || !result.next) {
        throw new Error(result.error || 'Could not sign in.');
      }
      router.replace(result.next);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not sign in.');
      setPending(false);
    }
  }

  return (
    <form
      className="mt-7 space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <fieldset>
        <legend className="text-xs font-semibold uppercase tracking-[.18em] text-amber-100/55">
          Account
        </legend>
        <div className={`mt-3 grid gap-2 ${managerEnabled ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <button
            type="button"
            onClick={() => setRole('owner')}
            className={`min-h-12 rounded-xl border px-4 text-left text-sm font-semibold transition ${
              role === 'owner'
                ? 'border-amber-200/35 bg-amber-200/10 text-amber-50'
                : 'border-white/10 bg-black/20 text-white/50 hover:border-white/20'
            }`}
          >
            Owner
            <span className="mt-1 block text-[11px] font-normal text-white/38">
              Full access
            </span>
          </button>
          {managerEnabled ? (
            <button
              type="button"
              onClick={() => setRole('manager')}
              className={`min-h-12 rounded-xl border px-4 text-left text-sm font-semibold transition ${
                role === 'manager'
                  ? 'border-emerald-200/35 bg-emerald-200/10 text-emerald-50'
                  : 'border-white/10 bg-black/20 text-white/50 hover:border-white/20'
              }`}
            >
              Manager
              <span className="mt-1 block text-[11px] font-normal text-white/38">
                Daily operations
              </span>
            </button>
          ) : null}
        </div>
      </fieldset>

      <label className="block text-sm font-medium text-white/70">
        Password
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          autoFocus
          className="mt-2 min-h-12 w-full rounded-xl border border-white/12 bg-black/35 px-4 text-base text-white outline-none placeholder:text-white/25 focus:border-amber-200/50 focus:ring-2 focus:ring-amber-200/10"
          placeholder="Enter your private password"
        />
      </label>

      <button
        type="submit"
        disabled={pending || password.length < 1}
        className="min-h-12 w-full rounded-full bg-amber-100 px-6 text-sm font-black uppercase tracking-[.16em] text-[#120707] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pending ? 'Signing in…' : 'Open Growth OS'}
      </button>

      {message ? (
        <p
          role="alert"
          className="rounded-xl border border-red-200/18 bg-red-200/[.07] px-4 py-3 text-sm leading-6 text-red-50"
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
