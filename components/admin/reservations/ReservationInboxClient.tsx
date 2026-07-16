'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AssetSessionError,
  unlockAssetSession,
} from '@/lib/admin/assets/client-session';
import { reservationAttributionLabel } from '@/lib/attribution/domain';
import {
  ReservationStatusSchema,
  reservationGuestName,
  type ReservationStatus,
  type StoredReservation,
} from '@/lib/reservations/domain';
import {
  reservationEmailSubject,
  reservationMessage,
  type ReservationMessageKind,
} from '@/lib/reservations/messages';

const STATUS_LABELS: Record<ReservationStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  confirmed: 'Confirmed',
  waitlist: 'Waitlist',
  cancelled: 'Cancelled',
  completed: 'Completed',
};

const MESSAGE_LABELS: Record<ReservationMessageKind, string> = {
  received: 'Request received',
  confirmed: 'Confirmation',
  waitlist: 'Waitlist update',
  'change-request': 'Need more information',
};

function statusClass(status: ReservationStatus): string {
  if (status === 'confirmed') {
    return 'border-emerald-200/25 bg-emerald-200/10 text-emerald-100';
  }
  if (status === 'contacted') {
    return 'border-sky-200/25 bg-sky-200/10 text-sky-100';
  }
  if (status === 'waitlist') {
    return 'border-amber-200/25 bg-amber-200/10 text-amber-100';
  }
  if (status === 'cancelled') {
    return 'border-red-200/20 bg-red-200/[.07] text-red-100';
  }
  if (status === 'completed') {
    return 'border-white/12 bg-white/[.05] text-white/55';
  }
  return 'border-violet-200/22 bg-violet-200/[.08] text-violet-100';
}

function displayReservationDate(value: string): string {
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function displayReceived(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function hostname(value: string): string {
  if (!value) return '';
  try {
    return new URL(value).hostname.replace(/^www\./, '');
  } catch {
    return value;
  }
}

function UnlockInbox({ onUnlocked }: { onUnlocked: () => Promise<void> }) {
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
        error instanceof Error ? error.message : 'Could not unlock requests.',
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
        Unlock Reservation Requests
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-white/58">
        Guest contact details and campaign-source data are encrypted. Use the same private owner code as Event Media to open the inbox for this browser session.
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
          {pending ? 'Unlocking…' : 'Unlock inbox'}
        </button>
      </form>
      {message ? <p className="mt-3 text-sm text-amber-100">{message}</p> : null}
    </section>
  );
}

function ReservationCard({
  reservation,
  pending,
  onUpdate,
}: {
  reservation: StoredReservation;
  pending: boolean;
  onUpdate: (
    status: ReservationStatus,
    staffNote?: string,
  ) => Promise<void>;
}) {
  const [open, setOpen] = useState(reservation.status === 'new');
  const [staffNote, setStaffNote] = useState(reservation.staffNote ?? '');
  const [copiedKind, setCopiedKind] = useState<ReservationMessageKind>();
  const source = reservationAttributionLabel(reservation.attribution);
  const sourceDetail = [
    reservation.attribution.campaign,
    reservation.attribution.content,
  ]
    .filter(Boolean)
    .join(' · ');
  const basicMailHref = `mailto:${reservation.email}?subject=${encodeURIComponent(
    `Club Bahia reservation request ${reservation.id}`,
  )}`;

  useEffect(() => {
    setStaffNote(reservation.staffNote ?? '');
  }, [reservation.staffNote]);

  function smsHref(kind: ReservationMessageKind): string {
    return `sms:${reservation.phone}?body=${encodeURIComponent(
      reservationMessage(reservation, kind),
    )}`;
  }

  function emailHref(kind: ReservationMessageKind): string {
    return `mailto:${reservation.email}?subject=${encodeURIComponent(
      reservationEmailSubject(reservation, kind),
    )}&body=${encodeURIComponent(reservationMessage(reservation, kind))}`;
  }

  async function copyTemplate(kind: ReservationMessageKind) {
    try {
      await navigator.clipboard.writeText(reservationMessage(reservation, kind));
      setCopiedKind(kind);
      window.setTimeout(() => setCopiedKind(undefined), 1800);
    } catch {
      setCopiedKind(undefined);
    }
  }

  return (
    <article className="overflow-hidden rounded-[1.45rem] border border-white/10 bg-[linear-gradient(145deg,rgba(18,19,16,.94),rgba(18,14,12,.96))] shadow-[0_20px_60px_rgba(0,0,0,.25)]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-4 p-4 text-left sm:p-5"
      >
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[.18em] text-amber-100/58">
            <span>{reservation.eventTitle || 'General reservation'}</span>
            <span className="rounded-full border border-sky-200/15 bg-sky-200/[.06] px-2 py-0.5 text-[9px] tracking-[.12em] text-sky-100/72">
              {source}
            </span>
          </span>
          <span className="mt-1 block truncate text-xl font-semibold text-white">
            {reservationGuestName(reservation)} · {reservation.guests} guests
          </span>
          <span className="mt-1 block text-xs text-white/42">
            {displayReservationDate(reservation.date)} · received{' '}
            {displayReceived(reservation.createdAt)}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <span
            className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClass(
              reservation.status,
            )}`}
          >
            {STATUS_LABELS[reservation.status]}
          </span>
          <span className="text-lg text-white/40">{open ? '−' : '+'}</span>
        </span>
      </button>

      {open ? (
        <div className="border-t border-white/8 p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-xl border border-white/9 bg-black/20 p-3">
              <p className="text-[10px] uppercase tracking-[.15em] text-white/38">
                Phone
              </p>
              <a
                href={`tel:${reservation.phone}`}
                className="mt-1 block text-sm font-semibold text-amber-100"
              >
                {reservation.phone}
              </a>
            </div>
            <div className="rounded-xl border border-white/9 bg-black/20 p-3">
              <p className="text-[10px] uppercase tracking-[.15em] text-white/38">
                Email
              </p>
              <a
                href={basicMailHref}
                className="mt-1 block truncate text-sm font-semibold text-amber-100"
              >
                {reservation.email}
              </a>
            </div>
            <div className="rounded-xl border border-white/9 bg-black/20 p-3">
              <p className="text-[10px] uppercase tracking-[.15em] text-white/38">
                Occasion
              </p>
              <p className="mt-1 text-sm text-white/72">
                {reservation.occasion || 'Not specified'}
              </p>
            </div>
            <div className="rounded-xl border border-sky-200/12 bg-sky-200/[.045] p-3">
              <p className="text-[10px] uppercase tracking-[.15em] text-sky-100/48">
                Campaign source
              </p>
              <p className="mt-1 text-sm font-semibold text-sky-100">{source}</p>
              {sourceDetail ? (
                <p className="mt-1 truncate text-[11px] text-white/42">{sourceDetail}</p>
              ) : null}
            </div>
            <div className="rounded-xl border border-white/9 bg-black/20 p-3">
              <p className="text-[10px] uppercase tracking-[.15em] text-white/38">
                Request number
              </p>
              <p className="mt-1 font-mono text-xs text-white/72">{reservation.id}</p>
            </div>
          </div>

          {reservation.attribution.referrer || reservation.attribution.landingPage ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/8 bg-black/18 p-3">
                <p className="text-[10px] uppercase tracking-[.15em] text-white/34">
                  Referrer
                </p>
                <p className="mt-1 break-all text-xs text-white/52">
                  {hostname(reservation.attribution.referrer) || 'Direct visit'}
                </p>
              </div>
              <div className="rounded-xl border border-white/8 bg-black/18 p-3">
                <p className="text-[10px] uppercase tracking-[.15em] text-white/34">
                  Landing page
                </p>
                <p className="mt-1 break-all text-xs text-white/52">
                  {reservation.attribution.landingPage || 'Not recorded'}
                </p>
              </div>
            </div>
          ) : null}

          {reservation.note ? (
            <div className="mt-3 rounded-xl border border-amber-200/12 bg-amber-200/[.045] p-4">
              <p className="text-[10px] uppercase tracking-[.15em] text-amber-100/50">
                Guest note
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/68">
                {reservation.note}
              </p>
            </div>
          ) : null}

          <section className="mt-4 rounded-2xl border border-emerald-200/12 bg-emerald-200/[.045] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-emerald-100/58">
                  Guest follow-up
                </p>
                <h3 className="mt-1 text-base font-semibold text-white">
                  Ready-to-send messages
                </h3>
              </div>
              <p className="max-w-md text-xs leading-5 text-white/42">
                Review the message before sending. Confirmation templates should only be used after availability is actually approved.
              </p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {(
                [
                  'received',
                  'change-request',
                  'confirmed',
                  'waitlist',
                ] as ReservationMessageKind[]
              ).map((kind) => (
                <article
                  key={kind}
                  className="rounded-xl border border-white/9 bg-black/22 p-3"
                >
                  <p className="text-xs font-semibold text-white">
                    {MESSAGE_LABELS[kind]}
                  </p>
                  <p className="mt-2 line-clamp-3 text-xs leading-5 text-white/46">
                    {reservationMessage(reservation, kind)}
                  </p>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <a
                      href={smsHref(kind)}
                      className="inline-flex min-h-9 items-center justify-center rounded-full border border-sky-200/18 bg-sky-200/[.06] px-2 text-[10px] font-semibold text-sky-100"
                    >
                      Text
                    </a>
                    <a
                      href={emailHref(kind)}
                      className="inline-flex min-h-9 items-center justify-center rounded-full border border-white/12 px-2 text-[10px] font-semibold text-white/68"
                    >
                      Email
                    </a>
                    <button
                      type="button"
                      onClick={() => void copyTemplate(kind)}
                      className="min-h-9 rounded-full border border-amber-200/16 bg-amber-200/[.05] px-2 text-[10px] font-semibold text-amber-100"
                    >
                      {copiedKind === kind ? 'Copied ✓' : 'Copy'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <label className="mt-4 block text-sm font-medium text-white/65">
            Staff note
            <textarea
              value={staffNote}
              onChange={(event) => setStaffNote(event.target.value)}
              rows={3}
              placeholder="Deposit, table preference, contact result, arrival time…"
              className="mt-2 w-full rounded-xl border border-white/12 bg-black/30 p-3 text-white outline-none placeholder:text-white/25 focus:border-amber-200/45"
            />
          </label>

          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={`tel:${reservation.phone}`}
              className="inline-flex min-h-11 items-center rounded-full bg-amber-300 px-5 text-xs font-bold text-black"
            >
              Call guest
            </a>
            <button
              type="button"
              disabled={pending}
              onClick={() => void onUpdate(reservation.status, staffNote)}
              className="min-h-11 rounded-full border border-white/15 px-5 text-xs font-semibold text-white/70 disabled:opacity-40"
            >
              Save note
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 border-t border-white/8 pt-4">
            {ReservationStatusSchema.options.map((status) => (
              <button
                key={status}
                type="button"
                disabled={pending || status === reservation.status}
                onClick={() => void onUpdate(status, staffNote)}
                className={`min-h-10 rounded-full border px-4 text-xs font-semibold disabled:opacity-35 ${statusClass(
                  status,
                )}`}
              >
                Mark {STATUS_LABELS[status].toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  );
}

export function ReservationInboxClient() {
  const [reservations, setReservations] = useState<StoredReservation[]>([]);
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string>();
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState<ReservationStatus | 'active'>('active');

  async function load() {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/admin/reservations', {
        cache: 'no-store',
        credentials: 'same-origin',
      });
      const result = (await response.json()) as {
        reservations?: StoredReservation[];
        error?: string;
      };
      if (!response.ok || !result.reservations) {
        throw new AssetSessionError(
          result.error || 'Could not load reservation requests.',
          response.status,
        );
      }
      setReservations(result.reservations);
      setLocked(false);
    } catch (error) {
      if (error instanceof AssetSessionError && error.status === 401) {
        setLocked(true);
      } else {
        setMessage(
          error instanceof Error
            ? error.message
            : 'Could not load reservation requests.',
        );
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const counts = useMemo(() => {
    const result: Record<ReservationStatus | 'active', number> = {
      active: 0,
      new: 0,
      contacted: 0,
      confirmed: 0,
      waitlist: 0,
      cancelled: 0,
      completed: 0,
    };
    for (const reservation of reservations) {
      result[reservation.status] += 1;
      if (!['cancelled', 'completed'].includes(reservation.status)) {
        result.active += 1;
      }
    }
    return result;
  }, [reservations]);

  const visible = useMemo(
    () =>
      reservations.filter((reservation) =>
        filter === 'active'
          ? !['cancelled', 'completed'].includes(reservation.status)
          : reservation.status === filter,
      ),
    [filter, reservations],
  );

  async function update(
    reservation: StoredReservation,
    status: ReservationStatus,
    staffNote?: string,
  ) {
    setPendingId(reservation.id);
    setMessage('');
    try {
      const response = await fetch('/api/admin/reservations', {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: reservation.id, status, staffNote }),
      });
      const result = (await response.json()) as {
        reservation?: StoredReservation;
        error?: string;
      };
      if (!response.ok || !result.reservation) {
        throw new Error(result.error || 'Could not update the request.');
      }
      setReservations((current) =>
        current.map((item) =>
          item.id === result.reservation?.id ? result.reservation : item,
        ),
      );
      setMessage(`Reservation marked ${STATUS_LABELS[status].toLowerCase()}.`);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Could not update the request.',
      );
    } finally {
      setPendingId(undefined);
    }
  }

  if (locked) return <UnlockInbox onUnlocked={load} />;

  return (
    <div className="space-y-5 pb-32 lg:pb-12">
      <header className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[radial-gradient(circle_at_84%_0%,rgba(16,185,129,.22),transparent_24rem),radial-gradient(circle_at_8%_100%,rgba(225,18,27,.16),transparent_25rem),linear-gradient(135deg,rgba(14,18,16,.98),rgba(25,14,12,.96))] p-5 shadow-[0_28px_90px_rgba(0,0,0,.4)] sm:p-7">
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-2xl">
            <p className="text-[10px] font-semibold uppercase tracking-[.24em] text-emerald-200/68">
              Guest requests
            </p>
            <h1 className="mt-3 font-serif text-4xl text-white sm:text-5xl">
              Reservations Inbox
            </h1>
            <p className="mt-3 text-sm leading-6 text-white/58 sm:text-base">
              Follow up with guests, record outcomes, export the list, and see which promotion produced each request.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href="/api/admin/reservations/export"
              className="inline-flex min-h-11 items-center rounded-full border border-emerald-200/18 bg-emerald-200/[.07] px-5 text-sm font-semibold text-emerald-100"
            >
              Export CSV
            </a>
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="min-h-11 rounded-full border border-white/15 bg-black/18 px-5 text-sm font-semibold text-white/70 disabled:opacity-40"
            >
              {loading ? 'Refreshing…' : 'Refresh requests'}
            </button>
          </div>
        </div>

        <div className="relative mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            ['New', counts.new, 'text-violet-100'],
            ['Contacted', counts.contacted, 'text-sky-100'],
            ['Confirmed', counts.confirmed, 'text-emerald-100'],
            ['Waitlist', counts.waitlist, 'text-amber-100'],
          ].map(([label, value, color]) => (
            <div
              key={String(label)}
              className="rounded-2xl border border-white/9 bg-black/22 p-3"
            >
              <p className="text-[10px] uppercase tracking-[.14em] text-white/38">
                {label}
              </p>
              <p className={`mt-1 text-3xl font-semibold ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      </header>

      {message ? (
        <p
          role="status"
          className="rounded-xl border border-amber-200/15 bg-amber-200/[.07] px-4 py-3 text-sm text-amber-50"
        >
          {message}
        </p>
      ) : null}

      <section className="rounded-[1.35rem] border border-white/10 bg-black/18 p-3">
        <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {(['active', ...ReservationStatusSchema.options] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilter(status)}
              className={`min-h-10 shrink-0 rounded-full border px-4 text-xs font-semibold ${
                filter === status
                  ? 'border-amber-200/25 bg-amber-200/10 text-amber-100'
                  : 'border-white/10 text-white/52'
              }`}
            >
              {status === 'active' ? 'Active' : STATUS_LABELS[status]} ·{' '}
              {counts[status]}
            </button>
          ))}
        </div>
      </section>

      {loading && !reservations.length ? (
        <div className="rounded-2xl border border-white/10 p-5 text-white/55">
          Loading reservation requests…
        </div>
      ) : visible.length ? (
        <section className="grid gap-4">
          {visible.map((reservation) => (
            <ReservationCard
              key={reservation.id}
              reservation={reservation}
              pending={pendingId === reservation.id}
              onUpdate={(status, staffNote) =>
                update(reservation, status, staffNote)
              }
            />
          ))}
        </section>
      ) : (
        <section className="rounded-[1.4rem] border border-dashed border-white/15 p-8 text-center">
          <h2 className="text-xl font-semibold text-white">No requests in this view</h2>
          <p className="mt-2 text-sm text-white/48">
            New website submissions will appear here automatically.
          </p>
        </section>
      )}
    </div>
  );
}
