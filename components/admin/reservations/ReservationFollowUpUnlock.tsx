'use client';

import { useState } from 'react';
import { unlockAssetSession } from '@/lib/admin/assets/client-session';

export function ReservationFollowUpUnlock({
  onUnlocked,
}: {
  onUnlocked: () => Promise<void>;
}) {
  const [code, setCode] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');

  async function submit() {
    setPending(true);
    setMessage('');
    try {
      await unlockAssetSession(code);
      setCode('');
      await onUnlocked();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Could not unlock guest follow-up.',
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="rounded-[1.5rem] border border-violet-200/20 bg-[radial-gradient(circle_at_10%_0%,rgba(167,139,250,.2),transparent_22rem),rgba(20,15,23,.94)] p-5 shadow-[0_20px_70px_rgba(0,0,0,.3)] sm:p-7">
      <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-violet-200/70">
        Private guest information
      </p>
      <h1 className="mt-2 font-serif text-3xl text-white sm:text-5xl">
        Unlock Guest Follow-Up
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-white/58">
        Follow-up reminders use the same encrypted reservation records and
        private owner access session as the full Guests inbox.
      </p>
      <form
        className="mt-5 flex flex-col gap-3 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <input
          type="password"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="Owner access code"
          autoComplete="off"
          className="min-h-12 min-w-0 flex-1 rounded-xl border border-white/12 bg-black/30 px-4 text-white outline-none placeholder:text-white/30 focus:border-violet-200/50"
        />
        <button
          type="submit"
          disabled={pending || !code.trim()}
          className="min-h-12 rounded-full bg-violet-100 px-6 text-sm font-bold text-black disabled:opacity-40"
        >
          {pending ? 'Unlocking…' : 'Unlock follow-up'}
        </button>
      </form>
      {message ? <p className="mt-3 text-sm text-amber-100">{message}</p> : null}
    </section>
  );
}
