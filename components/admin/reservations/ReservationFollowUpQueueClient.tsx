'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AssetSessionError } from '@/lib/admin/assets/client-session';
import { ReservationFollowUpCard } from '@/components/admin/reservations/ReservationFollowUpCard';
import { ReservationFollowUpUnlock } from '@/components/admin/reservations/ReservationFollowUpUnlock';
import {
  type ReservationStatus,
  type StoredReservation,
} from '@/lib/reservations/domain';
import {
  filterReservationsForFollowUp,
  RESERVATION_FOLLOW_UP_VIEW_LABELS,
  summarizeReservationFollowUps,
  type ReservationFollowUpView,
} from '@/lib/reservations/follow-up';

const FOLLOW_UP_VIEWS: ReservationFollowUpView[] = [
  'action-needed',
  'needs-reply',
  'follow-up-due',
  'event-near',
  'scheduled',
  'confirmed-upcoming',
  'all-active',
];

export function ReservationFollowUpQueueClient() {
  const [reservations, setReservations] = useState<StoredReservation[]>([]);
  const [view, setView] =
    useState<ReservationFollowUpView>('action-needed');
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string>();
  const [message, setMessage] = useState('');
  const [now, setNow] = useState(() => new Date());

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
          result.error || 'Could not load guest follow-up.',
          response.status,
        );
      }
      setReservations(result.reservations);
      setNow(new Date());
      setLocked(false);
    } catch (error) {
      if (error instanceof AssetSessionError && error.status === 401) {
        setLocked(true);
      } else {
        setMessage(
          error instanceof Error
            ? error.message
            : 'Could not load guest follow-up.',
        );
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const summary = useMemo(
    () => summarizeReservationFollowUps(reservations, now),
    [now, reservations],
  );
  const visible = useMemo(
    () =>
      filterReservationsForFollowUp({
        reservations,
        view,
        now,
      }),
    [now, reservations, view],
  );

  async function update(
    reservation: StoredReservation,
    patch: {
      status?: ReservationStatus;
      followUpAt?: string | null;
    },
    successMessage: string,
  ) {
    setPendingId(reservation.id);
    setMessage('');
    try {
      const response = await fetch('/api/admin/reservations', {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: reservation.id,
          status: patch.status ?? reservation.status,
          followUpAt: patch.followUpAt,
        }),
      });
      const result = (await response.json()) as {
        reservation?: StoredReservation;
        error?: string;
      };
      if (!response.ok || !result.reservation) {
        throw new Error(result.error || 'Could not update guest follow-up.');
      }
      setReservations((current) =>
        current.map((item) =>
          item.id === result.reservation?.id ? result.reservation : item,
        ),
      );
      setNow(new Date());
      setMessage(successMessage);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Could not update guest follow-up.',
      );
    } finally {
      setPendingId(undefined);
    }
  }

  if (locked) return <ReservationFollowUpUnlock onUnlocked={load} />;

  return (
    <div className="space-y-5 pb-32 lg:pb-12">
      <header className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[radial-gradient(circle_at_84%_0%,rgba(14,165,233,.2),transparent_24rem),radial-gradient(circle_at_8%_100%,rgba(225,18,27,.14),transparent_25rem),linear-gradient(135deg,rgba(14,18,16,.98),rgba(25,14,12,.96))] p-5 shadow-[0_28px_90px_rgba(0,0,0,.4)] sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-2xl">
            <p className="text-[10px] font-semibold uppercase tracking-[.24em] text-sky-200/68">
              Guest response queue
            </p>
            <h1 className="mt-3 font-serif text-4xl text-white sm:text-5xl">
              Follow up before requests go cold.
            </h1>
            <p className="mt-3 text-sm leading-6 text-white/58 sm:text-base">
              See which guests need a first reply, which saved reminders are
              due, and which upcoming dates still lack a final decision.
              Messages remain human-reviewed and are never sent automatically.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="min-h-11 rounded-full border border-white/15 bg-black/18 px-5 text-sm font-semibold text-white/70 disabled:opacity-40"
          >
            {loading ? 'Refreshing…' : 'Refresh queue'}
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            ['Action needed', summary.actionNeeded, 'text-red-100'],
            ['Needs first reply', summary.needsReply, 'text-violet-100'],
            ['Reminders due', summary.followUpDue, 'text-amber-100'],
            ['Event near', summary.eventNear, 'text-sky-100'],
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
          {FOLLOW_UP_VIEWS.map((item) => {
            const count = filterReservationsForFollowUp({
              reservations,
              view: item,
              now,
            }).length;
            return (
              <button
                key={item}
                type="button"
                onClick={() => setView(item)}
                className={`min-h-10 shrink-0 rounded-full border px-4 text-xs font-semibold ${
                  view === item
                    ? 'border-amber-200/25 bg-amber-200/10 text-amber-100'
                    : 'border-white/10 text-white/52'
                }`}
              >
                {RESERVATION_FOLLOW_UP_VIEW_LABELS[item]} · {count}
              </button>
            );
          })}
        </div>
      </section>

      {loading && !reservations.length ? (
        <div className="rounded-2xl border border-white/10 p-5 text-white/55">
          Loading guest follow-up…
        </div>
      ) : visible.length ? (
        <section className="grid gap-4">
          {visible.map((reservation) => (
            <ReservationFollowUpCard
              key={reservation.id}
              reservation={reservation}
              now={now}
              pending={pendingId === reservation.id}
              onUpdate={(patch, successMessage) =>
                update(reservation, patch, successMessage)
              }
            />
          ))}
        </section>
      ) : (
        <section className="rounded-[1.4rem] border border-dashed border-white/15 p-8 text-center">
          <h2 className="text-xl font-semibold text-white">
            Nothing needs attention in this view
          </h2>
          <p className="mt-2 text-sm text-white/48">
            Change the filter or open the full request list.
          </p>
          <Link
            href="/admin/reservations"
            className="mt-5 inline-flex min-h-11 items-center rounded-full bg-amber-300 px-5 text-sm font-bold text-black"
          >
            Open all requests
          </Link>
        </section>
      )}
    </div>
  );
}
